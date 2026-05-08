/* Solpronet Audit Widget v2 — Lead-magnet + Conversión
 * Embed: <script src="/widget-v2.js" data-api="https://tu-servidor.com"></script>
 */
(function () {
  'use strict';

  const scriptTag = document.currentScript;
  const API_BASE  = (scriptTag && scriptTag.getAttribute('data-api')) || '';

  const ICON = {
    chat: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="white" stroke-width="2" stroke-linejoin="round"/></svg>`,
    close:`<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>`,
    send: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`,
    bot:  `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="6" y="11" width="12" height="9" rx="2.5" stroke="white" stroke-width="1.9"/><rect x="9" y="6" width="6" height="6" rx="1.5" stroke="white" stroke-width="1.9"/><circle cx="10.5" cy="16" r="1.1" fill="white"/><circle cx="13.5" cy="16" r="1.1" fill="white"/><path d="M12 6V4" stroke="white" stroke-width="1.9" stroke-linecap="round"/><path d="M6 14.5H4M20 14.5H18" stroke="white" stroke-width="1.9" stroke-linecap="round"/></svg>`,
    check:`<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><polyline points="20 6 9 17 4 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    dot:  `<svg viewBox="0 0 8 8" aria-hidden="true"><circle cx="4" cy="4" r="4" fill="#4ade80"/></svg>`,
  };

  const CSS = `
    #s2-root *, #s2-root *::before, #s2-root *::after {
      box-sizing: border-box;
      margin: 0;
    }
    #s2-root {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      -webkit-font-smoothing: antialiased;
      --c-blue:   #1d4ed8;
      --c-bubble: #2563eb;
      --c-green:  #16a34a;
      --c-text:   #111827;
      --c-muted:  #6b7280;
      --c-faint:  #9ca3af;
      --c-border: #e5e7eb;
      --c-recv:   #f4f4f4;
      --c-bg:     #ffffff;
    }

    /* ── Trigger ── */
    #s2-trigger {
      position: fixed; bottom: 24px; right: 24px;
      display: flex; align-items: center; gap: 12px;
      z-index: 2147483640;
    }
    #s2-label {
      background: #fff; padding: 15px 20px; border-radius: 100px;
      font-size: 18px; font-weight: 600; color: #111827;
      box-shadow: 0 4px 20px rgba(0,0,0,.15), 0 1px 4px rgba(0,0,0,.07);
      white-space: nowrap; cursor: pointer; user-select: none;
      animation: s2LabelIn 0.45s 2s ease both;
      transition: box-shadow .18s, transform .15s;
    }
    #s2-label:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(0,0,0,.18); }
    #s2-label.s2-hidden { display: none; }
    @keyframes s2LabelIn {
      from { opacity: 0; transform: translateX(12px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    #s2-btn {
      position: relative; width: 60px; height: 60px; border-radius: 50%;
      background: var(--c-bubble); border: none; cursor: pointer;
      box-shadow: 0 4px 20px rgba(37,99,235,.4);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      animation: s2Pulse 3s ease-in-out infinite; will-change: transform;
    }
    #s2-btn svg { width: 26px; height: 26px; position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); transition: opacity .22s; }
    #s2-btn .s2-ic-chat  { opacity: 1; }
    #s2-btn .s2-ic-close { opacity: 0; }
    #s2-btn.s2-open .s2-ic-chat  { opacity: 0; }
    #s2-btn.s2-open .s2-ic-close { opacity: 1; }
    #s2-btn.s2-open { animation: none; }
    #s2-btn:focus-visible { outline: 3px solid var(--c-bubble); outline-offset: 3px; }
    @keyframes s2Pulse {
      0%,100% { box-shadow: 0 4px 20px rgba(37,99,235,.4); }
      50%      { box-shadow: 0 4px 20px rgba(37,99,235,.55), 0 0 0 10px rgba(37,99,235,.07); }
    }

    /* ── Chat window ── */
    #s2-chat {
      position: fixed; bottom: 94px; right: 24px;
      width: 530px; max-width: calc(100vw - 32px);
      height: 700px; max-height: calc(100dvh - 110px);
      background: var(--c-bg); border-radius: 20px;
      box-shadow: 0 12px 48px rgba(0,0,0,.16), 0 2px 8px rgba(0,0,0,.06);
      z-index: 2147483639;
      display: flex; flex-direction: column; overflow: hidden;
      visibility: hidden; will-change: transform, opacity;
    }

    /* ── Header ── */
    .s2-header {
      background: var(--c-bg); padding: 15px 18px;
      display: flex; align-items: center; gap: 12px;
      flex-shrink: 0; border-bottom: 1px solid var(--c-border);
    }
    .s2-h-avatar {
      width: 40px; height: 40px; border-radius: 50%; background: var(--c-bubble);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(37,99,235,.3);
    }
    .s2-h-avatar svg { width: 19px; height: 19px; }
    .s2-h-name { font-weight: 700; font-size: 15px; color: var(--c-text); letter-spacing: -.2px; }
    .s2-h-sub  {
      font-size: 12px; color: var(--c-muted);
      display: flex; align-items: center; gap: 5px; margin-top: 2px;
    }
    .s2-h-sub svg { width: 7px; height: 7px; }

    /* ── Messages ── */
    .s2-msgs {
      flex: 1; overflow-y: auto; padding: 20px 18px;
      display: flex; flex-direction: column; gap: 14px;
      scroll-behavior: smooth; background: var(--c-bg);
    }
    .s2-msgs::-webkit-scrollbar { width: 0; }

    .s2-row { display: flex; gap: 9px; align-items: flex-end; visibility: visible; }
    .s2-row.bot  { align-self: flex-start; max-width: 92%; }
    .s2-row.user { align-self: flex-end;   max-width: 78%; flex-direction: row-reverse; }

    .s2-avatar {
      width: 28px; height: 28px; min-width: 28px; border-radius: 50%;
      background: var(--c-bubble);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .s2-avatar svg { width: 14px; height: 14px; }

    .s2-bubble {
      padding: 11px 15px; border-radius: 18px;
      font-size: 15px; font-weight: 500; line-height: 1.55; color: #111;
      word-break: break-word;
    }
    .s2-row.bot  .s2-bubble { background: var(--c-recv); border-bottom-left-radius: 4px; }
    .s2-row.user .s2-bubble { background: var(--c-bubble); color: #fff; border-bottom-right-radius: 4px; }

    /* Typing */
    .s2-typing {
      display: flex; gap: 5px; padding: 14px 18px;
      background: var(--c-recv); border-radius: 18px; border-bottom-left-radius: 4px;
    }
    .s2-tdot {
      width: 7px; height: 7px; border-radius: 50%;
      background: var(--c-faint); animation: s2Bounce 1.3s infinite;
    }
    .s2-tdot:nth-child(2) { animation-delay: .18s; }
    .s2-tdot:nth-child(3) { animation-delay: .36s; }
    @keyframes s2Bounce {
      0%,60%,100% { transform: translateY(0); }
      30%          { transform: translateY(-7px); }
    }

    /* Progress */
    .s2-progress {
      background: var(--c-recv); border-radius: 18px; border-bottom-left-radius: 4px;
      padding: 15px 17px; display: flex; flex-direction: column; gap: 9px; min-width: 210px;
    }
    .s2-prog-label { font-size: 14px; font-weight: 600; color: var(--c-text); }
    .s2-prog-text  { font-size: 12.5px; color: var(--c-muted); }
    .s2-prog-track { height: 4px; background: var(--c-border); border-radius: 4px; overflow: hidden; }
    .s2-prog-fill  { height: 100%; width: 8%; border-radius: 4px; background: var(--c-bubble); will-change: width; }

    /* ── Score card ── */
    .s2-score {
      background: var(--c-recv); border-radius: 18px; border-bottom-left-radius: 4px;
      padding: 18px 20px; display: flex; align-items: center; gap: 16px; min-width: 260px;
    }
    .s2-score-left {
      display: flex; flex-direction: column; align-items: center;
      flex-shrink: 0; min-width: 64px;
      padding-right: 16px; border-right: 2px solid var(--c-border);
    }
    .s2-score-num {
      font-size: 54px; font-weight: 800; line-height: 1; letter-spacing: -2px;
      display: block;
    }
    .s2-score-denom {
      font-size: 12px; font-weight: 600; color: var(--c-faint);
      letter-spacing: .5px; text-transform: uppercase; margin-top: 3px;
    }
    .s2-score-text {
      font-size: 15px; color: var(--c-text); line-height: 1.55; font-weight: 500;
    }

    /* ── Problem cards — solo título + dato ── */
    .s2-card {
      background: var(--c-bg); border: 1px solid var(--c-border);
      border-radius: 16px; overflow: hidden; width: 430px;
      box-shadow: 0 2px 10px rgba(0,0,0,.06);
    }
    .s2-card-hd {
      padding: 13px 15px; display: flex; align-items: center; gap: 11px;
      border-bottom: 1px solid var(--c-border);
    }
    .s2-card-hd.red   { background: #fbdddd; }
    .s2-card-hd.green { background: #f0fdf4; }
    .s2-card-hd-icon {
      width: 34px; height: 34px; min-width: 34px; border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
    }
    .s2-card-hd.red   .s2-card-hd-icon { background: rgba(220,38,38,.8); }
    .s2-card-hd.green .s2-card-hd-icon { background: #16a34a; }
    .s2-card-hd-icon svg { width: 17px; height: 17px; stroke: #fff; }
    .s2-card-hd-title { font-weight: 700; font-size: 14px; color: var(--c-text); }
    .s2-card-hd-sub   { font-size: 11.5px; color: var(--c-muted); margin-top: 2px; }

    .s2-prob {
      display: flex; gap: 11px; align-items: flex-start;
      padding: 14px 16px; border-bottom: 1px solid #f3f4f6;
    }
    .s2-prob:last-child { border-bottom: none; }
    .s2-prob-badge {
      width: 26px; height: 26px; min-width: 26px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center; margin-top: 1px;
    }
    .s2-prob.critico    .s2-prob-badge { background: #fef2f2; color: #ef4444; }
    .s2-prob.importante .s2-prob-badge { background: #fff7ed; color: #f97316; }
    .s2-prob.menor      .s2-prob-badge { background: #eff6ff; color: #3b82f6; }
    .s2-prob-badge svg { width: 16px; height: 16px; }

    .s2-prob-title { font-weight: 700; font-size: 16px; color: var(--c-text); line-height: 1.35; }

    .s2-prob-dato {
      font-size: 15px; font-style: italic; line-height: 1.55;
      padding: 9px 13px; border-radius: 0 8px 8px 0;
      border-left: 3px solid;
    }
    .s2-prob.critico    .s2-prob-dato { color: #991b1b; background: #fef2f2; border-color: #ef4444; }
    .s2-prob.importante .s2-prob-dato { color: #92400e; background: #fffbeb; border-color: #f59e0b; }
    .s2-prob.menor      .s2-prob-dato { color: #1e40af; background: #eff6ff; border-color: #2563eb; }

    /* ── Mejoras — solo título + tag ── */
    .s2-mejora {
      display: flex; align-items: center; gap: 12px;
      padding: 13px 16px; border-bottom: 1px solid #f3f4f6;
    }
    .s2-mejora:last-child { border-bottom: none; }
    .s2-mejora-check {
      width: 26px; height: 26px; min-width: 26px; border-radius: 50%;
      background: #f0fdf4; color: #16a34a;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .s2-mejora-check svg { width: 14px; height: 14px; }
    .s2-mejora-title { font-weight: 600; font-size: 15px; color: var(--c-text); flex: 1; }
    .s2-tag {
      font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 6px;
      letter-spacing: .4px; text-transform: uppercase; white-space: nowrap; flex-shrink: 0;
    }

    /* ── Potencial strip ── */
    .s2-potencial {
      background: linear-gradient(135deg, #1e3a8a, #2563eb);
      color: #fff; border-radius: 14px; padding: 13px 16px;
      font-size: 14px; line-height: 1.55; font-weight: 500; max-width: 380px;
    }

    /* ── Action buttons ── */
    .s2-actions { display: flex; flex-wrap: wrap; gap: 8px; }
    .s2-act-btn {
      background: var(--c-bg); border: 1.5px solid var(--c-border); color: var(--c-text);
      border-radius: 24px; padding: 10px 18px; font-size: 14px; font-weight: 500;
      cursor: pointer; font-family: inherit; white-space: nowrap;
      transition: background .15s, border-color .15s, color .15s;
      min-height: 44px; display: flex; align-items: center;
    }
    .s2-act-btn:hover { background: var(--c-text); border-color: var(--c-text); color: #fff; }
    .s2-act-btn.primary {
      background: var(--c-bubble); border-color: var(--c-bubble); color: #fff; font-weight: 700;
    }
    .s2-act-btn.primary:hover { filter: brightness(1.1); background: var(--c-bubble); border-color: var(--c-bubble); color: #fff; }

    /* ── Forms ── */
    .s2-form {
      display: flex; flex-direction: column; gap: 10px; width: 340px;
      background: var(--c-bg); border: 1px solid var(--c-border);
      border-radius: 16px; padding: 16px 16px 14px;
      box-shadow: 0 2px 10px rgba(0,0,0,.06);
    }
    .s2-final-form { width: 380px; }
    .s2-field { display: flex; flex-direction: column; gap: 5px; }
    .s2-flabel { font-size: 11px; font-weight: 700; color: var(--c-muted); text-transform: uppercase; letter-spacing: .6px; line-height: 1.4; }
    .s2-finput {
      border: 1.5px solid transparent; border-radius: 12px;
      padding: 12px 15px; font-size: 15px; outline: none;
      color: var(--c-text); font-family: inherit; background: var(--c-recv);
      transition: border-color .18s, box-shadow .18s; min-height: 48px;
    }
    .s2-finput:focus { background: #fff; border-color: var(--c-bubble); box-shadow: 0 0 0 3px rgba(37,99,235,.1); }
    .s2-finput::placeholder { color: var(--c-faint); }
    .s2-submit {
      background: var(--c-bubble); color: #fff; border: none; border-radius: 12px;
      padding: 14px; font-size: 15px; font-weight: 700;
      cursor: pointer; font-family: inherit; margin-top: 2px; min-height: 50px;
      transition: filter .15s, transform .12s;
    }
    .s2-submit:hover   { filter: brightness(1.08); transform: translateY(-1px); }
    .s2-submit:active  { transform: translateY(0); }
    .s2-submit:disabled { opacity: .5; cursor: not-allowed; transform: none; filter: none; }
    .s2-privacy { font-size: 11px; color: var(--c-faint); text-align: center; line-height: 1.5; margin-top: 2px; }
    .s2-privacy a { color: var(--c-bubble); text-decoration: none; }

    /* ── Pills (needs + kit digital) ── */
    .s2-pills { display: flex; flex-wrap: wrap; gap: 7px; }
    .s2-pill {
      border: 1.5px solid var(--c-border); background: var(--c-bg);
      border-radius: 24px; padding: 7px 13px; font-size: 13px; font-weight: 500;
      color: var(--c-text); cursor: pointer; font-family: inherit;
      transition: background .15s, border-color .15s, color .15s; white-space: nowrap;
    }
    .s2-pill:hover { border-color: var(--c-bubble); color: var(--c-bubble); }
    .s2-pill.active { background: var(--c-bubble); border-color: var(--c-bubble); color: #fff; }

    /* Kit Digital highlight */
    .s2-kit-note {
      font-size: 11.5px; color: #1d4ed8; font-weight: 600;
      background: #eff6ff; border-radius: 8px; padding: 6px 10px; line-height: 1.4;
    }

    /* ── Thanks ── */
    .s2-thanks {
      background: var(--c-recv); border-radius: 18px; border-bottom-left-radius: 4px;
      padding: 22px 20px; text-align: center;
      display: flex; flex-direction: column; align-items: center; gap: 10px; width: 260px;
    }
    .s2-thanks-icon { width: 52px; height: 52px; border-radius: 50%; background: var(--c-bubble); display: flex; align-items: center; justify-content: center; }
    .s2-thanks-icon svg { width: 26px; height: 26px; }
    .s2-thanks-title { font-size: 16px; font-weight: 700; color: var(--c-text); }
    .s2-thanks-text  { font-size: 13.5px; color: var(--c-muted); line-height: 1.6; }

    /* ── Input area ── */
    .s2-input-area {
      padding: 13px 15px; border-top: 1px solid var(--c-border);
      display: flex; gap: 10px; align-items: center;
      flex-shrink: 0; background: var(--c-bg);
    }
    #s2-input {
      flex: 1; border: none; border-radius: 24px;
      padding: 12px 18px; font-size: 15px; outline: none;
      color: var(--c-text); font-family: inherit; background: var(--c-recv);
      transition: box-shadow .18s; min-width: 0; height: 46px; line-height: 1;
    }
    #s2-input:focus { box-shadow: 0 0 0 2px var(--c-bubble); }
    #s2-input::placeholder { color: var(--c-faint); }
    #s2-input:disabled { opacity: .55; cursor: not-allowed; }
    #s2-send {
      position: relative; width: 46px; height: 46px; min-width: 46px; flex-shrink: 0;
      border-radius: 50%; background: var(--c-bubble); border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center; transition: filter .15s;
    }
    #s2-send svg { width: 17px; height: 17px; display: block; }
    #s2-send:hover    { filter: brightness(1.1); }
    #s2-send:disabled { opacity: .35; cursor: not-allowed; filter: none; }

    @media (max-width: 479px) {
      #s2-chat    { bottom:0; right:0; width:100vw; max-width:100vw; height:100dvh; max-height:100dvh; border-radius:0; }
      #s2-trigger { bottom:16px; right:16px; }
      #s2-label   { font-size:13px; padding:9px 14px; }
      .s2-card    { width: calc(100vw - 80px); }
      .s2-form, .s2-final-form { width: 100%; max-width: 340px; }
    }
  `;

  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  // ─── Markup ─────────────────────────────────────────────────────────────────
  const root = document.createElement('div');
  root.id = 's2-root';
  root.innerHTML = `
    <div id="s2-trigger">
      <div id="s2-label">Audita tu web gratis en 1 min</div>
      <button id="s2-btn" aria-label="Auditoría web gratuita · Solpronet">
        <span class="s2-ic-chat">${ICON.chat}</span>
        <span class="s2-ic-close">${ICON.close}</span>
      </button>
    </div>

    <div id="s2-chat" role="dialog" aria-modal="true" aria-label="Auditoría web gratuita de Solpronet">
      <div class="s2-header">
        <div class="s2-h-avatar">${ICON.bot}</div>
        <div>
          <div class="s2-h-name">Solpronet</div>
          <div class="s2-h-sub">${ICON.dot} Auditoría web gratuita</div>
        </div>
      </div>
      <div class="s2-msgs" id="s2-msgs" role="log" aria-live="polite"></div>
      <div class="s2-input-area">
        <input id="s2-input" type="text" placeholder="Abre el chat para comenzar…"
          autocomplete="off" autocorrect="off" spellcheck="false"
          disabled aria-label="Escribe la URL de tu web" />
        <button id="s2-send" disabled aria-label="Enviar">${ICON.send}</button>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  // ─── GSAP ──────────────────────────────────────────────────────────────────
  function loadGSAP(cb) {
    if (window.gsap) return cb();
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js';
    s.onload = cb;
    s.onerror = () => { window.gsap = null; cb(); };
    document.head.appendChild(s);
  }

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let gsapReady = false;

  function animIn(el, opts = {}) {
    if (!gsapReady || !window.gsap || prefersReduced) { el.style.visibility = 'visible'; return; }
    gsap.fromTo(el,
      { autoAlpha: 0, y: opts.y ?? 8 },
      { autoAlpha: 1, y: 0, duration: opts.d ?? 0.26, ease: 'power2.out', delay: opts.delay ?? 0 }
    );
  }

  function animCard(el) {
    if (!gsapReady || !window.gsap || prefersReduced) { el.style.visibility = 'visible'; return; }
    gsap.fromTo(el,
      { autoAlpha: 0, y: 16, scale: 0.97 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.38, ease: 'back.out(1.4)' }
    );
  }

  function openChat() {
    const el = document.getElementById('s2-chat');
    if (!gsapReady || !window.gsap || prefersReduced) { el.style.visibility = 'visible'; el.style.opacity = '1'; return; }
    gsap.fromTo(el,
      { autoAlpha: 0, scale: 0.88, y: 16, transformOrigin: 'bottom right' },
      { autoAlpha: 1, scale: 1, y: 0, duration: 0.38, ease: 'back.out(1.6)' }
    );
  }

  function closeChat() {
    const el = document.getElementById('s2-chat');
    if (!gsapReady || !window.gsap || prefersReduced) { el.style.visibility = 'hidden'; el.style.opacity = '0'; return; }
    gsap.to(el, { autoAlpha: 0, scale: 0.93, y: 8, duration: 0.2, ease: 'power3.in', transformOrigin: 'bottom right' });
  }

  // ─── Estado ─────────────────────────────────────────────────────────────────
  const state = {
    open: false, ready: false, analyzing: false,
    step: 'intro', url: '', audit: null,
    leadData: { nombre: '', email: '' },
  };

  const msgs    = document.getElementById('s2-msgs');
  const input   = document.getElementById('s2-input');
  const send    = document.getElementById('s2-send');
  const btn     = document.getElementById('s2-btn');
  const labelEl = document.getElementById('s2-label');

  function esc(s) {
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function scrollBottom() { msgs.scrollTop = msgs.scrollHeight; }
  function setInput(enabled, ph) {
    input.disabled = !enabled; send.disabled = !enabled;
    if (ph) input.placeholder = ph;
    if (enabled) setTimeout(() => input.focus(), 100);
  }
  function scoreColor(n) { return n >= 8 ? '#16a34a' : n >= 5 ? '#f59e0b' : '#ef4444'; }

  function botMsg(html) {
    const row = document.createElement('div');
    row.className = 's2-row bot'; row.style.visibility = 'hidden';
    row.innerHTML = `<div class="s2-avatar">${ICON.bot}</div><div class="s2-bubble">${html}</div>`;
    msgs.appendChild(row); scrollBottom();
    requestAnimationFrame(() => animIn(row));
    return row;
  }

  function userMsg(text) {
    const row = document.createElement('div');
    row.className = 's2-row user'; row.style.visibility = 'hidden';
    row.innerHTML = `<div class="s2-bubble">${esc(text)}</div>`;
    msgs.appendChild(row); scrollBottom();
    requestAnimationFrame(() => animIn(row, { y: 5 }));
  }

  function botCard(el) {
    const row = document.createElement('div');
    row.className = 's2-row bot'; row.style.visibility = 'hidden';
    row.innerHTML = `<div class="s2-avatar">${ICON.bot}</div>`;
    row.appendChild(el); msgs.appendChild(row); scrollBottom();
    requestAnimationFrame(() => animCard(row));
    return row;
  }

  function showTyping() {
    const row = document.createElement('div');
    row.className = 's2-row bot'; row.id = 's2-typing';
    row.innerHTML = `<div class="s2-avatar">${ICON.bot}</div>
      <div class="s2-typing"><div class="s2-tdot"></div><div class="s2-tdot"></div><div class="s2-tdot"></div></div>`;
    msgs.appendChild(row); scrollBottom();
  }
  function hideTyping() { document.getElementById('s2-typing')?.remove(); }

  // ─── Score card ─────────────────────────────────────────────────────────────
  function renderScore(puntuacion, resumen) {
    const color = scoreColor(puntuacion);
    const div = document.createElement('div');
    div.className = 's2-score';
    div.innerHTML = `
      <div class="s2-score-left">
        <span class="s2-score-num" style="color:${color};">${puntuacion}</span>
        <span class="s2-score-denom">de 10</span>
      </div>
      <div class="s2-score-text">${esc(resumen)}</div>`;
    return div;
  }

  // ─── Problemas ──────────────────────────────────────────────────────────────
  function renderProblems(problemas) {
    const iconMap = {
      critico:   `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="16" r="1" fill="currentColor"/></svg>`,
      importante:`<svg viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>`,
      menor:     `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    };

    const rows = (problemas || []).map(p => `
      <div class="s2-prob ${esc(p.nivel)}">
        <div class="s2-prob-badge">${iconMap[p.nivel] || iconMap.menor}</div>
        <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:14px;">
          <div class="s2-prob-title">${esc(p.titulo)}</div>
          ${p.dato ? `<div class="s2-prob-dato">${esc(p.dato)}</div>` : ''}
        </div>
      </div>`).join('');

    const warnIcon = `<svg viewBox="0 0 24 24" fill="none" style="width:17px;height:17px;"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="white" stroke-width="2" stroke-linejoin="round"/><line x1="12" y1="9" x2="12" y2="13" stroke="white" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17" r="1" fill="white"/></svg>`;

    const card = document.createElement('div');
    card.className = 's2-card';
    card.innerHTML = `
      <div class="s2-card-hd red">
        <div class="s2-card-hd-icon">${warnIcon}</div>
        <div>
          <div class="s2-card-hd-title">Puntos a mejorar</div>
          <div class="s2-card-hd-sub">De mayor a menor importancia</div>
        </div>
      </div>
      ${rows}`;
    return card;
  }

  // ─── Mejoras ────────────────────────────────────────────────────────────────
  function renderMejoras(mejoras) {
    const tagColor = {
      'SEO':              { bg: '#dcfce7', color: '#166534' },
      'SEM':              { bg: '#fef9c3', color: '#854d0e' },
      'Diseño Web':       { bg: '#ede9fe', color: '#5b21b6' },
      'Marketing Digital':{ bg: '#dbeafe', color: '#1e40af' },
    };

    const rows = (mejoras || []).map(m => {
      const t = tagColor[m.servicio] || { bg: '#dbeafe', color: '#1e40af' };
      return `
        <div class="s2-mejora">
          <div class="s2-mejora-check">${ICON.check}</div>
          <div class="s2-mejora-title">${esc(m.titulo)}</div>
          <span class="s2-tag" style="background:${t.bg};color:${t.color};">${esc(m.servicio)}</span>
        </div>`;
    }).join('');

    const starIcon = `<svg viewBox="0 0 24 24" fill="none" style="width:17px;height:17px;"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" stroke="white" stroke-width="2" stroke-linejoin="round"/></svg>`;

    const card = document.createElement('div');
    card.className = 's2-card';
    card.innerHTML = `
      <div class="s2-card-hd green">
        <div class="s2-card-hd-icon">${starIcon}</div>
        <div>
          <div class="s2-card-hd-title">Nuestro plan de acción</div>
          <div class="s2-card-hd-sub">Lo que haríamos si trabajamos juntos</div>
        </div>
      </div>
      ${rows}
      <div style="padding:13px 16px;background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-top:1px solid #bbf7d0;display:flex;gap:10px;align-items:flex-start;">
        <span style="font-size:18px;line-height:1;">&#128640;</span>
        <div style="font-size:13px;font-weight:600;color:#14532d;line-height:1.5;">
          Todo esto con seguimiento mensual de resultados —<br>para que veas crecer tu negocio mes a mes.
        </div>
      </div>`;
    return card;
  }

  // ─── Formulario de introducción (nombre + email) ─────────────────────────────
  function showIntroForm() {
    const form = document.createElement('div');
    form.className = 's2-form';
    form.innerHTML = `
      <div class="s2-field">
        <label class="s2-flabel" for="s2-iname">Nombre *</label>
        <input class="s2-finput" id="s2-iname" type="text" placeholder="Tu nombre" autocomplete="name" />
      </div>
      <div class="s2-field">
        <label class="s2-flabel" for="s2-iemail">Email *</label>
        <input class="s2-finput" id="s2-iemail" type="email" placeholder="tu@empresa.com" autocomplete="email" />
      </div>
      <button class="s2-submit" id="s2-isubmit">Ver mi auditoría gratuita</button>
      <p class="s2-privacy">Sin spam. Tus datos están seguros.</p>`;
    botCard(form);
    setInput(false, 'Rellena el formulario para empezar…');
    setTimeout(() => document.getElementById('s2-iname')?.focus(), 400);

    document.getElementById('s2-isubmit').addEventListener('click', submitIntro);

    // Allow Enter in inputs
    ['s2-iname', 's2-iemail'].forEach(id => {
      document.getElementById(id)?.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); submitIntro(); }
      });
    });
  }

  function submitIntro() {
    const nombre = document.getElementById('s2-iname')?.value?.trim();
    const email  = document.getElementById('s2-iemail')?.value?.trim();
    const submitBtn = document.getElementById('s2-isubmit');
    if (!submitBtn || submitBtn.disabled) return;

    let valid = true;
    ['s2-iname', 's2-iemail'].forEach(id => {
      const el = document.getElementById(id);
      if (!el?.value?.trim()) {
        el.style.borderColor = '#ef4444';
        el.style.boxShadow   = '0 0 0 3px rgba(239,68,68,.1)';
        if (valid) el.focus();
        valid = false;
      } else { el.style.borderColor = ''; el.style.boxShadow = ''; }
    });
    if (!valid) return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      const el = document.getElementById('s2-iemail');
      el.style.borderColor = '#ef4444';
      el.style.boxShadow   = '0 0 0 3px rgba(239,68,68,.1)';
      el.focus();
      return;
    }

    submitBtn.disabled = true;
    state.leadData = { nombre, email };
    state.step = 'url';

    submitBtn.closest('.s2-row')?.remove();
    userMsg(nombre);

    setTimeout(() => {
      botMsg(`¡Perfecto, <strong>${esc(nombre)}</strong>! Escribe la URL de tu web. Necesita tener <strong>https://</strong> — webs sin certificado SSL no se pueden analizar.`);
      setInput(true, 'https://www.tunegocio.com');
    }, 350);
  }

  // ─── Formulario final (teléfono + necesidades + Kit Digital) ───────────────
  function showFinalForm() {
    const { nombre } = state.leadData;

    setTimeout(() => {
      botMsg('Para ayudarte mejor, cuéntame un poco más:');

      setTimeout(() => {
        const form = document.createElement('div');
        form.className = 's2-form s2-final-form';
        form.innerHTML = `
          <div class="s2-field">
            <label class="s2-flabel" for="s2-fphone">Teléfono <span style="font-weight:400;text-transform:none;">(opcional)</span></label>
            <input class="s2-finput" id="s2-fphone" type="tel" placeholder="+34 600 000 000" autocomplete="tel" />
          </div>

          <div class="s2-field">
            <label class="s2-flabel">¿Qué necesitas principalmente?</label>
            <div class="s2-pills" id="s2-needs-pills">
              <button type="button" class="s2-pill" data-val="SEO - Posicionamiento en Google">Posicionamiento en Google</button>
              <button type="button" class="s2-pill" data-val="Diseño web o rediseño">Nueva web o rediseño</button>
              <button type="button" class="s2-pill" data-val="SEM - Publicidad online">Publicidad online</button>
              <button type="button" class="s2-pill" data-val="Redes sociales y contenidos">Redes sociales</button>
              <button type="button" class="s2-pill" data-val="No sé, quiero que me asesoren">No sé, asesórame</button>
            </div>
          </div>

          <div class="s2-field">
            <label class="s2-flabel">¿Tienes Kit Digital aprobado?</label>
            <div class="s2-kit-note">Hasta 12.000€ del Gobierno — si lo tienes aprobado y sin usar, aún puedes aplicarlo a nuestros servicios</div>
            <div class="s2-pills" id="s2-kit-pills" style="margin-top:6px;">
              <button type="button" class="s2-pill" data-val="Sí, lo tengo y no lo he gastado">Sí, y no lo he gastado</button>
              <button type="button" class="s2-pill" data-val="No">No</button>
            </div>
          </div>

          <button class="s2-submit" id="s2-fsubmit">Trabajemos juntos</button>
          <p class="s2-privacy">
            Al enviar aceptas nuestra <a href="https://solpronet.cat/politica-de-privacitat" target="_blank" rel="noopener">política de privacidad</a>.
          </p>`;
        botCard(form);
        setInput(false, 'Rellena el formulario…');

        // Multi-select pills (needs)
        document.getElementById('s2-needs-pills').querySelectorAll('.s2-pill').forEach(pill => {
          pill.addEventListener('click', () => pill.classList.toggle('active'));
        });

        // Single-select pills (kit digital)
        document.getElementById('s2-kit-pills').querySelectorAll('.s2-pill').forEach(pill => {
          pill.addEventListener('click', () => {
            document.getElementById('s2-kit-pills').querySelectorAll('.s2-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
          });
        });

        document.getElementById('s2-fsubmit').addEventListener('click', submitFinalForm);
      }, 400);
    }, 300);
  }

  async function submitFinalForm() {
    const telefono   = document.getElementById('s2-fphone')?.value?.trim();
    const needsPills = document.getElementById('s2-needs-pills')?.querySelectorAll('.s2-pill.active');
    const kitPill    = document.getElementById('s2-kit-pills')?.querySelector('.s2-pill.active');
    const submitBtn  = document.getElementById('s2-fsubmit');
    if (!submitBtn || submitBtn.disabled) return;

    const necesidades = needsPills && needsPills.length > 0
      ? Array.from(needsPills).map(p => p.dataset.val).join(', ')
      : '';
    const kit_digital = kitPill?.dataset.val || '';

    submitBtn.disabled = true; submitBtn.textContent = 'Enviando…';

    try {
      const res = await fetch(`${API_BASE}/api/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre:               state.leadData.nombre,
          email:                state.leadData.email,
          telefono,
          url_auditada:         state.url,
          puntuacion:           state.audit?.puntuacion_global,
          problemas_detectados: state.audit?.problemas?.map(p => p.titulo).join(', '),
          necesidades,
          kit_digital,
          fuente:               'Chatbot web',
        }),
      });
      if (!res.ok) throw new Error();

      submitBtn.closest('.s2-row')?.remove();

      const thanks = document.createElement('div');
      thanks.className = 's2-thanks';
      thanks.innerHTML = `
        <div class="s2-thanks-icon">${ICON.check}</div>
        <div class="s2-thanks-title">¡Hablamos pronto!</div>
        <div class="s2-thanks-text">Te contactamos en menos de <strong>24 horas</strong>, ${esc(state.leadData.nombre)}.</div>`;
      botCard(thanks);
      setInput(false, '¡Listo! Nos ponemos en contacto pronto.');
      state.step = 'done';

    } catch {
      submitBtn.disabled = false; submitBtn.textContent = 'Trabajemos juntos';
      botMsg('Algo ha fallado. Escríbenos directamente a <a href="mailto:luis@solpronet.com" style="color:var(--c-bubble);">luis@solpronet.com</a>.');
    }
  }

  // ─── Auditoría ──────────────────────────────────────────────────────────────
  async function runAudit(rawUrl) {
    state.step = 'analyzing'; state.analyzing = true;
    setInput(false, 'Analizando…');

    const progRow = document.createElement('div');
    progRow.className = 's2-row bot'; progRow.id = 's2-progrow';
    const progEl = document.createElement('div');
    progEl.className = 's2-progress';
    progEl.innerHTML = `
      <div class="s2-prog-label">Analizando tu web…</div>
      <div class="s2-prog-text" id="s2-prog-text">Accediendo a la página…</div>
      <div class="s2-prog-track"><div class="s2-prog-fill" id="s2-prog-fill"></div></div>`;
    progRow.innerHTML = `<div class="s2-avatar">${ICON.bot}</div>`;
    progRow.appendChild(progEl);
    msgs.appendChild(progRow); scrollBottom();

    const steps = [
      { pct: 28, text: 'Comprobando velocidad…',           delay: 2200 },
      { pct: 54, text: 'Revisando visibilidad en Google…', delay: 5000 },
      { pct: 76, text: 'Analizando diseño y estructura…',  delay: 8000 },
      { pct: 90, text: 'Preparando tu informe…',           delay: 11000 },
    ];

    const timers = steps.map(s => setTimeout(() => {
      const fill = document.getElementById('s2-prog-fill');
      const text = document.getElementById('s2-prog-text');
      if (text) text.textContent = s.text;
      if (fill && gsapReady && window.gsap && !prefersReduced) {
        gsap.to(fill, { width: s.pct + '%', duration: 0.5, ease: 'power2.out' });
      } else if (fill) { fill.style.width = s.pct + '%'; }
    }, s.delay));

    try {
      const res = await fetch(`${API_BASE}/api/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: rawUrl }),
        signal: AbortSignal.timeout(65000),
      });

      timers.forEach(clearTimeout);
      document.getElementById('s2-progrow')?.remove();

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error en el servidor');
      }

      const data = await res.json();
      if (!data.success || !data.audit) throw new Error('Respuesta inesperada');

      state.audit = data.audit;
      state.step  = 'results';

      const domain = (() => { try { return new URL(data.url).hostname.replace('www.',''); } catch { return rawUrl; } })();
      const { puntuacion_global, resumen, potencial, problemas, mejoras } = data.audit;

      botMsg(`He analizado <strong>${esc(domain)}</strong>:`);

      setTimeout(() => {
        botCard(renderScore(puntuacion_global, resumen));

        setTimeout(() => {
          botCard(renderProblems(problemas));

          setTimeout(() => {
            if (potencial) {
              const potDiv = document.createElement('div');
              potDiv.className = 's2-potencial';
              potDiv.textContent = potencial;
              botCard(potDiv);
            }

            setTimeout(() => {
              botCard(renderMejoras(mejoras));

              setTimeout(() => {
                const actEl = document.createElement('div');
                actEl.className = 's2-actions';
                actEl.innerHTML = `
                  <button class="s2-act-btn primary" id="s2-a-contact">Trabajemos juntos</button>`;
                botCard(actEl);

                document.getElementById('s2-a-contact').addEventListener('click', () => {
                  actEl.closest('.s2-row')?.remove();
                  state.step = 'final-form';
                  showFinalForm();
                });
              }, 500);
            }, 700);
          }, 800);
        }, 500);
      }, 300);

    } catch (err) {
      timers.forEach(clearTimeout);
      document.getElementById('s2-progrow')?.remove();
      const msg = err.name === 'TimeoutError'
        ? 'El análisis tardó demasiado. Inténtalo de nuevo.'
        : (err.message || 'Error inesperado. Inténtalo de nuevo.');
      botMsg(`Vaya — ${esc(msg)}`);
      state.step = 'url';
      setInput(true, 'https://www.tunegocio.com');
    } finally {
      state.analyzing = false;
    }
  }

  // ─── Envío de URL ───────────────────────────────────────────────────────────
  function handleSend() {
    const text = input.value.trim();
    if (!text || state.analyzing) return;

    if (state.step === 'url') {
      input.value = '';
      userMsg(text);
      let url = text;
      if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
      try { new URL(url); } catch {
        botMsg('Eso no parece una URL válida. Prueba con <strong>www.tunegocio.com</strong>');
        return;
      }
      state.url = url;
      runAudit(url);
    }
  }

  // ─── Toggle ─────────────────────────────────────────────────────────────────
  if (labelEl) labelEl.addEventListener('click', () => btn.click());

  btn.addEventListener('click', () => {
    state.open = !state.open;
    btn.classList.toggle('s2-open', state.open);
    btn.setAttribute('aria-expanded', state.open);

    if (state.open) {
      labelEl?.classList.add('s2-hidden');
      openChat();
      if (!state.ready) {
        state.ready = true;
        showTyping();
        setTimeout(() => {
          hideTyping();
          botMsg('Hola, soy el asistente de <strong>Solpronet</strong>. Analizo tu web en menos de un minuto y te digo exactamente qué está frenando tu crecimiento online.');
          setTimeout(() => {
            botMsg('Antes de proceder, nos gustaría saber con quién hablamos. ¿Nos dices tu nombre y correo?');
            setTimeout(() => {
              showIntroForm();
            }, 400);
          }, 900);
        }, 1100);
      }
    } else {
      closeChat();
    }
  });

  send.addEventListener('click', handleSend);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  });

  // ─── Init ───────────────────────────────────────────────────────────────────
  loadGSAP(() => {
    gsapReady = !!window.gsap;
    if (gsapReady && !prefersReduced) {
      gsap.defaults({ ease: 'power2.out' });
      gsap.set('#s2-chat', { autoAlpha: 0, scale: 0.9, y: 12, transformOrigin: 'bottom right' });
    }
  });

})();
