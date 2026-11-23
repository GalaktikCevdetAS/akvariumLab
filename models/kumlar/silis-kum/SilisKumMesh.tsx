'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';

interface SilisKumMeshProps {
  tankWidth: number;
  tankDepth: number;
  tankHeight: number;
  totalSandKg: number;
  sandType?: 'silis' | 'hagen' | 'aktif-toprak';
}

export default function SilisKumMesh({
  tankWidth,
  tankDepth,
  tankHeight,
  totalSandKg,
  sandType = 'silis',
}: SilisKumMeshProps) {
  // Sahne ölçeği: 1 birim = 10 cm -> 1 litre = 1 birim³ -> 1 kg kum = 0.65 birim³
  const glassThickness = 0.04;
  const innerW = Math.max(0.1, tankWidth - glassThickness * 2);
  const innerD = Math.max(0.1, tankDepth - glassThickness * 2);

  const sandVolumeScene = Math.max(0, totalSandKg) * 0.65;
  const baseArea = innerW * innerD;
  const sandHeight = Math.min(tankHeight * 0.35, sandVolumeScene / baseArea);

  const geometry = useMemo(() => {
    const h = Math.max(0.01, sandHeight);
    const geo = new THREE.BoxGeometry(innerW, h, innerD, 32, 1, 24);
    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      if (y > 0) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const wave =
          Math.sin(x * 2.2) * Math.cos(z * 2.0) * 0.018 +
          Math.sin(x * 4.5 + z * 3.5) * 0.008;
        pos.setY(i, y + wave);
      }
    }
    geo.computeVertexNormals();
    return geo;
  }, [innerW, innerD, sandHeight]);

  const color = useMemo(() => {
    if (sandType === 'hagen') return '#1e2229';
    if (sandType === 'aktif-toprak') return '#3b281c';
    return '#e6dcc8';
  }, [sandType]);

  if (totalSandKg <= 0 || sandHeight <= 0.005) {
    return null;
  }

  const bottomInnerY = -tankHeight / 2 + glassThickness;

  return (
    <mesh
      geometry={geometry}
      position={[0, bottomInnerY + sandHeight / 2, 0]}
      receiveShadow
    >
      <meshStandardMaterial
        color={color}
        roughness={0.92}
        metalness={0.02}
      />
    </mesh>
  );
}