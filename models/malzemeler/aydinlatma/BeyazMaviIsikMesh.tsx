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

export default function BeyazMaviIsikMesh({
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
  const whiteHex = kelvin >= 10000 ? '#f0f9ff' : '#fefce8';
  const blueHex = '#0284c7';
  const intensity = isOn ? Math.min(2.8, (lumen / 1450) * (lightHours / 8)) : 0;

  return (
    <group position={[0, 0, zOffset]}>
      {/* Siyah Anodize Kasa */}
      <mesh position={[0, fixtureY, 0]} castShadow>
        <boxGeometry args={[bodyLength, 0.065, 0.26]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Ön Beyaz LED Kanalı */}
      <mesh position={[0, fixtureY - 0.034, 0.045]}>
        <boxGeometry args={[bodyLength - 0.12, 0.012, 0.06]} />
        <meshStandardMaterial
          color={whiteHex}
          emissive={whiteHex}
          emissiveIntensity={isOn ? 1.7 : 0}
        />
      </mesh>

      {/* Arka Actinic Mavi LED Kanalı */}
      <mesh position={[0, fixtureY - 0.034, -0.045]}>
        <boxGeometry args={[bodyLength - 0.12, 0.012, 0.06]} />
        <meshStandardMaterial
          color={blueHex}
          emissive={blueHex}
          emissiveIntensity={isOn ? 2.1 : 0}
        />
      </mesh>

      {/* Sol & Sağ Ayaklar */}
      <mesh position={[-bodyLength / 2 + 0.04, tankTopY + 0.07, 0]}>
        <boxGeometry args={[0.04, 0.14, 0.24]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </mesh>
      <mesh position={[bodyLength / 2 - 0.04, tankTopY + 0.07, 0]}>
        <boxGeometry args={[0.04, 0.14, 0.24]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </mesh>

      {isOn && (
        <pointLight
          position={[0, fixtureY - 0.12, 0]}
          color="#7dd3fc"
          intensity={intensity}
          distance={tankHeight + 2.5}
        />
      )}
    </group>
  );
}