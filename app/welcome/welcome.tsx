import { Navbar } from "../navbar/navbar";
import { Roadmap } from "./roadmap";
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Float, Preload, Html, Points, PointMaterial } from '@react-three/drei';
import { Suspense, useMemo, useRef, useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { 
  Zap, 
  Shield, 
  Repeat, 
  TrendingUp, 
  Coins, 
  FileText, 
  Gem, 
  Gamepad2,
  Globe,
  Leaf,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  Users,
  Layers,
  ExternalLink,
  Rocket,
  Award,
  Target,
  ChevronRight
} from "lucide-react";

/* ============================================================================
   PRODUCTION CONSTANTS & CONFIGURATION
============================================================================ */

const MODEL_PATH = '/mintLeaf.glb';
const LEAF_SPACING = 5.2;

// Design System Colors - Professional Green Theme
const GREEN_THEME = {
  tier1: '#16a34a',
  tier2: '#059669',
  tier3: '#047857',
  light: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
  },
  dark: {
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  }
};

/* ============================================================================
   ANIMATION PRESETS
============================================================================ */

const ANIMATION_PRESETS = {
  rotation: {
    baseSpeed: 0.04,
    selectedSpeed: 0.08,
    hoverSpeed: 0.06,
    dragSensitivity: 0.015,
  },
  float: {
    baseIntensity: 0.18,
    hoverIntensity: 0.28,
    selectedIntensity: 0.85,
    bounceSpeed: 1.8,
  },
  scale: {
    base: 1.0,
    hover: 1.12,
    selected: 1.32,
    transitionSpeed: 8,
  },
  position: {
    liftHeight: 1.4,
  },
  selection: {
    glowIntensity: 0.35,
    ringScale: 1.15,
    ringOpacity: 0.22,
    particles: { 
      count: 16, 
      speed: 1.5,
      size: 0.15,
      opacity: 0.6,
    },
  },
  drag: {
    resistance: 0.88,
    snapBackStrength: 0.45,
    maxRotation: Math.PI * 2.5,
    velocityDecay: 0.85,
  }
};

/* ============================================================================
   LEAF DATA - AUTHENTIC TOKEN UTILITY
============================================================================ */

interface LeafData {
  id: number;
  title: string;
  subtitle: string;
  price: string;
  color: string;
  baseScale: number;
  position: [number, number, number];
  features: string[];
  tokenUtility: string;
  tag: string;
  cta: string;
  icon: React.ReactNode;
}

const LEAVES: LeafData[] = [
  {
    id: 1,
    title: "Community",
    subtitle: "Basic Access",
    price: "Free",
    color: GREEN_THEME.tier1,
    baseScale: 1.0,
    position: [-LEAF_SPACING, 0, 0],
    features: [
      "Mint BRC-20 on Fractal",
      "Mint Runes on Bitcoin L1",
      "Inscribe ordinals on Bitcoin",
      "Index ordinals across chains",
      "Live Runes market data"
    ],
    tokenUtility: "No token required • Standard 8% fee",
    tag: "Free",
    cta: "Start Minting",
    icon: <Users className="w-5 h-5" />
  },
  {
    id: 2,
    title: "Builder",
    subtitle: "$LUCKY Holder",
    price: "Hold $LUCKY",
    color: GREEN_THEME.tier2,
    baseScale: 1.1,
    position: [0, 0, 0],
    features: [
      "Everything in Community",
      "6% platform fee (vs 8%)",
      "Priority support",
      "Beta feature access",
      "Early access to new tools",
      "Governance voting"
    ],
    tokenUtility: "Reduced fees • Revenue share • Governance",
    tag: "6% Fee",
    cta: "Get $LUCKY",
    icon: <Zap className="w-5 h-5" />
  },
  {
    id: 3,
    title: "Genesis",
    subtitle: "Ordinals Holder",
    price: "Hold Ordinal",
    color: GREEN_THEME.tier3,
    baseScale: 1.0,
    position: [LEAF_SPACING, 0, 0],
    features: [
      "Everything in Builder",
      "Genesis Ordinals",
      "Game alpha access",
      "Online rooms (coming soon)",
      "Custom character sprite",
      "20 unique variants",
      "Future airdrop eligibility"
    ],
    tokenUtility: "Game access • Ordinals utility • Airdrops",
    tag: "Game Access",
    cta: "View Collection",
    icon: <Gem className="w-5 h-5" />
  }
];

/* ============================================================================
   PARTICLE SYSTEM COMPONENT
============================================================================ */

