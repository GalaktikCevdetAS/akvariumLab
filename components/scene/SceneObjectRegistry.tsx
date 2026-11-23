'use client';

import React, { useMemo, useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useAquariumStore } from '../../store/useAquariumStore';
import SilisKumMesh from '../../models/kumlar/silis-kum/SilisKumMesh';
import IcFiltreMesh from '../../models/malzemeler/ic-filtre/IcFiltreMesh';
import BeyazIsikMesh from '../../models/malzemeler/aydinlatma/BeyazIsikMesh';
import BeyazMaviIsikMesh from '../../models/malzemeler/aydinlatma/BeyazMaviIsikMesh';
import UcRenkIsikMesh from '../../models/malzemeler/aydinlatma/UcRenkIsikMesh';
import {
  buildAnatomicalGuppyAssets,
  GuppySex,
  GuppyTailVariant,
} from '../../models/baliklar/lepistes/lepistesAnatomyBuilder';
import {
  buildAnatomicalBettaAssets,
  BettaSex,
  BettaFinVariant,
} from '../../models/baliklar/beta/betaAnatomyBuilder';
import {
  buildAnatomicalShrimpAssets,
  ShrimpVariant,
} from '../../models/canlilar/karides/karidesAnatomyBuilder';
import {
  buildAnatomicalPlecoAssets,
  PlecoVariant,
} from '../../models/baliklar/vatoz/vatozAnatomyBuilder';
import {
  buildSnailGeometries,
  SnailSpeciesType,
} from '../../models/canlilar/salyangoz/salyangozAnatomyBuilder';

interface SceneObjectRegistryProps {
  tankWidth: number;
  tankHeight: number;
  tankDepth: number;
}

interface FishSpec {
  id: string;
  bodyColor: string;
  finColor: string;
  scale: number;
  speed: number;
  swimZone: 'dip' | 'orta' | 'ust';
}

interface ShrimpSpec {
  bodyColor: string;
  scale: number;
}

interface PlecoSpec {
  bodyColor: string;
  scale: number;
}

interface SnailSpec {
  species: SnailSpeciesType;
  scale: number;
  color: string;
}

