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
    disable(){ glitchEnabled = false; stopGlitchLoop(); },
    doTextGlitch: doTextGlitch
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
  // --- expose utilities to page scripts ---
  function emitGas(area, count = 8){
    if (!area) return;
    const container = area.querySelector('.toxic-gas') || (function(){
      const c = document.createElement('div'); c.className = 'toxic-gas'; area.appendChild(c); return c;
    })();
    for (let i=0;i<count;i++){
      const g = document.createElement('div'); g.className = 'gas';
      // random position
      g.style.left = (10 + Math.random()*80) + '%';
      g.style.top = (60 + Math.random()*20) + '%';
      container.appendChild(g);
      // trigger rise after a tick
      requestAnimationFrame(()=>{ g.classList.add('rise'); g.classList.add('gas-pulse'); });
      // remove when done
      setTimeout(()=>{ if (g && g.parentNode) g.parentNode.removeChild(g); }, 1400 + Math.random()*800);
    }
    // show container briefly
    container.classList.add('active');
    setTimeout(()=> container.classList.remove('active'), 1200 + Math.random()*600);
  }

  function pingFooter(audioMuted){
    try{
      const f = document.getElementById('pageFooter') || document.querySelector('.maroon-footer');
      if (!f) return;
      f.classList.add('footer-alert');
      f.classList.add('crowd-pulse');
      setTimeout(()=> f.classList.remove('footer-alert'), 1600);
      setTimeout(()=> f.classList.remove('crowd-pulse'), 1000);
      // minimal WebAudio ping (no external asset required)
      if (!audioMuted && (window.AudioContext || window.webkitAudioContext)){
        const Ctx = window.AudioContext || window.webkitAudioContext;
        const ctx = new Ctx();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = 720; g.gain.value = 0.0001; // lower, punchier ping
        o.connect(g); g.connect(ctx.destination);
        const now = ctx.currentTime;
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
        o.start(now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
        o.stop(now + 0.24);
        setTimeout(()=>{ try{ ctx.close(); }catch(e){} }, 400);
      }
    }catch(e){ console.warn('pingFooter failed', e); }
  }

  function triggerArchitectIntervention(){
    // Check if audio should be muted
    const audioMuted = window.__maroonGlitch._audioMuted;
    
    // Entrance: dramatic bell + spotlight + ring ropes, then flash + gas + footer ping
    entranceSequence(audioMuted).then(()=>{
      triggerTransition({ duration: 900 });
      // add marquee glow for impact
      const m = document.getElementById('marqueeTitle'); if (m) m.classList.add('glow');
      // small delay then gas + footer ping
      setTimeout(()=>{
        const area = document.getElementById('viewport') || document.body;
        emitGas(area, 12);
        pingFooter(audioMuted);
      }, 160);
      // remove glow after impact
      setTimeout(()=>{ if (m) m.classList.remove('glow'); }, 1800);
    });
  }

  /* Entrance sequence: play bell, raise spotlight and ropes, show announcer banner, then resolve */
  function entranceSequence(audioMuted){
    return new Promise((resolve)=>{
      try{
        const root = document.documentElement;
        // show spotlight
        let sp = document.querySelector('.arena-spotlight');
        if (!sp){ sp = document.createElement('div'); sp.className = 'arena-spotlight'; document.body.appendChild(sp); }
        sp.classList.add('on');

        // add ring ropes overlay
        let ropes = document.querySelector('.ring-ropes');
        if (!ropes){
          ropes = document.createElement('div'); ropes.className = 'ring-ropes';
          for (let i=0;i<3;i++){ const r = document.createElement('div'); r.className = 'rope'; ropes.appendChild(r); }
          document.body.appendChild(ropes);
        }
        // animate ropes in
        setTimeout(()=> ropes.classList.add('active'), 80);

        // announcer banner suppressed

        // bell visual + sound
        const spark = document.createElement('div'); spark.className = 'bell-spark'; spark.style.left = '50%'; spark.style.top = '12%'; document.body.appendChild(spark);
        requestAnimationFrame(()=> spark.classList.add('ring'));
        if (!audioMuted) playBell();

        // crowd swell
        setTimeout(()=>{ if (!audioMuted) playCrowd(0.9); }, 120);

        // remove banner and ropes after short display (longer for drama)
        setTimeout(()=>{ banner.classList.remove('show'); ropes.classList.remove('active'); spark.parentNode && spark.parentNode.removeChild(spark); sp.classList.remove('on'); resolve(); }, 1200);
      }catch(e){ resolve(); }
    });
  }

  /* play a short bell using WebAudio */
  function playBell(){
    try{
      if (!(window.AudioContext || window.webkitAudioContext)) return;
      const Ctx = window.AudioContext || window.webkitAudioContext; const ctx = new Ctx();
      const o1 = ctx.createOscillator(); const o2 = ctx.createOscillator(); const g = ctx.createGain();
      o1.type = 'sine'; o2.type = 'triangle'; o1.frequency.value = 440; o2.frequency.value = 660;
      o1.connect(g); o2.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
      o1.start(); o2.start();
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.9);
      setTimeout(()=>{ try{ o1.stop(); o2.stop(); ctx.close(); }catch(e){} }, 1100);
    }catch(e){ /* ignore */ }
  }

  /* play a quick crowd noise using noise + filter */
  function playCrowd(intensity=0.7){
    try{
      if (!(window.AudioContext || window.webkitAudioContext)) return;
      const Ctx = window.AudioContext || window.webkitAudioContext; const ctx = new Ctx();
      const bufferSize = 2 * ctx.sampleRate; const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i=0;i<bufferSize;i++) output[i] = (Math.random()*2-1) * 0.25;
      const source = ctx.createBufferSource(); source.buffer = noiseBuffer;
      const band = ctx.createBiquadFilter(); band.type = 'bandpass'; band.frequency.value = 1000; band.Q.value = 0.8;
      const g = ctx.createGain(); g.gain.value = 0.0001;
      source.connect(band); band.connect(g); g.connect(ctx.destination);
      source.start();
      g.gain.exponentialRampToValueAtTime(0.12 * intensity, ctx.currentTime + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.9);
      setTimeout(()=>{ try{ source.stop(); ctx.close(); }catch(e){} }, 1100);
    }catch(e){ /* ignore */ }
  }

  // expose APIs and internal helpers for pages
  window.__maroonGlitch = Object.assign(window.__maroonGlitch || {}, {
    revealLink, hideReveal, emitGas, pingFooter, triggerArchitectIntervention,
    // expose doTextGlitch for page scripts that want to call it directly
    doTextGlitch
  });
})();
