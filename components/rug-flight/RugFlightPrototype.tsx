'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

export default function RugFlightPrototype() {
  const mountRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const rugMeshRef = useRef<THREE.Mesh | null>(null)
  const animationIdRef = useRef<number | null>(null)

  // Game state
  const gameStateRef = useRef({
    speed: 5,
    position: new THREE.Vector3(0, 0, 0),
    rotation: new THREE.Euler(0, 0, 0),
    steerInput: 0,
    time: 0
  })

  // Input state
  const keysRef = useRef({
    left: false,
    right: false,
    up: false,
    down: false,
    boost: false
  })

  useEffect(() => {
    if (!mountRef.current) return

    console.log('🚀 Initializing Rug Flight Prototype')

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x87CEEB) // Sky blue
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(0, 2, 8)
    camera.lookAt(0, 0, -10)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    mountRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(10, 10, 5)
    directionalLight.castShadow = true
    scene.add(directionalLight)

    // Create rug mesh
    createRugMesh(scene)

    // Create simple course
    createSimpleCourse(scene)

    // Input listeners
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowLeft':
        case 'KeyA':
          keysRef.current.left = true
          event.preventDefault()
          break
        case 'ArrowRight':
        case 'KeyD':
          keysRef.current.right = true
          event.preventDefault()
          break
        case 'ArrowUp':
        case 'KeyW':
          keysRef.current.up = true
          event.preventDefault()
          break
        case 'ArrowDown':
        case 'KeyS':
          keysRef.current.down = true
          event.preventDefault()
          break
        case 'Space':
          keysRef.current.boost = true
          event.preventDefault()
          break
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowLeft':
        case 'KeyA':
          keysRef.current.left = false
          break
        case 'ArrowRight':
        case 'KeyD':
          keysRef.current.right = false
          break
        case 'ArrowUp':
        case 'KeyW':
          keysRef.current.up = false
          break
        case 'ArrowDown':
        case 'KeyS':
          keysRef.current.down = false
          break
        case 'Space':
          keysRef.current.boost = false
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    // Handle resize
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return
      cameraRef.current.aspect = window.innerWidth / window.innerHeight
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', handleResize)

    // Start animation
    setIsLoading(false)
    animate(0)

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('resize', handleResize)

      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }

      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement)
        rendererRef.current.dispose()
      }
    }
  }, [])

  const createRugMesh = (scene: THREE.Scene) => {
    console.log('🧵 Creating rug mesh with baseposting.png texture')

    // Plane geometry for rug
    const geometry = new THREE.PlaneGeometry(3, 2, 10, 10)

    // Load baseposting.png as texture
    const textureLoader = new THREE.TextureLoader()
    const material = new THREE.MeshLambertMaterial()

    textureLoader.load(
      '/baseposting.png',
      (texture) => {
        console.log('✅ Texture loaded successfully')
        material.map = texture
        material.needsUpdate = true
      },
      undefined,
      (error) => {
        console.warn('❌ Failed to load baseposting.png:', error)
        material.color.setHex(0x8B4513) // Fallback brown
      }
    )

    const rugMesh = new THREE.Mesh(geometry, material)
    rugMesh.position.set(0, 0, 0)
    rugMesh.rotation.set(-Math.PI / 2, 0, 0) // Lay flat, face camera
    rugMesh.castShadow = true
    scene.add(rugMesh)

    rugMeshRef.current = rugMesh
  }

  const createSimpleCourse = (scene: THREE.Scene) => {
    console.log('🏁 Creating simple course')

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(100, 50)
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0xDEB887 })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.position.z = -25
    ground.receiveShadow = true
    scene.add(ground)

    // Simple obstacles - rings to fly through
    for (let i = 0; i < 5; i++) {
      const ringGeometry = new THREE.TorusGeometry(2, 0.3, 8, 16)
      const ringMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 })
      const ring = new THREE.Mesh(ringGeometry, ringMaterial)
      ring.position.set(
        (Math.random() - 0.5) * 10, // Random X position
        2, // Height
        -10 - (i * 8) // Spaced along Z axis
      )
      ring.rotation.x = Math.PI / 2 // Rotate to stand upright
      ring.castShadow = true
      scene.add(ring)
    }

    // Simple trees/pillars
    for (let i = 0; i < 8; i++) {
      const pillarGeometry = new THREE.CylinderGeometry(0.5, 0.5, 4, 8)
      const pillarMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 })
      const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial)
      pillar.position.set(
        (Math.random() - 0.5) * 20,
        2,
        -5 - (i * 6)
      )
      pillar.castShadow = true
      scene.add(pillar)
    }
  }

  const animate = (time: number) => {
    const state = gameStateRef.current
    const keys = keysRef.current

    // Update time
    const deltaTime = (time - state.time) / 1000
    state.time = time

    // Input handling
    state.steerInput = 0
    if (keys.left) state.steerInput -= 1
    if (keys.right) state.steerInput += 1

    // Update physics
    const steerAmount = state.steerInput * 2 * deltaTime
    state.rotation.z += steerAmount
    state.rotation.z = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, state.rotation.z))

    // Update speed
    let targetSpeed = 8
    if (keys.boost) targetSpeed = 15

    const speedDiff = targetSpeed - state.speed
    state.speed += speedDiff * deltaTime * 2
    state.speed = Math.max(0, Math.min(20, state.speed))

    // Update position
    state.position.z -= state.speed * deltaTime

    // Update rug mesh
    if (rugMeshRef.current) {
      rugMeshRef.current.position.copy(state.position)
      rugMeshRef.current.rotation.set(-Math.PI / 2, 0, state.rotation.z)

      // Add some wave animation to make it look alive
      const vertices = rugMeshRef.current.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i]
        const wave = Math.sin(state.time * 2 + x * 2) * 0.05
        vertices[i + 2] = wave // Z coordinate
      }
      rugMeshRef.current.geometry.attributes.position.needsUpdate = true
    }

    // Update camera to follow rug
    if (cameraRef.current) {
      cameraRef.current.position.x = state.position.x
      cameraRef.current.position.y = state.position.y + 3
      cameraRef.current.position.z = state.position.z + 8
      cameraRef.current.lookAt(state.position.x, state.position.y, state.position.z - 10)
    }

    // Render
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current)
    }

    animationIdRef.current = requestAnimationFrame(animate)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-gray-900">
        <div className="text-white text-xl">Loading Flight Prototype...</div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* 3D Canvas */}
      <div ref={mountRef} className="w-full h-full" />

      {/* UI Overlay */}
      <div className="absolute top-4 left-4 text-white bg-black/50 p-4 rounded-lg">
        <h1 className="text-2xl font-bold mb-2">Rug Flight Prototype</h1>
        <div className="text-sm space-y-1">
          <div>Speed: {Math.floor(gameStateRef.current.speed)} mph</div>
          <div>Position: {Math.floor(gameStateRef.current.position.x)}, {Math.floor(gameStateRef.current.position.z)}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-4 text-white bg-black/50 p-4 rounded-lg">
        <div className="text-sm">
          <div><strong>Controls:</strong></div>
          <div>A/D or ←/→ : Steer</div>
          <div>Space: Boost</div>
          <div>W/S or ↑/↓ : (Reserved)</div>
        </div>
      </div>

      {/* Performance Info */}
      <div className="absolute top-4 right-4 text-white bg-black/50 p-4 rounded-lg">
        <div className="text-sm">
          <div><strong>Prototype v0.1</strong></div>
          <div>Baseposting.png texture loaded</div>
          <div>Simple physics + wave animation</div>
        </div>
      </div>
    </div>
  )
}