// ============================================================================
// 1. LEPİSTES & BETA GRUBU (GÖVDE + YÜZGEÇ + GÖZ + TOKSİSİTE TEPKİSİ)
// ============================================================================
function FishSpeciesGroup({
  assets,
  specs,
  innerHalfW,
  innerHalfD,
  substrateTopY,
  waterTopY,
  isCritical,
}: {
  assets: ReturnType<typeof buildAnatomicalGuppyAssets> | ReturnType<typeof buildAnatomicalBettaAssets>;
  specs: FishSpec[];
  innerHalfW: number;
  innerHalfD: number;
  substrateTopY: number;
  waterTopY: number;
  isCritical: boolean;
}) {
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const finRef = useRef<THREE.InstancedMesh>(null);
  const eyeRef = useRef<THREE.InstancedMesh>(null);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  const agents = useMemo(() => {
    const usableH = Math.max(0.25, waterTopY - substrateTopY - 0.16);
    return specs.map((spec, idx) => {
      const r1 = ((idx * 47 + 13) % 100) / 100;
      const r2 = ((idx * 83 + 29) % 100) / 100;
      const r3 = ((idx * 61 + 7) % 100) / 100;

      let zoneMin = substrateTopY + 0.12;
      let zoneMax = waterTopY - 0.12;
      if (spec.swimZone === 'ust') {
        zoneMin = substrateTopY + usableH * 0.62;
        zoneMax = waterTopY - 0.12;
      } else if (spec.swimZone === 'dip') {
        zoneMin = substrateTopY + 0.10;
        zoneMax = substrateTopY + usableH * 0.40;
      } else {
        zoneMin = substrateTopY + usableH * 0.25;
        zoneMax = substrateTopY + usableH * 0.78;
      }

      const angle = r3 * Math.PI * 2;
      return {
        x: (r1 * 2 - 1) * Math.max(0.2, innerHalfW - 0.35),
        y: zoneMin + r2 * Math.max(0.05, zoneMax - zoneMin),
        z: (r3 * 2 - 1) * Math.max(0.2, innerHalfD - 0.35),
        vx: Math.cos(angle) * spec.speed,
        vy: (r2 - 0.5) * 0.08,
        vz: Math.sin(angle) * spec.speed,
        zoneMin,
        zoneMax,
        turnTimer: 1 + r1 * 3,
      };
    });
  }, [specs, innerHalfW, innerHalfD, substrateTopY, waterTopY]);

  useLayoutEffect(() => {
    if (!bodyRef.current || !finRef.current) return;
    specs.forEach((s, i) => {
      tempColor.set(s.bodyColor);
      bodyRef.current!.setColorAt(i, tempColor);
      tempColor.set(s.finColor);
      finRef.current!.setColorAt(i, tempColor);
    });
    if (bodyRef.current.instanceColor) bodyRef.current.instanceColor.needsUpdate = true;
    if (finRef.current.instanceColor) finRef.current.instanceColor.needsUpdate = true;
  }, [specs, tempColor]);

  useFrame(({ clock }, delta) => {
    if (!bodyRef.current || !finRef.current || !eyeRef.current || specs.length === 0) return;
    assets.updateShaderTime(clock.getElapsedTime());

    const dt = Math.min(delta, 0.05);
    const boundX = Math.max(0.25, innerHalfW - 0.30);
    const boundZ = Math.max(0.25, innerHalfD - 0.30);

    agents.forEach((a, i) => {
      const spec = specs[i];

      if (isCritical) {
        // Toksik suda yüzeye çıkıp ters dönme
        a.y = THREE.MathUtils.lerp(a.y, waterTopY - 0.08, dt * 1.4);
        a.x += Math.sin(clock.getElapsedTime() + i) * 0.01 * dt;
        dummy.position.set(a.x, a.y, a.z);
        dummy.rotation.set(0, Math.atan2(a.vx, a.vz), Math.PI);
      } else {
        a.turnTimer -= dt;
        if (a.turnTimer <= 0) {
          a.turnTimer = 1.5 + ((i * 17) % 10) * 0.3;
          const jitter = (Math.random() - 0.5) * 1.4;
          const curAngle = Math.atan2(a.vz, a.vx) + jitter;
          a.vx = Math.cos(curAngle) * spec.speed;
          a.vz = Math.sin(curAngle) * spec.speed;
          a.vy = (Math.random() - 0.5) * 0.14;
        }

        a.x += a.vx * dt;
        a.y += a.vy * dt;
        a.z += a.vz * dt;

        if (a.x > boundX) { a.x = boundX; a.vx = -Math.abs(a.vx); }
        if (a.x < -boundX) { a.x = -boundX; a.vx = Math.abs(a.vx); }
        if (a.z > boundZ) { a.z = boundZ; a.vz = -Math.abs(a.vz); }
        if (a.z < -boundZ) { a.z = -boundZ; a.vz = Math.abs(a.vz); }
        if (a.y > a.zoneMax) { a.y = a.zoneMax; a.vy = -Math.abs(a.vy); }
        if (a.y < a.zoneMin) { a.y = a.zoneMin; a.vy = Math.abs(a.vy); }

        const yaw = Math.atan2(a.vx, a.vz);
        const pitch = -Math.atan2(a.vy, Math.hypot(a.vx, a.vz) + 0.001) * 0.6;
        dummy.position.set(a.x, a.y, a.z);
        dummy.rotation.set(pitch, yaw, 0);
      }

      dummy.scale.setScalar(spec.scale);
      dummy.updateMatrix();
      bodyRef.current!.setMatrixAt(i, dummy.matrix);
      finRef.current!.setMatrixAt(i, dummy.matrix);
      eyeRef.current!.setMatrixAt(i, dummy.matrix);
    });

    bodyRef.current.instanceMatrix.needsUpdate = true;
    finRef.current.instanceMatrix.needsUpdate = true;
    eyeRef.current.instanceMatrix.needsUpdate = true;
  });

  if (specs.length === 0) return null;

  return (
    <group>
      <instancedMesh
        ref={bodyRef}
        key={`fish-body-${specs.length}`}
        args={[assets.bodyGeometry, assets.bodyMaterial, specs.length]}
        castShadow
      />
      <instancedMesh
        ref={finRef}
        key={`fish-fin-${specs.length}`}
        args={[assets.finGeometry, assets.finMaterial, specs.length]}
      />
      <instancedMesh
        ref={eyeRef}
        key={`fish-eye-${specs.length}`}
        args={[assets.eyeGeometry, assets.eyeMaterial, specs.length]}
      />
    </group>
  );
}

