'use client';

import React, { useRef, useEffect, useState } from 'react';

// Fragment shader for liquid glass effect
const liquidGlassFragmentShader = `
  uniform vec2 u_mouse;
  uniform vec2 u_resolution;
  uniform float u_time;

  // Smooth step function
  float smoothStep(float edge0, float edge1, float x) {
    float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
    return t * t * (3.0 - 2.0 * t);
  }

  // Rounded rectangle SDF
  float roundedRectSDF(vec2 p, vec2 size, float radius) {
    vec2 d = abs(p) - size + radius;
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - radius;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 mouse = u_mouse / u_resolution.xy;

    // Center UV coordinates
    vec2 centeredUV = uv - 0.5;

    // Calculate distance to edge with rounded rectangle
    float distanceToEdge = roundedRectSDF(centeredUV, vec2(0.3, 0.2), 0.6);

    // Create displacement effect
    float displacement = smoothStep(0.8, 0.0, distanceToEdge - 0.15);
    float scaled = smoothStep(0.0, 1.0, displacement);

    // Apply displacement to UV coordinates
    vec2 displacedUV = centeredUV * scaled + 0.5;

    // Mouse interaction
    vec2 mouseOffset = mouse - 0.5;
    float mouseDistance = length(mouseOffset);
    float mouseInfluence = smoothStep(0.5, 0.0, mouseDistance);

    // Combine effects
    vec2 finalUV = mix(displacedUV, uv, mouseInfluence * 0.3);

    // Add chromatic aberration
    vec2 aberration = mouseOffset * mouseInfluence * 0.01;

    // Sample colors with aberration
    vec4 color = texture2D(u_texture, finalUV);
    vec4 colorR = texture2D(u_texture, finalUV + aberration);
    vec4 colorB = texture2D(u_texture, finalUV - aberration);

    // Combine with chromatic aberration
    gl_FragColor = vec4(colorR.r, color.g, colorB.b, color.a);
  }
`;

interface LiquidGlassProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  intensity?: number;
  chromaticAberration?: number;
  elasticity?: number;
}

export default function LiquidGlass({
  children,
  className = '',
  style = {},
  intensity = 0.7,
  chromaticAberration = 2,
  elasticity = 0.15
}: LiquidGlassProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!canvas || !container) return;

    // Get container dimensions
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.warn('WebGL not supported, falling back to CSS-only version');
      setIsLoaded(true);
      return;
    }

    // WebGL shader setup would go here
    // For now, we'll use CSS-only version as fallback

    setIsLoaded(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      return () => container.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        ...style,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '12px',
        position: 'relative',
      }}
    >
      {/* Canvas for WebGL effects (hidden for now) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
        style={{ zIndex: 1 }}
      />

      {/* Content with glass effect */}
      <div
        className="relative z-10"
        style={{
          filter: `blur(${intensity * 0.5}px)`,
          transform: `scale(${1 - intensity * 0.05})`,
          transition: `all ${elasticity}s ease-out`,
        }}
      >
        {children}
      </div>

      {/* Glass overlay effects */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px,
              rgba(255,255,255,${chromaticAberration * 0.1}) 0%,
              rgba(255,255,255,${chromaticAberration * 0.05}) 20%,
              transparent 50%
            )
          `,
          zIndex: 5,
          mixBlendMode: 'overlay',
        }}
      />

      {/* Highlight effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(135deg,
              rgba(255,255,255,${intensity * 0.3}) 0%,
              transparent 30%,
              transparent 70%,
              rgba(255,255,255,${intensity * 0.2}) 100%
            )
          `,
          zIndex: 6,
        }}
      />

      {/* Edge highlighting */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: `
            inset 0 1px 0 rgba(255,255,255,${intensity * 0.4}),
            inset 0 -1px 0 rgba(255,255,255,${intensity * 0.2}),
            inset 1px 0 0 rgba(255,255,255,${intensity * 0.3}),
            inset -1px 0 0 rgba(255,255,255,${intensity * 0.1})
          `,
          zIndex: 7,
        }}
      />
    </div>
  );
}
