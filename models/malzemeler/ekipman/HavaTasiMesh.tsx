'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { PlacedEquipment } from '../../../store/useAquariumStore';

function createPorousStoneTexture(baseHex: string, poreHex: string): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 850; i++) {
    const x = (i * 53) % size;
    const y = (i * 97) % size;
    const r = (i % 2) * 0.7 + 0.6;
    ctx.fillStyle = poreHex;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export type AirStoneVariant = 'cylinder' | 'bar' | 'disc';

export function getAirStoneVariant(item: PlacedEquipment): AirStoneVariant {
  const slug = (item.product.slug || '').toLowerCase();
  const name = (item.product.name || '').toLowerCase();
  const len = item.product.length_cm || 0;

  if (
    slug.includes('disk') ||
    slug.includes('difuzor') ||
    name.includes('disk') ||
    name.includes('difüzör')
  ) {
    return 'disc';
  }

  if (
    slug.includes('uzun') ||
    slug.includes('cubuk') ||
    slug.includes('bar') ||
    name.includes('uzun') ||
    name.includes('çubuk') ||
    name.includes('cubuk') ||
    len >= 8
  ) {
    return 'bar';
  }

  return 'cylinder';
}

export function getAirBarSceneLength(item: PlacedEquipment): number {
  const lenCm = item.product.length_cm || 15;
  return Math.min(1.25, Math.max(0.45, lenCm / 22));
}

interface HavaTasiMeshProps {
  item: PlacedEquipment;
}

export default function HavaTasiMesh({ item }: HavaTasiMeshProps) {
  const variant = getAirStoneVariant(item);

  const bluePorousTex = useMemo(
    () => createPorousStoneTexture('#38bdf8', '#0284c7'),
    []
  );
  const ceramicPorousTex = useMemo(
    () => createPorousStoneTexture('#f8fafc', '#cbd5e1'),
    []
  );

  // 1. UZUN / ÇUBUK HAVA TAŞI (Bar Air Stone)
  if (variant === 'bar') {
    const barLength = getAirBarSceneLength(item);
    const bodyHeight = 0.052;
    const bodyDepth = 0.056;
    const capWidth = 0.036;
    const stoneLength = barLength - capWidth * 2;

    return (
      <group>
        {/* Alt Plastik Denge Kızakları (Kuma gömülmeden sabit durması için) */}
        {[-stoneLength * 0.32, stoneLength * 0.32].map((kx, idx) => (
          <mesh key={idx} position={[kx, 0.008, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.045, 0.016, bodyDepth + 0.028]} />
            <meshStandardMaterial color="#0f172a" roughness={0.65} />
          </mesh>
        ))}

        {/* Yatay Gözenekli Mineral Çubuk Gövde */}
        <mesh position={[0, 0.016 + bodyHeight / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[stoneLength, bodyHeight, bodyDepth]} />
          <meshStandardMaterial
            map={bluePorousTex}
            bumpMap={bluePorousTex}
            bumpScale={0.012}
            roughness={0.94}
          />
        </mesh>

        {/* Sol Koruyucu Kapak (Hortum Giriş Tarafı) */}
        <mesh position={[-barLength / 2 + capWidth / 2, 0.016 + bodyHeight / 2, 0]} castShadow>
          <boxGeometry args={[capWidth, bodyHeight + 0.008, bodyDepth + 0.008]} />
          <meshStandardMaterial color="#1e293b" roughness={0.45} />
        </mesh>

        {/* Sağ Koruyucu Kapak (Kapalı Uç) */}
        <mesh position={[barLength / 2 - capWidth / 2, 0.016 + bodyHeight / 2, 0]} castShadow>
          <boxGeometry args={[capWidth, bodyHeight + 0.008, bodyDepth + 0.008]} />
          <meshStandardMaterial color="#1e293b" roughness={0.45} />
        </mesh>

        {/* Sol Uçta 45° Açılı Hava Hortumu Giriş Nipeli */}
        <mesh
          position={[-barLength / 2 - 0.016, 0.016 + bodyHeight * 0.72, 0]}
          rotation={[0, 0, Math.PI / 3]}
        >
          <cylinderGeometry args={[0.011, 0.014, 0.048, 12]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.28} metalness={0.4} />
        </mesh>
      </group>
    );
  }

  // 2. DİSK HAVA TAŞI / SERAMİK DİFÜZÖR
  if (variant === 'disc') {
    const discRadius = Math.min(0.18, Math.max(0.11, (item.product.length_cm || 6) / 55));

    return (
      <group>
        {/* Ağır Kauçuk/Plastik Alt Taban */}
        <mesh position={[0, 0.018, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[discRadius, discRadius + 0.012, 0.036, 32]} />
          <meshStandardMaterial color="#0f172a" roughness={0.6} />
        </mesh>

        {/* Koruyucu Üst Çerçeve Halkası */}
        <mesh position={[0, 0.038, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[discRadius * 0.92, 0.009, 10, 32]} />
          <meshStandardMaterial color="#1e293b" roughness={0.45} />
        </mesh>

        {/* Beyaz Mikro Gözenekli Seramik Difüzör Plakası */}
        <mesh position={[0, 0.04, 0]}>
          <cylinderGeometry args={[discRadius * 0.88, discRadius * 0.88, 0.014, 32]} />
          <meshStandardMaterial
            map={ceramicPorousTex}
            bumpMap={ceramicPorousTex}
            bumpScale={0.008}
            roughness={0.92}
          />
        </mesh>

        {/* Yan Hortum Giriş Nipeli */}
        <mesh position={[-discRadius - 0.022, 0.022, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.011, 0.014, 0.045, 12]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.3} />
        </mesh>
      </group>
    );
  }

  // 3. KLASİK SİLİNDİRİK MİNERAL HAVA TAŞI (Kompakt 2-4 cm)
  return (
    <group>
      {/* Alt Kauçuk Destek Halkası */}
      <mesh position={[0, 0.009, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.046, 0.050, 0.018, 22]} />
        <meshStandardMaterial color="#0f172a" roughness={0.7} />
      </mesh>

      {/* Silindirik Mineral Gözenekli Gövde */}
      <mesh position={[0, 0.062, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.042, 0.045, 0.092, 22]} />
        <meshStandardMaterial
          map={bluePorousTex}
          bumpMap={bluePorousTex}
          bumpScale={0.012}
          roughness={0.94}
        />
      </mesh>

      {/* Üst Plastik Konik Başlık */}
      <mesh position={[0, 0.116, 0]}>
        <cylinderGeometry args={[0.026, 0.042, 0.018, 22]} />
        <meshStandardMaterial color="#1e293b" roughness={0.45} />
      </mesh>

      {/* Üst Metalik/Plastik Hortum Nipeli */}
      <mesh position={[0, 0.140, 0]}>
        <cylinderGeometry args={[0.010, 0.013, 0.036, 12]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.28} metalness={0.5} />
      </mesh>
    </group>
  );
}