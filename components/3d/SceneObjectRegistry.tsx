'use client';

import React, { useMemo, useRef, useLayoutEffect, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PlacedSceneItem, TankBounds } from '@/types/aquarium';
import { useAquariumStore } from '@/store/useAquariumStore';

import {
  buildAnatomicalBettaAssets,
  BettaFinVariant,
  BettaSex,
  ProceduralBettaAssets,
} from '../../models/baliklar/beta/betaAnatomyBuilder';
import {
  buildAnatomicalGuppyAssets,
  GuppySex,
  GuppyTailVariant,
  ProceduralFishAssets,
} from '../../models/baliklar/lepistes/lepistesAnatomyBuilder';
import {
  buildAnatomicalPlecoAssets,
  PlecoVariant,
  ProceduralPlecoAssets,
} from '../../models/baliklar/vatoz/vatozAnatomyBuilder';
import {
  buildAnatomicalShrimpAssets,
  ShrimpVariant,
  ProceduralShrimpAssets,
} from '../../models/canlilar/karides/karidesAnatomyBuilder';
import {
  buildSnailGeometries,
  SnailSpeciesType,
} from '../../models/canlilar/salyangoz/salyangozAnatomyBuilder';

interface SceneObjectRegistryProps {
  items: PlacedSceneItem[];
  tankBounds: TankBounds;
}

type CreatureSpecies =
  | 'beta'
  | 'lepistes'
  | 'vatoz'
  | 'karides'
  | 'salyangoz';

type SnailGeometriesResult = ReturnType<typeof buildSnailGeometries>;

type CachedCreatureBundle =
  | { kind: 'fish'; assets: ProceduralFishAssets | ProceduralBettaAssets | ProceduralPlecoAssets; baseScale: number }
  | { kind: 'shrimp'; assets: ProceduralShrimpAssets; baseScale: number }
  | { kind: 'snail'; geo: SnailGeometriesResult; baseScale: number };

// ============================================================================
// 1. MODÜL SEVİYESİNDE SİNGLETON ASSET ÖNBELLEĞİ (0 MS EKLEME & SHADER CACHE)
// ============================================================================
const creatureAssetCache = new Map<string, CachedCreatureBundle>();
const _dummy = new THREE.Object3D();
const _tempColor = new THREE.Color();

function optimizeMaterialForInstancing(mat: THREE.Material | undefined) {
  if (!mat) return;
  const phys = mat as THREE.MeshPhysicalMaterial;
  if (phys.isMeshPhysicalMaterial) {
    phys.clearcoat = Math.min(phys.clearcoat || 0, 0.3);
    phys.iridescence = Math.min(phys.iridescence || 0, 0.4);
    phys.envMapIntensity = 0.85;
  }
}

function detectSpecies(name: string, slug?: string, subCategory?: string): CreatureSpecies {
  const n = `${name} ${slug || ''} ${subCategory || ''}`.toLowerCase();
  if (n.includes('beta') || n.includes('betta')) return 'beta';
  if (n.includes('vatoz') || n.includes('pleco') || n.includes('ancistrus') || n.includes('leopar')) return 'vatoz';
  if (
    n.includes('karides') ||
    n.includes('shrimp') ||
    n.includes('neocaridina') ||
    n.includes('bloody') ||
    n.includes('mavi melek') ||
    n.includes('rilli') ||
    n.includes('sakura') ||
    n.includes('amano') ||
    subCategory === 'karidesler'
  ) {
    return 'karides';
  }
  if (
    n.includes('salyangoz') ||
    n.includes('snail') ||
    n.includes('nerite') ||
    n.includes('elma') ||
    subCategory === 'salyangozlar'
  ) {
    return 'salyangoz';
  }
  return 'lepistes';
}

