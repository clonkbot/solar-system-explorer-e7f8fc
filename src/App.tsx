import { useRef, useState, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stars, Html } from '@react-three/drei'
import * as THREE from 'three'

// Planet data with accurate relative sizes and distances (scaled for visualization)
const PLANETS = [
  { name: 'Mercury', color: '#b5b5b5', size: 0.38, distance: 4, speed: 4.15, description: 'The smallest planet, closest to the Sun', moons: 0, dayLength: '59 Earth days' },
  { name: 'Venus', color: '#e6c87a', size: 0.95, distance: 6, speed: 1.62, description: 'Earth\'s "sister planet" with a toxic atmosphere', moons: 0, dayLength: '243 Earth days' },
  { name: 'Earth', color: '#6b93d6', size: 1, distance: 8, speed: 1, description: 'Our home, the blue marble', moons: 1, dayLength: '24 hours' },
  { name: 'Mars', color: '#c1440e', size: 0.53, distance: 10.5, speed: 0.53, description: 'The Red Planet, future home for humanity?', moons: 2, dayLength: '24.6 hours' },
  { name: 'Jupiter', color: '#d8ca9d', size: 2.5, distance: 15, speed: 0.084, description: 'The largest planet, a gas giant', moons: 95, dayLength: '10 hours' },
  { name: 'Saturn', color: '#f4d59e', size: 2.2, distance: 20, speed: 0.034, description: 'Famous for its spectacular rings', moons: 146, dayLength: '10.7 hours' },
  { name: 'Uranus', color: '#d1e7e7', size: 1.6, distance: 25, speed: 0.012, description: 'The ice giant that rotates on its side', moons: 28, dayLength: '17.2 hours' },
  { name: 'Neptune', color: '#5b5ddf', size: 1.5, distance: 30, speed: 0.006, description: 'The windiest planet in our solar system', moons: 16, dayLength: '16.1 hours' },
]

interface PlanetProps {
  planet: typeof PLANETS[0]
  isSelected: boolean
  onSelect: () => void
  isPaused: boolean
}

function Planet({ planet, isSelected, onSelect, isPaused }: PlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const angleRef = useRef(Math.random() * Math.PI * 2)

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5
    }
    if (groupRef.current && !isPaused) {
      angleRef.current += delta * planet.speed * 0.1
      groupRef.current.position.x = Math.cos(angleRef.current) * planet.distance
      groupRef.current.position.z = Math.sin(angleRef.current) * planet.distance
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.05)
    }
  })

  const glowColor = useMemo(() => {
    const color = new THREE.Color(planet.color)
    color.multiplyScalar(1.5)
    return color
  }, [planet.color])

  return (
    <group ref={groupRef}>
      {/* Glow effect */}
      <mesh ref={glowRef} scale={planet.size * 1.3}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={hovered || isSelected ? 0.4 : 0.15}
        />
      </mesh>

      {/* Planet mesh */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'default'
        }}
        scale={planet.size}
      >
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          color={planet.color}
          roughness={0.7}
          metalness={0.1}
          emissive={planet.color}
          emissiveIntensity={isSelected || hovered ? 0.3 : 0.1}
        />
      </mesh>

      {/* Saturn's rings */}
      {planet.name === 'Saturn' && (
        <mesh rotation={[Math.PI / 2.5, 0, 0]}>
          <ringGeometry args={[planet.size * 1.4, planet.size * 2.2, 64]} />
          <meshStandardMaterial
            color="#c9b896"
            side={THREE.DoubleSide}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}

      {/* Planet label */}
      {(hovered || isSelected) && (
        <Html
          position={[0, planet.size + 0.8, 0]}
          center
          style={{
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <div className="px-3 py-1 bg-black/80 backdrop-blur-sm border border-cyan-500/30 rounded-sm text-cyan-300 font-mono text-xs tracking-widest uppercase">
            {planet.name}
          </div>
        </Html>
      )}
    </group>
  )
}

function Sun() {
  const meshRef = useRef<THREE.Mesh>(null)
  const coronaRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001
    }
    if (coronaRef.current) {
      coronaRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.1)
    }
  })

  return (
    <group>
      {/* Corona glow */}
      <mesh ref={coronaRef} scale={3.5}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#ff8c00" transparent opacity={0.15} />
      </mesh>
      <mesh scale={2.8}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={0.2} />
      </mesh>
      {/* Sun surface */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshBasicMaterial color="#ffd700" />
      </mesh>
      {/* Point light from sun */}
      <pointLight color="#fff5e6" intensity={2} distance={100} decay={0.5} />
    </group>
  )
}

