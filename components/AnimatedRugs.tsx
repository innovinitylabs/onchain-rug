'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Float, Text3D, Environment } from '@react-three/drei'
import { Suspense, useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Advanced Flying Rug Component with Cloth Physics
function FlyingRug({ position, scale = 1, color = '#8B4513', pattern = 'stripes' }: { 
  position: [number, number, number], 
  scale?: number, 
  color?: string,
  pattern?: 'stripes' | 'checkers' | 'solid'
}) {
  const rugRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const initialPositions = useRef<Float32Array | null>(null)

  // Create enhanced rug texture with more detail
  const rugTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 1024
    const ctx = canvas.getContext('2d')!
    
    // Base color with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, color)
    gradient.addColorStop(0.5, color)
    gradient.addColorStop(1, '#654321')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Add detailed pattern
    if (pattern === 'stripes') {
      ctx.fillStyle = '#654321'
      for (let i = 0; i < canvas.height; i += 60) {
        ctx.fillRect(0, i, canvas.width, 30)
        // Add texture within stripes
        ctx.fillStyle = '#543c21'
        for (let j = 0; j < canvas.width; j += 8) {
          ctx.fillRect(j, i + 5, 4, 20)
        }
        ctx.fillStyle = '#654321'
      }
    } else if (pattern === 'checkers') {
      ctx.fillStyle = '#654321'
      const size = 80
      for (let x = 0; x < canvas.width; x += size) {
        for (let y = 0; y < canvas.height; y += size) {
          if ((x / size + y / size) % 2 === 0) {
            ctx.fillRect(x, y, size, size)
            // Add inner pattern
            ctx.fillStyle = '#543c21'
            ctx.fillRect(x + 10, y + 10, size - 20, size - 20)
            ctx.fillStyle = '#654321'
          }
        }
      }
    }
    
    // Enhanced fringe effect with depth
    const fringeGradient = ctx.createLinearGradient(0, 0, 0, 50)
    fringeGradient.addColorStop(0, '#5D4037')
    fringeGradient.addColorStop(1, '#3E2723')
    ctx.fillStyle = fringeGradient
    
    for (let i = 0; i < canvas.width; i += 12) {
      // Top fringe
      ctx.fillRect(i, 0, 8, 50)
      ctx.fillRect(i + 2, 0, 4, 60)
      // Bottom fringe
      ctx.fillRect(i, canvas.height - 50, 8, 50)
      ctx.fillRect(i + 2, canvas.height - 60, 4, 60)
    }
    
    // Add fabric texture noise
    for (let x = 0; x < canvas.width; x += 4) {
      for (let y = 0; y < canvas.height; y += 4) {
        const noise = Math.random() * 0.2 - 0.1
        ctx.fillStyle = `rgba(0, 0, 0, ${Math.abs(noise)})`
        ctx.fillRect(x, y, 2, 2)
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    return texture
  }, [color, pattern])

  // Advanced cloth physics animation
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
      const segments = 32
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
            color={color} 
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
        />
      </bufferGeometry>
      <pointsMaterial size={0.1} color="#f59e0b" transparent opacity={0.6} />
    </points>
  )
}

// Enhanced Magical Scene
function Scene() {
  const lightRef = useRef<THREE.DirectionalLight>(null)
  
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
      
      {/* Flying Rugs with Enhanced Colors */}
      <FlyingRug position={[0, 0, 0]} scale={1.2} color="#8B4513" pattern="stripes" />
      <FlyingRug position={[-8, 2, -5]} scale={0.8} color="#D2691E" pattern="checkers" />
      <FlyingRug position={[8, -1, -3]} scale={0.9} color="#A0522D" pattern="solid" />
      <FlyingRug position={[5, 3, -8]} scale={0.7} color="#CD853F" pattern="stripes" />
      <FlyingRug position={[-6, -2, -10]} scale={0.6} color="#DEB887" pattern="checkers" />
      <FlyingRug position={[-3, 5, -12]} scale={0.5} color="#BC7F36" pattern="solid" />
      <FlyingRug position={[10, -3, -15]} scale={0.4} color="#E6A75D" pattern="stripes" />
      
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