function getOrCreateCreatureBundle(item: PlacedSceneItem): CachedCreatureBundle {
  const p = item.product;
  const slug = (p.slug || '').toLowerCase();
  const species = detectSpecies(p.name, p.slug, p.sub_category);
  const isFemale = p.variant === 'disi' || slug.includes('disi');

  if (species === 'beta') {
    const sex: BettaSex = isFemale ? 'disi' : 'erkek';
    let finVar: BettaFinVariant = isFemale ? 'round' : 'halfmoon';
    if (slug.includes('crowntail')) finVar = 'crowntail';
    else if (slug.includes('plakat')) finVar = 'plakat';
    else if (slug.includes('dumbo')) finVar = 'dumbo';

    const cacheKey = `beta_${sex}_${finVar}`;
    const cached = creatureAssetCache.get(cacheKey);
    if (cached) return cached;

    const assets = buildAnatomicalBettaAssets(sex, finVar);
    assets.bodyMaterial.color.set('#ffffff');
    assets.finMaterial.color.set('#ffffff');
    optimizeMaterialForInstancing(assets.bodyMaterial);
    optimizeMaterialForInstancing(assets.finMaterial);

    const bundle: CachedCreatureBundle = { kind: 'fish', assets, baseScale: 0.42 };
    creatureAssetCache.set(cacheKey, bundle);
    return bundle;
  }

  if (species === 'vatoz') {
    const variant: PlecoVariant = slug.includes('leopar') ? 'leopar' : 'cuce';
    const cacheKey = `vatoz_${variant}`;
    const cached = creatureAssetCache.get(cacheKey);
    if (cached) return cached;

    const assets = buildAnatomicalPlecoAssets(variant);
    assets.bodyMaterial.color.set('#ffffff');
    assets.finMaterial.color.set('#ffffff');
    optimizeMaterialForInstancing(assets.bodyMaterial);
    optimizeMaterialForInstancing(assets.finMaterial);

    const bundle: CachedCreatureBundle = { kind: 'fish', assets, baseScale: 0.55 };
    creatureAssetCache.set(cacheKey, bundle);
    return bundle;
  }

  if (species === 'karides') {
    const variant: ShrimpVariant = slug.includes('amano')
      ? 'amano'
      : slug.includes('rilli')
      ? 'rilli'
      : 'neocaridina';
    const cacheKey = `karides_${variant}`;
    const cached = creatureAssetCache.get(cacheKey);
    if (cached) return cached;

    const assets = buildAnatomicalShrimpAssets(variant);
    assets.bodyMaterial.color.set('#ffffff');
    assets.appendageMaterial.color.set('#ffffff');
    optimizeMaterialForInstancing(assets.bodyMaterial);
    optimizeMaterialForInstancing(assets.appendageMaterial);

    const bundle: CachedCreatureBundle = { kind: 'shrimp', assets, baseScale: 0.24 };
    creatureAssetCache.set(cacheKey, bundle);
    return bundle;
  }

  if (species === 'salyangoz') {
    const sType: SnailSpeciesType = slug.includes('nerite') ? 'nerite' : 'elma';
    const cacheKey = `salyangoz_${sType}`;
    const cached = creatureAssetCache.get(cacheKey);
    if (cached) return cached;

    const geo = buildSnailGeometries(sType);
    const bundle: CachedCreatureBundle = { kind: 'snail', geo, baseScale: 0.26 };
    creatureAssetCache.set(cacheKey, bundle);
    return bundle;
  }

  // Varsayılan: Lepistes
  const sex: GuppySex = isFemale ? 'disi' : 'erkek';
  let tailVar: GuppyTailVariant = isFemale ? 'round' : 'delta';
  if (slug.includes('double-sword')) tailVar = 'double-sword';
  else if (slug.includes('lyra')) tailVar = 'lyra';

  const cacheKey = `lepistes_${sex}_${tailVar}`;
  const cached = creatureAssetCache.get(cacheKey);
  if (cached) return cached;

  const assets = buildAnatomicalGuppyAssets(sex, tailVar);
  assets.bodyMaterial.color.set('#ffffff');
  assets.finMaterial.color.set('#ffffff');
  optimizeMaterialForInstancing(assets.bodyMaterial);
  optimizeMaterialForInstancing(assets.finMaterial);

  const bundle: CachedCreatureBundle = { kind: 'fish', assets, baseScale: 0.32 };
  creatureAssetCache.set(cacheKey, bundle);
  return bundle;
}

