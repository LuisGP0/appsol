import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import Anthropic from '@anthropic-ai/sdk';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const client = new Anthropic();

app.disable('x-powered-by');
app.set('trust proxy', 1); // Confiar en Cloudflare/Nginx para req.ip real

function htmlEsc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ─── Log circular en memoria (últimas 200 entradas) ─────────────────────────
const LOG = [];
function addLog(type, data) {
  LOG.unshift({ type, ts: new Date().toISOString(), ...data });
  if (LOG.length > 200) LOG.pop();
}

// ─── Estado del widget ───────────────────────────────────────────────────────
let widgetEnabled = true;

let mailer;
async function getMailer() {
  if (mailer) return mailer;
  if (process.env.SMTP_PASS) {
    mailer = nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   Number(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE !== 'false',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    mailer = nodemailer.createTransport({
      host: 'smtp.ethereal.email', port: 587, secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log('\n📧 Modo test — emails visibles en https://ethereal.email');
    console.log(`   Usuario: ${testAccount.user}\n`);
  }
  return mailer;
}

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : ['*'];

app.use(helmet({
  contentSecurityPolicy: false, // el widget se embebe en webs de terceros
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.includes(origin)) {
      cb(null, true);
    } else {
      console.warn('[cors] origen bloqueado:', origin);
      cb(new Error('CORS no permitido'));
    }
  }
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.static(join(__dirname, 'public')));

const isProd = process.env.NODE_ENV === 'production';

const WHITELIST_IPS = ['217.76.159.227', '213.195.113.201'];

const auditLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isProd ? 20 : 100,
  standardHeaders: true, legacyHeaders: false,
  skip: (req) => WHITELIST_IPS.includes(req.ip),
  message: { error: 'Límite alcanzado. Inténtalo en una hora o contáctanos directamente.' },
});

const leadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isProd ? 20 : 100,
  standardHeaders: true, legacyHeaders: false,
  skip: (req) => WHITELIST_IPS.includes(req.ip),
  message: { error: 'Demasiados envíos. Inténtalo más tarde.' },
});

