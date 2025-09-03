'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Float, Text3D, Environment } from '@react-three/drei'
import { Suspense, useRef, useMemo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Import P5.js functions from your generator
declare global {
  interface Window {
    DOORMAT_CONFIG: any
    stripeData: any[]
    characterMap: any
    colorPalettes: any[]
    selectedPalette: any
    warpThickness: number
  }
}

// Advanced Flying Rug Component with Your P5.js Generator Logic
function FlyingRug({ position, scale = 1, seed = 0, dependenciesLoaded }: { 
  position: [number, number, number], 
  scale?: number, 
  seed?: number
  dependenciesLoaded: boolean
}) {
  const rugRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const initialPositions = useRef<Float32Array | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Create rug texture using your P5.js generator logic
  const rugTexture = useMemo(() => {
    if (typeof window === 'undefined' || !dependenciesLoaded) {
      console.log('🚫 Texture generation skipped:', { 
        isWindow: typeof window !== 'undefined', 
        dependenciesLoaded 
      })
      return null
    }
    
    console.log('🎨 Generating rug texture for seed:', seed)
    
    // Create canvas with your generator dimensions
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    
    // Set canvas size to match your generator
    const doormatWidth = window.DOORMAT_CONFIG?.DOORMAT_WIDTH || 800
    const doormatHeight = window.DOORMAT_CONFIG?.DOORMAT_HEIGHT || 1200
    const fringeLength = window.DOORMAT_CONFIG?.FRINGE_LENGTH || 30
    
    console.log('📏 Canvas dimensions:', { doormatWidth, doormatHeight, fringeLength })
    
    // Use the same canvas dimensions as your generator
    canvas.width = doormatHeight + (fringeLength * 4)  // Swapped for rotation
    canvas.height = doormatWidth + (fringeLength * 4)
    
    // Set random seed for consistent generation
    const randomSeed = (seed: number) => {
      let m = 0x80000000
      let a = 1103515245
      let c = 12345
      let state = seed ? seed : Math.floor(Math.random() * (m - 1))
      return () => {
        state = (a * state + c) % m
        return state / m
      }
    }
    
    const random = randomSeed(seed)
    const randomInt = (min: number, max: number) => Math.floor(random() * (max - min + 1)) + min
    
    // Simulate P5.js color function
    const color = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return { r, g, b }
    }
    
    // Simulate P5.js lerpColor function
    const lerpColor = (c1: any, c2: any, amt: number) => {
      const r = Math.round(c1.r + (c2.r - c1.r) * amt)
      const g = Math.round(c1.g + (c2.g - c1.g) * amt)
      const b = Math.round(c1.b + (c2.b - c1.b) * amt)
      return { r, g, b }
    }
    
    // Get palette and generate colors
    const colorPalettes = window.colorPalettes || [
      { name: 'Default', colors: ['#8B4513', '#D2691E', '#A0522D', '#CD853F', '#DEB887'] }
    ]
    const selectedPalette = colorPalettes[seed % colorPalettes.length]
    
    console.log('🎨 Selected palette:', selectedPalette.name, 'with', selectedPalette.colors.length, 'colors')
    
    // Generate stripe data similar to your generator
    const stripeData = []
    const numStripes = randomInt(8, 15)
    for (let i = 0; i < numStripes; i++) {
      stripeData.push({
        y: random() * doormatHeight,
        height: randomInt(20, 80),
        color: selectedPalette.colors[randomInt(0, selectedPalette.colors.length - 1)]
      })
    }
    
    console.log('🔄 Generated', stripeData.length, 'stripes')
    
    // Draw base doormat
    ctx.fillStyle = selectedPalette.colors[0]
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Draw stripes
    stripeData.forEach(stripe => {
      const c = color(stripe.color)
      ctx.fillStyle = `rgb(${c.r}, ${c.g}, ${c.b})`
      ctx.fillRect(0, stripe.y, canvas.width, stripe.height)
    })
    
    // Draw fringe (top and bottom)
    const fringeGradient = ctx.createLinearGradient(0, 0, 0, fringeLength)
    fringeGradient.addColorStop(0, '#5D4037')
    fringeGradient.addColorStop(1, '#3E2723')
    ctx.fillStyle = fringeGradient
    
    for (let i = 0; i < canvas.width; i += 12) {
      // Top fringe
      ctx.fillRect(i, 0, 8, fringeLength)
      ctx.fillRect(i + 2, 0, 4, fringeLength + 10)
      // Bottom fringe
      ctx.fillRect(i, canvas.height - fringeLength, 8, fringeLength)
      ctx.fillRect(i + 2, canvas.height - fringeLength - 10, 4, fringeLength + 10)
    }
    
    // Draw selvedge edges (left and right)
    const selvedgeGradient = ctx.createLinearGradient(0, 0, fringeLength, 0)
    selvedgeGradient.addColorStop(0, '#5D4037')
    selvedgeGradient.addColorStop(1, '#3E2723')
    ctx.fillStyle = selvedgeGradient
    
    for (let i = 0; i < canvas.height; i += 15) {
      // Left selvedge
      ctx.fillRect(0, i, fringeLength, 10)
      ctx.fillRect(0, i + 2, fringeLength + 5, 6)
      // Right selvedge
      ctx.fillRect(canvas.width - fringeLength, i, fringeLength, 10)
      ctx.fillRect(canvas.width - fringeLength - 5, i + 2, fringeLength + 5, 6)
    }
    
    // Add fabric texture noise
    for (let x = 0; x < canvas.width; x += 4) {
      for (let y = 0; y < canvas.height; y += 4) {
        const noise = random() * 0.2 - 0.1
        ctx.fillStyle = `rgba(0, 0, 0, ${Math.abs(noise)})`
        ctx.fillRect(x, y, 2, 2)
      }
    }
    
    // Store canvas reference for potential updates
    canvasRef.current = canvas
    
    console.log('✅ Rug texture generated successfully for seed:', seed)
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    return texture
  }, [seed, dependenciesLoaded])

  // Advanced cloth physics animation (keeping your existing animation)
  useFrame((state) => {
    if (rugRef.current && groupRef.current) {
      const time = state.clock.getElapsedTime()
      const geometry = rugRef.current.geometry as THREE.PlaneGeometry
      const positions = geometry.attributes.position
      
      // Store initial positions on first run
      if (!initialPositions.current) {
        initialPositions.current = new Float32Array(positions.array.length)
        for (let i = 0; i < positions.array.length; i++) {
          initialPositions.current[i] = positions.array[i]
        }
      }
      
      // Advanced cloth simulation with multiple wave patterns
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i)
        const y = positions.getY(i)
        
        // Multiple wave layers for realistic cloth movement
        const wave1 = Math.sin(x * 1.5 + time * 2) * 0.15
        const wave2 = Math.sin(y * 1.2 + time * 1.8) * 0.08
        const wave3 = Math.sin((x + y) * 0.8 + time * 2.5) * 0.05
        const ripple = Math.sin(Math.sqrt(x*x + y*y) * 2 - time * 3) * 0.03
        
        // Wind effect simulation
        const windX = Math.sin(time * 0.7 + x * 0.5) * 0.04
        const windY = Math.cos(time * 0.9 + y * 0.3) * 0.03
        
        // Edge effects for natural cloth behavior
        const edgeFactorX = Math.abs(x) / 2
        const edgeFactorY = Math.abs(y) / 3
        const edgeAmplification = 1 + (edgeFactorX + edgeFactorY) * 0.5
        
        const totalWave = (wave1 + wave2 + wave3 + ripple + windX + windY) * edgeAmplification
        positions.setZ(i, totalWave)
      }
      positions.needsUpdate = true
      
      // Enhanced floating motion with realistic physics
      const floatY = Math.sin(time * 0.4 + position[0]) * 0.4 + Math.cos(time * 0.6) * 0.2
      const driftX = Math.sin(time * 0.2) * 0.3
      const driftZ = Math.cos(time * 0.25) * 0.2
      
      groupRef.current.position.set(
        position[0] + driftX,
        position[1] + floatY,
        position[2] + driftZ
      )
      
      // Complex rotation for natural flying motion
      groupRef.current.rotation.y = Math.sin(time * 0.3) * 0.15 + Math.cos(time * 0.5) * 0.05
      groupRef.current.rotation.x = Math.sin(time * 0.4) * 0.08 + Math.cos(time * 0.7) * 0.03
      groupRef.current.rotation.z = Math.sin(time * 0.2) * 0.05
    }
  })

  // Don't render until dependencies are loaded
  if (!dependenciesLoaded || !rugTexture) {
    return null
  }

  return (
    <group ref={groupRef} position={position} scale={[scale, scale, scale]}>
      <Float speed={0.3} rotationIntensity={0.08} floatIntensity={0.15}>
        <mesh ref={rugRef} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <planeGeometry args={[4, 6, 48, 48]} />
          <meshStandardMaterial 
            map={rugTexture} 
            side={THREE.DoubleSide}
            transparent
            opacity={0.95}
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>
        
        {/* Enhanced glow with multiple layers */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
          <planeGeometry args={[4.3, 6.3]} />
          <meshBasicMaterial 
            color="#8B4513" 
            transparent 
            opacity={0.15}
            side={THREE.DoubleSide}
          />
        </mesh>
        
        {/* Magical shimmer effect */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <planeGeometry args={[4.1, 6.1]} />
          <meshBasicMaterial 
            color="#ffd700" 
            transparent 
            opacity={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
      </Float>
    </group>
  )
}

// Floating particles
function FloatingParticles() {
  const particlesRef = useRef<THREE.Points>(null)
  
  const particles = useMemo(() => {
    const temp = []
    for (let i = 0; i < 100; i++) {
      temp.push([
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 50
      ])
    }
    return temp
  }, [])

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.getElapsedTime() * 0.1
    }
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length}
          array={new Float32Array(particles.flat())}
          itemSize={3}
          args={[new Float32Array(particles.flat()), 3]}
        />
      </bufferGeometry>
      <pointsMaterial size={0.1} color="#f59e0b" transparent opacity={0.6} />
    </points>
  )
}