function OrbitRings() {
  return (
    <>
      {PLANETS.map((planet) => (
        <mesh key={planet.name} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[planet.distance - 0.02, planet.distance + 0.02, 128]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.1} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </>
  )
}

function CameraController({ selectedPlanet }: { selectedPlanet: string | null }) {
  const { camera } = useThree()
  const targetRef = useRef(new THREE.Vector3(0, 15, 35))

  useFrame(() => {
    if (!selectedPlanet) {
      targetRef.current.lerp(new THREE.Vector3(0, 15, 35), 0.02)
    }
    camera.position.lerp(targetRef.current, 0.02)
  })

  return null
}

function Scene({ selectedPlanet, setSelectedPlanet, isPaused }: {
  selectedPlanet: string | null
  setSelectedPlanet: (name: string | null) => void
  isPaused: boolean
}) {
  return (
    <>
      <color attach="background" args={['#000008']} />
      <fog attach="fog" args={['#000008', 30, 80]} />

      <ambientLight intensity={0.1} />

      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      <Sun />
      <OrbitRings />

      {PLANETS.map((planet) => (
        <Planet
          key={planet.name}
          planet={planet}
          isSelected={selectedPlanet === planet.name}
          onSelect={() => setSelectedPlanet(selectedPlanet === planet.name ? null : planet.name)}
          isPaused={isPaused}
        />
      ))}

      <CameraController selectedPlanet={selectedPlanet} />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={60}
        maxPolarAngle={Math.PI / 1.5}
      />
    </>
  )
}

function InfoPanel({ planet, onClose }: { planet: typeof PLANETS[0] | null, onClose: () => void }) {
  if (!planet) return null

  return (
    <div className="absolute top-4 right-4 md:top-8 md:right-8 w-72 md:w-80 bg-black/70 backdrop-blur-md border border-cyan-500/30 rounded-sm p-4 md:p-6 font-mono text-cyan-100 animate-fadeIn z-10">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-cyan-500 hover:text-cyan-300 hover:bg-cyan-500/10 rounded transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 md:w-12 md:h-12 rounded-full shadow-lg"
          style={{
            backgroundColor: planet.color,
            boxShadow: `0 0 20px ${planet.color}66`,
          }}
        />
        <h2 className="text-xl md:text-2xl tracking-widest uppercase text-cyan-300">{planet.name}</h2>
      </div>

      <p className="text-xs md:text-sm text-cyan-100/80 mb-4 leading-relaxed">{planet.description}</p>

      <div className="space-y-2 text-xs border-t border-cyan-500/20 pt-4">
        <div className="flex justify-between">
          <span className="text-cyan-500/70 uppercase tracking-wider">Moons</span>
          <span className="text-cyan-200">{planet.moons}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-cyan-500/70 uppercase tracking-wider">Day Length</span>
          <span className="text-cyan-200">{planet.dayLength}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-cyan-500/70 uppercase tracking-wider">Orbital Speed</span>
          <span className="text-cyan-200">{(planet.speed * 100).toFixed(1)}% Earth</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-cyan-500/20">
        <div className="h-1 w-full bg-cyan-900/50 rounded overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 animate-pulse"
            style={{ width: `${(planet.size / 2.5) * 100}%` }}
          />
        </div>
        <p className="text-[10px] text-cyan-500/50 mt-1 uppercase tracking-wider">Relative Size</p>
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="absolute inset-0 bg-[#000008] flex flex-col items-center justify-center z-50">
      <div className="relative">
        <div className="w-16 h-16 md:w-20 md:h-20 border-2 border-cyan-500/30 rounded-full animate-ping absolute inset-0" />
        <div className="w-16 h-16 md:w-20 md:h-20 border-2 border-cyan-500 rounded-full animate-spin border-t-transparent" />
      </div>
      <p className="mt-8 font-mono text-cyan-500 text-xs tracking-[0.3em] uppercase animate-pulse">
        Initializing Solar System
      </p>
    </div>
  )
}

function Controls({ isPaused, setIsPaused }: { isPaused: boolean, setIsPaused: (v: boolean) => void }) {
  return (
    <div className="absolute bottom-16 md:bottom-20 left-4 md:left-8 flex gap-2 z-10">
      <button
        onClick={() => setIsPaused(!isPaused)}
        className="px-4 py-2 bg-black/50 backdrop-blur-sm border border-cyan-500/30 rounded-sm text-cyan-400 font-mono text-xs uppercase tracking-wider hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all flex items-center gap-2 min-h-[44px]"
      >
        {isPaused ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            <span className="hidden sm:inline">Play</span>
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
            <span className="hidden sm:inline">Pause</span>
          </>
        )}
      </button>
    </div>
  )
}

export default function App() {
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null)
  const [isPaused, setIsPaused] = useState(false)

  const selectedPlanetData = PLANETS.find(p => p.name === selectedPlanet) || null

  return (
    <div className="w-full h-dvh bg-[#000008] relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-4 left-4 md:top-8 md:left-8 z-10">
        <h1 className="font-display text-2xl md:text-4xl tracking-wider text-white mb-1">
          <span className="text-cyan-400">SOLAR</span> SYSTEM
        </h1>
        <p className="font-mono text-[10px] md:text-xs text-cyan-500/70 tracking-[0.2em] uppercase">
          Interactive 3D Explorer
        </p>
      </div>

      {/* Planet quick nav - scrollable on mobile */}
      <div className="absolute top-20 md:top-24 left-4 md:left-8 z-10 max-w-[calc(100vw-2rem)] md:max-w-none overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex gap-1 md:gap-2">
          {PLANETS.map((planet) => (
            <button
              key={planet.name}
              onClick={() => setSelectedPlanet(selectedPlanet === planet.name ? null : planet.name)}
              className={`px-2 md:px-3 py-1.5 md:py-2 font-mono text-[10px] md:text-xs tracking-wider uppercase transition-all rounded-sm whitespace-nowrap min-h-[36px] md:min-h-[44px] ${
                selectedPlanet === planet.name
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                  : 'bg-black/30 text-cyan-500/70 border border-transparent hover:border-cyan-500/30 hover:text-cyan-400'
              }`}
            >
              {planet.name}
            </button>
          ))}
        </div>
      </div>

      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 15, 35], fov: 60 }}>
        <Suspense fallback={null}>
          <Scene
            selectedPlanet={selectedPlanet}
            setSelectedPlanet={setSelectedPlanet}
            isPaused={isPaused}
          />
        </Suspense>
      </Canvas>

      {/* Loading screen */}
      <Suspense fallback={<LoadingScreen />}>
        <div />
      </Suspense>

      {/* Info Panel */}
      <InfoPanel planet={selectedPlanetData} onClose={() => setSelectedPlanet(null)} />

      {/* Controls */}
      <Controls isPaused={isPaused} setIsPaused={setIsPaused} />

      {/* Instructions */}
      <div className="absolute bottom-16 md:bottom-20 right-4 md:right-8 text-right z-10">
        <p className="font-mono text-[10px] md:text-xs text-cyan-500/50 tracking-wider">
          <span className="hidden md:inline">DRAG TO ROTATE • SCROLL TO ZOOM • </span>CLICK PLANET FOR INFO
        </p>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-4 md:bottom-6 left-0 right-0 text-center z-10">
        <p className="font-mono text-[10px] text-cyan-500/40 tracking-wider">
          Requested by <span className="text-cyan-500/60">@OxPaulius</span> · Built by <span className="text-cyan-500/60">@clonkbot</span>
        </p>
      </footer>

      {/* Scanlines overlay */}
      <div className="absolute inset-0 pointer-events-none bg-scanlines opacity-[0.03]" />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-radial from-transparent via-transparent to-black/60" />
    </div>
  )
}
