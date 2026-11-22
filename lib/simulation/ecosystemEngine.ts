import { TankItem } from '../supabase/catalogService';

export interface EcosystemStatus {
  ph: number;
  temperature: number;
  bioLoad: number;
  warnings: string[];
  isHealthy: boolean;
}

export interface TankZones {
  maxSandKg: number;
  totalSandKg: number;
  sandVolumeLt: number;
  sandHeightRatio: number;
  sandHeight: number;
  sandTopY: number;
  usableWaterHeight: number;
  zones: {
    dip: [number, number];
    orta: [number, number];
    ust: [number, number];
  };
}

export function calculateTankZones(
  tankVolume: number,
  totalSandKg: number,
  tankBottomY: number,
  waterSurfaceY: number
): TankZones {
  const maxSandKg = Math.floor((tankVolume * 0.25) / 0.65);
  const clampedSandKg = Math.max(0, totalSandKg);
  const sandVolumeLt = clampedSandKg * 0.65;
  const sandHeightRatio = tankVolume > 0 ? Math.min(sandVolumeLt / tankVolume, 0.30) : 0;
  const totalWaterHeight = waterSurfaceY - tankBottomY;
  const sandHeight = totalWaterHeight * sandHeightRatio;
  const sandTopY = tankBottomY + sandHeight;
  const usableWaterHeight = Math.max(0.1, waterSurfaceY - sandTopY);

  return {
    maxSandKg,
    totalSandKg: clampedSandKg,
    sandVolumeLt,
    sandHeightRatio,
    sandHeight,
    sandTopY,
    usableWaterHeight,
    zones: {
      dip: [sandTopY + 0.08, sandTopY + usableWaterHeight * 0.33],
      orta: [sandTopY + usableWaterHeight * 0.33, sandTopY + usableWaterHeight * 0.66],
      ust: [sandTopY + usableWaterHeight * 0.66, waterSurfaceY - 0.08],
    },
  };
}

export function evaluateEcosystem(tankCapacity: number, items: TankItem[]): EcosystemStatus {
  let totalBioLoad = 0;
  let minLitersRequired = 0;
  const warnings: string[] = [];

  // Kum ve bitki hesaplamaları
  const sandItems = items.filter(i => i.product.category === 'kumlar');
  const totalSandKg = sandItems.reduce((acc, i) => acc + i.quantity, 0);
  const maxSandKg = Math.floor((tankCapacity * 0.25) / 0.65);

  if (totalSandKg > maxSandKg) {
    warnings.push(`Maksimum kum sınırı aşıldı! (${tankCapacity}L akvaryum için en fazla ${maxSandKg} kg kum eklenebilir.)`);
  }

  const hasPlants = items.some(i => i.product.category === 'bitkiler' && i.quantity > 0);
  if (hasPlants && totalSandKg <= 0) {
    warnings.push('Bitki eklemek için önce akvaryuma taban kumu eklemelisiniz!');
  }

  items.forEach(item => {
    totalBioLoad += item.product.bio_load * item.quantity;
    if (item.product.min_liters > 0) {
      minLitersRequired += item.product.min_liters * (item.product.category === 'baliklar' ? item.quantity : 1);
    }
  });

  if (minLitersRequired > tankCapacity) {
    warnings.push(`Seçilen tank hacmi (${tankCapacity}L) bu canlılar/ekipmanlar için yetersiz! Önerilen min: ${minLitersRequired}L`);
  }

  // pH ve Sıcaklık hesaplamaları (baz değer 7.2 pH, 25°C)
  let basePh = 7.2;
  let baseTemp = 25.0;

  // Biyolojik yük çok yüksekse pH düşer, amonyak riski artar
  if (totalBioLoad > tankCapacity * 0.15) {
    warnings.push('Yüksek biyolojik yük! Amonyak birikimi riski ve pH düşüşü gözleniyor.');
    basePh = 6.6;
  }

  // Filtre var mı kontrolü
  const hasFilter = items.some(i => i.product.slug === 'ic-filtre' && i.quantity > 0);
  if (!hasFilter && totalBioLoad > 5) {
    warnings.push('Akvaryumda filtrasyon sistemi (İç Filtre) bulunmuyor!');
  }

  const isHealthy = warnings.length === 0;

  return {
    ph: Number(basePh.toFixed(1)),
    temperature: baseTemp,
    bioLoad: totalBioLoad,
    warnings,
    isHealthy
  };
}

export type WaterPollutionPhase = 'clean' | 'moderate' | 'critical';

export interface WaterPhaseInfo {
  phase: WaterPollutionPhase;
  color: string;
  opacity: number;
  label: string;
}

export function evaluateWaterPhase(
  tankCapacity: number,
  bioLoad: number,
  warnings: string[]
): WaterPhaseInfo {
  const maxLoad = Math.max(1, tankCapacity * 0.2);
  const ratio = bioLoad / maxLoad;

  const hasFilterWarning = warnings.some(w => w.includes('filtrasyon') || w.includes('Filtre'));
  const hasSevereWarning = warnings.some(w => w.includes('Amonyak') || w.includes('yetersiz') || w.includes('Yüksek'));

  // 3. Faz: Kritik Seviye (Kırmızı-Sarı ton, modeller görünür, balıklar ölümü taklit eder)
  if (ratio > 1.0 || (hasFilterWarning && bioLoad > 6) || hasSevereWarning) {
    return {
      phase: 'critical',
      color: '#e15b24', // Kırmızı-sarı / pas toksisite tonu
      opacity: 0.22,
      label: 'Kritik Seviye (Zehirli/Aşırı Yük)',
    };
  }

  // 2. Faz: Orta Derece Bozulma (Sarı-Yeşil ton)
  if (ratio > 0.5 || hasFilterWarning || warnings.length > 0) {
    return {
      phase: 'moderate',
      color: '#84cc16', // Sarı-yeşil alg/bulanıklık tonu
      opacity: 0.18,
      label: 'Orta Derece Bozulma',
    };
  }

  // 1. Faz: Temiz / Dengeli (Berrak mavi)
  return {
    phase: 'clean',
    color: '#0284c7', // Berrak kristal su mavisi
    opacity: 0.14,
    label: 'Berrak / Dengeli',
  };
}