function getGroupKeyForItem(item: PlacedSceneItem): string {
  const p = item.product;
  const slug = (p.slug || '').toLowerCase();
  const species = detectSpecies(p.name, p.slug, p.sub_category);
  const isFemale = p.variant === 'disi' || slug.includes('disi');

  if (species === 'beta') {
    const sex = isFemale ? 'disi' : 'erkek';
    let finVar = isFemale ? 'round' : 'halfmoon';
    if (slug.includes('crowntail')) finVar = 'crowntail';
    else if (slug.includes('plakat')) finVar = 'plakat';
    else if (slug.includes('dumbo')) finVar = 'dumbo';
    return `beta_${sex}_${finVar}`;
  }
  if (species === 'vatoz') {
    return `vatoz_${slug.includes('leopar') ? 'leopar' : 'cuce'}`;
  }
  if (species === 'karides') {
    const variant = slug.includes('amano')
      ? 'amano'
      : slug.includes('rilli')
      ? 'rilli'
      : 'neocaridina';
    return `karides_${variant}`;
  }
  if (species === 'salyangoz') {
    return `salyangoz_${slug.includes('nerite') ? 'nerite' : 'elma'}`;
  }
  const sex = isFemale ? 'disi' : 'erkek';
  let tailVar = isFemale ? 'round' : 'delta';
  if (slug.includes('double-sword')) tailVar = 'double-sword';
  else if (slug.includes('lyra')) tailVar = 'lyra';
  return `lepistes_${sex}_${tailVar}`;
}

function resolveItemColors(item: PlacedSceneItem, species: CreatureSpecies): { body: string; fin: string } {
  const p = item.product;
  if (p.color) {
    return { body: p.color, fin: p.fin_color || p.color };
  }
  const n = p.name.toLowerCase();
  if (species === 'karides') {
    if (n.includes('bloody') || n.includes('kırmızı') || n.includes('kiraz')) return { body: '#c81d25', fin: '#dc2626' };
    if (n.includes('mavi') || n.includes('blue')) return { body: '#1d4ed8', fin: '#3b82f6' };
    if (n.includes('sarı') || n.includes('yellow')) return { body: '#eab308', fin: '#facc15' };
    if (n.includes('turuncu') || n.includes('sakura')) return { body: '#f97316', fin: '#fb923c' };
    if (n.includes('carbon') || n.includes('siyah')) return { body: '#1e293b', fin: '#475569' };
    return { body: '#dc2626', fin: '#ef4444' };
  }
  if (species === 'beta') {
    if (n.includes('mavi')) return { body: '#1e40af', fin: '#3b82f6' };
    if (n.includes('kırmızı')) return { body: '#b91c1c', fin: '#ef4444' };
    if (n.includes('beyaz') || n.includes('platin')) return { body: '#e2e8f0', fin: '#f8fafc' };
    return { body: '#7e22ce', fin: '#a855f7' };
  }
  if (species === 'vatoz') return { body: '#57534e', fin: '#44403c' };
  if (species === 'salyangoz') {
    if (n.includes('sarı') || n.includes('altın')) return { body: '#eab308', fin: '#ca8a04' };
    if (n.includes('mavi')) return { body: '#475569', fin: '#334155' };
    return { body: '#92400e', fin: '#78350f' };
  }
  if (n.includes('mavi') || n.includes('moskova')) return { body: '#2563eb', fin: '#60a5fa' };
  if (n.includes('sarı') || n.includes('cobra')) return { body: '#f59e0b', fin: '#fde047' };
  return { body: '#ea580c', fin: '#facc15' };
}

// ============================================================================
// 2. ÇOK PARÇALI INSTANCED CANLI SÜRÜSÜ (GÖVDE + YÜZGEÇ + GÖZ TEK DRAW CALL)
// ============================================================================
interface AgentMotion {
  pos: THREE.Vector3;
  target: THREE.Vector3;
  yaw: number;
  speed: number;
  timer: number;
}

