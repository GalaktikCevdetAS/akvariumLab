'use client';

import React, { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { useAquariumStore } from '@/store/useAquariumStore';
import StudioEnvironment from './StudioEnvironment';
import { SceneObjectRegistry } from './SceneObjectRegistry';
import SilisKumMesh from '../../models/kumlar/silis-kum/SilisKumMesh';
import { DraggableEquipment } from './DraggableEquipment';

interface AquariumSceneProps {
  onFpsUpdate?: (fps: number) => void;
}

function AquariumTankContent({
  onFpsUpdate,
}: {
  onFpsUpdate?: (fps: number) => void;
}) {
  const tankBounds = useAquariumStore((state) => state.tankBounds);
  const placedItems = useAquariumStore((state) => state.placedItems);
  const ecosystemStatus = useAquariumStore((state) => state.ecosystemStatus);
  const lightHours = useAquariumStore((state) => state.lightHours);
  const selectItem = useAquariumStore((state) => state.selectItem);

  const [isDraggingAny, setIsDraggingAny] = useState(false);
  const waterSurfaceRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const fpsCounter = useRef({ frames: 0, lastTime: performance.now() });

  const { width, height, depth, waterTop, substrateTop, glassThickness } =
    tankBounds;

  // Sahnedeki toplam kum kilogramını ve kum tipini hesapla
  const sandItems = useMemo(
    () => placedItems.filter((item) => item.product.category === 'kumlar'),
    [placedItems]
  );

  const totalSandKg = useMemo(
    () => sandItems.reduce((sum, item) => sum + item.quantity, 0),
    [sandItems]
  );

  const sandType = useMemo<'silis' | 'hagen' | 'aktif-toprak'>(() => {
    const slug = (sandItems[0]?.product.slug || '').toLowerCase();
    if (slug.includes('hagen') || slug.includes('siyah')) return 'hagen';
    if (slug.includes('aktif') || slug.includes('toprak')) return 'aktif-toprak';
    return 'silis';
  }, [sandItems]);

  const equipmentItems = useMemo(
    () => placedItems.filter((item) => item.product.category === 'malzemeler'),
    [placedItems]
  );

  const nonEquipmentItems = useMemo(
    () =>
      placedItems.filter(
        (item) =>
          item.product.category === 'canlilar' ||
          item.product.category === 'bitkiler'
      ),
    [placedItems]
  );

  const hasLightFixture = useMemo(
    () =>
      equipmentItems.some(
        (e) => e.product.sub_category === 'aydinlatmalar'
      ),
    [equipmentItems]
  );

  const lightIntensityFactor = useMemo(() => {
    if (lightHours <= 0) return 0.25;
    const base = hasLightFixture ? 1.05 : 0.65;
    return Math.min(1.4, base * (lightHours / 8));
  }, [hasLightFixture, lightHours]);

  const waterHeight = Math.max(0.2, waterTop - substrateTop);
  const waterCenterY = substrateTop + waterHeight / 2;

  const particlePositions = useMemo(() => {
    const count = 140;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * (width - 0.2);
      arr[i * 3 + 1] =
        substrateTop + 0.08 + Math.random() * Math.max(0.2, waterHeight - 0.16);
      arr[i * 3 + 2] = (Math.random() - 0.5) * (depth - 0.2);
    }
    return arr;
  }, [width, depth, substrateTop, waterHeight]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (onFpsUpdate) {
      fpsCounter.current.frames += 1;
      const now = performance.now();
      if (now - fpsCounter.current.lastTime >= 1000) {
        onFpsUpdate(
          Math.round(
            (fpsCounter.current.frames * 1000) /
              (now - fpsCounter.current.lastTime)
          )
        );
        fpsCounter.current.frames = 0;
        fpsCounter.current.lastTime = now;
      }
    }

    if (waterSurfaceRef.current) {
      waterSurfaceRef.current.position.y = waterTop + Math.sin(t * 1.8) * 0.008;
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.y = Math.sin(t * 0.15) * 0.03;
    }
  });

  const waterColor = useMemo(
    () => new THREE.Color(ecosystemStatus.waterVisuals.color),
    [ecosystemStatus.waterVisuals.color]
  );

  return (
    <>
      <StudioEnvironment
        tankWidth={width}
        tankHeight={height}
        tankDepth={depth}
      />

      <ambientLight
        intensity={0.55 + lightIntensityFactor * 0.3}
        color="#eef7ff"
      />
      <directionalLight
        position={[width * 0.7, height * 1.8, depth * 1.3]}
        intensity={1.25 * lightIntensityFactor}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.1}
        shadow-camera-far={35}
        shadow-bias={-0.0005}
      />
      <pointLight
        position={[0, height / 2 + 0.4, 0]}
        intensity={1.1 * lightIntensityFactor}
        distance={height * 4}
        color="#ffffff"
      />

      <group
        position={[0, 0, 0]}
        onPointerMissed={() => {
          if (!isDraggingAny) selectItem(null);
        }}
      >
        {/* Taban Kumu */}
        {totalSandKg > 0 && (
          <SilisKumMesh
            tankWidth={width}
            tankDepth={depth}
            tankHeight={height}
            totalSandKg={totalSandKg}
            sandType={sandType}
          />
        )}

        {/* Su Yüzeyi */}
        <mesh
          ref={waterSurfaceRef}
          position={[0, waterTop, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry
            args={[width - glassThickness * 2, depth - glassThickness * 2, 32, 32]}
          />
          <meshPhysicalMaterial
            color={waterColor}
            transparent
            opacity={0.42}
            roughness={ecosystemStatus.waterVisuals.roughness}
            metalness={0.05}
            ior={1.333}
            reflectivity={0.85}
            clearcoat={1}
            clearcoatRoughness={0.05}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* İç Su Hacmi */}
        <mesh position={[0, waterCenterY, 0]} raycast={() => null}>
          <boxGeometry
            args={[
              width - glassThickness * 2.1,
              waterHeight,
              depth - glassThickness * 2.1,
            ]}
          />
          <meshPhysicalMaterial
            color={waterColor}
            transparent
            opacity={ecosystemStatus.waterVisuals.opacity}
            roughness={0.1}
            ior={1.333}
            depthWrite={false}
            side={THREE.BackSide}
          />
        </mesh>

        {/* Askıda Mikro Partiküller */}
        <points ref={particlesRef} raycast={() => null}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[particlePositions, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.022}
            color="#e0f7fa"
            transparent
            opacity={Math.min(0.65, 0.2 + ecosystemStatus.ppm / 1500)}
            depthWrite={false}
          />
        </points>

        {/* Canlılar ve Bitkiler */}
        <SceneObjectRegistry items={nonEquipmentItems} tankBounds={tankBounds} />

        {/* Sürüklenebilir Ekipmanlar */}
        <DraggableEquipment
          placedEquipments={equipmentItems}
          tankBounds={tankBounds}
          onDragStateChange={setIsDraggingAny}
        />

        {/* Cam Paneller */}
        <TankGlassStructure
          width={width}
          height={height}
          depth={depth}
          glassThickness={glassThickness}
          algaeLevel={ecosystemStatus.algaeLevel}
        />
      </group>

      <ContactShadows
        position={[0, -height / 2 - 0.002, 0]}
        opacity={0.45}
        scale={Math.max(width, depth) * 2.4}
        blur={2.2}
        far={height * 1.5}
      />

      <OrbitControls
        makeDefault
        enabled={!isDraggingAny}
        target={[0, 0, 0]}
        minDistance={Math.max(width, depth) * 0.65}
        maxDistance={Math.max(width, depth) * 3.2}
        maxPolarAngle={Math.PI / 2 - 0.02}
        enableDamping
        dampingFactor={0.06}
      />
    </>
  );
}

