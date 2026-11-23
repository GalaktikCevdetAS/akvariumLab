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

export default function UcRenkIsikMesh({
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
  const whiteHex = kelvin >= 10000 ? '#f8fafc' : '#fef9c3';
  const intensity = isOn ? Math.min(3.0, (lumen / 1400) * (lightHours / 8)) : 0;

  return (
    <group position={[0, 0, zOffset]}>
      {/* Antrasit Pro WRGB Kasa */}
      <mesh position={[0, fixtureY, 0]} castShadow>
        <boxGeometry args={[bodyLength, 0.07, 0.28]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.22} />
      </mesh>

      {/* 1. Kanal: Kırmızı (Bitki Klorofil-A Spektrumu) */}
      <mesh position={[0, fixtureY - 0.036, 0.065]}>
        <boxGeometry args={[bodyLength - 0.12, 0.012, 0.042]} />
        <meshStandardMaterial
          color="#fb7185"
          emissive="#f43f5e"
          emissiveIntensity={isOn ? 1.9 : 0}
        />
      </mesh>

      {/* 2. Kanal: Tam Spektrum Beyaz */}
      <mesh position={[0, fixtureY - 0.036, 0]}>
        <boxGeometry args={[bodyLength - 0.12, 0.012, 0.05]} />
        <meshStandardMaterial
          color={whiteHex}
          emissive={whiteHex}
          emissiveIntensity={isOn ? 1.8 : 0}
        />
      </mesh>

      {/* 3. Kanal: Mavi/Yeşil Bitki Desteği */}
      <mesh position={[0, fixtureY - 0.036, -0.065]}>
        <boxGeometry args={[bodyLength - 0.12, 0.012, 0.042]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0ea5e9"
          emissiveIntensity={isOn ? 1.9 : 0}
        />
      </mesh>

      {/* Sol & Sağ Ayaklar */}
      <mesh position={[-bodyLength / 2 + 0.04, tankTopY + 0.07, 0]}>
        <boxGeometry args={[0.04, 0.14, 0.26]} />
        <meshStandardMaterial color="#334155" roughness={0.45} />
      </mesh>
      <mesh position={[bodyLength / 2 - 0.04, tankTopY + 0.07, 0]}>
        <boxGeometry args={[0.04, 0.14, 0.26]} />
        <meshStandardMaterial color="#334155" roughness={0.45} />
      </mesh>

      {isOn && (
        <pointLight
          position={[0, fixtureY - 0.12, 0]}
          color="#fdf2f8"
          intensity={intensity}
          distance={tankHeight + 2.8}
        />
      )}
    </group>
  );
}