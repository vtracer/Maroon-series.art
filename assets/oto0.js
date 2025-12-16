document.addEventListener("DOMContentLoaded", () => {
  const RE = /[oO]/g;
  const SKIP = 'script, style, textarea, input, select, option, code, [contenteditable], #mlb2-31121650, [class^="ml-"], [class*=" ml-"]';
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const p = node.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        if (p.closest(SKIP)) return NodeFilter.FILTER_REJECT;
        if (!RE.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const toChange = [];
  while (walker.nextNode()) toChange.push(walker.currentNode);
  toChange.forEach(n => { n.nodeValue = n.nodeValue.replace(RE, '0'); });

  if (document.title) document.title = document.title.replace(RE, '0');
});
