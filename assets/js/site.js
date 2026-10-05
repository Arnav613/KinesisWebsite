/* Shared header, footer and small page behaviours. */
(function () {
  var page = document.body.getAttribute('data-page');

  var header = document.getElementById('site-header');
  if (header) {
    header.className = 'site-header' + (page === 'home' ? '' : ' solid');
    header.innerHTML =
      '<div class="wrap">' +
        '<div class="avatar" title="Signed in as Arnav" aria-label="Signed in as Arnav">A</div>' +
        '<a class="wordmark" href="index.html" aria-label="Kinesis home">KINESIS</a>' +
        '<nav class="nav" aria-label="Main">' +
          '<a href="index.html"' + (page === 'home' ? ' aria-current="page"' : '') + '>Home</a>' +
          '<a href="shop.html"' + (page === 'shop' ? ' aria-current="page"' : '') + '>Shop</a>' +
          '<a href="app.html"' + (page === 'app' ? ' aria-current="page"' : '') + '>App</a>' +
          '<a href="about.html"' + (page === 'about' ? ' aria-current="page"' : '') + '>About</a>' +
        '</nav>' +
      '</div>';

    var onScroll = function () {
      header.classList.toggle('scrolled', window.scrollY > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  var footer = document.getElementById('site-footer');
  if (footer) {
    footer.className = 'site-footer';
    // Contact details and handle are placeholders until the team supplies real ones.
    footer.innerHTML =
      '<div class="wrap">' +
        '<div class="footer-grid">' +
          '<div class="footer-brand">' +
            '<a class="wordmark" href="index.html">KINESIS</a>' +
            '<p>Data insights you never had before.</p>' +
          '</div>' +
          '<div class="footer-col"><h4>Explore</h4><ul>' +
            '<li><a href="index.html">Home</a></li>' +
            '<li><a href="shop.html">Shop</a></li>' +
            '<li><a href="app.html">App</a></li>' +
            '<li><a href="about.html">About</a></li>' +
          '</ul></div>' +
          '<div class="footer-col"><h4>Contact</h4><ul>' +
            '<li><a href="#" class="ph-text">email@placeholder</a></li>' +
            '<li><a href="#" class="ph-text">+91 phone placeholder</a></li>' +
          '</ul></div>' +
          '<div class="footer-col"><h4>Follow</h4><ul>' +
            '<li><a href="#" class="ph-text">@instagram_placeholder</a></li>' +
          '</ul></div>' +
        '</div>' +
        '<svg class="footer-giant" viewBox="0 0 1000 146" aria-hidden="true"><text x="2" y="140" textLength="996" lengthAdjust="spacingAndGlyphs">KINESIS</text></svg>' +
        '<div class="footer-base">' +
          '<span class="mono">© ' + new Date().getFullYear() + ' Kinesis</span>' +
          '<span class="mono">Photography: Unsplash</span>' +
        '</div>' +
      '</div>';
  }

  // Fade sections in as they enter the viewport.
  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add('in'); });
  }
})();
