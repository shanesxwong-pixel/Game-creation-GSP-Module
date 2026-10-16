import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { BoardGrid, PlacedPiece, PlayerColor, ScenarioType } from '../types/game';
import { BOARD_SIZE, COLOR_CONFIG, STARTING_CORNERS, validatePlacement } from '../game/rules';

interface ThreeBoardProps {
  board: BoardGrid;
  selectedPieceMatrix: number[][] | null;
  selectedColor: PlayerColor;
  scenario: ScenarioType;
  history: PlacedPiece[];
  onCellHover?: (row: number | null, col: number | null) => void;
  onCellClick?: (row: number, col: number) => void;
  isInteractive: boolean;
}

export const ThreeBoard: React.FC<ThreeBoardProps> = ({
  board,
  selectedPieceMatrix,
  selectedColor,
  scenario,
  history,
  onCellHover,
  onCellClick,
  isInteractive,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const hoverCoordRef = useRef<{ row: number; col: number } | null>(null);

  // Store mutable refs for Three.js render loop without triggering re-render
  const stateRef = useRef({
    board,
    selectedPieceMatrix,
    selectedColor,
    scenario,
    history,
    isInteractive,
    hoverCoord: null as { row: number; col: number } | null,
    onCellHover,
    onCellClick,
  });

  useEffect(() => {
    stateRef.current = {
      board,
      selectedPieceMatrix,
      selectedColor,
      scenario,
      history,
      isInteractive,
      hoverCoord: hoverCoordRef.current,
      onCellHover,
      onCellClick,
    };
  }, [board, selectedPieceMatrix, selectedColor, scenario, history, isInteractive, onCellHover, onCellClick]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // --- THREE.JS SCENE SETUP ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x181a20);
    scene.fog = new THREE.FogExp2(0x181a20, 0.015);

    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    // Elevated isometric view overlooking the 20x20 board
    camera.position.set(0, 26, 22);
    camera.lookAt(0, -1, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Mandatory Studio Environment Reflection
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Studio 3-point lighting rig (soft warm neutral diffusion)
    const keyLight = new THREE.DirectionalLight(0xf8f5ef, 1.4);
    keyLight.position.set(12, 30, 15);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 5;
    keyLight.shadow.camera.far = 60;
    const d = 16;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0004;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const fillLight = new THREE.HemisphereLight(0x9ca3af, 0x202228, 0.85);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xb0b8c4, 0.7);
    rimLight.position.set(-15, 18, -18);
    scene.add(rimLight);

    // Scenario Accent Light (soft ambient glow)
    const scenarioLight = new THREE.PointLight(0x5ca98d, 0.7, 30);
    scenarioLight.position.set(0, 8, 0);
    scene.add(scenarioLight);

    // --- BOARD GEOMETRY & MATERIALS ---
    const boardGroup = new THREE.Group();
    scene.add(boardGroup);

    const CELL_SIZE = 1.0;
    const BOARD_HALF = (BOARD_SIZE * CELL_SIZE) / 2;

    // 1. Procedural Grid Texture for Board Base (Soft warm slate)
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#20232a';
    ctx.fillRect(0, 0, 1024, 1024);

    const step = 1024 / BOARD_SIZE;
    ctx.strokeStyle = '#2d313b';
    ctx.lineWidth = 2;
    for (let i = 0; i <= BOARD_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * step, 0);
      ctx.lineTo(i * step, 1024);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * step);
      ctx.lineTo(1024, i * step);
      ctx.stroke();
    }

    const gridTexture = new THREE.CanvasTexture(canvas);
    gridTexture.colorSpace = THREE.SRGBColorSpace;
    gridTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    // 2. Base Board Slab (Soft neutral slate)
    const boardMaterial = new THREE.MeshStandardMaterial({
      color: 0x242730,
      roughness: 0.6,
      metalness: 0.15,
      map: gridTexture,
    });

    const boardGeom = new THREE.BoxGeometry(
      BOARD_SIZE * CELL_SIZE + 1.2,
      0.6,
      BOARD_SIZE * CELL_SIZE + 1.2
    );
    const boardMesh = new THREE.Mesh(boardGeom, boardMaterial);
    boardMesh.position.y = -0.3;
    boardMesh.receiveShadow = true;
    boardGroup.add(boardMesh);

    // 3. Frame Rim (Soft warm graphite)
    const rimGeom = new THREE.BoxGeometry(
      BOARD_SIZE * CELL_SIZE + 2.0,
      0.4,
      BOARD_SIZE * CELL_SIZE + 2.0
    );
    const rimMaterial = new THREE.MeshStandardMaterial({
      color: 0x2b2e38,
      metalness: 0.25,
      roughness: 0.5,
    });
    const rimMesh = new THREE.Mesh(rimGeom, rimMaterial);
    rimMesh.position.y = -0.55;
    rimMesh.receiveShadow = true;
    boardGroup.add(rimMesh);

    // 4. Contact shadow beneath board
    const shadowGeo = new THREE.PlaneGeometry(BOARD_SIZE * 1.3, BOARD_SIZE * 1.3);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = -0.76;
    boardGroup.add(contactShadow);

    // 5. Starting Corner Beacons
    const cornerMarkersGroup = new THREE.Group();
    boardGroup.add(cornerMarkersGroup);

    (Object.entries(STARTING_CORNERS) as [PlayerColor, [number, number]][]).forEach(([color, [r, c]]) => {
      const x = (c - BOARD_SIZE / 2 + 0.5) * CELL_SIZE;
      const z = (r - BOARD_SIZE / 2 + 0.5) * CELL_SIZE;
      const hex = COLOR_CONFIG[color].hex;

      const markerGeo = new THREE.CylinderGeometry(0.35, 0.45, 0.1, 16);
      const markerMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(hex),
        emissive: new THREE.Color(hex),
        emissiveIntensity: 0.25,
        roughness: 0.4,
        metalness: 0.4,
      });
      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.position.set(x, 0.05, z);
      cornerMarkersGroup.add(marker);
    });

    // 6. Placed Tiles Container
    const tilesGroup = new THREE.Group();
    boardGroup.add(tilesGroup);

    // Color materials pool for soft matte jewel polyominos (comfortable on eyes)
    const pieceMaterials: Record<PlayerColor, THREE.MeshPhysicalMaterial> = {
      blue: new THREE.MeshPhysicalMaterial({
        color: 0x4d7cbb,
        roughness: 0.22,
        metalness: 0.1,
        transmission: 0.15,
        thickness: 0.4,
        clearcoat: 0.8,
        clearcoatRoughness: 0.12,
        ior: 1.45,
      }),
      yellow: new THREE.MeshPhysicalMaterial({
        color: 0xc89243,
        roughness: 0.22,
        metalness: 0.1,
        transmission: 0.15,
        thickness: 0.4,
        clearcoat: 0.8,
        clearcoatRoughness: 0.12,
        ior: 1.45,
      }),
      red: new THREE.MeshPhysicalMaterial({
        color: 0xbe5b5b,
        roughness: 0.22,
        metalness: 0.1,
        transmission: 0.15,
        thickness: 0.4,
        clearcoat: 0.8,
        clearcoatRoughness: 0.12,
        ior: 1.45,
      }),
      green: new THREE.MeshPhysicalMaterial({
        color: 0x4e9a7e,
        roughness: 0.22,
        metalness: 0.1,
        transmission: 0.15,
        thickness: 0.4,
        clearcoat: 0.8,
        clearcoatRoughness: 0.12,
        ior: 1.45,
      }),
    };

    // Shared block geometry with bevel
    const blockGeom = new THREE.BoxGeometry(0.92, 0.28, 0.92);

    // Hover Preview Mesh Group
    const previewGroup = new THREE.Group();
    scene.add(previewGroup);

    const validPreviewMat = new THREE.MeshStandardMaterial({
      color: 0x6bb397,
      emissive: 0x4e9a7e,
      emissiveIntensity: 0.45,
      transparent: true,
      opacity: 0.7,
      roughness: 0.3,
      metalness: 0.3,
    });

    const invalidPreviewMat = new THREE.MeshStandardMaterial({
      color: 0xd47575,
      emissive: 0xbe5b5b,
      emissiveIntensity: 0.45,
      transparent: true,
      opacity: 0.7,
      roughness: 0.3,
      metalness: 0.3,
    });

    // Dynamic Scenario Particle Lines / Aura
    const scenarioEffectsGroup = new THREE.Group();
    scene.add(scenarioEffectsGroup);

    // Reusable raycaster for picking
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersectPoint = new THREE.Vector3();

    // Cache to track placed tile visual state
    let lastRenderedHistoryLen = -1;

    const updatePlacedTiles = () => {
      const curHistory = stateRef.current.history;
      if (curHistory.length === lastRenderedHistoryLen) return;
      lastRenderedHistoryLen = curHistory.length;

      // Clear existing children
      while (tilesGroup.children.length > 0) {
        tilesGroup.remove(tilesGroup.children[0]);
      }

      curHistory.forEach((move) => {
        const mat = pieceMaterials[move.color];
        for (let r = 0; r < move.matrix.length; r++) {
          for (let c = 0; c < move.matrix[0].length; c++) {
            if (move.matrix[r][c] === 1) {
              const br = move.row + r;
              const bc = move.col + c;
              const mesh = new THREE.Mesh(blockGeom, mat);
              mesh.position.set(
                (bc - BOARD_SIZE / 2 + 0.5) * CELL_SIZE,
                0.14,
                (br - BOARD_SIZE / 2 + 0.5) * CELL_SIZE
              );
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              tilesGroup.add(mesh);
            }
          }
        }
      });
    };

    // Hover listener
    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const hit = raycaster.ray.intersectPlane(plane, intersectPoint);

      if (hit && stateRef.current.isInteractive) {
        const c = Math.floor(intersectPoint.x / CELL_SIZE + BOARD_SIZE / 2);
        const r = Math.floor(intersectPoint.z / CELL_SIZE + BOARD_SIZE / 2);

        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
          if (!hoverCoordRef.current || hoverCoordRef.current.row !== r || hoverCoordRef.current.col !== c) {
            hoverCoordRef.current = { row: r, col: c };
            stateRef.current.onCellHover?.(r, c);
          }
          return;
        }
      }

      if (hoverCoordRef.current !== null) {
        hoverCoordRef.current = null;
        stateRef.current.onCellHover?.(null, null);
      }
    };

    const onClick = () => {
      if (!stateRef.current.isInteractive) return;
      if (hoverCoordRef.current) {
        stateRef.current.onCellClick?.(hoverCoordRef.current.row, hoverCoordRef.current.col);
      }
    };

    container.addEventListener('mousemove', onPointerMove);
    container.addEventListener('click', onClick);

    // --- ANIMATION LOOP ---
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsedTime = clock.getElapsedTime();

      // Check board tiles updates
      updatePlacedTiles();

      // Update Scenario Lighting & Aura (Soft eye-comfort illumination)
      const curScenario = stateRef.current.scenario;
      if (curScenario === 'destructive') {
        scenarioLight.color.setHex(0xd47575);
        scenarioLight.intensity = 0.65 + Math.sin(elapsedTime * 2) * 0.12;
      } else if (curScenario === 'collaborative') {
        scenarioLight.color.setHex(0x5ca98d);
        scenarioLight.intensity = 0.65 + Math.sin(elapsedTime * 1.5) * 0.1;
      } else {
        // Last tile challenge
        scenarioLight.color.setHex(0xd4a359);
        scenarioLight.intensity = 0.7 + Math.sin(elapsedTime * 2.2) * 0.15;
      }

      // Smooth subtle camera drift
      const targetCamX = Math.sin(elapsedTime * 0.08) * 1.5;
      camera.position.x += (targetCamX - camera.position.x) * 0.02;

      // Update Hover Preview
      const selectedMatrix = stateRef.current.selectedPieceMatrix;
      const hoverCoord = hoverCoordRef.current;

      while (previewGroup.children.length > 0) {
        previewGroup.remove(previewGroup.children[0]);
      }

      if (selectedMatrix && hoverCoord && stateRef.current.isInteractive) {
        const validation = validatePlacement(
          stateRef.current.board,
          selectedMatrix,
          hoverCoord.row,
          hoverCoord.col,
          stateRef.current.selectedColor
        );

        const activeMat = validation.valid ? validPreviewMat : invalidPreviewMat;
        const bounce = Math.sin(elapsedTime * 8) * 0.05 + 0.35;

        for (let r = 0; r < selectedMatrix.length; r++) {
          for (let c = 0; c < selectedMatrix[0].length; c++) {
            if (selectedMatrix[r][c] === 1) {
              const br = hoverCoord.row + r;
              const bc = hoverCoord.col + c;
              if (br >= 0 && br < BOARD_SIZE && bc >= 0 && bc < BOARD_SIZE) {
                const previewBlock = new THREE.Mesh(blockGeom, activeMat);
                previewBlock.position.set(
                  (bc - BOARD_SIZE / 2 + 0.5) * CELL_SIZE,
                  bounce,
                  (br - BOARD_SIZE / 2 + 0.5) * CELL_SIZE
                );
                previewGroup.add(previewBlock);
              }
            }
          }
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle Resize
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('mousemove', onPointerMove);
      container.removeEventListener('click', onClick);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full relative select-none" />;
};
