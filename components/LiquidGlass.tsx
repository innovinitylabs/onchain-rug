'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

// Enhanced Liquid Glass Shader System - Based on original rdev/liquid-glass-react
class LiquidGlassShader {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | null;
  private program: WebGLProgram | null;
  private texture: WebGLTexture | null;
  private mousePosition = { x: 0.5, y: 0.5 };
  private time = 0;
  private animationFrame: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext;
    this.program = null;
    this.texture = null;

    if (this.gl) {
      this.initShaders();
    }
  }

  private initShaders() {
    if (!this.gl) return;

    const vertexShaderSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;

      void main() {
        v_uv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fragmentShaderSource = `
      precision mediump float;
      uniform vec2 u_mouse;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform sampler2D u_texture;
      varying vec2 v_uv;

      // Smooth step function
      float smoothStep(float edge0, float edge1, float x) {
        float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
        return t * t * (3.0 - 2.0 * t);
      }

      // Rounded rectangle SDF (Signed Distance Field)
      float roundedRectSDF(vec2 p, vec2 size, float radius) {
        vec2 d = abs(p) - size + radius;
        return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - radius;
      }

      // Perlin noise approximation
      float noise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(fract(sin(dot(i, vec2(12.9898, 78.233))) * 43758.5453),
              fract(sin(dot(i + vec2(1.0, 0.0), vec2(12.9898, 78.233))) * 43758.5453), u.x),
          mix(fract(sin(dot(i + vec2(0.0, 1.0), vec2(12.9898, 78.233))) * 43758.5453),
              fract(sin(dot(i + vec2(1.0, 1.0), vec2(12.9898, 78.233))) * 43758.5453), u.x),
          u.y
        );
      }

      void main() {
        vec2 uv = v_uv;
        vec2 mouse = u_mouse / u_resolution;

        // Center UV coordinates
        vec2 centeredUV = uv - 0.5;

        // Calculate distance to edge with rounded rectangle
        float distanceToEdge = roundedRectSDF(centeredUV, vec2(0.4, 0.3), 0.1);

        // Create displacement effect (liquid bending)
        float displacement = smoothStep(0.9, -0.1, distanceToEdge);
        float scaled = smoothStep(0.0, 1.0, displacement);

        // Apply displacement to UV coordinates
        vec2 displacedUV = centeredUV * (1.0 + scaled * 0.3) + 0.5;

        // Mouse interaction with elasticity
        vec2 mouseOffset = mouse - 0.5;
        float mouseDistance = length(mouseOffset);
        float mouseInfluence = 1.0 - smoothStep(0.0, 0.5, mouseDistance);

        // Add time-based animation for liquid feel
        float timeInfluence = sin(u_time * 2.0 + mouseDistance * 5.0) * 0.02;

        // Combine effects with elasticity
        vec2 finalUV = mix(displacedUV, uv, mouseInfluence * 0.4) + vec2(timeInfluence, timeInfluence * 0.5);

        // Chromatic aberration (color separation)
        vec2 aberration = mouseOffset * mouseInfluence * 0.02;

        // Sample texture with effects
        vec4 color = texture2D(u_texture, finalUV);
        vec4 colorR = texture2D(u_texture, finalUV + aberration);
        vec4 colorB = texture2D(u_texture, finalUV - aberration);

        // Add frosty effect using noise
        float frost = noise(uv * 15.0 + u_time * 0.5) * 0.1;
        color.rgb += vec3(frost);

        // Edge highlights
        float edgeGlow = smoothStep(0.85, 0.95, 1.0 - distanceToEdge);
        color.rgb += vec3(edgeGlow * 0.2);

        // Combine with chromatic aberration
        gl_FragColor = vec4(colorR.r, color.g, colorB.b, color.a);
      }
    `;

    // Create shaders
    const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) return;

    // Create program
    this.program = this.gl.createProgram();
    if (!this.program) return;

    this.gl.attachShader(this.program, vertexShader);
    this.gl.attachShader(this.program, fragmentShader);
    this.gl.linkProgram(this.program);

    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      console.error('Shader program linking failed:', this.gl.getProgramInfoLog(this.program));
      return;
    }

    // Create quad geometry
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]);

    const positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

    const positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
  }

  private createShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null;

    const shader = this.gl.createShader(type);
    if (!shader) return null;

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compilation failed:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  updateMouse(mouseX: number, mouseY: number) {
    this.mousePosition = { x: mouseX, y: mouseY };
  }

  render() {
    if (!this.gl || !this.program) return;

    this.time += 0.016; // ~60fps

    this.gl.useProgram(this.program);

    // Set uniforms
    const mouseLocation = this.gl.getUniformLocation(this.program, 'u_mouse');
    const resolutionLocation = this.gl.getUniformLocation(this.program, 'u_resolution');
    const timeLocation = this.gl.getUniformLocation(this.program, 'u_time');

    this.gl.uniform2f(mouseLocation, this.mousePosition.x, this.mousePosition.y);
    this.gl.uniform2f(resolutionLocation, this.canvas.width, this.canvas.height);
    this.gl.uniform1f(timeLocation, this.time);

    // Render
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  }

  startAnimation() {
    const animate = () => {
      this.render();
      this.animationFrame = requestAnimationFrame(animate);
    };
    animate();
  }

  stopAnimation() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  destroy() {
    this.stopAnimation();
    if (this.gl && this.program) {
      this.gl.deleteProgram(this.program);
    }
  }
}

