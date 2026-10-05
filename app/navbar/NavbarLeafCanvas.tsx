'use client';

import { Canvas } from '@react-three/fiber';
import { useGLTF, Float } from '@react-three/drei';
import { Suspense, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

function NavbarLeaf() {
  const { scene } = useGLTF('/mintLeaf.glb');
  const leafRef = useRef<THREE.Group>(null);
  
  return (
    <Float speed={2} floatIntensity={0.5} rotationIntensity={0.2}>
      <primitive 
        ref={leafRef}
        object={scene.clone()} 
        scale={[2.5, 2.5, 2.5]}
        rotation={[0, -Math.PI / 2, 0]}
      />
    </Float>
  );
}

export function NavbarLeafCanvas({ className }: { className?: string }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className={className} />; // Placeholder during SSR
  }

  return (
    <div className={className}>
      <Canvas
        dpr={[1, 2]}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: "high-performance"
        }}
        camera={{ position: [0, 0, 3.5], fov: 45 }}
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[2, 2, 2]} intensity={1.5} />
          <directionalLight position={[-2, 1, 1]} intensity={0.8} />
          <pointLight position={[0, 2, 2]} intensity={0.5} />
          <NavbarLeaf />
        </Suspense>
      </Canvas>
    </div>
  );
}

// Preload the model (only in browser)
if (typeof window !== 'undefined') {
  useGLTF.preload('/mintLeaf.glb');
}