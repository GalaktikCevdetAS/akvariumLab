'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface IcFiltreMeshProps {
  tankWidth: number;
  tankHeight: number;
  tankDepth: number;
  sandTopY: number;
  waterSurfaceY: number;
}

export default function IcFiltreMesh({
  tankWidth,
  tankHeight,
  tankDepth,
  sandTopY,
  waterSurfaceY,
}: IcFiltreMeshProps) {
  const bubblesRef = useRef<THREE.InstancedMesh>(null);
  const count = 20;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // İç filtrenin tankın sağ-arka iç köşesindeki pozisyonu
  const filterX = tankWidth / 2 - 0.35;
  const filterZ = -tankDepth / 2 + 0.35;

  // Filtre gövde yüksekliği
  const filterHeight = 1.4;
  // Filtre tabanının tam sandTopY seviyesine oturması için merkez Y
  const filterCenterY = sandTopY + filterHeight / 2;
  // Filtre çıkış ağzı Y yüksekliği
  const outletY = sandTopY + filterHeight - 0.15;
  // Su yüzeyi sınırı
  const maxWaterY = waterSurfaceY - 0.05;

  const bubbleGeo = useMemo(() => new THREE.SphereGeometry(1, 8, 8), []);
  const bubbleMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#e0f2fe', transparent: true, opacity: 0.75 }),
    []
  );

  useFrame(({ clock }) => {
    if (!bubblesRef.current) return;
    const t = clock.getElapsedTime();
    const maxRise = Math.max(0, maxWaterY - outletY);

    for (let i = 0; i < count; i++) {
      if (maxRise <= 0.02) {
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        bubblesRef.current.setMatrixAt(i, dummy.matrix);
        continue;
      }

      // Kabarcık filtre ağzından başlar, tam su yüzeyi altında kaybolur
      const progress = (t * 0.8 + i * (1 / count)) % 1;
      const y = outletY + progress * maxRise;
      const x = filterX + Math.sin(t * 3 + i) * 0.035;
      const z = filterZ + Math.cos(t * 2.5 + i) * 0.035;

      dummy.position.set(x, y, z);
      const scale = 0.025 + (i % 3) * 0.01;
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      bubblesRef.current.setMatrixAt(i, dummy.matrix);
    }
    bubblesRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* Filtre Gövdesi - Tabanı tam sandTopY üzerine oturur */}
      <mesh position={[filterX, filterCenterY, filterZ]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, filterHeight, 16]} />
        <meshStandardMaterial color="#0284c7" roughness={0.35} metalness={0.6} />
      </mesh>

      {/* Filtre Çıkış Nozulu */}
      <mesh position={[filterX, outletY, filterZ]} castShadow>
        <cylinderGeometry args={[0.07, 0.1, 0.18, 12]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.3} />
      </mesh>

      {/* Hava Kabarcığı Parçacıkları (Çıkış ağzından su yüzeyine) */}
      <instancedMesh ref={bubblesRef} args={[bubbleGeo, bubbleMat, count]} />
    </group>
  );
}
