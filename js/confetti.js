/* Shared celebration burst for "all done" moments on Holmstead demo pages. Usage: holmConfetti({ accent: '#HEX' }) */
(function () {
  if (window.holmConfetti) return;
  var COLORS = ['#F5A623', '#7C3AED', '#9D1732', '#2BB7A9', '#00BFA5', '#34D399', '#FBC968', '#EC4899'];
  var styleInjected = false;

  function injectStyle() {
    if (styleInjected) return;
    styleInjected = true;
    var css =
      '.holm-confetti-layer{position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden}' +
      '.holm-confetti-piece{position:absolute;top:0;will-change:transform,opacity;animation:holmConfettiFall linear forwards}' +
      '@keyframes holmConfettiFall{0%{transform:translate(0,-10px) rotate(0deg);opacity:1}100%{transform:translate(var(--dx),105vh) rotate(var(--rot));opacity:0.85}}' +
      '@media (prefers-reduced-motion: reduce){.holm-confetti-piece{animation-duration:0.01s !important}}';
    var tag = document.createElement('style');
    tag.textContent = css;
    document.head.appendChild(tag);
  }

  window.holmConfetti = function (opts) {
    opts = opts || {};
    injectStyle();
    var colors = opts.accent ? [opts.accent].concat(COLORS) : COLORS;
    var count = opts.count || 70;
    var layer = document.createElement('div');
    layer.className = 'holm-confetti-layer';
    document.body.appendChild(layer);

    for (var i = 0; i < count; i++) {
      var piece = document.createElement('div');
      piece.className = 'holm-confetti-piece';
      var size = 6 + Math.random() * 6;
      var isCircle = Math.random() < 0.3;
      piece.style.width = size + 'px';
      piece.style.height = (isCircle ? size : size * 0.45) + 'px';
      piece.style.borderRadius = isCircle ? '50%' : '2px';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.left = (Math.random() * 100) + 'vw';
      piece.style.setProperty('--dx', (Math.random() * 40 - 20) + 'vw');
      piece.style.setProperty('--rot', (360 * (2 + Math.random() * 3)) + 'deg');
      var duration = 2.2 + Math.random() * 1.6;
      var delay = Math.random() * 0.4;
      piece.style.animationDuration = duration + 's';
      piece.style.animationDelay = delay + 's';
      layer.appendChild(piece);
    }

    setTimeout(function () { layer.remove(); }, 4300);
  };
})();
