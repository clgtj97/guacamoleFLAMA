import React, { useState, useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import './gameOne.css';

interface TrackSegment {
  worldX: number;
  worldY: number;
  worldZ: number;
  curve: number;
  hill: number;
  bank: number;
  friction: number;
  sprite: number;
  width: number;
}

interface TrackBuilderProps {
  onBuild: (segments: TrackSegment[]) => void;
  roadPieceTemplate?: THREE.Group;
  builtTrack?: TrackSegment[] | null;
}

const TrackBuilder: React.FC<TrackBuilderProps> = ({ onBuild, roadPieceTemplate, builtTrack }) => {
  const [segments, setSegments] = useState<TrackSegment[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Three.js refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const trackGroupRef = useRef<THREE.Group | null>(null);
  const roadPiecesRef = useRef<THREE.Group[]>([]);
  const selectionHelperRef = useRef<THREE.Group | null>(null);
  
  // Camera orbit controls
  const cameraStateRef = useRef({
    isMouseDown: false,
    mouseX: 0,
    mouseY: 0,
    targetX: 0,
    targetY: 0,
    targetZ: 0,
    distance: 800,
    angleX: Math.PI / 4,
    angleY: Math.PI / 4
  });

  // Editor state
  const [cameraMode, setCameraMode] = useState<'orbit' | 'top'>('orbit');
  const [gridVisible, setGridVisible] = useState(true);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // FULLY RESPONSIVE canvas sizing
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current && canvasRef.current.parentElement) {
        const parent = canvasRef.current.parentElement;
        const width = parent.clientWidth - 32;
        const height = Math.max(400, window.innerHeight - 200);
        
        setCanvasSize({ width, height });
        
        if (rendererRef.current && cameraRef.current) {
          rendererRef.current.setSize(width, height);
          cameraRef.current.aspect = width / height;
          cameraRef.current.updateProjectionMatrix();
        }
      }
    };

    updateCanvasSize();
    
    const resizeObserver = new ResizeObserver(updateCanvasSize);
    if (canvasRef.current?.parentElement) {
      resizeObserver.observe(canvasRef.current.parentElement);
    }
    
    window.addEventListener('resize', updateCanvasSize);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);

  // Initialize Three.js scene
  const initThreeJS = useCallback(() => {
    if (!canvasRef.current) return;

    // Scene with modern gradient background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1f2e);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, canvasSize.width / canvasSize.height, 0.1, 10000);
    cameraRef.current = camera;
    updateCameraPosition();

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current,
      antialias: true,
      alpha: true
    });
    renderer.setSize(canvasSize.width, canvasSize.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Modern lighting setup
    const ambientLight = new THREE.AmbientLight(0x404060, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xfff0e0, 0.8);
    directionalLight.position.set(100, 500, 200);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Accent light
    const accentLight = new THREE.PointLight(0x4a90e2, 0.3, 1000);
    accentLight.position.set(-200, 300, -200);
    scene.add(accentLight);

    // Grid helper with modern colors
    const gridHelper = new THREE.GridHelper(2000, 20, 0x4a5568, 0x2d3748);
    gridHelper.visible = gridVisible;
    scene.add(gridHelper);

    // Track group
    const trackGroup = new THREE.Group();
    scene.add(trackGroup);
    trackGroupRef.current = trackGroup;

    // Selection helper
    const selectionGeometry = new THREE.BoxGeometry(50, 50, 50);
    const selectionMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00ff88, 
      wireframe: true 
    });
    const selectionHelper = new THREE.Mesh(selectionGeometry, selectionMaterial);
    selectionHelper.visible = false;
    scene.add(selectionHelper);
    selectionHelperRef.current = selectionHelper;

    // Ground plane with modern texture
    const groundGeometry = new THREE.PlaneGeometry(5000, 5000);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2d5a3d,
      roughness: 0.8,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -10;
    ground.receiveShadow = true;
    scene.add(ground);

    console.log("✅ 3D Track Builder initialized - BLANK CANVAS");
  }, [gridVisible, canvasSize]);

  // Update camera position
  const updateCameraPosition = useCallback(() => {
    if (!cameraRef.current) return;

    const state = cameraStateRef.current;
    
    const x = state.targetX + state.distance * Math.cos(state.angleX) * Math.sin(state.angleY);
    const y = state.targetY + state.distance * Math.sin(state.angleX);
    const z = state.targetZ + state.distance * Math.cos(state.angleX) * Math.cos(state.angleY);

    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(state.targetX, state.targetY, state.targetZ);
  }, []);

  // Create road piece with modern styling
  const createEditorRoadPiece = useCallback((): THREE.Group => {
    const roadGroup = new THREE.Group();
    
    // Main road surface with modern asphalt
    const roadGeometry = new THREE.PlaneGeometry(200, 200);
    roadGeometry.rotateX(-Math.PI / 2);
    const roadMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x1a1a1a,
      roughness: 0.9,
      metalness: 0.05
    });
    const roadMesh = new THREE.Mesh(roadGeometry, roadMaterial);
    roadMesh.receiveShadow = true;
    roadMesh.position.y = 0;
    roadGroup.add(roadMesh);

    // Road markings with glow effect
    const markingGeometry = new THREE.PlaneGeometry(80, 5);
    markingGeometry.rotateX(-Math.PI / 2);
    const markingMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xfff8a5,
      emissive: 0x443300,
      emissiveIntensity: 0.3
    });
    
    const centerMarking = new THREE.Mesh(markingGeometry, markingMaterial);
    centerMarking.position.set(0, 0.1, 0);
    roadGroup.add(centerMarking);

    // Modern curbs
    const curbGeometry = new THREE.BoxGeometry(10, 5, 200);
    const curbMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xdc2626,
      roughness: 0.7,
      metalness: 0.2
    });

    const leftCurb = new THREE.Mesh(curbGeometry, curbMaterial);
    leftCurb.position.set(-105, 2.5, 0);
    roadGroup.add(leftCurb);

    const rightCurb = new THREE.Mesh(curbGeometry, curbMaterial);
    rightCurb.position.set(105, 2.5, 0);
    roadGroup.add(rightCurb);

    return roadGroup;
  }, []);

  // START WITH BLANK CANVAS
  const startBlank = useCallback(() => {
    setSegments([]);
    setSelectedSegment(null);
    console.log("🆕 Starting with blank canvas");
  }, []);

  // Create a simple starter track
  const createStarterTrack = useCallback(() => {
    const starterSegments: TrackSegment[] = [
      { worldX: 0, worldY: 0, worldZ: 0, curve: 0, hill: 0, bank: 0, friction: 0.98, sprite: 0, width: 200 },
      { worldX: 200, worldY: 0, worldZ: 0, curve: 0, hill: 0, bank: 0, friction: 0.98, sprite: 0, width: 200 },
      { worldX: 200, worldY: 0, worldZ: 200, curve: 50, hill: 0, bank: 0, friction: 0.98, sprite: 0, width: 200 },
      { worldX: 0, worldY: 0, worldZ: 200, curve: -50, hill: 0, bank: 0, friction: 0.98, sprite: 0, width: 200 },
    ];
    setSegments(starterSegments);
    setSelectedSegment(0);
  }, []);

  // Render track with proper connections
  const renderTrack3D = useCallback(() => {
    if (!trackGroupRef.current) return;

    trackGroupRef.current.clear();
    roadPiecesRef.current = [];

    const roadPiece = roadPieceTemplate || createEditorRoadPiece();

    segments.forEach((segment, index) => {
      const roadPieceClone = roadPiece.clone();
      
      // Position
      roadPieceClone.position.set(segment.worldX, 0, segment.worldZ);
      
      // Calculate direction for proper rotation
      let direction = 0;
      if (index < segments.length - 1) {
        const nextSegment = segments[index + 1];
        direction = Math.atan2(
          nextSegment.worldZ - segment.worldZ,
          nextSegment.worldX - segment.worldX
        );
      } else if (segments.length > 1) {
        const firstSegment = segments[0];
        direction = Math.atan2(
          firstSegment.worldZ - segment.worldZ,
          firstSegment.worldX - segment.worldX
        );
      }
      
      roadPieceClone.rotation.y = direction + (segment.curve * 0.001);
      roadPieceClone.rotation.z = 0;
      
      // Scale
      const scale = segment.width / 200;
      roadPieceClone.scale.set(scale, 1, 1);
      
      // Add click detection
      roadPieceClone.userData = { segmentIndex: index };
      
      // Highlight if selected
      if (index === selectedSegment) {
        roadPieceClone.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (Array.isArray(child.material)) {
              child.material.forEach(material => {
                if (material instanceof THREE.MeshStandardMaterial) {
                  material.emissive = new THREE.Color(0x4a90e2);
                  material.emissiveIntensity = 0.3;
                }
              });
            } else if (child.material instanceof THREE.MeshStandardMaterial) {
              child.material.emissive = new THREE.Color(0x4a90e2);
              child.material.emissiveIntensity = 0.3;
            }
          }
        });
      }
      
      // Enable shadows
      roadPieceClone.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      trackGroupRef.current!.add(roadPieceClone);
      roadPiecesRef.current.push(roadPieceClone);
    });

    // Update selection helper
    if (selectedSegment !== null && segments[selectedSegment]) {
      const seg = segments[selectedSegment];
      selectionHelperRef.current!.position.set(seg.worldX, 30, seg.worldZ);
      selectionHelperRef.current!.visible = true;
    } else {
      selectionHelperRef.current!.visible = false;
    }
  }, [segments, selectedSegment, roadPieceTemplate, createEditorRoadPiece]);

  // Mouse event handlers
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    if (rendererRef.current && cameraRef.current && sceneRef.current) {
      const mouse = new THREE.Vector2(
        (mouseX / rect.width) * 2 - 1,
        -(mouseY / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);

      const intersects = raycaster.intersectObjects(roadPiecesRef.current, true);
      
      if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        let segmentIndex: number | null = null;
        
        let currentObject: THREE.Object3D | null = clickedObject;
        while (currentObject && segmentIndex === null) {
          if (currentObject.userData.segmentIndex !== undefined) {
            segmentIndex = currentObject.userData.segmentIndex;
          }
          currentObject = currentObject.parent;
        }
        
        if (segmentIndex !== null) {
          setSelectedSegment(segmentIndex);
          setIsDragging(true);
          return;
        }
      }
    }

    cameraStateRef.current.isMouseDown = true;
    cameraStateRef.current.mouseX = mouseX;
    cameraStateRef.current.mouseY = mouseY;
  }, []);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
  
    const state = cameraStateRef.current;
  
    if (state.isMouseDown) {
      const deltaX = mouseX - state.mouseX;
      const deltaY = mouseY - state.mouseY;
  
      state.angleY -= deltaX * 0.01;
      state.angleX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, state.angleX - deltaY * 0.01));
  
      state.mouseX = mouseX;
      state.mouseY = mouseY;
  
      updateCameraPosition();
    } else if (isDragging && selectedSegment !== null && cameraRef.current) {
      const mouse = new THREE.Vector2(
        (mouseX / rect.width) * 2 - 1,
        -(mouseY / rect.height) * 2 + 1
      );
  
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);
      
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersection = new THREE.Vector3();
      
      if (raycaster.ray.intersectPlane(plane, intersection)) {
        setSegments(prev => {
          const newSegments = [...prev];
          newSegments[selectedSegment] = {
            ...newSegments[selectedSegment],
            worldX: intersection.x,
            worldZ: intersection.z,
            worldY: 0
          };
          return newSegments;
        });
      }
    }
  }, [isDragging, selectedSegment, updateCameraPosition]);

  const handleMouseUp = useCallback(() => {
    cameraStateRef.current.isMouseDown = false;
    setIsDragging(false);
  }, []);

  // Mouse wheel for zoom
  const handleWheel = useCallback((event: React.WheelEvent<HTMLCanvasElement>) => {
    cameraStateRef.current.distance = Math.max(200, Math.min(2000, 
      cameraStateRef.current.distance + event.deltaY * 0.1
    ));
    updateCameraPosition();
  }, [updateCameraPosition]);

  // Add new segment with proper positioning
  const addSegment = useCallback(() => {
    let newX = 0;
    let newZ = 0;
    
    if (segments.length > 0) {
      const lastSegment = segments[segments.length - 1];
      newX = lastSegment.worldX + 150;
      newZ = lastSegment.worldZ;
    }
    
    const newSegment: TrackSegment = {
      worldX: newX,
      worldY: 0,
      worldZ: newZ,
      curve: 0,
      hill: 0,
      bank: 0,
      friction: 0.98,
      sprite: 0,
      width: 200
    };
    
    setSegments(prev => [...prev, newSegment]);
    setSelectedSegment(segments.length);
  }, [segments]);

  // Delete selected segment
  const deleteSegment = useCallback(() => {
    if (selectedSegment === null) return;
    setSegments(prev => prev.filter((_, index) => index !== selectedSegment));
    setSelectedSegment(null);
  }, [selectedSegment]);

  // Update segment property
  const updateSegmentProperty = useCallback((property: keyof TrackSegment, value: number) => {
    if (selectedSegment === null) return;
    
    setSegments(prev => {
      const newSegments = [...prev];
      newSegments[selectedSegment] = {
        ...newSegments[selectedSegment],
        [property]: value,
        ...(property === 'worldX' || property === 'worldZ' ? { worldY: 0 } : {}),
        ...(property === 'hill' ? { hill: 0 } : {}),
        ...(property === 'bank' ? { bank: 0 } : {})
      };
      return newSegments;
    });
  }, [selectedSegment]);

  // Camera controls
  const switchCamera = useCallback((mode: 'orbit' | 'top') => {
    setCameraMode(mode);
    
    if (mode === 'top') {
      cameraStateRef.current.angleX = Math.PI / 2;
      cameraStateRef.current.angleY = 0;
      cameraStateRef.current.distance = 1000;
    } else {
      cameraStateRef.current.angleX = Math.PI / 4;
      cameraStateRef.current.angleY = Math.PI / 4;
      cameraStateRef.current.distance = 800;
    }
    
    updateCameraPosition();
  }, [updateCameraPosition]);

  const resetCamera = useCallback(() => {
    cameraStateRef.current = {
      isMouseDown: false,
      mouseX: 0,
      mouseY: 0,
      targetX: 0,
      targetY: 0,
      targetZ: 0,
      distance: 800,
      angleX: Math.PI / 4,
      angleY: Math.PI / 4
    };
    updateCameraPosition();
  }, [updateCameraPosition]);

  // Build track with validation
  const handleBuildTrack = useCallback(() => {
    if (segments.length < 3) {
      alert("Need at least 3 segments to build a track!");
      return;
    }
    
    console.log("🏁 Building track with", segments.length, "segments");
    
    const validatedSegments = segments.map(segment => ({
      ...segment,
      worldY: 0
    }));
    
    onBuild(validatedSegments);
  }, [segments, onBuild]);

  // Clear entire track
  const clearTrack = useCallback(() => {
    if (window.confirm("Are you sure you want to clear the entire track?")) {
      setSegments([]);
      setSelectedSegment(null);
    }
  }, []);

  // Animation loop
  useEffect(() => {
    let animationFrameId: number;
    
    const animate = () => {
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Initialize on mount - START BLANK
  useEffect(() => {
    initThreeJS();
    console.log("🎯 Starting with blank canvas - no pre-built track");
  }, [initThreeJS]);

  // Re-render track when segments change
  useEffect(() => {
    renderTrack3D();
  }, [renderTrack3D]);

  // Reset to blank when builtTrack becomes null
  useEffect(() => {
    if (builtTrack === null) {
      startBlank();
    }
  }, [builtTrack, startBlank]);

  return (
    <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl w-full h-full flex flex-col border border-slate-700 shadow-2xl">
      {/* Header with beta badge */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            🏁 3D Track Builder
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-xs font-bold rounded-full uppercase tracking-wide">
              Beta
            </span>
            <span className="text-slate-400 text-sm">Start from scratch</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{segments.length}</div>
          <div className="text-slate-400 text-sm">Segments</div>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* 3D Canvas */}
        <div className="flex-1 min-w-0 min-h-400px bg-slate-950 rounded-xl overflow-hidden border border-slate-700 shadow-inner">
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            className="w-full h-full cursor-move"
            style={{ 
              width: '100%', 
              height: '100%',
              display: 'block'
            }}
          />
        </div>

        {/* Modern Controls Panel */}
        <div className="w-full lg:w-96 space-y-4 min-w-0 overflow-y-auto max-h-full custom-scrollbar">
          {/* Quick Start Options */}
          <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl border border-slate-700">
            <h4 className="font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-cyan-400">🚀</span>
              Quick Start
            </h4>
            <div className="space-y-2">
              <button
                onClick={startBlank}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
              >
                🆕 Start Blank Canvas
              </button>
              <button
                onClick={createStarterTrack}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-emerald-500/25"
              >
                📐 Simple Starter Track
              </button>
              <button
                onClick={clearTrack}
                disabled={segments.length === 0}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-slate-600 disabled:to-slate-700 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-red-500/25 disabled:shadow-none"
              >
                🗑️ Clear Entire Track
              </button>
            </div>
          </div>

          {/* Camera & View Controls */}
          <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl border border-slate-700">
            <h4 className="font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-purple-400">🎥</span>
              Camera Controls
            </h4>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={() => switchCamera('orbit')}
                className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  cameraMode === 'orbit' 
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/25' 
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                }`}
              >
                3D Orbit
              </button>
              <button
                onClick={() => switchCamera('top')}
                className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  cameraMode === 'top' 
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/25' 
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                }`}
              >
                Top Down
              </button>
            </div>
            <button
              onClick={resetCamera}
              className="w-full bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-violet-500/25 mb-3"
            >
              🔄 Reset Camera
            </button>
            <label className="flex items-center text-slate-300 bg-slate-700/30 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-600/30 transition-colors">
              <input
                type="checkbox"
                checked={gridVisible}
                onChange={(e) => setGridVisible(e.target.checked)}
                className="mr-3 w-4 h-4 text-cyan-500 bg-slate-600 border-slate-500 rounded focus:ring-cyan-500 focus:ring-2"
              />
              Show Grid Helper
            </label>
          </div>

          {/* Track Actions */}
          <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl border border-slate-700">
            <h4 className="font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-orange-400">🛠️</span>
              Track Actions
            </h4>
            <div className="space-y-2">
              <button
                onClick={addSegment}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-green-500/25"
              >
                ➕ Add New Segment
              </button>
              <button
                onClick={deleteSegment}
                disabled={selectedSegment === null}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-slate-600 disabled:to-slate-700 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-red-500/25 disabled:shadow-none"
              >
                🗑️ Delete Selected
              </button>
              <button
                onClick={handleBuildTrack}
                disabled={segments.length < 3}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-700 text-white px-4 py-4 rounded-lg font-bold text-lg transition-all duration-200 shadow-xl hover:shadow-cyan-500/25 disabled:shadow-none transform hover:scale-105 disabled:transform-none"
              >
                🏁 BUILD & RACE TRACK
              </button>
            </div>
          </div>

          {/* Segment Properties */}
          {selectedSegment !== null && segments[selectedSegment] && (
            <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl border border-slate-700">
              <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                <span className="text-yellow-400">⚙️</span>
                Segment {selectedSegment} Properties
              </h4>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-300">Position X</span>
                    <span className="text-cyan-400 font-mono">{Math.round(segments[selectedSegment].worldX)}</span>
                  </div>
                  <input
                    type="range"
                    min="-1000"
                    max="1000"
                    value={segments[selectedSegment].worldX}
                    onChange={(e) => updateSegmentProperty('worldX', Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-300">Position Z</span>
                    <span className="text-cyan-400 font-mono">{Math.round(segments[selectedSegment].worldZ)}</span>
                  </div>
                  <input
                    type="range"
                    min="-1000"
                    max="1000"
                    value={segments[selectedSegment].worldZ}
                    onChange={(e) => updateSegmentProperty('worldZ', Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-300">Curve</span>
                    <span className="text-cyan-400 font-mono">{segments[selectedSegment].curve}</span>
                  </div>
                  <input
                    type="range"
                    min="-300"
                    max="300"
                    value={segments[selectedSegment].curve}
                    onChange={(e) => updateSegmentProperty('curve', Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-300">Width</span>
                    <span className="text-cyan-400 font-mono">{segments[selectedSegment].width}</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="400"
                    value={segments[selectedSegment].width}
                    onChange={(e) => updateSegmentProperty('width', Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Track Stats */}
          <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl border border-slate-700">
            <h4 className="font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-emerald-400">📊</span>
              Track Stats
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-700/30 p-3 rounded-lg">
                <div className="text-slate-400">Segments</div>
                <div className="text-white font-bold text-lg">{segments.length}</div>
              </div>
              <div className="bg-slate-700/30 p-3 rounded-lg">
                <div className="text-slate-400">Selected</div>
                <div className="text-white font-bold">
                  {selectedSegment !== null ? `#${selectedSegment}` : 'None'}
                </div>
              </div>
              <div className="bg-slate-700/30 p-3 rounded-lg">
                <div className="text-slate-400">Status</div>
                <div className={segments.length >= 3 ? "text-emerald-400 font-bold" : "text-amber-400"}>
                  {segments.length >= 3 ? 'READY 🏁' : `Need ${3 - segments.length}`}
                </div>
              </div>
              <div className="bg-slate-700/30 p-3 rounded-lg">
                <div className="text-slate-400">Length</div>
                <div className="text-white font-bold">{(segments.length * 200).toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl border border-slate-700">
            <h4 className="font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-blue-400">💡</span>
              How To Build
            </h4>
            <div className="text-sm text-slate-300 space-y-2">
              <div className="flex items-start gap-2">
                <span className="bg-cyan-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</span>
                <span><strong>Start blank</strong> or use the simple starter</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-cyan-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</span>
                <span><strong>Add segments</strong> to build your track layout</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-cyan-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</span>
                <span><strong>Click segments</strong> to select and modify them</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-cyan-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">4</span>
                <span><strong>Adjust properties</strong> for curves and width</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-cyan-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">5</span>
                <span><strong>Build & Race</strong> when ready (3+ segments)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom status bar */}
      <div className="mt-4 p-3 bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700">
        <div className="flex flex-wrap items-center justify-between text-sm text-slate-300">
          <div className="flex items-center gap-4">
            <span>• <strong>Click + Drag</strong> empty space to orbit</span>
            <span>• <strong>Mouse wheel</strong> to zoom</span>
            <span>• <strong>Click segments</strong> to select</span>
            <span>• <strong>Drag selected</strong> to move</span>
          </div>
          <div className="text-cyan-400 font-medium">
            {segments.length >= 3 ? '🎯 Ready to race!' : '⏳ Build your track...'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackBuilder;