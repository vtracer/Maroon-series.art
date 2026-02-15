(function () {
  // Skip on touch devices
  if (window.matchMedia && matchMedia('(pointer: coarse)').matches) return;

  const cursor = document.createElement('div');
  cursor.className = 'cursor';
  document.body.appendChild(cursor);
  document.body.classList.add('cursor-hidden');

  if (!cursor) return; // Safety check

  window.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
  });

  document.addEventListener('mouseover', (e) => {
    if (e.target.closest('a,button,[role="button"]')) cursor.classList.add('link');
    if (e.target.closest('input,textarea,select,.ml-embedded input')) {
      cursor.style.display = 'none';
      document.body.classList.remove('cursor-hidden');
    }
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest('a,button,[role="button"]')) cursor.classList.remove('link');
    if (e.target.closest('input,textarea,select,.ml-embedded input')) {
      cursor.style.display = 'block';
      document.body.classList.add('cursor-hidden');
    }
  });
})();

