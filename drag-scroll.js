(function () {
  var down = false, moved = false;
  var startX = 0, startY = 0, startSX = 0, startSY = 0;
  var THRESH = 4; // px before a press becomes a pan (so plain clicks still fire)

  function interactive(el) {
    return el && el.closest &&
      el.closest('a, button, input, textarea, select, label, [contenteditable], [role="button"], [role="link"]');
  }

  function onDown(e) {
    if (e.button !== 0) return;          // left button only
    if (interactive(e.target)) return;   // let real controls work
    down = true; moved = false;
    startX = e.clientX; startY = e.clientY;
    startSX = window.scrollX; startSY = window.scrollY;
  }

  function onMove(e) {
    if (!down) return;
    if (e.buttons === 0) { onUp(); return; }   // button released off-window
    var dx = e.clientX - startX, dy = e.clientY - startY;
    if (!moved && Math.abs(dx) < THRESH && Math.abs(dy) < THRESH) return;
    if (!moved) {
      moved = true;
      document.documentElement.classList.add('sm-dragging');
    }
    window.scrollTo(startSX - dx, startSY - dy);
    e.preventDefault();
  }

  function suppressClick(e) { e.stopPropagation(); e.preventDefault(); }

  function onUp() {
    if (!down) return;
    down = false;
    if (moved) {
      document.documentElement.classList.remove('sm-dragging');
      // swallow the click that a drag would otherwise trigger on a card/link
      window.addEventListener('click', suppressClick, true);
      setTimeout(function () { window.removeEventListener('click', suppressClick, true); }, 0);
    }
    moved = false;
  }

  window.addEventListener('mousedown', onDown, true);
  window.addEventListener('mousemove', onMove, true);
  window.addEventListener('mouseup', onUp, true);
  document.addEventListener('mouseleave', onUp, true);

  // Grab-hand affordance via a stylesheet rule (survives React re-renders).
  // Interactive controls keep their own cursor; during an active drag every
  // element shows the closed-hand cursor.
  var css = 'body{cursor:grab}' +
    'a,button,input,textarea,select,label,[role="button"],[role="link"]{cursor:auto}' +
    'a,button,[role="button"],[role="link"]{cursor:pointer}' +
    'input,textarea{cursor:text}' +
    'html.sm-dragging,html.sm-dragging *{cursor:grabbing !important;user-select:none !important}';
  function injectStyle() {
    if (!document.head) { requestAnimationFrame(injectStyle); return; }
    var el = document.createElement('style');
    el.id = 'sm-drag-style';
    el.textContent = css;
    document.head.appendChild(el);
  }
  injectStyle();
})();
