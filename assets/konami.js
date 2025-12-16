(function () {
  //oh hi
  const CODE = [38,38,40,40,37,39,37,39,66,65];
  let i = 0;

  function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  }
  function getCookie(name) {
    return document.cookie.split('; ').reduce((acc, pair) => {
      const [k, v] = pair.split('=');
      return k === name ? decodeURIComponent(v) : acc;
    }, null);
  }

  function applyFromCookie() {
    const v = getCookie('substratum');
    if (v === '1') document.body.classList.add('substratum');
    else if (v === '0') document.body.classList.remove('substratum');
  }
  applyFromCookie();

  window.addEventListener('keydown', (e) => {
    i = (e.keyCode === CODE[i]) ? i + 1 : 0;
    if (i === CODE.length) {
      const enable = !document.body.classList.contains('substratum');
      document.body.classList.toggle('substratum', enable);
      setCookie('substratum', enable ? '1' : '0', 365);
      i = 0;
    }
  });
})();
