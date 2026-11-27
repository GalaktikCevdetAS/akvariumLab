'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { PlacedSceneItem, TankBounds } from '@/types/aquarium';

interface EquipmentConnectionsAndBubblesProps {
  items: PlacedSceneItem[];
  tankBounds: TankBounds;
}

interface BubbleParticle {
  originX: number;
  originY: number;
  originZ: number;
  x: number;
  y: number;
  z: number;
  speed: number;
  wobblePhase: number;
  wobbleFreq: number;
  scale: number;
}

const _dummy = new THREE.Object3D();
const MAX_BUBBLES = 240;

export function EquipmentConnectionsAndBubbles({
  items,
  tankBounds,
}: EquipmentConnectionsAndBubblesProps) {
  const instancedBubblesRef = useRef<THREE.InstancedMesh>(null);

  const { airPumps, aerators } = useMemo(() => {
    const pumps = items.filter((i) => i.product.sub_category === 'hava-motorlari');
    const stonesAndFilters = items.filter(
      (i) =>
        i.product.sub_category === 'hava-taslari' ||
        i.product.sub_category === 'filtreler'
    );
    return { airPumps: pumps, aerators: stonesAndFilters };
  }, [items]);

  const tubeGeometries = useMemo(() => {
    if (airPumps.length === 0 || aerators.length === 0) return [];

    const airDrivenTargets = aerators.filter(
      (a) =>
        a.product.sub_category === 'hava-taslari' ||
        a.product.needs_air_pump === true
    );
    if (airDrivenTargets.length === 0) return [];

    const primaryPump = airPumps[0];
    const pumpPos = new THREE.Vector3(
      (primaryPump.position?.[0] ?? -tankBounds.width / 2 - 0.78) + 0.18,
      (primaryPump.position?.[1] ?? -tankBounds.height / 2) + 0.14,
      primaryPump.position?.[2] ?? 0
    );

    return airDrivenTargets.map((aerator) => {
      const targetPos = new THREE.Vector3(
        aerator.position?.[0] ?? 0,
        (aerator.position?.[1] ?? tankBounds.substrateTop) + 0.18,
        aerator.position?.[2] ?? 0
      );

      const rimY = tankBounds.height / 2 + 0.08;
      const rimX = -tankBounds.width / 2;

      const curve = new THREE.CatmullRomCurve3([
        pumpPos,
        new THREE.Vector3(pumpPos.x + 0.25, rimY * 0.4, pumpPos.z),
        new THREE.Vector3(rimX, rimY, THREE.MathUtils.lerp(pumpPos.z, targetPos.z, 0.5)),
        new THREE.Vector3(targetPos.x, rimY - 0.15, targetPos.z),
        targetPos,
      ]);

      return new THREE.TubeGeometry(curve, 36, 0.012, 8, false);
    });
  }, [airPumps, aerators, tankBounds]);

  useEffect(() => {
    return () => {
      tubeGeometries.forEach((geo) => geo.dispose());
    };
  }, [tubeGeometries]);

  const hoseMaterial = useMemo(
    () =>
      new THREE.MeshLambertMaterial({
        color: '#cbd5e1',
        transparent: true,
        opacity: 0.52,
        depthWrite: false,
      }),
    []
  );

  const bubbleParticles = useMemo<BubbleParticle[]>(() => {
    const activeAerators = aerators.filter(
      (a) => !a.product.needs_air_pump || airPumps.length > 0
    );
    if (activeAerators.length === 0) return [];

    const perSource = Math.floor(MAX_BUBBLES / activeAerators.length);
    const list: BubbleParticle[] = [];

    activeAerators.forEach((src) => {
      const ox = src.position?.[0] ?? 0;
      const isMotorFilter =
        src.product.sub_category === 'filtreler' && !src.product.needs_air_pump;
      const oy =
        (src.position?.[1] ?? tankBounds.substrateTop) +
        (isMotorFilter ? 0.72 : 0.25);
      const oz = src.position?.[2] ?? 0;

      for (let i = 0; i < perSource; i++) {
        const startY = THREE.MathUtils.lerp(
          oy,
          Math.max(oy + 0.1, tankBounds.waterTop),
          Math.random()
        );
        list.push({
          originX: ox,
          originY: oy,
          originZ: oz,
          x: ox + (Math.random() - 0.5) * 0.12,
          y: startY,
          z: oz + (Math.random() - 0.5) * 0.12,
          speed: 0.75 + Math.random() * 0.55,
          wobblePhase: Math.random() * Math.PI * 2,
          wobbleFreq: 3.5 + Math.random() * 2.5,
          scale: 0.014 + Math.random() * 0.014,
        });
      }
    });

    return list;
  }, [aerators, airPumps.length, tankBounds]);

  useFrame((state, delta) => {
    const mesh = instancedBubblesRef.current;
    if (!mesh || bubbleParticles.length === 0) return;

    const clampedDelta = Math.min(delta, 0.05);
    const elapsed = state.clock.elapsedTime;
    const waterSurface = tankBounds.waterTop;

    for (let i = 0; i < bubbleParticles.length; i++) {
      const p = bubbleParticles[i];
      p.y += p.speed * clampedDelta;

      if (p.y >= waterSurface) {
        p.y = p.originY;
        p.x = p.originX + (Math.random() - 0.5) * 0.1;
        p.z = p.originZ + (Math.random() - 0.5) * 0.1;
      }

      const wobbleX = Math.sin(elapsed * p.wobbleFreq + p.wobblePhase) * 0.025;
      const wobbleZ = Math.cos(elapsed * p.wobbleFreq + p.wobblePhase) * 0.025;

      _dummy.position.set(p.x + wobbleX, p.y, p.z + wobbleZ);
      _dummy.scale.setScalar(p.scale);
      _dummy.updateMatrix();
      mesh.setMatrixAt(i, _dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  useEffect(() => {
    return () => {
      hoseMaterial.dispose();
    };
  }, [hoseMaterial]);

  return (
    <group name="equipment-connections-and-bubbles">
      {tubeGeometries.map((geo, idx) => (
        <mesh
          key={idx}
          geometry={geo}
          material={hoseMaterial}
          raycast={() => null}
        />
      ))}

      {bubbleParticles.length > 0 && (
        <instancedMesh
          ref={instancedBubblesRef}
          args={[undefined, undefined, bubbleParticles.length]}
          frustumCulled={false}
          raycast={() => null}
        >
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial
            color="#e0f2fe"
            transparent
            opacity={0.62}
            depthWrite={false}
          />
        </instancedMesh>
      )}
    </group>
  );
}