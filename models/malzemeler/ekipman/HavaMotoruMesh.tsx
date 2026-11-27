'use client';

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { PlacedEquipment } from '../../../store/useAquariumStore';

interface HavaMotoruMeshProps {
  item: PlacedEquipment;
  isActive: boolean;
}

export default function HavaMotoruMesh({ item, isActive }: HavaMotoruMeshProps) {
  const bodyGroupRef = useRef<THREE.Group>(null);
  const outletCount = item.product.outlet_count ?? 1;
  const isDual = outletCount >= 2;
  const watt = item.product.watt ?? 3;
  const scaleBoost = watt >= 5 ? 1.15 : 1.0;

  useFrame(({ clock }) => {
    if (!bodyGroupRef.current) return;
    if (isActive) {
      const t = clock.getElapsedTime();
      bodyGroupRef.current.position.x = Math.sin(t * 75) * 0.0022;
      bodyGroupRef.current.position.z = Math.cos(t * 82) * 0.0022;
    } else {
      bodyGroupRef.current.position.set(0, 0, 0);
    }
  });

  const bodyW = isDual ? 0.38 : 0.31;
  const bodyH = isDual ? 0.23 : 0.20;
  const bodyD = isDual ? 0.50 : 0.39;

  const cordGeo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-bodyW / 2 - 0.01, 0.075, 0),
      new THREE.Vector3(-bodyW / 2 - 0.12, 0.03, 0.04),
      new THREE.Vector3(-bodyW / 2 - 0.24, 0.012, 0.14),
    ]);
    return new THREE.TubeGeometry(curve, 16, 0.011, 8, false);
  }, [bodyW]);

  return (
    <group scale={scaleBoost}>
      {/* 4 Adet Kauçuk Titreşim Emici Ayak */}
      {[
        [-bodyW * 0.36, 0.016, -bodyD * 0.35],
        [bodyW * 0.36, 0.016, -bodyD * 0.35],
        [-bodyW * 0.36, 0.016, bodyD * 0.35],
        [bodyW * 0.36, 0.016, bodyD * 0.35],
      ].map(([fx, fy, fz], idx) => (
        <mesh key={idx} position={[fx, fy, fz]} castShadow>
          <cylinderGeometry args={[0.026, 0.034, 0.032, 16]} />
          <meshStandardMaterial color="#09090b" roughness={0.95} />
        </mesh>
      ))}

      {/* Titreşen Ana Motor Gövdesi */}
      <group ref={bodyGroupRef}>
        {/* Alt Şasi Gövdesi */}
        <mesh position={[0, 0.032 + bodyH * 0.42, 0]} castShadow receiveShadow>
          <boxGeometry args={[bodyW, bodyH * 0.84, bodyD]} />
          <meshStandardMaterial color="#1e293b" roughness={0.40} metalness={0.25} />
        </mesh>

        {/* Orta Sızdırmazlık Kauçuk Şeridi */}
        <mesh position={[0, 0.032 + bodyH * 0.84, 0]}>
          <boxGeometry args={[bodyW * 1.01, 0.014, bodyD * 1.01]} />
          <meshStandardMaterial color="#0f172a" roughness={0.85} />
        </mesh>

        {/* Üst Aerodinamik Kapak */}
        <mesh position={[0, 0.032 + bodyH * 0.96, 0]} castShadow>
          <boxGeometry args={[bodyW * 0.88, bodyH * 0.24, bodyD * 0.90]} />
          <meshStandardMaterial
            color={isDual ? '#0369a1' : '#0284c7'}
            roughness={0.28}
            metalness={0.38}
          />
        </mesh>

        {/* Yan Soğutma / Hava Emiş Izgaraları */}
        {[-0.09, -0.03, 0.03, 0.09].map((gz, idx) => (
          <mesh key={idx} position={[0, 0.032 + bodyH * 0.45, gz]}>
            <boxGeometry args={[bodyW + 0.006, bodyH * 0.45, 0.014]} />
            <meshStandardMaterial color="#09090b" roughness={0.7} />
          </mesh>
        ))}

        {/* Üst Marka Plakası & LED Güç Göstergesi */}
        <mesh position={[0.02, 0.032 + bodyH * 1.09, 0]}>
          <boxGeometry args={[bodyW * 0.42, 0.006, bodyD * 0.48]} />
          <meshStandardMaterial color="#0f172a" roughness={0.3} />
        </mesh>
        <mesh position={[-bodyW * 0.24, 0.032 + bodyH * 1.09, 0]}>
          <sphereGeometry args={[0.014, 12, 12]} />
          <meshStandardMaterial
            color={isActive ? '#22c55e' : '#64748b'}
            emissive={isActive ? '#22c55e' : '#000000'}
            emissiveIntensity={isActive ? 2.4 : 0}
          />
        </mesh>

        {/* Sol Tarafta Güç Kablosu Rakoru ve Kablosu */}
        <mesh
          position={[-bodyW / 2 - 0.02, 0.075, 0]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.016, 0.022, 0.045, 12]} />
          <meshStandardMaterial color="#09090b" roughness={0.8} />
        </mesh>
        <mesh geometry={cordGeo} raycast={() => null}>
          <meshStandardMaterial color="#09090b" roughness={0.75} />
        </mesh>

        {/* Sağ Tarafta (Akvaryuma Bakan Yüz) Krom Hava Çıkış Nozulları */}
        {isDual ? (
          <>
            {[-0.085, 0.085].map((nz, idx) => (
              <group key={idx} position={[bodyW / 2 + 0.035, 0.032 + bodyH * 0.55, nz]}>
                <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                  <cylinderGeometry args={[0.017, 0.022, 0.07, 14]} />
                  <meshStandardMaterial color="#e2e8f0" metalness={0.85} roughness={0.18} />
                </mesh>
                <mesh position={[0.022, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.021, 0.021, 0.012, 14]} />
                  <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.15} />
                </mesh>
              </group>
            ))}
          </>
        ) : (
          <group position={[bodyW / 2 + 0.035, 0.032 + bodyH * 0.55, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.018, 0.023, 0.07, 14]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.85} roughness={0.18} />
            </mesh>
            <mesh position={[0.022, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.022, 0.022, 0.012, 14]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.15} />
            </mesh>
          </group>
        )}
      </group>
    </group>
  );
}