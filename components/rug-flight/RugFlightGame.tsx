'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { RugMarketNFT } from '../../lib/rug-market-types'
import { calculateFlightStats, calculateVisualEffects } from './traitCalculator'

interface GameState {
  isPlaying: boolean
  score: number
  timeLeft: number
  speed: number
  position: THREE.Vector3
  rotation: THREE.Euler
  stats: any
}

interface RugFlightGameProps {
  selectedRug: RugMarketNFT | null
  onGameEnd: (finalScore: number) => void
  onScoreUpdate: (score: number) => void
}

interface GameState {
  isPlaying: boolean
  score: number
  timeLeft: number
  speed: number
  position: THREE.Vector3
  rotation: THREE.Euler
  stats: any // Flight stats from trait calculator
}

export default function RugFlightGame({ selectedRug, onGameEnd, onScoreUpdate }: RugFlightGameProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Initialize vectors
  const initialPosition = new THREE.Vector3(0, 0, 0)
  const initialRotation = new THREE.Euler(0, 0, 0)

  const mountRef = useRef<HTMLDivElement>(null)
  const gameStateRef = useRef<GameState>({
    isPlaying: false,
    score: 0,
    timeLeft: 30,
    speed: 0,
    position: initialPosition,
    rotation: initialRotation,
    stats: null
  })

  const [gameState, setGameState] = useState<GameState>(gameStateRef.current)
  const [isLoading, setIsLoading] = useState(true)

  // Fallback: Force loading complete after 5 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log('⏰ Loading timeout reached, forcing completion')
        setIsLoading(false)
      }
    }, 5000)
    return () => clearTimeout(timeout)
  }, [isLoading])

  // Three.js refs
  const sceneRef = useRef<THREE.Scene>(null!)
  const cameraRef = useRef<THREE.PerspectiveCamera>(null!)
  const rendererRef = useRef<THREE.WebGLRenderer>(null!)
  const rugMeshRef = useRef<THREE.Mesh>(null!)
  const animationIdRef = useRef<number>(null!)

  // Input state
  const keysRef = useRef({
    left: false,
    right: false,
    up: false,
    down: false,
    boost: false
  })

  // Game constants
  const GAME_CONFIG = {
    gravity: -9.81,
    courseLength: 1000,
    baseTurnSpeed: 2,
    baseBoostMultiplier: 2.5
  }

  // Calculate rug stats (use defaults for now)
  const rugStats = {
    maxSpeed: 40,
    acceleration: 25,
    turnSensitivity: 2.5,
    stability: 0.9,
    boostPower: 1.5,
    boostRecovery: 8,
    airResistance: 0.05,
    wobbleAmount: 0.02
  }
  const visualEffects = {
    brightness: 1.0,
    glowIntensity: 0.0,
    trailLength: 2.0,
    particleDensity: 0.8
  }

  // Debug logging for trait calculations
  if (selectedRug && process.env.NODE_ENV === 'development') {
    console.log('Rug Flight Stats:', rugStats)
    console.log('Visual Effects:', visualEffects)
  }

  // Initialize Three.js scene
  const initScene = useCallback(() => {
    if (!mountRef.current) {
      // Retry after a short delay if mount isn't ready
      setTimeout(() => {
        if (mountRef.current) {
          initScene()
        }
      }, 100)
      return
    }
    // Check dimensions
    const width = mountRef.current.clientWidth
    const height = mountRef.current.clientHeight

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xFF0000) // Bright red for testing
    sceneRef.current = scene

    // Add test objects RIGHT in front of camera
    const testGeometry = new THREE.BoxGeometry(2, 2, 2)
    const testMaterial = new THREE.MeshLambertMaterial({ color: 0x00FF00 })
    const testCube = new THREE.Mesh(testGeometry, testMaterial)
    testCube.position.set(0, 0, -5) // Right in front of camera
    scene.add(testCube)

    // Add a huge sphere at origin
    const sphereGeometry = new THREE.SphereGeometry(3, 16, 16)
    const sphereMaterial = new THREE.MeshLambertMaterial({ color: 0x0000FF })
    const testSphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
    testSphere.position.set(0, 0, -3) // Very close to camera
    scene.add(testSphere)

    // Camera
    const aspect = width / height
    const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 2000)
    camera.position.set(0, 5, 10)
    camera.lookAt(0, 0, 0) // Look at origin instead of far away
    cameraRef.current = camera
    console.log('📷 Camera setup: pos', camera.position, 'looking at origin')

    if (width === 0 || height === 0) {
      setTimeout(() => initScene(), 200)
      return
    }

    // Renderer
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(width, height)
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      mountRef.current.appendChild(renderer.domElement)
      rendererRef.current = renderer
    } catch (error) {
      console.error('Renderer creation failed:', error)
      setIsLoading(false) // Still allow the game to proceed without 3D
      return
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(50, 50, 25)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    scene.add(directionalLight)

    // Create rug mesh (async, don't await)
    createRugMesh(scene)

    // Create basic course
    createBasicCourse(scene)

    // Test render to verify scene works
    renderer.render(scene, camera)

    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return

      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    }

    window.addEventListener('resize', handleResize)

    // Don't wait for texture loading - start the game immediately
    console.log('🏁 Setting isLoading to false')
    setIsLoading(false)
  }, [])

  // Create rug mesh with NFT texture
  const createRugMesh = (scene: THREE.Scene) => {
    // Basic plane geometry for rug
    const geometry = new THREE.PlaneGeometry(4, 3, 10, 10)

    // Load baseposting.png as texture
    const material = new THREE.MeshLambertMaterial()
    const textureLoader = new THREE.TextureLoader()
    textureLoader.load(
      '/baseposting.png', // Load from public folder
      (texture) => {
        material.map = texture
        material.needsUpdate = true
      },
      undefined,
      (error) => {
        console.warn('Failed to load baseposting.png:', error)
        material.color.setHex(0x8B4513) // Fallback brown
      }
    )

    const rugMesh = new THREE.Mesh(geometry, material)
    rugMesh.position.set(0, -1, -2) // Closer to camera, below the sphere
    // Rotate to face the camera (which is looking towards negative Z)
    rugMesh.rotation.set(-Math.PI / 2, 0, 0) // Rotate -90 degrees around X axis
    rugMesh.castShadow = true
    scene.add(rugMesh)

    rugMeshRef.current = rugMesh
  }

  // Sample rugs for testing - hardcoded from sample_token_uri files
  const SAMPLE_RUGS = {
    1: {
      name: "OnchainRug #1",
      palette: ["#8B0000", "#DC143C", "#B22222", "#FF4500", "#FF6347", "#C04000", "#FA8072"],
      stripeCount: 20,
      dirtLevel: 2,
      frameLevel: 0
    },
    2: {
      name: "OnchainRug #2",
      palette: ["#F0F8FF", "#E6E6FA", "#B0C4DE", "#87CEEB", "#4682B4", "#4169E1", "#0000CD"],
      stripeCount: 26,
      dirtLevel: 2,
      frameLevel: 0
    },
    3: {
      name: "OnchainRug #3",
      palette: ["#8B4513", "#A0522D", "#CD853F", "#F4A460", "#DEB887", "#D2B48C"],
      stripeCount: 15,
      dirtLevel: 1,
      frameLevel: 1
    },
    4: {
      name: "OnchainRug #4",
      palette: ["#228B22", "#32CD32", "#90EE90", "#98FB98", "#00FF00", "#7CFC00"],
      stripeCount: 18,
      dirtLevel: 0,
      frameLevel: 2
    },
    5: {
      name: "OnchainRug #5",
      palette: ["#4B0082", "#6A5ACD", "#9370DB", "#BA55D3", "#DA70D6", "#EE82EE"],
      stripeCount: 12,
      dirtLevel: 1,
      frameLevel: 0
    }
  }

  // Load NFT texture from sample data
  const loadNFTTexture = async (rug: RugMarketNFT): Promise<THREE.Texture> => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 256
      canvas.height = 192
      const ctx = canvas.getContext('2d')!

      // Check if we have sample data for this rug
      const sampleRug = SAMPLE_RUGS[rug.permanent.tokenId as keyof typeof SAMPLE_RUGS]

      if (sampleRug) {
        // Generate high-quality texture using sample data
        generateTextureFromSample(ctx, canvas, rug, sampleRug)
      } else {
        // Fallback to trait-based generation
        generateTextureFromTraits(ctx, canvas, rug)
      }

      const texture = new THREE.CanvasTexture(canvas)
      texture.wrapS = THREE.RepeatWrapping
      texture.wrapT = THREE.RepeatWrapping
      return texture

    } catch (error) {
      console.warn('Failed to load NFT texture, using fallback:', error)
      return createFallbackTexture()
    }
  }

  // Generate texture from sample data
  const generateTextureFromSample = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    rug: RugMarketNFT,
    sample: any
  ) => {
    // Generate detailed stripe pattern using sample data
    const stripeCount = sample.stripeCount || rug.permanent.stripeCount || 8
    const stripeHeight = canvas.height / stripeCount

    for (let i = 0; i < stripeCount; i++) {
      const colorIndex = i % sample.palette.length
      ctx.fillStyle = sample.palette[colorIndex]
      ctx.fillRect(0, i * stripeHeight, canvas.width, stripeHeight)

      // Add subtle weave pattern within each stripe
      if (Math.random() > 0.7) {
        ctx.fillStyle = sample.palette[(colorIndex + 1) % sample.palette.length]
        for (let x = 0; x < canvas.width; x += 4) {
          const y = i * stripeHeight + Math.sin(x * 0.1) * 2
          ctx.fillRect(x, y, 2, stripeHeight)
        }
      }
    }

    // Add character-based patterns
    const charCount = Number(rug.permanent.characterCount) || sample.stripeCount * 2
    if (charCount > 0) {
      const charDensity = Math.min(charCount / 10, 50)
      ctx.fillStyle = 'rgba(0,0,0,0.1)'
      for (let i = 0; i < charDensity; i++) {
        const x = Math.random() * canvas.width
        const y = Math.random() * canvas.height
        const size = Math.random() * 3 + 1
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Add dirt effects
    const dirtLevel = sample.dirtLevel !== undefined ? sample.dirtLevel : rug.dynamic.dirtLevel || 0
    if (dirtLevel > 0) {
      const dirtOpacity = dirtLevel === 1 ? 0.4 : 0.7
      ctx.fillStyle = `rgba(101, 67, 33, ${dirtOpacity})`
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Add dirt specks
      ctx.fillStyle = 'rgba(139, 69, 19, 0.6)'
      for (let i = 0; i < dirtLevel * 20; i++) {
        const x = Math.random() * canvas.width
        const y = Math.random() * canvas.height
        const size = Math.random() * 2 + 0.5
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Add frame effects
    const frameLevel = sample.frameLevel !== undefined ? sample.frameLevel : parseInt(rug.dynamic.frameLevel) || 0
    if (frameLevel > 0) {
      const frameColors = ['#FFD700', '#FFA500', '#FF8C00'] // Gold tones
      for (let i = 0; i < frameLevel; i++) {
        ctx.strokeStyle = frameColors[i % frameColors.length]
        ctx.lineWidth = 2 + i
        ctx.strokeRect(i + 1, i + 1, canvas.width - 2 * (i + 1), canvas.height - 2 * (i + 1))
      }
    }
  }

  // Generate texture from extracted colors
  const generateTextureFromColors = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    rug: RugMarketNFT,
    colors: string[]
  ) => {
    // Generate detailed stripe pattern
    const stripeCount = Number(rug.permanent.stripeCount) || 8
    const stripeHeight = canvas.height / stripeCount

    for (let i = 0; i < stripeCount; i++) {
      const colorIndex = i % colors.length
      ctx.fillStyle = colors[colorIndex]
      ctx.fillRect(0, i * stripeHeight, canvas.width, stripeHeight)

      // Add subtle weave pattern within each stripe
      if (Math.random() > 0.6) {
        ctx.fillStyle = colors[(colorIndex + 1) % colors.length]
        for (let x = 0; x < canvas.width; x += 4) {
          const y = i * stripeHeight + Math.sin(x * 0.1) * 2
          ctx.fillRect(x, y, 2, stripeHeight)
        }
      }
    }

    // Add character-based patterns
    if (rug.permanent.characterCount > 0) {
      const charDensity = Math.min(Number(rug.permanent.characterCount) / 100, 50)
      ctx.fillStyle = 'rgba(0,0,0,0.1)'
      for (let i = 0; i < charDensity; i++) {
        const x = Math.random() * canvas.width
        const y = Math.random() * canvas.height
        const size = Math.random() * 3 + 1
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Add dirt effects
    if (rug.dynamic.dirtLevel > 0) {
      const dirtOpacity = rug.dynamic.dirtLevel === 1 ? 0.4 : 0.7
      ctx.fillStyle = `rgba(101, 67, 33, ${dirtOpacity})`
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Add dirt specks
      ctx.fillStyle = 'rgba(139, 69, 19, 0.6)'
      for (let i = 0; i < rug.dynamic.dirtLevel * 20; i++) {
        const x = Math.random() * canvas.width
        const y = Math.random() * canvas.height
        const size = Math.random() * 2 + 0.5
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Add frame effects
    if (parseInt(rug.dynamic.frameLevel) > 0) {
      const frameColors = ['#FFD700', '#FFA500', '#FF8C00'] // Gold tones
      for (let i = 0; i < parseInt(rug.dynamic.frameLevel); i++) {
        ctx.strokeStyle = frameColors[i % frameColors.length]
        ctx.lineWidth = 2 + i
        ctx.strokeRect(i + 1, i + 1, canvas.width - 2 * (i + 1), canvas.height - 2 * (i + 1))
      }
    }
  }

  // Fallback texture generation from traits
  const generateTextureFromTraits = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    rug: RugMarketNFT
  ) => {
    const palette = rug.permanent.paletteName || '#8B4513,#A0522D,#CD853F'
    const colors = palette.split(',')
    generateTextureFromColors(ctx, canvas, rug, colors)
  }

  // Fallback texture
  const createFallbackTexture = (): THREE.Texture => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 192
    const ctx = canvas.getContext('2d')!

    // Simple gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, '#8B4513')
    gradient.addColorStop(0.5, '#A0522D')
    gradient.addColorStop(1, '#CD853F')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    return new THREE.CanvasTexture(canvas)
  }

  // Create basic course
  const createBasicCourse = (scene: THREE.Scene) => {
    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(20, 20)
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x00FF00 }) // Bright green for testing
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.position.z = -5
    ground.receiveShadow = true
    scene.add(ground)

    // Simple ring gates
    for (let i = 0; i < 10; i++) {
      const ringGeometry = new THREE.TorusGeometry(3, 0.3, 8, 16)
      const ringMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 })
      const ring = new THREE.Mesh(ringGeometry, ringMaterial)
      ring.position.set(
        (Math.random() - 0.5) * 20,
        3,
        -i * 100 - 50
      )
      ring.castShadow = true
      scene.add(ring)
    }
  }

  // Game physics update
  const updateGame = (deltaTime: number) => {
    const state = gameStateRef.current
    if (!state.isPlaying || !rugMeshRef.current || !rugStats) return

    const keys = keysRef.current

    // Steering input
    let steerInput = 0
    if (keys.left) steerInput -= 1
    if (keys.right) steerInput += 1

    // Update rotation (turning) - uses rug's turn sensitivity
    const turnAmount = steerInput * rugStats.turnSensitivity * GAME_CONFIG.baseTurnSpeed * deltaTime
    state.rotation.z += turnAmount
    state.rotation.z = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, state.rotation.z))

    // Update speed with acceleration and air resistance
    let targetSpeed = 8 // Base cruise speed
    if (keys.boost) {
      targetSpeed = rugStats.maxSpeed * rugStats.boostPower
    }

    // Apply acceleration and air resistance
    const speedDiff = targetSpeed - state.speed
    const acceleration = Math.sign(speedDiff) * rugStats.acceleration * deltaTime
    state.speed += acceleration

    // Air resistance
    state.speed *= (1 - rugStats.airResistance * deltaTime)

    // Clamp speed
    state.speed = Math.max(0, Math.min(rugStats.maxSpeed, state.speed))

    // Update position with stability (affects drift)
    const forwardSpeed = state.speed * (1 - Math.abs(state.rotation.z) * (1 - rugStats.stability) * 0.3)
    state.position.x += Math.sin(state.rotation.z) * forwardSpeed * deltaTime
    state.position.z -= Math.cos(state.rotation.z) * forwardSpeed * deltaTime

    // Add subtle wobble based on rug condition
    const wobble = Math.sin(Date.now() * 0.01) * rugStats.wobbleAmount
    state.rotation.x = wobble * (1 - rugStats.stability)

    // Apply mesh transforms
    rugMeshRef.current.position.copy(state.position)
    rugMeshRef.current.rotation.copy(state.rotation)

    // Update shader uniforms
    const material = rugMeshRef.current.material as THREE.ShaderMaterial
    material.uniforms.time.value += deltaTime
    material.uniforms.speed.value = state.speed
    material.uniforms.steer.value = state.rotation.z

    // Update camera to follow
    if (cameraRef.current) {
      const cameraOffset = new THREE.Vector3(0, 8, 15)
      cameraOffset.applyEuler(state.rotation)
      cameraRef.current.position.copy(state.position).add(cameraOffset)
      cameraRef.current.lookAt(state.position)
    }

    // Update time and score (better score calculation)
    state.timeLeft -= deltaTime
    const speedBonus = Math.floor(state.speed * deltaTime)
    const timeBonus = Math.floor((30 - state.timeLeft) * 0.1) // Bonus for finishing quickly
    state.score += speedBonus + timeBonus

    if (state.timeLeft <= 0) {
      state.isPlaying = false
      onGameEnd(state.score)
    }

    setGameState({ ...state })
    onScoreUpdate(state.score)
  }

  // Animation loop
  let lastTime = 0
  const animate = (time: number) => {
    const deltaTime = (time - lastTime) / 1000
    lastTime = time

    updateGame(deltaTime)

    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.clear()
      rendererRef.current.render(sceneRef.current, cameraRef.current)
    }

    animationIdRef.current = requestAnimationFrame(animate)
  }

  // Input handling
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

  // Start game
  const startGame = () => {
    gameStateRef.current = {
      isPlaying: true,
      score: 0,
      timeLeft: 30,
      speed: 0,
      position: new THREE.Vector3(0, 0, 0),
      rotation: new THREE.Euler(0, 0, 0),
      stats: rugStats
    }
    setGameState(gameStateRef.current)
  }

  // Initialize on mount
  useEffect(() => {
    // Input listeners
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    // Try to initialize immediately, or wait for mount
    if (mountRef.current) {
      initScene()
    } else {
      // Wait for mount to be ready
      const checkMount = () => {
        if (mountRef.current) {
          initScene()
        } else {
          setTimeout(checkMount, 50)
        }
      }
      setTimeout(checkMount, 50)
    }

    return () => {
      console.log('🧹 useEffect cleanup: Cleaning up')

      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)

      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }

      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement)
        rendererRef.current.dispose()
      }
    }
  }, []) // Empty dependency array - only run once

  // Start animation when ready
  useEffect(() => {
    if (!isLoading && rendererRef.current) {
      try {
        animate(0)
      } catch (error) {
        console.error('Animation start failed:', error)
      }
    }
  }, [isLoading])

  if (isLoading) {
    console.log('📱 Showing loading screen')
    return (
      <div className="flex items-center justify-center w-full h-96 bg-slate-800 rounded-lg">
        <div className="text-white">Loading Flight Game...</div>
      </div>
    )
  }

  // Fullscreen functionality
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  return (
    <div className={`w-full ${isFullscreen ? 'h-screen' : ''}`}>
      {/* Game Canvas */}
      <div
        ref={mountRef}
        className={`w-full ${isFullscreen ? 'h-screen' : 'h-[70vh] min-h-[600px]'} bg-black rounded-lg overflow-hidden relative`}
        style={isFullscreen ? {} : { aspectRatio: '16/9' }}
      >

        {/* Fullscreen button */}
        <button
          onClick={toggleFullscreen}
          className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg transition-colors"
        >
          {isFullscreen ? '🗗' : '🗖'}
        </button>
      </div>

      {/* Rug Stats Display */}
      <div className="mt-4 bg-white/5 rounded-lg p-4">
        <div className="text-white font-semibold mb-2 flex items-center gap-2">
          <span>Baseposting Rug</span>
          <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-300">
            Clean
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div>Speed: <span className="text-blue-300">{rugStats.maxSpeed}</span></div>
          <div>Turn: <span className="text-green-300">{rugStats.turnSensitivity.toFixed(1)}</span></div>
          <div>Stability: <span className="text-purple-300">{(rugStats.stability * 100).toFixed(0)}%</span></div>
          <div>Boost: <span className="text-yellow-300">{rugStats.boostPower.toFixed(1)}x</span></div>
        </div>
      </div>

      {/* Game UI */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/10 rounded-lg p-3 text-center">
          <div className="text-white/60 text-sm">Score</div>
          <div className="text-white text-xl font-bold">{gameState.score}</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3 text-center">
          <div className="text-white/60 text-sm">Time</div>
          <div className="text-white text-xl font-bold">{gameState.timeLeft.toFixed(1)}s</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3 text-center">
          <div className="text-white/60 text-sm">Speed</div>
          <div className="text-white text-xl font-bold">{Math.floor(gameState.speed)}</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3 text-center">
          <div className="text-white/60 text-sm">Status</div>
          <div className="text-white text-xl font-bold">
            {gameState.isPlaying ? 'Flying' : 'Ready'}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-4 flex justify-center gap-4">
        {!gameState.isPlaying ? (
          <button
            onClick={startGame}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold rounded-lg transition-all"
          >
            Start Flight
          </button>
        ) : (
          <div className="text-white/60 text-sm">
            Use Arrow Keys to steer, Space to boost
          </div>
        )}
      </div>
    </div>
  )
}
