// ThreeJSBackground.jsx - FIXED ANIMATION WITH SMOOTH BACKGROUND
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import FerrariLogo from './assets/LoadingLogo.svg';

const ThreeJSBackground = ({ onAnimationComplete, mode = 'intro' }) => {
  const mountRef = useRef(null);
  const frameRef = useRef();
  const [showLogo, setShowLogo] = useState(false);
  const [logoOpacity, setLogoOpacity] = useState(0);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      powerPreference: "high-performance"
    });
    
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    const canvas = renderer.domElement;
    currentMount.appendChild(canvas);

    // Italian flag color palette
    const italianColors = [
      new THREE.Color(0x008751), // Italian Green - LEFT
      new THREE.Color(0xffffff), // White - MIDDLE  
      new THREE.Color(0xcd212a), // Italian Red - RIGHT
    ];

    // Create Italian flag particles
    const createItalianFlagParticles = () => {
      const particleCount = 6000;
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      const sizes = new Float32Array(particleCount);
      const velocities = new Float32Array(particleCount * 3);
      const flagTargets = new Float32Array(particleCount * 3);

      // Italian flag dimensions
      const flagWidth = 14;
      const flagHeight = 9;
      const stripWidth = flagWidth / 3;

      let particleIndex = 0;

      // Create ALL THREE strips with equal distribution
      const particlesPerStrip = Math.floor(particleCount / 3);

      for (let strip = 0; strip < 3; strip++) {
        const stripColor = italianColors[strip];
        const stripX = -flagWidth/2 + strip * stripWidth;
        
        const particlesPerRow = Math.floor(Math.sqrt(particlesPerStrip * (flagHeight / flagWidth)));
        const particlesPerCol = Math.floor(particlesPerStrip / particlesPerRow);
        
        for (let row = 0; row < particlesPerRow; row++) {
          for (let col = 0; col < particlesPerCol; col++) {
            if (particleIndex >= particleCount) break;
            
            const i3 = particleIndex * 3;
            
            // Start positions - scattered around
            const startX = (Math.random() - 0.5) * 50;
            const startY = (Math.random() - 0.5) * 50;
            const startZ = (Math.random() - 0.5) * 40;
            
            positions[i3] = startX;
            positions[i3 + 1] = startY;
            positions[i3 + 2] = startZ;

            // Calculate target position within the strip
            const colFrac = col / particlesPerCol;
            const rowFrac = row / particlesPerRow;
            
            const targetX = stripX + (colFrac * stripWidth);
            const targetY = (flagHeight/2) - (rowFrac * flagHeight);

            flagTargets[i3] = targetX;
            flagTargets[i3 + 1] = targetY;
            flagTargets[i3 + 2] = 0;

            // Set colors
            colors[i3] = stripColor.r;
            colors[i3 + 1] = stripColor.g;
            colors[i3 + 2] = stripColor.b;

            sizes[particleIndex] = 0.09 + Math.random() * 0.05;
            
            // Initialize velocities
            velocities[i3] = 0;
            velocities[i3 + 1] = 0;
            velocities[i3 + 2] = 0;
            
            particleIndex++;
          }
        }
      }

      // Fill any remaining particles
      const remaining = particleCount - particleIndex;
      
      for (let i = 0; i < remaining; i++) {
        const i3 = particleIndex * 3;
        const stripColor = italianColors[2]; // RED
        
        positions[i3] = (Math.random() - 0.5) * 50;
        positions[i3 + 1] = (Math.random() - 0.5) * 50;
        positions[i3 + 2] = (Math.random() - 0.5) * 40;

        const stripX = -flagWidth/2 + 2 * stripWidth;
        const targetX = stripX + Math.random() * stripWidth;
        const targetY = (Math.random() - 0.5) * flagHeight;

        flagTargets[i3] = targetX;
        flagTargets[i3 + 1] = targetY;
        flagTargets[i3 + 2] = 0;

        colors[i3] = stripColor.r;
        colors[i3 + 1] = stripColor.g;
        colors[i3 + 2] = stripColor.b;

        sizes[particleIndex] = 0.09 + Math.random() * 0.05;
        
        velocities[i3] = 0;
        velocities[i3 + 1] = 0;
        velocities[i3 + 2] = 0;
        
        particleIndex++;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

      const material = new THREE.PointsMaterial({
        size: mode === 'intro' ? 0.12 : 0.08,
        vertexColors: true,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
        depthWrite: false,
      });

      const particles = new THREE.Points(geometry, material);
      
      return {
        particles,
        geometry,
        material,
        velocities,
        flagTargets,
      };
    };

    // Create particle system
    const particles = createItalianFlagParticles();
    scene.add(particles.particles);

    // Enhanced lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 1.0);
    const pointLight = new THREE.PointLight(0xffffff, 1.5);
    pointLight.position.set(10, 10, 15);
    scene.add(ambientLight, pointLight);

    // Camera
    camera.position.z = 16;

    // Animation variables
    const clock = new THREE.Clock();
    let animationPhase = 0;
    let animationStartTime = 0;
    let animationFinished = false;

    // Smooth easing functions
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    // Animation loop - FIXED FLOW
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      
      const elapsedTime = clock.getElapsedTime();
      
      if (animationStartTime === 0) {
        animationStartTime = elapsedTime;
      }
      
      const phaseTime = elapsedTime - animationStartTime;

      // Camera movement
      camera.position.x = Math.sin(elapsedTime * 0.03) * 0.5;
      camera.position.y = Math.cos(elapsedTime * 0.02) * 0.3;
      camera.lookAt(scene.position);

      if (mode === 'intro') {
        // INTRO MODE: Simple flag formation then transition
        if (animationPhase === 0) {
          // Phase 0: Form Italian flag (3 seconds)
          const positions = particles.geometry.attributes.position.array;
          const targets = particles.flagTargets;
          
          const progress = Math.min(1, phaseTime / 3);
          const easedProgress = easeOutCubic(progress);
          
          for (let i = 0; i < positions.length; i += 3) {
            const dx = targets[i] - positions[i];
            const dy = targets[i + 1] - positions[i + 1];
            const dz = targets[i + 2] - positions[i + 2];
            
            const ease = 0.2;
            positions[i] += dx * ease * easedProgress;
            positions[i + 1] += dy * ease * easedProgress;
            positions[i + 2] += dz * ease * easedProgress;
          }
          
          particles.geometry.attributes.position.needsUpdate = true;

          // Show logo when flag is mostly formed
          if (phaseTime > 1.5) {
            const logoProgress = Math.min(1, (phaseTime - 1.5) / 1.5);
            setLogoOpacity(logoProgress);
            setShowLogo(true);
          }

          if (phaseTime > 3) {
            animationPhase = 1;
            animationStartTime = elapsedTime;
          }

        } else if (animationPhase === 1) {
          // Phase 1: Hold flag with logo (2 seconds)
          const positions = particles.geometry.attributes.position.array;
          const targets = particles.flagTargets;
          
          // Gentle waving while maintaining positions
          for (let i = 0; i < positions.length; i += 3) {
            const wave = Math.sin(targets[i] * 2 + elapsedTime * 3) * 0.08;
            positions[i + 1] = targets[i + 1] + wave;
            
            // Snap to target positions
            positions[i] = targets[i];
            positions[i + 2] = targets[i + 2];
          }
          
          particles.geometry.attributes.position.needsUpdate = true;

          if (phaseTime > 2) {
            animationPhase = 2;
            animationStartTime = elapsedTime;
          }

        } else if (animationPhase === 2) {
          // Phase 2: Gentle explosion and transition to background (3 seconds)
          const progress = Math.min(1, phaseTime / 3);
          const easedProgress = easeInOutCubic(progress);
          
          // Fade out logo
          setLogoOpacity(1 - progress);
          
          const positions = particles.geometry.attributes.position.array;
          const velocities = particles.velocities;
          
          for (let i = 0; i < positions.length; i += 3) {
            const centerX = 0;
            const centerY = 0;
            
            const dx = positions[i] - centerX;
            const dy = positions[i + 1] - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            
            // Gentle explosion force
            const explosionForce = easedProgress * 20;
            
            positions[i] = centerX + Math.cos(angle) * (distance + explosionForce);
            positions[i + 1] = centerY + Math.sin(angle) * (distance + explosionForce);
            positions[i + 2] += (Math.random() - 0.5) * explosionForce * 0.3;
            
            // Set velocities for background floating
            velocities[i] = (Math.cos(angle) * 0.5 + (Math.random() - 0.5) * 0.3) * easedProgress;
            velocities[i + 1] = (Math.sin(angle) * 0.5 + (Math.random() - 0.5) * 0.3) * easedProgress;
            velocities[i + 2] = ((Math.random() - 0.5) * 0.4) * easedProgress;
          }
          
          particles.geometry.attributes.position.needsUpdate = true;

          if (phaseTime > 3 && !animationFinished) {
            animationFinished = true;
            // Transition to RacerApp menu
            if (onAnimationComplete) {
              onAnimationComplete();
            }
          }
        }
      } else {
        // BACKGROUND MODE: Smooth semi-static floating for RacerApp
        const positions = particles.geometry.attributes.position.array;
        const velocities = particles.velocities;
        
        for (let i = 0; i < positions.length; i += 3) {
          // Very gentle floating motion - semi-static feel
          const noiseX = Math.sin(elapsedTime * 0.2 + positions[i] * 0.05) * 0.008;
          const noiseY = Math.cos(elapsedTime * 0.15 + positions[i + 1] * 0.05) * 0.008;
          const noiseZ = Math.sin(elapsedTime * 0.18 + positions[i + 2] * 0.05) * 0.004;
          
          // Update velocities with very gentle noise
          velocities[i] += noiseX * 0.004;
          velocities[i + 1] += noiseY * 0.004;
          velocities[i + 2] += noiseZ * 0.002;
          
          // Strong damping for semi-static feel
          velocities[i] *= 0.985;
          velocities[i + 1] *= 0.985;
          velocities[i + 2] *= 0.99;
          
          // Update positions
          positions[i] += velocities[i];
          positions[i + 1] += velocities[i + 1];
          positions[i + 2] += velocities[i + 2];
          
          // Very soft boundary constraints
          const boundary = 30;
          if (Math.abs(positions[i]) > boundary) velocities[i] *= -0.2;
          if (Math.abs(positions[i + 1]) > boundary) velocities[i + 1] *= -0.2;
          if (Math.abs(positions[i + 2]) > boundary) velocities[i + 2] *= -0.2;
        }
        
        particles.geometry.attributes.position.needsUpdate = true;
        
        // Perfect background opacity for RacerApp UI readability
        particles.material.opacity = 0.5;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      window.removeEventListener('resize', handleResize);

      scene.remove(particles.particles);
      particles.geometry.dispose();
      particles.material.dispose();

      scene.remove(ambientLight);
      scene.remove(pointLight);

      if (currentMount && canvas && currentMount.contains(canvas)) {
        currentMount.removeChild(canvas);
      }

      renderer.dispose();
    };
  }, [onAnimationComplete, mode]);

  return (
    <>
      <div 
        ref={mountRef} 
        className="absolute inset-0 -z-10"
        style={{
          background: 'radial-gradient(circle at center, #0a0a0a 0%, #000000 100%)'
        }}
      />
      
{/* Ferrari Logo Overlay */}
{showLogo && (
  <div 
    className="absolute inset-0 flex items-center justify-center"
    style={{ 
      opacity: logoOpacity,
      background: 'transparent',
      zIndex: 10
    }}
  >
    <div className="relative z-10 transform scale-60 transition-opacity duration-1500 ease-out">
      <img 
        src={FerrariLogo} 
        alt="Ferrari Logo"
        className="w-32 h-32 md:w-44 md:h-44 drop-shadow-2xl"
        style={{
          filter: 'drop-shadow(0 0 30px rgba(220, 38, 38, 0.8))'
        }}
      />
    </div>
  </div>
)}
    </>
  );
};

export default ThreeJSBackground;