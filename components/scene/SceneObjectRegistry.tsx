'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAquariumStore } from '../../store/useAquariumStore';
import { calculateTankZones, evaluateWaterPhase } from '../../lib/simulation/ecosystemEngine';
import { createLepistesGeometry } from '../../models/baliklar/lepistes/LepistesGeometry';
import { createAnubiasGeometry } from '../../models/bitkiler/anubias/AnubiasGeometry';
import SilisKumMesh from '../../models/kumlar/silis-kum/SilisKumMesh';
import IcFiltreMesh from '../../models/malzemeler/ic-filtre/IcFiltreMesh';

interface SceneObjectRegistryProps {
  tankWidth: number;
  tankHeight: number;
  tankDepth: number;
}

export default function SceneObjectRegistry({
  tankWidth,
  tankHeight,
  tankDepth,
}: SceneObjectRegistryProps) {
  const tankCapacity = useAquariumStore((state) => state.tankCapacity);
  const tankItems = useAquariumStore((state) => state.tankItems);
  const ecosystemStatus = useAquariumStore((state) => state.ecosystemStatus);

  // Tank taban ve su yüzeyi sınırları
  const tankBottomY = -tankHeight / 2;
  const waterSurfaceY = tankHeight / 2 - 0.225;

  // Su kirlilik durumu (3 fazlı analiz)
  const waterPhase = useMemo(() => {
    return evaluateWaterPhase(tankCapacity, ecosystemStatus.bioLoad, ecosystemStatus.warnings);
  }, [tankCapacity, ecosystemStatus.bioLoad, ecosystemStatus.warnings]);

  const isCritical = waterPhase.phase === 'critical';
  const deathFactorRef = useRef(0);

  // Toplam kum miktarı (kg)
  const totalSandKg = useMemo(() => {
    return tankItems
      .filter((i) => i.product.category === 'kumlar')
      .reduce((acc, i) => acc + i.quantity, 0);
  }, [tankItems]);

  // Merkezi taban ve 3 katmanlı yüzme bölgesi hesaplaması
  const zones = useMemo(() => {
    return calculateTankZones(tankCapacity, totalSandKg, tankBottomY, waterSurfaceY);
  }, [tankCapacity, totalSandKg, tankBottomY, waterSurfaceY]);

  // Lepistes (Balık) Referans ve Geometrisi
  const lepistesMeshRef = useRef<THREE.InstancedMesh>(null);
  const lepistesItem = useMemo(() => {
    return tankItems.find((i) => i.product.slug === 'lepistes');
  }, [tankItems]);
  const lepistesCount = useMemo(() => {
    return lepistesItem ? lepistesItem.quantity * 5 : 0;
  }, [lepistesItem]);
  const { geometry: lepGeo, material: lepMat } = useMemo(() => createLepistesGeometry(), []);

  // Balığın yüzme bölgesi (varsayılan 'orta')
  const swimZone = lepistesItem?.product.swim_zone || 'orta';
  const [minZoneY, maxZoneY] = zones.zones[swimZone] || zones.zones.orta;

  // Anubias (Bitki) Referans ve Geometrisi
  const anubiasMeshRef = useRef<THREE.InstancedMesh>(null);
  const anubiasCount = useMemo(() => {
    const item = tankItems.find((i) => i.product.slug === 'anubias');
    // Kum yoksa bitkiler gösterilmez
    return item && totalSandKg > 0 ? item.quantity * 4 : 0;
  }, [tankItems, totalSandKg]);
  const { geometry: anuGeo, material: anuMat } = useMemo(() => createAnubiasGeometry(), []);

  // Filtre Var mı Kontrolü
  const hasFilter = useMemo(() => {
    return tankItems.some((i) => i.product.slug === 'ic-filtre' && i.quantity > 0);
  }, [tankItems]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();

    // Kritik fazda ölüm faktörü yavaşça 0 -> 1'e yükselir, durum düzelince 1 -> 0'a iner
    const targetDeath = isCritical ? 1 : 0;
    deathFactorRef.current = THREE.MathUtils.lerp(
      deathFactorRef.current,
      targetDeath,
      delta * 1.6
    );
    const dFactor = deathFactorRef.current;

    // 1. Balıklar: Yönelme (atan2(vx, vz)), kuyruk salınımı, katman sınırları ve ölüm simülasyonu
    if (lepistesMeshRef.current && lepistesCount > 0) {
      const boundX = tankWidth / 2 - 0.45;
      const boundZ = tankDepth / 2 - 0.45;

      for (let i = 0; i < lepistesCount; i++) {
        const normalSpeed = 0.65 + (i % 5) * 0.12;
        // Kritik durumda hareket yavaşlar, yüzeyde akıntı salınımına döner
        const currentSpeed = THREE.MathUtils.lerp(normalSpeed, 0.06, dFactor);
        const phaseX = i * 1.5;
        const phaseZ = i * 2.1 + 0.8;
        const phaseY = i * 1.3;

        // X ve Z koordinatları
        const x = Math.sin(t * currentSpeed + phaseX) * boundX;
        const z = Math.cos(t * (currentSpeed * 0.75) + phaseZ) * boundZ;

        // Anlık hız vektörleri (türevler)
        const vx = Math.cos(t * currentSpeed + phaseX) * (currentSpeed * boundX);
        const vz = -Math.sin(t * (currentSpeed * 0.75) + phaseZ) * (currentSpeed * 0.75 * boundZ);

        // Normal yüzme katmanı Y koordinatı
        const zoneMid = (minZoneY + maxZoneY) / 2;
        const zoneAmp = Math.max(0.04, (maxZoneY - minZoneY) / 2 - 0.035);
        const normalY = zoneMid + Math.sin(t * 1.1 + phaseY) * zoneAmp;

        // Kritik durumda su yüzeyine çıkış (balık ölümü taklidi)
        const surfaceY = waterSurfaceY - 0.04 + Math.sin(t * 1.5 + i) * 0.012;
        const currentY = THREE.MathUtils.lerp(normalY, surfaceY, dFactor);

        dummy.position.set(x, currentY, z);

        // Canlı yüzme yönelimi
        const normalHeading = Math.atan2(vx, vz);
        const normalTail = Math.sin(t * 10 * normalSpeed + i * 2.2) * 0.16;
        const normalRoll = Math.sin(t * 10 * normalSpeed + i * 2.2) * 0.04;
        const normalPitch = -Math.cos(t * 1.1 + phaseY) * 0.08;

        // Ölü balık rotasyonu: 180 derece ters (karın yukarı / Math.PI) ve cansız yüzey salınımı
        const deadRoll = Math.PI + Math.sin(t * 1.8 + i) * 0.08;
        const deadPitch = Math.sin(t * 1.2 + i * 1.5) * 0.05;
        const deadTail = Math.sin(t * 2.0 + i) * 0.015;

        const currentPitch = THREE.MathUtils.lerp(normalPitch, deadPitch, dFactor);
        const currentTail = THREE.MathUtils.lerp(normalTail, deadTail, dFactor);
        const currentRoll = THREE.MathUtils.lerp(normalRoll, deadRoll, dFactor);

        dummy.rotation.set(currentPitch, normalHeading + currentTail, currentRoll);
        dummy.scale.set(0.65, 0.65, 0.65);
        dummy.updateMatrix();

        lepistesMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      lepistesMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // 2. Bitkiler: Kök Y pozisyonu doğrudan sandTopY - 0.01 seviyesine kilitli
    if (anubiasMeshRef.current && anubiasCount > 0) {
      for (let i = 0; i < anubiasCount; i++) {
        const x = -tankWidth / 2 + 0.8 + ((i % 4) * (tankWidth - 1.6)) / 3;
        const z = -tankDepth / 2 + 0.8 + Math.floor(i / 4) * 0.7;

        // Kum seviyesine göre bitki kökü tam kum içine hafifçe gömülür (-0.01)
        dummy.position.set(x, zones.sandTopY - 0.01, Math.min(tankDepth / 2 - 0.5, z));
        dummy.rotation.set(0, 0, Math.sin(t * 1.2 + i) * 0.06);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();

        anubiasMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      anubiasMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* 1. Dinamik Doğal Kum Katmanı */}
      <SilisKumMesh
        tankWidth={tankWidth}
        tankHeight={tankHeight}
        tankDepth={tankDepth}
        tankBottomY={tankBottomY}
        sandTopY={zones.sandTopY}
        sandHeight={zones.sandHeight}
        totalSandKg={totalSandKg}
      />

      {/* 2. İç Filtre Ekipmanı (Tabanı kum üstüne oturur, kabarcıklar su yüzeyinde biter) */}
      {hasFilter && (
        <IcFiltreMesh
          tankWidth={tankWidth}
          tankHeight={tankHeight}
          tankDepth={tankDepth}
          sandTopY={zones.sandTopY}
          waterSurfaceY={waterSurfaceY}
        />
      )}

      {/* 3. Balıklar (Yüzme katmanı içinde ve yüzme yönüne dönük) */}
      {lepistesCount > 0 && (
        <instancedMesh
          ref={lepistesMeshRef}
          args={[lepGeo, lepMat, lepistesCount]}
          castShadow
        />
      )}

      {/* 4. Bitkiler (Kökü kuma kilitli, kum değiştikçe hareket eder) */}
      {anubiasCount > 0 && (
        <instancedMesh
          ref={anubiasMeshRef}
          args={[anuGeo, anuMat, anubiasCount]}
          castShadow
        />
      )}
    </group>
  );
}
