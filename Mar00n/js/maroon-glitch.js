(function(){
  // Glitch-only controller — respects prefers-reduced-motion
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const glitchEls = () => Array.from(document.querySelectorAll('[data-glitch], .blink-word, .arch-quote'));
  let glitchEnabled = !reduce;
  let glitchInterval = null;

  function doTextGlitch(el, duration=260){
    if (!glitchEnabled || !el) return;
    const text = el.innerText || '';
    if (!text) return;

    // create a non-layout overlay inside the element so we can render garbled text
    const rect = el.getBoundingClientRect();
    const prevPos = el.style.position || '';
    const computed = window.getComputedStyle(el);
    if (computed.position === 'static') el.style.position = 'relative';

    let overlay = el.querySelector(':scope > .maroon-glitch-overlay');
    if (!overlay){
      overlay = document.createElement('span');
      overlay.className = 'maroon-glitch-overlay';
      overlay.setAttribute('aria-hidden','true');
      // ensure overlay matches text baseline and sizing
      overlay.style.font = 'inherit';
      overlay.style.lineHeight = 'inherit';
      overlay.style.left = '0';
      overlay.style.top = '0';
      el.appendChild(overlay);
    }
    overlay.style.width = Math.ceil(rect.width) + 'px';

    const chars = '01█▓▌▐░▒#%$@';
    let garbled = '';
    for (let i=0;i<text.length;i++) garbled += chars.charAt(Math.floor(Math.random()*chars.length));

    // render garbled into overlay without touching document flow
    overlay.textContent = garbled;
    overlay.classList.add('glitch');

    setTimeout(()=>{
      overlay.classList.remove('glitch');
      overlay.textContent = '';
      if (!prevPos) el.style.position = prevPos;
    }, duration + Math.random()*220);
  }

  function startGlitchLoop(){ if (glitchInterval) return; glitchInterval = setInterval(()=>{
      const els = glitchEls();
      if (Math.random() > 0.82 && els.length){ const el = els[Math.floor(Math.random()*els.length)]; if (el) doTextGlitch(el); }
    }, 420);
  }
  function stopGlitchLoop(){ if (glitchInterval){ clearInterval(glitchInterval); glitchInterval = null; } }
  if (glitchEnabled) startGlitchLoop();
  if (reduce){ console.log('prefers-reduced-motion: active — glitch limited'); stopGlitchLoop(); }

  // small global accessor for debugging/testing
  window.__maroonGlitch = {
    enable(){ glitchEnabled = true; startGlitchLoop(); },
    disable(){ glitchEnabled = false; stopGlitchLoop(); }
  };

  // optional: sample arch-quote periodic class toggle (non-destructive)
  function initArchQuote(){
    const quotes = document.querySelectorAll('.arch-quote');
    if (!quotes || !quotes.length) return;
    setInterval(()=>{ quotes.forEach(q => { if (Math.random() > 0.86) { q.classList.add('glitching'); setTimeout(()=>q.classList.remove('glitching'), 700 + Math.random()*800); } }); }, 600);
  }
  if (!reduce) initArchQuote();

  /* Trigger a full-screen glitch then call callback (or navigate) */
  function triggerTransition(opts){
    opts = opts || {};
    const duration = typeof opts.duration === 'number' ? opts.duration : 3800; // ms
    const target = typeof opts.target === 'string' ? opts.target : null;
    if (reduce){
      // respect reduced motion — navigate immediately
      if (target) window.location.href = target;
      return;
    }

    // ensure only one overlay
    let overlay = document.querySelector('.maroon-fullscreen-glitch');
    if (!overlay){
      overlay = document.createElement('div');
      overlay.className = 'maroon-fullscreen-glitch';
      document.body.appendChild(overlay);
    }

    // intensify local glitches while overlay runs
    const prevEnabled = glitchEnabled;
    glitchEnabled = true;
    startGlitchLoop();

    // add a brief flash sequence for dramatic effect
    overlay.classList.add('flash');
    setTimeout(()=> overlay.classList.remove('flash'), 800);

    // lock scroll
    const prevOverflow = document.documentElement.style.overflow || '';
    document.documentElement.style.overflow = 'hidden';

    // after duration, clean up and navigate
    setTimeout(()=>{
      glitchEnabled = prevEnabled;
      if (!glitchEnabled) stopGlitchLoop();
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
      document.documentElement.style.overflow = prevOverflow;
      if (target) window.location.href = target;
    }, duration);
  }

  // expose triggerTransition
  window.__maroonGlitch = Object.assign(window.__maroonGlitch || {}, {
    triggerTransition
  });
})();
