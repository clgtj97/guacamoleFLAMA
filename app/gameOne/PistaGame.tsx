import React, { useState, useEffect, useRef, useCallback } from 'react';
import { parseGIF, decompressFrames } from 'gifuct-js';
import * as THREE from 'three';
import Lottie from 'lottie-react';
import racingFlagAnimation from './assets/chequered-flag.json';
import DogKart from './assets/DogKart.gif';
import GameBackOne from './assets/Monatnight.png';
import TrackBuilder from './TrackBuilder';
import TrackButton from './assets/racing-track.png';
import RestartButton from './assets/restartBtn.svg';
import ExitButton from './assets/logout.png';
import FlagButton from './assets/flagBtn.png';
import LoadingLogo from './assets/LoadingLogo.svg';

// ========== INTERFACES ==========
interface RoadSegment {
  worldX: number;
  worldY: number;
  worldZ: number;
  curve: number;
  hill: number;
  bank: number;
  friction: number;
  width: number;
}

interface CarState {
  x: number; y: number; z: number;
  speed: number; 
  maxSpeed: number;
  acceleration: number;
  handling: number;
  traction: number;
  lap: number; heading: number;
  lastSteerInput: number; 
  tireLife: number;
  currentGrip: number;
  isOnRoad: boolean;
  driftAmount: number;
  frameAngle: number;
  carLife: number;
  weight: number;
  steeringResponse: number;
  weightTransfer: number;
  slideFactor: number;
}

interface GameState {
  cars: CarState[];
  gameStarted: boolean;
  countdown: number;
  raceTime: number;
  raceFinished: boolean;
  roadSegments: RoadSegment[];
  segmentLength: number;
  trackLength: number;
}

// ========== CONSTANTS ==========
const VIEWPORT_WIDTH = 800;
const VIEWPORT_HEIGHT = 600;
const ROAD_WIDTH = 2000;
const CAR_WIDTH = 80;
const SEGMENT_LENGTH = 200;