// ─── Endpoint de auditoría ───────────────────────────────────────────────────
app.post('/api/audit', auditLimiter, async (req, res) => {
  let { url, turnstileToken } = req.body ?? {};
  const clientIp = req.ip ?? 'unknown';

  if (!url?.trim()) {
    console.warn('[audit 400] URL vacía | ip:', clientIp, '| body keys:', Object.keys(req.body ?? {}));
    addLog('error', { ip: clientIp, msg: 'URL vacía' });
    return res.status(400).json({ error: 'URL requerida' });
  }

  if (!url.startsWith('https://')) {
    if (url.startsWith('http://')) {
      url = 'https://' + url.slice(7);
    } else {
      url = 'https://' + url.trim();
    }
  }

  let targetUrl;
  try {
    targetUrl = new URL(url);
  } catch {
    return res.status(400).json({ error: 'URL no válida. Ejemplo: www.tuweb.com' });
  }

  const blocked = [
    'localhost', '127.', '0.0.0.0', '::1',
    '10.', '192.168.',
    '172.16.', '172.17.', '172.18.', '172.19.', '172.20.',
    '172.21.', '172.22.', '172.23.', '172.24.', '172.25.',
    '172.26.', '172.27.', '172.28.', '172.29.', '172.30.', '172.31.',
    '169.254.',       // link-local + AWS EC2 metadata
    '100.64.',        // CGNAT
    'metadata.google.internal',
    'metadata.goog',
  ];
  if (blocked.some(b => targetUrl.hostname.includes(b))) {
    console.warn('[audit 400] hostname bloqueado | ip:', clientIp, '| host:', targetUrl.hostname);
    addLog('error', { ip: clientIp, url: targetUrl.hostname, msg: 'URL bloqueada' });
    return res.status(400).json({ error: 'URL no permitida' });
  }

  // ─── Verificación Turnstile ─────────────────────────────────────────────────
  if (process.env.TURNSTILE_SECRET) {
    if (!turnstileToken) {
      return res.status(403).json({ error: 'Verificación de seguridad requerida. Recarga la página e inténtalo de nuevo.' });
    }
    try {
      const tsRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: process.env.TURNSTILE_SECRET, response: turnstileToken, remoteip: req.ip }),
        signal: AbortSignal.timeout(5000),
      });
      const tsData = await tsRes.json();
      if (!tsData.success) {
        console.warn('[turnstile] fallo:', tsData['error-codes']);
        return res.status(403).json({ error: 'Verificación de seguridad fallida. Recarga la página e inténtalo de nuevo.' });
      }
    } catch (tsErr) {
      console.error('[turnstile error]', tsErr.message);
      return res.status(403).json({ error: 'Error de verificación de seguridad. Inténtalo de nuevo.' });
    }
  }

  try {
    // 1. Obtener HTML de la web
    let html = '';
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 12000);
      const r = await fetch(targetUrl.href, {
        signal: ctrl.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SolpronetAuditBot/1.0; +https://solpronet.cat)',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'es-ES,es;q=0.9,ca;q=0.8',
        },
      });
      clearTimeout(timer);

      if (!r.ok) {
        console.warn('[audit 400] web devolvió error | ip:', clientIp, '| url:', targetUrl.hostname, '| status:', r.status);
        addLog('error', { ip: clientIp, url: targetUrl.hostname, msg: `Web devolvió ${r.status}` });
        return res.status(400).json({ error: `La web devolvió un error ${r.status}. Comprueba que la URL es correcta y está accesible.` });
      }

      const rawHtml = await r.text();
      html = rawHtml.slice(0, 18000);
    } catch (e) {
      console.warn('[audit 400] no se pudo acceder | ip:', clientIp, '| url:', targetUrl.hostname, '| err:', e.message);
      addLog('error', { ip: clientIp, url: targetUrl.hostname, msg: `No accesible: ${e.message}` });
      return res.status(400).json({ error: 'No se pudo acceder a la web. Comprueba que la URL existe y tiene HTTPS.' });
    }

    // 2. PageSpeed Insights (opcional)
    let psSummary = '';
    try {
      const key = process.env.PAGESPEED_API_KEY ? `&key=${process.env.PAGESPEED_API_KEY}` : '';
      const psRes = await fetch(
        `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl.href)}&strategy=mobile${key}`,
        { signal: AbortSignal.timeout(15000) }
      );
      const ps = await psRes.json();

      if (ps.lighthouseResult) {
        const cats = ps.lighthouseResult.categories;
        const audits = ps.lighthouseResult.audits;

        psSummary = `\n\n=== PageSpeed Insights (móvil) ===\n`;
        psSummary += `Performance: ${Math.round((cats.performance?.score ?? 0) * 100)}/100\n`;
        psSummary += `Accesibilidad: ${Math.round((cats.accessibility?.score ?? 0) * 100)}/100\n`;
        psSummary += `Buenas prácticas: ${Math.round((cats['best-practices']?.score ?? 0) * 100)}/100\n`;
        psSummary += `SEO técnico: ${Math.round((cats.seo?.score ?? 0) * 100)}/100\n`;

        const lcp = audits['largest-contentful-paint']?.displayValue;
        const tbt = audits['total-blocking-time']?.displayValue;
        const cls = audits['cumulative-layout-shift']?.displayValue;
        if (lcp) psSummary += `LCP: ${lcp}\n`;
        if (tbt) psSummary += `TBT: ${tbt}\n`;
        if (cls) psSummary += `CLS: ${cls}\n`;

        const opps = Object.values(audits)
          .filter(a => a.details?.type === 'opportunity' && a.score !== null && a.score < 0.9)
          .sort((a, b) => a.score - b.score)
          .slice(0, 5)
          .map(a => `- ${a.title}`);

        if (opps.length) psSummary += `\nMejoras de rendimiento detectadas:\n${opps.join('\n')}\n`;
      }
    } catch {
      // PageSpeed es opcional, continuar sin él
    }

    // 3. Análisis con Claude
    const systemPrompt = `Eres un consultor senior de Solpronet, agencia digital en Cataluña especializada en SEO y diseño web. Tu misión es doble: dar un diagnóstico honesto Y despertar en el empresario la urgencia de actuar.

Aplicas principios de neuromarketing y venta consultiva:
- AVERSIÓN A LA PÉRDIDA: cada problema es algo que el cliente está PERDIENDO HOY MISMO, no algo que "le falta"
- ESPECIFICIDAD = CREDIBILIDAD: datos concretos, números, observaciones directas del HTML. Un dato específico vale más que diez afirmaciones genéricas
- URGENCIA REAL: mientras esta web está así, la competencia está captando exactamente a esos clientes
- CONTRASTE: cómo está ahora vs. cómo podría estar con la mejora

TONO: Consultor de confianza que dice las verdades con respeto. Cercano, directo, profesional. Nunca agresivo ni vendedor de feria. El cliente debe sentir que le ayudas, no que le presionas.

LENGUAJE PERMITIDO: posicionamiento en Google, visibilidad orgánica, palabras clave, búsquedas del sector, imagen de marca, llamada a la acción, experiencia del usuario, velocidad de carga, clientes potenciales, conversión, competencia, primeros resultados, ficha de Google.
PROHIBIDO TOTALMENTE: LCP, CLS, H1, meta tags, canonical, robots.txt, indexación, crawl, Core Web Vitals, DOM, CSS, bounce rate. Si ves estos problemas, tradúcelos al lenguaje de negocio.

═══ ANÁLISIS PRIORITARIO ═══

**1. SEO (máxima prioridad)**
- ¿El título describe el negocio con palabras que un cliente real buscaría en Google? ¿Menciona ciudad o zona?
- ¿El contenido visible habla de servicios concretos con términos que la gente busca, o es texto corporativo genérico?
- ¿Hay presencia local (ciudad, dirección, zona de actuación)?
- ¿Hay secciones diferenciadas por servicio o todo está mezclado en una página genérica?

**2. Diseño web (segunda prioridad)**
- ¿Transmite profesionalidad o parece de otra época?
- ¿El usuario sabe en 5 segundos qué hace la empresa y cómo contactar?
- ¿Hay una llamada a la acción clara y visible?
- ¿Se ve bien en móvil?

**3. Velocidad/rendimiento** (solo si PageSpeed lo indica claramente)

═══ CAMPO "dato" — EL MÁS IMPORTANTE ═══
Para cada problema, incluye UN dato que haga pensar "esto me afecta a mí". Elige el más impactante:
a) Observación directa del HTML: "El título de tu página tiene solo 4 palabras genéricas y no menciona ni tu ciudad ni tu servicio"
b) Estadística de industria: "El 75% de los usuarios nunca pasa de la primera página de Google — si no estás ahí, no existes"
c) Consecuencia cuantificable: "Negocios locales sin presencia en Google Maps pierden de media un 40% de las búsquedas de proximidad de su sector"
d) Contexto competitivo: "En sectores como el tuyo, los 3 primeros resultados de Google se llevan el 75% de todos los clics"
El dato debe ser breve, contundente y 100% relevante para esta web concreta.

═══ CAMPO "impacto" — PÉRDIDA ACTIVA ═══
Enmarca cada problema como algo que se está perdiendo AHORA:
MAL: "Tu web no tiene buena velocidad de carga"
BIEN: "Cada segundo que tarda en cargar tu web espanta al 32% de los visitantes antes de que vean lo que ofreces — estás pagando para traerlos y perdiéndolos en la puerta de entrada"

═══ CAMPO "resultado" EN MEJORAS ═══
Outcomes específicos y creíbles, con timeframe o comparativa:
MAL: "Mejorarás tu posicionamiento en Google"
BIEN: "Negocios similares en tu sector que han trabajado el SEO local con nosotros reciben entre 8 y 20 consultas nuevas al mes desde Google en los primeros 4-6 meses"
BIEN: "Posicionarte para '[servicio] en [ciudad]' significa aparecer ante 300-800 búsquedas mensuales de personas que YA quieren contratar — no hay publicidad más eficiente"

Genera ÚNICAMENTE JSON válido con esta estructura (sin texto adicional ni markdown):
{
  "puntuacion_global": <número 1-10, justo: web funcional mínimo 5>,
  "resumen": "<2-3 frases. Estado actual + la oportunidad principal. Si hay algo bueno, dilo primero.>",
  "potencial": "<Una frase directa y motivadora sobre lo que podría conseguir esta empresa si trabaja bien su web. Ej: 'Con SEO local y un rediseño estratégico, esta web podría convertirse en la principal fuente de nuevos clientes del negocio en menos de 6 meses.'>",
  "problemas": [
    {
      "nivel": "<critico|importante|menor>",
      "titulo": "<Observación concreta y específica de ESTA web, no genérica>",
      "dato": "<Un dato contundente: observación del HTML, estadística de industria o consecuencia cuantificable. Máx. 2 frases.>",
      "impacto": "<El problema como pérdida activa. 2 frases. Con ejemplos concretos de lo que ves en esta web.>"
    }
  ],
  "mejoras": [
    {
      "titulo": "<Acción concreta que haría Solpronet>",
      "beneficio": "<Qué se consigue y por qué importa para este negocio específico>",
      "resultado": "<Outcome concreto con timeframe o comparativa de sector. Que suene real, no a promesa vacía.>",
      "servicio": "<SEO|SEM|Diseño Web|Marketing Digital>"
    }
  ]
}

Reglas:
- Entre 2 y 4 problemas, del más al menos grave
- Entre 2 y 3 mejoras
- Mínimo 2 problemas de SEO o diseño web
- Mínimo 2 mejoras de SEO o Diseño Web
- Cada "dato" debe ser específico de esta web o estadística real — nunca inventado, nunca genérico
- SOLO JSON válido`;

    const userMsg = `Analiza esta web:\nURL: ${targetUrl.href}${psSummary}\n\n=== HTML ===\n${html}`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMsg }],
    });

    const rawText = message.content[0].text;
    let audit;
    try {
      // Claude sometimes wraps JSON in markdown code blocks
      const codeBlock = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = codeBlock ? codeBlock[1].trim() : (rawText.match(/\{[\s\S]*\}/) ?? [rawText])[0];
      audit = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error('[parse error] Claude devolvió:', rawText.slice(0, 300));
      return res.status(500).json({ error: 'Error procesando el análisis. Por favor inténtalo de nuevo.' });
    }

    const tokIn  = message.usage?.input_tokens  ?? 0;
    const tokOut = message.usage?.output_tokens ?? 0;
    // claude-sonnet-4-6: $3/MTok input, $15/MTok output
    const costUsd = (tokIn * 3 + tokOut * 15) / 1_000_000;
    addLog('audit', { ip: clientIp, url: targetUrl.hostname, puntuacion: audit.puntuacion_global, tokIn, tokOut, costUsd });
    return res.json({ success: true, audit, url: targetUrl.href });

  } catch (err) {
    console.error('[audit error]', err.message, err.status ?? '', err.error ?? '');
    addLog('error', { ip: clientIp, url: url ?? '?', msg: err.message });
    return res.status(500).json({ error: 'Error realizando el análisis. Inténtalo de nuevo.' });
  }
});

// ─── Endpoint de captura de lead ────────────────────────────────────────────
app.post('/api/lead', leadLimiter, async (req, res) => {
  const { nombre, email, telefono, url_auditada, puntuacion, problemas_detectados, necesidades, kit_digital, fuente } = req.body ?? {};

  if (!nombre?.trim() || !email?.trim()) {
    return res.status(400).json({ error: 'Nombre y email son obligatorios' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email no válido' });
  }

  const fecha = new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });

  console.log('\n🎯 NUEVO LEAD:', nombre, '|', url_auditada);
  addLog('lead', { nombre, url: url_auditada || '—', puntuacion, ip: req.ip });

  const sNombre    = htmlEsc(nombre);
  const sEmail     = htmlEsc(email);
  const sTelefono  = htmlEsc(telefono || '—');
  const sUrl       = htmlEsc(url_auditada || '—');
  const sFuente    = htmlEsc(fuente || '');
  const sProblemas = htmlEsc(problemas_detectados || '');
  const sNecesid   = htmlEsc(necesidades || '');
  const sKit       = htmlEsc(kit_digital || '');
  const safeUrlHref = /^https?:\/\//i.test(url_auditada || '') ? htmlEsc(url_auditada) : '#';
  const puntuacionColor = puntuacion >= 7 ? '#22c55e' : puntuacion >= 5 ? '#f59e0b' : '#ef4444';

  try {
    const transport = await getMailer();
    const info = await transport.sendMail({
      from: `"Auditor Web Solpronet" <${process.env.SMTP_USER || 'noreply@solpronet.cat'}>`,
      to:   process.env.LEAD_EMAIL,
      replyTo: email,
      subject: `🎯 Nuevo lead: ${nombre} — ${url_auditada || 'web no indicada'}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
          <div style="background:linear-gradient(135deg,#1e3a8a,#2563eb);padding:24px;border-radius:12px 12px 0 0;">
            <h1 style="color:#fff;margin:0;font-size:20px;">🎯 Nuevo lead desde el widget</h1>
            <p style="color:rgba(255,255,255,.8);margin:4px 0 0;font-size:13px;">${htmlEsc(fecha)}${sFuente ? ` · ${sFuente}` : ''}</p>
          </div>
          <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 12px 12px;background:#fff;">

            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr>
                <td style="padding:8px 0;color:#64748b;width:120px;">Nombre</td>
                <td style="padding:8px 0;font-weight:600;color:#1e293b;">${sNombre}</td>
              </tr>
              <tr style="border-top:1px solid #f1f5f9;">
                <td style="padding:8px 0;color:#64748b;">Email</td>
                <td style="padding:8px 0;"><a href="mailto:${sEmail}" style="color:#2563eb;">${sEmail}</a></td>
              </tr>
              <tr style="border-top:1px solid #f1f5f9;">
                <td style="padding:8px 0;color:#64748b;">Teléfono</td>
                <td style="padding:8px 0;color:#1e293b;">${sTelefono}</td>
              </tr>
              <tr style="border-top:1px solid #f1f5f9;">
                <td style="padding:8px 0;color:#64748b;">Web auditada</td>
                <td style="padding:8px 0;"><a href="${safeUrlHref}" style="color:#2563eb;" target="_blank" rel="noopener noreferrer">${sUrl}</a></td>
              </tr>
              <tr style="border-top:1px solid #f1f5f9;">
                <td style="padding:8px 0;color:#64748b;">Puntuación</td>
                <td style="padding:8px 0;font-weight:700;color:${puntuacionColor};">${htmlEsc(String(puntuacion ?? '?'))}/10</td>
              </tr>
              ${sProblemas ? `
              <tr style="border-top:1px solid #f1f5f9;">
                <td style="padding:8px 0;color:#64748b;vertical-align:top;">Problemas</td>
                <td style="padding:8px 0;color:#1e293b;">${sProblemas}</td>
              </tr>` : ''}
              ${sNecesid ? `
              <tr style="border-top:1px solid #f1f5f9;">
                <td style="padding:8px 0;color:#64748b;vertical-align:top;">Necesidades</td>
                <td style="padding:8px 0;color:#1e293b;">${sNecesid}</td>
              </tr>` : ''}
              ${sKit ? `
              <tr style="border-top:1px solid #f1f5f9;">
                <td style="padding:8px 0;color:#64748b;">Kit Digital</td>
                <td style="padding:8px 0;font-weight:600;color:${sKit.startsWith('Sí') ? '#16a34a' : '#64748b'};">${sKit}</td>
              </tr>` : ''}
            </table>

            <div style="margin-top:20px;">
              <a href="mailto:${sEmail}"
                style="background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block;">
                Responder a ${sNombre}
              </a>
            </div>
          </div>
        </div>
      `,
    });
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) console.log(`\n📧 Ver email de prueba: ${preview}\n`);
  } catch (err) {
    console.error('[email error]', err.message);
    return res.json({ success: true });
  }

  return res.json({ success: true });
});

