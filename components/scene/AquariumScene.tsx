'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import SceneObjectRegistry from './SceneObjectRegistry';
import { useAquariumStore } from '../../store/useAquariumStore';
import { evaluateWaterPhase } from '../../lib/simulation/ecosystemEngine';
import * as THREE from 'three';

function AnimatedAquariumWater({
  tankWidth,
  tankHeight,
  tankDepth,
}: {
  tankWidth: number;
  tankHeight: number;
  tankDepth: number;
}) {
  const tankCapacity = useAquariumStore((state) => state.tankCapacity);
  const ecosystemStatus = useAquariumStore((state) => state.ecosystemStatus);

  const waterPhase = useMemo(() => {
    return evaluateWaterPhase(tankCapacity, ecosystemStatus.bioLoad, ecosystemStatus.warnings);
  }, [tankCapacity, ecosystemStatus.bioLoad, ecosystemStatus.warnings]);

  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const targetColor = useMemo(() => new THREE.Color(waterPhase.color), [waterPhase.color]);

  useFrame(({ clock }, delta) => {
    if (!matRef.current) return;
    const t = clock.getElapsedTime();
    // 3 Fazlı su rengi yumuşak geçişi (lerp)
    matRef.current.color.lerp(targetColor, delta * 2.2);

    // Su nefes alma / hafif dalgalanma efekti
    const pulse = Math.sin(t * 1.5) * 0.012;
    const currentTargetOpacity = Math.max(0.08, waterPhase.opacity + pulse);

    matRef.current.opacity = THREE.MathUtils.lerp(
      matRef.current.opacity,
      currentTargetOpacity,
      delta * 2.2
    );
  });

  return (
    <mesh position={[0, -0.1, 0]}>
      <boxGeometry args={[tankWidth - 0.08, tankHeight - 0.25, tankDepth - 0.08]} />
      <meshStandardMaterial
        ref={matRef}
        color={waterPhase.color}
        transparent
        opacity={waterPhase.opacity}
        roughness={0.12}
        depthWrite={false}
      />
    </mesh>
  );
}

function FpsTracker({ onFpsUpdate }: { onFpsUpdate: (fps: number) => void }) {
  const frameCount = useRef(0);
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    frameCount.current += 1;
    elapsed.current += delta;

    if (elapsed.current >= 0.5) {
      const avgFps = Math.round(frameCount.current / elapsed.current);
      onFpsUpdate(avgFps);
      frameCount.current = 0;
      elapsed.current = 0;
    }
  });

  return null;
}

interface AquariumSceneProps {
  onFpsUpdate?: (fps: number) => void;
}

export default function AquariumScene({ onFpsUpdate }: AquariumSceneProps) {
  const tankCapacity = useAquariumStore((state) => state.tankCapacity);
  const tankWidth = tankCapacity === 200 ? 6.5 : tankCapacity === 100 ? 5.2 : 4.0;
  const tankHeight = tankCapacity === 200 ? 3.2 : tankCapacity === 100 ? 2.8 : 2.3;
  const tankDepth = tankCapacity === 200 ? 3.2 : tankCapacity === 100 ? 2.6 : 2.2;

  return (
    <div className="w-full h-full bg-[#060d18]" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 1.15, 3.6], fov: 42 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#060d18']} />

        {onFpsUpdate && <FpsTracker onFpsUpdate={onFpsUpdate} />}

        {/* Işıklar */}
        <ambientLight intensity={0.75} />
        <directionalLight position={[5, 10, 5]} intensity={1.3} castShadow />
        <pointLight position={[-4, 4, -4]} intensity={0.6} color="#38bdf8" />

        {/* 3D Cam Akvaryum Tankı Gövdesi */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[tankWidth, tankHeight, tankDepth]} />
          <meshPhysicalMaterial
            color="#38bdf8"
            transmission={0.94}
            opacity={1}
            transparent
            roughness={0.08}
            ior={1.5}
            side={THREE.BackSide}
          />
        </mesh>

        {/* 3 Fazlı Dinamik Su Hacmi Animasyonu */}
        <AnimatedAquariumWater
          tankWidth={tankWidth}
          tankHeight={tankHeight}
          tankDepth={tankDepth}
        />

        {/* Sahne Objeleri */}
        <SceneObjectRegistry
          tankWidth={tankWidth}
          tankHeight={tankHeight}
          tankDepth={tankDepth}
        />

        {/* Kamera Kontrolleri */}
        <OrbitControls
          target={[0, 0.2, 0]}
          enablePan={true}
          enableZoom={true}
          minDistance={2}
          maxDistance={7}
          maxPolarAngle={Math.PI / 2 + 0.1}
        />

        <Environment preset="city" />
      </Canvas>
    </div>
  );
}

