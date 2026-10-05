// EnvelopeEntry.tsx - SMOOTH TRANSITIONS ONLY
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import LogoOne from '../assets/scuderialogo.png';
import upIcon from '../assets/up-chevron.svg';

interface EnvelopeEntryProps {
  onCardReady: () => void;
  onAnimationComplete: () => void;
  shouldContinue: boolean;
}

const EnvelopeEntry = ({ onCardReady, onAnimationComplete, shouldContinue }: EnvelopeEntryProps) => {
  const mountRef = useRef(null);
  const frameRef = useRef<number>();
  
  // Use state for animation state to trigger re-renders
  const [animationState, setAnimationState] = useState<'idle' | 'fadeOutText' | 'positionEnvelope' | 'opening' | 'cardSlideOut' | 'waitingForPassword' | 'cardExit' | 'cinematicFade'>('idle');
  
  // KEEP YOUR ORIGINAL PROGRESS REFS
  const fadeOutProgressRef = useRef(0);
  const envelopePositionProgressRef = useRef(0);
  const envelopeOpenProgressRef = useRef(0);
  const cardSlideProgressRef = useRef(0);
  const cardExitProgressRef = useRef(0);
  const cinematicFadeProgressRef = useRef(0);
  
  // Store the FINAL lowered position - this is our new reference point
  const finalEnvelopeYRef = useRef(0);
  
  // Store flap state to prevent glitching
  const flapFinalRotationRef = useRef(Math.PI); // Start closed
  const flapFinalPositionRef = useRef(0.08); // Start position
  
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const [isCardReady, setIsCardReady] = useState(false);

  // Text element ref for fade out
  const textPromptRef = useRef<HTMLDivElement>(null);

  // KEEP YOUR EXACT ORIGINAL EASING FUNCTIONS
  const easeInOutCubic = (t: number) => t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const easeOutBack = (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  };

  const handleEnvelopeClick = () => {
    console.log('Envelope clicked! Current state:', animationState);
    if (animationState === 'idle') {
      console.log('Starting animation...');
      setAnimationState('fadeOutText');
    }
  };

  useEffect(() => {
    if (shouldContinue && animationState === 'waitingForPassword') {
      console.log('Continuing animation after password check');
      setAnimationState('cardExit');
    }
  }, [shouldContinue, animationState]);

  // IMPROVED: Smoother text fade out with overlap
  useEffect(() => {
    if (animationState === 'fadeOutText' && textPromptRef.current) {
      console.log('Fading out text...');
      const textElement = textPromptRef.current;
      textElement.style.transition = 'opacity 0.6s ease-in-out';
      textElement.style.opacity = '0';
      
      // Start envelope animation slightly before text completely fades
      const timer = setTimeout(() => {
        console.log('Text fade complete, moving to position envelope');
        setAnimationState('positionEnvelope');
      }, 400); // Reduced from 800ms for overlap
      
      return () => clearTimeout(timer);
    }
  }, [animationState]);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xFC0000);
    sceneRef.current = scene;
    
    // KEEP YOUR ORIGINAL CAMERA SETTINGS
    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    cameraRef.current = camera;
    
    // KEEP YOUR ORIGINAL RENDERER CONFIG
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
    });
    
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.pointerEvents = 'auto';
    renderer.domElement.style.cursor = 'pointer';
    
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // KEEP YOUR ORIGINAL RENDERING SETTINGS
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    const canvas = renderer.domElement;
    currentMount.appendChild(canvas);

    // Add click listener to the entire canvas
    const handleCanvasClick = (event: MouseEvent) => {
      console.log('Canvas clicked at:', event.clientX, event.clientY);
      handleEnvelopeClick();
    };

    canvas.addEventListener('click', handleCanvasClick);

    // KEEP YOUR ORIGINAL LIGHTING SETUP
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(5, 10, 3);
    mainLight.castShadow = true;
    scene.add(mainLight);
    
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 20;
    mainLight.shadow.camera.left = -6;
    mainLight.shadow.camera.right = 6;
    mainLight.shadow.camera.top = 6;
    mainLight.shadow.camera.bottom = -6;
    mainLight.shadow.radius = 2;

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(0, 5, 8);
    fillLight.castShadow = false;
    scene.add(fillLight);    

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.2);
    rimLight.position.set(-3, 8, -8);
    scene.add(rimLight);

    const envelopeGroup = new THREE.Group();
    const scale = 1.2;

    // KEEP YOUR ORIGINAL MATERIALS
    const createPaperMaterial = (color: number) => new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.8,
      metalness: 0.05,
    });

    const envelopeMaterial = createPaperMaterial(0xe60002);
    const cardMaterial = createPaperMaterial(0x1A1A1A);

    // KEEP ALL YOUR ORIGINAL GEOMETRY CODE EXACTLY THE SAME
    const baseGeometry = new THREE.BoxGeometry(8 * scale, 5 * scale, 0.3);
    const base = new THREE.Mesh(baseGeometry, envelopeMaterial);
    base.position.z = -0.15;
    base.castShadow = true;
    base.receiveShadow = true;

    const leftFlapShape = new THREE.Shape();
    leftFlapShape.moveTo(0, -2.4 * scale);
    leftFlapShape.lineTo(0, 2.4 * scale);
    leftFlapShape.lineTo(-4 * scale, 0);
    leftFlapShape.lineTo(0, -2.4 * scale);

    const leftFlapGeometry = new THREE.ExtrudeGeometry(leftFlapShape, {
      depth: 0.05,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.05,
      bevelSegments: 8,
    });

    const leftFlap = new THREE.Mesh(leftFlapGeometry, envelopeMaterial);
    leftFlap.position.x = -3.95 * scale;
    leftFlap.position.z = 0.02;
    leftFlap.rotation.y = Math.PI / 1;
    leftFlap.rotation.x = 0;
    leftFlap.castShadow = true;
    leftFlap.receiveShadow = true;

    const rightFlapShape = new THREE.Shape();
    rightFlapShape.moveTo(0, -2.4 * scale);
    rightFlapShape.lineTo(0, 2.4 * scale);
    rightFlapShape.lineTo(4 * scale, 0);
    rightFlapShape.lineTo(0, -2.4 * scale);

    const rightFlapGeometry = new THREE.ExtrudeGeometry(rightFlapShape, {
      depth: 0.05,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.05,
      bevelSegments: 8,
    });

    const rightFlap = new THREE.Mesh(rightFlapGeometry, envelopeMaterial);
    rightFlap.position.x = 3.94 * scale;
    rightFlap.position.z = 0.02;
    rightFlap.rotation.y = -Math.PI / 1;
    rightFlap.rotation.x = 0;
    rightFlap.castShadow = true;
    rightFlap.receiveShadow = true;

    const bottomFlapShape = new THREE.Shape();
    bottomFlapShape.moveTo(-3.2 * scale, 0);
    bottomFlapShape.lineTo(3.94 * scale, 0);
    bottomFlapShape.lineTo(0, -3 * scale);
    bottomFlapShape.lineTo(-3.94 * scale, 0);

    const bottomFlapGeometry = new THREE.ExtrudeGeometry(bottomFlapShape, {
      depth: 0.05,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.05,
      bevelSegments: 8,
    });

    const bottomFlap = new THREE.Mesh(bottomFlapGeometry, envelopeMaterial);
    bottomFlap.position.y = -2.5 * scale;
    bottomFlap.position.z = 0.02;
    bottomFlap.rotation.x = Math.PI;
    bottomFlap.castShadow = true;
    bottomFlap.receiveShadow = true;

    const flapShape = new THREE.Shape();
    const flapWidth = 3.9 * scale;
    flapShape.moveTo(-flapWidth, 0);
    flapShape.lineTo(flapWidth, 0);
    flapShape.lineTo(0, 3.7 * scale);
    flapShape.lineTo(-flapWidth, 0);

    const flapGeometry = new THREE.ExtrudeGeometry(flapShape, {
      depth: 0.05,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.05,
      bevelSegments: 8,
    });

    const flap = new THREE.Mesh(flapGeometry, envelopeMaterial);
    flap.position.y = 2.48 * scale;
    flap.position.z = flapFinalPositionRef.current;
    flap.rotation.x = flapFinalRotationRef.current;
    flap.castShadow = true;
    flap.receiveShadow = true;

    const createLogoStamp = () => {
      const stampGeometry = new THREE.PlaneGeometry(0.7, 0.9);
      const textureLoader = new THREE.TextureLoader();
      
      const logoTexture = textureLoader.load(LogoOne, (texture) => {
        texture.generateMipmaps = false;
        texture.minFilter = THREE.NearestFilter;
        texture.magFilter = THREE.NearestFilter;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.colorSpace = THREE.SRGBColorSpace;
      });

      logoTexture.generateMipmaps = false;
      logoTexture.minFilter = THREE.NearestFilter;
      logoTexture.magFilter = THREE.NearestFilter;

      const stampMaterial = new THREE.MeshStandardMaterial({
        map: logoTexture,
        transparent: true,
        side: THREE.DoubleSide,
        roughness: 0.3,
        metalness: 0.1,
      });

      const stamp = new THREE.Mesh(stampGeometry, stampMaterial);
      stamp.position.set(0, 2.5 * scale, -0.1);
      stamp.rotation.x = Math.PI;
      
      return stamp;
    };

    const logoStamp = createLogoStamp();
    flap.add(logoStamp);

    const cardGeometry = new THREE.BoxGeometry(6.5 * scale, 3.8 * scale, 0.1);
    const passwordCard = new THREE.Mesh(cardGeometry, cardMaterial);
    passwordCard.position.z = -0.05;
    passwordCard.position.y = -0.5;
    passwordCard.castShadow = true;
    passwordCard.receiveShadow = true;

    envelopeGroup.add(base);
    envelopeGroup.add(leftFlap);
    envelopeGroup.add(rightFlap);
    envelopeGroup.add(bottomFlap);
    envelopeGroup.add(flap);
    envelopeGroup.add(passwordCard);
    scene.add(envelopeGroup);

    camera.position.z = 12;

    // KEEP YOUR ORIGINAL ANIMATION LOOP STRUCTURE - ONLY IMPROVE TRANSITIONS
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      
      const deltaTime = Math.min(0.1, clock.getDelta());
      
      // USE YOUR EXACT ORIGINAL ANIMATION LOGIC - ONLY SMOOTHER STATE TRANSITIONS
      switch (animationState) {
        case 'fadeOutText':
          // Text fade is handled by CSS above
          break;
      
        case 'positionEnvelope':
          // KEEP YOUR ORIGINAL POSITIONING LOGIC
          envelopePositionProgressRef.current = Math.min(1, envelopePositionProgressRef.current + deltaTime * 0.8);
          const positionProgress = envelopePositionProgressRef.current;
          
          const easedPositionProgress = easeInOutCubic(positionProgress);
          finalEnvelopeYRef.current = -easedPositionProgress * 2.5;
          envelopeGroup.position.y = finalEnvelopeYRef.current;
          
          if (positionProgress >= 1) {
            console.log('Envelope FINALLY positioned at Y:', finalEnvelopeYRef.current);
            // SMOOTHER: Add micro-delay for natural feel
            setTimeout(() => setAnimationState('opening'), 50);
          }
          break;

        case 'opening':
          // KEEP YOUR ORIGINAL OPENING LOGIC
          envelopeOpenProgressRef.current = Math.min(1, envelopeOpenProgressRef.current + deltaTime * 0.4);
          const openProgress = envelopeOpenProgressRef.current;
          
          const easedOpenProgress = easeInOutCubic(openProgress);
          
          flap.rotation.x = Math.PI - Math.PI * easedOpenProgress;
          flap.position.z = 0.08 + (-0.23) * easedOpenProgress;
          
          flapFinalRotationRef.current = flap.rotation.x;
          flapFinalPositionRef.current = flap.position.z;
          
          envelopeGroup.position.y = finalEnvelopeYRef.current;
          
          if (openProgress >= 1) {
            flapFinalRotationRef.current = 0;
            flapFinalPositionRef.current = -0.15;
            console.log('Envelope opened at lowered position - flap stays open');
            // SMOOTHER: Natural pause before card emerges
            setTimeout(() => setAnimationState('cardSlideOut'), 100);
          }
          break;

        case 'cardSlideOut':
          // CRITICAL: Apply flap final state at the start
          flap.rotation.x = flapFinalRotationRef.current;
          flap.position.z = flapFinalPositionRef.current;
          
          // KEEP YOUR ORIGINAL CARD SLIDE LOGIC
          cardSlideProgressRef.current = Math.min(1, cardSlideProgressRef.current + deltaTime * 0.3);
          const slideProgress = cardSlideProgressRef.current;
          
          const easedProgress = easeOutBack(slideProgress);
          
          const cardStartY = -0.5;
          const cardTargetY = 3;
          passwordCard.position.y = cardStartY + (cardTargetY - cardStartY) * easedProgress;
          
          envelopeGroup.position.y = finalEnvelopeYRef.current;
          
          if (slideProgress >= 0.5 && !isCardReady) {
            setIsCardReady(true);
            onCardReady();
            renderer.domElement.style.cursor = 'default';
            console.log('Card ready for password input - STAYING VISIBLE');
          }
          
          if (slideProgress >= 1) {
            console.log('Card slide complete - NOW WAITING FOR PASSWORD INPUT');
            setAnimationState('waitingForPassword');
          }
          break;

        case 'waitingForPassword':
          // KEEP YOUR ORIGINAL FREEZE LOGIC
          envelopeGroup.position.y = finalEnvelopeYRef.current;
          flap.rotation.x = flapFinalRotationRef.current;
          flap.position.z = flapFinalPositionRef.current;
          passwordCard.position.y = 3;
          passwordCard.material.transparent = false;
          passwordCard.material.opacity = 1;
          break;

        case 'cardExit':
          console.log('STARTING CARD EXIT - password was validated');
          
          // KEEP YOUR ORIGINAL CARD EXIT LOGIC
          cardExitProgressRef.current = Math.min(1, cardExitProgressRef.current + deltaTime * 0.4);
          const exitProgress = cardExitProgressRef.current;
          
          const easedExitProgress = easeInOutCubic(exitProgress);
          
          const exitStartY = 3;
          const exitTargetY = 20;
          passwordCard.position.y = exitStartY + (exitTargetY - exitStartY) * easedExitProgress;
          passwordCard.rotation.z = exitProgress * 0.3;
          
          if (exitProgress > 0.5) {
            passwordCard.material.transparent = true;
            passwordCard.material.opacity = 1 - ((exitProgress - 0.5) / 0.5);
          }
          
          envelopeGroup.position.y = finalEnvelopeYRef.current;
          flap.rotation.x = flapFinalRotationRef.current;
          flap.position.z = flapFinalPositionRef.current;
          
          if (exitProgress >= 1) {
            console.log('Card exit complete - card is OUTSIDE viewport, starting cinematic fade');
            // SMOOTHER: Brief pause before cinematic fade
            setTimeout(() => setAnimationState('cinematicFade'), 150);
          }
          break;

        case 'cinematicFade':
          // KEEP YOUR ORIGINAL CINEMATIC FADE LOGIC
          envelopeGroup.position.y = finalEnvelopeYRef.current;
          flap.rotation.x = flapFinalRotationRef.current;
          flap.position.z = flapFinalPositionRef.current;
          passwordCard.position.y = 20;
          
          cinematicFadeProgressRef.current = Math.min(1, cinematicFadeProgressRef.current + deltaTime * 0.6);
          const cinematicProgress = cinematicFadeProgressRef.current;
          
          const easedCinematicProgress = easeInOutCubic(cinematicProgress);
          
          const currentRed = new THREE.Color(0xE00000);
          const targetBlack = new THREE.Color(0x000000);
          scene.background = currentRed.clone().lerp(targetBlack, easedCinematicProgress);
          
          ambientLight.intensity = 0.4 * (1 - easedCinematicProgress);
          mainLight.intensity = 1.0 * (1 - easedCinematicProgress);
          fillLight.intensity = 0.3 * (1 - easedCinematicProgress);
          rimLight.intensity = 0.2 * (1 - easedCinematicProgress);
          
          if (cinematicProgress >= 1) {
            console.log('Cinematic fade complete - transitioning to game');
            onAnimationComplete();
            return;
          }
          break;
      }

      renderer.render(scene, camera);
    };

    const clock = new THREE.Clock();
    animate();

    const handleResize = () => {
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // KEEP YOUR ORIGINAL CLEANUP
    return () => {
      canvas.removeEventListener('click', handleCanvasClick);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      window.removeEventListener('resize', handleResize);
      
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry?.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material?.dispose();
          }
        }
      });
      
      if (currentMount && canvas && currentMount.contains(canvas)) {
        currentMount.removeChild(canvas);
      }
      renderer.dispose();
    };
  }, [onCardReady, onAnimationComplete, shouldContinue, isCardReady, animationState]);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div ref={mountRef} className="absolute inset-0" />
      
      {/* Click Prompt - POSITIONED AT BOTTOM */}
      {(animationState === 'idle' || animationState === 'fadeOutText') && (
        <div 
          ref={textPromptRef}
          className="absolute inset-0 flex items-end justify-center z-20 pointer-events-none pb-32"
          style={{ opacity: 1, transition: 'opacity 0.6s ease-in-out' }}
        >
          <div className="text-center text-white">
          <div className="text-center mb-4 animate-bounce">
            <img src={upIcon} alt="Up arrow" className="w-8 h-8 mx-auto" />
          </div>
            <div className="text-s font-bold tracking-wider"
               style={{ fontFamily: 'sixtyfour', letterSpacing: '0.1em' }}>
              CLICK TO OPEN ENVELOPE
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnvelopeEntry;