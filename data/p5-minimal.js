/*! Minimal P5.js subset for Onchain Rugs - Only functions used in rug generation */
(function() {
  'use strict';
  
  // Minimal P5.js implementation with only the functions we need
  function createMinimalP5() {
    return function(sketch) {
      let canvas, ctx;
      let width, height;
      let fillColor = [0, 0, 0, 255];
      let strokeColor = [0, 0, 0, 255];
      let strokeWeight = 1;
      let noStrokeFlag = false;
      let noFillFlag = false;
      let blendMode = 'NORMAL';
      
      // Constants
      const PI = Math.PI;
      const HALF_PI = Math.PI / 2;
      const MULTIPLY = 'MULTIPLY';
      
      // Transform stack
      let transformStack = [];
      let currentTransform = { x: 0, y: 0, rotation: 0 };
      
      // Setup function
      sketch.setup = function() {
        if (typeof sketch._setup === 'function') {
          sketch._setup();
        }
      };
      
      // Draw function
      sketch.draw = function() {
        if (typeof sketch._draw === 'function') {
          sketch._draw();
        }
      };
      
      // Canvas functions
      sketch.createCanvas = function(w, h) {
        width = w;
        height = h;
        canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        return canvas;
      };
      
      sketch.pixelDensity = function(d) {
        // Minimal implementation - just store the value
        return d;
      };
      
      sketch.noLoop = function() {
        // Minimal implementation - just a flag
        return;
      };
      
      sketch.background = function(r, g, b) {
        if (ctx) {
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fillRect(0, 0, width, height);
        }
      };
      
      // Transform functions
      sketch.push = function() {
        transformStack.push({...currentTransform});
      };
      
      sketch.pop = function() {
        if (transformStack.length > 0) {
          currentTransform = transformStack.pop();
          if (ctx) {
            ctx.restore();
          }
        }
      };
      
      sketch.translate = function(x, y) {
        currentTransform.x += x;
        currentTransform.y += y;
        if (ctx) {
          ctx.translate(x, y);
        }
      };
      
      sketch.rotate = function(angle) {
        currentTransform.rotation += angle;
        if (ctx) {
          ctx.rotate(angle);
        }
      };
      
      // Drawing primitives
      sketch.rect = function(x, y, w, h) {
        if (!ctx) return;
        
        ctx.save();
        if (blendMode === MULTIPLY) {
          ctx.globalCompositeOperation = 'multiply';
        }
        
        if (!noFillFlag) {
          ctx.fillStyle = `rgba(${fillColor[0]}, ${fillColor[1]}, ${fillColor[2]}, ${fillColor[3]/255})`;
          ctx.fillRect(x, y, w, h);
        }
        
        if (!noStrokeFlag) {
          ctx.strokeStyle = `rgba(${strokeColor[0]}, ${strokeColor[1]}, ${strokeColor[2]}, ${strokeColor[3]/255})`;
          ctx.lineWidth = strokeWeight;
          ctx.strokeRect(x, y, w, h);
        }
        
        ctx.restore();
      };
      
      sketch.ellipse = function(x, y, w, h) {
        if (!ctx) return;
        
        ctx.save();
        if (blendMode === MULTIPLY) {
          ctx.globalCompositeOperation = 'multiply';
        }
        
        ctx.beginPath();
        ctx.ellipse(x, y, w/2, h/2, 0, 0, 2 * Math.PI);
        
        if (!noFillFlag) {
          ctx.fillStyle = `rgba(${fillColor[0]}, ${fillColor[1]}, ${fillColor[2]}, ${fillColor[3]/255})`;
          ctx.fill();
        }
        
        if (!noStrokeFlag) {
          ctx.strokeStyle = `rgba(${strokeColor[0]}, ${strokeColor[1]}, ${strokeColor[2]}, ${strokeColor[3]/255})`;
          ctx.lineWidth = strokeWeight;
          ctx.stroke();
        }
        
        ctx.restore();
      };
      
      sketch.arc = function(x, y, w, h, start, stop) {
        if (!ctx) return;
        
        ctx.save();
        if (blendMode === MULTIPLY) {
          ctx.globalCompositeOperation = 'multiply';
        }
        
        ctx.beginPath();
        ctx.ellipse(x, y, w/2, h/2, 0, start, stop);
        
        if (!noFillFlag) {
          ctx.fillStyle = `rgba(${fillColor[0]}, ${fillColor[1]}, ${fillColor[2]}, ${fillColor[3]/255})`;
          ctx.fill();
        }
        
        if (!noStrokeFlag) {
          ctx.strokeStyle = `rgba(${strokeColor[0]}, ${strokeColor[1]}, ${strokeColor[2]}, ${strokeColor[3]/255})`;
          ctx.lineWidth = strokeWeight;
          ctx.stroke();
        }
        
        ctx.restore();
      };
      
      sketch.beginShape = function() {
        if (ctx) {
          ctx.beginPath();
        }
      };
      
      sketch.endShape = function() {
        if (!ctx) return;
        
        ctx.save();
        if (blendMode === MULTIPLY) {
          ctx.globalCompositeOperation = 'multiply';
        }
        
        if (!noFillFlag) {
          ctx.fillStyle = `rgba(${fillColor[0]}, ${fillColor[1]}, ${fillColor[2]}, ${fillColor[3]/255})`;
          ctx.fill();
        }
        
        if (!noStrokeFlag) {
          ctx.strokeStyle = `rgba(${strokeColor[0]}, ${strokeColor[1]}, ${strokeColor[2]}, ${strokeColor[3]/255})`;
          ctx.lineWidth = strokeWeight;
          ctx.stroke();
        }
        
        ctx.restore();
      };
      
      sketch.vertex = function(x, y) {
        if (ctx) {
          ctx.lineTo(x, y);
        }
      };
      
      // Styling functions
      sketch.fill = function(r, g, b, a) {
        if (typeof r === 'string') {
          // Handle hex colors
          const hex = r.replace('#', '');
          const num = parseInt(hex, 16);
          fillColor = [
            (num >> 16) & 255,
            (num >> 8) & 255,
            num & 255,
            a !== undefined ? a : 255
          ];
        } else {
          fillColor = [r, g, b, a !== undefined ? a : 255];
        }
        noFillFlag = false;
      };
      
      sketch.noFill = function() {
        noFillFlag = true;
      };
      
      sketch.stroke = function(r, g, b, a) {
        if (typeof r === 'string') {
          // Handle hex colors
          const hex = r.replace('#', '');
          const num = parseInt(hex, 16);
          strokeColor = [
            (num >> 16) & 255,
            (num >> 8) & 255,
            num & 255,
            a !== undefined ? a : 255
          ];
        } else {
          strokeColor = [r, g, b, a !== undefined ? a : 255];
        }
        noStrokeFlag = false;
      };
      
      sketch.noStroke = function() {
        noStrokeFlag = true;
      };
      
      sketch.strokeWeight = function(w) {
        strokeWeight = w;
      };
      
      sketch.blendMode = function(mode) {
        blendMode = mode;
      };
      
      // Color functions
      sketch.color = function(r, g, b, a) {
        if (typeof r === 'string') {
          // Handle hex colors
          const hex = r.replace('#', '');
          const num = parseInt(hex, 16);
          return {
            r: (num >> 16) & 255,
            g: (num >> 8) & 255,
            b: num & 255,
            a: a !== undefined ? a : 255
          };
        }
        return { r: r, g: g, b: b, a: a !== undefined ? a : 255 };
      };
      
      sketch.red = function(c) {
        return c.r;
      };
      
      sketch.green = function(c) {
        return c.g;
      };
      
      sketch.blue = function(c) {
        return c.b;
      };
      
      sketch.lerpColor = function(c1, c2, amt) {
        return {
          r: Math.round(c1.r + (c2.r - c1.r) * amt),
          g: Math.round(c1.g + (c2.g - c1.g) * amt),
          b: Math.round(c1.b + (c2.b - c1.b) * amt),
          a: Math.round(c1.a + (c2.a - c1.a) * amt)
        };
      };
      
      sketch.constrain = function(n, low, high) {
        return Math.max(low, Math.min(high, n));
      };
      
      // Math functions
      sketch.noise = function(x, y, z) {
        // Simple noise implementation using Math.sin
        if (z !== undefined) {
          return (Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453) % 1;
        }
        return (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
      };
      
      sketch.sin = function(angle) {
        return Math.sin(angle);
      };
      
      sketch.cos = function(angle) {
        return Math.cos(angle);
      };
      
      sketch.lerp = function(start, stop, amt) {
        return start + (stop - start) * amt;
      };
      
      sketch.map = function(value, start1, stop1, start2, stop2) {
        return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
      };
      
      // Properties
      sketch.width = function() { return width; };
      sketch.height = function() { return height; };
      sketch.PI = PI;
      sketch.HALF_PI = HALF_PI;
      sketch.MULTIPLY = MULTIPLY;
      
      // Return the sketch object
      return sketch;
    };
  }
  
  // Export to global scope
  if (typeof window !== 'undefined') {
    window.p5 = createMinimalP5();
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = createMinimalP5();
  }
})();
