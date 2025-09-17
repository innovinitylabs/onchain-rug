// Minimal p5.js for rug generation
let canvas, ctx;
const PI = Math.PI;
const HALF_PI = PI/2;

function createCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  ctx = c.getContext('2d');
  canvas = { canvas: c, parent: (id) => document.getElementById(id).appendChild(c) };
  return canvas;
}

function pixelDensity(d) { /* stub */ }
function background(r, g, b) { ctx.fillStyle = `rgb(${r},${g},${b})`; ctx.fillRect(0, 0, canvas.canvas.width, canvas.canvas.height); }
function push() { ctx.save(); }
function pop() { ctx.restore(); }
function translate(x, y) { ctx.translate(x, y); }
function rotate(a) { ctx.rotate(a); }
function fill(r, g, b, a = 255) { ctx.fillStyle = a < 255 ? `rgba(${r},${g},${b},${a/255})` : `rgb(${r},${g},${b})`; }
function noStroke() { ctx.strokeStyle = 'transparent'; }
function stroke(r, g, b) { ctx.strokeStyle = `rgb(${r},${g},${b})`; }
function strokeWeight(w) { ctx.lineWidth = w; }
function rect(x, y, w, h) { ctx.fillRect(x, y, w, h); }
function ellipse(x, y, w, h) { ctx.beginPath(); ctx.ellipse(x, y, w/2, h/2, 0, 0, 2*PI); ctx.fill(); }
function arc(x, y, w, h, sa, ea) { ctx.beginPath(); ctx.ellipse(x, y, w/2, h/2, 0, sa, ea); ctx.fill(); }
function color(hex) { return hex; }
function red(c) { return parseInt(c.slice(1,3),16); }
function green(c) { return parseInt(c.slice(3,5),16); }
function blue(c) { return parseInt(c.slice(5,7),16); }
function lerpColor(c1, c2, amt) { return c1; } // simplified
function noise(x, y = 0) { return Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.5 + 0.5; }
function noiseSeed(s) { /* stub */ }
function map(v, min1, max1, min2, max2) { return min2 + (v - min1) * (max2 - min2) / (max1 - min1); }
function constrain(v, min, max) { return Math.max(min, Math.min(max, v)); }
function beginShape() { ctx.beginPath(); }
function endShape() { ctx.closePath(); ctx.fill(); }
function vertex(x, y) { ctx.lineTo(x, y); }
function blendMode(mode) { /* stub */ }
