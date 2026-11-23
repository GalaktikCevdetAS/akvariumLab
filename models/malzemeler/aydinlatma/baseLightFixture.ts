import * as THREE from 'three';

export interface SimpleLightFixtureProps {
  lengthCm: number;
  tankWidth: number;
  tankHeight: number;
  kelvin: number;
  ledStripColor: string;
  pointLightColor: string;
  lumen: number;
  lightHours: number;
  slotIndex?: number;
}

export function computeFixtureDimensions(
  lengthCm: number,
  tankWidth: number,
  tankHeight: number,
  slotIndex = 0
) {
  // 1 birim = 10 cm; armatür uzunluğu tank genişliğini aşarsa cam ayaklarıyla tanka oturur
  const rawLength = lengthCm / 10;
  const bodyLength = Math.min(rawLength, tankWidth + 0.2);
  const tankTopY = tankHeight / 2;
  const fixtureY = tankTopY + 0.14;
  // Birden fazla ışık eklenirse ön-arka eksende (Z) yan yana dizilir
  const zOffset =
    slotIndex === 0
      ? 0
      : (slotIndex % 2 === 1 ? 0.35 : -0.35) * Math.ceil(slotIndex / 2);

  return {
    bodyLength,
    tankTopY,
    fixtureY,
    zOffset,
  };
}