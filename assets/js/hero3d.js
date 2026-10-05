/* ==========================================================================
   KINESIS — 3D product hero
   - Impact glove: edited GLB model (assets/models/impact-glove.js)
   - Vortex / Titan / Scythe: procedural models with generated PBR textures
   - Exoskeleton view: x-ray shell + sensors, circuits and cells inside
   - Fixed callout text; only the leader lines follow the model
   Needs window.THREE (set by the module bootstrap in index.html).
   ========================================================================== */
(function () {
  var hero = document.querySelector('.hero');
  if (!hero) return;

  var started = false;
  function tryStart() {
    if (started || !window.THREE || !window.THREE.GLTFLoader) return;
    started = true;
    var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.race([fontsReady, new Promise(function (r) { setTimeout(r, 1500); })]).then(init);
  }
  window.addEventListener('kinesis:three', tryStart);
  tryStart();
  setTimeout(function () { if (!started) hero.classList.add('no-webgl'); }, 20000);

  function init() {
  var T = window.THREE, V3 = T.Vector3;
  var TAU = Math.PI * 2;
  var ACCENT = 0xb4f542;
  var Z_UP = new V3(0, 0, 1), Y_UP = new V3(0, 1, 0);

  /* ---------------- math ---------------- */
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function sstep(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function easeInOut(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function asFn(r) { return typeof r === 'function' ? r : function () { return r; }; }
  function spow(x, e) { return Math.sign(x) * Math.pow(Math.abs(x), e); }
  function capR(t, r, c0, c1) {
    var k = 1;
    if (c0 && t < c0) { var a = 1 - t / c0; k = Math.sqrt(Math.max(0, 1 - a * a)); }
    if (c1 && t > 1 - c1) { var b = 1 - (1 - t) / c1; k = Math.min(k, Math.sqrt(Math.max(0, 1 - b * b))); }
    return r * k;
  }

  class Ellipse3 extends T.Curve {
    constructor(cx, cy, cz, a, b, plane, a0, a1) {
      super();
      this.c = new V3(cx, cy, cz); this.a = a; this.b = b; this.plane = plane || 'xy';
      this.a0 = a0 === undefined ? 0 : a0; this.a1 = a1 === undefined ? TAU : a1;
    }
    getPoint(t, target) {
      target = target || new V3();
      var ang = this.a0 + (this.a1 - this.a0) * t;
      var x = Math.cos(ang) * this.a, y = Math.sin(ang) * this.b;
      if (this.plane === 'xy') target.set(this.c.x + x, this.c.y + y, this.c.z);
      else target.set(this.c.x + x, this.c.y, this.c.z + y);
      return target;
    }
    at(deg) {
      var r = deg * Math.PI / 180;
      return new V3(this.c.x + Math.cos(r) * this.a, this.c.y + Math.sin(r) * this.b, this.c.z);
    }
  }

  /* ---------------- parametric surface ----------------
     fn(u, v, out): u wraps around (0..1), v runs along (0..1).
     uv attribute = (v, u). Normals from numeric derivatives.            */
  function surface(nu, nv, fn, o) {
    o = o || {};
    var pos = [], nor = [], uvs = [], idx = [];
    var p = new V3(), a = new V3(), b = new V3(), c = new V3(), d = new V3(), n = new V3(), ctr = new V3(), tmp = new V3();
    var e = 1e-3, ev = 0.012;
    for (var j = 0; j <= nv; j++) {
      var v = o.vMap ? o.vMap(j / nv) : j / nv;
      var vc = o.closedV ? v : clamp(v, ev, 1 - ev);
      for (var i = 0; i <= nu; i++) {
        var u = i / nu;
        fn(u, v, p);
        fn(u + e, vc, a); fn(u - e, vc, b); a.sub(b);
        fn(u, vc + e, c); fn(u, vc - e, d); c.sub(d);
        n.crossVectors(a, c);
        if (n.lengthSq() < 1e-16) n.copy(p);
        n.normalize();
        if (o.center) { o.center(u, v, ctr); if (n.dot(tmp.copy(p).sub(ctr)) < 0) n.negate(); }
        pos.push(p.x, p.y, p.z); nor.push(n.x, n.y, n.z); uvs.push(v, u);
      }
    }
    var row = nu + 1;
    for (j = 0; j < nv; j++) for (i = 0; i < nu; i++) {
      var i0 = j * row + i, i1 = i0 + 1, i2 = i0 + row, i3 = i2 + 1;
      idx.push(i0, i2, i1, i1, i2, i3);
    }
    var k0 = Math.floor(nv / 2) * row + Math.floor(nu / 4);
    var P0 = new V3().fromArray(pos, k0 * 3), P1 = new V3().fromArray(pos, (k0 + row) * 3), P2 = new V3().fromArray(pos, (k0 + 1) * 3);
    if (new V3().crossVectors(P1.sub(P0), P2.sub(P0)).dot(new V3().fromArray(nor, k0 * 3)) < 0) {
      for (var q = 0; q < idx.length; q += 3) { var s = idx[q + 1]; idx[q + 1] = idx[q + 2]; idx[q + 2] = s; }
    }
    var geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
    geo.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
    geo.setIndex(idx);
    if (o.tangents) geo.computeTangents();

    var wire = null;
    if (o.ring || o.line) {
      var w = [], A = new V3(), B = new V3();
      var P = function (jj, ii, out) {
        var k = (jj * row + ii) * 3;
        return out.set(pos[k] + nor[k] * .004, pos[k + 1] + nor[k + 1] * .004, pos[k + 2] + nor[k + 2] * .004);
      };
      if (o.ring) for (j = 0; j <= nv; j += o.ring) for (i = 0; i < nu; i++) { P(j, i, A); P(j, i + 1, B); w.push(A.x, A.y, A.z, B.x, B.y, B.z); }
      if (o.line) for (i = 0; i < nu; i += o.line) for (j = 0; j < nv; j++) { P(j, i, A); P(j + 1, i, B); w.push(A.x, A.y, A.z, B.x, B.y, B.z); }
      wire = new T.BufferGeometry();
      wire.setAttribute('position', new T.Float32BufferAttribute(w, 3));
    }
    return { geo: geo, wire: wire };
  }

  // Tube along a curve. Cross-section is a superellipse (p = 2 round, higher = boxier).
  function sweep(curve, o) {
    o = o || {};
    var rN = asFn(o.rN !== undefined ? o.rN : o.r), rB = asFn(o.rB !== undefined ? o.rB : (o.rN !== undefined ? o.rN : o.r));
    var up = o.up || Z_UP, closed = !!o.closed, ex = 2 / (o.p || 2);
    var P = new V3(), Tn = new V3(), N = new V3(), B = new V3();
    function frame(v) {
      var t = closed ? ((v % 1) + 1) % 1 : clamp(v, 0, 1);
      curve.getPointAt(t, P);
      curve.getTangentAt(t, Tn).normalize();
      N.crossVectors(up, Tn);
      if (N.lengthSq() < 1e-8) N.crossVectors(new V3(1, 0, 0), Tn);
      N.normalize();
      B.crossVectors(Tn, N).normalize();
      return t;
    }
    var fn = function (u, v, out) {
      var t = frame(v), ang = u * TAU;
      var cn = spow(Math.cos(ang), ex) * rN(t), cb = spow(Math.sin(ang), ex) * rB(t);
      out.set(P.x + N.x * cn + B.x * cb, P.y + N.y * cn + B.y * cb, P.z + N.z * cn + B.z * cb);
    };
    var center = function (u, v, out) { curve.getPointAt(closed ? ((v % 1) + 1) % 1 : clamp(v, 0, 1), out); };
    return surface(o.radial || 20, o.segs || 64, fn, {
      closedV: closed,
      vMap: closed ? null : function (s) { return .5 - .5 * Math.cos(Math.PI * s); },
      center: center, ring: o.ring, line: o.line, tangents: o.tangents
    });
  }

  // Straight tube along y with a rounded-octagon section (racket and paddle handles).
  function octHandle(y0, y1, rx, rz, round) {
    return surface(48, 6, function (u, v, o) {
      var th = u * TAU, y = lerp(y0, y1, v);
      var ph = ((th + Math.PI / 8) % (Math.PI / 4) + Math.PI / 4) % (Math.PI / 4) - Math.PI / 8;
      var k = lerp(1 / Math.cos(ph), 1, round);
      return o.set(Math.cos(th) * rx * k, y, Math.sin(th) * rz * k);
    }, { center: function (u, v, o) { o.set(0, lerp(y0, y1, v), 0); }, ring: 3, line: 6, tangents: true });
  }

  function roundedRect(x, y, w, h, rt, rb) {
    var s = new T.Shape();
    s.moveTo(x + rb, y);
    s.lineTo(x + w - rb, y);
    s.quadraticCurveTo(x + w, y, x + w, y + rb);
    s.lineTo(x + w, y + h - rt);
    s.quadraticCurveTo(x + w, y + h, x + w - rt, y + h);
    s.lineTo(x + rt, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - rt);
    s.lineTo(x, y + rb);
    s.quadraticCurveTo(x, y, x + rb, y);
    return s;
  }

  // paddle face: rounded top, straight sides, then shoulders that sweep into a narrow throat.
  // hw = half width, top = top edge, rt = top corner radius, sh = where the shoulders start,
  // nw = throat half width, ny = where the throat runs straight, nb = throat bottom.
  function paddleShape(hw, top, rt, sh, nw, ny, nb) {
    var s = new T.Shape(), r = .035, d = sh - ny, kn = d * .32, ks = d * .55;
    s.moveTo(-nw + r, nb);
    s.lineTo(nw - r, nb);
    s.quadraticCurveTo(nw, nb, nw, nb + r);
    s.lineTo(nw, ny);
    s.bezierCurveTo(nw, ny + kn, hw, sh - ks, hw, sh);
    s.lineTo(hw, top - rt);
    s.quadraticCurveTo(hw, top, hw - rt, top);
    s.lineTo(-hw + rt, top);
    s.quadraticCurveTo(-hw, top, -hw, top - rt);
    s.lineTo(-hw, sh);
    s.bezierCurveTo(-hw, sh - ks, -nw, ny + kn, -nw, ny);
    s.lineTo(-nw, nb + r);
    s.quadraticCurveTo(-nw, nb, -nw + r, nb);
    return s;
  }

  /* ---------------- generated textures ---------------- */
  var MAX_ANISO = 8;
  function canvasTex(w, h, draw, o) {
    o = o || {};
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    var t = new T.CanvasTexture(c);
    t.colorSpace = o.data ? T.NoColorSpace : T.SRGBColorSpace;
    t.anisotropy = MAX_ANISO;
    if (o.repeat) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(o.repeat[0], o.repeat[1]); }
    return t;
  }
  // Normal map from a height function h(x, y) -> 0..1 (tileable if h is).
  function normalTex(w, h, heightFn, strength, repeat) {
    var Hf = new Float32Array(w * h);
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) Hf[y * w + x] = heightFn(x, y, w, h);
    return canvasTex(w, h, function (g) {
      var img = g.createImageData(w, h), D = img.data;
      for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
        var xl = (x - 1 + w) % w, xr = (x + 1) % w, yu = (y - 1 + h) % h, yd = (y + 1) % h;
        var du = (Hf[y * w + xr] - Hf[y * w + xl]) * strength, dv = (Hf[yu * w + x] - Hf[yd * w + x]) * strength;
        var nx = -du, ny = -dv, l = Math.sqrt(nx * nx + ny * ny + 1);
        var k = (y * w + x) * 4;
        D[k] = (nx / l * .5 + .5) * 255; D[k + 1] = (ny / l * .5 + .5) * 255; D[k + 2] = (1 / l * .5 + .5) * 255; D[k + 3] = 255;
      }
      g.putImageData(img, 0, 0);
    }, { data: true, repeat: repeat || [1, 1] });
  }
  // 2x2 twill carbon weave, 4 bundles per tile.
  function weaveH(x, y, w) {
    var c = w / 4, bx = Math.floor(x / c), by = Math.floor(y / c), lx = (x % c) / c, ly = (y % c) / c;
    var warp = ((bx + by) % 4) < 2;
    var across = warp ? ly : lx, along = warp ? lx : ly;
    return Math.pow(Math.sin(Math.PI * across), .6) * (.75 + .25 * Math.sin(Math.PI * along)) + .06 * Math.sin(across * Math.PI * 9);
  }
  // Overgrip / grip wrap: diagonal overlapping ridges with a fine perforation.
  function wrapH(x, y, w) {
    var f = ((x + y) / (w / 4)) % 1;
    var ridge = f < .14 ? f / .14 : 1 - (f - .14) * .35;
    var hole = ((x % 8) < 2 && (y % 8) < 2) ? -.25 : 0;
    return ridge + hole;
  }
  function rubberH(x, y) {
    return .5 + .25 * Math.sin(x * .55) * Math.sin(y * .55) + .15 * Math.sin((x + y) * .9);
  }
  var noiseSeed = 7;
  function rnd() { noiseSeed = (noiseSeed * 16807) % 2147483647; return noiseSeed / 2147483647; }
  function noiseTex(size, strength) {
    var N = new Float32Array(size * size);
    for (var i = 0; i < N.length; i++) N[i] = rnd();
    var Bl = new Float32Array(N.length);
    for (var y = 0; y < size; y++) for (var x = 0; x < size; x++) {
      var s = 0;
      for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) s += N[((y + dy + size) % size) * size + (x + dx + size) % size];
      Bl[y * size + x] = s / 9;
    }
    return normalTex(size, size, function (x, y) { return Bl[y * size + x]; }, strength || 2);
  }

  var TX = {};   // shared textures, built once
  function buildTextures() {
    TX.weave = normalTex(128, 128, weaveH, 2.2);
    TX.wrap = normalTex(128, 128, wrapH, 3);
    TX.rubber = normalTex(64, 64, rubberH, 2.5);
    TX.noise = noiseTex(128, 2.4);
    TX.grain = noiseTex(256, 3.2);
    TX.shadow = canvasTex(256, 256, function (g, w, h) {
      var gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(.55, 'rgba(0,0,0,.18)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    });
  }
  function rep(tex, x, y) {
    var t = tex.clone(); t.needsUpdate = true;
    t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(x, y);
    return t;
  }
  function logoDisc() {
    return canvasTex(256, 256, function (g, w, h) {
      g.fillStyle = '#101216'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#b4f542'; g.lineWidth = 6; g.beginPath(); g.arc(w / 2, h / 2, w * .36, 0, TAU); g.stroke();
      g.fillStyle = '#e8edf3'; g.font = '800 110px Archivo, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('K', w / 2, h / 2 + 6);
    });
  }

  /* ---------------- x-ray shader for the exoskeleton view ---------------- */
  function addXray(m, uniform) {
    m.onBeforeCompile = function (sh) {
      sh.uniforms.uExo = uniform;
      sh.fragmentShader = 'uniform float uExo;\n' + sh.fragmentShader.replace('#include <opaque_fragment>', [
        '#include <opaque_fragment>',
        'float kFr = pow(1.0 - clamp(abs(dot(normalize(normal), normalize(vViewPosition))), 0.0, 1.0), 2.4);',
        'vec3 kX = gl_FragColor.rgb * 0.12 + vec3(0.66, 0.93, 0.24) * kFr * 1.25;',
        'gl_FragColor.rgb = mix(gl_FragColor.rgb, kX, uExo);',
        'gl_FragColor.a = mix(gl_FragColor.a, 0.05 + kFr * 0.6, uExo);'
      ].join('\n'));
    };
    m.customProgramCacheKey = function () { return 'kinesis-xray'; };
  }

  /* ---------------- product container ---------------- */
  function Product(id) {
    this.id = id;
    this.root = new T.Group();
    this.model = new T.Group();
    this.root.add(this.model);
    this.inner = new T.Group();
    this.wires = new T.Group(); this.wires.visible = false;
    this.model.add(this.inner, this.wires);
    this.xr = { value: 0 };
    this.shellMats = []; this.wireMats = []; this.innerMats = []; this.glowMats = [];
    this.lining = []; this.flows = []; this.pts = {};
    this.ready = true;
  }
  Product.prototype.adopt = function (m) {
    if (this.shellMats.indexOf(m) >= 0) return m;
    m.userData.side = m.side;
    // take the gloss down a notch on every shell (roughness-mapped ones keep their map)
    if (!m.roughnessMap) m.roughness = Math.min(1, m.roughness + .12);
    if (m.clearcoat) { m.clearcoat *= .55; m.clearcoatRoughness = Math.min(1, m.clearcoatRoughness + .15); }
    m.envMapIntensity = 1.35;
    addXray(m, this.xr);
    this.shellMats.push(m);
    return m;
  };
  Product.prototype.shell = function (geo, opts, wire, parent) {
    var m = this.adopt(new T.MeshPhysicalMaterial(opts));
    var mesh = new T.Mesh(geo, m);
    mesh.castShadow = true;
    (parent || this.model).add(mesh);
    if (wire) this.wire(wire);
    return mesh;
  };
  Product.prototype.wire = function (geo) {
    var m = new T.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0, depthWrite: false });
    this.wireMats.push(m);
    var l = new T.LineSegments(geo, m);
    this.wires.add(l);
    return l;
  };
  Product.prototype.part = function (geo, opts, parent) {
    var m = new T.MeshStandardMaterial(Object.assign({ transparent: true, opacity: 0 }, opts));
    m.userData.base = 1; m.visible = false;
    this.innerMats.push(m);
    var mesh = new T.Mesh(geo, m);
    (parent || this.inner).add(mesh);
    return mesh;
  };
  Product.prototype.glow = function (geo, parent) {
    var mesh = this.part(geo, { color: 0x8ccc24, emissive: ACCENT, emissiveIntensity: 1.1, roughness: .4 }, parent);
    this.glowMats.push(mesh.material);
    return mesh;
  };
  Product.prototype.innerLines = function (geo, opacity) {
    var m = new T.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0, depthWrite: false });
    m.userData.base = opacity; m.visible = false;
    this.innerMats.push(m);
    var l = new T.LineSegments(geo, m);
    this.inner.add(l);
    return l;
  };
  Product.prototype.flow = function (curve, count, speed) {
    var geo = new T.SphereGeometry(.02, 10, 8);
    for (var i = 0; i < count; i++) {
      var m = new T.MeshBasicMaterial({ color: 0xe9ff9a, transparent: true, opacity: 0 });
      m.userData.base = 1; m.visible = false;
      this.innerMats.push(m);
      var s = new T.Mesh(geo, m);
      this.inner.add(s);
      this.flows.push({ curve: curve, mesh: s, off: i / count, speed: speed || .35 });
    }
  };
  Product.prototype.point = function (name, pos, n) {
    this.pts[name] = { p: pos.clone(), n: (n || new V3(0, 0, 1)).clone().normalize() };
  };
  Product.prototype.setExo = function (t) {
    this.xr.value = t;
    this.shellMats.forEach(function (m) {
      var on = t > .001;
      if (m.transparent !== on) { m.transparent = on; m.needsUpdate = true; }
      m.depthWrite = t < .35;
      m.side = on ? T.FrontSide : m.userData.side;
    });
    this.lining.forEach(function (o) { o.visible = t < .3; });
    this.wireMats.forEach(function (m) { m.opacity = .18 * t; });
    this.wires.visible = t > .01;
    this.innerMats.forEach(function (m) { m.opacity = t * m.userData.base; m.visible = t > .01; });
  };
  Product.prototype.tick = function (time) {
    if (this.xr.value < .01) return;
    var pulse = 1 + .45 * Math.sin(time * 3.2);
    this.glowMats.forEach(function (m) { m.emissiveIntensity = pulse; });
    this.flows.forEach(function (f) { f.curve.getPointAt((time * f.speed + f.off) % 1, f.mesh.position); });
  };
  // Resolve callout anchors: {pt:'name'} or {ray:[ox,oy,oz, dx,dy,dz]} against the shell.
  var rc = new T.Raycaster();
  Product.prototype.resolve = function (defs, targets) {
    var self = this;
    self.model.updateMatrixWorld(true);
    return defs.map(function (d) {
      var p, n;
      if (d.pt && self.pts[d.pt]) { p = self.pts[d.pt].p; n = self.pts[d.pt].n; }
      else if (d.ray) {
        rc.set(new V3(d.ray[0], d.ray[1], d.ray[2]), new V3(d.ray[3], d.ray[4], d.ray[5]).normalize());
        var hit = rc.intersectObjects(targets || self.model.children, true).filter(function (h) {
          return h.object.isMesh && self.shellMats.indexOf(h.object.material) >= 0;
        })[0];
        if (hit) {
          p = self.model.worldToLocal(hit.point.clone());
          n = hit.face ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld) : Z_UP.clone();
        }
      }
      if (!p) { p = new V3(); n = Z_UP.clone(); }
      if (d.n) n = new V3().fromArray(d.n);
      return { t: d.t, d: d.d, at: p.clone(), n: n.clone().normalize() };
    });
  };
  function castOn(objects, from, dir) {
    rc.set(from, dir.clone().normalize());
    var h = rc.intersectObjects(objects, true)[0];
    if (!h) return null;
    return { p: h.point.clone(), n: h.face.normal.clone().transformDirection(h.object.matrixWorld).normalize() };
  }

  /* =====================================================================
     IMPACT — edited GLB glove + sensors placed by raycasting its surface
     ===================================================================== */
  // Trial: black glove and racket. Set to false to go back to the red glove / royal blue racket.
  var BLACK_TRIAL = true;
  // Turn the red leather of a glove texture into black leather, keeping the white wordmark and stitching.
  function blackenLeather(tex) {
    var img = tex.image, w = img.width, h = img.height;
    var t = canvasTex(w, h, function (g) {
      g.drawImage(img, 0, 0);
      var d = g.getImageData(0, 0, w, h), D = d.data;
      for (var i = 0; i < D.length; i += 4) {
        var r = D[i], gg = D[i + 1], b = D[i + 2];
        var redness = clamp((r - Math.max(gg, b)) / (r + 1) * 1.6, 0, 1);   // 1 on the red leather, 0 on white/grey
        var lum = .3 * r + .59 * gg + .11 * b;
        var k = lum * .42 + 10;   // near-black leather that keeps the texture's shading
        // everything else on this texture is neutral (white wordmark, dark stitching), so drop any pink cast
        var v = lerp(lum, k, redness);
        D[i] = v; D[i + 1] = v; D[i + 2] = v * 1.04;
      }
      // the small "STRIKE · INSTRUMENTED" line above the wordmark: pale ink -> volt
      var x0 = Math.round(w * .27), x1 = Math.round(w * .47), y0 = Math.round(h * .805), y1 = Math.round(h * .832);
      for (var y = y0; y < y1; y++) for (var x = x0; x < x1; x++) {
        var j = (y * w + x) * 4, ink = clamp((D[j + 1] - 70) / 90, 0, 1);
        if (ink <= 0) continue;
        D[j] = lerp(D[j], 180, ink); D[j + 1] = lerp(D[j + 1], 245, ink); D[j + 2] = lerp(D[j + 2], 66, ink);
      }
      g.putImageData(d, 0, 0);
    });
    t.flipY = tex.flipY; t.wrapS = tex.wrapS; t.wrapT = tex.wrapT;
    t.offset.copy(tex.offset); t.repeat.copy(tex.repeat); t.rotation = tex.rotation; t.center.copy(tex.center);
    t.channel = tex.channel;
    return t;
  }

  // The strap patch texture has the old, yellower volt baked in: nudge it to the current volt.
  function greenerVolt(tex) {
    var img = tex.image, w = img.width, h = img.height;
    var t = canvasTex(w, h, function (g) {
      g.drawImage(img, 0, 0);
      var d = g.getImageData(0, 0, w, h), D = d.data;
      for (var i = 0; i < D.length; i += 4) {
        var k = clamp((D[i + 1] - D[i + 2] - 60) / 100, 0, 1);   // 1 on volt, 0 on black / grey
        D[i] *= 1 - .1 * k; D[i + 2] *= 1 + .1 * k;
      }
      g.putImageData(d, 0, 0);
    });
    t.flipY = tex.flipY; t.wrapS = tex.wrapS; t.wrapT = tex.wrapT;
    t.offset.copy(tex.offset); t.repeat.copy(tex.repeat); t.rotation = tex.rotation; t.center.copy(tex.center);
    t.channel = tex.channel;
    return t;
  }

  function buildImpact(p, gltf) {
    var g = gltf.scene;
    p.model.add(g);
    p.model.updateMatrixWorld(true);
    var box = new T.Box3().setFromObject(g);
    g.scale.multiplyScalar(3.35 / (box.max.y - box.min.y));
    p.model.updateMatrixWorld(true);
    box.setFromObject(g);
    var strap = null, leather = [];
    g.traverse(function (o) {
      if (!o.isMesh) return;
      var mat = o.material, name = (mat && mat.name) || '';
      o.castShadow = true;
      ['map', 'normalMap'].forEach(function (k) { if (mat && mat[k]) { mat[k].anisotropy = MAX_ANISO; mat[k].needsUpdate = true; } });
      if (/Tube/i.test(o.name) && !strap) strap = o;
      if (name === 'parte_de_adentro') { p.lining.push(o); return; }
      if (name === 'Mat.1' && mat.map) mat.map = greenerVolt(mat.map);
      if (name === 'guante' || name === 'dedo') {
        // leather: sharper base normals, a satin top coat and a fine grain so it catches light like hide
        var lm = new T.MeshPhysicalMaterial({ name: mat.name, map: mat.map, normalMap: mat.normalMap,
          color: mat.color, side: mat.side, metalness: 0 });
        if (mat.normalScale) lm.normalScale.copy(mat.normalScale);
        lm.roughness = .74; lm.normalScale.set(1.3, 1.3);
        if (BLACK_TRIAL && lm.map) lm.map = blackenLeather(lm.map);
        else lm.color.multiplyScalar(.77);   // a deeper red
        o.material = mat = lm;
        leather.push(o);
      }
      p.adopt(mat);
      if (leather.indexOf(o) >= 0) mat.envMapIntensity = .75;
    });
    // pivot on the cuff axis so it turns like a glove on a stand
    var sb = strap ? new T.Box3().setFromObject(strap) : box;
    var sc = sb.getCenter(new V3()), bc = box.getCenter(new V3());
    g.position.sub(new V3(sc.x, bc.y, sc.z));
    p.model.updateMatrixWorld(true);

    /* --- inside --- */
    var padGeo = new T.BoxGeometry(.11, .11, .022), sum = new V3(), nsum = new V3(), cnt = 0;
    [-.3, -.12, .06].forEach(function (z) {
      [-.27, -.09, .09, .27].forEach(function (x) {
        var h = castOn(leather, new V3(x, 5, z), new V3(0, -1, 0));
        if (!h) return;
        var pad = p.glow(padGeo);
        pad.position.copy(h.p).addScaledVector(h.n, -.1);
        pad.lookAt(pad.position.clone().add(h.n));
        sum.add(pad.position); nsum.add(h.n); cnt++;
      });
    });
    sum.multiplyScalar(1 / Math.max(1, cnt));
    p.point('pads', sum, cnt ? nsum.normalize().add(new V3(0, 0, .6)) : Y_UP);

    var flexPts = [sum.clone()];
    [1.05, .5, -.05].forEach(function (y) {
      var h = castOn(leather, new V3(0, y, 5), new V3(0, 0, -1));
      if (h) flexPts.push(h.p.addScaledVector(h.n, -.13));
    });
    flexPts.push(new V3(0, -.62, .19), new V3(0, -.92, .17));
    var flexCurve = new T.CatmullRomCurve3(flexPts);
    p.glow(sweep(flexCurve, { radial: 8, segs: 70, rN: .045, rB: .007 }).geo);
    p.flow(flexCurve, 4, .3);
    p.point('flex', flexCurve.getPointAt(.45), Z_UP);

    var pcb = p.part(new T.BoxGeometry(.38, .26, .02), { color: 0x0f3a2e, roughness: .5, metalness: .2 });
    pcb.position.set(0, -1.05, .17);
    var imu = p.glow(new T.BoxGeometry(.09, .09, .028)); imu.position.set(-.09, -1.03, .19);
    var mcu = p.part(new T.BoxGeometry(.12, .12, .024), { color: 0x0b0e12, roughness: .4 }); mcu.position.set(.07, -1.07, .188);
    var ble = p.part(new T.BoxGeometry(.09, .05, .018), { color: 0x9aa6b4, metalness: .9, roughness: .3 }); ble.position.set(.13, -.96, .186);
    p.point('imu', imu.position, Z_UP);

    var cell = p.part(new T.BoxGeometry(.36, .24, .05), { color: 0x7c8a9c, metalness: .8, roughness: .35 });
    cell.position.set(0, -1.05, -.17);
    var lbl = p.glow(new T.BoxGeometry(.26, .025, .052)); lbl.position.set(0, -.98, -.17);
    p.point('cell', cell.position, new V3(0, 0, -1));

    [[.44, .2, -1.42], [.4, .17, -1.45]].forEach(function (c) {
      var coil = sweep(new Ellipse3(0, c[2], 0, c[0], c[1], 'xz'), { closed: true, up: Y_UP, radial: 8, segs: 96, r: .01 });
      p.part(coil.geo, { color: 0xc27a45, metalness: .9, roughness: .3, emissive: 0x6a3510, emissiveIntensity: .4 });
    });
    var toCell = new T.CatmullRomCurve3([new V3(.17, -1.05, .16), new V3(.42, -1.08, 0), new V3(.17, -1.05, -.16)]);
    p.glow(sweep(toCell, { radial: 6, segs: 30, r: .008 }).geo);
    p.flow(toCell, 2, .5);

    p.targetH = 3.35;
    p.anchorTargets = leather.concat(strap ? [strap] : []);
  }

  /* =====================================================================
     VORTEX — tennis racket
     ===================================================================== */
  function vortexPaint() {
    // x = along the hoop (0 at 3 o'clock, counter-clockwise), y = around the beam.
    // Rows: 0 / h = string side, .5h = outer edge, .75h = front face, .25h = back face.
    // drawn at 2x (4096 x 512) so the volt stripes stay crisp on the frame
    return canvasTex(4096, 512, function (g) {
      var w = 2048, h = 256;
      g.scale(2, 2);
      var gr = g.createLinearGradient(0, 0, 0, h);
      if (BLACK_TRIAL) { gr.addColorStop(0, '#0c0d10'); gr.addColorStop(.5, '#1d2026'); gr.addColorStop(1, '#0c0d10'); }
      else { gr.addColorStop(0, '#0a2260'); gr.addColorStop(.5, '#153f9e'); gr.addColorStop(1, '#0a2260'); }
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      function flare(x0, x1) {
        // hard-edged band (a painted stripe, not a fade)
        var m = (x1 - x0) * .2;
        g.fillStyle = '#b4f542'; g.fillRect(x0 + m, 0, x1 - x0 - 2 * m, h);
      }
      flare(w * .085, w * .165);
      flare(w * .335, w * .415);
      g.fillStyle = '#b4f542'; g.fillRect(w * .05, h * .5 - 2, w * .4, 3);
      g.save();
      g.translate(w * .5, h * .5); g.scale(1, .72);
      g.fillStyle = '#eef2f6'; g.font = '800 44px Archivo, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('K I N E S I S', 0, 2);
      g.restore();
      g.save();
      g.translate(w * .92, h * .5); g.scale(1, .72);
      g.fillStyle = '#eef2f6'; g.font = '600 30px "IBM Plex Mono", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('VORTEX 100 · 300G', 0, 2);
      g.restore();
    });
  }
  function buildVortex(p) {
    var CY = .79, A = .75, B = .95;
    var frame = {
      color: 0xffffff, map: vortexPaint(), normalMap: rep(TX.grain, 90, 4), normalScale: new T.Vector2(.06, .06),
      roughness: .56, metalness: .05, clearcoat: .2, clearcoatRoughness: .55
    };
    var hoop = new Ellipse3(0, CY, 0, A, B, 'xy');
    var hs = sweep(hoop, { closed: true, radial: 28, segs: 260, rN: .036, rB: .068, p: 3.2, ring: 10, line: 7, tangents: true });
    p.shell(hs.geo, frame, hs.wire);

    var rubber = { color: 0x0c0e11, roughness: .62, clearcoat: .15, normalMap: rep(TX.noise, 20, 2), normalScale: new T.Vector2(.6, .6) };
    var bump = sweep(new Ellipse3(0, CY, 0, A + .038, B + .038, 'xy', 30 * Math.PI / 180, 150 * Math.PI / 180), {
      radial: 20, segs: 80, p: 4, tangents: true,
      rN: function (t) { return capR(t, .014, .04, .04); }, rB: function (t) { return capR(t, .05, .04, .04); }
    });
    p.shell(bump.geo, rubber);
    [[-22, 22], [158, 202]].forEach(function (r) {
      var gs = sweep(new Ellipse3(0, CY, 0, A + .036, B + .036, 'xy', r[0] * Math.PI / 180, r[1] * Math.PI / 180), {
        radial: 16, segs: 30, p: 4, tangents: true,
        rN: function (t) { return capR(t, .01, .08, .08); }, rB: function (t) { return capR(t, .036, .08, .08); }
      });
      p.shell(gs.geo, rubber);
    });

    var armMat = { color: BLACK_TRIAL ? 0x16181c : 0x12378c, normalMap: rep(TX.grain, 30, 4), normalScale: new T.Vector2(.06, .06), roughness: .56, metalness: .05, clearcoat: .2, clearcoatRoughness: .55 };
    var volt = { color: ACCENT, roughness: .35, clearcoat: .8, clearcoatRoughness: .2 };
    var arms = {};
    [-1, 1].forEach(function (sx) {
      var st = hoop.at(sx < 0 ? 240 : 300);
      var arm = arms[sx] = new T.CatmullRomCurve3([st, new V3(.2 * sx, -.34, 0), new V3(.07 * sx, -.62, 0), new V3(0, -.74, 0)]);
      var g = sweep(arm, { radial: 20, segs: 50, rN: .033, rB: .064, p: 3, ring: 8, line: 5, tangents: true });
      p.shell(g.geo, armMat, g.wire);
      var edge = new T.CatmullRomCurve3([.22, .5, .8].map(function (t) { return arm.getPointAt(t).setZ(.062); }));
      p.shell(sweep(edge, { radial: 8, segs: 24, r: function (t) { return capR(t, .01, .12, .12); } }).geo, volt);
    });

    var gloss = { color: 0x111317, roughness: .22, clearcoat: 1, clearcoatRoughness: .08 };
    var collar = p.shell(new T.CylinderGeometry(.092, .086, .09, 8), gloss); collar.position.y = -.76;
    var h = octHandle(-.8, -1.9, .082, .076, .35);
    p.shell(h.geo, { color: 0x14161a, roughness: .72, normalMap: rep(TX.wrap, 4, 1), sheen: .3, sheenColor: new T.Color(0x333a44) }, h.wire);
    var tape = p.shell(new T.CylinderGeometry(.088, .088, .045, 8), gloss); tape.position.y = -.805;
    var ring = p.shell(new T.CylinderGeometry(.089, .089, .01, 8), volt); ring.position.y = -.835;
    var cap = p.shell(new T.CylinderGeometry(.09, .084, .06, 8), gloss); cap.position.y = -1.93;
    var disc = p.shell(new T.CircleGeometry(.08, 8), { map: logoDisc(), roughness: .3, clearcoat: 1 });
    disc.rotation.x = Math.PI / 2; disc.position.y = -1.961;

    // strings: real cylinders, alternately offset to suggest the weave
    var sm = { color: 0xe8e5dc, roughness: .45, sheen: .5, sheenColor: new T.Color(0xffffff) };
    var ai = A - .036, bi = B - .036, sg = new T.CylinderGeometry(.0052, .0052, 1, 6, 1, true);
    for (var i = 0; i < 16; i++) {
      var x = lerp(-ai * .92, ai * .92, i / 15), hh = bi * Math.sqrt(1 - (x / ai) * (x / ai));
      var m = p.shell(sg, sm); m.scale.y = hh * 2; m.position.set(x, CY, (i % 2 ? 1 : -1) * .0045); m.castShadow = false;
    }
    for (i = 0; i < 19; i++) {
      var y = lerp(-bi * .93, bi * .93, i / 18), ww = ai * Math.sqrt(1 - (y / bi) * (y / bi));
      var c = p.shell(sg, sm); c.scale.y = ww * 2; c.rotation.z = Math.PI / 2; c.position.set(0, CY + y, (i % 2 ? -1 : 1) * .0045); c.castShadow = false;
    }

    /* --- inside --- */
    var sensG = new T.BoxGeometry(.028, .16, .05);
    [-1, 1].forEach(function (sx) {
      var s = p.glow(sensG); s.position.set(sx * A, CY, 0);
      var pts = [];
      for (var d = 180; d <= 236; d += 7) { var q = hoop.at(d); pts.push(new V3(sx * Math.abs(q.x), q.y, 0)); }
      pts.push(arms[sx].getPointAt(.35), arms[sx].getPointAt(.75), new V3(.02 * sx, -.82, 0), new V3(0, -1.0, 0));
      var harness = new T.CatmullRomCurve3(pts);
      p.glow(sweep(harness, { radial: 6, segs: 90, r: .01 }).geo);
      p.flow(harness, 3, .28);
    });
    p.point('strain', new V3(-A, CY, 0), new V3(-1, 0, .5));
    p.point('harness', arms[1].getPointAt(.35), new V3(.3, 0, 1));
    var cell = p.part(new T.CylinderGeometry(.048, .048, .38, 16), { color: 0x7c8a9c, metalness: .8, roughness: .35 });
    cell.position.y = -1.25;
    var band = p.glow(new T.CylinderGeometry(.05, .05, .03, 16)); band.position.y = -1.13;
    p.point('cell', new V3(0, -1.25, .05), Z_UP);
    var pcb = p.part(new T.BoxGeometry(.11, .28, .014), { color: 0x0f3a2e, roughness: .5 }); pcb.position.y = -1.62;
    var imu = p.glow(new T.BoxGeometry(.066, .066, .03)); imu.position.set(0, -1.88, 0);
    p.point('imu', new V3(0, -1.88, .03), new V3(0, -.2, 1));
    var link = new T.LineCurve3(new V3(0, -1.06, 0), new V3(0, -1.86, 0));
    p.glow(sweep(link, { radial: 6, segs: 10, r: .007 }).geo);
    p.flow(link, 2, .45);

    p.tilt = -.3;
    p.targetH = 3.55;
  }

  /* =====================================================================
     TITAN — pickleball paddle
     ===================================================================== */
  function titanGraphics(W, H) {
    return canvasTex(900, Math.round(900 * H / W), function (g, w, h) {
      g.fillStyle = '#1c2026'; g.fillRect(0, 0, w, h);
      var sh = g.createLinearGradient(0, 0, w, h);
      sh.addColorStop(0, 'rgba(255,255,255,.05)'); sh.addColorStop(.5, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(255,255,255,.04)');
      g.fillStyle = sh; g.fillRect(0, 0, w, h);
      g.fillStyle = '#0d0f12';
      g.beginPath(); g.moveTo(0, h * .7); g.lineTo(w, h * .52); g.lineTo(w, h); g.lineTo(0, h); g.closePath(); g.fill();
      g.fillStyle = '#b4f542';
      g.beginPath(); g.moveTo(0, h * .66); g.lineTo(w, h * .48); g.lineTo(w, h * .505); g.lineTo(0, h * .685); g.closePath(); g.fill();
      g.save(); g.translate(w * .16, h * .44); g.rotate(-Math.PI / 2);
      g.fillStyle = '#eef2f6'; g.font = '800 92px Archivo, Arial, sans-serif'; g.textAlign = 'center';
      g.fillText('KINESIS', 0, 0);
      g.restore();
      g.fillStyle = '#9aa6b4'; g.font = '500 24px "IBM Plex Mono", monospace'; g.textAlign = 'right';
      g.fillText('TITAN', w * .88, h * .1);
      g.fillText('T700 RAW CARBON', w * .88, h * .1 + 32);
      g.fillText('16 MM CORE', w * .88, h * .1 + 64);
      g.fillStyle = '#b4f542'; g.fillRect(w * .88 - 40, h * .1 + 84, 40, 4);
    });
  }
  function buildTitan(p) {
    var X0 = -.66, Y0 = -.33, W = 1.32, H = 2.2, RT = .34;
    var shape = paddleShape(-X0, Y0 + H, RT, .26, .105, -.2, Y0);
    var faceG = new T.ExtrudeGeometry(shape, { depth: .085, bevelEnabled: true, bevelThickness: .012, bevelSize: .012, bevelSegments: 4, curveSegments: 32 });
    faceG.translate(0, 0, -.0425);
    var gfx = titanGraphics(W, H);
    gfx.repeat.set(1 / W, 1 / H); gfx.offset.set(-X0 / W, -Y0 / H);
    p.shell(faceG, {
      color: 0xffffff, map: gfx, normalMap: rep(TX.weave, 11, 11), normalScale: new T.Vector2(.45, .45),
      roughness: .36, metalness: .1, clearcoat: .55, clearcoatRoughness: .3
    });

    var outline = shape.getSpacedPoints(240).map(function (q) { return new V3(q.x, q.y, 0); });
    outline.pop();
    var guardCurve = new T.CatmullRomCurve3(outline, true, 'centripetal');
    var guard = sweep(guardCurve, { closed: true, radial: 18, segs: 260, rN: .026, rB: .068, p: 3.5, ring: 12, line: 9, tangents: true });
    p.shell(guard.geo, { color: 0x0e1013, roughness: .55, clearcoat: .2, normalMap: rep(TX.noise, 30, 2), normalScale: new T.Vector2(.5, .5) }, guard.wire);

    var fw = [], cy = Y0 + H / 2;
    for (var k = 1; k <= 4; k++) {
      var ins = shape.getSpacedPoints(120), sc = 1 - k * .17;
      for (var i = 0; i < ins.length - 1; i++) {
        var a = ins[i], b = ins[i + 1];
        fw.push(a.x * sc, cy + (a.y - cy) * sc, .06, b.x * sc, cy + (b.y - cy) * sc, .06);
      }
    }
    var fwg = new T.BufferGeometry(); fwg.setAttribute('position', new T.Float32BufferAttribute(fw, 3));
    p.wire(fwg);

    var gloss = { color: 0x111317, roughness: .22, clearcoat: 1, clearcoatRoughness: .08 };
    var volt = { color: ACCENT, roughness: .35, clearcoat: .8 };
    var colG = new T.CylinderGeometry(.15, .13, .12, 32); colG.scale(1, 1, .72);
    var col = p.shell(colG, gloss); col.position.y = -.34;
    var vr = new T.CylinderGeometry(.151, .151, .012, 32); vr.scale(1, 1, .72);
    var vm = p.shell(vr, volt); vm.position.y = -.3;
    var h = octHandle(-.4, -1.12, .1, .072, .3);
    p.shell(h.geo, { color: 0x15171b, roughness: .74, normalMap: rep(TX.wrap, 3, 1), sheen: .3, sheenColor: new T.Color(0x333a44) }, h.wire);
    var buttG = new T.CylinderGeometry(.112, .128, .07, 32); buttG.scale(1, 1, .76);
    var butt = p.shell(buttG, gloss); butt.position.y = -1.15;
    var br = new T.CylinderGeometry(.113, .113, .01, 32); br.scale(1, 1, .76);
    var bm = p.shell(br, volt); bm.position.y = -1.122;
    var discG = new T.CircleGeometry(.11, 32); discG.scale(1, .76, 1);
    var disc = p.shell(discG, { map: logoDisc(), roughness: .3, clearcoat: 1 });
    disc.rotation.x = Math.PI / 2; disc.position.y = -1.186;

    /* --- inside --- */
    var poly = shape.getSpacedPoints(200);
    function inside(x, y, m) {
      var c = false;
      for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        var a = poly[i], b = poly[j];
        if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) c = !c;
      }
      if (!c) return false;
      for (i = 0; i < poly.length; i++) if (Math.hypot(poly[i].x - x, poly[i].y - y) < m) return false;
      return true;
    }
    var hr = .07, hx = [], hw = hr * Math.sqrt(3);
    for (var row = -2; row < 26; row++) for (var q = -8; q < 9; q++) {
      var ox = q * hw + (row % 2 ? hw / 2 : 0), oy = Y0 + row * hr * 1.5;
      for (var s = 0; s < 6; s++) {
        var a0 = Math.PI / 6 + s * Math.PI / 3, a1 = a0 + Math.PI / 3;
        var x0 = ox + hr * Math.cos(a0), y0 = oy + hr * Math.sin(a0), x1 = ox + hr * Math.cos(a1), y1 = oy + hr * Math.sin(a1);
        if (inside(x0, y0, .05) && inside(x1, y1, .05)) hx.push(x0, y0, 0, x1, y1, 0);
      }
    }
    var hg = new T.BufferGeometry(); hg.setAttribute('position', new T.Float32BufferAttribute(hx, 3));
    p.innerLines(hg, .4);

    var padG = new T.BoxGeometry(.085, .085, .012);
    [-.32, 0, .32].forEach(function (x) {
      [.12, .56, 1.0, 1.44].forEach(function (y) { var pd = p.glow(padG); pd.position.set(x, y, .032); });
      var tr = new T.CatmullRomCurve3([new V3(x, 1.44, .032), new V3(x, .12, .032), new V3(x * .22, -.08, .028), new V3(0, -.42, .02), new V3(0, -.56, .01)]);
      p.glow(sweep(tr, { radial: 6, segs: 60, r: .007 }).geo);
      p.flow(tr, 2, .3);
    });
    p.point('grid', new V3(.32, 1.0, .04), Z_UP);
    p.point('core', new V3(-.36, .6, .01), Z_UP);
    var pcb = p.part(new T.BoxGeometry(.14, .26, .014), { color: 0x0f3a2e, roughness: .5 }); pcb.position.set(0, -.62, 0);
    var imu = p.glow(new T.BoxGeometry(.06, .06, .03)); imu.position.set(0, -.56, .014);
    p.point('imu', new V3(0, -.56, .03), Z_UP);
    var cell = p.part(new T.CylinderGeometry(.045, .045, .28, 16), { color: 0x7c8a9c, metalness: .8, roughness: .35 }); cell.position.set(0, -.9, 0);
    p.point('cell', new V3(0, -.9, .05), Z_UP);

    p.tilt = .16;
    p.targetH = 3.3;
  }

  /* =====================================================================
     SCYTHE — driver
     The head is one parametric surface: u runs around the top-view outline,
     v runs sole centre -> skirt wall -> crown centre. Sole, skirt and crown
     are separate meshes of it; the face insert is a patch of the same surface
     lifted just off the wall. Crown and sole are textured by a top-down
     projection, so graphics and the carbon weave keep their proportions.
     ===================================================================== */
  // x = heel (-) to toe (+), z = back (-) to face (+), y up. Starts at the back.
  var DRIVER_OUTLINE = [
    [0, -.93], [-.26, -.86], [-.43, -.68], [-.51, -.42], [-.52, -.22], [-.47, -.08],
    [-.38, -.02], [-.18, .015], [0, .025], [.2, .015], [.4, -.02], [.5, -.1],
    [.55, -.26], [.52, -.5], [.4, -.72], [.2, -.88]
  ];
  // Planar map window shared by the crown and sole textures.
  var HX0 = -.6, HZ0 = -1, HS = 1.2;
  function headPx(x, z, w, h) { return [(x - HX0) / HS * w, (1 - (z - HZ0) / HS) * h]; }
  function planarUV(geo) {
    var P = geo.attributes.position, uv = geo.attributes.uv;
    for (var i = 0; i < P.count; i++) uv.setXY(i, (P.getX(i) - HX0) / HS, (P.getZ(i) - HZ0) / HS);
    uv.needsUpdate = true;
  }
  // Twill carbon tone for the crown colour map; same tiling as TX.weave.
  function weaveTone(x, y, w) {
    var c = w / 4, bx = Math.floor(x / c), by = Math.floor(y / c), lx = (x % c) / c, ly = (y % c) / c;
    var warp = ((bx + by) % 4) < 2, across = warp ? ly : lx;
    return (warp ? 1 : .5) * (.5 + .5 * Math.pow(Math.sin(Math.PI * across), .8));
  }
  function crownTex(reps, mark) {
    return canvasTex(1024, 1024, function (g, w, h) {
      var img = g.createImageData(w, h), D = img.data, k = reps * 128;
      for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
        var t = weaveTone((x * k / w) % 128, (y * k / h) % 128, 128), i = (y * w + x) * 4;
        D[i] = 12 + t * 15; D[i + 1] = 13 + t * 17; D[i + 2] = 15 + t * 20; D[i + 3] = 255;
      }
      g.putImageData(img, 0, 0);
      // alignment aid behind the face
      var a = headPx(mark[0].x, mark[0].z, w, h), b = headPx(mark[1].x, mark[1].z, w, h);
      g.strokeStyle = '#b4f542'; g.lineCap = 'round';
      g.lineWidth = 6; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
    });
  }
  function soleTex(track) {
    return canvasTex(1024, 1024, function (g, w, h) {
      function P(x, z) { return headPx(x, z, w, h); }
      var gr = g.createLinearGradient(0, P(0, .05)[1], 0, P(0, -.95)[1]);
      gr.addColorStop(0, '#6d757e'); gr.addColorStop(.3, '#454c54'); gr.addColorStop(1, '#2c3137');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      // titanium front plate, split from the body by a dark seam
      var s0 = P(-.62, -.24), s1 = P(.02, -.06), s2 = P(.62, -.24);
      g.fillStyle = '#8b939c';
      g.beginPath(); g.moveTo(s0[0], s0[1]); g.quadraticCurveTo(s1[0], s1[1], s2[0], s2[1]); g.lineTo(w, 0); g.lineTo(0, 0); g.closePath(); g.fill();
      g.strokeStyle = '#121418'; g.lineWidth = 5;
      g.beginPath(); g.moveTo(s0[0], s0[1]); g.quadraticCurveTo(s1[0], s1[1], s2[0], s2[1]); g.stroke();
      // weight track along the back
      g.lineCap = 'round'; g.lineJoin = 'round';
      [[62, '#0b0c0e'], [40, '#16191d'], [6, '#0b0c0e']].forEach(function (s) {
        g.strokeStyle = s[1]; g.lineWidth = s[0]; g.beginPath();
        track.forEach(function (q, i) { var c = P(q.x, q.z); if (i) g.lineTo(c[0], c[1]); else g.moveTo(c[0], c[1]); });
        g.stroke();
      });
      function text(str, x, z, font, color) {
        var c = P(x, z);
        g.save(); g.translate(c[0], c[1]);
        g.fillStyle = color; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(str, 0, 0); g.restore();
      }
      text('KINESIS', .02, -.42, '800 78px Archivo, Arial, sans-serif', '#e8edf3');
      text('SCYTHE', .02, -.52, '600 30px "IBM Plex Mono", monospace', '#b4f542');
      text('10.5°', -.26, -.09, '600 30px "IBM Plex Mono", monospace', '#1a1d22');
    });
  }
  function faceTex() {
    // x = up the face (sole -> crown), y = across it (canvas top = toe)
    function mask(g, w, h) {
      // insert outline: tight at the heel-bottom, broad round at the top-toe.
      // corners are [rx, ry] in canvas px (x = up the face, y = across it).
      var m = 3, x0 = m, x1 = w - m, y0 = m, y1 = h - m;
      var bt = [70, 60], tt = [170, 150], th = [110, 60], bh = [50, 30];
      g.beginPath();
      g.moveTo(x0, y0 + bt[1]);
      g.quadraticCurveTo(x0, y0, x0 + bt[0], y0);
      g.lineTo(x1 - tt[0], y0);
      g.quadraticCurveTo(x1, y0, x1, y0 + tt[1]);
      g.lineTo(x1, y1 - th[1]);
      g.quadraticCurveTo(x1, y1, x1 - th[0], y1);
      g.lineTo(x0 + bh[0], y1);
      g.quadraticCurveTo(x0, y1, x0, y1 - bh[1]);
      g.closePath();
    }
    var map = canvasTex(512, 512, function (g, w, h) {
      mask(g, w, h); g.save(); g.clip();
      var gr = g.createLinearGradient(0, 0, w, 0);
      gr.addColorStop(0, '#8e969f'); gr.addColorStop(.5, '#c3c9d0'); gr.addColorStop(1, '#9ba3ac');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (var x = 0; x < w; x += 3) { g.fillStyle = x % 6 ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.07)'; g.fillRect(x, 0, 1, h); }
      g.fillStyle = 'rgba(40,45,52,.55)';
      for (var i = 0; i < 7; i++) g.fillRect(w * (.24 + i * .087), h * .2, 3, h * .6);
      g.restore();
    });
    var nrm = normalTex(512, 512, function (x, y, w, h) {
      var groove = y > h * .2 && y < h * .8 && [0, 1, 2, 3, 4, 5, 6].some(function (i) { return Math.abs(x - w * (.24 + i * .087) - 1) < 2; });
      return groove ? 0 : .5 + .12 * Math.sin(x * 2.1);
    }, 1.2);
    return { map: map, normal: nrm };
  }
  function shaftPaint() {
    return canvasTex(2048, 64, function (g, w, h) {
      g.fillStyle = '#0f1114'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#b4f542'; g.fillRect(w * .78, 0, 10, h); g.fillRect(w * .805, 0, 4, h);
      g.save(); g.translate(w * .7, h * .75); g.scale(1, .5);
      g.fillStyle = '#e8edf3'; g.font = '800 34px Archivo, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('KINESIS  SCYTHE  6·S', 0, 0);
      g.restore();
    });
  }
  function gripPaint() {
    return canvasTex(1024, 128, function (g, w, h) {
      g.fillStyle = '#16181c'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#b4f542'; g.fillRect(0, h * .75 - 2, w * .8, 3);
      g.save(); g.translate(w * .45, h * .25); g.scale(1, .5);
      g.fillStyle = '#e8edf3'; g.font = '800 40px Archivo, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('KINESIS', 0, 0);
      g.restore();
    });
  }
  function buildScythe(p) {
    var gloss = { color: 0x0b0c0e, roughness: .5, metalness: .1, clearcoat: .2, clearcoatRoughness: .55 };
    // Real proportions (45.5" driver): head heel-to-toe ~11% of the length, grip ~23% of it
    // and clearly thicker than the shaft, shaft tapering from butt to tip.
    var SY0 = -1.35, GY0 = 1.2, HEAD_S = .46;   // shaft bottom (ferrule), grip bottom, head scale

    var grip = sweep(new T.LineCurve3(new V3(0, GY0, 0), new V3(0, 1.98, 0)), {
      up: Z_UP, radial: 32, segs: 30, tangents: true, ring: 4, line: 4,
      r: function (t) { return capR(t, lerp(.031, .042, t), 0, .03); }
    });
    p.shell(grip.geo, { color: 0xffffff, map: gripPaint(), normalMap: rep(TX.rubber, 14, 3), normalScale: new T.Vector2(.8, .8), roughness: .8 }, grip.wire);

    function shaftR(y) { return lerp(.015, .026, (y - SY0) / (GY0 - SY0)); }
    var shaft = sweep(new T.LineCurve3(new V3(0, SY0, 0), new V3(0, GY0 + .01, 0)), {
      up: Z_UP, radial: 20, segs: 24, tangents: true, ring: 3, line: 5,
      r: function (t) { return shaftR(lerp(SY0, GY0 + .01, t)); }
    });
    p.shell(shaft.geo, { color: 0xffffff, map: shaftPaint(), roughness: .5, metalness: .15, clearcoat: .2, clearcoatRoughness: .55 }, shaft.wire);

    /* --- head --- */
    var outline = new T.CatmullRomCurve3(DRIVER_OUTLINE.map(function (q) { return new V3(q[0], 0, q[1]); }), true, 'centripetal');
    var C = { x: .02, z: -.4 }, CTR = new V3(.02, .28, -.4);
    var YC = .56, VS = .34, VW = .6, LOFT = Math.tan(10.5 * Math.PI / 180);
    var OP = new V3();
    function bez(t, a, b, c, d) { var s = 1 - t; return s * s * s * a + 3 * s * s * t * b + 3 * s * t * t * c + t * t * t * d; }
    function headPt(u, v, o) {
      outline.getPointAt(((u % 1) + 1) % 1, OP);
      var fr = sstep(-.75, -.02, OP.z);                                          // back 0 -> face 1
      var fc = sstep(-.12, -.03, OP.z) * (1 - sstep(.22, .48, Math.abs(OP.x - .02)));  // on the face
      var L = Math.hypot(OP.x - C.x, OP.z - C.z);
      var yc = lerp(.33, .5 - .12 * Math.pow((OP.x - .08) / .48, 2), fr);         // crown edge: face top at the front
      var ys = lerp(.07, .02, fr);                                               // sole edge rises toward the back
      var rt = lerp(.12, .03, fc), rb = lerp(.07, .035, fc);                     // crown / sole corner size
      var w, y, t;
      if (v < VS) { t = v / VS; w = bez(t, L, L * .4, 0, 0); y = bez(t, 0, 0, ys, ys + rb); }
      else if (v < VW) { t = (v - VS) / (VW - VS); w = 0; y = lerp(ys + rb, yc - rt, t); }
      else { t = (v - VW) / (1 - VW); w = bez(t, 0, 0, L * .3, L); y = bez(t, yc - rt, yc, YC, YC); }
      var s = 1 - w / L, z = C.z + (OP.z - C.z) * s;
      return o.set(C.x + (OP.x - C.x) * s, y, z - LOFT * y * sstep(-.5, 0, z));
    }
    var hA = new V3(), hB = new V3(), hP = new V3();
    function headN(u, v, o) {
      headPt(u + 1e-3, v, hA).sub(headPt(u - 1e-3, v, hB));
      headPt(u, v + 1e-3, hP).sub(headPt(u, v - 1e-3, hB));
      o.crossVectors(hA, hP).normalize();
      if (o.dot(headPt(u, v, hP).sub(CTR)) < 0) o.negate();
      return o;
    }
    function region(u0, u1, v0, v1, nu, nv, lift, o) {
      var N = new V3();
      return surface(nu, nv, function (u, v, out) {
        var uu = lerp(u0, u1, u), vv = lerp(v0, v1, v);
        headPt(uu, vv, out);
        if (lift) out.addScaledVector(headN(uu, vv, N), lift);
      }, Object.assign({ center: function (u, v, out) { out.copy(CTR); } }, o));
    }

    // where the face sits on the outline, and the toe
    var fu0 = 1, fu1 = 0, fuC = .5, best = 9, toeU = 0, toeX = -9;
    for (var i = 0; i < 1000; i++) {
      var uu = i / 1000; outline.getPointAt(uu, OP);
      if (OP.z > -.035 && Math.abs(OP.x - .02) < .4) {
        fu0 = Math.min(fu0, uu); fu1 = Math.max(fu1, uu);
        if (Math.abs(OP.x - .02) < best) { best = Math.abs(OP.x - .02); fuC = uu; }
      }
      if (OP.x > toeX) { toeX = OP.x; toeU = uu; }
    }

    var head = new T.Group();
    function headWire(geo) { if (geo) head.add(p.wire(geo)); }   // x-ray lines ride with the head
    var VSOLE = .29, VCROWN = .64;
    var sole = region(0, 1, 0, VSOLE, 128, 22, 0, { ring: 5, line: 8 });
    var track = [];
    for (i = -9; i <= 9; i++) track.push(headPt(i * .011, .15, new V3()));
    planarUV(sole.geo);
    var soleMesh = p.shell(sole.geo, {
      color: 0xffffff, map: soleTex(track), metalness: .7, roughness: .5,
      normalMap: rep(TX.noise, 6, 6), normalScale: new T.Vector2(.18, .18)
    }, null, head);
    headWire(sole.wire);
    var skirt = region(0, 1, VSOLE, VCROWN, 128, 26, 0, { ring: 6, line: 8 });
    p.shell(skirt.geo, gloss, null, head); headWire(skirt.wire);
    var crown = region(0, 1, VCROWN, 1, 128, 40, 0, { ring: 6, line: 8 });
    planarUV(crown.geo);
    var CREPS = 19;
    p.shell(crown.geo, {
      color: 0xffffff, map: crownTex(CREPS, [headPt(fuC, .675, new V3()), headPt(fuC, .75, new V3())]),
      normalMap: rep(TX.weave, CREPS, CREPS), normalScale: new T.Vector2(.6, .6),
      roughness: .52, metalness: .2, clearcoat: .25, clearcoatRoughness: .5
    }, null, head);
    headWire(crown.wire);
    var FT = faceTex();
    var face = region(fu0, fu1, VS + .012, VW - .012, 64, 20, .004);
    p.shell(face.geo, {
      color: 0xffffff, map: FT.map, normalMap: FT.normal, normalScale: new T.Vector2(.5, .5),
      metalness: 1, roughness: .42, alphaTest: .5
    }, null, head);

    // sliding weight, sitting in the track
    var weightG = new T.CapsuleGeometry(.026, .07, 6, 16); weightG.scale(1, 1, .45);
    var weight = p.shell(weightG, { color: ACCENT, metalness: .35, roughness: .3, clearcoat: .6 }, null, head);
    var wN = headN(.035, .15, new V3()), wP = headPt(.035, .15, new V3()).addScaledVector(wN, -.004);
    var wT = headPt(.045, .15, new V3()).sub(headPt(.025, .15, new V3())).normalize();
    weight.position.copy(wP);
    weight.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(new V3().crossVectors(wT, wN), wT, wN));

    // hosel, adjustable sleeve and ferrule, all on the shaft axis (lie 58 deg)
    var LIE = 58 * Math.PI / 180, D = new V3(-Math.cos(LIE), Math.sin(LIE), 0), HB = new V3(-.42, .3, -.14);
    function onAxis(a, b) { return new T.LineCurve3(HB.clone().addScaledVector(D, a), HB.clone().addScaledVector(D, b)); }
    var hosel = sweep(onAxis(-.08, .36), {
      radial: 24, segs: 24, ring: 4, line: 6,
      r: function (t) { return lerp(.062, .056, t) + .03 * Math.pow(1 - sstep(0, .5, t), 2); }
    });
    p.shell(hosel.geo, gloss, null, head); headWire(hosel.wire);
    var sleeve = sweep(onAxis(.36, .52), { radial: 24, segs: 6, r: function (t) { return capR(t, lerp(.06, .055, t), .08, 0); } });
    p.shell(sleeve.geo, { color: 0x59616b, metalness: .95, roughness: .28 }, null, head);
    var ferrule = sweep(onAxis(.52, .59), { radial: 24, segs: 6, r: function (t) { return lerp(.05, shaftR(SY0) / HEAD_S, t); } });
    p.shell(ferrule.geo, gloss, null, head);
    var fring = sweep(onAxis(.525, .54), { radial: 24, segs: 2, r: .0505 });
    p.shell(fring.geo, { color: ACCENT, roughness: .35, clearcoat: .8 }, null, head);

    // hang the head off the shaft: turn it so the hosel axis runs up the shaft
    head.rotation.z = -(Math.PI / 2 - LIE);
    head.scale.setScalar(HEAD_S);
    head.updateMatrix();
    var top = HB.clone().addScaledVector(D, .59).applyMatrix4(head.matrix);
    head.position.set(-top.x, SY0 - top.y, -top.z);
    p.model.add(head);
    head.updateMatrixWorld(true);

    /* --- inside --- */
    var pcb = p.part(new T.BoxGeometry(.05, .16, .012), { color: 0x0f3a2e, roughness: .5 }); pcb.position.set(0, 1.8, 0);
    var imu = p.glow(new T.BoxGeometry(.04, .04, .022)); imu.position.set(0, 1.86, .008);
    p.point('imu', new V3(0, 1.86, .03), new V3(0, .3, 1));
    var cell = p.part(new T.CylinderGeometry(.022, .022, .38, 16), { color: 0x7c8a9c, metalness: .8, roughness: .35 }); cell.position.set(0, 1.35, 0);
    p.point('cell', new V3(0, 1.35, .035), Z_UP);
    [.35, -.2, -.8].forEach(function (y) {
      var r = shaftR(y) + .005;
      var b = p.glow(new T.CylinderGeometry(r, r, .045, 20)); b.position.y = y;
    });
    p.point('bands', new V3(0, -.2, .03), Z_UP);

    var fN = headN(fuC, (VS + VW) / 2, new V3()), fP = headPt(fuC, (VS + VW) / 2, new V3());
    var fNw = fN.clone().applyQuaternion(head.quaternion);
    var run = new T.CatmullRomCurve3([
      new V3(0, 1.72, 0), new V3(0, .5, 0), new V3(0, SY0 + .05, 0),
      head.localToWorld(HB.clone().addScaledVector(D, .15)), head.localToWorld(fP.clone().addScaledVector(fN, -.06))
    ]);
    p.glow(sweep(run, { radial: 6, segs: 80, r: .006 }).geo);
    p.flow(run, 4, .22);
    var dotG = new T.BoxGeometry(.045, .045, .01), fn = new V3();
    for (var r = -1; r <= 1; r++) for (var c = -2; c <= 2; c++) {
      var du = lerp(fu0, fu1, .5 + c * .14), dv = lerp(VS, VW, .5 + r * .24);
      headN(du, dv, fn);
      var d = p.glow(dotG, head);
      d.position.copy(headPt(du, dv, new V3())).addScaledVector(fn, -.03);
      d.quaternion.setFromUnitVectors(Z_UP, fn);
    }
    p.point('facearray', head.localToWorld(fP.clone().addScaledVector(fN, -.02)), fNw);
    p.point('face', head.localToWorld(fP.clone().addScaledVector(fN, .01)), fNw);
    p.point('toe', head.localToWorld(headPt(toeU, (VS + VW) / 2, new V3())), headN(toeU, (VS + VW) / 2, new V3()).applyQuaternion(head.quaternion).add(new V3(0, 0, .4)));

    p.tilt = .45;
    p.targetH = 3.6;
  }

  /* =====================================================================
     Scene
     ===================================================================== */
  var stage = hero.querySelector('.hero-stage');
  var canvas = stage.querySelector('canvas');
  var renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (err) {
    hero.classList.add('no-webgl');
    return;
  }
  MAX_ANISO = Math.min(16, renderer.capabilities.getMaxAnisotropy());
  // render above screen resolution so fine texture detail doesn't turn to mush
  renderer.setPixelRatio(Math.min(Math.max((window.devicePixelRatio || 1) * 1.5, 2), 3));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;

  var scene = new T.Scene();
  var camera = new T.PerspectiveCamera(30, 1, .1, 100);
  var CAM_Z = 11, LOOK_Y = -.2;

  var pm = new T.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new T.RoomEnvironment(renderer), .04).texture;
  pm.dispose();

  var key = new T.DirectionalLight(0xffffff, 2.1);
  key.position.set(2.5, 7, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -3; key.shadow.camera.right = 3; key.shadow.camera.top = 3; key.shadow.camera.bottom = -3;
  key.shadow.camera.near = 1; key.shadow.camera.far = 20;
  key.shadow.bias = -.0004; key.shadow.normalBias = .02;
  scene.add(key);
  var rim = new T.DirectionalLight(0x9cc2ff, 1.5); rim.position.set(-5, 3, -6); scene.add(rim);
  var kick = new T.DirectionalLight(0xe4ffb0, .35); kick.position.set(6, -1, 2); scene.add(kick);

  buildTextures();
  var floor = new T.Group();
  var catcher = new T.Mesh(new T.PlaneGeometry(10, 10), new T.ShadowMaterial({ opacity: .38 }));
  catcher.rotation.x = -Math.PI / 2; catcher.receiveShadow = true; floor.add(catcher);
  var sh = new T.Mesh(new T.PlaneGeometry(3.6, 3.6), new T.MeshBasicMaterial({ map: TX.shadow, transparent: true, depthWrite: false }));
  sh.rotation.x = -Math.PI / 2; sh.position.y = .002; floor.add(sh);
  var ringPts = [];
  for (var i = 0; i <= 128; i++) { var a = i / 128 * TAU; ringPts.push(new V3(Math.cos(a) * 1.9, .004, Math.sin(a) * 1.9)); }
  var ringLine = new T.Line(new T.BufferGeometry().setFromPoints(ringPts), new T.LineBasicMaterial({ color: 0x3a4d63, transparent: true, opacity: .8 }));
  floor.add(ringLine);
  var ticks = [];
  for (i = 0; i < 72; i++) {
    var ta = i / 72 * TAU, l = i % 6 === 0 ? .14 : .06;
    ticks.push(Math.cos(ta) * 1.9, .004, Math.sin(ta) * 1.9, Math.cos(ta) * (1.9 + l), .004, Math.sin(ta) * (1.9 + l));
  }
  var tg = new T.BufferGeometry(); tg.setAttribute('position', new T.Float32BufferAttribute(ticks, 3));
  var tickLines = new T.LineSegments(tg, new T.LineBasicMaterial({ color: 0x3a4d63, transparent: true, opacity: .8 }));
  floor.add(tickLines);
  scene.add(floor);

  /* ---------------- state ---------------- */
  var cur = 0, exo = false, exoT = 0;
  // Orientation is a quaternion so a drag can turn the model about any axis.
  // HOME is the resting pose; after a drag (and any follow-through) the model eases back to it.
  // flush with the screen: glove back, racket/paddle face and club face all point at the camera
  var HOME0 = new T.Quaternion();
  var HOME = HOME0.clone();
  var rotQ = HOME.clone(), ret = null, spin = null, tq = new T.Quaternion(), tAxis = new V3();
  var dragging = false, lastX = 0, lastY = 0;
  var slide = null, AUTO_SPEED = .22;   // rad/s turntable spin while idle
  var MODEL_Y = .28;

  /* =====================================================================
     Products
     ===================================================================== */
  var builders = { vortex: buildVortex, titan: buildTitan, scythe: buildScythe };

  function finalise(p) {
    // Anchors are resolved in the builder's own space, before tilt / scale / centring.
    p.callouts = p.resolve(p.def.callouts, p.anchorTargets);
    p.exoCallouts = p.resolve(p.def.exo, p.anchorTargets);
    if (p.tilt) p.model.rotation.z = p.tilt;
    p.root.updateMatrixWorld(true);
    var box = new T.Box3().setFromObject(p.model);
    var s = clamp(p.targetH / (box.max.y - box.min.y), .6, 1.3);
    p.model.scale.setScalar(s);
    p.root.updateMatrixWorld(true);
    box.setFromObject(p.model);
    p.model.position.sub(box.getCenter(new V3()));
    p.halfH = (box.max.y - box.min.y) / 2;
    p.radius = Math.max(box.max.x - box.min.x, box.max.z - box.min.z) / 2;
    p.setExo(exoT);
  }

  var products = KINESIS.hero.map(function (d) {
    var p = new Product(d.id);
    p.def = d;
    p.shop = KINESIS.byId(d.id);
    scene.add(p.root);
    p.root.visible = false;
    if (builders[d.id]) { builders[d.id](p); finalise(p); }
    else { p.ready = false; p.halfH = 1.6; p.radius = 1; }
    return p;
  });

  /* ---------------- DOM ---------------- */
  var nameEl = hero.querySelector('.hero-name');
  var bigEl = nameEl.querySelector('.big');
  var subEl = nameEl.querySelector('.sub-text');
  var dotsEl = hero.querySelector('.dots');
  var countEl = hero.querySelector('[data-count]');
  var toggle = hero.querySelector('.exo-toggle');
  var layer = hero.querySelector('.hero-callouts');
  var svg = layer.querySelector('svg');
  var list = hero.querySelector('.hero-list');

  products.forEach(function (p, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', p.def.label + ': ' + p.shop.name);
    b.addEventListener('click', function () { goTo(i); });
    dotsEl.appendChild(b);
  });

  function updateLabels(animate) {
    var p = products[cur];
    bigEl.textContent = p.def.label;
    subEl.textContent = p.shop.name + ' · ' + KINESIS.formatINR(p.shop.price);
    nameEl.setAttribute('href', 'shop.html#' + p.id);
    nameEl.setAttribute('aria-label', 'Open the ' + p.shop.name + ' listing in the shop');
    countEl.innerHTML = '<b>' + String(cur + 1).padStart(2, '0') + '</b> / ' + String(products.length).padStart(2, '0');
    Array.prototype.forEach.call(dotsEl.children, function (b, i) { b.setAttribute('aria-current', i === cur ? 'true' : 'false'); });
    if (animate) { nameEl.classList.remove('swap'); void nameEl.offsetWidth; nameEl.classList.add('swap'); }
    hero.classList.toggle('loading-model', !p.ready);
    window.dispatchEvent(new CustomEvent('kinesis:slide', { detail: { id: p.id } }));
  }

  /* ---------------- callouts: fixed text, moving lines ---------------- */
  var NS = 'http://www.w3.org/2000/svg';
  var items = [];
  var LABEL_W = 230;

  function currentCallouts() {
    var p = products[cur];
    if (!p.ready) return [];
    return exo ? p.exoCallouts : p.callouts;
  }
  function setCallouts(list_) {
    items.forEach(function (it) { it.dying = true; });
    // two fixed slots per side, chosen from where each point sits on the model
    var byX = list_.map(function (c, i) { return i; }).sort(function (a, b) { return list_[a].at.x - list_[b].at.x; });
    var half = Math.ceil(list_.length / 2);
    var sides = { L: byX.slice(0, half), R: byX.slice(half) };
    ['L', 'R'].forEach(function (k) { sides[k].sort(function (a, b) { return list_[b].at.y - list_[a].at.y; }); });
    list_.forEach(function (c, i) {
      var side = sides.L.indexOf(i) >= 0 ? 'L' : 'R', slot = sides[side].indexOf(i);
      var el = document.createElement('div');
      el.className = 'callout ' + (side === 'L' ? 'left' : 'right');
      el.innerHTML = '<div class="num">' + String(i + 1).padStart(2, '0') + (exo ? ' · INSIDE' : '') + '</div><h3></h3><p></p>';
      el.querySelector('h3').textContent = c.t;
      el.querySelector('p').textContent = c.d;
      el.style.opacity = 0;
      layer.appendChild(el);
      var path = document.createElementNS(NS, 'path'); path.setAttribute('class', 'co-line');
      var ring = document.createElementNS(NS, 'circle'); ring.setAttribute('class', 'co-ring');
      var dot = document.createElementNS(NS, 'circle'); dot.setAttribute('class', 'co-dot'); dot.setAttribute('r', 3);
      svg.appendChild(path); svg.appendChild(ring); svg.appendChild(dot);
      items.push({ c: c, el: el, path: path, ring: ring, dot: dot, op: 0, line: 0, vis: false, side: side, slot: slot, phase: i * .7 });
    });
    if (list) {
      list.innerHTML = '';
      list_.forEach(function (c, i) {
        var div = document.createElement('div');
        div.innerHTML = '<div class="num">' + String(i + 1).padStart(2, '0') + '</div><h3></h3><p></p>';
        div.querySelector('h3').textContent = c.t;
        div.querySelector('p').textContent = c.d;
        list.appendChild(div);
      });
    }
  }

  var W = 1, H = 1, wp = new V3(), wn = new V3(), cam = new V3(), view = new V3(), cproj = new V3();
  function updateCallouts(time, dt) {
    if (!items.length) return;
    var p = products[cur];
    cproj.set(0, MODEL_Y, 0).project(camera);
    var cx = (cproj.x + 1) / 2 * W;
    var rpx = p.radius * (H / 2) / (Math.tan(camera.fov * Math.PI / 360) * camera.position.z);
    var colL = Math.max(LABEL_W + 28, cx - rpx - 90);
    var colR = Math.min(W - LABEL_W - 28, cx + rpx + 90);
    var room = colL - LABEL_W > 0 && colR + LABEL_W < W && colR - colL > rpx;
    var rows = [H * .2, H * .47];
    camera.getWorldPosition(cam);

    items = items.filter(function (it) {
      var target = (!it.dying && !slide && room) ? 1 : 0;
      it.op += (target - it.op) * Math.min(1, dt * (it.dying ? 14 : 6));
      if (it.dying && it.op < .02) { it.el.remove(); it.path.remove(); it.ring.remove(); it.dot.remove(); return false; }

      p.model.localToWorld(wp.copy(it.c.at));
      wn.copy(it.c.n).transformDirection(p.model.matrixWorld);
      view.copy(cam).sub(wp).normalize();
      var facing = wn.dot(view);
      it.vis = it.vis ? facing > -.02 : facing > .12;
      wp.project(camera);
      var sx = (wp.x + 1) / 2 * W, sy = (1 - wp.y) / 2 * H;
      it.line += ((it.vis ? 1 : 0) - it.line) * Math.min(1, dt * 7);

      var left = it.side === 'L';
      var x = left ? colL - LABEL_W : colR, y = rows[Math.min(it.slot, rows.length - 1)];
      it.el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      it.el.style.opacity = it.op.toFixed(3);
      it.el.style.pointerEvents = it.op > .5 ? 'auto' : 'none';
      var ay = y + 26, ax = left ? colL + 10 : colR - 10, ex = left ? colL + 34 : colR - 34;
      var lo = it.op * it.line;
      it.path.setAttribute('d', 'M' + ax.toFixed(1) + ' ' + ay.toFixed(1) + ' H' + ex.toFixed(1) + ' L' + sx.toFixed(1) + ' ' + sy.toFixed(1));
      it.path.style.opacity = lo.toFixed(3);
      it.dot.setAttribute('cx', sx.toFixed(1)); it.dot.setAttribute('cy', sy.toFixed(1));
      it.dot.style.opacity = lo.toFixed(3);
      var pr = (time * .8 + it.phase) % 1;
      it.ring.setAttribute('cx', sx.toFixed(1)); it.ring.setAttribute('cy', sy.toFixed(1));
      it.ring.setAttribute('r', (4 + pr * 9).toFixed(2));
      it.ring.style.opacity = (lo * (1 - pr)).toFixed(3);
      return true;
    });
  }

  /* ---------------- slides ---------------- */
  function goTo(i, dir) {
    if (slide || i === cur) return;
    dir = dir || (i > cur ? 1 : -1);
    var from = products[cur], to = products[i];
    to.setExo(exoT);
    to.root.visible = true;
    to.root.position.x = dir * 9;
    // the outgoing model leaves from wherever it was; the new one arrives at home
    slide = { from: from, to: to, dir: dir, t0: performance.now(), qFrom: rotQ.clone() };
    HOME.copy(HOME0); rotQ.copy(HOME); ret = null; spin = null;
    setCallouts([]);
    cur = i;
    updateLabels(true);
  }
  function step(dir) { goTo((cur + dir + products.length) % products.length, dir); }
  hero.querySelector('.hero-arrow.prev').addEventListener('click', function () { step(-1); });
  hero.querySelector('.hero-arrow.next').addEventListener('click', function () { step(1); });
  document.addEventListener('keydown', function (e) {
    if (window.scrollY > hero.offsetHeight * .6) return;
    if (e.target.closest && e.target.closest('input, textarea')) return;
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
  });

  function setMode(on) {
    exo = on;
    toggle.setAttribute('aria-pressed', on ? 'true' : 'false');
    hero.classList.toggle('exo', on);
    layer.classList.toggle('exo', on);
    if (!slide) setCallouts(currentCallouts());
  }
  toggle.addEventListener('click', function () { setMode(!exo); });

  /* ---------------- drag ---------------- */
  // Trackball: the model turns about the screen axis at right angles to the drag.
  // On release it keeps turning with the drag's speed, slows down, then eases back home.
  var lastT = 0, dragVel = new V3(), SPIN_MAX = 6, FRICTION = 4, SPIN_STOP = .3;
  canvas.addEventListener('pointerdown', function (e) {
    dragging = true; ret = null; spin = null; dragVel.set(0, 0, 0);
    HOME.copy(HOME0);   // a released model returns to its initial pose, then the turntable starts again
    lastX = e.clientX; lastY = e.clientY; lastT = performance.now();
    canvas.classList.add('dragging');
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var now = performance.now(), dt = Math.max(4, now - lastT) / 1000;
    var dx = e.clientX - lastX, dy = e.clientY - lastY, len = Math.hypot(dx, dy);
    lastX = e.clientX; lastY = e.clientY; lastT = now;
    if (len < .01) return;
    tAxis.set(dy / len, dx / len, 0).applyQuaternion(camera.quaternion);
    rotQ.premultiply(tq.setFromAxisAngle(tAxis, len * .009)).normalize();
    // angular velocity in world space (axis * rad/s), smoothed over the last few moves
    dragVel.lerp(tAxis.multiplyScalar(len * .009 / dt), .5);
  });
  function goHome() {
    var ang = 2 * Math.acos(Math.min(1, Math.abs(rotQ.dot(HOME))));
    if (ang > .001) ret = { from: rotQ.clone(), t0: performance.now(), dur: 1000 * clamp(.5 + ang * .22, .6, 1.3) };
  }
  function endDrag() {
    if (!dragging) return;
    dragging = false; canvas.classList.remove('dragging');
    // a pointer that stopped before letting go has no follow-through
    var sp = performance.now() - lastT < 90 ? dragVel.length() : 0;
    if (sp > SPIN_STOP) spin = dragVel.clone().multiplyScalar(Math.min(1, SPIN_MAX / sp));
    else goHome();
  }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('lostpointercapture', endDrag);

  function resize() {
    W = stage.clientWidth; H = stage.clientHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    var needW = 1.95 / (Math.tan(camera.fov * Math.PI / 360) * camera.aspect);
    camera.position.set(0, .35, Math.max(CAM_Z, needW));
    camera.lookAt(0, LOOK_Y, 0);
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);

  /* ---------------- loop ---------------- */
  var running = true, prev = performance.now(), clock = 0;
  new IntersectionObserver(function (en) {
    var was = running;
    running = en[0].isIntersecting;
    if (running && !was) { prev = performance.now(); requestAnimationFrame(loop); }
  }).observe(hero);

  function loop(now) {
    if (!running) return;
    var dt = clamp((now - prev) / 1000, 0, .05); prev = now; clock += dt;
    if (!dragging && spin) {
      var sp = spin.length();
      if (sp < SPIN_STOP) { spin = null; goHome(); }
      else {
        rotQ.premultiply(tq.setFromAxisAngle(tAxis.copy(spin).divideScalar(sp), sp * dt)).normalize();
        spin.multiplyScalar(Math.exp(-dt * FRICTION));
      }
    } else if (!dragging && ret) {
      var rk = clamp((now - ret.t0) / ret.dur, 0, 1);
      rotQ.slerpQuaternions(ret.from, HOME, (1 - Math.cos(Math.PI * rk)) / 2);
      if (rk >= 1) { rotQ.copy(HOME); ret = null; }
    }
    if (!dragging && !spin) {
      // turntable only once the model is back at rest
      if (!ret) { HOME.premultiply(tq.setFromAxisAngle(Y_UP, AUTO_SPEED * dt)); rotQ.copy(HOME); }
    }
    exoT += ((exo ? 1 : 0) - exoT) * Math.min(1, dt * 4.5);
    if (Math.abs(exoT - (exo ? 1 : 0)) < .002) exoT = exo ? 1 : 0;

    var p = products[cur];
    if (slide) {
      var k = clamp((now - slide.t0) / 1100, 0, 1), e = easeInOut(k);
      slide.from.root.position.x = -slide.dir * 9 * e;
      slide.from.root.quaternion.copy(slide.qFrom).premultiply(tq.setFromAxisAngle(Y_UP, e * slide.dir * 1.2));
      slide.to.root.position.x = slide.dir * 9 * (1 - e);
      slide.to.root.quaternion.copy(rotQ).premultiply(tq.setFromAxisAngle(Y_UP, -slide.dir * .9 * (1 - e)));
      [slide.from, slide.to].forEach(function (q) { q.setExo(exoT); q.tick(clock); });
      floor.position.y = MODEL_Y - lerp(slide.from.halfH, slide.to.halfH, e) - .02;
      if (k >= 1) {
        slide.from.root.visible = false;
        slide.from.root.position.x = 0;
        slide = null;
        setCallouts(currentCallouts());
      }
    } else {
      p.root.quaternion.copy(rotQ);
      p.setExo(exoT);
      p.tick(clock);
      floor.position.y = MODEL_Y - p.halfH - .02;
    }
    products.forEach(function (q) { q.root.position.y = MODEL_Y; });
    ringLine.rotation.y = tickLines.rotation.y = -clock * .05;

    renderer.render(scene, camera);
    updateCallouts(clock, dt);
    requestAnimationFrame(loop);
  }

  /* ---------------- glove model (async) ---------------- */
  function loadGlove() {
    var p = products.find(function (q) { return q.id === 'impact'; });
    if (!p) return;
    function parse() {
      var bin = atob(window.KINESIS_MODELS.impact), buf = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      var loader = new T.GLTFLoader();
      loader.setMeshoptDecoder(T.MeshoptDecoder);
      loader.parse(buf.buffer, '', function (gltf) {
        // build in a clean frame: the stage may already be spinning this slot
        p.root.position.set(0, 0, 0); p.root.rotation.set(0, 0, 0);
        p.root.updateMatrixWorld(true);
        buildImpact(p, gltf);
        finalise(p);
        p.ready = true;
        if (products[cur] === p) {
          hero.classList.remove('loading-model');
          if (!slide) setCallouts(currentCallouts());
        }
        window.KINESIS_MODELS.impact = null;
      }, function (err) { console.error('Glove model failed to load', err); });
    }
    if (window.KINESIS_MODELS && window.KINESIS_MODELS.impact) { parse(); return; }
    var s = document.createElement('script');
    s.src = 'assets/models/impact-glove.js';
    s.onload = parse;
    document.body.appendChild(s);
  }

  // deep links: index.html#vortex starts on that product, ?exo opens the exoskeleton view
  var start = products.findIndex(function (q) { return q.id === location.hash.slice(1); });
  if (start > 0) cur = start;
  products[cur].root.visible = true;

  resize();
  updateLabels(false);
  if (/[?&]exo\b/.test(location.search)) { exo = true; exoT = 1; toggle.setAttribute('aria-pressed', 'true'); hero.classList.add('exo'); layer.classList.add('exo'); }
  setCallouts(currentCallouts());
  hero.classList.add('ready');
  requestAnimationFrame(loop);
  loadGlove();

  window.KINESIS.heroApi = { goTo: goTo, setMode: setMode, products: products, camera: camera,
    pose: function (y, x, z) { HOME0.setFromEuler(new T.Euler(x || 0, y, z || 0)); HOME.copy(HOME0); rotQ.copy(HOME); ret = null; spin = null; },
    autoRotate: function (v) { AUTO_SPEED = v; } };
  }
})();