function InstancedCreatureSwarm({
  groupKey,
  members,
  tankBounds,
  selectedItemId,
  onSelect,
}: {
  groupKey: string;
  members: PlacedSceneItem[];
  tankBounds: TankBounds;
  selectedItemId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const part1Ref = useRef<THREE.InstancedMesh>(null);
  const part2Ref = useRef<THREE.InstancedMesh>(null);
  const part3Ref = useRef<THREE.InstancedMesh>(null);

  const sample = members[0];
  const species = detectSpecies(sample.product.name, sample.product.slug, sample.product.sub_category);
  const isBottom = species === 'vatoz' || species === 'karides' || species === 'salyangoz';

  const bundle = useMemo(() => {
    if (typeof document === 'undefined') return null;
    return getOrCreateCreatureBundle(sample);
  }, [sample]);

  const snailMaterials = useMemo(() => {
    return {
      shell: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35 }),
      body: new THREE.MeshStandardMaterial({ color: '#d6c7b2', roughness: 0.75 }),
    };
  }, []);

  useEffect(() => {
    return () => {
      snailMaterials.shell.dispose();
      snailMaterials.body.dispose();
    };
  }, [snailMaterials]);

  useLayoutEffect(() => {
    if (!part1Ref.current || !bundle) return;

    members.forEach((m, idx) => {
      const colors = resolveItemColors(m, species);
      if (bundle.kind === 'snail') {
        _tempColor.set('#ffffff');
        part1Ref.current!.setColorAt(idx, _tempColor);
      } else {
        _tempColor.set(colors.body);
        part1Ref.current!.setColorAt(idx, _tempColor);
        if (part2Ref.current) {
          _tempColor.set(colors.fin);
          part2Ref.current.setColorAt(idx, _tempColor);
        }
      }
    });

    if (part1Ref.current.instanceColor) part1Ref.current.instanceColor.needsUpdate = true;
    if (part2Ref.current?.instanceColor) part2Ref.current.instanceColor.needsUpdate = true;
  }, [members, bundle, species]);

  const motionMapRef = useRef(new Map<string, AgentMotion>());

  const agents = useMemo(() => {
    const map = motionMapRef.current;
    const minY = isBottom ? tankBounds.substrateTop + 0.04 : tankBounds.substrateTop + 0.25;
    const maxY = isBottom ? tankBounds.substrateTop + 0.08 : Math.max(minY + 0.2, tankBounds.waterTop - 0.22);

    return members.map((m) => {
      let agent = map.get(m.instanceId);
      if (!agent) {
        agent = {
          pos: new THREE.Vector3(
            THREE.MathUtils.lerp(tankBounds.minX + 0.3, tankBounds.maxX - 0.3, Math.random()),
            THREE.MathUtils.lerp(minY, maxY, Math.random()),
            THREE.MathUtils.lerp(tankBounds.minZ + 0.3, tankBounds.maxZ - 0.3, Math.random())
          ),
          target: new THREE.Vector3(
            THREE.MathUtils.lerp(tankBounds.minX + 0.3, tankBounds.maxX - 0.3, Math.random()),
            THREE.MathUtils.lerp(minY, maxY, Math.random()),
            THREE.MathUtils.lerp(tankBounds.minZ + 0.3, tankBounds.maxZ - 0.3, Math.random())
          ),
          yaw: Math.random() * Math.PI * 2,
          speed:
            species === 'salyangoz'
              ? 0.05
              : species === 'karides'
              ? 0.22
              : species === 'vatoz'
              ? 0.28
              : 0.55,
          timer: 1 + Math.random() * 3,
        };
        map.set(m.instanceId, agent);
      }
      return agent;
    });
  }, [members, tankBounds, isBottom, species]);

  useFrame(({ clock }, delta) => {
    if (!bundle || !part1Ref.current || agents.length === 0) return;

    const dt = Math.min(delta, 0.05);
    const t = clock.getElapsedTime();

    if (bundle.kind !== 'snail') {
      bundle.assets.updateShaderTime(t);
    }

    const minY = isBottom ? tankBounds.substrateTop + 0.04 : tankBounds.substrateTop + 0.25;
    const maxY = isBottom ? tankBounds.substrateTop + 0.08 : Math.max(minY + 0.2, tankBounds.waterTop - 0.22);

    for (let i = 0; i < agents.length; i++) {
      const a = agents[i];
      const item = members[i];
      a.timer -= dt;

      if (a.timer <= 0 || a.pos.distanceToSquared(a.target) < 0.02) {
        a.timer = 2.0 + Math.random() * 3.5;
        a.target.set(
          THREE.MathUtils.lerp(tankBounds.minX + 0.3, tankBounds.maxX - 0.3, Math.random()),
          THREE.MathUtils.lerp(minY, maxY, Math.random()),
          THREE.MathUtils.lerp(tankBounds.minZ + 0.3, tankBounds.maxZ - 0.3, Math.random())
        );
      }

      const dx = a.target.x - a.pos.x;
      const dy = a.target.y - a.pos.y;
      const dz = a.target.z - a.pos.z;
      const dist = Math.hypot(dx, dy, dz);

      if (dist > 0.001) {
        const step = Math.min(a.speed * dt, dist);
        a.pos.x += (dx / dist) * step;
        a.pos.y += (dy / dist) * step;
        a.pos.z += (dz / dist) * step;

        const targetYaw = Math.atan2(dx, dz);
        a.yaw = THREE.MathUtils.lerp(a.yaw, targetYaw, dt * 4.0);
      }

      const finalScale = bundle.baseScale * (item.scale || 1);
      _dummy.position.copy(a.pos);
      _dummy.rotation.set(0, a.yaw, 0);
      _dummy.scale.setScalar(finalScale);
      _dummy.updateMatrix();

      part1Ref.current.setMatrixAt(i, _dummy.matrix);
      if (part2Ref.current) part2Ref.current.setMatrixAt(i, _dummy.matrix);
      if (part3Ref.current) part3Ref.current.setMatrixAt(i, _dummy.matrix);
    }

    part1Ref.current.instanceMatrix.needsUpdate = true;
    if (part2Ref.current) part2Ref.current.instanceMatrix.needsUpdate = true;
    if (part3Ref.current) part3Ref.current.instanceMatrix.needsUpdate = true;
  });

  if (!bundle) return null;

  const selectedIndex = members.findIndex((m) => m.instanceId === selectedItemId);

  return (
    <group name={`swarm-${groupKey}`}>
      {bundle.kind === 'fish' && (
        <>
          <instancedMesh
            ref={part1Ref}
            args={[bundle.assets.bodyGeometry, bundle.assets.bodyMaterial, members.length]}
            frustumCulled={false}
            castShadow={false}
            receiveShadow={false}
            onClick={(e) => {
              e.stopPropagation();
              if (e.instanceId !== undefined && members[e.instanceId]) {
                onSelect(members[e.instanceId].instanceId);
              }
            }}
          />
          <instancedMesh
            ref={part2Ref}
            args={[bundle.assets.finGeometry, bundle.assets.finMaterial, members.length]}
            frustumCulled={false}
            castShadow={false}
            receiveShadow={false}
          />
          <instancedMesh
            ref={part3Ref}
            args={[bundle.assets.eyeGeometry, bundle.assets.eyeMaterial, members.length]}
            frustumCulled={false}
            castShadow={false}
            receiveShadow={false}
          />
        </>
      )}

      {bundle.kind === 'shrimp' && (
        <>
          <instancedMesh
            ref={part1Ref}
            args={[bundle.assets.bodyGeometry, bundle.assets.bodyMaterial, members.length]}
            frustumCulled={false}
            castShadow={false}
            receiveShadow={false}
            onClick={(e) => {
              e.stopPropagation();
              if (e.instanceId !== undefined && members[e.instanceId]) {
                onSelect(members[e.instanceId].instanceId);
              }
            }}
          />
          <instancedMesh
            ref={part2Ref}
            args={[bundle.assets.appendageGeometry, bundle.assets.appendageMaterial, members.length]}
            frustumCulled={false}
            castShadow={false}
            receiveShadow={false}
          />
          <instancedMesh
            ref={part3Ref}
            args={[bundle.assets.eyeGeometry, bundle.assets.eyeMaterial, members.length]}
            frustumCulled={false}
            castShadow={false}
            receiveShadow={false}
          />
        </>
      )}

      {bundle.kind === 'snail' && (
        <>
          <instancedMesh
            ref={part1Ref}
            args={[bundle.geo.shellGeometry, snailMaterials.shell, members.length]}
            frustumCulled={false}
            castShadow={false}
            receiveShadow={false}
            onClick={(e) => {
              e.stopPropagation();
              if (e.instanceId !== undefined && members[e.instanceId]) {
                onSelect(members[e.instanceId].instanceId);
              }
            }}
          />
          <instancedMesh
            ref={part2Ref}
            args={[bundle.geo.bodyGeometry, snailMaterials.body, members.length]}
            frustumCulled={false}
            castShadow={false}
            receiveShadow={false}
          />
        </>
      )}

      {selectedIndex !== -1 && agents[selectedIndex] && (
        <mesh
          position={[
            agents[selectedIndex].pos.x,
            agents[selectedIndex].pos.y + 0.24,
            agents[selectedIndex].pos.z,
          ]}
        >
          <octahedronGeometry args={[0.055, 0]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      )}
    </group>
  );
}