// Enhanced Magical Scene
function Scene() {
  const lightRef = useRef<THREE.DirectionalLight>(null)
  const [dependenciesLoaded, setDependenciesLoaded] = useState(false)

  // Load P5.js dependencies
  useEffect(() => {
    const loadDependencies = async () => {
      try {
        console.log('🔄 Loading P5.js dependencies...')
        
        // Load color palettes
        if (!window.colorPalettes) {
          console.log('📚 Loading color palettes...')
          const colorPalettesResponse = await fetch('/lib/doormat/color-palettes.js')
          const colorPalettesText = await colorPalettesResponse.text()
          // Extract the colorPalettes array from the JS file
          const colorPalettesMatch = colorPalettesText.match(/const colorPalettes = (\[[\s\S]*?\]);/)
          if (colorPalettesMatch) {
            const colorPalettesCode = colorPalettesMatch[1]
            // Use Function constructor to safely evaluate the array
            window.colorPalettes = new Function(`return ${colorPalettesCode}`)()
            console.log('✅ Color palettes loaded:', window.colorPalettes.length, 'palettes')
          }
        }

        // Load character map
        if (!window.characterMap) {
          console.log('🔤 Loading character map...')
          const characterMapResponse = await fetch('/lib/doormat/character-map.js')
          const characterMapText = await characterMapResponse.text()
          const characterMapMatch = characterMapText.match(/const characterMap = (\{[\s\S]*?\});/)
          if (characterMapMatch) {
            const characterMapCode = characterMapMatch[1]
            window.characterMap = new Function(`return ${characterMapCode}`)()
            console.log('✅ Character map loaded:', Object.keys(window.characterMap).length, 'characters')
          }
        }

        // Load doormat config
        if (!window.DOORMAT_CONFIG) {
          console.log('⚙️ Loading doormat config...')
          const configResponse = await fetch('/lib/doormat/doormat-config.js')
          const configText = await configResponse.text()
          const configMatch = configText.match(/window\.DOORMAT_CONFIG = (\{[\s\S]*?\});/)
          if (configMatch) {
            const configCode = configMatch[1]
            window.DOORMAT_CONFIG = new Function(`return ${configCode}`)()
            console.log('✅ Doormat config loaded:', window.DOORMAT_CONFIG)
          }
        }

        console.log('🎉 All P5.js dependencies loaded successfully!')
        setDependenciesLoaded(true)
      } catch (error) {
        console.error('❌ Failed to load P5.js dependencies:', error)
        // Fallback to default values
        setDependenciesLoaded(true)
      }
    }

    loadDependencies()
  }, [])
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    
    // Animate lighting for magical effect
    if (lightRef.current) {
      lightRef.current.intensity = 1 + Math.sin(time * 0.5) * 0.2
      lightRef.current.position.x = Math.sin(time * 0.3) * 5
      lightRef.current.position.z = Math.cos(time * 0.3) * 5
    }
  })

  return (
    <>
      {/* Enhanced Lighting Setup */}
      <ambientLight intensity={0.6} color="#ffeaa7" />
      <directionalLight 
        ref={lightRef}
        position={[10, 10, 5]} 
        intensity={1.2} 
        color="#ffb347"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-10, -10, -5]} color="#f59e0b" intensity={0.8} />
      <pointLight position={[15, 5, 10]} color="#ff6b35" intensity={0.4} />
      <spotLight 
        position={[0, 20, 0]} 
        angle={0.3} 
        penumbra={1} 
        intensity={0.5}
        color="#ffd700"
        castShadow
      />
      
      {/* Environment */}
      <Environment preset="sunset" />
      
      {/* Flying Rugs with Your Generator Logic - Each with unique seeds */}
      <FlyingRug position={[0, 0, 0]} scale={1.2} seed={42} dependenciesLoaded={dependenciesLoaded} />
      <FlyingRug position={[-8, 2, -5]} scale={0.8} seed={1337} dependenciesLoaded={dependenciesLoaded} />
      <FlyingRug position={[8, -1, -3]} scale={0.9} seed={777} dependenciesLoaded={dependenciesLoaded} />
      <FlyingRug position={[5, 3, -8]} scale={0.7} seed={999} dependenciesLoaded={dependenciesLoaded} />
      <FlyingRug position={[-6, -2, -10]} scale={0.6} seed={555} dependenciesLoaded={dependenciesLoaded} />
      <FlyingRug position={[-3, 5, -12]} scale={0.5} seed={888} dependenciesLoaded={dependenciesLoaded} />
      <FlyingRug position={[10, -3, -15]} scale={0.4} seed={111} dependenciesLoaded={dependenciesLoaded} />
      
      {/* Enhanced Floating Particles */}
      <FloatingParticles />
      
      {/* Magical Dust Effect */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={200}
              array={new Float32Array(Array.from({length: 600}, () => (Math.random() - 0.5) * 100))}
              itemSize={3}
              args={[new Float32Array(Array.from({length: 600}, () => (Math.random() - 0.5) * 100)), 3]}
            />
          </bufferGeometry>
          <pointsMaterial size={0.05} color="#ffd700" transparent opacity={0.8} />
        </points>
      </Float>
      
      {/* Camera Controls */}
      <OrbitControls 
        enablePan={false} 
        enableZoom={false} 
        enableRotate={true}
        autoRotate={true}
        autoRotateSpeed={0.3}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.5}
        dampingFactor={0.05}
        enableDamping={true}
      />
    </>
  )
}

export default function AnimatedRugs() {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        camera={{ position: [0, 5, 15], fov: 60 }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  )
}
