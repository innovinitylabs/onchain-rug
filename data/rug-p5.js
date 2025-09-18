// rug-p5.js — ultra-slim p5-like shim tailored to rug-algorithm.js
// Includes: createCanvas, engine (setup/draw auto-run), drawing primitives,
// color() with hex/rgb parsing, fill/stroke accepting color objects,
// pixelDensity scaling, Perlin noise (p5-style), basic math helpers,
// blend mode constant(s), and other helpers your algo uses.

// ===== state =====
let __p5 = {
    ctx: null,
    canvas: null,
    width: 0,
    height: 0,
    fillStyle: null,
    strokeStyle: '#000',
    doFill: true,
    doStroke: true,
    blend: 'source-over',
    stack: [],
    pixelDensity: 1,
  };
  
  // ===== createCanvas (auto-attach and returns p5-like object) =====
  function createCanvas(w, h) {
    const c = document.createElement('canvas');
  
    // logical size
    __p5.width = w;
    __p5.height = h;
  
    // set id like p5 default so CSS targeting works
    if (!document.querySelector('#defaultCanvas0')) c.id = 'defaultCanvas0';
  
    // initial backing store matches logical size (will be scaled by pixelDensity)
    const d = __p5.pixelDensity || 1;
    c.width = Math.floor(w * d);
    c.height = Math.floor(h * d);
    c.style.width = w + 'px';
    c.style.height = h + 'px';
  
    __p5.canvas = c;
    __p5.ctx = c.getContext('2d');
  
    // scale ctx according to density
    __p5.ctx.setTransform(1,0,0,1,0,0);
    __p5.ctx.scale(d, d);
  
    // convenience global width/height (read-only)
    Object.defineProperty(window, 'width', { get: () => __p5.width });
    Object.defineProperty(window, 'height', { get: () => __p5.height });
  
    // attach canvas to DOM
    document.body.appendChild(c);
  
    // return p5-like element object with .elt and .parent()
    return {
      elt: c,
      parent: function (idOrEl) {
        const el = typeof idOrEl === 'string' ? document.getElementById(idOrEl) : idOrEl;
        if (el) el.appendChild(c);
      }
    };
  }
  
  // ===== noLoop / pixelDensity =====
  let _noLoop = false;
  function noLoop() {
    _noLoop = true;
    window.noLoopCalled = true;
  }
  
  function pixelDensity(d) {
    __p5.pixelDensity = d;
    if (!__p5.canvas) return;
    // keep logical dimensions in __p5.width/__p5.height, scale backing store
    __p5.canvas.width  = Math.floor(__p5.width  * d);
    __p5.canvas.height = Math.floor(__p5.height * d);
    __p5.canvas.style.width  = __p5.width + 'px';
    __p5.canvas.style.height = __p5.height + 'px';
    __p5.ctx.setTransform(1,0,0,1,0,0);
    __p5.ctx.scale(d, d);
  }
  
  // ===== background / fill / stroke / strokeWeight / blendMode =====
  function background(r, g, b, a) {
    if (!__p5.ctx) return;
    __p5.ctx.save();
    if (typeof r === 'string') {
      __p5.ctx.globalAlpha = 1;
      __p5.ctx.fillStyle = r;
      __p5.ctx.fillRect(0, 0, __p5.width, __p5.height);
      __p5.ctx.restore();
      return;
    }
    if (typeof a === 'undefined') a = 255;
    __p5.ctx.globalAlpha = a / 255;
    __p5.ctx.fillStyle = `rgb(${r},${g},${b})`;
    __p5.ctx.fillRect(0, 0, __p5.width, __p5.height);
    __p5.ctx.restore();
  }
  
  // Helper to produce color object compatible with p5 usage
  function _hexToLevels(hex) {
    hex = String(hex).replace('#','').trim();
    if (hex.length === 3) hex = hex.split('').map(c=>c+c).join('');
    if (hex.length !== 6) return null;
    const r = parseInt(hex.slice(0,2),16);
    const g = parseInt(hex.slice(2,4),16);
    const b = parseInt(hex.slice(4,6),16);
    return [r,g,b,255];
  }
  
  function color(r, g, b, a) {
    // already a p5-like color object
    if (typeof r === 'object' && r !== null && 'levels' in r) return r;
  
    // string input: hex or rgb(a)
    if (typeof r === 'string') {
      const hexLevels = _hexToLevels(r);
      if (hexLevels) {
        const [rr,gg,bb,aa] = hexLevels;
        return {
          levels: [rr,gg,bb,aa],
          toString() { return aa < 255 ? `rgba(${rr},${gg},${bb},${aa/255})` : `rgb(${rr},${gg},${bb})`; }
        };
      }
      const m = r.match(/rgba?\(([^)]+)\)/);
      if (m) {
        const parts = m[1].split(',').map(p=>p.trim());
        const rr = Number(parts[0])||0;
        const gg = Number(parts[1])||0;
        const bb = Number(parts[2])||0;
        const aa = parts[3] ? Math.round(Number(parts[3])*255) : 255;
        return {
          levels: [rr,gg,bb,aa],
          toString() { return aa < 255 ? `rgba(${rr},${gg},${bb},${aa/255})` : `rgb(${rr},${gg},${bb})`; }
        };
      }
      // fallback — return object but keep string as toString
      return { levels:[0,0,0,255], toString(){ return r; } };
    }
  
    // numeric: grayscale or rgb
    if (typeof g === 'undefined') { g = r; b = r; }
    if (typeof a === 'undefined') a = 255;
    const rr = Number(r)||0, gg = Number(g)||0, bb = Number(b)||0, aa = Number(a)||255;
    return {
      levels: [rr,gg,bb,aa],
      toString() { return aa<255?`rgba(${rr},${gg},${bb},${aa/255})`:`rgb(${rr},${gg},${bb})`; }
    };
  }
  
  function _colorToStyle(c) {
    if (!c) return null;
    if (typeof c === 'string') return c;
    if (typeof c === 'object' && c.levels) return c.toString();
    return String(c);
  }
  
  function fill(r, g, b, a) {
    __p5.doFill = true;
    if (typeof r === 'object' && r !== null && 'levels' in r) {
      __p5.fillStyle = r.toString();
      return;
    }
    if (typeof r === 'string' && g === undefined) {
      __p5.fillStyle = color(r).toString();
      return;
    }
    if (typeof a === 'undefined') a = 255;
    __p5.fillStyle = a < 255 ? `rgba(${r},${g},${b},${a/255})` : `rgb(${r},${g},${b})`;
  }
  
  function noFill() { __p5.doFill = false; }
  
  function stroke(r, g, b, a) {
    __p5.doStroke = true;
    if (typeof r === 'object' && r !== null && 'levels' in r) {
      __p5.strokeStyle = r.toString();
      return;
    }
    if (typeof r === 'string' && g === undefined) {
      __p5.strokeStyle = color(r).toString();
      return;
    }
    if (typeof a === 'undefined') a = 255;
    __p5.strokeStyle = a < 255 ? `rgba(${r},${g},${b},${a/255})` : `rgb(${r},${g},${b})`;
  }
  function noStroke() { __p5.doStroke = false; }
  
  function strokeWeight(w) {
    if (__p5.ctx) __p5.ctx.lineWidth = w;
  }
  
  function blendMode(mode) {
    __p5.blend = mode;
    if (__p5.ctx) __p5.ctx.globalCompositeOperation = mode || 'source-over';
  }
  
  // ===== shapes (respect fillStyle/strokeStyle and blend) =====
  function rect(x, y, w, h) {
    if (!__p5.ctx) return;
    __p5.ctx.save();
    __p5.ctx.globalCompositeOperation = __p5.blend;
    if (__p5.doFill && __p5.fillStyle) {
      __p5.ctx.fillStyle = __p5.fillStyle;
      __p5.ctx.fillRect(x, y, w, h);
    }
    if (__p5.doStroke && __p5.strokeStyle) {
      __p5.ctx.strokeStyle = __p5.strokeStyle;
      __p5.ctx.strokeRect(x, y, w, h);
    }
    __p5.ctx.restore();
  }
  
  function ellipse(x, y, w, h) {
    if (!__p5.ctx) return;
    __p5.ctx.save();
    __p5.ctx.globalCompositeOperation = __p5.blend;
    __p5.ctx.beginPath();
    __p5.ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2);
    if (__p5.doFill && __p5.fillStyle) {
      __p5.ctx.fillStyle = __p5.fillStyle;
      __p5.ctx.fill();
    }
    if (__p5.doStroke && __p5.strokeStyle) {
      __p5.ctx.strokeStyle = __p5.strokeStyle;
      __p5.ctx.stroke();
    }
    __p5.ctx.restore();
  }
  
  function arc(x, y, w, h, start, stop) {
    if (!__p5.ctx) return;
    __p5.ctx.save();
    __p5.ctx.globalCompositeOperation = __p5.blend;
    __p5.ctx.beginPath();
    __p5.ctx.ellipse(x, y, w / 2, h / 2, 0, start, stop);
    if (__p5.doFill && __p5.fillStyle) {
      __p5.ctx.fillStyle = __p5.fillStyle;
      __p5.ctx.fill();
    }
    if (__p5.doStroke && __p5.strokeStyle) {
      __p5.ctx.strokeStyle = __p5.strokeStyle;
      __p5.ctx.stroke();
    }
    __p5.ctx.restore();
  }
  
  // simple beginShape/vertex/endShape (polygon)
  let __shapePath = null;
  function beginShape() { __shapePath = []; }
  function vertex(x, y) { if (__shapePath) __shapePath.push([x,y]); }
  function endShape(close=false) {
    if (!__p5.ctx || !__shapePath || __shapePath.length < 2) { __shapePath = null; return; }
    __p5.ctx.save();
    __p5.ctx.globalCompositeOperation = __p5.blend;
    __p5.ctx.beginPath();
    __p5.ctx.moveTo(__shapePath[0][0], __shapePath[0][1]);
    for (let i = 1; i < __shapePath.length; ++i) {
      __p5.ctx.lineTo(__shapePath[i][0], __shapePath[i][1]);
    }
    if (close) __p5.ctx.closePath();
    if (__p5.doFill && __p5.fillStyle) {
      __p5.ctx.fillStyle = __p5.fillStyle;
      __p5.ctx.fill();
    }
    if (__p5.doStroke && __p5.strokeStyle) {
      __p5.ctx.strokeStyle = __p5.strokeStyle;
      __p5.ctx.stroke();
    }
    __p5.ctx.restore();
    __shapePath = null;
  }
  
  // transforms / state stack
  function push() {
    if (!__p5.ctx) return;
    __p5.ctx.save();
    __p5.stack.push({
      fillStyle: __p5.fillStyle,
      strokeStyle: __p5.strokeStyle,
      doFill: __p5.doFill,
      doStroke: __p5.doStroke,
      blend: __p5.blend,
      lineWidth: __p5.ctx ? __p5.ctx.lineWidth : 1
    });
  }
  function pop() {
    if (!__p5.ctx) return;
    __p5.ctx.restore();
    const s = __p5.stack.pop();
    if (s) {
      __p5.fillStyle = s.fillStyle;
      __p5.strokeStyle = s.strokeStyle;
      __p5.doFill = s.doFill;
      __p5.doStroke = s.doStroke;
      __p5.blend = s.blend;
      if (__p5.ctx) __p5.ctx.globalCompositeOperation = __p5.blend;
      if (__p5.ctx && s.lineWidth) __p5.ctx.lineWidth = s.lineWidth;
    }
  }
  function translate(x,y) { if (__p5.ctx) __p5.ctx.translate(x,y); }
  function rotate(a) { if (__p5.ctx) __p5.ctx.rotate(a); }
  
  // ===== color helpers used by rug-algorithm.js =====
  function red(c) { return (c && c.levels) ? c.levels[0] : 0; }
  function green(c) { return (c && c.levels) ? c.levels[1] : 0; }
  function blue(c) { return (c && c.levels) ? c.levels[2] : 0; }
  
  // ===== lerp / color interpolation / map / constrain =====
  function lerp(a, b, t) { return a + (b - a) * t; }
  function lerpColor(c1, c2, amt) {
    let l1 = (typeof c1 === 'object' && c1.levels) ? c1.levels : [0,0,0,255];
    let l2 = (typeof c2 === 'object' && c2.levels) ? c2.levels : [0,0,0,255];
    return color(
      lerp(l1[0], l2[0], amt),
      lerp(l1[1], l2[1], amt),
      lerp(l1[2], l2[2], amt),
      Math.round(lerp(l1[3], l2[3], amt))
    );
  }
  function map(n, a, b, c, d) { return ((n - a) / (b - a)) * (d - c) + c; }
  function constrain(n, low, high) { return Math.max(low, Math.min(high, n)); }
  
  // ===== Perlin noise (p5-style implementation) =====
  let __perlin = null, __perlinSize = 4095, __perlinOctaves = 4, __perlinAmpFalloff = 0.5;
  function noiseSeed(seed) {
    __perlin = [];
    let lcg = (function() {
      // LCG constants
      let m = 4294967296, a = 1664525, c = 1013904223;
      let z = seed >>> 0;
      return function() {
        z = (a * z + c) % m;
        return z / m;
      };
    })();
    for (let i = 0; i < __perlinSize + 1; i++) __perlin[i] = lcg();
  }
  function noise(x, y = 0, z = 0) {
    if (__perlin === null) {
      __perlin = [];
      for (let i = 0; i < __perlinSize + 1; i++) __perlin[i] = Math.random();
    }
    if (x < 0) x = -x;
    if (y < 0) y = -y;
    if (z < 0) z = -z;
    let xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    let xf = x - xi, yf = y - yi, zf = z - zi;
    let rxf, ryf;
    let r = 0, ampl = 0.5, n1, n2, n3;
    let of = 0;
    for (let o = 0; o < __perlinOctaves; o++) {
      let px = xi & __perlinSize, py = yi & __perlinSize, pz = zi & __perlinSize;
      of = px + py * 157 + pz * 113;
      rxf = fade(xf);
      ryf = fade(yf);
      n1 = lerp(
        lerp(__perlin[of & __perlinSize], __perlin[(of + 1) & __perlinSize], rxf),
        lerp(__perlin[(of + 157) & __perlinSize], __perlin[(of + 158) & __perlinSize], rxf),
        ryf
      );
      n2 = lerp(
        lerp(__perlin[(of + 113) & __perlinSize], __perlin[(of + 114) & __perlinSize], rxf),
        lerp(__perlin[(of + 113 + 157) & __perlinSize], __perlin[(of + 113 + 158) & __perlinSize], rxf),
        ryf
      );
      n3 = lerp(n1, n2, fade(zf));
      r += n3 * ampl;
      ampl *= __perlinAmpFalloff;
      xi <<= 1; xf *= 2;
      yi <<= 1; yf *= 2;
      zi <<= 1; zf *= 2;
      if (xf >= 1.0) { xi++; xf--; }
      if (yf >= 1.0) { yi++; yf--; }
      if (zf >= 1.0) { zi++; zf--; }
    }
    return r;
  }
  function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  
  // ===== Math passthroughs used by your algo =====
  const PI = Math.PI;
  const HALF_PI = Math.PI / 2;
  function sin(a) { return Math.sin(a); }
  function cos(a) { return Math.cos(a); }
  function max(...args) { return Math.max(...args); }
  function floor(n) { return Math.floor(n); }
  
  // ===== small color helpers already added =====
  function red(c) { return (c && c.levels) ? c.levels[0] : 0; }
  function green(c) { return (c && c.levels) ? c.levels[1] : 0; }
  function blue(c) { return (c && c.levels) ? c.levels[2] : 0; }
  
  // ===== export to window =====
  window.createCanvas = createCanvas;
  window.noLoop = noLoop;
  window.pixelDensity = pixelDensity;
  window.background = background;
  window.fill = fill;
  window.noFill = noFill;
  window.stroke = stroke;
  window.noStroke = noStroke;
  window.strokeWeight = strokeWeight;
  window.blendMode = blendMode;
  window.rect = rect;
  window.ellipse = ellipse;
  window.arc = arc;
  window.beginShape = beginShape;
  window.vertex = vertex;
  window.endShape = endShape;
  window.push = push;
  window.pop = pop;
  window.translate = translate;
  window.rotate = rotate;
  window.color = color;
  window.lerp = lerp;
  window.lerpColor = lerpColor;
  window.map = map;
  window.constrain = constrain;
  window.noise = noise;
  window.noiseSeed = noiseSeed;
  window.PI = PI;
  window.HALF_PI = HALF_PI;
  window.sin = sin;
  window.cos = cos;
  window.max = max;
  window.floor = floor;
  window.red = red;
  window.green = green;
  window.blue = blue;
  
  // blend mode constants commonly used
  window.MULTIPLY = 'multiply';
  window.SCREEN   = 'screen';
  window.OVERLAY  = 'overlay';
  window.DARKEST  = 'darken';
  window.LIGHTEST = 'lighten';
  
  // ===== minimal p5-style engine: call setup() on load, loop draw() unless noLoop() =====
  window.addEventListener("load", () => {
    // If user-defined setup exists, call it once
    if (typeof window.setup === "function") {
      try { window.setup(); } catch(e) { console.error('setup() error', e); }
    }
    // draw loop
    if (typeof window.draw === "function") {
      if (!_noLoop) {
        const loop = () => {
          try { window.draw(); } catch(e) { console.error('draw() error', e); }
          requestAnimationFrame(loop);
        };
        loop();
      } else {
        try { window.draw(); } catch(e) { console.error('draw() error', e); }
      }
    }
  });