// ============================================================================
// 2. KARİDES GRUBU (TABAN GEZİNTİSİ)
// ============================================================================
function ShrimpGroup({
  variant,
  specs,
  innerHalfW,
  innerHalfD,
  substrateTopY,
  isCritical,
}: {
  variant: ShrimpVariant;
  specs: ShrimpSpec[];
  innerHalfW: number;
  innerHalfD: number;
  substrateTopY: number;
  isCritical: boolean;
}) {
  const assets = useMemo(() => buildAnatomicalShrimpAssets(variant), [variant]);
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const appRef = useRef<THREE.InstancedMesh>(null);
  const eyeRef = useRef<THREE.InstancedMesh>(null);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  const agents = useMemo(() => {
    return specs.map((_, idx) => {
      const r1 = ((idx * 31 + 11) % 100) / 100;
      const r2 = ((idx * 67 + 19) % 100) / 100;
      const ang = r1 * Math.PI * 2;
      return {
        x: (r1 * 2 - 1) * Math.max(0.15, innerHalfW - 0.25),
        z: (r2 * 2 - 1) * Math.max(0.15, innerHalfD - 0.25),
        vx: Math.cos(ang) * 0.14,
        vz: Math.sin(ang) * 0.14,
        timer: 1 + r2 * 2.5,
      };
    });
  }, [specs, innerHalfW, innerHalfD]);

  useLayoutEffect(() => {
    if (!bodyRef.current || !appRef.current) return;
    specs.forEach((s, i) => {
      tempColor.set(s.bodyColor);
      bodyRef.current!.setColorAt(i, tempColor);
      appRef.current!.setColorAt(i, tempColor);
    });
    if (bodyRef.current.instanceColor) bodyRef.current.instanceColor.needsUpdate = true;
    if (appRef.current.instanceColor) appRef.current.instanceColor.needsUpdate = true;
  }, [specs, tempColor]);

  useFrame(({ clock }, delta) => {
    if (!bodyRef.current || !appRef.current || !eyeRef.current || specs.length === 0) return;
    assets.updateShaderTime(clock.getElapsedTime());
    const dt = Math.min(delta, 0.05);
    const boundX = Math.max(0.15, innerHalfW - 0.22);
    const boundZ = Math.max(0.15, innerHalfD - 0.22);

    agents.forEach((a, i) => {
      const spec = specs[i];
      if (isCritical) {
        dummy.position.set(a.x, substrateTopY + 0.015, a.z);
        dummy.rotation.set(0, Math.atan2(a.vx, a.vz), Math.PI * 0.5);
      } else {
        a.timer -= dt;
        if (a.timer <= 0) {
          a.timer = 1.2 + Math.random() * 2.5;
          const ang = Math.random() * Math.PI * 2;
          a.vx = Math.cos(ang) * 0.14;
          a.vz = Math.sin(ang) * 0.14;
        }
        a.x += a.vx * dt;
        a.z += a.vz * dt;
        if (a.x > boundX || a.x < -boundX) a.vx *= -1;
        if (a.z > boundZ || a.z < -boundZ) a.vz *= -1;
        a.x = THREE.MathUtils.clamp(a.x, -boundX, boundX);
        a.z = THREE.MathUtils.clamp(a.z, -boundZ, boundZ);

        dummy.position.set(a.x, substrateTopY + 0.022 * spec.scale, a.z);
        dummy.rotation.set(0, Math.atan2(a.vx, a.vz), 0);
      }
      dummy.scale.setScalar(spec.scale);
      dummy.updateMatrix();
      bodyRef.current!.setMatrixAt(i, dummy.matrix);
      appRef.current!.setMatrixAt(i, dummy.matrix);
      eyeRef.current!.setMatrixAt(i, dummy.matrix);
    });

    bodyRef.current.instanceMatrix.needsUpdate = true;
    appRef.current.instanceMatrix.needsUpdate = true;
    eyeRef.current.instanceMatrix.needsUpdate = true;
  });

  if (specs.length === 0) return null;

  return (
    <group>
      <instancedMesh
        ref={bodyRef}
        key={`shrimp-body-${variant}-${specs.length}`}
        args={[assets.bodyGeometry, assets.bodyMaterial, specs.length]}
        castShadow
      />
      <instancedMesh
        ref={appRef}
        key={`shrimp-app-${variant}-${specs.length}`}
        args={[assets.appendageGeometry, assets.appendageMaterial, specs.length]}
      />
      <instancedMesh
        ref={eyeRef}
        key={`shrimp-eye-${variant}-${specs.length}`}
        args={[assets.eyeGeometry, assets.eyeMaterial, specs.length]}
      />
    </group>
  );
}