// ========== MAIN COMPONENT ==========
export default function PistaGame({ onClose, onStateUpdate, importedTrack }: any) {
  // ========== REFS ==========
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const threeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const trackGroupRef = useRef<THREE.Group | null>(null);
  const roadPieceTemplateRef = useRef<THREE.Group | null>(null);

  // ========== STATE ==========
  const [keys, setKeys] = useState({ 
    ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, 
    Shift: false,
    KeyW: false, KeyS: false, KeyA: false, KeyD: false
  });
  const [framesBitmaps, setFramesBitmaps] = useState<ImageBitmap[] | null>(null);
  const [showTrackBuilder, setShowTrackBuilder] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Starting game...');
  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [raceFinished, setRaceFinished] = useState(false);
  const [raceTime, setRaceTime] = useState(0);
  const [builtTrack, setBuiltTrack] = useState<RoadSegment[] | null>(null);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const [showCompletionOverlay, setShowCompletionOverlay] = useState(false);
  
  // Button hover states
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });

  // ========== PERFORMANCE OPTIMIZATION ==========
  const lastRenderTimeRef = useRef(0);
  const frameCountRef = useRef(0);
  const fpsRef = useRef(0);
  const gameLoopIdRef = useRef<number>(0);
  const renderLoopIdRef = useRef<number>(0);

  // ========== GAME STATE REF ==========
  const gameStateRef = useRef<GameState>({
    cars: [{
      x: 0, y: 0, z: 0,
      speed: 0, 
      maxSpeed: 400,
      acceleration: 1200,
      handling: 35,
      traction: 0.88,
      lap: 0, heading: 0,
      lastSteerInput: 0, 
      tireLife: 100,
      currentGrip: 0.92,
      isOnRoad: true,
      driftAmount: 0,
      frameAngle: 0,
      carLife: 100,
      weight: 150,
      steeringResponse: 1,
      weightTransfer: 0,
      slideFactor: 0,
    }],
    gameStarted: false, 
    countdown: 3, 
    raceTime: 0, 
    raceFinished: false,
    roadSegments: [],
    segmentLength: SEGMENT_LENGTH,
    trackLength: 0,
  });

  // ========== TIRE PARTICLE SYSTEM ==========
  const [tireParticles, setTireParticles] = useState<Array<{
    x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number;
  }>>([]);

  // ========== UPDATED BUTTON CONFIGURATION WITH IMPORTED ICONS ==========
  const buttonConfig = {
    builder: {
      icon: TrackButton,
      label: 'BUILD TRACK',
      description: 'Design your own custom racing circuit',
      bgColor: 'from-blue-500 to-cyan-400'
    },
    default: {
      icon: FlagButton,
      label: 'DEFAULT TRACK',
      description: 'Race on the pre-built circuit',
      bgColor: 'from-green-500 to-emerald-400'
    },
    restart: {
      icon: RestartButton,
      label: 'RESTART',
      description: 'Reset current race session',
      bgColor: 'from-orange-500 to-amber-400'
    },
    exit: {
      icon: ExitButton,
      label: 'EXIT',
      description: 'Return to main menu',
      bgColor: 'from-red-500 to-rose-400'
    }
  };

  // ========== CORE FUNCTIONS ==========

  const loadBackgroundImage = useCallback(() => {
    return new Promise((resolve) => {
      const loader = new THREE.TextureLoader();
      loader.load(
        GameBackOne,
        (texture) => {
          console.log("✅ Background image loaded successfully");
          resolve(texture);
        },
        undefined,
        (error) => {
          console.log("❌ Background image failed to load, using gradient fallback");
          resolve(null);
        }
      );
    });
  }, []);

  const getSpriteFrame = useCallback((steerInput: number, speed: number, driftAmount: number): number => {
    if (!framesBitmaps?.length) return 0;
    
    if (steerInput < -0.1) {
      const turnIntensity = Math.min(1, Math.abs(steerInput) * 2);
      return 1 + Math.floor(turnIntensity * 2);
    } else if (steerInput > 0.1) {
      const turnIntensity = Math.min(1, Math.abs(steerInput) * 2);
      return 17 + Math.floor(turnIntensity * 2);
    } else if (driftAmount > 0.3) {
      return speed > 50 ? 8 : 7;
    }
    return 0;
  }, [framesBitmaps]);

  const createFallbackRoadPiece = useCallback((): THREE.Group => {
    const roadGroup = new THREE.Group();
    const roadGeometry = new THREE.PlaneGeometry(ROAD_WIDTH, SEGMENT_LENGTH);
    roadGeometry.rotateX(-Math.PI / 2);
    const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
    const roadMesh = new THREE.Mesh(roadGeometry, roadMaterial);
    roadMesh.receiveShadow = true;
    roadGroup.add(roadMesh);

    const markingGeometry = new THREE.PlaneGeometry(100, 8);
    markingGeometry.rotateX(-Math.PI / 2);
    const markingMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
    const centerMarking = new THREE.Mesh(markingGeometry, markingMaterial);
    centerMarking.position.set(0, 0.1, 0);
    roadGroup.add(centerMarking);

    return roadGroup;
  }, []);

  const createSkyGradient = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    
    if (context) {
      const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#87CEEB');
      gradient.addColorStop(0.5, '#4682B4');
      gradient.addColorStop(1, '#1E3A8A');
      
      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      context.fillStyle = 'rgba(255, 255, 255, 0.3)';
      context.beginPath();
      context.arc(50, 30, 20, 0, Math.PI * 2);
      context.arc(80, 20, 25, 0, Math.PI * 2);
      context.arc(110, 30, 18, 0, Math.PI * 2);
      context.fill();
      
      context.beginPath();
      context.arc(180, 40, 22, 0, Math.PI * 2);
      context.arc(210, 30, 28, 0, Math.PI * 2);
      context.arc(240, 40, 20, 0, Math.PI * 2);
      context.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    
    return texture;
  }, []);

  const initThreeJS = useCallback(async (backgroundTexture: THREE.Texture | null) => {
    if (!threeCanvasRef.current) return;

    const scene = new THREE.Scene();
    
    if (backgroundTexture) {
      scene.background = backgroundTexture;
      console.log("🎨 Using loaded background image");
    } else {
      scene.background = createSkyGradient();
      console.log("🎨 Using sky gradient background");
    }
    
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, VIEWPORT_WIDTH / VIEWPORT_HEIGHT, 1, 10000);
    camera.position.set(0, 350, 300);
    camera.lookAt(0, 0, 600);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ 
      canvas: threeCanvasRef.current, 
      antialias: true,
      alpha: true 
    });
    renderer.setSize(VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(100, 500, 200);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const trackGroup = new THREE.Group();
    scene.add(trackGroup);
    trackGroupRef.current = trackGroup;

    setBackgroundLoaded(true);
  }, [createSkyGradient]);

  const generateSimpleTrack = useCallback((): RoadSegment[] => {
    const segments: RoadSegment[] = [];
    const totalSegments = 80;
    let currentX = 0, currentZ = 0, currentHeading = 0;

    const trackSections = [
      { length: 15, curve: 0 },
      { length: 10, curve: 30 },
      { length: 5, curve: 0 },
      { length: 8, curve: -60 },
      { length: 8, curve: 0 },
      { length: 6, curve: 45 },
      { length: 6, curve: -45 },
      { length: 12, curve: 0 },
      { length: 10, curve: 50 },
    ];

    let segmentIndex = 0;
    
    trackSections.forEach(section => {
      for (let i = 0; i < section.length; i++) {
        segments.push({ 
          worldX: currentX, 
          worldY: 0, 
          worldZ: currentZ, 
          curve: section.curve, 
          hill: 0, 
          bank: 0, 
          friction: 0.98, 
          width: ROAD_WIDTH 
        });
        
        currentHeading += section.curve * 0.001;
        currentX += Math.sin(currentHeading) * SEGMENT_LENGTH;
        currentZ += Math.cos(currentHeading) * SEGMENT_LENGTH;
        segmentIndex++;
      }
    });
    
    return segments;
  }, []);

  // ========== TRACK BUILDER INTEGRATION ==========
  const handleTrackBuilt = useCallback((trackSegments: RoadSegment[]) => {
    setBuiltTrack(trackSegments);
    setShowTrackBuilder(false);
    buildTrack(trackSegments);
    resetGame();
  }, []);

  const buildTrack = useCallback((segments: RoadSegment[]) => {
    if (!trackGroupRef.current || !roadPieceTemplateRef.current) return;

    trackGroupRef.current.clear();
    const roadPiece = roadPieceTemplateRef.current;
    let currentHeading = 0;
    let currentPosition = new THREE.Vector3(0, 0, 0);

    const normalizedSegments = segments.map(seg => ({
      ...seg,
      friction: 0.98,
      width: ROAD_WIDTH,
      curve: Math.max(-100, Math.min(100, seg.curve || 0))
    }));

    normalizedSegments.forEach((seg, i) => {
      const roadPieceClone = roadPiece.clone();
      
      if (i > 0) {
        currentHeading += seg.curve * 0.001;
        currentPosition.x += Math.sin(currentHeading) * SEGMENT_LENGTH;
        currentPosition.z += Math.cos(currentHeading) * SEGMENT_LENGTH;
      }
      
      roadPieceClone.position.set(currentPosition.x, 0, currentPosition.z);
      roadPieceClone.rotation.y = currentHeading;
      roadPieceClone.rotation.z = seg.curve * 0.0002;
      trackGroupRef.current!.add(roadPieceClone);

      seg.worldX = currentPosition.x;
      seg.worldZ = currentPosition.z;
    });

    gameStateRef.current.roadSegments = normalizedSegments;
    gameStateRef.current.trackLength = normalizedSegments.length * SEGMENT_LENGTH;
  }, []);

  const updateThreeJSCamera = useCallback(() => {
    if (!cameraRef.current) return;
    
    const player = gameStateRef.current.cars[0];
    
    const cameraDistance = 300;
    const cameraHeight = 200 + (Math.abs(player.speed) * 0.1);
    
    const cameraOffsetX = -Math.sin(player.heading) * cameraDistance;
    const cameraOffsetZ = -Math.cos(player.heading) * cameraDistance;
    
    const targetX = player.x + cameraOffsetX * 0.8;
    const targetY = player.y + cameraHeight;
    const targetZ = player.z + cameraOffsetZ;
    
    const lerpFactor = 0.15;
    cameraRef.current.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), lerpFactor);
    
    const lookAheadDistance = 300 + (Math.abs(player.speed) * 0.8);
    const lookAheadX = player.x + Math.sin(player.heading) * lookAheadDistance;
    const lookAheadZ = player.z + Math.cos(player.heading) * lookAheadDistance;
    
    cameraRef.current.lookAt(lookAheadX, player.y + 50, lookAheadZ);
  }, []);

  const updateTireParticles = useCallback((player: CarState, deltaTime: number) => {
    if (player.driftAmount > 0.3 && Math.abs(player.speed) > 30 && player.speed > 0) {
      const newParticles = Array(2).fill(null).map(() => ({
        x: VIEWPORT_WIDTH / 2 + (Math.random() - 0.5) * 60,
        y: VIEWPORT_HEIGHT * 0.62 + 20,
        vx: (Math.random() - 0.5) * 4, vy: Math.random() * 3 + 2,
        life: 1, maxLife: 0.8 + Math.random() * 0.4, size: 3 + Math.random() * 4
      }));
      setTireParticles(prev => [...prev, ...newParticles].slice(0, 50));
    }
    setTireParticles(prev => prev.map(p => ({
      ...p, x: p.x + p.vx, y: p.y + p.vy, life: p.life - deltaTime / p.maxLife, vy: p.vy + 0.5
    })).filter(p => p.life > 0));
  }, []);

  const renderTireParticles = useCallback((ctx: CanvasRenderingContext2D) => {
    tireParticles.forEach(particle => {
      const alpha = particle.life;
      ctx.fillStyle = `rgba(200, 200, 200, ${alpha * 0.7})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [tireParticles]);

  const drawPlayerKart = useCallback((ctx: CanvasRenderingContext2D) => {
    const player = gameStateRef.current.cars[0];
    const carX = VIEWPORT_WIDTH / 2, carY = VIEWPORT_HEIGHT * 0.62;
    const bmp = framesBitmaps?.[currentFrame] || framesBitmaps?.[0];
    
    if (bmp) {
      const scale = 0.7, width = bmp.width * scale, height = bmp.height * scale;
      ctx.save();
      ctx.translate(carX, carY);
      
      if (player.speed < -10) {
        ctx.scale(-1, 1);
      }
      
      ctx.rotate(player.frameAngle * Math.PI / 180);
      
      const suspensionBounce = Math.sin(raceTime * 10) * (Math.abs(player.speed) * 0.001);
      const accelerating = keys.ArrowUp || keys.KeyW;
      const braking = keys.ArrowDown || keys.KeyS;
      const accelerationSquat = accelerating ? -0.3 : braking ? 0.3 : 0;
      const totalVerticalOffset = suspensionBounce + accelerationSquat;
      
      ctx.translate(0, totalVerticalOffset);
      
      ctx.drawImage(bmp, -width / 2, -height / 2, width, height);
      ctx.restore();
    } else {
      ctx.fillStyle = '#FF2800';
      ctx.fillRect(carX - 35, carY - 20, 70, 40);
    }
  }, [currentFrame, framesBitmaps, keys.ArrowUp, keys.ArrowDown, keys.KeyW, keys.KeyS, raceTime]);

  // HUD RENDERING - APPLE STYLE
  const renderHUD = useCallback((ctx: CanvasRenderingContext2D) => {
    const player = gameStateRef.current.cars[0];
    
    // Apple-style HUD Container with glass morphism
    const hudWidth = 260;
    const hudHeight = 170;
    const hudX = 25;
    const hudY = 25;
    
    // Glass morphism background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(hudX, hudY, hudWidth, hudHeight, 16);
    ctx.fill();
    ctx.stroke();

    // Subtle inner glow
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(hudX + 1, hudY + 1, hudWidth - 2, hudHeight - 2, 14);
    ctx.stroke();

    // Header with Bebas Neue typography
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '600 16px "Bebas Neue", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('RACE DASHBOARD', hudX + hudWidth / 2, hudY + 28);
    ctx.textAlign = 'left';
    
    // Stats with Zalando Sans SemiExpanded
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '500 13px "Zalando Sans SemiExpanded", sans-serif';
    const leftColX = hudX + 25;
    const rightColX = hudX + 150;
    
    ctx.fillText(`LAP: ${player.lap + 1}/3`, leftColX, hudY + 50);
    
    const displaySpeed = Math.round(Math.abs(player.speed) * 1.8);
    ctx.fillText(`SPEED: ${displaySpeed} km/h`, leftColX, hudY + 68);
    ctx.fillText(`TIME: ${raceTime.toFixed(1)}s`, leftColX, hudY + 86);
    
    ctx.fillText(`TIRE: ${Math.round(player.tireLife)}%`, rightColX, hudY + 50);
    ctx.fillText(`HEALTH: ${Math.round(player.carLife)}%`, rightColX, hudY + 68);
    ctx.fillText(`DRIFT: ${(player.driftAmount * 100).toFixed(0)}%`, rightColX, hudY + 86);
    
    // Modern progress bars
    const barSpacing = 8;
    
    // Tire Life Bar
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '500 11px "Zalando Sans SemiExpanded", sans-serif';
    ctx.fillText('TIRE LIFE', leftColX, hudY + 105);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.roundRect(leftColX, hudY + 110, hudWidth - 50, 8, 4);
    ctx.fill();
    
    const tireColor = player.tireLife > 60 ? '#30D158' : player.tireLife > 30 ? '#FFD60A' : '#FF453A';
    ctx.fillStyle = tireColor;
    ctx.beginPath();
    ctx.roundRect(leftColX, hudY + 110, (player.tireLife / 100) * (hudWidth - 50), 8, 4);
    ctx.fill();
    
    // Car Health Bar
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText('CAR HEALTH', leftColX, hudY + 130);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.roundRect(leftColX, hudY + 135, hudWidth - 50, 8, 4);
    ctx.fill();
    
    const healthColor = player.carLife > 70 ? '#30D158' : player.carLife > 40 ? '#FFD60A' : '#FF453A';
    ctx.fillStyle = healthColor;
    ctx.beginPath();
    ctx.roundRect(leftColX, hudY + 135, (player.carLife / 100) * (hudWidth - 50), 8, 4);
    ctx.fill();
    
    // Grip indicator
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '600 12px "Zalando Sans SemiExpanded", sans-serif';
    ctx.fillText(`GRIP: ${(player.currentGrip * 100).toFixed(0)}%`, leftColX, hudY + 155);
    
    // Status indicators with modern colors
    if (!player.isOnRoad) {
      ctx.fillStyle = '#FF453A';
      ctx.font = '600 12px "Zalando Sans SemiExpanded", sans-serif';
      ctx.fillText('OFF-ROAD!', leftColX, hudY + 170);
    }
    
    if (player.speed < -10) {
      ctx.fillStyle = '#FF453A';
      ctx.font = '600 12px "Zalando Sans SemiExpanded", sans-serif';
      ctx.fillText('REVERSE!', rightColX, hudY + 170);
    }
  
    // Turbo indicator with modern glow
    if (keys.Shift && player.speed > 0) {
      ctx.fillStyle = '#007AFF';
      ctx.font = '600 15px "Bebas Neue", sans-serif';
      ctx.shadowColor = '#007AFF';
      ctx.shadowBlur = 15;
      ctx.fillText('TURBO ENGAGED!', VIEWPORT_WIDTH - 120, 35);
      ctx.shadowBlur = 0;
    }
    
    // Track info with modern styling
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '500 12px "Zalando Sans SemiExpanded", sans-serif';
    const trackType = builtTrack ? 'CUSTOM' : importedTrack ? 'IMPORTED' : 'DEFAULT';
    ctx.fillText(`TRACK: ${trackType}`, VIEWPORT_WIDTH - 130, VIEWPORT_HEIGHT - 25);
  
    // FPS counter
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '500 11px "Zalando Sans SemiExpanded", sans-serif';
    ctx.fillText(`FPS: ${fpsRef.current}`, VIEWPORT_WIDTH - 80, 25);
  }, [raceTime, keys.Shift, builtTrack, importedTrack]);

  const resetGame = useCallback(() => {
    setGameStarted(false);
    setCountdown(3);
    setRaceFinished(false);
    setRaceTime(0);
    setShowCompletionOverlay(false);
    
    gameStateRef.current.cars[0] = {
      ...gameStateRef.current.cars[0],
      x: 0, y: 0, z: 0,
      speed: 0, lap: 0, heading: 0,
      tireLife: 100, carLife: 100,
      weightTransfer: 0,
      slideFactor: 0,
    };
  }, []);

  // Handle race completion
  const handleRaceCompletion = useCallback(() => {
    setRaceFinished(true);
    setShowCompletionOverlay(true);
  }, []);

  // Handle button hover with tooltip positioning
  const handleButtonHover = useCallback((buttonId: string | null, event?: React.MouseEvent) => {
    setHoveredButton(buttonId);
    if (event && buttonId) {
      const rect = event.currentTarget.getBoundingClientRect();
      setButtonPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      });
    }
  }, []);

  // ========== EFFECTS ==========

  // Initialize track after assets are loaded
  useEffect(() => {
    if (isLoading || !roadPieceTemplateRef.current || !backgroundLoaded) return;

    const trackToLoad = importedTrack || builtTrack || generateSimpleTrack();
    buildTrack(trackToLoad);
  }, [isLoading, importedTrack, builtTrack, generateSimpleTrack, buildTrack, backgroundLoaded]);

  // Asset loading
  useEffect(() => {
    const loadAssets = async () => {
      try {
        console.log("📦 Loading assets...");
        
        const backgroundTexture = await loadBackgroundImage();
        
        try {
          const res = await fetch(DogKart);
          const buffer = await res.arrayBuffer();
          const gif = parseGIF(buffer);
          const frames = decompressFrames(gif, true);
          const bitmaps: ImageBitmap[] = [];
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (ctx) {
            for (const frame of frames) {
              const { dims, patch } = frame as any;
              canvas.width = dims.width; canvas.height = dims.height;
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              const imageData = new ImageData(new Uint8ClampedArray(patch), dims.width, dims.height);
              ctx.putImageData(imageData, dims.left, dims.top);
              bitmaps.push(await createImageBitmap(canvas));
            }
            setFramesBitmaps(bitmaps);
          }
        } catch {
          const canvas = document.createElement('canvas');
          canvas.width = 80; canvas.height = 40;
          const ctx = canvas.getContext('2d')!;
          ctx.fillStyle = '#FF2800';
          ctx.fillRect(10, 5, 60, 30);
          setFramesBitmaps([await createImageBitmap(canvas)]);
        }

        roadPieceTemplateRef.current = createFallbackRoadPiece();
        await initThreeJS(backgroundTexture as THREE.Texture);
        
        setLoadingProgress(100);
        setLoadingMessage("Ready!");
        setTimeout(() => {
          console.log("✅ All assets loaded");
          setIsLoading(false);
        }, 500);
      } catch (err) {
        console.error("❌ Loading failed:", err);
        roadPieceTemplateRef.current = createFallbackRoadPiece();
        initThreeJS(null);
        setIsLoading(false);
      }
    };
    loadAssets();
  }, [initThreeJS, createFallbackRoadPiece, loadBackgroundImage]);

  // Countdown
  useEffect(() => {
    if (!gameStarted && countdown > 0 && !isLoading) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setGameStarted(true);
            gameStateRef.current.gameStarted = true;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameStarted, countdown, isLoading]);

  // Input handling
  useEffect(() => {
    const handleKey = (e: KeyboardEvent, isDown: boolean) => {
      const validKeys = [
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Shift',
        'KeyW', 'KeyS', 'KeyA', 'KeyD'
      ];
      
      if (validKeys.includes(e.code)) {
        e.preventDefault();
        setKeys(prev => ({ ...prev, [e.code]: isDown }));
      }
      if ((e.key === 'b' || e.key === 'B') && isDown) setShowTrackBuilder(prev => !prev);
    };

    window.addEventListener('keydown', (e) => handleKey(e, true));
    window.addEventListener('keyup', (e) => handleKey(e, false));
    return () => {
      window.removeEventListener('keydown', (e) => handleKey(e, true));
      window.removeEventListener('keyup', (e) => handleKey(e, false));
    };
  }, []);

  // Game loop
  useEffect(() => {
    if (!gameStarted || raceFinished || isLoading) return;

    let lastTime = performance.now();

    const gameLoop = (currentTime: number) => {
      gameLoopIdRef.current = requestAnimationFrame(gameLoop);
      
      const deltaTime = Math.min(0.033, (currentTime - lastTime) / 1000);
      lastTime = currentTime;
    
      if (deltaTime > 0.1) return;

      const state = gameStateRef.current;
      const player = state.cars[0];
      
      if (state.roadSegments.length === 0) return;

      const segIndex = Math.floor(player.z / state.segmentLength) % state.roadSegments.length;
      const segment = state.roadSegments[segIndex];
      if (!segment) return;

      // DUAL CONTROLS
      let steerInput = 0;
      if (keys.ArrowRight || keys.KeyD) steerInput = -1;
      if (keys.ArrowLeft || keys.KeyA) steerInput = 1;

      const accelerating = keys.ArrowUp || keys.KeyW;
      const braking = keys.ArrowDown || keys.KeyS;
      
      // ENHANCED TIRE WEAR FOR KART FEEL
      if (Math.abs(player.speed) > 10) {
        const lateralWear = Math.abs(steerInput) * deltaTime * 0.4 * 1.1;
        const speedWear = Math.abs(player.speed) * deltaTime * 0.0008;
        const driftWear = player.driftAmount * deltaTime * 0.8 * 1.1;
        const slideWear = player.slideFactor * deltaTime * 0.3;
        
        player.tireLife -= (lateralWear + speedWear + driftWear + slideWear);
        player.tireLife = Math.max(0, player.tireLife);
      }
      
      const speedFactor = Math.abs(player.speed) / player.maxSpeed;
      player.driftAmount = Math.abs(steerInput) * speedFactor * (1 - player.currentGrip) * 0.7;
      
      player.currentGrip = 0.92 * (player.tireLife / 100) * 
                          (1 - speedFactor * 0.25) *
                          (player.isOnRoad ? 1 : 0.6);

      updateTireParticles(player, deltaTime);
      setCurrentFrame(getSpriteFrame(steerInput, player.speed, player.driftAmount));

      if (segIndex < state.roadSegments.length - 1) {
        const nextSeg = state.roadSegments[segIndex + 1];
        const dx = nextSeg.worldX - segment.worldX;
        const dz = nextSeg.worldZ - segment.worldZ;
        player.heading = Math.atan2(dx, dz);
      }

      // FIXED TURBO SYSTEM
      if (accelerating) {
        const turboBoost = keys.Shift ? 1.8 : 1.0;
        const maxSpeedBoost = keys.Shift ? 1.5 : 1.0;
        
        const accelerationMultiplier = Math.max(0.5, 1 - speedFactor * 0.4);
        player.speed = Math.min(
          player.speed + player.acceleration * deltaTime * turboBoost * accelerationMultiplier, 
          player.maxSpeed * maxSpeedBoost
        );
      } else if (braking) {
        if (player.speed > 0) {
          player.speed = Math.max(player.speed - player.acceleration * 4.0 * deltaTime, 0);
        } else {
          player.speed = Math.max(player.speed - player.acceleration * 1.5 * deltaTime, -player.maxSpeed * 0.3);
        }
      } else {
        const dragForce = 40 + (Math.abs(player.speed) * 0.05);
        if (player.speed > 0) {
          player.speed = Math.max(player.speed - dragForce * deltaTime, 0);
        } else if (player.speed < 0) {
          player.speed = Math.min(player.speed + dragForce * deltaTime, 0);
        }
      }

      // STEERING PHYSICS
      if (Math.abs(player.speed) > 0.1) {
        player.lastSteerInput = steerInput;
        
        const speedFactor = Math.abs(player.speed) / player.maxSpeed;
        const steeringResponse = Math.max(0.3, 1 - speedFactor * 0.7);
        const baseSteering = steerInput * player.handling * deltaTime * steeringResponse;
        
        player.weightTransfer = -steerInput * speedFactor * 2;
        player.frameAngle = -steerInput * 2;
        
        const slideIntensity = speedFactor * (1 - player.currentGrip) * 2.5;
        player.slideFactor = Math.min(1, slideIntensity);
        
        const maxCurveInfluence = 0.0001;
        const curveInfluence = segment.curve * maxCurveInfluence * player.speed * deltaTime;
        
        const driftMomentum = player.lastSteerInput * player.driftAmount * 0.6;
        
        const totalMovement = (baseSteering + curveInfluence + driftMomentum) * 
                             player.currentGrip * (1 - player.slideFactor * 0.3);
        
        player.x += totalMovement * 220;
      }

      // ROAD BOUNDARIES
      const halfRoadWidth = segment.width / 2;
      const carHalfWidth = CAR_WIDTH / 2;
      
      const leftEdge = segment.worldX - halfRoadWidth + carHalfWidth;
      const rightEdge = segment.worldX + halfRoadWidth - carHalfWidth;
      
      if (player.x < leftEdge) {
        const overshoot = leftEdge - player.x;
        player.x += overshoot * 0.1;
        player.speed *= 0.95;
        player.carLife -= 0.05;
        player.isOnRoad = false;
      } else if (player.x > rightEdge) {
        const overshoot = player.x - rightEdge;
        player.x -= overshoot * 0.1;
        player.speed *= 0.95;
        player.carLife -= 0.05;
        player.isOnRoad = false;
      } else {
        player.isOnRoad = true;
      }

      // FORWARD MOVEMENT WITH TURBO BOOST
      const baseSpeedMultiplier = 2.2;
      const movementBoost = keys.Shift ? 1.2 : 1.0;
      player.z += player.speed * deltaTime * baseSpeedMultiplier * movementBoost;

      if (player.z >= state.trackLength && player.speed > 0) {
        player.lap += 1;
        player.z = 0;
        if (player.lap >= 3) {
          handleRaceCompletion();
        }
      } else if (player.z < 0 && player.speed < 0) {
        player.z = Math.max(player.z, -100);
      }

      state.raceTime += deltaTime;
      setRaceTime(state.raceTime);
      updateThreeJSCamera();
      onStateUpdate?.({ heading: player.heading, speed: player.speed });
    };

    gameLoopIdRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(gameLoopIdRef.current);
  }, [gameStarted, raceFinished, isLoading, keys, updateTireParticles, getSpriteFrame, updateThreeJSCamera, onStateUpdate, handleRaceCompletion]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();
    
    const renderLoop = (currentTime: number) => {
      renderLoopIdRef.current = requestAnimationFrame(renderLoop);
      
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      
      frameCountRef.current++;
      if (currentTime - lastRenderTimeRef.current >= 1000) {
        fpsRef.current = Math.round((frameCountRef.current * 1000) / (currentTime - lastRenderTimeRef.current));
        frameCountRef.current = 0;
        lastRenderTimeRef.current = currentTime;
      }

      ctx.clearRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      
      if (gameStateRef.current.roadSegments.length > 0) {
        drawPlayerKart(ctx);
        renderTireParticles(ctx);
        renderHUD(ctx);
      }
      
      if (isLoading) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
        ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '600 26px "Bebas Neue", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(loadingMessage, VIEWPORT_WIDTH / 2, VIEWPORT_HEIGHT / 2 - 50);
        ctx.fillText(`${loadingProgress}%`, VIEWPORT_WIDTH / 2, VIEWPORT_HEIGHT / 2 + 50);
        
        // Draw loading logo
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '500 18px "Zalando Sans SemiExpanded", sans-serif';
        ctx.fillText('MINIRACER', VIEWPORT_WIDTH / 2, VIEWPORT_HEIGHT / 2 + 90);
      } else if (!gameStarted) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
        ctx.fillStyle = countdown > 0 ? '#FFFFFF' : '#FF453A';
        ctx.font = '700 72px "Bebas Neue", sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = countdown > 0 ? '#FFFFFF' : '#FF453A';
        ctx.shadowBlur = 25;
        ctx.fillText(countdown > 0 ? String(countdown) : 'GO!', VIEWPORT_WIDTH / 2, VIEWPORT_HEIGHT / 2);
        ctx.shadowBlur = 0;
      }
    };
    
    renderLoopIdRef.current = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(renderLoopIdRef.current);
  }, [isLoading, gameStarted, countdown, loadingMessage, loadingProgress, drawPlayerKart, renderTireParticles, renderHUD]);

  // Cleanup
  useEffect(() => {
    return () => {
      cancelAnimationFrame(gameLoopIdRef.current);
      cancelAnimationFrame(renderLoopIdRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-black p-6 relative overflow-hidden">
      {/* Add Google Fonts */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Sixtyfour&family=Zalando+Sans+SemiExpanded:wght@200..900&display=swap');
          
          /* Custom animations */
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          
          .float-animation {
            animation: float 3s ease-in-out infinite;
          }
        `}
      </style>
      
      {/* Main Container - Apple Style */}
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
{/* Race Completion Overlay - Ferrari Style */}
{showCompletionOverlay && (
  <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80 backdrop-blur-xl">
    <div className="text-center rounded-3xl p-10 shadow-2xl max-w-md w-full mx-4 relative overflow-hidden border border-red-500/50">
      {/* Main gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-700 via-red-700 to-gray-800 rounded-3xl"></div>
      
      {/* Red to gray accent glow - now as an overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-gray-700/10 rounded-3xl pointer-events-none"></div>
      
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.1)_1px,_transparent_0)] bg-[length:4px_4px] pointer-events-none"></div>
      
      <div className="w-36 h-36 mx-auto mb-8 relative z-10 float-animation">
        <Lottie 
          animationData={racingFlagAnimation}
          loop={true}
          autoplay={true}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      
      <h2 className="text-5xl font-black text-white font-['Bebas Neue'] mb-6 tracking-wider relative z-10">
        RACE COMPLETED!
      </h2>
      
      <p className="text-3xl font-bold text-white mb-4 font-['Bebas Neue'] relative z-10 tracking-wider">
        {raceTime.toFixed(2)}s
      </p>
      
      <p className="text-lg text-white mb-8 font-['Zalando Sans SemiExpanded'] relative z-10 font-medium">
        Outstanding Performance! 🏆
      </p>
      
      {/* Ferrari Red Button */}
      <button
        onClick={() => {
          setShowCompletionOverlay(false);
          resetGame();
        }}
        className="bg-gradient-to-r from-red-600 to-red-700 hover:from-white hover:to-red-100 text-white hover:text-red-700 font-semibold py-4 px-12 rounded-2xl text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl font-['Zalando Sans SemiExpanded'] border border-red-500/50 hover:border-red-300 relative z-10 tracking-wide group"
        style={{ transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        <span className="group-hover:tracking-widest transition-all duration-300">
          Race Again
        </span>
      </button>
    </div>
  </div>
)}

        {/* Loading Overlay - Apple Style */}
        {isLoading && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black">
            <div className="text-center">
              <img 
                src={LoadingLogo} 
                alt="Loading" 
                className="mx-auto mb-8 w-24 h-24 float-animation"
                style={{ filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.3))' }}
              />
              <div className="mt-6">
                <p className="text-2xl text-white font-['Bebas Neue'] mb-4 tracking-wider">
                  {loadingMessage}
                </p>
                <div className="w-48 h-2 bg-white/10 rounded-full mx-auto overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
                </div>
                <p className="text-3xl text-white font-['Bebas Neue'] mt-4 tracking-wider">
                  {loadingProgress}%
                </p>
              </div>
            </div>
          </div>
        )}

{/* Tooltip - White Style */}
{hoveredButton && (
  <div 
    className="fixed z-50 bg-white backdrop-blur-xl text-gray-800 px-5 py-4 rounded-2xl border border-gray-200 shadow-2xl max-w-xs transform transition-all duration-300 ease-out font-['Zalando Sans SemiExpanded']"
    style={{
      left: `${buttonPosition.x}px`,
      top: `${buttonPosition.y}px`,
      transform: 'translate(-50%, -100%)',
    }}
  >
    {/* White background */}
    <div className="absolute inset-0 bg-white rounded-2xl"></div>
    
    {/* Subtle gray accent */}
    <div className="absolute inset-0 bg-gradient-to-r from-gray-100/50 to-gray-200/30 rounded-2xl pointer-events-none"></div>
    
    {/* Subtle pattern overlay */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(0,0,0,0.05)_1px,_transparent_0)] bg-[length:4px_4px] pointer-events-none"></div>
    
    <div className="text-center relative z-10">
      <p className="text-gray-800 font-['Zalando Sans SemiExpanded'] text-sm leading-tight tracking-wide font-medium">
        {buttonConfig[hoveredButton as keyof typeof buttonConfig]?.description}
      </p>
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 w-3 h-3 bg-white rotate-45 border-r border-b border-gray-200"></div>
    </div>
  </div>
)}

        {/* Track Builder Modal - Apple Style */}
        {showTrackBuilder && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-6 backdrop-blur-xl">
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl border border-white/10 shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex-1 overflow-auto">
                <TrackBuilder 
                  onBuild={handleTrackBuilt} 
                  roadPieceTemplate={roadPieceTemplateRef.current} 
                />
              </div>
              <div className="p-8 border-t border-white/10 bg-black/50">
                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowTrackBuilder(false)} 
                    className="flex-1 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white font-semibold px-8 py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl font-['Zalando Sans SemiExpanded'] border border-white/10 tracking-wide"
                  >
                    Close Builder
                  </button>
                  {builtTrack && (
                    <button 
                      onClick={() => {
                        setShowTrackBuilder(false);
                        buildTrack(builtTrack);
                        resetGame();
                      }}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-400 hover:from-green-600 hover:to-emerald-500 text-white font-semibold px-8 py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl font-['Zalando Sans SemiExpanded'] border border-white/20 tracking-wide"
                    >
                      Race This Track
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Game Container - Apple Style */}
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-8 shadow-2xl border border-white/10 w-full backdrop-blur-sm">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-4xl font-black font-['Bebas Neue'] tracking-wider text-white">
              🏎️ <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">MINIRACER</span>
            </h2>
            <div className="flex gap-4">
{/* Action Buttons - Smaller and Squared */}
{['builder', 'default', 'restart', 'exit'].map((buttonId) => (
  <button 
    key={buttonId}
    onMouseEnter={(e) => handleButtonHover(buttonId, e)}
    onMouseLeave={() => handleButtonHover(null)}
    onClick={() => {
      if (buttonId === 'builder') setShowTrackBuilder(true);
      else if (buttonId === 'default') {
        const defaultTrack = generateSimpleTrack();
        setBuiltTrack(null);
        buildTrack(defaultTrack);
        resetGame();
      }
      else if (buttonId === 'restart') resetGame();
      else if (buttonId === 'exit') onClose();
    }} 
    className="w-12 h-12 rounded-2xl transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-xl border border-red-500/50 font-['Zalando Sans SemiExpanded'] flex items-center justify-center relative overflow-hidden group"
    style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
  >
    {/* Main gradient background */}
    <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700 group-hover:from-white group-hover:to-red-100 rounded-2xl transition-all duration-300"></div>
    
    {/* Red to gray accent glow on hover */}
    <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 group-hover:from-red-600/20 group-hover:to-gray-700/10 rounded-2xl pointer-events-none transition-all duration-300"></div>
    
    {/* Icon with color change on hover */}
    <img 
      src={buttonConfig[buttonId as keyof typeof buttonConfig]?.icon} 
      alt={buttonConfig[buttonId as keyof typeof buttonConfig]?.label}
      className="w-6 h-6 relative z-10 filter brightness-0 invert group-hover:brightness-0 group-hover:invert-0 transition-all duration-300"
    />
  </button>
))}
            </div>
          </div>

          {/* Game Canvas Container - Apple Style */}
          <div className="relative bg-black rounded-2xl p-3 shadow-inner mx-auto border border-white/5" 
               style={{ 
                 width: '100%', 
                 height: 'auto', 
                 aspectRatio: `${VIEWPORT_WIDTH}/${VIEWPORT_HEIGHT}`,
                 maxWidth: '800px'
               }}>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-cyan-400/5 pointer-events-none"></div>
            <canvas 
              ref={threeCanvasRef} 
              width={VIEWPORT_WIDTH} 
              height={VIEWPORT_HEIGHT} 
              className="absolute top-0 left-0 w-full h-full rounded-xl" 
            />
            <canvas 
              ref={canvasRef} 
              width={VIEWPORT_WIDTH} 
              height={VIEWPORT_HEIGHT} 
              className="absolute top-0 left-0 w-full h-full rounded-xl z-10" 
            />
          </div>

          {/* Footer - Apple Style */}
          <div className="mt-6 text-center">
            <p className="text-white text-sm font-medium tracking-wide font-['Zalando Sans SemiExpanded'] uppercase bg-white/5 rounded-full py-2 px-6 inline-block">
              {isLoading ? `${loadingMessage} ${loadingProgress}%` : 
               !gameStarted ? `Get ready! ${countdown > 0 ? countdown : 'GO!'}` : 
               `Racing! | Arrow Keys/WASD + Shift | B: Builder`}
            </p>
            <div className="mt-4 flex justify-center gap-8 text-xs text-gray-400 font-['Zalando Sans SemiExpanded'] uppercase">
              <span className="bg-white/5 rounded-full px-4 py-2">🎮 WASD / Arrow Keys</span>
              <span className="bg-white/5 rounded-full px-4 py-2">🚀 Shift = Turbo</span>
              <span className="bg-white/5 rounded-full px-4 py-2">🛠️ B = Builder</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}