'use client';

import React, { useRef, useState } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { PlacedSceneItem, TankBounds } from '../../types/aquarium';
import { useAquariumStore } from '../../store/useAquariumStore';
import { EquipmentConnectionsAndBubbles } from './EquipmentConnectionsAndBubbles';
import BeyazIsikMesh from '../../models/malzemeler/aydinlatma/BeyazIsikMesh';
import BeyazMaviIsikMesh from '../../models/malzemeler/aydinlatma/BeyazMaviIsikMesh';
import UcRenkIsikMesh from '../../models/malzemeler/aydinlatma/UcRenkIsikMesh';
import FiltreEkipmanMesh from '../../models/malzemeler/ekipman/FiltreEkipmanMesh';
import HavaMotoruMesh from '../../models/malzemeler/ekipman/HavaMotoruMesh';
import HavaTasiMesh from '../../models/malzemeler/ekipman/HavaTasiMesh';

interface DraggableEquipmentProps {
  placedEquipments: PlacedSceneItem[];
  tankBounds: TankBounds;
  onDragStateChange: (dragging: boolean) => void;
}

export function DraggableEquipment({
  placedEquipments,
  tankBounds,
  onDragStateChange,
}: DraggableEquipmentProps) {
  const selectedItemId = useAquariumStore((state) => state.selectedItemId);
  const selectItem = useAquariumStore((state) => state.selectItem);
  const updateItemTransform = useAquariumStore(
    (state) => state.updateItemTransform
  );
  const lightHours = useAquariumStore((state) => state.lightHours);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const dragOffsetRef = useRef(new THREE.Vector3());

  const { width, height, depth, waterTop } = tankBounds;

  const isLightingEquipment = (item: PlacedSceneItem): boolean => {
    return item.product.sub_category === 'aydinlatmalar';
  };

  const getSafePosition = (item: PlacedSceneItem): [number, number, number] => {
    return item.position ?? [0, tankBounds.substrateTop, 0];
  };

  const handlePointerDown = (
    e: ThreeEvent<PointerEvent>,
    item: PlacedSceneItem
  ) => {
    e.stopPropagation();
    selectItem(item.instanceId);
    if (isLightingEquipment(item)) return;

    setDraggingId(item.instanceId);
    onDragStateChange(true);

    const safePos = getSafePosition(item);
    const currentPos = new THREE.Vector3(safePos[0], safePos[1], safePos[2]);
    dragPlaneRef.current.setFromNormalAndCoplanarPoint(
      new THREE.Vector3(0, 1, 0),
      currentPos
    );

    const intersectPoint = new THREE.Vector3();
    if (e.ray.intersectPlane(dragPlaneRef.current, intersectPoint)) {
      dragOffsetRef.current.subVectors(currentPos, intersectPoint);
    }
  };

  const handlePointerMove = (
    e: ThreeEvent<PointerEvent>,
    item: PlacedSceneItem
  ) => {
    if (draggingId !== item.instanceId) return;
    e.stopPropagation();

    const intersectPoint = new THREE.Vector3();
    if (!e.ray.intersectPlane(dragPlaneRef.current, intersectPoint)) return;

    const targetPos = intersectPoint.add(dragOffsetRef.current);

    if (item.product.sub_category === 'hava-motorlari') {
      const clampedX = Math.max(
        -width / 2 - 1.25,
        Math.min(-width / 2 - 0.35, targetPos.x)
      );
      const clampedZ = Math.max(-depth / 2, Math.min(depth / 2, targetPos.z));
      updateItemTransform(item.instanceId, [clampedX, -height / 2, clampedZ]);
      return;
    }

    const halfW = width / 2 - 0.25;
    const halfD = depth / 2 - 0.25;
    const clampedX = Math.max(-halfW, Math.min(halfW, targetPos.x));
    const clampedZ = Math.max(-halfD, Math.min(halfD, targetPos.z));
    const safeY = getSafePosition(item)[1];

    updateItemTransform(item.instanceId, [clampedX, safeY, clampedZ]);
  };

  const handlePointerUp = (
    e: ThreeEvent<PointerEvent>,
    item: PlacedSceneItem
  ) => {
    if (draggingId !== item.instanceId) return;
    e.stopPropagation();
    setDraggingId(null);
    onDragStateChange(false);
  };

  let lightSlotCounter = 0;

  const renderEquipmentModel = (item: PlacedSceneItem) => {
    const sub = item.product.sub_category;
    const safeItem = {
      ...item,
      position: getSafePosition(item),
    };

    if (sub === 'aydinlatmalar') {
      const slotIndex = lightSlotCounter++;
      const spectrum = item.product.light_spectrum || 'beyaz';
      const commonProps = {
        lengthCm: item.product.length_cm || 50,
        tankWidth: width,
        tankHeight: height,
        kelvin: item.product.kelvin || 6500,
        lumen: item.product.lumen || 1200,
        lightHours,
        slotIndex,
      };

      if (spectrum === 'uc-renk') {
        return <UcRenkIsikMesh {...commonProps} />;
      }
      if (spectrum === 'beyaz-mavi') {
        return <BeyazMaviIsikMesh {...commonProps} />;
      }
      return <BeyazIsikMesh {...commonProps} />;
    }

    if (sub === 'filtreler') {
      return (
        <FiltreEkipmanMesh
          item={safeItem as any}
          waterSurfaceY={waterTop}
          tankHeight={height}
        />
      );
    }

    if (sub === 'hava-motorlari') {
      return <HavaMotoruMesh item={safeItem as any} isActive={true} />;
    }

    if (sub === 'hava-taslari') {
      return <HavaTasiMesh item={safeItem as any} />;
    }

    return null;
  };

  return (
    <group>
      {placedEquipments.map((item) => {
        const isSelected = selectedItemId === item.instanceId;
        const isLight = isLightingEquipment(item);
        const renderPos: [number, number, number] = isLight
          ? [0, 0, 0]
          : getSafePosition(item);

        return (
          <group
            key={item.instanceId}
            position={renderPos}
            rotation={item.rotation ?? [0, 0, 0]}
            onPointerDown={(e) => handlePointerDown(e, item)}
            onPointerMove={(e) => handlePointerMove(e, item)}
            onPointerUp={(e) => handlePointerUp(e, item)}
          >
            {renderEquipmentModel(item)}

            {isSelected && !isLight && (
              <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.24, 0.3, 32]} />
                <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} />
              </mesh>
            )}
          </group>
        );
      })}

      <EquipmentConnectionsAndBubbles
        items={placedEquipments}
        tankBounds={tankBounds}
      />
    </group>
  );
}

export default DraggableEquipment;