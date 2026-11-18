/* TRIPLE-T: small motion touches for «رائد Twig» (Salla custom JS).
   1. Thin gold scroll-progress line at the top of the page.
   2. Header gets a soft shadow and gold hairline once you scroll.
   3. Sections and product cards rise in gently as they enter the screen.
   4. Gold shine sweeps across primary buttons on hover.
   5. The cart count badge bumps when its number changes.
   6. Round gold back-to-top button after scrolling down.
   Everything is skipped for visitors who ask for reduced motion, and any
   failure leaves the page exactly as the theme draws it. */
(function () {
  'use strict';
  if (window.__ttTouches) return;
  window.__ttTouches = true;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var css = [
    '.tt-progress{position:fixed;top:0;right:0;left:0;height:2px;z-index:9999;pointer-events:none;',
    'background:linear-gradient(270deg,#fff6dc,#f7d37a 45%,#d4af37);transform-origin:right center;transform:scaleX(0)}',
    'html[dir="ltr"] .tt-progress{transform-origin:left center}',

    '.store-header{transition:box-shadow .3s ease}',
    'body.tt-scrolled .store-header{box-shadow:0 10px 30px rgba(0,0,0,.45),0 1px 0 rgba(247,211,122,.35)}',

    '.tt-reveal{opacity:0;transform:translateY(18px);transition:opacity .5s ease,transform .5s cubic-bezier(.2,.7,.2,1)}',
    '.tt-reveal.tt-in{opacity:1;transform:none}',

    '.s-button-primary,.s-button-primary-outline,.btn--primary{position:relative;overflow:hidden}',
    '.s-button-primary::after,.s-button-primary-outline::after,.btn--primary::after{content:"";position:absolute;top:0;bottom:0;width:40%;left:-60%;',
    'background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent);transform:skewX(-20deg);pointer-events:none}',
    '.s-button-primary:hover::after,.s-button-primary-outline:hover::after,.btn--primary:hover::after{animation:tt-shine .8s ease}',
    '@keyframes tt-shine{to{left:130%}}',

    '.s-cart-summary-count.tt-bump{animation:tt-bump .6s cubic-bezier(.3,1.6,.5,1)}',
    '@keyframes tt-bump{0%{transform:scale(1)}35%{transform:scale(1.45)}100%{transform:scale(1)}}',

    '.tt-top{position:fixed;bottom:22px;left:22px;z-index:60;width:44px;height:44px;border-radius:999px;border:0;cursor:pointer;',
    'display:grid;place-items:center;background:#f7d37a;color:#1a1a1a;box-shadow:0 10px 26px rgba(0,0,0,.45);',
    'opacity:0;transform:translateY(14px);pointer-events:none;transition:opacity .3s ease,transform .3s ease}',
    '.tt-top.tt-show{opacity:1;transform:none;pointer-events:auto}',
    '.tt-top:hover{background:#ffe29a}',
    '.tt-top svg{width:20px;height:20px}',
    '@media (prefers-reduced-motion:reduce){.s-button-primary:hover::after,.s-button-primary-outline:hover::after,.btn--primary:hover::after{animation:none}}'
  ].join('');


  function addStyle() {
    var s = document.createElement('style');
    s.id = 'tt-touches';
    s.textContent = css;
    document.head.appendChild(s);
  }

  function progressAndHeader() {
    var bar = document.createElement('div');
    bar.className = 'tt-progress';
    document.body.appendChild(bar);

    var top = document.createElement('button');
    top.className = 'tt-top';
    top.type = 'button';
    top.setAttribute('aria-label', 'العودة للأعلى');
    top.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>';
    top.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
    document.body.appendChild(top);

    var ticking = false;
    function update() {
      ticking = false;
      var y = window.scrollY || document.documentElement.scrollTop;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
      document.body.classList.toggle('tt-scrolled', y > 30);
      top.classList.toggle('tt-show', y > 600);
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  function reveal() {
    if (reduce || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('tt-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    function scan(root) {
      var nodes = (root || document).querySelectorAll(
        '#main-content section.s-block:not(.s-block--photos-slider), .s-product-card-entry, .s-block--features__item'
      );
      Array.prototype.forEach.call(nodes, function (el) {
        if (el.classList.contains('tt-reveal')) return;
        // Anything already on screen at load stays put, so the first view never blinks.
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.92) return;
        var siblings = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
        el.style.transitionDelay = Math.min(siblings, 4) * 60 + 'ms';
        el.classList.add('tt-reveal');
        io.observe(el);
      });
    }
    scan();
    // Product lists load after the page, so catch cards added later too.
    new MutationObserver(function () { scan(); }).observe(document.body, { childList: true, subtree: true });
  }

  function cartBump() {
    if (reduce) return;
    var last = null;
    setInterval(function () {
      var c = document.querySelector('.store-header .s-cart-summary-count');
      if (!c) return;
      var n = c.textContent.trim();
      if (last !== null && n !== last) {
        c.classList.remove('tt-bump');
        void c.offsetWidth;
        c.classList.add('tt-bump');
      }
      last = n;
    }, 400);
  }

  function start() {
    try { addStyle(); } catch (e) {}
    try { progressAndHeader(); } catch (e) {}
    try { reveal(); } catch (e) {}
    try { cartBump(); } catch (e) {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