// ============================================================================
// 3. VATOZ GRUBU (TABAN VANTUZ GEZİNTİSİ)
// ============================================================================
function PlecoGroup({
  variant,
  specs,
  innerHalfW,
  innerHalfD,
  substrateTopY,
  isCritical,
}: {
  variant: PlecoVariant;
  specs: PlecoSpec[];
  innerHalfW: number;
  innerHalfD: number;
  substrateTopY: number;
  isCritical: boolean;
}) {
  const assets = useMemo(() => buildAnatomicalPlecoAssets(variant), [variant]);
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const finRef = useRef<THREE.InstancedMesh>(null);
  const eyeRef = useRef<THREE.InstancedMesh>(null);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  const agents = useMemo(() => {
    return specs.map((_, idx) => {
      const r1 = ((idx * 59 + 17) % 100) / 100;
      const r2 = ((idx * 43 + 23) % 100) / 100;
      const ang = r1 * Math.PI * 2;
      return {
        x: (r1 * 2 - 1) * Math.max(0.2, innerHalfW - 0.35),
        z: (r2 * 2 - 1) * Math.max(0.2, innerHalfD - 0.35),
        vx: Math.cos(ang) * 0.16,
        vz: Math.sin(ang) * 0.16,
        timer: 2 + r1 * 3,
      };
    });
  }, [specs, innerHalfW, innerHalfD]);

  useLayoutEffect(() => {
    if (!bodyRef.current || !finRef.current) return;
    specs.forEach((s, i) => {
      tempColor.set(s.bodyColor);
      bodyRef.current!.setColorAt(i, tempColor);
      finRef.current!.setColorAt(i, tempColor);
    });
    if (bodyRef.current.instanceColor) bodyRef.current.instanceColor.needsUpdate = true;
    if (finRef.current.instanceColor) finRef.current.instanceColor.needsUpdate = true;
  }, [specs, tempColor]);

  useFrame(({ clock }, delta) => {
    if (!bodyRef.current || !finRef.current || !eyeRef.current || specs.length === 0) return;
    assets.updateShaderTime(clock.getElapsedTime());
    const dt = Math.min(delta, 0.05);
    const boundX = Math.max(0.2, innerHalfW - 0.32);
    const boundZ = Math.max(0.2, innerHalfD - 0.32);

    agents.forEach((a, i) => {
      const spec = specs[i];
      if (isCritical) {
        dummy.position.set(a.x, substrateTopY + 0.02, a.z);
        dummy.rotation.set(0, Math.atan2(a.vx, a.vz), Math.PI);
      } else {
        a.timer -= dt;
        if (a.timer <= 0) {
          a.timer = 2.5 + Math.random() * 3.5;
          const ang = Math.random() * Math.PI * 2;
          a.vx = Math.cos(ang) * 0.16;
          a.vz = Math.sin(ang) * 0.16;
        }
        a.x += a.vx * dt;
        a.z += a.vz * dt;
        if (a.x > boundX || a.x < -boundX) a.vx *= -1;
        if (a.z > boundZ || a.z < -boundZ) a.vz *= -1;
        a.x = THREE.MathUtils.clamp(a.x, -boundX, boundX);
        a.z = THREE.MathUtils.clamp(a.z, -boundZ, boundZ);

        dummy.position.set(a.x, substrateTopY + 0.004, a.z);
        dummy.rotation.set(0, Math.atan2(a.vx, a.vz), 0);
      }
      dummy.scale.setScalar(spec.scale);
      dummy.updateMatrix();
      bodyRef.current!.setMatrixAt(i, dummy.matrix);
      finRef.current!.setMatrixAt(i, dummy.matrix);
      eyeRef.current!.setMatrixAt(i, dummy.matrix);
    });

    bodyRef.current.instanceMatrix.needsUpdate = true;
    finRef.current.instanceMatrix.needsUpdate = true;
    eyeRef.current.instanceMatrix.needsUpdate = true;
  });

  if (specs.length === 0) return null;

  return (
    <group>
      <instancedMesh
        ref={bodyRef}
        key={`pleco-body-${variant}-${specs.length}`}
        args={[assets.bodyGeometry, assets.bodyMaterial, specs.length]}
        castShadow
      />
      <instancedMesh
        ref={finRef}
        key={`pleco-fin-${variant}-${specs.length}`}
        args={[assets.finGeometry, assets.finMaterial, specs.length]}
      />
      <instancedMesh
        ref={eyeRef}
        key={`pleco-eye-${variant}-${specs.length}`}
        args={[assets.eyeGeometry, assets.eyeMaterial, specs.length]}
      />
    </group>
  );
}