if (!isProd) {
  app.get('/api/test-smtp', async (req, res) => {
    const vars = {
      SMTP_HOST: process.env.SMTP_HOST || '(vacío)',
      SMTP_PORT: process.env.SMTP_PORT || '(vacío)',
      SMTP_SECURE: process.env.SMTP_SECURE || '(vacío)',
      SMTP_USER: process.env.SMTP_USER || '(vacío)',
      SMTP_PASS: process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-3) : '(vacío)',
    };
    try {
      const transport = await getMailer();
      await transport.verify();
      res.json({ ok: true, vars });
    } catch (err) {
      res.json({ ok: false, error: err.message, vars });
    }
  });
}

// ─── Panel de administración — API JSON ──────────────────────────────────────
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

app.get('/api/widget-status', (req, res) => {
  res.json({ enabled: widgetEnabled });
});

app.post('/api/admin-toggle', (req, res) => {
  if (ADMIN_TOKEN && req.query.token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  widgetEnabled = req.body.enabled ?? !widgetEnabled;
  console.log('[admin] widget', widgetEnabled ? 'ACTIVADO' : 'DESACTIVADO');
  addLog('sistema', { msg: widgetEnabled ? 'Widget activado' : 'Widget desactivado' });
  res.json({ enabled: widgetEnabled });
});

app.get('/api/admin-data', (req, res) => {
  if (ADMIN_TOKEN && req.query.token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Token incorrecto' });
  }
  res.json({ ok: true, log: LOG, widgetEnabled });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n✅ Solpronet Audit API corriendo en http://localhost:${PORT}`);
  console.log(`   Widget demo: http://localhost:${PORT}/demo.html`);
  console.log(`   Admin panel: http://localhost:${PORT}/admin.html${ADMIN_TOKEN ? ' (token configurado ✓)' : ' ⚠ configura ADMIN_TOKEN en .env'}`);
  console.log('');
});
