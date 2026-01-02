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

    // Add a page-level class to apply heavy visual treatments (jitter, chroma)
    const root = document.documentElement;
    root.classList.add('maroon-glitching-full');

    // wrap viewport (if present) with a jitter wrapper so transforms don't break fixed elements
    let wrap = document.querySelector('.maroon-glitch-wrap');
    let createdWrap = false;
    const viewport = document.getElementById('viewport');
    if (viewport && !wrap){
      wrap = document.createElement('div');
      wrap.className = 'maroon-glitch-wrap';
      viewport.parentNode.insertBefore(wrap, viewport);
      wrap.appendChild(viewport);
      createdWrap = true;
    } else if (wrap) {
      wrap.classList.add('maroon-glitch-wrap');
    }

    // create a noise (snow/static) canvas and animate it
    let noiseCanvas = document.querySelector('.maroon-noise-canvas');
    let noiseCtx = null;
    let noiseRaf = null;
    if (!noiseCanvas){
      noiseCanvas = document.createElement('canvas');
      noiseCanvas.className = 'maroon-noise-canvas';
      document.body.appendChild(noiseCanvas);
      noiseCtx = noiseCanvas.getContext('2d');
    } else {
      noiseCtx = noiseCanvas.getContext('2d');
    }

    function resizeNoise(){
      const w = Math.max(1, Math.floor(window.innerWidth/2));
      const h = Math.max(1, Math.floor(window.innerHeight/2));
      noiseCanvas.width = w;
      noiseCanvas.height = h;
      noiseCanvas.style.width = window.innerWidth + 'px';
      noiseCanvas.style.height = window.innerHeight + 'px';
      noiseCtx.imageSmoothingEnabled = false;
    }

    function renderNoise(){
      const w = noiseCanvas.width;
      const h = noiseCanvas.height;
      const id = noiseCtx.createImageData(w, h);
      const d = id.data;
      // fill with random grayscale noise
      for (let i=0;i<d.length;i+=4){
        const v = Math.random() * 255;
        d[i] = d[i+1] = d[i+2] = v;
        d[i+3] = Math.random() > 0.95 ? 255 : 80; // a few bright specks
      }
      noiseCtx.putImageData(id, 0, 0);
      // draw scaled up to the visible canvas size
      const display = document.createElement('canvas');
      // instead of extra canvas, just scale via drawImage to full size
      noiseCtx.save();
      noiseCtx.restore();
      // schedule next frame
      noiseRaf = requestAnimationFrame(renderNoise);
    }

    // start noise animation
    resizeNoise();
    window.addEventListener('resize', resizeNoise);
    noiseRaf = requestAnimationFrame(renderNoise);

    // intensify per-element glitches during transition
    const elementsToSpasm = Array.from(document.querySelectorAll('.manuscript-text, .manuscript-text *')).filter(Boolean);
    const spasmInterval = setInterval(()=>{
      // pick several random elements and glitch them heavily
      for (let i=0;i<6;i++){
        const el = elementsToSpasm[Math.floor(Math.random()*elementsToSpasm.length)];
        if (el) doTextGlitch(el, 120 + Math.random()*160);
      }
    }, 120);

    // after duration, clean up and navigate
    setTimeout(()=>{
      // stop noise
      if (noiseRaf) cancelAnimationFrame(noiseRaf);
      window.removeEventListener('resize', resizeNoise);
      if (noiseCanvas && noiseCanvas.parentNode) noiseCanvas.parentNode.removeChild(noiseCanvas);
      // remove page-level class and wrapper
      root.classList.remove('maroon-glitching-full');
      if (wrap && createdWrap){
        // unwrap viewport back to original place
        const parent = wrap.parentNode;
        if (viewport) parent.insertBefore(viewport, wrap);
        parent.removeChild(wrap);
      } else if (wrap){
        wrap.classList.remove('maroon-glitch-wrap');
      }
      // clear spasm interval
      clearInterval(spasmInterval);

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
  // --- New Life reveal overlay approach (non-destructive) ---
  function ensureRevealOverlay(el){
    if (!el) return null;
    let ov = el.querySelector(':scope > .nl-reveal-overlay');
    if (!ov){
      ov = document.createElement('span');
      ov.className = 'nl-reveal-overlay';
      ov.setAttribute('aria-hidden','true');
      ov.style.position = 'absolute';
      ov.style.left = '0';
      ov.style.top = '0';
      ov.style.pointerEvents = 'none';
      ov.style.whiteSpace = 'nowrap';
      ov.style.display = 'inline-block';
      ov.style.width = '100%';
      // ensure the parent can position absolute children
      const computed = window.getComputedStyle(el);
      if (computed.position === 'static') el.style.position = 'relative';
      el.appendChild(ov);
    }
    return ov;
  }

  function revealLink(el){
    if (!el) return;
    const hover = el.getAttribute('data-hover') || el.getAttribute('href') || '';
    if (!hover) return;
    const ov = ensureRevealOverlay(el);
    if (!ov) return;
    ov.textContent = hover;
    ov.classList.add('nl-revealed');
    // small glitch effect on the anchor to draw attention
    doTextGlitch(el, 220);
  }

  function hideReveal(el){
    if (!el) return;
    const ov = el.querySelector(':scope > .nl-reveal-overlay');
    if (!ov) return;
    // subtle glitch out, then clear overlay
    doTextGlitch(el, 160);
    setTimeout(()=>{
      ov.classList.remove('nl-revealed');
      ov.textContent = '';
    }, 140);
  }

  function bindNLLinks(){
    const selector = 'a.nl-link, a[href*="newlife2084.com"]';
    const els = Array.from(document.querySelectorAll(selector));
    if (!els.length) return;
    els.forEach(el => {
      el.addEventListener('mouseenter', () => revealLink(el));
      el.addEventListener('focus', () => revealLink(el));
      el.addEventListener('mouseleave', () => hideReveal(el));
      el.addEventListener('blur', () => hideReveal(el));
      el.addEventListener('touchstart', (e)=>{ e.stopPropagation(); revealLink(el); }, {passive:true});
      el.addEventListener('touchend', ()=> hideReveal(el));
      el.addEventListener('touchcancel', ()=> hideReveal(el));
    });
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') bindNLLinks(); else document.addEventListener('DOMContentLoaded', bindNLLinks);

  window.__maroonGlitch = Object.assign(window.__maroonGlitch || {}, { revealLink, hideReveal });
})();
