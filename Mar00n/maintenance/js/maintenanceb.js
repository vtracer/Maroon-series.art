// maintenanceb auto-advance script
(function(){
  const ROOT = document.documentElement;
  const body = document.body;
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ENTER_DELAY = 120; // small delay before starting entrance
  const VISIBLE_MS = prefersReduced ? 600 : 2200; // visible time before exit (longer for heavy fall)
  const EXIT_MS = 800; // match CSS exit duration
  const NAV_TARGET = '../possession/possession.html';

  function navigate(){
    // final navigation
    window.location.href = NAV_TARGET;
  }

  function startSequence(){
    // entrance
    setTimeout(()=> body.classList.add('enter'), ENTER_DELAY);

    // schedule exit (start after entrance + visible time)
    const exitStart = ENTER_DELAY + VISIBLE_MS;
    const exitTimeout = setTimeout(()=>{
      // start exit
      body.classList.remove('enter');
      body.classList.add('exit');

      // wait for exit animation to finish then navigate
      const totalWait = EXIT_MS + 120;
      setTimeout(navigate, totalWait);
    }, exitStart);

    // accessibility: if reduced motion, navigate sooner
    if (prefersReduced){
      setTimeout(navigate, 600);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startSequence); else startSequence();
})();
