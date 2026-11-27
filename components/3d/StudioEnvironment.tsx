'use client';

import React from 'react';
import { ContactShadows } from '@react-three/drei';

interface StudioEnvironmentProps {
  tankWidth: number;
  tankDepth: number;
  tankHeight: number;
}

/**
 * Sol teknik zondaki 4 sabit hava motoru slotunun koordinatları (sadece kod içinde hesaplanır, sahnede çizilmez).
 */
export function getAirPumpSlotPosition(
  slotIndex: number,
  tankWidth: number,
  tankDepth: number,
  tankHeight: number
): [number, number, number] {
  const clampedIndex = Math.max(0, Math.min(3, slotIndex));
  const tableTopY = -tankHeight / 2;
  const x = -tankWidth / 2 - 0.78;
  const startZ = tankDepth / 2 - 0.55;
  const stepZ = Math.max(0.75, (tankDepth - 0.85) / 3);
  const z = startZ - clampedIndex * stepZ;

  return [x, tableTopY, z];
}

export default function StudioEnvironment({
  tankWidth,
  tankDepth,
  tankHeight,
}: StudioEnvironmentProps) {
  const tableTopY = -tankHeight / 2;
  const matThickness = 0.03;
  const topThickness = 0.18;
  const cabinetHeight = 4.2;

  // Kompakt yan paylar (sol: motorlar, sağ: ileride yem/gübre)
  const sideMargin = 1.45;
  const benchWidth = tankWidth + sideMargin * 2;
  const benchDepth = tankDepth + 0.55;

  return (
    <group name="studio-environment">
      {/* Suyun mavisini ve camı öne çıkaran, ışığa boğmayan dengeli koyu-slate arka plan */}
      <color attach="background" args={['#1b222c']} />
      <fog attach="fog" args={['#1b222c', 16, 36]} />

      {/* İnce Siyah Akvaryum Altlık Şiltesi */}
      <mesh position={[0, tableTopY - matThickness / 2, 0]} receiveShadow>
        <boxGeometry args={[tankWidth + 0.02, matThickness, tankDepth + 0.02]} />
        <meshStandardMaterial color="#111418" roughness={0.9} />
      </mesh>

      {/* Kompakt Mat Antrasit Üst Tabla */}
      <mesh
        position={[0, tableTopY - matThickness - topThickness / 2, 0]}
        receiveShadow
        castShadow
      >
        <boxGeometry args={[benchWidth, topThickness, benchDepth]} />
        <meshStandardMaterial color="#2a313c" roughness={0.65} metalness={0.08} />
      </mesh>

      {/* Alt Akvaryum Dolabı Gövdesi */}
      <mesh
        position={[
          0,
          tableTopY - matThickness - topThickness - cabinetHeight / 2,
          0,
        ]}
        receiveShadow
        castShadow
      >
        <boxGeometry
          args={[benchWidth - 0.18, cabinetHeight, benchDepth - 0.16]}
        />
        <meshStandardMaterial color="#1f252e" roughness={0.78} metalness={0.05} />
      </mesh>

      {/* Yumuşak Temas Gölgesi */}
      <ContactShadows
        position={[0, tableTopY + 0.002, 0]}
        opacity={0.45}
        scale={benchWidth + 1}
        blur={1.6}
        far={3}
        color="#0b0f14"
      />
    </group>
  );
}