interface LiquidGlassProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  displacementScale?: number;
  blurAmount?: number;
  saturation?: number;
  aberrationIntensity?: number;
  elasticity?: number;
  cornerRadius?: number;
  mode?: 'standard' | 'polar' | 'prominent' | 'shader';
  overLight?: boolean;
  onClick?: () => void;
  mouseContainer?: React.RefObject<HTMLElement | null>;
}

export default function LiquidGlass({
  children,
  className = '',
  style = {},
  displacementScale = 70,
  blurAmount = 0.0625,
  saturation = 140,
  aberrationIntensity = 2,
  elasticity = 0.15,
  cornerRadius = 12,
  mode = 'standard',
  overLight = false,
  onClick,
  mouseContainer
}: LiquidGlassProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shaderRef = useRef<LiquidGlassShader | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Initialize shader system
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!canvas || !container) return;

    // Update dimensions
    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      setDimensions({ width: rect.width, height: rect.height });
    };

    updateDimensions();

    // Initialize shader
    shaderRef.current = new LiquidGlassShader(canvas);
    shaderRef.current.startAnimation();

    // Handle resize
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (shaderRef.current) {
        shaderRef.current.destroy();
      }
    };
  }, []);

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container || !shaderRef.current) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setMousePos({ x, y });
      shaderRef.current.updateMouse(x, y);
    };

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseenter', handleMouseEnter);
      container.addEventListener('mouseleave', handleMouseLeave);
      return () => {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseenter', handleMouseEnter);
        container.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        ...style,
        background: overLight
          ? 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))'
          : 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
        backdropFilter: `blur(${blurAmount * 100}px)`,
        WebkitBackdropFilter: `blur(${blurAmount * 100}px)`,
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: `${cornerRadius}px`,
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        transition: `all ${elasticity}s ease-out`,
        transform: isHovered ? `scale(${1 + elasticity * 0.1})` : 'scale(1)',
      }}
      onClick={onClick}
    >
      {/* WebGL Canvas for advanced liquid glass effects */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{
          zIndex: 2,
          opacity: 0.9,
          mixBlendMode: 'multiply'
        }}
      />

      {/* Content with liquid glass effects */}
      <div
        className="relative z-10"
        style={{
          filter: `saturate(${saturation}%)`,
          transition: `all ${elasticity}s ease-out`,
        }}
      >
        {children}
      </div>

      {/* Enhanced liquid glass overlay effects */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px,
              rgba(255,255,255,${aberrationIntensity * 0.15}) 0%,
              rgba(255,255,255,${aberrationIntensity * 0.08}) 25%,
              transparent 60%
            )
          `,
          zIndex: 5,
          mixBlendMode: 'overlay',
          opacity: isHovered ? 1 : 0.7,
          transition: `opacity ${elasticity}s ease-out`,
        }}
      />

      {/* Displacement-based highlight effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(135deg,
              rgba(255,255,255,${displacementScale * 0.004}) 0%,
              transparent 35%,
              transparent 65%,
              rgba(255,255,255,${displacementScale * 0.002}) 100%
            )
          `,
          zIndex: 6,
        }}
      />

      {/* Liquid edge refraction effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: `
            inset 0 1px 0 rgba(255,255,255,${displacementScale * 0.005}),
            inset 0 -1px 0 rgba(255,255,255,${displacementScale * 0.003}),
            inset 1px 0 0 rgba(255,255,255,${displacementScale * 0.004}),
            inset -1px 0 0 rgba(255,255,255,${displacementScale * 0.002})
          `,
          zIndex: 7,
        }}
      />

      {/* Dynamic liquid ripple effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px,
              rgba(255,255,255,${isHovered ? 0.12 : 0}) 0%,
              rgba(255,255,255,${isHovered ? 0.06 : 0}) 35%,
              transparent 70%
            )
          `,
          zIndex: 8,
          transition: `all ${elasticity * 0.6}s ease-out`,
        }}
      />

      {/* Chromatic aberration edges */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(45deg,
              rgba(255,0,0,${aberrationIntensity * 0.02}) 0%,
              transparent 25%,
              transparent 75%,
              rgba(0,0,255,${aberrationIntensity * 0.02}) 100%
            )
          `,
          zIndex: 9,
          opacity: isHovered ? 0.8 : 0.4,
          transition: `opacity ${elasticity}s ease-out`,
        }}
      />
    </div>
  );
}
