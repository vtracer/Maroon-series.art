/**
 * CRT Bezel Light Spill Effect
 * Creates realistic diffused glow on bezel edges from screen content
 */
const BezelGlow = {
  glowLayers: new Map(),
  animationId: null,
  liveDotPhase: 0,

  init() {
    const shell = document.querySelector('.vr-shell');
    if (!shell) return;

    this.shell = shell;
    // mark shell so CSS pseudo bezel can be disabled when JS is active
    this.shell.classList.add('js-bezel-active');
    this.viewport = document.querySelector('.vr-viewport');
    
    this.createGlowLayers();
    // create a bezel-mounted footer (cloned from the real footer)
    this.createBezelFooter();
    this.startAnimation();
    this.setupScrollListener();
  },

  createBezelFooter() {
    const footer = document.getElementById('pageFooter');
    if (!footer || !this.container) return;

    // Deep-clone the footer so links and structure are preserved
    const clone = footer.cloneNode(true);
    // Remove id to avoid duplicates
    clone.removeAttribute('id');
    clone.classList.add('bezel-footer-clone');

    // Style the clone to sit on the bezel bottom and be visible
    clone.style.cssText = `
      position: absolute;
      bottom: 8px;
      left: 50%;
      transform: translateX(-50%);
      pointer-events: auto;
      color: rgba(255,255,255,0.95);
      mix-blend-mode: screen;
      font-family: inherit;
      font-size: 0.86rem;
      text-align: center;
      filter: blur(0.6px);
      opacity: 0.95;
      background: transparent;
      display: inline-block;
    `;

    // Prevent the clone from interfering with layout (non-focusable)
    clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));

    // Append into bezel container
    this.container.appendChild(clone);
    this.bezelFooter = clone;
  },

  createGlowLayers() {
    // Container for all glow effects
    const glowContainer = document.createElement('div');
    glowContainer.className = 'bezel-glow-container';
    glowContainer.style.cssText = `
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 10001;
      overflow: hidden;
      border-radius: 28px;
    `;
    this.shell.insertBefore(glowContainer, this.shell.firstChild);
    this.container = glowContainer;

    // RED LIVE DOT GLOW - Top left, prominent pulsing
    this.createGlow('live-dot', {
      top: '-15px',
      left: '15px',
      width: '220px',
      height: '120px',
      background: 'radial-gradient(ellipse 80% 60% at 30% 85%, rgba(255,40,60,0.7), rgba(255,20,40,0.35) 40%, transparent 75%)',
      blur: 22,
      baseOpacity: 0.75,
      pulseRange: 0.1
    });

    // SECONDARY RED SPILL - Wider subtle spread
    this.createGlow('live-spread', {
      top: '-10px',
      left: '0px',
      width: '350px',
      height: '100px',
      background: 'radial-gradient(ellipse 100% 80% at 15% 100%, rgba(255,60,80,0.4), transparent 65%)',
      blur: 35,
      baseOpacity: 0.55,
      pulseRange: 0.15
    });

    // TITLE GLOW - Top center, amber/white from #MAINTENANCE
    this.createGlow('title', {
      top: '-15px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '700px',
      height: '120px',
      background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(255,240,200,0.4), rgba(255,220,150,0.2) 45%, transparent 80%)',
      blur: 25,
      baseOpacity: 0.45,
      scrollFade: true,
      glitchSync: true
    });

    // TOP EDGE FULL WIDTH GLOW - Ambient screen spill
    this.createGlow('top-ambient', {
      top: '-20px',
      left: '0',
      width: '100%',
      height: '120px',
      background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), rgba(240,245,255,0.28) 40%, rgba(200,200,220,0.12) 70%, transparent)',
      blur: 20,
      baseOpacity: 0.5,
      glitchSync: true
    });

    // TOP CORNERS WHITE BOOST
    this.createGlow('top-left-white', {
      top: '-15px',
      left: '150px',
      width: '300px',
      height: '100px',
      background: 'radial-gradient(ellipse 80% 70% at 50% 100%, rgba(255,255,255,0.32), transparent 70%)',
      blur: 18,
      baseOpacity: 0.4,
      glitchSync: true
    });

    this.createGlow('top-right-white', {
      top: '-15px',
      right: '50px',
      width: '350px',
      height: '100px',
      background: 'radial-gradient(ellipse 80% 70% at 50% 100%, rgba(255,255,255,0.32), transparent 70%)',
      blur: 18,
      baseOpacity: 0.4,
      glitchSync: true
    });

    // LEFT EDGE GLOW - Stronger white from screen content
    this.createGlow('left-edge', {
      top: '5%',
      left: '-25px',
      width: '140px',
      height: '90%',
      background: 'linear-gradient(to right, rgba(255,255,255,0.4), rgba(240,245,255,0.24) 40%, rgba(200,210,220,0.08) 70%, transparent)',
      blur: 15,
      baseOpacity: 0.45
    });

    // LEFT EDGE INNER BOOST
    this.createGlow('left-inner', {
      top: '20%',
      left: '-10px',
      width: '80px',
      height: '60%',
      background: 'linear-gradient(to right, rgba(255,255,255,0.28), transparent 80%)',
      blur: 12,
      baseOpacity: 0.38
    });

    // RIGHT EDGE GLOW - Stronger white from screen content
    this.createGlow('right-edge', {
      top: '5%',
      right: '-25px',
      width: '140px',
      height: '90%',
      background: 'linear-gradient(to left, rgba(255,255,255,0.4), rgba(240,245,255,0.24) 40%, rgba(200,210,220,0.08) 70%, transparent)',
      blur: 15,
      baseOpacity: 0.45
    });

    // RIGHT EDGE INNER BOOST
    this.createGlow('right-inner', {
      top: '20%',
      right: '-10px',
      width: '80px',
      height: '60%',
      background: 'linear-gradient(to left, rgba(255,255,255,0.28), transparent 80%)',
      blur: 12,
      baseOpacity: 0.38
    });

    // BOTTOM EDGE GLOW - Very subtle
    this.createGlow('bottom-edge', {
      bottom: '20px',
      left: '20%',
      width: '60%',
      height: '50px',
      background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(180,180,200,0.15), transparent 70%)',
      blur: 30,
      baseOpacity: 0.1
    });

    // CRT PHOSPHOR FLICKER OVERLAY - Subtle random flicker
    this.createGlow('flicker', {
      top: '0',
      left: '0',
      width: '100%',
      height: '60px',
      background: 'linear-gradient(to bottom, rgba(255,255,255,0.08), transparent)',
      blur: 20,
      baseOpacity: 0.3,
      flickerSpeed: 0.05
    });
  },

  createGlow(id, config) {
    const glow = document.createElement('div');
    glow.className = `bezel-glow bezel-glow--${id}`;
    
    let cssText = `
      position: absolute;
      pointer-events: none;
      mix-blend-mode: screen;
      will-change: opacity;
      filter: blur(${config.blur}px);
      opacity: ${config.baseOpacity};
      background: ${config.background};
    `;

    // Position
    if (config.top) cssText += `top: ${config.top};`;
    if (config.bottom) cssText += `bottom: ${config.bottom};`;
    if (config.left) cssText += `left: ${config.left};`;
    if (config.right) cssText += `right: ${config.right};`;
    if (config.width) cssText += `width: ${config.width};`;
    if (config.height) cssText += `height: ${config.height};`;
    if (config.transform) cssText += `transform: ${config.transform};`;

    glow.style.cssText = cssText;
    this.container.appendChild(glow);

    this.glowLayers.set(id, {
      element: glow,
      config: config,
      currentOpacity: config.baseOpacity
    });
  },

  startAnimation() {
    // Watch for glitch animations on #marqueeTitle using MutationObserver
    this.glitchActive = false;
    const title = document.querySelector('#marqueeTitle');
    if (title) {
      // Watch for .maroon-glitch-overlay getting the .glitch class
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            const overlay = mutation.target;
            if (overlay.classList.contains('glitch')) {
              this.glitchActive = true;
            } else {
              this.glitchActive = false;
            }
          }
          // Also watch for overlay being added with glitch class
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.classList && node.classList.contains('maroon-glitch-overlay')) {
                if (node.classList.contains('glitch')) {
                  this.glitchActive = true;
                }
              }
            });
          }
        });
      });
      
      // Observe the title element for child changes and class changes on children
      observer.observe(title, { 
        childList: true, 
        subtree: true, 
        attributes: true, 
        attributeFilter: ['class'] 
      });
    }

    const animate = () => {
      this.liveDotPhase += 0.03;

      // Pulse the LIVE dot glow
      const liveDot = this.glowLayers.get('live-dot');
      const liveSpread = this.glowLayers.get('live-spread');
      const flicker = this.glowLayers.get('flicker');

      if (liveDot) {
        const pulse = Math.sin(this.liveDotPhase) * 0.5 + 0.5; // 0-1
        const opacity = liveDot.config.baseOpacity + (pulse * liveDot.config.pulseRange);
        liveDot.element.style.opacity = opacity;
      }

      if (liveSpread) {
        const pulse = Math.sin(this.liveDotPhase - 0.3) * 0.5 + 0.5;
        const opacity = liveSpread.config.baseOpacity + (pulse * liveSpread.config.pulseRange);
        liveSpread.element.style.opacity = opacity;
      }

      // Random flicker
      if (flicker && flicker.config.flickerSpeed) {
        const randomFlicker = 0.85 + Math.random() * 0.15;
        flicker.element.style.opacity = flicker.config.baseOpacity * randomFlicker;
      }

      // Glitch sync - flash brighter when title glitches
      this.glowLayers.forEach((data, id) => {
        if (data.config.glitchSync) {
          if (this.glitchActive) {
            // Brief bright flash during glitch
            const flashIntensity = 1.4 + Math.random() * 0.4;
            data.element.style.opacity = data.config.baseOpacity * flashIntensity;
            // Slight horizontal jitter
            const jitterX = (Math.random() - 0.5) * 3;
            data.element.style.transform = (data.config.transform || '') + ` translateX(${jitterX}px)`;
          } else {
            data.element.style.opacity = data.config.baseOpacity;
            data.element.style.transform = data.config.transform || '';
          }
        }
      });

      this.animationId = requestAnimationFrame(animate);
    };

    animate();
  },

  setupScrollListener() {
    const viewport = this.viewport;
    if (!viewport) return;

    const titleGlow = this.glowLayers.get('title');
    const liveDot = this.glowLayers.get('live-dot');
    const liveSpread = this.glowLayers.get('live-spread');

    viewport.addEventListener('scroll', () => {
      const scrollTop = viewport.scrollTop;
      const fadeStart = 50;
      const fadeEnd = 300;

      // Fade title glow as user scrolls
      if (titleGlow && titleGlow.config.scrollFade) {
        const fadeProgress = Math.min(1, Math.max(0, (scrollTop - fadeStart) / (fadeEnd - fadeStart)));
        titleGlow.element.style.opacity = titleGlow.config.baseOpacity * (1 - fadeProgress * 0.7);
      }

      // Slightly reduce LIVE glow on scroll (but keep prominent)
      if (liveDot) {
        const fadeProgress = Math.min(1, Math.max(0, scrollTop / fadeEnd));
        liveDot.config.baseOpacity = 0.7 - (fadeProgress * 0.2);
      }
      if (liveSpread) {
        const fadeProgress = Math.min(1, Math.max(0, scrollTop / fadeEnd));
        liveSpread.config.baseOpacity = 0.5 - (fadeProgress * 0.15);
      }
    });
  },

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.container) {
      this.container.remove();
    }
    this.glowLayers.clear();
    if (this.shell) this.shell.classList.remove('js-bezel-active');
  }
};

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => BezelGlow.init());
} else {
  BezelGlow.init();
}
