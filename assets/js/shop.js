/* Shop: product grid and the product sheet (modal). */
(function () {
  var P = KINESIS.products;
  var fmt = KINESIS.formatINR;

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }

  function media(p, cls) {
    if (p.img) return '<img src="' + p.img + '" alt="' + esc(p.name + ', ' + p.type) + '" loading="lazy"' + (cls ? ' class="' + cls + '"' : '') + '>';
    return '<div class="ph"><span>' + esc(p.phLabel || p.name) + '</span></div>';
  }

  function card(p) {
    return '<button class="card" type="button" data-open="' + p.id + '" data-group="' + p.group + '">' +
      '<div class="card-media">' + media(p) +
        (p.group === 'instrumented' ? '<span class="badge">Sensor inside</span>' : '') +
        '<span class="more" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg></span>' +
      '</div>' +
      '<div class="card-info"><div><span class="mono">' + esc(p.sport) + '</span><h3>' + esc(p.name) + '</h3></div>' +
      '<span class="price">' + fmt(p.price) + '</span></div>' +
    '</button>';
  }

  document.getElementById('grid-instrumented').innerHTML = P.filter(function (p) { return p.group === 'instrumented'; }).map(card).join('');
  document.getElementById('grid-essentials').innerHTML = P.filter(function (p) { return p.group === 'essentials'; }).map(card).join('');

  /* ---------- product sheet ---------- */
  var modal = document.getElementById('modal');
  var content = document.getElementById('sheet-content');
  var lastFocus = null;

  function related(p) {
    var same = P.filter(function (q) { return q.id !== p.id && q.group === p.group; });
    var other = P.filter(function (q) { return q.group !== p.group; });
    return same.concat(other).slice(0, 3);
  }

  function render(p) {
    var opts = (p.options || []).map(function (o, oi) {
      return '<div class="opt"><span class="mono">' + esc(o.label) + '</span><div class="opt-values" role="group" aria-label="' + esc(o.label) + '">' +
        o.values.map(function (v, vi) {
          return '<button type="button" data-opt="' + oi + '" aria-pressed="' + (vi === o.def ? 'true' : 'false') + '">' + esc(v) + '</button>';
        }).join('') + '</div></div>';
    }).join('');

    var measures = p.measures ? '<div class="meta-block"><h4>What it measures</h4><ul>' +
      p.measures.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul></div>' : '';

    var specs = '<div class="meta-block"><h4>Specs</h4><dl class="specs">' +
      p.specs.map(function (s) { return '<div><dt>' + esc(s[0]) + '</dt><dd>' + esc(s[1]) + '</dd></div>'; }).join('') +
      '<div><dt>In the box</dt><dd>' + esc(p.inBox) + '</dd></div></dl></div>';

    var coach = p.group === 'instrumented'
      ? '<div class="coach-note">Comes with 3 months of <strong>Kinesis Coach</strong>, the AI coach in our app that looks at this data and tells you what to improve. <a href="app.html">More about the app →</a></div>'
      : '';

    var hero = p.hero
      ? '<img src="' + p.hero + '" alt="" style="object-position:' + (p.heroPos || 'center') + '">'
      : '<div class="ph"><span>' + esc(p.phLabel || p.name) + ', wide shot</span></div>';

    content.innerHTML =
      '<div class="sheet-hero">' + hero +
        '<div class="sheet-title">' +
          '<span class="eyebrow">' + esc(p.sport) + (p.group === 'instrumented' ? ' · Instrumented' : '') + '</span>' +
          '<h2 class="h-xl" id="sheet-name">' + esc(p.name) + '</h2>' +
          '<div class="sheet-buy">' +
            '<button class="btn btn--primary" type="button">Buy now</button>' +
            '<span class="price">' + fmt(p.price) + '</span>' +
            '<span class="mono">' + esc(p.type) + '</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="sheet-body">' +
        '<div><p>' + esc(p.blurb) + '</p>' + opts + coach + '</div>' +
        '<div>' + measures + specs + '</div>' +
      '</div>' +
      '<div class="sheet-more"><h4>More from Kinesis</h4><div class="grid-3">' + related(p).map(card).join('') + '</div></div>';
  }

  function open(id, fromHash) {
    var p = KINESIS.byId(id);
    if (!p) return;
    render(p);
    if (!modal.classList.contains('open')) lastFocus = document.activeElement;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    modal.scrollTop = 0;
    if (!fromHash) history.replaceState(null, '', '#' + id);
    setTimeout(function () { modal.querySelector('.sheet-close').focus({ preventScroll: true }); }, 50);
  }

  function close() {
    if (!modal.classList.contains('open')) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    history.replaceState(null, '', location.pathname + location.search);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  document.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-open]');
    if (opener) { open(opener.dataset.open); return; }
    if (e.target.closest('[data-close]')) { close(); return; }
    var opt = e.target.closest('[data-opt]');
    if (opt) {
      opt.parentNode.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', b === opt ? 'true' : 'false'); });
    }
    // "Buy now" intentionally does nothing.
  });

  document.addEventListener('keydown', function (e) {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') {
      var f = modal.querySelectorAll('button, a[href]');
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  function fromHash() {
    var id = location.hash.slice(1);
    if (id && KINESIS.byId(id)) open(id, true);
  }
  window.addEventListener('hashchange', fromHash);
  fromHash();
})();