interface ParticlesProps {
  color: string;
  isActive?: boolean;
}

function SelectionParticles({ color, isActive = true }: ParticlesProps) {
  const particlesRef = useRef<THREE.Points>(null);
  const count = ANIMATION_PRESETS.selection.particles.count;
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      const radius = 2 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      pos[i] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i + 1] = Math.random() * 2.5;
      pos[i + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    if (particlesRef.current && isActive) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <Points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <PointMaterial
        size={ANIMATION_PRESETS.selection.particles.size}
        color={color}
        transparent
        opacity={ANIMATION_PRESETS.selection.particles.opacity}
        sizeAttenuation
        depthWrite={false}
      />
    </Points>
  );
}

/* ============================================================================
   PREMIUM LEAF COMPONENT
============================================================================ */

interface InteractiveLeafProps {
  leaf: LeafData;
  isSelected: boolean;
  onSelect: (id: number | null) => void;
  animationTime: number;
}

function PremiumLeaf({ leaf, isSelected, onSelect, animationTime }: InteractiveLeafProps) {
  const { scene } = useGLTF(MODEL_PATH);
  const clonedScene = useMemo(() => scene.clone(true), [scene]);
  
  const groupRef = useRef<THREE.Group>(null);
  const modelRef = useRef<THREE.Object3D>(null);
  
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Animation states
  const currentScale = useRef(ANIMATION_PRESETS.scale.base);
  const targetScale = useRef(ANIMATION_PRESETS.scale.base);
  
  const currentPositionY = useRef(0);
  const targetPositionY = useRef(0);
  
  const currentFloat = useRef(0);
  const targetFloat = useRef(0);
  
  // Drag state
  const dragRotation = useRef(0);
  const dragVelocity = useRef(0);
  const lastMouseX = useRef(0);
  
  // Natural motion
  const wobblePhase = useRef(Math.random() * Math.PI * 2);
  const bobPhase = useRef(Math.random() * Math.PI * 2);
  const phaseOffset = useRef((leaf.id - 1) * 0.2);

  // Update targets when state changes
  useEffect(() => {
    if (isSelected) {
      targetScale.current = ANIMATION_PRESETS.scale.selected;
      targetPositionY.current = ANIMATION_PRESETS.position.liftHeight;
      targetFloat.current = ANIMATION_PRESETS.float.selectedIntensity;
    } else if (isHovered) {
      targetScale.current = ANIMATION_PRESETS.scale.hover;
      targetPositionY.current = 0;
      targetFloat.current = ANIMATION_PRESETS.float.hoverIntensity;
    } else {
      targetScale.current = ANIMATION_PRESETS.scale.base;
      targetPositionY.current = 0;
      targetFloat.current = ANIMATION_PRESETS.float.baseIntensity;
    }
  }, [isSelected, isHovered]);

  // Event handlers
  const handlePointerOver = useCallback(() => {
    if (!isSelected) setIsHovered(true);
  }, [isSelected]);

  const handlePointerOut = useCallback(() => {
    if (!isSelected) setIsHovered(false);
  }, [isSelected]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isSelected) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    lastMouseX.current = e.clientX;
    setIsDragging(true);
    dragVelocity.current = 0;
  }, [isSelected]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !isSelected) return;
    
    const deltaX = e.clientX - lastMouseX.current;
    lastMouseX.current = e.clientX;
    
    const rotationAmount = deltaX * ANIMATION_PRESETS.rotation.dragSensitivity;
    dragVelocity.current = rotationAmount * 0.7;
    dragRotation.current += rotationAmount;
    
    dragRotation.current = Math.max(
      -ANIMATION_PRESETS.drag.maxRotation,
      Math.min(ANIMATION_PRESETS.drag.maxRotation, dragRotation.current)
    );
  }, [isDragging, isSelected]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging || !isSelected) return;
    setIsDragging(false);
  }, [isDragging, isSelected]);

  useEffect(() => {
    if (isSelected) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isSelected, handleMouseMove, handleMouseUp]);

  useFrame((state, delta) => {
    if (!modelRef.current || !groupRef.current) return;

    const dt = Math.min(delta, 0.016);

    wobblePhase.current += dt * ANIMATION_PRESETS.float.bounceSpeed;
    bobPhase.current += dt * ANIMATION_PRESETS.float.bounceSpeed;

    const naturalWobble = Math.sin(wobblePhase.current + phaseOffset.current) * 0.1;
    const naturalBob = Math.sin(bobPhase.current) * 0.15;

    currentScale.current = THREE.MathUtils.damp(
      currentScale.current,
      targetScale.current,
      ANIMATION_PRESETS.scale.transitionSpeed,
      dt
    );

    currentPositionY.current = THREE.MathUtils.damp(
      currentPositionY.current,
      targetPositionY.current,
      6,
      dt
    );

    currentFloat.current = THREE.MathUtils.damp(
      currentFloat.current,
      targetFloat.current,
      6,
      dt
    );

    let rotationSpeed = ANIMATION_PRESETS.rotation.baseSpeed;
    if (isSelected) {
      rotationSpeed = ANIMATION_PRESETS.rotation.selectedSpeed;
    } else if (isHovered) {
      rotationSpeed = ANIMATION_PRESETS.rotation.hoverSpeed;
    }

    let targetRotation = animationTime * rotationSpeed + naturalWobble;

    if (isDragging) {
      dragVelocity.current *= ANIMATION_PRESETS.drag.resistance;
      dragRotation.current += dragVelocity.current * dt;
      targetRotation += dragRotation.current;
    } else {
      dragRotation.current = THREE.MathUtils.damp(
        dragRotation.current,
        0,
        ANIMATION_PRESETS.drag.snapBackStrength,
        dt
      );
      dragVelocity.current *= ANIMATION_PRESETS.drag.velocityDecay;
      targetRotation += dragRotation.current;
    }

    modelRef.current.rotation.y = THREE.MathUtils.lerp(
      modelRef.current.rotation.y,
      targetRotation,
      0.1
    );

    const floatY = currentFloat.current * (1 + naturalBob);
    const finalY = leaf.position[1] + currentPositionY.current + floatY;
    
    groupRef.current.position.y = finalY;

    const finalScale = 3.0 * leaf.baseScale * currentScale.current;
    groupRef.current.scale.setScalar(finalScale);
  });

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(isSelected ? null : leaf.id);
  }, [isSelected, leaf.id, onSelect]);

  return (
    <group
      ref={groupRef}
      position={leaf.position}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      <primitive 
        ref={modelRef} 
        object={clonedScene}
        onPointerDown={handleMouseDown}
        style={{ cursor: isSelected ? (isDragging ? 'grabbing' : 'grab') : 'pointer' }}
      />

      {isSelected && (
        <mesh
          position={[0, -0.6, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={ANIMATION_PRESETS.selection.ringScale}
        >
          <ringGeometry args={[1.9 * leaf.baseScale, 2.3 * leaf.baseScale, 48]} />
          <meshBasicMaterial 
            color={leaf.color}
            transparent
            opacity={ANIMATION_PRESETS.selection.ringOpacity}
            depthWrite={false}
          />
        </mesh>
      )}

      {isSelected && (
        <pointLight
          position={[0, 0.8, 0]}
          color={leaf.color}
          intensity={ANIMATION_PRESETS.selection.glowIntensity}
          distance={6}
          decay={1.5}
        />
      )}

      <mesh
        position={[0, -0.9, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[currentScale.current * 0.75, currentScale.current * 0.75, 1]}
      >
        <circleGeometry args={[1.5 * leaf.baseScale, 24]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0.08 * (1 - currentFloat.current * 0.5)}
          depthWrite={false}
        />
      </mesh>

      {isSelected && !isDragging && (
        <SelectionParticles 
          color={leaf.color}
          isActive={!isDragging}
        />
      )}

      <Html
        position={[0, -2.5, 0]}
        style={{
          pointerEvents: 'none',
          opacity: isHovered || isSelected ? 1 : 0,
          transform: 'translateX(-50%)',
          left: '50%',
          position: 'absolute',
          textAlign: 'center',
          minWidth: '240px',
          transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        center={false}
      >
        <div
          className={`
            px-6 py-5 rounded-3xl backdrop-blur-xl border-2
            transition-all duration-500
            ${isSelected 
              ? 'bg-white/98 border-gray-300/80 shadow-2xl' 
              : 'bg-white/90 border-white/50 shadow-xl'
            }
          `}
          style={{
            transform: `scale(${currentScale.current * 0.85}) translateY(${isSelected ? '-10px' : '0px'})`,
            borderLeft: `6px solid ${leaf.color}`,
          }}
        >
          <div className={`font-bold text-2xl mb-2 ${isSelected ? 'text-gray-900' : 'text-gray-800'}`}>
            {leaf.title}
          </div>
          <div className="text-sm font-medium mb-2" style={{ color: leaf.color }}>
            {leaf.price}
          </div>
          <div className={`text-xs ${isSelected ? 'text-gray-600' : 'text-gray-500'}`}>
            {leaf.subtitle}
          </div>
        </div>
      </Html>

      {isDragging && Math.abs(dragVelocity.current) > 0.01 && (
        <mesh
          position={[0, -0.7, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[
            2.1 * leaf.baseScale,
            2.5 * leaf.baseScale,
            16,
            1,
            -dragVelocity.current * 8,
            Math.PI * 0.7
          ]} />
          <meshBasicMaterial 
            color={leaf.color}
            transparent
            opacity={0.12}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

/* ============================================================================
   SMALL PROFILE LEAF COMPONENT
============================================================================ */

function ProfileLeaf() {
  const { scene } = useGLTF(MODEL_PATH);
  const clonedScene = useMemo(() => scene.clone(true), [scene]);
  const modelRef = useRef<THREE.Object3D>(null);

  useFrame((state, delta) => {
    if (modelRef.current) {
      modelRef.current.rotation.y += delta * 0.5;
      modelRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
    }
  });

  return (
    <Float speed={1.5} floatIntensity={0.2} rotationIntensity={0.1}>
      <primitive 
        ref={modelRef} 
        object={clonedScene} 
        scale={[1.35, 1.35, 1.35]}
      />
    </Float>
  );
}

/* ============================================================================
   LOADING COMPONENT
============================================================================ */

function PremiumLoader() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.6;
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.1 + 1;
      meshRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1.2, 2]} />
      <meshStandardMaterial 
        color={GREEN_THEME.light[400]}
        emissive={GREEN_THEME.light[300]}
        emissiveIntensity={0.3}
        transparent
        opacity={0.85}
        roughness={0.3}
        metalness={0.1}
      />
    </mesh>
  );
}

/* ============================================================================
   3D SCENE COMPONENT
============================================================================ */

interface SceneProps {
  selectedLeaf: number | null;
  onLeafSelect: (id: number | null) => void;
  onTimeUpdate?: (time: number) => void;
}

function LeafScene({ selectedLeaf, onLeafSelect, onTimeUpdate }: SceneProps) {
  const [animationTime, setAnimationTime] = useState(0);
  const { camera } = useThree();

  useFrame((state) => {
    const targetZ = selectedLeaf ? 13 : 16;
    const targetY = selectedLeaf ? 1.2 : 0.5;
    
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.05);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.05);
    camera.lookAt(0, selectedLeaf ? 0.8 : 0, 0);
    
    setAnimationTime(state.clock.elapsedTime);
    if (onTimeUpdate) {
      onTimeUpdate(state.clock.elapsedTime);
    }
  });

  return (
    <>
      <ambientLight intensity={0.9} color="#ffffff" />
      <directionalLight 
        position={[8, 15, 5]} 
        intensity={1.3} 
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <directionalLight position={[-8, 5, -5]} intensity={0.7} color="#e0f2fe" />
      <hemisphereLight color="#ffffff" groundColor="#f0fdf4" intensity={0.5} />
      <pointLight position={[0, 5, 10]} intensity={0.4} color="#ffffff" distance={20} />
      
      {LEAVES.map((leaf) => (
        <PremiumLeaf
          key={leaf.id}
          leaf={leaf}
          isSelected={selectedLeaf === leaf.id}
          onSelect={onLeafSelect}
          animationTime={animationTime}
        />
      ))}

      <Preload all />
    </>
  );
}

/* ============================================================================
   MAIN COMPONENT - GRANT CARDON ENERGY
============================================================================ */

export function Welcome() {
  const [selectedLeaf, setSelectedLeaf] = useState<number | null>(null);
  const [animationTime, setAnimationTime] = useState(0);

  const handleLeafSelect = useCallback((id: number | null) => {
    setSelectedLeaf(id);
  }, []);

  const handleAction = useCallback((leafId: number) => {
    const leaf = LEAVES.find(l => l.id === leafId);
    if (leaf?.title === "Genesis") {
      window.location.href = '/collection';
    } else if (leaf?.title === "Builder") {
      window.location.href = '/token';
    } else {
      window.location.href = '/app/mint';
    }
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 pt-16 pb-12 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Navbar />

        {/* Hero Section */}
        <section className="py-12 md:py-16">
          <div className="text-center max-w-4xl mx-auto mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full border border-green-200 mb-6">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-sm font-medium text-green-700">Live on Bitcoin L1 & Fractal Bitcoin • Mainnet</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
              The First Unified
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
                Bitcoin Multi-Chain Toolkit
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              The platform that lets you mint Runes, BRC-20 and Incribe Ordinals on both Bitcoin L1 AND Fractal Bitcoin. 
              Same interface. Same features. Real transactions.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700">10k+ Transactions</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full">
                <Repeat className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Cross-Chain Native</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full">
                <Shield className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700">100% On-Chain</span>
              </div>
            </div>

            {selectedLeaf && (
              <div className="inline-flex items-center gap-4 px-6 py-3 bg-white rounded-full border border-gray-200 shadow-lg animate-in fade-in slide-in-from-top-5 duration-300 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full animate-pulse" style={{ 
                    backgroundColor: LEAVES.find(l => l.id === selectedLeaf)?.color 
                  }} />
                  <span className="text-sm font-medium text-gray-700">
                    Selected: <strong>{LEAVES.find(l => l.id === selectedLeaf)?.title}</strong>
                  </span>
                </div>
                <button
                  onClick={() => handleLeafSelect(null)}
                  className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* 3D Scene */}
          <div className="relative w-full h-[520px] max-w-6xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
            <Canvas
              dpr={[1, 2]}
              frameloop="always"
              gl={{ 
                antialias: true, 
                powerPreference: 'high-performance',
                alpha: true,
              }}
              camera={{ position: [0, 0.5, 16], fov: 45 }}
              style={{ 
                background: 'transparent',
                borderRadius: '28px',
                overflow: 'hidden',
                touchAction: 'none',
              }}
              shadows
            >
              <Suspense fallback={<PremiumLoader />}>
                <LeafScene 
                  selectedLeaf={selectedLeaf} 
                  onLeafSelect={handleLeafSelect}
                  onTimeUpdate={setAnimationTime}
                />
              </Suspense>
            </Canvas>
            
            {/* Interactive Hint */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-center pointer-events-none">
              <div className="inline-flex items-center gap-3 px-5 py-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium text-gray-700">
                  {selectedLeaf 
                    ? "Drag to inspect • Release for smooth snap-back" 
                    : "Click any card to explore features"}
                </span>
              </div>
            </div>
          </div>
        </section>
            {/* Tier Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-16">
            {LEAVES.map((leaf) => {
              const isSelected = selectedLeaf === leaf.id;
              return (
                <div
                  key={leaf.id}
                  className={`
                    group relative overflow-hidden rounded-3xl border-2 cursor-pointer
                    transition-all duration-300 ease-out bg-white
                    ${isSelected
                      ? 'shadow-2xl scale-[1.02] transform-gpu border-4'
                      : 'shadow-lg hover:shadow-xl border-gray-200 hover:border-gray-300'
                    }
                  `}
                  style={{
                    borderColor: isSelected ? leaf.color : undefined,
                  }}
                  onClick={() => handleLeafSelect(isSelected ? null : leaf.id)}
                >
                  <div 
                    className="h-2 w-full"
                    style={{ backgroundColor: leaf.color }}
                  />
                  
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700">
                            {leaf.icon}
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900">{leaf.title}</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">{leaf.subtitle}</p>
                        <div className="text-lg font-bold mb-2" style={{ color: leaf.color }}>
                          {leaf.price}
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ 
                        backgroundColor: `${leaf.color}15`,
                        color: leaf.color,
                      }}>
                        {leaf.tag}
                      </span>
                    </div>

                    <div className="space-y-2 my-6">
                      {leaf.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="text-xs text-gray-500 mb-4 pt-4 border-t border-gray-100">
                      {leaf.tokenUtility}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(leaf.id);
                      }}
                      className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all hover:scale-105 flex items-center justify-center gap-2"
                      style={{ 
                        backgroundColor: leaf.color,
                        color: 'white'
                      }}
                    >
                      {leaf.cta}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Why We're Different */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-20">
            {[
              {
                icon: <Target className="w-6 h-6" />,
                title: "First Mover",
                desc: "Only platform minting Runes on Bitcoin L1 AND BRC-20 on Fractal. Not following. Leading."
              },
              {
                icon: <Repeat className="w-6 h-6" />,
                title: "Cross-Chain Native",
                desc: "Same features. Same interface. Both networks. Not a bridge. Not a wrapper. Native."
              },
              {
                icon: <TrendingUp className="w-6 h-6" />,
                title: "10k+ Settled",
                desc: "Real transactions. Real volume. Real users. We don't test in production. We produce."
              }
            ].map((item, idx) => (
              <div key={idx} className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all group">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
                     {/* Platform Features */}
        <section className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything Works
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
                Everywhere
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Full feature parity across Bitcoin L1 and Fractal. No compromises. No half-measures.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Leaf className="w-6 h-6" />,
                title: 'Bitcoin L1',
                features: [
                  'Runes Direct Mint',
                  'Ordinal Inscriptions',
                  'Ordinal Indexing',
                  'Live Runes Data'
                ]
              },
              {
                icon: <Layers className="w-6 h-6" />,
                title: 'Fractal',
                features: [
                  'BRC-20 Minting',
                  'Batch Operations',
                  'Cross-Chain Indexing',
                  'Lower Fees'
                ]
              },
              {
                icon: <Gamepad2 className="w-6 h-6" />,
                title: 'Game Alpha',
                features: [
                  'On-Chain Assets',
                  'Online Rooms (WIP)',
                  'Ordinal Holders Only',
                  'In-Game Runes BTC Tokenomics'
                ]
              },
              {
                icon: <Award className="w-6 h-6" />,
                title: 'I•AM•TOO•LUCKY Token',
                features: [
                  'Bitcoin Runes L1',
                  'Governance Voting',
                  'Revenue Share',
                  'Future Utility'
                ]
              }
            ].map((item, idx) => (
              <div key={idx} className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all group">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center text-green-600 mb-4 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{item.title}</h3>
                <ul className="space-y-2">
                  {item.features.map((feature, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

                <Roadmap />


        {/* Game Teaser */}
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-50 to-purple-50 rounded-2xl border border-green-200">
            <Gamepad2 className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-700">
              Alpha access for Genesis Ordinals holders • 100 unique sprites ready
            </span>
            <Sparkles className="w-4 h-4 text-green-500" />
          </div>
        </div>


        {/* Team Section */}
        <section className="py-16 bg-white rounded-3xl shadow-sm mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-12">
              <div className="lg:w-1/2 text-center lg:text-left">
                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  Built by <span className="text-green-600">Bitcoin</span> Builders
                </h2>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  We're not an L2. We're not a bridge. We're native Bitcoin tooling that works across chains. 
                  Mint on L1. Mint on sidechains. Index everything. No compromises.
                </p>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">10k+ transactions</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">100% on-chain</span>
                  </div>
                </div>
              </div>

              <div className="lg:w-1/2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {[
                    { name: "LUCKY", role: "Co-Founder", focus: "Economic Design", icon: <Zap className="w-5 h-5" /> },
                    { name: "CLG", role: "Co-Founder", focus: "Technical Architecture", icon: <Rocket className="w-5 h-5" /> }
                  ].map((leader) => (
                    <div key={leader.name} className="group">
                      <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors">
                        <div className="relative">
                          <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                            <Canvas
                              dpr={[1, 2]}
                              gl={{ antialias: true }}
                              style={{ width: '100%', height: '100%' }}
                              camera={{ position: [0, 0, 3], fov: 45 }}
                            >
                              <Suspense fallback={<PremiumLoader />}>
                                <ambientLight intensity={0.9} />
                                <directionalLight position={[2, 2, 2]} intensity={1.2} />
                                <ProfileLeaf />
                                <Preload all />
                              </Suspense>
                            </Canvas>
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-600 border-2 border-white flex items-center justify-center text-white">
                            {leader.icon}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">{leader.name}</h3>
                          <p className="text-sm text-gray-600">{leader.role}</p>
                          <p className="text-xs text-gray-500 mt-1">{leader.focus}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Launch CTA */}
        <div className="text-center py-12">
          <button
            onClick={() => window.location.href = '/app/mint'}
            className="group inline-flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
          >
            <Zap className="w-5 h-5 text-green-400 group-hover:animate-pulse" />
            Start Minting Now
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="text-sm text-gray-500 mt-4 flex items-center justify-center gap-2">
            <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-500" /> Free tier</span>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span className="flex items-center gap-1"><TrendingUp className="w-4 h-4 text-green-500" /> 8% fee</span>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span className="flex items-center gap-1"><Repeat className="w-4 h-4 text-green-500" /> Bitcoin L1 + Fractal</span>
          </p>
        </div>
      </div>
    </main>
  );
}

useGLTF.preload(MODEL_PATH);