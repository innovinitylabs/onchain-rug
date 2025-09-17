'use client';

import { type CSSProperties, forwardRef, useCallback, useEffect, useId, useRef, useState } from "react"
import { ShaderDisplacementGenerator, fragmentShaders } from "./shader-utils"
import { displacementMap, polarDisplacementMap, prominentDisplacementMap } from "./utils"

// Generate shader-based displacement map using shaderUtils
const generateShaderDisplacementMap = (width: number, height: number): string => {
  const generator = new ShaderDisplacementGenerator({
    width,
    height,
    fragment: fragmentShaders.liquidGlass,
  })

  const dataUrl = generator.updateShader()
  generator.destroy()

  return dataUrl
}

const getMap = (mode: "standard" | "polar" | "prominent" | "shader", shaderMapUrl?: string) => {
  switch (mode) {
    case "standard":
      return displacementMap
    case "polar":
      return polarDisplacementMap
    case "prominent":
      return prominentDisplacementMap
    case "shader":
      return shaderMapUrl || displacementMap
    default:
      throw new Error(`Invalid mode: ${mode}`)
  }
}

// Control panel component for tuning the liquid glass effect
export const LiquidGlassControls = ({
  mode,
  setMode,
  displacementScale,
  setDisplacementScale,
  blurAmount,
  setBlurAmount,
  saturation,
  setSaturation,
  aberrationIntensity,
  setAberrationIntensity,
  elasticity,
  setElasticity,
  cornerRadius,
  setCornerRadius,
  overLight,
  setOverLight
}: {
  mode: "standard" | "polar" | "prominent" | "shader"
  setMode: (mode: "standard" | "polar" | "prominent" | "shader") => void
  displacementScale: number
  setDisplacementScale: (value: number) => void
  blurAmount: number
  setBlurAmount: (value: number) => void
  saturation: number
  setSaturation: (value: number) => void
  aberrationIntensity: number
  setAberrationIntensity: (value: number) => void
  elasticity: number
  setElasticity: (value: number) => void
  cornerRadius: number
  setCornerRadius: (value: number) => void
  overLight: boolean
  setOverLight: (value: boolean) => void
}) => {
  return (
    <div className="fixed top-4 right-4 bg-black/95 text-white p-4 rounded-lg shadow-2xl z-[100] max-w-xs max-h-[calc(100vh-2rem)] overflow-y-auto">
      <h3 className="text-lg font-semibold mb-4 sticky top-0 bg-black/95 pb-2">Liquid Glass Controls</h3>

      <div className="space-y-4">
        {/* Refraction Mode */}
        <div>
          <label className="block text-sm font-medium mb-2">Refraction Mode</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as any)}
            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
          >
            <option value="standard">Standard</option>
            <option value="polar">Polar</option>
            <option value="prominent">Prominent</option>
            <option value="shader">Shader (Experimental)</option>
          </select>
        </div>

        {/* Displacement Scale */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Displacement Scale: {displacementScale}
          </label>
          <input
            type="range"
            min="0"
            max="200"
            value={displacementScale}
            onChange={(e) => setDisplacementScale(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Blur Amount */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Blur Amount: {blurAmount.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.01"
            value={blurAmount}
            onChange={(e) => setBlurAmount(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Saturation */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Saturation: {saturation}%
          </label>
          <input
            type="range"
            min="0"
            max="300"
            value={saturation}
            onChange={(e) => setSaturation(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Chromatic Aberration */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Chromatic Aberration: {aberrationIntensity}
          </label>
          <input
            type="range"
            min="0"
            max="10"
            value={aberrationIntensity}
            onChange={(e) => setAberrationIntensity(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Elasticity */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Elasticity: {elasticity.toFixed(3)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.001"
            value={elasticity}
            onChange={(e) => setElasticity(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Corner Radius */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Corner Radius: {cornerRadius}px
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={cornerRadius}
            onChange={(e) => setCornerRadius(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Over Light Toggle */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="overLight"
            checked={overLight}
            onChange={(e) => setOverLight(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="overLight" className="text-sm font-medium">
            Over Light (for bright backgrounds)
          </label>
        </div>
      </div>
    </div>
  )
}

/* ---------- Liquid Glass Filter with proper refraction ---------- */
const LiquidGlassFilter: React.FC<{
  id: string
  displacementScale: number
  aberrationIntensity: number
  width: number
  height: number
  mode: "standard" | "polar" | "prominent" | "shader"
  shaderMapUrl?: string
}> = ({
  id,
  displacementScale,
  aberrationIntensity,
  width,
  height,
  mode,
  shaderMapUrl,
}) => (
  <svg style={{ position: "absolute", width: "100%", height: "100%", pointerEvents: "none", zIndex: 0, inset: 0 }} aria-hidden="true">
    <defs>
      {/* Main displacement map */}
      <filter id={id} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
        {/* Base displacement map */}
        <feImage
          x="0" y="0"
          width="100%" height="100%"
          result="DISPLACEMENT_MAP"
          href={getMap(mode, shaderMapUrl)}
          preserveAspectRatio="xMidYMid slice"
        />

        {/* Create refraction effect by distorting the background */}
        <feDisplacementMap
          in="SourceGraphic"
          in2="DISPLACEMENT_MAP"
          scale={displacementScale}
          xChannelSelector="R"
          yChannelSelector="G"
          result="REFRACTED_BACKGROUND"
        />

        {/* Apply chromatic aberration for realistic glass effect */}
        <feColorMatrix
          in="REFRACTED_BACKGROUND"
          type="matrix"
          values="1.1 0 0 0 0
                 0 1.0 0 0 0
                 0 0 0.9 0 0
                 0 0 0 1 0"
          result="ABERRATED"
        />

        {/* Add subtle blur for glass-like diffusion */}
        <feGaussianBlur
          in="ABERRATED"
          stdDeviation={Math.max(0.1, aberrationIntensity * 0.3)}
          result="GLASS_BLUR"
        />

        {/* Composite with original for edge blending */}
        <feBlend
          in="GLASS_BLUR"
          in2="SourceGraphic"
          mode="multiply"
          result="FINAL_GLASS"
        />
      </filter>

      {/* Additional filter for edge enhancement */}
      <filter id={`${id}-edge`} x="-10%" y="-10%" width="120%" height="120%">
        <feImage
          x="0" y="0"
          width="100%" height="100%"
          result="EDGE_DISPLACEMENT"
          href={getMap(mode, shaderMapUrl)}
          preserveAspectRatio="xMidYMid slice"
        />

        {/* Edge detection and enhancement */}
        <feColorMatrix
          in="EDGE_DISPLACEMENT"
          type="matrix"
          values="1 1 1 0 0
                 1 1 1 0 0
                 1 1 1 0 0
                 0 0 0 1 0"
          result="EDGE_INTENSITY"
        />

        <feConvolveMatrix
          in="EDGE_INTENSITY"
          order="3"
          kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1"
          result="EDGE_DETECTED"
        />

        <feComponentTransfer in="EDGE_DETECTED">
          <feFuncR type="gamma" amplitude="2" exponent="1" offset="0" />
          <feFuncG type="gamma" amplitude="2" exponent="1" offset="0" />
          <feFuncB type="gamma" amplitude="2" exponent="1" offset="0" />
        </feComponentTransfer>
      </filter>
    </defs>
  </svg>
)

/* ---------- container ---------- */
const GlassContainer = forwardRef<
  HTMLDivElement,
  React.PropsWithChildren<{
    className?: string
    style?: React.CSSProperties
    displacementScale?: number
    blurAmount?: number
    saturation?: number
    aberrationIntensity?: number
    mouseOffset?: { x: number; y: number }
    onMouseLeave?: () => void
    onMouseEnter?: () => void
    onMouseDown?: () => void
    onMouseUp?: () => void
    active?: boolean
    overLight?: boolean
    cornerRadius?: number
    padding?: string
    glassSize?: { width: number; height: number }
    onClick?: () => void
    mode?: "standard" | "polar" | "prominent" | "shader"
  }>
>(
  (
    {
      children,
      className = "",
      style,
      displacementScale = 25,
      blurAmount = 12,
      saturation = 180,
      aberrationIntensity = 2,
      onMouseEnter,
      onMouseLeave,
      onMouseDown,
      onMouseUp,
      active = false,
      overLight = false,
      cornerRadius = 999,
      padding = "24px 32px",
      glassSize = { width: 270, height: 69 },
      onClick,
      mode = "standard",
    },
    ref,
  ) => {
    const filterId = useId()
    const [shaderMapUrl, setShaderMapUrl] = useState<string>("")
    const [isFirefox, setIsFirefox] = useState(false)
    const [isMounted, setIsMounted] = useState(false)

    // Handle browser detection safely
    useEffect(() => {
      setIsMounted(true)
      setIsFirefox(typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes("firefox"))
    }, [])

    // Generate shader displacement map when in shader mode
    useEffect(() => {
      if (mode === "shader" && isMounted) {
        const url = generateShaderDisplacementMap(glassSize.width, glassSize.height)
        setShaderMapUrl(url)
      }
    }, [mode, glassSize.width, glassSize.height, isMounted])

    const backdropStyle = {
      filter: isFirefox ? null : `url(#${filterId})`,
      backdropFilter: `blur(${(overLight ? 12 : 4) + blurAmount * 32}px) saturate(${saturation}%)`,
      WebkitBackdropFilter: `blur(${(overLight ? 12 : 4) + blurAmount * 32}px) saturate(${saturation}%)`, // Safari support
    }

    return (
      <div
        ref={ref}
        className={`inline-block ${className} ${active ? "active" : ""} ${Boolean(onClick) ? "cursor-pointer" : ""}`}
        style={{
          ...style,
          display: "inline-block",
          width: "fit-content",
          height: "fit-content",
        }}
        onClick={onClick}
      >
        <LiquidGlassFilter mode={mode} id={filterId} displacementScale={displacementScale} aberrationIntensity={aberrationIntensity} width={glassSize.width} height={glassSize.height} shaderMapUrl={shaderMapUrl} />

        <div
          className="liquid-glass"
          style={{
            borderRadius: `${cornerRadius}px`,
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            gap: "24px",
            padding,
            overflow: "hidden",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: overLight
              ? "0px 16px 70px rgba(0, 0, 0, 0.75)"
              : "0px 12px 40px rgba(0, 0, 0, 0.25), 0px 8px 20px rgba(0, 0, 0, 0.1)",
            background: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
        >
          {/* Refraction layer - background distortion */}
          <div
            className="liquid-glass__refraction"
            style={{
              ...backdropStyle,
              position: "absolute",
              inset: "0",
              zIndex: 1,
              borderRadius: `${cornerRadius}px`,
            }}
          />

          {/* Content layer - stays sharp */}
          <div
            className="liquid-glass__content transition-all duration-300 ease-out text-white"
            style={{
              position: "relative",
              zIndex: 2,
              font: "500 20px/1 system-ui",
              textShadow: overLight
                ? "0px 2px 12px rgba(0, 0, 0, 0)"
                : "0px 2px 12px rgba(0, 0, 0, 0.4)",
              mixBlendMode: overLight ? "screen" : "normal",
            }}
          >
            {children}
          </div>
        </div>
      </div>
    )
  },
)

GlassContainer.displayName = "GlassContainer"

interface LiquidGlassProps {
  children: React.ReactNode
  displacementScale?: number
  blurAmount?: number
  saturation?: number
  aberrationIntensity?: number
  elasticity?: number
  cornerRadius?: number
  globalMousePos?: { x: number; y: number }
  mouseOffset?: { x: number; y: number }
  mouseContainer?: React.RefObject<HTMLElement | null> | null
  className?: string
  padding?: string
  style?: React.CSSProperties
  overLight?: boolean
  mode?: "standard" | "polar" | "prominent" | "shader"
  onClick?: () => void
  showControls?: boolean
}

export default function LiquidGlass({
  children,
  displacementScale = 70,
  blurAmount = 0.0625,
  saturation = 140,
  aberrationIntensity = 2,
  elasticity = 0.15,
  cornerRadius = 999,
  globalMousePos: externalGlobalMousePos,
  mouseOffset: externalMouseOffset,
  mouseContainer = null,
  className = "",
  padding = "24px 32px",
  overLight = false,
  style = {},
  mode = "standard",
  onClick,
  showControls = false,
}: LiquidGlassProps) {
  const glassRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [glassSize, setGlassSize] = useState({ width: 270, height: 69 })
  const [internalGlobalMousePos, setInternalGlobalMousePos] = useState({ x: 0, y: 0 })
  const [internalMouseOffset, setInternalMouseOffset] = useState({ x: 0, y: 0 })
  const [isMounted, setIsMounted] = useState(false)

  // Control state for demo
  const [controls, setControls] = useState({
    mode,
    displacementScale,
    blurAmount,
    saturation,
    aberrationIntensity,
    elasticity,
    cornerRadius,
    overLight,
  })

  // Handle mounting for SSR
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Use external mouse position if provided, otherwise use internal
  const globalMousePos = externalGlobalMousePos || internalGlobalMousePos
  const mouseOffset = externalMouseOffset || internalMouseOffset

  // Internal mouse tracking
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isMounted) return

      const container = mouseContainer?.current || glassRef.current
      if (!container) {
        return
      }

      const rect = container.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      setInternalMouseOffset({
        x: ((e.clientX - centerX) / rect.width) * 100,
        y: ((e.clientY - centerY) / rect.height) * 100,
      })

      setInternalGlobalMousePos({
        x: e.clientX,
        y: e.clientY,
      })
    },
    [mouseContainer, isMounted],
  )

  // Set up mouse tracking if no external mouse position is provided
  useEffect(() => {
    if (!isMounted || (externalGlobalMousePos && externalMouseOffset)) {
      return
    }

    const container = mouseContainer?.current || glassRef.current
    if (!container) {
      return
    }

    container.addEventListener("mousemove", handleMouseMove)
    return () => container.removeEventListener("mousemove", handleMouseMove)
  }, [handleMouseMove, mouseContainer, externalGlobalMousePos, externalMouseOffset, isMounted])

  // Calculate directional scaling based on mouse position
  const calculateDirectionalScale = useCallback(() => {
    if (!isMounted || !globalMousePos.x || !globalMousePos.y || !glassRef.current) {
      return "scale(1)"
    }

    const rect = glassRef.current.getBoundingClientRect()
    const pillCenterX = rect.left + rect.width / 2
    const pillCenterY = rect.top + rect.height / 2
    const pillWidth = glassSize.width
    const pillHeight = glassSize.height

    const deltaX = globalMousePos.x - pillCenterX
    const deltaY = globalMousePos.y - pillCenterY

    // Calculate distance from mouse to pill edges (not center)
    const edgeDistanceX = Math.max(0, Math.abs(deltaX) - pillWidth / 2)
    const edgeDistanceY = Math.max(0, Math.abs(deltaY) - pillHeight / 2)
    const edgeDistance = Math.sqrt(edgeDistanceX * edgeDistanceX + edgeDistanceY * edgeDistanceY)

    // Activation zone: 200px from edges
    const activationZone = 200

    // If outside activation zone, no effect
    if (edgeDistance > activationZone) {
      return "scale(1)"
    }

    // Calculate fade-in factor (1 at edge, 0 at activation zone boundary)
    const fadeInFactor = 1 - edgeDistance / activationZone

    // Normalize the deltas for direction
    const centerDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    if (centerDistance === 0) {
      return "scale(1)"
    }

    const normalizedX = deltaX / centerDistance
    const normalizedY = deltaY / centerDistance

    // Calculate stretch factors with fade-in
    const stretchIntensity = Math.min(centerDistance / 300, 1) * elasticity * fadeInFactor

    // X-axis scaling: stretch horizontally when moving left/right, compress when moving up/down
    const scaleX = 1 + Math.abs(normalizedX) * stretchIntensity * 0.3 - Math.abs(normalizedY) * stretchIntensity * 0.15

    // Y-axis scaling: stretch vertically when moving up/down, compress when moving left/right
    const scaleY = 1 + Math.abs(normalizedY) * stretchIntensity * 0.3 - Math.abs(normalizedX) * stretchIntensity * 0.15

    return `scaleX(${Math.max(0.8, scaleX)}) scaleY(${Math.max(0.8, scaleY)})`
  }, [globalMousePos, elasticity, glassSize, isMounted])

  // Helper function to calculate fade-in factor based on distance from element edges
  const calculateFadeInFactor = useCallback(() => {
    if (!isMounted || !globalMousePos.x || !globalMousePos.y || !glassRef.current) {
      return 0
    }

    const rect = glassRef.current.getBoundingClientRect()
    const pillCenterX = rect.left + rect.width / 2
    const pillCenterY = rect.top + rect.height / 2
    const pillWidth = glassSize.width
    const pillHeight = glassSize.height

    const edgeDistanceX = Math.max(0, Math.abs(globalMousePos.x - pillCenterX) - pillWidth / 2)
    const edgeDistanceY = Math.max(0, Math.abs(globalMousePos.y - pillCenterY) - pillHeight / 2)
    const edgeDistance = Math.sqrt(edgeDistanceX * edgeDistanceX + edgeDistanceY * edgeDistanceY)

    const activationZone = 200
    return edgeDistance > activationZone ? 0 : 1 - edgeDistance / activationZone
  }, [globalMousePos, glassSize, isMounted])

  // Helper function to calculate elastic translation
  const calculateElasticTranslation = useCallback(() => {
    if (!isMounted || !glassRef.current) {
      return { x: 0, y: 0 }
    }

    const fadeInFactor = calculateFadeInFactor()
    const rect = glassRef.current.getBoundingClientRect()
    const pillCenterX = rect.left + rect.width / 2
    const pillCenterY = rect.top + rect.height / 2

    return {
      x: (globalMousePos.x - pillCenterX) * elasticity * 0.1 * fadeInFactor,
      y: (globalMousePos.y - pillCenterY) * elasticity * 0.1 * fadeInFactor,
    }
  }, [globalMousePos, elasticity, calculateFadeInFactor, isMounted])

  // Update glass size whenever component mounts or window resizes
  useEffect(() => {
    if (!isMounted) return

    const updateGlassSize = () => {
      if (glassRef.current) {
        const rect = glassRef.current.getBoundingClientRect()
        setGlassSize({ width: rect.width, height: rect.height })
      }
    }

    updateGlassSize()
    window.addEventListener("resize", updateGlassSize)
    return () => window.removeEventListener("resize", updateGlassSize)
  }, [isMounted])

  const transformStyle = isMounted
    ? `translate(${calculateElasticTranslation().x}px, ${calculateElasticTranslation().y}px) ${isActive && Boolean(onClick) ? "scale(0.96)" : calculateDirectionalScale()}`
    : "translate(0px, 0px) scale(1)"

  const baseStyle = {
    ...style,
    transform: transformStyle,
    transition: "all ease-out 0.2s",
  } as CSSProperties

  // Use controls when showControls is true, otherwise use props
  const currentMode = showControls ? controls.mode : mode
  const currentDisplacementScale = showControls ? controls.displacementScale : displacementScale
  const currentBlurAmount = showControls ? controls.blurAmount : blurAmount
  const currentSaturation = showControls ? controls.saturation : saturation
  const currentAberrationIntensity = showControls ? controls.aberrationIntensity : aberrationIntensity
  const currentElasticity = showControls ? controls.elasticity : elasticity
  const currentCornerRadius = showControls ? controls.cornerRadius : cornerRadius
  const currentOverLight = showControls ? controls.overLight : overLight

  return (
    <>
      {showControls && isMounted && (
        <LiquidGlassControls
          mode={controls.mode}
          setMode={(mode) => setControls(prev => ({ ...prev, mode }))}
          displacementScale={controls.displacementScale}
          setDisplacementScale={(value) => setControls(prev => ({ ...prev, displacementScale: value }))}
          blurAmount={controls.blurAmount}
          setBlurAmount={(value) => setControls(prev => ({ ...prev, blurAmount: value }))}
          saturation={controls.saturation}
          setSaturation={(value) => setControls(prev => ({ ...prev, saturation: value }))}
          aberrationIntensity={controls.aberrationIntensity}
          setAberrationIntensity={(value) => setControls(prev => ({ ...prev, aberrationIntensity: value }))}
          elasticity={controls.elasticity}
          setElasticity={(value) => setControls(prev => ({ ...prev, elasticity: value }))}
          cornerRadius={controls.cornerRadius}
          setCornerRadius={(value) => setControls(prev => ({ ...prev, cornerRadius: value }))}
          overLight={controls.overLight}
          setOverLight={(value) => setControls(prev => ({ ...prev, overLight: value }))}
        />
      )}

      <div
        className="liquid-glass-wrapper"
        style={{
          display: "inline-block",
          width: "fit-content",
          height: "fit-content",
          transform: baseStyle.transform,
          transition: baseStyle.transition,
        }}
      >
        <GlassContainer
          ref={glassRef}
          className={className}
          style={{}}
          cornerRadius={currentCornerRadius}
          displacementScale={currentOverLight ? currentDisplacementScale * 0.5 : currentDisplacementScale}
          blurAmount={currentBlurAmount}
          saturation={currentSaturation}
          aberrationIntensity={currentAberrationIntensity}
          glassSize={glassSize}
          padding={padding}
          mouseOffset={mouseOffset}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onMouseDown={() => setIsActive(true)}
          onMouseUp={() => setIsActive(false)}
          active={isActive}
          overLight={currentOverLight}
          onClick={onClick}
          mode={currentMode}
        >
          {children}
        </GlassContainer>
      </div>
    </>
  )
}
