'use client';

import React from 'react';
import { computeFixtureDimensions } from './baseLightFixture';

interface LightMeshProps {
  lengthCm: number;
  tankWidth: number;
  tankHeight: number;
  kelvin: number;
  lumen: number;
  lightHours: number;
  slotIndex?: number;
}

export default function BeyazIsikMesh({
  lengthCm,
  tankWidth,
  tankHeight,
  kelvin,
  lumen,
  lightHours,
  slotIndex = 0,
}: LightMeshProps) {
  const { bodyLength, tankTopY, fixtureY, zOffset } = computeFixtureDimensions(
    lengthCm,
    tankWidth,
    tankHeight,
    slotIndex
  );

  const isOn = lightHours > 0;
  const chipColor = kelvin >= 10000 ? '#e0f2fe' : '#fffbeb';
  const intensity = isOn ? Math.min(2.6, (lumen / 1500) * (lightHours / 8)) : 0;

  return (
    <group position={[0, 0, zOffset]}>
      {/* İnce Alüminyum Kasa */}
      <mesh position={[0, fixtureY, 0]} castShadow>
        <boxGeometry args={[bodyLength, 0.06, 0.24]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.75} roughness={0.25} />
      </mesh>

      {/* Alt LED Şerit Paneli */}
      <mesh position={[0, fixtureY - 0.032, 0]}>
        <boxGeometry args={[bodyLength - 0.12, 0.012, 0.16]} />
        <meshStandardMaterial
          color={chipColor}
          emissive={chipColor}
          emissiveIntensity={isOn ? 1.8 : 0}
        />
      </mesh>

      {/* Sol & Sağ Cam Tutucu Ayaklar */}
      <mesh position={[-bodyLength / 2 + 0.04, tankTopY + 0.07, 0]}>
        <boxGeometry args={[0.04, 0.14, 0.22]} />
        <meshStandardMaterial color="#334155" roughness={0.5} />
      </mesh>
      <mesh position={[bodyLength / 2 - 0.04, tankTopY + 0.07, 0]}>
        <boxGeometry args={[0.04, 0.14, 0.22]} />
        <meshStandardMaterial color="#334155" roughness={0.5} />
      </mesh>

      {/* Suya Vuran Gerçek Işık Kaynağı */}
      {isOn && (
        <pointLight
          position={[0, fixtureY - 0.12, 0]}
          color={chipColor}
          intensity={intensity}
          distance={tankHeight + 2.5}
        />
      )}
    </group>
  );
}