'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';

interface SilisKumMeshProps {
  tankWidth: number;
  tankHeight: number;
  tankDepth: number;
  tankBottomY: number;
  sandTopY: number;
  sandHeight: number;
  totalSandKg: number;
}

export default function SilisKumMesh({
  tankWidth,
  tankDepth,
  tankBottomY,
  sandHeight,
  totalSandKg,
}: SilisKumMeshProps) {
  // Kum yoksa render etme
  if (totalSandKg <= 0 || sandHeight <= 0.001) {
    return null;
  }

  // Camların dışına taşmayacak iç ölçü
  const innerWidth = Math.max(0.1, tankWidth - 0.06);
  const innerDepth = Math.max(0.1, tankDepth - 0.06);

  // Prosedürel doğal kum dalgaları (y > 0 olan üst yüzey vertekslerine dalgalı tepeler)
  const geometry = useMemo(() => {
    const geo = new THREE.BoxGeometry(innerWidth, sandHeight, innerDepth, 40, 1, 24);
    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      // Yalnızca üst yüzey verteksleri (y > 0)
      if (y > 0.0001) {
        const x = pos.getX(i);
        const z = pos.getZ(i);

        // Çok katmanlı sinüs/dalga tepeleri
        const wave =
          Math.sin(x * 3.2 + 0.4) * Math.cos(z * 3.8) * Math.min(0.04, sandHeight * 0.15) +
          Math.sin(x * 6.5 + z * 5.0) * Math.min(0.02, sandHeight * 0.08) +
          Math.cos(x * 2.0 - z * 2.5) * Math.min(0.03, sandHeight * 0.1);

        pos.setY(i, y + wave);
      }
    }

    geo.computeVertexNormals();
    return geo;
  }, [innerWidth, sandHeight, innerDepth]);

  // HTML5 Canvas ile binlerce sıcak krem-kum mikro tanesi içeren prosedürel doku
  const sandTexture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Sıcak krem-kum baz rengi
    ctx.fillStyle = '#dfcfb2';
    ctx.fillRect(0, 0, 512, 512);

    // Sıcak krem-kum tonlarında binlerce mikro kum tanesi
    const grainColors = [
      '#f5eee1', '#eedcb8', '#d6be96', '#cbb389',
      '#ebd8b3', '#b89a6c', '#fff9ed', '#a88658', '#997344'
    ];

    for (let i = 0; i < 35000; i++) {
      const gx = Math.random() * 512;
      const gy = Math.random() * 512;
      const size = Math.random() < 0.8 ? 1 : 1.5;
      ctx.fillStyle = grainColors[Math.floor(Math.random() * grainColors.length)];
      ctx.fillRect(gx, gy, size, size);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 3);
    return tex;
  }, []);

  // Kumun altı tankBottomY üzerinde, üstü sandTopY seviyesinde
  const posY = tankBottomY + sandHeight / 2;

  return (
    <mesh position={[0, posY, 0]} geometry={geometry} receiveShadow>
      <meshStandardMaterial
        map={sandTexture ?? undefined}
        bumpMap={sandTexture ?? undefined}
        bumpScale={0.035}
        roughness={0.92}
        metalness={0.04}
        color="#ebd8b5"
      />
    </mesh>
  );
}