// ============================================================================
// 3. INSTANCEDMESH BİTKİ KÜMESİ (TEK DRAW CALL)
// ============================================================================
function InstancedPlantsGroup({
  plants,
  tankBounds,
  selectedItemId,
  onSelect,
}: {
  plants: PlacedSceneItem[];
  tankBounds: TankBounds;
  selectedItemId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const leafRef = useRef<THREE.InstancedMesh>(null);
  const leavesPerPlant = 8;
  const totalLeaves = plants.length * leavesPerPlant;

  const { leafGeo, leafMat } = useMemo(() => {
    const geo = new THREE.SphereGeometry(0.16, 10, 8);
    geo.scale(0.55, 0.12, 1.65);
    geo.translate(0, 0, 0.18);
    const mat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.58,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });
    return { leafGeo: geo, leafMat: mat };
  }, []);

  useEffect(() => {
    return () => {
      leafGeo.dispose();
      leafMat.dispose();
    };
  }, [leafGeo, leafMat]);

  useLayoutEffect(() => {
    const mesh = leafRef.current;
    if (!mesh || totalLeaves === 0) return;

    let idx = 0;
    plants.forEach((plant, pIdx) => {
      const px = plant.position?.[0] ?? (((pIdx * 1.7) % (tankBounds.width - 1.2)) - (tankBounds.width - 1.2) / 2);
      const py = tankBounds.substrateTop;
      const pz = plant.position?.[2] ?? (((pIdx * 2.3) % (tankBounds.depth - 1.0)) - (tankBounds.depth - 1.0) / 2);
      const scale = plant.scale || 1;
      _tempColor.set(plant.product.color || '#16a34a');

      for (let l = 0; l < leavesPerPlant; l++) {
        const angle = (l / leavesPerPlant) * Math.PI * 2 + pIdx * 0.8;
        const tilt = 0.35 + (l % 3) * 0.25;
        const leafScale = scale * (0.75 + (l % 3) * 0.2);

        _dummy.position.set(px, py + 0.04, pz);
        _dummy.rotation.set(-tilt, angle, 0);
        _dummy.scale.setScalar(leafScale);
        _dummy.updateMatrix();

        mesh.setMatrixAt(idx, _dummy.matrix);
        mesh.setColorAt(idx, _tempColor);
        idx++;
      }
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [plants, tankBounds, totalLeaves]);

  if (plants.length === 0) return null;

  return (
    <group name="instanced-plants">
      <instancedMesh
        ref={leafRef}
        args={[leafGeo, leafMat, totalLeaves]}
        castShadow={false}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          if (e.instanceId !== undefined) {
            const pIndex = Math.floor(e.instanceId / leavesPerPlant);
            if (plants[pIndex]) onSelect(plants[pIndex].instanceId);
          }
        }}
      />
      {plants.map(
        (plant, pIdx) =>
          selectedItemId === plant.instanceId && (
            <mesh
              key={plant.instanceId}
              position={[
                plant.position?.[0] ?? (((pIdx * 1.7) % (tankBounds.width - 1.2)) - (tankBounds.width - 1.2) / 2),
                tankBounds.substrateTop + 0.55,
                plant.position?.[2] ?? (((pIdx * 2.3) % (tankBounds.depth - 1.0)) - (tankBounds.depth - 1.0) / 2),
              ]}
            >
              <octahedronGeometry args={[0.06, 0]} />
              <meshBasicMaterial color="#4ade80" />
            </mesh>
          )
      )}
    </group>
  );
}