interface TankGlassStructureProps {
  width: number;
  height: number;
  depth: number;
  glassThickness: number;
  algaeLevel: number;
}

function TankGlassStructure({
  width,
  height,
  depth,
  glassThickness,
  algaeLevel,
}: TankGlassStructureProps) {
  const glassMaterial = useMemo(() => {
    const baseColor = new THREE.Color('#eef9fc');
    const greenTint = new THREE.Color('#84a970');
    baseColor.lerp(greenTint, Math.min(0.45, (algaeLevel / 100) * 0.45));

    return new THREE.MeshPhysicalMaterial({
      color: baseColor,
      transparent: true,
      opacity: 0.16 + (algaeLevel / 100) * 0.12,
      roughness: 0.04 + (algaeLevel / 100) * 0.25,
      metalness: 0.02,
      ior: 1.52,
      reflectivity: 0.9,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }, [algaeLevel]);

  const siliconeMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#1b2428',
        roughness: 0.6,
        metalness: 0.1,
      }),
    []
  );

  const seamSize = Math.max(0.02, glassThickness * 0.65);

  return (
    <group raycast={() => null}>
      {/* Taban Camı */}
      <mesh position={[0, -height / 2 + glassThickness / 2, 0]} receiveShadow>
        <boxGeometry args={[width, glassThickness, depth]} />
        <meshStandardMaterial color="#1a262b" roughness={0.4} />
      </mesh>

      {/* Ön Cam */}
      <mesh
        position={[0, 0, depth / 2 - glassThickness / 2]}
        material={glassMaterial}
      >
        <boxGeometry args={[width, height, glassThickness]} />
      </mesh>

      {/* Arka Cam */}
      <mesh
        position={[0, 0, -depth / 2 + glassThickness / 2]}
        material={glassMaterial}
      >
        <boxGeometry args={[width, height, glassThickness]} />
      </mesh>

      {/* Sol Cam */}
      <mesh
        position={[-width / 2 + glassThickness / 2, 0, 0]}
        material={glassMaterial}
      >
        <boxGeometry args={[glassThickness, height, depth - glassThickness * 2]} />
      </mesh>

      {/* Sağ Cam */}
      <mesh
        position={[width / 2 - glassThickness / 2, 0, 0]}
        material={glassMaterial}
      >
        <boxGeometry args={[glassThickness, height, depth - glassThickness * 2]} />
      </mesh>

      {/* Köşe Silikon Derzleri */}
      {[
        [-width / 2 + seamSize, 0, depth / 2 - seamSize],
        [width / 2 - seamSize, 0, depth / 2 - seamSize],
        [-width / 2 + seamSize, 0, -depth / 2 + seamSize],
        [width / 2 - seamSize, 0, -depth / 2 + seamSize],
      ].map(([x, y, z], idx) => (
        <mesh key={idx} position={[x, y, z]} material={siliconeMaterial}>
          <boxGeometry args={[seamSize, height, seamSize]} />
        </mesh>
      ))}
    </group>
  );
}

export function AquariumScene({ onFpsUpdate }: AquariumSceneProps) {
  return (
    <div className="w-full h-full relative">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 2.4, 9.8], fov: 42, near: 0.05, far: 80 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
      >
        <AquariumTankContent onFpsUpdate={onFpsUpdate} />
      </Canvas>
    </div>
  );
}

export default AquariumScene;