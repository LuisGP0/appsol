/* Solpronet Audit Widget v2.0
 * Embed: <script src="/widget.js" data-api="https://tu-servidor.com"></script>
 */
(function () {
  'use strict';

  const scriptTag = document.currentScript;
  const API_BASE  = (scriptTag && scriptTag.getAttribute('data-api')) || '';

  // ─── SVG icon set (Heroicons style, no emojis as structural icons) ──────────
  const ICON = {
    chat: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="white" stroke-width="2" stroke-linejoin="round"/></svg>`,
    close:`<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>`,
    send: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`,
    bot:  `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="6" y="11" width="12" height="9" rx="2.5" stroke="white" stroke-width="1.9"/><rect x="9" y="6" width="6" height="6" rx="1.5" stroke="white" stroke-width="1.9"/><circle cx="10.5" cy="16" r="1.1" fill="white"/><circle cx="13.5" cy="16" r="1.1" fill="white"/><path d="M12 6V4" stroke="white" stroke-width="1.9" stroke-linecap="round"/><path d="M6 14.5H4M20 14.5H18" stroke="white" stroke-width="1.9" stroke-linecap="round"/></svg>`,
    warn: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="white" stroke-width="2" stroke-linejoin="round"/><line x1="12" y1="9" x2="12" y2="13" stroke="white" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17" r="1" fill="white"/></svg>`,
    star: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" stroke="white" stroke-width="2" stroke-linejoin="round"/></svg>`,
    check:`<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><polyline points="20 6 9 17 4 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    dot:  `<svg viewBox="0 0 8 8" aria-hidden="true"><circle cx="4" cy="4" r="4" fill="#4ade80"/></svg>`,
  };

  // ─── CSS ────────────────────────────────────────────────────────────────────
  const CSS = `
    #spn-root *, #spn-root *::before, #spn-root *::after {
      box-sizing: border-box;
      margin: 0;
    }
    #spn-root {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      -webkit-font-smoothing: antialiased;
      --c-blue:   #1d4ed8;
      --c-bubble: #2563eb;
      --c-green:  #16a34a;
      --c-text:   #111827;
      --c-muted:  #6b7280;
      --c-faint:  #9ca3af;
      --c-border: #e5e7eb;
      --c-recv:   #e9ebee;
      --c-bg:     #ffffff;
    }

    /* ── Trigger wrapper (button + floating label) ── */
    #spn-trigger {
      position: fixed; bottom: 24px; right: 24px;
      display: flex; align-items: center; gap: 12px;
      z-index: 2147483640;
    }

    #spn-label {
      background: #fff;
      padding: 11px 18px;
      border-radius: 100px;
      font-size: 14px; font-weight: 600; color: #111827;
      box-shadow: 0 4px 20px rgba(0,0,0,.15), 0 1px 4px rgba(0,0,0,.07);
      white-space: nowrap; cursor: pointer; user-select: none;
      animation: spnLabelIn 0.45s 2s ease both;
      transition: box-shadow .18s, transform .15s;
    }
    #spn-label:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(0,0,0,.18); }
    #spn-label.spn-hidden { display: none; }
    @keyframes spnLabelIn {
      from { opacity: 0; transform: translateX(12px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    /* ── Toggle button ── */
    #spn-btn {
      position: relative;
      width: 60px; height: 60px; border-radius: 50%;
      background: var(--c-bubble);
      border: none; cursor: pointer;
      box-shadow: 0 4px 20px rgba(37,99,235,.4);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      animation: spnPulse 3s ease-in-out infinite;
      will-change: transform;
    }
    #spn-btn svg { width: 26px; height: 26px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); transition: opacity .22s ease; }
    #spn-btn .spn-icon-chat  { opacity: 1; }
    #spn-btn .spn-icon-close { opacity: 0; }
    #spn-btn.spn-open .spn-icon-chat  { opacity: 0; }
    #spn-btn.spn-open .spn-icon-close { opacity: 1; }
    #spn-btn.spn-open { animation: none; }
    #spn-btn:focus-visible { outline: 3px solid var(--c-bubble); outline-offset: 3px; }

    @keyframes spnPulse {
      0%,100% { box-shadow: 0 4px 20px rgba(37,99,235,.4); }
      50%      { box-shadow: 0 4px 20px rgba(37,99,235,.55), 0 0 0 10px rgba(37,99,235,.07); }
    }

    /* ── Chat window ── */
    #spn-chat {
      position: fixed; bottom: 94px; right: 24px;
      width: 620px; max-width: calc(100vw - 32px);
      height: 730px; max-height: calc(100dvh - 110px);
      background: var(--c-bg); border-radius: 20px;
      box-shadow: 0 12px 48px rgba(0,0,0,.16), 0 2px 8px rgba(0,0,0,.06);
      z-index: 2147483639;
      display: flex; flex-direction: column; overflow: hidden;
      visibility: hidden;
      will-change: transform, opacity;
    }

    /* ── Header ── */
    .spn-header {
      background: var(--c-bg);
      padding: 16px 20px;
      display: flex; align-items: center; gap: 14px;
      flex-shrink: 0;
      border-bottom: 1px solid var(--c-border);
    }
    .spn-h-avatar {
      width: 44px; height: 44px; border-radius: 50%;
      background: var(--c-bubble);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(37,99,235,.3);
    }
    .spn-h-avatar svg { width: 20px; height: 20px; }
    .spn-h-info { flex: 1; min-width: 0; }
    .spn-h-name { font-weight: 700; font-size: 15px; color: var(--c-text); letter-spacing: -.2px; line-height: 1.2; }
    .spn-h-sub  {
      font-size: 12.5px; color: var(--c-muted);
      display: flex; align-items: center; gap: 6px; margin-top: 3px; line-height: 1;
    }
    .spn-h-sub svg { width: 7px; height: 7px; flex-shrink: 0; }

    /* ── Messages area ── */
    .spn-msgs {
      flex: 1; overflow-y: auto; padding: 24px 20px;
      display: flex; flex-direction: column; gap: 16px;
      scroll-behavior: smooth; background: var(--c-bg);
    }
    .spn-msgs::-webkit-scrollbar { width: 0; }

    .spn-row { display: flex; gap: 10px; align-items: flex-end; visibility: visible; }
    .spn-row.bot  { align-self: flex-start; max-width: 90%; }
    .spn-row.user { align-self: flex-end;   max-width: 78%; flex-direction: row-reverse; }

    /* Avatar inline */
    .spn-avatar {
      width: 30px; height: 30px; min-width: 30px; border-radius: 50%;
      background: var(--c-bubble);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .spn-avatar svg { width: 15px; height: 15px; }

    /* Bubbles */
    .spn-bubble {
      padding: 12px 16px; border-radius: 18px;
      font-size: 16px; font-weight: 500; line-height: 1.6; color: #000;
      word-break: break-word;
    }
    .spn-row.bot .spn-bubble {
      background: #f4f4f4;
      border-bottom-left-radius: 4px;
    }
    .spn-row.user .spn-bubble {
      background: var(--c-bubble);
      color: #fff; font-weight: 500;
      border-bottom-right-radius: 4px;
    }

    /* Typing indicator */
    .spn-typing {
      display: flex; gap: 5px; padding: 15px 20px;
      background: var(--c-recv); border-radius: 18px; border-bottom-left-radius: 4px;
      width: fit-content;
    }
    .spn-tdot {
      width: 7px; height: 7px; border-radius: 50%;
      background: var(--c-faint); animation: spnBounce 1.3s infinite;
    }
    .spn-tdot:nth-child(2) { animation-delay: .18s; }
    .spn-tdot:nth-child(3) { animation-delay: .36s; }
    @keyframes spnBounce {
      0%,60%,100% { transform: translateY(0); }
      30%          { transform: translateY(-7px); }
    }

    /* Progress bar bubble */
    .spn-progress {
      background: var(--c-recv); border-radius: 18px; border-bottom-left-radius: 4px;
      padding: 16px 18px; display: flex; flex-direction: column; gap: 10px;
      min-width: 230px;
    }
    .spn-prog-label { font-size: 14px; font-weight: 600; color: var(--c-text); }
    .spn-prog-text  { font-size: 13px; color: var(--c-muted); }
    .spn-prog-track { height: 4px; background: var(--c-border); border-radius: 4px; overflow: hidden; }
    .spn-prog-fill  {
      height: 100%; width: 8%; border-radius: 4px;
      background: var(--c-bubble); will-change: width;
    }

    /* ── Cards ── */
    .spn-card {
      background: var(--c-bg); border: 1px solid var(--c-border);
      border-radius: 16px; overflow: hidden; width: 490px;
      box-shadow: 0 2px 12px rgba(0,0,0,.07);
    }
    .spn-card-hd {
      padding: 14px 16px; display: flex; align-items: center; gap: 12px;
      border-bottom: 1px solid var(--c-border);
    }
    .spn-card-hd.blue  { background: #fbdddd; }
    .spn-card-hd.green { background: #f0fdf4; }
    .spn-card-hd-icon {
      width: 36px; height: 36px; min-width: 36px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
    }
    .spn-card-hd.blue  .spn-card-hd-icon { background: rgba(220,38,38,.8); }
    .spn-card-hd.green .spn-card-hd-icon { background: #16a34a; }
    .spn-card-hd-icon svg { width: 18px; height: 18px; }
    .spn-card-hd.blue  .spn-card-hd-icon svg { stroke: #fff; }
    .spn-card-hd.green .spn-card-hd-icon svg { stroke: #fff; }
    .spn-card-hd-title { font-weight: 700; font-size: 15px; color: var(--c-text); line-height: 1.2; }
    .spn-card-hd-sub   { font-size: 12.5px; color: var(--c-muted); margin-top: 3px; }

    .spn-prob {
      display: flex; gap: 12px; align-items: flex-start;
      padding: 16px 18px; border-bottom: 1px solid #f3f4f6;
    }
    .spn-prob:last-child { border-bottom: none; }
    .spn-prob-badge {
      width: 28px; height: 28px; min-width: 28px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center; margin-top: 2px;
    }
    .spn-prob.critico    .spn-prob-badge { background: #fef2f2; color: #ef4444; }
    .spn-prob.importante .spn-prob-badge { background: #fff7ed; color: #f97316; }
    .spn-prob.menor      .spn-prob-badge { background: #eff6ff; color: #3b82f6; }
    .spn-prob-badge svg { width: 20px; height: 20px; }
    .spn-prob-title { font-weight: 700; font-size: 16px; color: var(--c-text); line-height: 1.4; margin-bottom: 6px; }
    .spn-prob-desc  { font-size: 16px; color: #111827; margin-top: 0; line-height: 1.7; }
    .spn-prob-dato  {
      font-size: 15.5px; color: #1e40af; background: #eff6ff;
      border-left: 3px solid #2563eb;
      padding: 8px 12px; border-radius: 0 6px 6px 0;
      margin-top: 10px; line-height: 1.55; font-style: italic;
    }
    .spn-prob.critico    .spn-prob-dato { color: #991b1b; background: #fef2f2; border-color: #ef4444; }
    .spn-prob.importante .spn-prob-dato { color: #92400e; background: #fffbeb; border-color: #f59e0b; }
    .spn-resultado {
      font-size: 15px; color: #166534; background: #f0fdf4;
      border-left: 3px solid #16a34a;
      padding: 8px 12px; border-radius: 0 6px 6px 0;
      margin-top: 8px; line-height: 1.55;
    }
    .spn-potencial {
      background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
      color: #fff; border-radius: 14px; padding: 14px 16px;
      font-size: 15px; line-height: 1.6; font-weight: 500;
      max-width: 460px;
    }

    .spn-mejora-tag {
      display: inline-block; font-size: 10px; font-weight: 700;
      padding: 2px 7px; border-radius: 5px; margin-left: 6px;
      vertical-align: middle; letter-spacing: .3px; text-transform: uppercase;
    }

    /* ── Action buttons ── */
    .spn-actions { display: flex; flex-wrap: wrap; gap: 8px; }
    .spn-act-btn {
      background: var(--c-bg); border: 1.5px solid var(--c-border); color: var(--c-text);
      border-radius: 24px; padding: 10px 20px; font-size: 14px; font-weight: 500;
      cursor: pointer; font-family: inherit; white-space: nowrap;
      transition: background .15s, border-color .15s, color .15s;
      min-height: 44px; display: flex; align-items: center;
    }
    .spn-act-btn:hover { background: var(--c-text); border-color: var(--c-text); color: #fff; }
    .spn-act-btn:focus-visible { outline: 2px solid var(--c-bubble); outline-offset: 2px; }

    /* ── Lead form ── */
    .spn-form  { display: flex; flex-direction: column; gap: 12px; width: 300px; }
    .spn-field { display: flex; flex-direction: column; gap: 6px; }
    .spn-flabel {
      font-size: 11.5px; font-weight: 600; color: var(--c-muted);
      text-transform: uppercase; letter-spacing: .6px;
    }
    .spn-finput {
      border: 1.5px solid transparent; border-radius: 12px;
      padding: 12px 15px; font-size: 15px; outline: none;
      color: var(--c-text); font-family: inherit;
      background: var(--c-recv);
      transition: box-shadow .18s, background .18s, border-color .18s;
      min-height: 48px;
    }
    .spn-finput:focus { background: #fff; border-color: var(--c-bubble); box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
    .spn-finput::placeholder { color: var(--c-faint); }
    .spn-submit {
      background: var(--c-bubble);
      color: #fff; border: none; border-radius: 12px;
      padding: 15px; font-size: 15px; font-weight: 600;
      cursor: pointer; font-family: inherit; margin-top: 4px;
      min-height: 52px; letter-spacing: -.1px;
      transition: filter .15s, transform .12s;
    }
    .spn-submit:hover   { filter: brightness(1.08); transform: translateY(-1px); }
    .spn-submit:active  { transform: translateY(0); }
    .spn-submit:disabled { opacity: .5; cursor: not-allowed; transform: none; filter: none; }
    .spn-submit:focus-visible { outline: 2px solid var(--c-bubble); outline-offset: 2px; }
    .spn-privacy { font-size: 11px; color: var(--c-faint); text-align: center; line-height: 1.6; }
    .spn-privacy a { color: var(--c-bubble); text-decoration: none; }
    .spn-privacy a:hover { text-decoration: underline; }

    /* ── Thank you ── */
    .spn-thanks {
      background: var(--c-recv); border-radius: 18px; border-bottom-left-radius: 4px;
      padding: 24px 22px; text-align: center;
      display: flex; flex-direction: column; align-items: center; gap: 12px;
      width: 280px;
    }
    .spn-thanks-icon {
      width: 56px; height: 56px; border-radius: 50%;
      background: var(--c-bubble);
      display: flex; align-items: center; justify-content: center;
    }
    .spn-thanks-icon svg { width: 28px; height: 28px; }
    .spn-thanks-title { font-size: 17px; font-weight: 700; color: var(--c-text); }
    .spn-thanks-text  { font-size: 14px; color: var(--c-muted); line-height: 1.65; }

    /* ── Input area ── */
    .spn-input-area {
      padding: 14px 16px; border-top: 1px solid var(--c-border);
      display: flex; gap: 10px; align-items: center;
      flex-shrink: 0; background: var(--c-bg);
    }
    #spn-input {
      flex: 1; border: none; border-radius: 24px;
      padding: 13px 20px; font-size: 15px; outline: none;
      color: var(--c-text); font-family: inherit;
      background: #f4f4f4;
      transition: box-shadow .18s;
      min-width: 0; height: 48px; line-height: 1;
    }
    #spn-input:focus { box-shadow: 0 0 0 2px var(--c-bubble); }
    #spn-input::placeholder { color: var(--c-faint); }
    #spn-input:disabled { opacity: .55; cursor: not-allowed; }

    #spn-send {
      position: relative;
      width: 48px; height: 48px; min-width: 48px; flex-shrink: 0;
      border-radius: 50%; background: var(--c-bubble);
      border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: filter .15s;
    }
    #spn-send svg { width: 18px; height: 18px; display: block; }
    #spn-send:hover    { filter: brightness(1.1); }
    #spn-send:disabled { opacity: .35; cursor: not-allowed; filter: none; }
    #spn-send:focus-visible { outline: 2px solid var(--c-bubble); outline-offset: 2px; }

    /* ── Mobile ── */
    @media (max-width: 479px) {
      #spn-chat    { bottom:0; right:0; width:100vw; max-width:100vw; height:100dvh; max-height:100dvh; border-radius:0; }
      #spn-trigger { bottom:16px; right:16px; }
      #spn-label   { font-size:13px; padding:9px 14px; }
    }
  `;

  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  // ─── Markup ─────────────────────────────────────────────────────────────────
  const root = document.createElement('div');
  root.id = 'spn-root';
  root.innerHTML = `
    <div id="spn-trigger">
      <div id="spn-label">Audita tu web gratis en 1 min</div>
      <button id="spn-btn" aria-label="Auditoría web gratuita · Solpronet">
        <span class="spn-icon-chat">${ICON.chat}</span>
        <span class="spn-icon-close">${ICON.close}</span>
      </button>
    </div>

    <div id="spn-chat" role="dialog" aria-modal="true" aria-label="Auditoría web gratuita de Solpronet">
      <div class="spn-header">
        <div class="spn-h-avatar">${ICON.bot}</div>
        <div class="spn-h-info">
          <div class="spn-h-name">Solpronet</div>
          <div class="spn-h-sub">
            ${ICON.dot}
            Auditoría web gratuita · IA
          </div>
        </div>
      </div>

      <div class="spn-msgs" id="spn-msgs" role="log" aria-live="polite"></div>

      <div class="spn-input-area">
        <input id="spn-input" type="text"
          placeholder="Abre el chat para comenzar…"
          autocomplete="off" autocorrect="off" spellcheck="false"
          disabled aria-label="Escribe la URL de tu web" />
        <button id="spn-send" disabled aria-label="Enviar">${ICON.send}</button>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  // ─── GSAP + animaciones ─────────────────────────────────────────────────────
  function loadGSAP(cb) {
    if (window.gsap) return cb();
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js';
    s.onload = cb;
    s.onerror = () => { window.gsap = null; cb(); }; // graceful fallback
    document.head.appendChild(s);
  }

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let gsapReady = false;

  function animIn(el, opts = {}) {
    if (!gsapReady || !window.gsap || prefersReduced) {
      el.style.visibility = 'visible';
      return;
    }
    gsap.fromTo(el,
      { autoAlpha: 0, y: opts.y ?? 10 },
      { autoAlpha: 1, y: 0, duration: opts.d ?? 0.28, ease: opts.ease ?? 'power2.out',
        delay: opts.delay ?? 0, clearProps: opts.clear ? 'all' : '' }
    );
  }

  function animCard(el) {
    if (!gsapReady || !window.gsap || prefersReduced) {
      el.style.visibility = 'visible';
      // Still animate score bars via CSS if GSAP unavailable
      el.querySelectorAll('[data-w]').forEach(f => { f.style.width = f.dataset.w; });
      return;
    }
    gsap.fromTo(el,
      { autoAlpha: 0, y: 18, scale: 0.96 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.42, ease: 'back.out(1.5)' }
    );
  }

  function openChat() {
    const chatEl = document.getElementById('spn-chat');
    if (!gsapReady || !window.gsap || prefersReduced) {
      chatEl.style.visibility = 'visible';
      chatEl.style.opacity    = '1';
      return;
    }
    gsap.fromTo(chatEl,
      { autoAlpha: 0, scale: 0.88, y: 18, transformOrigin: 'bottom right' },
      { autoAlpha: 1, scale: 1,    y: 0,  duration: 0.4, ease: 'back.out(1.6)' }
    );
  }

  function closeChat(onDone) {
    const chatEl = document.getElementById('spn-chat');
    if (!gsapReady || !window.gsap || prefersReduced) {
      chatEl.style.visibility = 'hidden';
      chatEl.style.opacity    = '0';
      onDone?.();
      return;
    }
    gsap.to(chatEl, {
      autoAlpha: 0, scale: 0.92, y: 10,
      duration: 0.22, ease: 'power3.in',
      transformOrigin: 'bottom right', onComplete: onDone
    });
  }

  function hoverBtn(el) {
    if (!gsapReady || !window.gsap || prefersReduced) return;
    el.addEventListener('mouseenter', () => gsap.to(el, { scale: 1.08, duration: 0.2, ease: 'power2.out' }));
    el.addEventListener('mouseleave', () => gsap.to(el, { scale: 1,    duration: 0.2, ease: 'power2.out' }));
  }

  // ─── Estado ─────────────────────────────────────────────────────────────────
  const state = {
    open: false, ready: false, analyzing: false,
    step: 'welcome', url: '', audit: null,
  };

  const msgs    = document.getElementById('spn-msgs');
  const input   = document.getElementById('spn-input');
  const send    = document.getElementById('spn-send');
  const btn     = document.getElementById('spn-btn');
  const labelEl = document.getElementById('spn-label');

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  function esc(s) {
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function scrollBottom() { msgs.scrollTop = msgs.scrollHeight; }

  function setInput(enabled, ph) {
    input.disabled = !enabled; send.disabled = !enabled;
    if (ph) input.placeholder = ph;
    if (enabled) setTimeout(() => input.focus(), 100);
  }

  function scoreColor(n) {
    if (n >= 8) return '#16a34a';
    if (n >= 5) return '#f59e0b';
    return '#ef4444';
  }

  // Badge icon for problem severity
  function probIcon(nivel) {
    const icons = {
      critico:   `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="16" r="1" fill="currentColor"/></svg>`,
      importante:`<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>`,
      menor:     `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    };
    return icons[nivel] || icons.menor;
  }

  // ─── Mensajes ───────────────────────────────────────────────────────────────
  function botMsg(html) {
    const row = document.createElement('div');
    row.className = 'spn-row bot';
    row.style.visibility = 'hidden';
    row.innerHTML = `<div class="spn-avatar">${ICON.bot}</div><div class="spn-bubble">${html}</div>`;
    msgs.appendChild(row);
    scrollBottom();
    requestAnimationFrame(() => animIn(row));
    return row;
  }

  function userMsg(text) {
    const row = document.createElement('div');
    row.className = 'spn-row user';
    row.style.visibility = 'hidden';
    row.innerHTML = `<div class="spn-bubble">${esc(text)}</div>`;
    msgs.appendChild(row);
    scrollBottom();
    requestAnimationFrame(() => animIn(row, { y: 6 }));
  }

  function botCard(el) {
    const row = document.createElement('div');
    row.className = 'spn-row bot';
    row.style.visibility = 'hidden';
    row.innerHTML = `<div class="spn-avatar">${ICON.bot}</div>`;
    row.appendChild(el);
    msgs.appendChild(row);
    scrollBottom();
    requestAnimationFrame(() => animCard(row));
    return row;
  }

  function showTyping() {
    const row = document.createElement('div');
    row.className = 'spn-row bot'; row.id = 'spn-typing';
    row.innerHTML = `<div class="spn-avatar">${ICON.bot}</div>
      <div class="spn-typing">
        <div class="spn-tdot"></div>
        <div class="spn-tdot"></div>
        <div class="spn-tdot"></div>
      </div>`;
    msgs.appendChild(row); scrollBottom();
  }
  function hideTyping() { document.getElementById('spn-typing')?.remove(); }

  // ─── Tarjeta de problemas ───────────────────────────────────────────────────
  function renderProblems(problemas) {
    const rows = (problemas || []).map(p => `
      <div class="spn-prob ${esc(p.nivel)}">
        <div class="spn-prob-badge">${probIcon(p.nivel)}</div>
        <div style="flex:1;min-width:0;">
          <div class="spn-prob-title">${esc(p.titulo)}</div>
          <div class="spn-prob-desc">${esc(p.impacto)}</div>
          ${p.dato ? `<div class="spn-prob-dato">${esc(p.dato)}</div>` : ''}
        </div>
      </div>`).join('');

    const card = document.createElement('div');
    card.className = 'spn-card';
    card.innerHTML = `
      <div class="spn-card-hd blue">
        <div class="spn-card-hd-icon">${ICON.warn}</div>
        <div>
          <div class="spn-card-hd-title">Lo que hemos detectado</div>
          <div class="spn-card-hd-sub">De mayor a menor importancia</div>
        </div>
      </div>
      <div class="spn-prob-list">${rows}</div>`;
    return card;
  }

  // ─── Tarjeta de mejoras ─────────────────────────────────────────────────────
  function renderMejoras(mejoras) {
    const tagColor = {
      'SEO':              '#16a34a',
      'SEM':              '#d97706',
      'Diseño Web':       '#7c3aed',
      'Marketing Digital':'#2563eb',
    };

    const rows = (mejoras || []).map(m => {
      const c = tagColor[m.servicio] || '#2563eb';
      return `
        <div class="spn-prob menor" style="border-left:none;">
          <div class="spn-prob-badge" style="background:#f0fdf4;color:#16a34a;">${ICON.check}</div>
          <div style="flex:1;min-width:0;">
            <div class="spn-prob-title">
              ${esc(m.titulo)}
              <span class="spn-mejora-tag" style="background:${c}18;color:${c};">${esc(m.servicio)}</span>
            </div>
            <div class="spn-prob-desc">${esc(m.beneficio)}</div>
            ${m.resultado ? `<div class="spn-resultado">→ ${esc(m.resultado)}</div>` : ''}
          </div>
        </div>`;
    }).join('');

    const card = document.createElement('div');
    card.className = 'spn-card';
    card.innerHTML = `
      <div class="spn-card-hd green">
        <div class="spn-card-hd-icon">${ICON.star}</div>
        <div>
          <div class="spn-card-hd-title">Lo que haríamos por ti</div>
          <div class="spn-card-hd-sub">Si trabajamos juntos</div>
        </div>
      </div>
      <div class="spn-prob-list">${rows}</div>`;
    return card;
  }

  // ─── Formulario de lead ─────────────────────────────────────────────────────
  function showLeadForm() {
    botMsg('Perfecto. Déjanos tus datos y te llamamos nosotros — <strong>sin compromiso, sin coste</strong>. Te contamos exactamente qué haríamos y qué inversiónimplicaría.');

    const form = document.createElement('div');
    form.className = 'spn-form';
    form.innerHTML = `
      <div class="spn-field">
        <label class="spn-flabel" for="spn-lname">Nombre *</label>
        <input class="spn-finput" id="spn-lname" type="text" placeholder="Tu nombre completo" autocomplete="name" />
      </div>
      <div class="spn-field">
        <label class="spn-flabel" for="spn-lemail">Correo electrónico *</label>
        <input class="spn-finput" id="spn-lemail" type="email" placeholder="tu@empresa.com" autocomplete="email" />
      </div>
      <div class="spn-field">
        <label class="spn-flabel" for="spn-lphone">Teléfono <span style="font-weight:400;text-transform:none;letter-spacing:0;">(opcional)</span></label>
        <input class="spn-finput" id="spn-lphone" type="tel" placeholder="+34 600 000 000" autocomplete="tel" />
      </div>
      <button class="spn-submit" id="spn-lsubmit">Solicitar consulta gratuita</button>
      <p class="spn-privacy">
        Al enviar aceptas nuestra
        <a href="https://solpronet.cat/politica-de-privacitat" target="_blank" rel="noopener">política de privacidad</a>.
        Nunca compartiremos tus datos.
      </p>`;
    botCard(form);
    setInput(false, 'Rellena el formulario de arriba…');
    document.getElementById('spn-lsubmit').addEventListener('click', submitLead);
  }

  async function submitLead() {
    const nombre  = document.getElementById('spn-lname')?.value?.trim();
    const email   = document.getElementById('spn-lemail')?.value?.trim();
    const telefono= document.getElementById('spn-lphone')?.value?.trim();
    const submitBtn = document.getElementById('spn-lsubmit');

    // Validation with visual feedback
    let valid = true;
    ['spn-lname','spn-lemail'].forEach(id => {
      const el = document.getElementById(id);
      if (!el?.value?.trim()) {
        el.style.borderColor = '#ef4444';
        el.style.boxShadow   = '0 0 0 3px rgba(239,68,68,.12)';
        if (valid) el.focus();
        valid = false;
      } else {
        el.style.borderColor = '';
        el.style.boxShadow   = '';
      }
    });
    if (!valid) return;

    submitBtn.disabled    = true;
    submitBtn.textContent = 'Enviando…';

    try {
      const res = await fetch(`${API_BASE}/api/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre, email, telefono,
          url_auditada: state.url,
          puntuacion: state.audit?.puntuacion_global,
          problemas_detectados: state.audit?.problemas?.map(p => p.titulo).join(', '),
        }),
      });
      if (!res.ok) throw new Error();

      submitBtn.closest('.spn-row')?.remove();

      const thanks = document.createElement('div');
      thanks.className = 'spn-thanks';
      thanks.innerHTML = `
        <div class="spn-thanks-icon">${ICON.check}</div>
        <div class="spn-thanks-title">¡Solicitud recibida!</div>
        <div class="spn-thanks-text">
          Te contactamos en menos de <strong>24 horas</strong>, ${esc(nombre)}.<br>
          Hasta entonces, si tienes cualquier duda puedes escribirnos a
          <a href="mailto:luis@solpronet.com" style="color:var(--c-bubble);text-decoration:none;">luis@solpronet.com</a>.
        </div>`;
      botCard(thanks);
      setInput(false, '¡Todo listo! Nos ponemos en contacto pronto.');
      state.step = 'done';

    } catch {
      submitBtn.disabled    = false;
      submitBtn.textContent = 'Solicitar consulta gratuita';
      botMsg('Ha habido un problema al enviar el formulario. Puedes contactarnos directamente en <a href="mailto:luis@solpronet.com" style="color:var(--c-bubble);">luis@solpronet.com</a>.');
    }
  }

  // ─── Auditoría ──────────────────────────────────────────────────────────────
  async function runAudit(rawUrl) {
    state.step = 'analyzing'; state.analyzing = true;
    setInput(false, 'Analizando tu web…');

    // Progress UI
    const progRow = document.createElement('div');
    progRow.className = 'spn-row bot'; progRow.id = 'spn-progrow';
    const progEl = document.createElement('div');
    progEl.className = 'spn-progress';
    progEl.innerHTML = `
      <div class="spn-prog-label">Analizando tu web…</div>
      <div class="spn-prog-text" id="spn-prog-text">Accediendo a la página…</div>
      <div class="spn-prog-track"><div class="spn-prog-fill" id="spn-prog-fill"></div></div>`;
    progRow.innerHTML = `<div class="spn-avatar">${ICON.bot}</div>`;
    progRow.appendChild(progEl);
    msgs.appendChild(progRow); scrollBottom();

    const steps = [
      { pct: 25, text: 'Comprobando velocidad de carga…',        delay: 2200 },
      { pct: 50, text: 'Revisando visibilidad en Google…',       delay: 5000 },
      { pct: 72, text: 'Analizando diseño y estructura…',        delay: 8000 },
      { pct: 88, text: 'Preparando el informe personalizado…',   delay: 11000 },
    ];

    const timers = steps.map(s => setTimeout(() => {
      const fill = document.getElementById('spn-prog-fill');
      const text = document.getElementById('spn-prog-text');
      if (text) text.textContent = s.text;
      if (fill && gsapReady && window.gsap && !prefersReduced) {
        gsap.to(fill, { width: s.pct + '%', duration: 0.6, ease: 'power2.out' });
      } else if (fill) {
        fill.style.width = s.pct + '%';
      }
    }, s.delay));

    try {
      const res = await fetch(`${API_BASE}/api/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: rawUrl }),
        signal: AbortSignal.timeout(65000),
      });

      timers.forEach(clearTimeout);
      document.getElementById('spn-progrow')?.remove();

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error en el servidor');
      }

      const data = await res.json();
      if (!data.success || !data.audit) throw new Error('Respuesta inesperada');

      state.audit = data.audit;
      state.step  = 'results';

      const domain = (() => { try { return new URL(data.url).hostname.replace('www.',''); } catch { return rawUrl; } })();
      const { resumen, potencial, problemas, mejoras } = data.audit;

      botMsg(`He revisado <strong>${esc(domain)}</strong>. ${esc(resumen)}`);

      setTimeout(() => {
        botCard(renderProblems(problemas));

        setTimeout(() => {
          if (potencial) {
            const potDiv = document.createElement('div');
            potDiv.className = 'spn-potencial';
            potDiv.textContent = potencial;
            botCard(potDiv);
          }

          setTimeout(() => {
            botMsg('Esto es exactamente lo que haríamos si trabajamos juntos:');

            setTimeout(() => {
              botCard(renderMejoras(mejoras));

            setTimeout(() => {
              const actEl = document.createElement('div');
              actEl.className = 'spn-actions';
              actEl.innerHTML = `
                <button class="spn-act-btn" id="spn-a-contact">Quiero que me contactéis</button>
                <button class="spn-act-btn" id="spn-a-new">Analizar otra web</button>`;
              botCard(actEl);

              document.getElementById('spn-a-contact').addEventListener('click', () => {
                actEl.closest('.spn-row')?.remove();
                state.step = 'form';
                showLeadForm();
              });
              document.getElementById('spn-a-new').addEventListener('click', () => {
                actEl.closest('.spn-row')?.remove();
                state.step = 'welcome'; state.audit = null; state.url = '';
                botMsg('Claro. ¿Cuál es la URL de la siguiente web que quieres revisar?');
                setInput(true, 'https://www.ejemplo.com');
              });
            }, 500);
          }, 700);
        }, 600);
      }, 900);
    }, 400);

    } catch (err) {
      timers.forEach(clearTimeout);
      document.getElementById('spn-progrow')?.remove();
      const msg = err.name === 'TimeoutError'
        ? 'El análisis ha tardado más de lo habitual. Por favor, inténtalo de nuevo.'
        : (err.message || 'Ha ocurrido un error inesperado. Inténtalo de nuevo.');
      botMsg(`Vaya, algo ha fallado — ${esc(msg)}`);
      state.step = 'welcome';
      setInput(true, 'https://www.ejemplo.com');
    } finally {
      state.analyzing = false;
    }
  }

  // ─── Envío de mensaje ───────────────────────────────────────────────────────
  function handleSend() {
    const text = input.value.trim();
    if (!text || state.analyzing) return;

    if (state.step === 'welcome') {
      input.value = '';
      userMsg(text);

      let url = text;
      if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
      try { new URL(url); } catch {
        botMsg('Eso no parece una URL válida. Prueba con algo como <strong>www.tunegocio.com</strong>');
        return;
      }
      state.url = url;
      runAudit(url);
    }
  }

  // ─── Toggle del chat ────────────────────────────────────────────────────────
  if (labelEl) labelEl.addEventListener('click', () => btn.click());

  btn.addEventListener('click', () => {
    state.open = !state.open;
    btn.classList.toggle('spn-open', state.open);
    btn.setAttribute('aria-expanded', state.open);

    if (state.open) {
      labelEl?.classList.add('spn-hidden');
      openChat();
      if (!state.ready) {
        state.ready = true;
        showTyping();
        setTimeout(() => {
          hideTyping();
          botMsg('Hola, soy el asistente de <strong>Solpronet</strong>. Te damos un diagnóstico gratuito de tu web: te decimos qué está funcionando bien, dónde tienes margen de mejora, y cómo podríamos ayudarte a crecer.');
          setTimeout(() => {
            botMsg('¿Cuál es la URL de la web que quieres que revisemos?');
            setInput(true, 'https://www.tunegocio.com');
          }, 900);
        }, 1200);
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
      // Set initial hidden state via GSAP
      gsap.set('#spn-chat', { autoAlpha: 0, scale: 0.9, y: 12, transformOrigin: 'bottom right' });
      hoverBtn(btn);
    }
  });

})();