// ============================================================================
// 4. ANA SAHNE NESNE KAYIT DEFTERİ
// ============================================================================
export function SceneObjectRegistry({ items, tankBounds }: SceneObjectRegistryProps) {
  const selectedItemId = useAquariumStore((state) => state.selectedItemId);
  const selectItem = useAquariumStore((state) => state.selectItem);

  const { creatureGroups, plants } = useMemo(() => {
    const groups = new Map<string, PlacedSceneItem[]>();
    const plantList: PlacedSceneItem[] = [];

    for (const item of items) {
      const cat = item.product.category;
      if (cat === 'canlilar') {
        const key = getGroupKeyForItem(item);
        const list = groups.get(key) ?? [];
        list.push(item);
        groups.set(key, list);
      } else if (cat === 'bitkiler') {
        plantList.push(item);
      }
    }

    return {
      creatureGroups: Array.from(groups.entries()),
      plants: plantList,
    };
  }, [items]);

  return (
    <group name="scene-object-registry">
      {creatureGroups.map(([groupKey, members]) => (
        <InstancedCreatureSwarm
          key={groupKey}
          groupKey={groupKey}
          members={members}
          tankBounds={tankBounds}
          selectedItemId={selectedItemId}
          onSelect={selectItem}
        />
      ))}

      <InstancedPlantsGroup
        plants={plants}
        tankBounds={tankBounds}
        selectedItemId={selectedItemId}
        onSelect={selectItem}
      />
    </group>
  );
}