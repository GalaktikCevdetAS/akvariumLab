'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { PlacedEquipment } from '../../../store/useAquariumStore';

function createSpongeTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#18181b';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 720; i++) {
    const x = (i * 47) % size;
    const y = (i * 83) % size;
    const r = (i % 2) + 0.8;
    ctx.fillStyle = i % 3 === 0 ? '#09090b' : '#27272a';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.needsUpdate = true;
  return tex;
}

interface FiltreEkipmanMeshProps {
  item: PlacedEquipment;
  waterSurfaceY: number;
  tankHeight?: number;
}

export default function FiltreEkipmanMesh({
  item,
  waterSurfaceY,
  tankHeight = 3.5,
}: FiltreEkipmanMeshProps) {
  const slug = (item.product.slug || '').toLowerCase();
  const name = (item.product.name || '').toLowerCase();
  const isSpongeFilter =
    item.product.needs_air_pump === true ||
    slug.includes('pipo') ||
    name.includes('pipo');

  const isDualSponge =
    slug.includes('cift') ||
    slug.includes('ikili') ||
    name.includes('çift') ||
    name.includes('ikili');

  const spongeTex = useMemo(() => createSpongeTexture(), []);
  const availableWaterH = Math.max(0.45, waterSurfaceY - item.position[1] - 0.08);

  // 1. PİPO FİLTRELER (Kum tabanına oturan, hava motoruyla çalışan)
  if (isSpongeFilter) {
    const riserHeight = Math.min(0.55, availableWaterH * 0.72);

    if (isDualSponge) {
      return (
        <group>
          {/* Ağır Taban Kaidesi */}
          <mesh position={[0, 0.024, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.24, 0.048, 0.14]} />
            <meshStandardMaterial color="#0f172a" roughness={0.6} />
          </mesh>

          {/* Merkez T-Bağlantı Gövdesi */}
          <mesh position={[0, 0.14, 0]} castShadow>
            <cylinderGeometry args={[0.032, 0.038, 0.22, 16]} />
            <meshStandardMaterial color="#1e293b" roughness={0.45} />
          </mesh>

          {/* Sol & Sağ Silindirik Biyolojik Süngerler */}
          {[-0.125, 0.125].map((sx, idx) => (
            <mesh key={idx} position={[sx, 0.15, 0]} castShadow>
              <cylinderGeometry args={[0.068, 0.068, 0.24, 22]} />
              <meshStandardMaterial
                map={spongeTex}
                bumpMap={spongeTex}
                bumpScale={0.015}
                roughness={0.95}
              />
            </mesh>
          ))}

          {/* Hava Hortumu Giriş Nipeli */}
          <mesh position={[0, 0.24, 0.032]} rotation={[Math.PI / 3, 0, 0]}>
            <cylinderGeometry args={[0.012, 0.014, 0.05, 10]} />
            <meshStandardMaterial color="#38bdf8" roughness={0.3} />
          </mesh>

          {/* Şeffaf Yükseltici (Riser) Su Çıkış Borusu */}
          <mesh position={[0, 0.24 + riserHeight / 2, 0]}>
            <cylinderGeometry args={[0.026, 0.026, riserHeight, 16]} />
            <meshPhysicalMaterial
              color="#e2e8f0"
              transmission={0.72}
              transparent
              opacity={0.75}
              roughness={0.15}
            />
          </mesh>
        </group>
      );
    }

    // Tek Süngerli Klasik Pipo Filtre
    const singleRiserHeight = Math.min(0.48, availableWaterH * 0.65);
    return (
      <group>
        {/* Yuvarlak Taban Ağırlığı */}
        <mesh position={[0, 0.022, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.125, 0.135, 0.044, 24]} />
          <meshStandardMaterial color="#0f172a" roughness={0.65} />
        </mesh>

        {/* Silindirik Biyolojik Sünger */}
        <mesh position={[0, 0.19, 0]} castShadow>
          <cylinderGeometry args={[0.105, 0.105, 0.30, 24]} />
          <meshStandardMaterial
            map={spongeTex}
            bumpMap={spongeTex}
            bumpScale={0.018}
            roughness={0.95}
          />
        </mesh>

        {/* Üst Plastik Kapak & Hava Hortumu Dirseği */}
        <mesh position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.065, 0.095, 0.035, 20]} />
          <meshStandardMaterial color="#1e293b" roughness={0.45} />
        </mesh>
        <mesh position={[0.045, 0.36, 0]} rotation={[0, 0, -Math.PI / 4]}>
          <cylinderGeometry args={[0.012, 0.014, 0.05, 10]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.3} />
        </mesh>

        {/* Şeffaf Yükseltici (Riser) Boru */}
        <mesh position={[0, 0.36 + singleRiserHeight / 2, 0]}>
          <cylinderGeometry args={[0.028, 0.028, singleRiserHeight, 16]} />
          <meshPhysicalMaterial
            color="#e2e8f0"
            transmission={0.72}
            transparent
            opacity={0.75}
            roughness={0.15}
          />
        </mesh>
      </group>
    );
  }

  // 2. MOTORLU İÇ FİLTRE (Akvaryum Camına Vantuzlarla Asılı Yüksek Detaylı Model)
  const totalH = 0.88;
  const spongePartH = 0.50;
  const motorPartH = 0.38;

  // Üst cam kenarından dışarı taşan güç kablosu geometrisi
  const powerCordGeo = useMemo(() => {
    const rimOffsetY = Math.max(0.25, tankHeight / 2 - item.position[1] + 0.04);
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, totalH - 0.03, -0.04),
      new THREE.Vector3(0, rimOffsetY + 0.03, -0.07),
      new THREE.Vector3(0, rimOffsetY + 0.05, -0.14),
      new THREE.Vector3(0.05, rimOffsetY - 0.35, -0.18),
    ]);
    return new THREE.TubeGeometry(curve, 24, 0.011, 8, false);
  }, [tankHeight, item.position]);

  return (
    <group>
      {/* Arka Cam Tutucu Braket Plakası */}
      <mesh position={[0, totalH * 0.52, -0.085]} castShadow>
        <boxGeometry args={[0.15, totalH * 0.78, 0.018]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </mesh>

      {/* 4 Adet Kauçuk Vantuz (Akvaryum camına tam yapışır) */}
      {[
        [-0.055, totalH * 0.22],
        [0.055, totalH * 0.22],
        [-0.055, totalH * 0.82],
        [0.055, totalH * 0.82],
      ].map(([vx, vy], idx) => (
        <group key={idx} position={[vx, vy, -0.105]}>
          {/* Vantuz sapı */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.012, 0.015, 0.022, 12]} />
            <meshStandardMaterial color="#18181b" roughness={0.8} />
          </mesh>
          {/* Vantuz çanağı (cama yapışan disk) */}
          <mesh position={[0, 0, -0.012]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.032, 0.022, 0.014, 18]} />
            <meshStandardMaterial color="#09090b" roughness={0.45} />
          </mesh>
        </group>
      ))}

      {/* Alt Filtre Kartuş Haznesi (Koyu Antrasit Kasa) */}
      <mesh position={[0, spongePartH / 2, 0]} castShadow>
        <boxGeometry args={[0.165, spongePartH, 0.145]} />
        <meshStandardMaterial color="#1e293b" roughness={0.48} metalness={0.15} />
      </mesh>

      {/* İçeride Görünür Biyolojik Sünger Çekirdeği */}
      <mesh position={[0, spongePartH / 2, 0.01]}>
        <boxGeometry args={[0.135, spongePartH - 0.05, 0.11]} />
        <meshStandardMaterial
          map={spongeTex}
          bumpMap={spongeTex}
          bumpScale={0.014}
          roughness={0.95}
        />
      </mesh>

      {/* Ön Su Emiş Izgara Yarıkları */}
      {[0.18, 0.34, 0.50, 0.66, 0.82].map((ratio, idx) => (
        <mesh key={idx} position={[0, spongePartH * ratio, 0.074]}>
          <boxGeometry args={[0.125, 0.016, 0.008]} />
          <meshStandardMaterial color="#020617" />
        </mesh>
      ))}

      {/* Alt Kartuş Kilit Mandalı */}
      <mesh position={[0, 0.014, 0]}>
        <boxGeometry args={[0.172, 0.028, 0.152]} />
        <meshStandardMaterial color="#0f172a" roughness={0.55} />
      </mesh>

      {/* Orta Conta & Kilitleme Bileziği */}
      <mesh position={[0, spongePartH + 0.01, 0]}>
        <boxGeometry args={[0.175, 0.024, 0.155]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.35} />
      </mesh>

      {/* Üst Su Geçirmez Motor Kafası */}
      <mesh position={[0, spongePartH + 0.02 + motorPartH / 2, 0]} castShadow>
        <boxGeometry args={[0.172, motorPartH, 0.152]} />
        <meshStandardMaterial color="#0284c7" roughness={0.28} metalness={0.35} />
      </mesh>

      {/* Motor Kafası Üst Kapağı */}
      <mesh position={[0, totalH + 0.01, 0]}>
        <boxGeometry args={[0.162, 0.024, 0.142]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} />
      </mesh>

      {/* Yönlendirilebilir Su Çıkış Nozulu (Ördek Gagası / Difüzör Uç) */}
      <group position={[0, spongePartH + motorPartH * 0.68, 0.078]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.022, 0.028, 0.055, 16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.35} />
        </mesh>
        <mesh position={[0, 0, 0.042]}>
          <boxGeometry args={[0.068, 0.026, 0.042]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.25} />
        </mesh>
        {/* Venturi Hava Emiş Hortum Ucu */}
        <mesh position={[0, 0.028, 0.015]}>
          <cylinderGeometry args={[0.007, 0.009, 0.032, 10]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.3} />
        </mesh>
      </group>

      {/* Üst Cam Kenarından Dışarı Çıkan Elektrik Güç Kablosu */}
      <mesh geometry={powerCordGeo} raycast={() => null}>
        <meshStandardMaterial color="#09090b" roughness={0.75} />
      </mesh>
    </group>
  );
}