// ============================================================================
// 4. SALYANGOZ GRUBU (TÜR BAZLI: ELMA SALYANGOZU & ZEBRA NERİTE - İÇ CAM SINIRLI)
// ============================================================================
function SnailSpeciesInstancedGroup({
  species,
  specs,
  innerHalfW,
  innerHalfD,
  substrateTopY,
  waterTopY,
  isCritical,
  indexOffset,
}: {
  species: SnailSpeciesType;
  specs: SnailSpec[];
  innerHalfW: number;
  innerHalfD: number;
  substrateTopY: number;
  waterTopY: number;
  isCritical: boolean;
  indexOffset: number;
}) {
  const shellRef = useRef<THREE.InstancedMesh>(null);
  const bodyRef = useRef<THREE.InstancedMesh>(null);

  const geo = useMemo(() => buildSnailGeometries(species), [species]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  const agents = useMemo(() => {
    const safeMinY = substrateTopY + 0.08;
    const safeMaxY = Math.max(safeMinY + 0.1, waterTopY - 0.12);
    const wallMargin = 0.06;

    return specs.map((_, idx) => {
      const globalIdx = idx + indexOffset;
      // 0: Arka cam iç yüzeyi, 1: Sol cam iç yüzeyi, 2: Sağ cam iç yüzeyi, 3: Taban kumu
      const surface = globalIdx % 4;
      const randA = ((globalIdx * 37 + 19) % 100) / 100;
      const randB = ((globalIdx * 73 + 41) % 100) / 100;

      let x = 0;
      let y = safeMinY + randB * (safeMaxY - safeMinY);
      let z = 0;

      if (surface === 0) {
        x = (randA * 2 - 1) * Math.max(0.1, innerHalfW - 0.12);
        z = -innerHalfD + wallMargin;
      } else if (surface === 1) {
        x = -innerHalfW + wallMargin;
        z = (randA * 2 - 1) * Math.max(0.1, innerHalfD - 0.12);
      } else if (surface === 2) {
        x = innerHalfW - wallMargin;
        z = (randA * 2 - 1) * Math.max(0.1, innerHalfD - 0.12);
      } else {
        x = (randA * 2 - 1) * Math.max(0.1, innerHalfW - 0.14);
        z = (randB * 2 - 1) * Math.max(0.1, innerHalfD - 0.14);
        y = substrateTopY + 0.005;
      }

      return {
        surface,
        x,
        y,
        z,
        vx: (randA - 0.5) * 0.04,
        vy: (randB - 0.5) * 0.035,
        vz: (randA - 0.5) * 0.04,
        phase: globalIdx * 1.7,
      };
    });
  }, [specs, innerHalfW, innerHalfD, substrateTopY, waterTopY, indexOffset]);

  useLayoutEffect(() => {
    if (!shellRef.current || !bodyRef.current) return;
    specs.forEach((spec, i) => {
      tempColor.set(spec.color);
      shellRef.current!.setColorAt(i, tempColor);
      tempColor.set(species === 'nerite' ? '#3f3f46' : '#eab308');
      bodyRef.current!.setColorAt(i, tempColor);
    });
    if (shellRef.current.instanceColor) shellRef.current.instanceColor.needsUpdate = true;
    if (bodyRef.current.instanceColor) bodyRef.current.instanceColor.needsUpdate = true;
  }, [specs, species, tempColor]);

  useFrame((_, delta) => {
    if (!shellRef.current || !bodyRef.current || specs.length === 0) return;

    const dt = Math.min(delta, 0.05);
    const safeMinY = substrateTopY + 0.08;
    const safeMaxY = Math.max(safeMinY + 0.1, waterTopY - 0.12);
    const wallMargin = 0.06;
    const maxX = Math.max(0.1, innerHalfW - 0.12);
    const maxZ = Math.max(0.1, innerHalfD - 0.12);

    agents.forEach((a, i) => {
      const spec = specs[i];

      if (isCritical) {
        a.y = THREE.MathUtils.lerp(a.y, substrateTopY + 0.008, dt * 1.5);
        dummy.position.set(a.x, a.y, a.z);
        dummy.rotation.set(0, a.phase, Math.PI * 0.48);
      } else if (a.surface === 0) {
        // Arka cam iç yüzeyi
        a.x += a.vx * dt;
        a.y += a.vy * dt;
        if (a.x > maxX || a.x < -maxX) a.vx *= -1;
        if (a.y > safeMaxY || a.y < safeMinY) a.vy *= -1;
        a.x = THREE.MathUtils.clamp(a.x, -maxX, maxX);
        a.y = THREE.MathUtils.clamp(a.y, safeMinY, safeMaxY);
        a.z = -innerHalfD + wallMargin;

        dummy.position.set(a.x, a.y, a.z);
        dummy.rotation.set(Math.PI / 2, Math.atan2(a.vx, a.vy), 0);
      } else if (a.surface === 1) {
        // Sol cam iç yüzeyi
        a.z += a.vz * dt;
        a.y += a.vy * dt;
        if (a.z > maxZ || a.z < -maxZ) a.vz *= -1;
        if (a.y > safeMaxY || a.y < safeMinY) a.vy *= -1;
        a.z = THREE.MathUtils.clamp(a.z, -maxZ, maxZ);
        a.y = THREE.MathUtils.clamp(a.y, safeMinY, safeMaxY);
        a.x = -innerHalfW + wallMargin;

        dummy.position.set(a.x, a.y, a.z);
        dummy.rotation.set(0, 0, -Math.PI / 2);
      } else if (a.surface === 2) {
        // Sağ cam iç yüzeyi
        a.z += a.vz * dt;
        a.y += a.vy * dt;
        if (a.z > maxZ || a.z < -maxZ) a.vz *= -1;
        if (a.y > safeMaxY || a.y < safeMinY) a.vy *= -1;
        a.z = THREE.MathUtils.clamp(a.z, -maxZ, maxZ);
        a.y = THREE.MathUtils.clamp(a.y, safeMinY, safeMaxY);
        a.x = innerHalfW - wallMargin;

        dummy.position.set(a.x, a.y, a.z);
        dummy.rotation.set(0, 0, Math.PI / 2);
      } else {
        // Taban kumu üzeri
        a.x += a.vx * dt;
        a.z += a.vz * dt;
        if (a.x > maxX || a.x < -maxX) a.vx *= -1;
        if (a.z > maxZ || a.z < -maxZ) a.vz *= -1;
        a.x = THREE.MathUtils.clamp(a.x, -maxX, maxX);
        a.z = THREE.MathUtils.clamp(a.z, -maxZ, maxZ);
        a.y = substrateTopY + 0.005;

        dummy.position.set(a.x, a.y, a.z);
        dummy.rotation.set(0, Math.atan2(a.vx, a.vz), 0);
      }

      dummy.scale.setScalar(spec.scale);
      dummy.updateMatrix();
      shellRef.current!.setMatrixAt(i, dummy.matrix);
      bodyRef.current!.setMatrixAt(i, dummy.matrix);
    });

    shellRef.current.instanceMatrix.needsUpdate = true;
    bodyRef.current.instanceMatrix.needsUpdate = true;
  });

  if (specs.length === 0) return null;

  return (
    <group>
      <instancedMesh
        ref={shellRef}
        key={`snail-shell-${species}-${specs.length}`}
        args={[geo.shellGeometry, undefined, specs.length]}
        castShadow
      >
        <meshStandardMaterial vertexColors roughness={0.35} metalness={0.08} />
      </instancedMesh>
      <instancedMesh
        ref={bodyRef}
        key={`snail-body-${species}-${specs.length}`}
        args={[geo.bodyGeometry, undefined, specs.length]}
      >
        <meshStandardMaterial roughness={0.75} />
      </instancedMesh>
    </group>
  );
}

// ============================================================================
// ANA SAHNE KAYIT DEFTERİ
// ============================================================================
export default function SceneObjectRegistry({
  tankWidth,
  tankHeight,
  tankDepth,
}: SceneObjectRegistryProps) {
  const tankItems = useAquariumStore((state) => state.tankItems);
  const lightHours = useAquariumStore((state) => state.lightHours);
  const isCritical = useAquariumStore(
    (state) => state.ecosystemStatus.waterVisuals.isLethal
  );

  // Tank ölçeği: 1 sahne birimi = 10 cm (50L tank: 5.0 x 3.5 x 3.0)
  const glassThickness = 0.04;
  const innerW = tankWidth - glassThickness * 2;
  const innerD = tankDepth - glassThickness * 2;
  const innerHalfW = innerW / 2;
  const innerHalfD = innerD / 2;

  const bottomInnerY = -tankHeight / 2 + glassThickness;
  // AnimatedAquariumWater yüksekliği: tankHeight - 0.25, merkezi y = -0.1 => üst yüzey:
  const waterTopY = -0.1 + (tankHeight - 0.25) / 2;

  // 1. KUM HESABI (Her adet = 1 kg)
  const { totalSandKg, sandType, sandHeight } = useMemo(() => {
    let kg = 0;
    let type: 'silis' | 'hagen' | 'aktif-toprak' = 'silis';

    tankItems.forEach((item) => {
      if (item.product.category === 'kumlar' && item.product.sub_category !== 'dekor') {
        kg += item.quantity;
        if (item.product.slug.includes('hagen') || item.product.slug.includes('siyah')) {
          type = 'hagen';
        } else if (item.product.sub_category === 'aktif-toprak' || item.product.slug.includes('aktif')) {
          type = 'aktif-toprak';
        }
      }
    });

    // 1 kg kum = 0.65 L = 0.00065 m3 => sahne birimi (1 birim = 0.1m => 1 m3 = 1000 birim^3)
    const sandVolScene = kg * 0.65;
    const h = Math.min(tankHeight * 0.32, sandVolScene / Math.max(0.1, innerW * innerD));
    return { totalSandKg: kg, sandType: type, sandHeight: h };
  }, [tankItems, innerW, innerD, tankHeight]);

  const substrateTopY = bottomInnerY + sandHeight;

  // 2. CANLILARI TÜRLERİNE GÖRE AYRIŞTIR
  const {
    guppyGroups,
    bettaGroups,
    shrimpGroups,
    plecoGroups,
    elmaSnails,
    neriteSnails,
  } = useMemo(() => {
    const guppies: Record<string, FishSpec[]> = {};
    const bettas: Record<string, FishSpec[]> = {};
    const shrimps: Record<ShrimpVariant, ShrimpSpec[]> = {
      neocaridina: [],
      rilli: [],
      amano: [],
    };
    const plecos: Record<PlecoVariant, PlecoSpec[]> = {
      cuce: [],
      leopar: [],
    };
    const elma: SnailSpec[] = [];
    const nerite: SnailSpec[] = [];

    tankItems.forEach((item) => {
      if (item.quantity <= 0 || item.product.category !== 'canlilar') return;
      const p = item.product;
      const slug = p.slug.toLowerCase();
      const name = p.name.toLowerCase();

      // A. SALYANGOZLAR (Elma + Zebra Nerite)
      if (
        p.sub_category === 'kabuklular' ||
        slug.includes('salyangoz') ||
        slug.includes('nerite') ||
        slug.includes('elma') ||
        name.includes('salyangoz') ||
        name.includes('nerite')
      ) {
        const isNerite = slug.includes('nerite') || name.includes('nerite');
        for (let q = 0; q < item.quantity; q++) {
          if (isNerite) {
            nerite.push({
              species: 'nerite',
              scale: 4.5, // Sahne ölçeğine (1 birim = 10cm) uygun ~2.5 cm kabuk boyu
              color: '#ffffff',
            });
          } else {
            elma.push({
              species: 'elma',
              scale: 5.5,
              color: slug.includes('mavi')
                ? '#60a5fa'
                : slug.includes('fildisi') || slug.includes('beyaz')
                ? '#fef3c7'
                : p.color || '#fbbf24',
            });
          }
        }
        return;
      }

      // B. KARİDESLER
      if (p.sub_category === 'karidesler' || slug.includes('karides') || slug.includes('shrimp')) {
        const v: ShrimpVariant = slug.includes('amano')
          ? 'amano'
          : slug.includes('rilli') || slug.includes('rili')
          ? 'rilli'
          : 'neocaridina';
        for (let q = 0; q < item.quantity; q++) {
          shrimps[v].push({
            bodyColor: p.color || '#ef4444',
            scale: v === 'amano' ? 1.15 : 0.95,
          });
        }
        return;
      }

      // C. VATOZLAR
      if (slug.includes('vatoz') || slug.includes('pleco') || name.includes('vatoz')) {
        const pv: PlecoVariant = slug.includes('leopar') ? 'leopar' : 'cuce';
        for (let q = 0; q < item.quantity; q++) {
          plecos[pv].push({
            bodyColor: p.color || '#5c4033',
            scale: pv === 'leopar' ? 1.45 : 1.1,
          });
        }
        return;
      }

      // D. BETA BALIKLARI
      if (p.species === 'beta' || slug.startsWith('beta') || name.includes('beta')) {
        const sex: BettaSex = slug.includes('disi') ? 'disi' : 'erkek';
        const finVar: BettaFinVariant = slug.includes('crowntail')
          ? 'crowntail'
          : slug.includes('plakat')
          ? 'plakat'
          : slug.includes('dumbo')
          ? 'dumbo'
          : sex === 'disi'
          ? 'round'
          : 'halfmoon';
        const key = `${sex}-${finVar}`;
        if (!bettas[key]) bettas[key] = [];

        for (let q = 0; q < item.quantity; q++) {
          bettas[key].push({
            id: `${p.id}-${q}`,
            bodyColor: p.color || '#2563eb',
            finColor: p.fin_color || p.color || '#3b82f6',
            scale: slug.includes('yavru') ? 0.65 : sex === 'disi' ? 0.95 : 1.15,
            speed: 0.35,
            swimZone: p.swim_zone || 'ust',
          });
        }
        return;
      }

      // E. LEPİSTES VE DİĞER BALIKLAR
      const sex: GuppySex = slug.includes('disi') ? 'disi' : 'erkek';
      const tailVar: GuppyTailVariant = slug.includes('double-sword')
        ? 'double-sword'
        : slug.includes('lyra')
        ? 'lyra'
        : sex === 'disi'
        ? 'round'
        : 'delta';
      const key = `${sex}-${tailVar}`;
      if (!guppies[key]) guppies[key] = [];

      for (let q = 0; q < item.quantity; q++) {
        guppies[key].push({
          id: `${p.id}-${q}`,
          bodyColor: p.color || '#ff6b6b',
          finColor: p.fin_color || p.color || '#f97316',
          scale: slug.includes('yavru') ? 0.55 : sex === 'disi' ? 1.05 : 0.95,
          speed: 0.55,
          swimZone: p.swim_zone || 'orta',
        });
      }
    });

    return {
      guppyGroups: guppies,
      bettaGroups: bettas,
      shrimpGroups: shrimps,
      plecoGroups: plecos,
      elmaSnails: elma,
      neriteSnails: nerite,
    };
  }, [tankItems]);

  // Prosedürel Balık Varlıkları (Cache)
  const guppyAssetsMap = useMemo(() => {
    const map: Record<string, ReturnType<typeof buildAnatomicalGuppyAssets>> = {};
    Object.keys(guppyGroups).forEach((key) => {
      const [sex, tail] = key.split('-') as [GuppySex, GuppyTailVariant];
      map[key] = buildAnatomicalGuppyAssets(sex, tail || 'delta');
    });
    return map;
  }, [guppyGroups]);

  const bettaAssetsMap = useMemo(() => {
    const map: Record<string, ReturnType<typeof buildAnatomicalBettaAssets>> = {};
    Object.keys(bettaGroups).forEach((key) => {
      const [sex, fin] = key.split('-') as [BettaSex, BettaFinVariant];
      map[key] = buildAnatomicalBettaAssets(sex, fin || 'halfmoon');
    });
    return map;
  }, [bettaGroups]);

  // 3. BİTKİLER
  const plantPositions = useMemo(() => {
    const list: Array<{ x: number; z: number; scale: number; color: string }> = [];
    let seed = 1;

    tankItems.forEach((item) => {
      if (item.product.category !== 'bitkiler' || item.quantity <= 0) return;
      const slug = item.product.slug.toLowerCase();

      for (let q = 0; q < item.quantity; q++) {
        seed += 23;
        const rx = ((seed * 31) % 100) / 100;
        const rz = ((seed * 53) % 100) / 100;
        list.push({
          x: (rx * 2 - 1) * Math.max(0.2, innerHalfW - 0.35),
          z: (rz * 2 - 1) * Math.max(0.2, innerHalfD - 0.35),
          scale: 0.85 + (seed % 5) * 0.12,
          color:
            slug.includes('alternanthera') || slug.includes('kirmizi')
              ? '#b91c1c'
              : slug.includes('moss')
              ? '#15803d'
              : item.product.color || '#16a34a',
        });
      }
    });

    return list;
  }, [tankItems, innerHalfW, innerHalfD]);

  // 4. FİLTRE MOTORLARI
  const hasFilterMotor = useMemo(() => {
    return tankItems.some(
      (i) =>
        i.quantity > 0 &&
        (i.product.sub_category === 'motorlar' || i.product.slug.includes('filtre'))
    );
  }, [tankItems]);

  // 5. LED AYDINLATMA ARMATÜRLERİ
  const lightFixtures = useMemo(() => {
    const fixtures: Array<{
      key: string;
      spectrum: string;
      lengthCm: number;
      kelvin: number;
      lumen: number;
    }> = [];

    tankItems.forEach((item) => {
      if (
        item.quantity > 0 &&
        (item.product.sub_category === 'isiklar' || item.product.lumen > 0)
      ) {
        for (let q = 0; q < item.quantity; q++) {
          fixtures.push({
            key: `${item.product.id}-${q}`,
            spectrum: item.product.light_spectrum || 'beyaz',
            lengthCm: item.product.length_cm || 50,
            kelvin: item.product.kelvin || 6500,
            lumen: item.product.lumen || 800,
          });
        }
      }
    });

    return fixtures;
  }, [tankItems]);

  return (
    <group>
      {/* Taban Kumu */}
      <SilisKumMesh
        tankWidth={tankWidth}
        tankDepth={tankDepth}
        tankHeight={tankHeight}
        totalSandKg={totalSandKg}
        sandType={sandType}
      />

      {/* Lepistes Grupları */}
      {Object.entries(guppyGroups).map(([key, specs]) => (
        <FishSpeciesGroup
          key={`guppy-${key}`}
          assets={guppyAssetsMap[key]}
          specs={specs}
          innerHalfW={innerHalfW}
          innerHalfD={innerHalfD}
          substrateTopY={substrateTopY}
          waterTopY={waterTopY}
          isCritical={isCritical}
        />
      ))}

      {/* Beta Grupları */}
      {Object.entries(bettaGroups).map(([key, specs]) => (
        <FishSpeciesGroup
          key={`betta-${key}`}
          assets={bettaAssetsMap[key]}
          specs={specs}
          innerHalfW={innerHalfW}
          innerHalfD={innerHalfD}
          substrateTopY={substrateTopY}
          waterTopY={waterTopY}
          isCritical={isCritical}
        />
      ))}

      {/* Karides Grupları */}
      {(['neocaridina', 'rilli', 'amano'] as ShrimpVariant[]).map((variant) => (
        <ShrimpGroup
          key={`shrimp-${variant}`}
          variant={variant}
          specs={shrimpGroups[variant]}
          innerHalfW={innerHalfW}
          innerHalfD={innerHalfD}
          substrateTopY={substrateTopY}
          isCritical={isCritical}
        />
      ))}

      {/* Vatoz Grupları */}
      {(['cuce', 'leopar'] as PlecoVariant[]).map((variant) => (
        <PlecoGroup
          key={`pleco-${variant}`}
          variant={variant}
          specs={plecoGroups[variant]}
          innerHalfW={innerHalfW}
          innerHalfD={innerHalfD}
          substrateTopY={substrateTopY}
          isCritical={isCritical}
        />
      ))}

      {/* Elma Salyangozları (Cam iç yüzeyi + taban) */}
      <SnailSpeciesInstancedGroup
        species="elma"
        specs={elmaSnails}
        innerHalfW={innerHalfW}
        innerHalfD={innerHalfD}
        substrateTopY={substrateTopY}
        waterTopY={waterTopY}
        isCritical={isCritical}
        indexOffset={0}
      />

      {/* Zebra Nerite Salyangozları (Cam iç yüzeyi + taban) */}
      <SnailSpeciesInstancedGroup
        species="nerite"
        specs={neriteSnails}
        innerHalfW={innerHalfW}
        innerHalfD={innerHalfD}
        substrateTopY={substrateTopY}
        waterTopY={waterTopY}
        isCritical={isCritical}
        indexOffset={elmaSnails.length + 1}
      />

      {/* Bitkiler */}
      {plantPositions.map((p, idx) => (
        <group key={`plant-${idx}`} position={[p.x, substrateTopY, p.z]} scale={p.scale}>
          {[0, 1.1, 2.2, 3.3, 4.4].map((angle, leafIdx) => (
            <mesh
              key={leafIdx}
              position={[
                Math.cos(angle) * 0.09,
                0.22 + leafIdx * 0.05,
                Math.sin(angle) * 0.09,
              ]}
              rotation={[0.45, angle, 0.2]}
              castShadow
            >
              <sphereGeometry args={[0.14, 10, 8]} />
              <meshStandardMaterial color={p.color} roughness={0.65} />
            </mesh>
          ))}
        </group>
      ))}

      {/* İç Filtre & Hava Kabarcıkları */}
      {hasFilterMotor && (
        <IcFiltreMesh
          tankWidth={tankWidth}
          tankHeight={tankHeight}
          tankDepth={tankDepth}
          sandTopY={substrateTopY}
          waterSurfaceY={waterTopY}
        />
      )}

      {/* Üst LED Aydınlatma Armatürleri */}
      {lightFixtures.map((lf, idx) => {
        if (lf.spectrum === 'uc-renk') {
          return (
            <UcRenkIsikMesh
              key={lf.key}
              lengthCm={lf.lengthCm}
              tankWidth={tankWidth}
              tankHeight={tankHeight}
              kelvin={lf.kelvin}
              lumen={lf.lumen}
              lightHours={lightHours}
              slotIndex={idx}
            />
          );
        }
        if (lf.spectrum === 'beyaz-mavi') {
          return (
            <BeyazMaviIsikMesh
              key={lf.key}
              lengthCm={lf.lengthCm}
              tankWidth={tankWidth}
              tankHeight={tankHeight}
              kelvin={lf.kelvin}
              lumen={lf.lumen}
              lightHours={lightHours}
              slotIndex={idx}
            />
          );
        }
        return (
          <BeyazIsikMesh
            key={lf.key}
            lengthCm={lf.lengthCm}
            tankWidth={tankWidth}
            tankHeight={tankHeight}
            kelvin={lf.kelvin}
            lumen={lf.lumen}
            lightHours={lightHours}
            slotIndex={idx}
          />
        );
      })}
    </group>
  );
}