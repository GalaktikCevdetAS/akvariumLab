import * as THREE from 'three';
import { TankItem, CompatibilityRule } from '../supabase/catalogService';
import { PlacedSceneItem, TankBounds } from '@/types/aquarium';

export interface WaterVisualState {
  phase: 'clean' | 'moderate' | 'algae' | 'tannin' | 'critical';
  color: string;
  opacity: number;
  roughness: number;
  label: string;
  isLethal: boolean;
}

export interface EcosystemStatus {
  ph: number;
  temperature: number;
  bioLoad: number;

  // Azot Döngüsü (mg/L)
  ammonia: number;
  nitrite: number;
  nitrate: number;

  // Gaz Dengesi
  oxygen: number;
  co2: number;

  // Mineraller & Sertlik
  ppm: number;
  gh: number;
  kh: number;

  // Aydınlatma & Alg Fotokimyası
  totalLumens: number;
  lightHours: number;
  lumenPerLiter: number;
  algaeLevel: number;

  // Görsel Su Rengi ve Uyarılar
  waterVisuals: WaterVisualState;
  warnings: string[];
  positiveNotes: string[];
  isHealthy: boolean;
  maxPlants: number;
  currentPlants: number;
}

export interface TankDimensionsCm {
  widthCm: number;
  depthCm: number;
  heightCm: number;
  sceneWidth: number;
  sceneHeight: number;
  sceneDepth: number;
}

export function getTankDimensionsCm(tankCapacity: number): TankDimensionsCm {
  if (tankCapacity === 200) {
    return {
      widthCm: 100,
      depthCm: 40,
      heightCm: 50,
      sceneWidth: 10.0,
      sceneHeight: 5.0,
      sceneDepth: 4.0,
    };
  }
  if (tankCapacity === 100) {
    return {
      widthCm: 80,
      depthCm: 35,
      heightCm: 40,
      sceneWidth: 8.0,
      sceneHeight: 4.0,
      sceneDepth: 3.5,
    };
  }
  return {
    widthCm: 50,
    depthCm: 30,
    heightCm: 35,
    sceneWidth: 5.0,
    sceneHeight: 3.5,
    sceneDepth: 3.0,
  };
}

export function getMaxPlantsForTank(tankCapacity: number): number {
  const { widthCm, depthCm } = getTankDimensionsCm(tankCapacity);
  return Math.max(4, Math.floor((widthCm * depthCm) / 250));
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

function computeBlendedWaterVisuals(params: {
  ammonia: number;
  nitrite: number;
  nitrate: number;
  oxygen: number;
  algaeLevel: number;
  tanninScore: number;
  warnings: string[];
}): WaterVisualState {
  const { ammonia, nitrite, oxygen, algaeLevel, tanninScore } = params;

  const toxicityFactor = Math.min(
    1,
    Math.max(
      ammonia / 1.2,
      nitrite / 2.0,
      oxygen < 4.2 ? (4.2 - oxygen) / 2.5 : 0
    )
  );

  const algaeFactor = Math.min(1, algaeLevel / 100);
  const tanninFactor = Math.min(1, tanninScore / 10);

  const cleanColor = new THREE.Color('#0284c7');
  const algaeColor = new THREE.Color('#16a34a');
  const toxicColor = new THREE.Color('#dc2626');
  const tanninColor = new THREE.Color('#b45309');

  const finalColor = cleanColor.clone();
  if (tanninFactor > 0.05) {
    finalColor.lerp(tanninColor, tanninFactor * 0.65);
  }
  if (algaeFactor > 0.05) {
    finalColor.lerp(algaeColor, algaeFactor * 0.85);
  }
  if (toxicityFactor > 0.05) {
    finalColor.lerp(toxicColor, toxicityFactor * 0.85);
  }

  const hexColor = `#${finalColor.getHexString()}`;
  const isLethal = ammonia >= 1.0 || nitrite >= 2.0 || oxygen <= 3.2;

  const turbidity = Math.max(toxicityFactor, algaeFactor * 0.85, tanninFactor * 0.4);
  const opacity = Number(Math.min(0.42, 0.13 + turbidity * 0.24).toFixed(3));
  const roughness = Number(Math.min(0.45, 0.10 + turbidity * 0.28).toFixed(2));

  if (isLethal) {
    return {
      phase: 'critical',
      color: hexColor,
      opacity,
      roughness,
      label: 'Kritik Toksisite / Hipoksi',
      isLethal: true,
    };
  }
  if (algaeFactor >= 0.45) {
    return {
      phase: 'algae',
      color: hexColor,
      opacity,
      roughness,
      label: `Alg Patlaması (%${Math.round(algaeLevel)} Yeşil Su)`,
      isLethal: false,
    };
  }
  if (toxicityFactor >= 0.35) {
    return {
      phase: 'moderate',
      color: hexColor,
      opacity,
      roughness,
      label: 'Azot / Oksijen Dengesizliği',
      isLethal: false,
    };
  }
  if (tanninFactor >= 0.35) {
    return {
      phase: 'tannin',
      color: hexColor,
      opacity,
      roughness,
      label: 'Doğal Tanenli (Amber Su)',
      isLethal: false,
    };
  }

  return {
    phase: 'clean',
    color: hexColor,
    opacity,
    roughness,
    label: 'Berrak & Dengeli',
    isLethal: false,
  };
}

export function evaluateEcosystem(
  tankCapacity: number,
  items: TankItem[],
  rules: CompatibilityRule[] = [],
  lightHours: number = 8
): EcosystemStatus {
  const warnings: string[] = [];
  const positiveNotes: string[] = [];

  const volumeScale = 50 / Math.max(10, tankCapacity);

  let totalBioLoad = 0;
  let minLitersRequired = 0;

  let rawAmmonia = 0;
  let rawNitrite = 0;
  let rawNitrate = 5.0;
  let rawO2 = 7.8;
  let rawCo2 = 6.0;
  let ppm = 160;
  let gh = 6.0;
  let kh = 4.5;
  let ph = 7.2;
  let tanninScore = 0;
  let algaeControlPower = 0;
  let extraLumens = 0;

  const sandItems = items.filter((i) => i.product.category === 'kumlar');
  const totalSandKg = sandItems.reduce((acc, i) => acc + i.quantity, 0);
  const unitVol = sandItems[0]?.product.volume_per_unit_lt || 0.65;
  const maxSandKg = Math.floor((tankCapacity * 0.25) / unitVol);

  if (totalSandKg > maxSandKg) {
    warnings.push(`Maksimum kum sınırı aşıldı! (${tankCapacity}L için max ${maxSandKg} kg)`);
  }

  const plantItems = items.filter((i) => i.product.category === 'bitkiler' && i.quantity > 0);
  const currentPlants = plantItems.reduce((acc, i) => acc + i.quantity, 0);
  const maxPlants = getMaxPlantsForTank(tankCapacity);

  if (currentPlants > 0 && totalSandKg <= 0) {
    warnings.push('Bitki eklemek için önce akvaryuma taban kumu eklemelisiniz!');
  }
  if (currentPlants > maxPlants) {
    warnings.push(`Maksimum bitki sınırı aşıldı! (${tankCapacity}L tabanı için max ${maxPlants} adet)`);
  }

  const totalAirOutlets = items
    .filter((i) => i.quantity > 0 && i.product.sub_category === 'hava-motorlari')
    .reduce((acc, i) => acc + (i.product.outlet_count || 1) * i.quantity, 0);

  const airDrivenEquipmentCount = items
    .filter((i) => i.quantity > 0 && i.product.needs_air_pump === true)
    .reduce((acc, i) => acc + i.quantity, 0);

  if (airDrivenEquipmentCount > 0 && totalAirOutlets === 0) {
    warnings.push(
      'Pipo filtre veya hava taşının çalışması için dışarıya en az 1 adet Hava Motoru eklemelisiniz!'
    );
  } else if (airDrivenEquipmentCount > totalAirOutlets) {
    warnings.push(
      `Hava motoru çıkışı yetersiz! (${airDrivenEquipmentCount} ekipman için ${totalAirOutlets} hava çıkışı mevcut)`
    );
  }

  const hasShrimp = items.some(
    (i) => i.quantity > 0 && i.product.sub_category === 'karidesler'
  );
  const hasUnsafeFilter = items.some(
    (i) =>
      i.quantity > 0 &&
      i.product.sub_category === 'filtreler' &&
      i.product.shrimp_safe === false
  );
  if (hasShrimp && hasUnsafeFilter) {
    warnings.push(
      'Dikkat: Motorlu iç filtre yavru karidesleri çekebilir! Karides tankları için Pipo Filtre önerilir.'
    );
  }

  items.forEach((item) => {
    const p = item.product;
    const qty = item.quantity;
    if (qty <= 0) return;

    const isAirStarved = p.needs_air_pump === true && totalAirOutlets === 0;
    const activeFactor = isAirStarved ? 0.15 : 1.0;

    totalBioLoad += p.bio_load * qty;
    if (p.min_liters > 0) {
      minLitersRequired = Math.max(minLitersRequired, p.min_liters);
    }

    rawAmmonia += p.ammonia_rate * qty * volumeScale;
    rawNitrite += p.nitrite_rate * qty * volumeScale;
    rawNitrate += p.nitrate_rate * qty * volumeScale;
    rawO2 += p.o2_rate * qty * volumeScale * activeFactor;
    rawCo2 += p.co2_rate * qty * volumeScale * activeFactor;

    ppm += p.ppm_impact * qty * volumeScale;
    gh += p.gh_impact * qty * volumeScale;
    kh += p.kh_impact * qty * volumeScale;
    ph += p.ph_impact * qty * volumeScale;
    tanninScore += p.tannin_rate * qty * volumeScale;
    algaeControlPower += p.algae_control_rate * qty * volumeScale;
    extraLumens += p.lumen * qty;
  });

  if (minLitersRequired > tankCapacity) {
    warnings.push(
      `Seçilen tank hacmi (${tankCapacity}L) yetersiz! Önerilen min: ${minLitersRequired}L`
    );
  }

  const activeFilters = items.filter(
    (i) => i.quantity > 0 && i.product.sub_category === 'filtreler'
  );
  if (activeFilters.length > 0) {
    const totalFiltrationPower = activeFilters.reduce((acc, f) => {
      const airModifier =
        f.product.needs_air_pump && totalAirOutlets === 0 ? 0.1 : 1.0;
      const power = f.product.filtration_power ?? 0.7;
      return acc + power * f.quantity * airModifier;
    }, 0);

    const conversionEfficiency = Math.min(0.92, totalFiltrationPower * 0.85);
    const convertedAmmonia = Math.max(0, rawAmmonia * conversionEfficiency);
    rawAmmonia = Math.max(0, rawAmmonia - convertedAmmonia);
    rawNitrite = Math.max(0, rawNitrite - convertedAmmonia * 0.72);
    rawNitrate += convertedAmmonia * 2.1;
  } else if (totalBioLoad > 3) {
    warnings.push('Filtrasyon yok! Amonyak ve Nitrit hızla birikiyor.');
  }

  const baseTankLumens = tankCapacity === 200 ? 2200 : tankCapacity === 100 ? 1200 : 650;
  const totalLumens = baseTankLumens + extraLumens;
  const lumenPerLiter = totalLumens / Math.max(10, tankCapacity);
  const dailyLightEnergy = lumenPerLiter * lightHours;

  const plantLightCapacity = (currentPlants / Math.max(1, maxPlants)) * 180;
  const excessLightEnergy = Math.max(0, dailyLightEnergy - (95 + plantLightCapacity));

  if (currentPlants > 0 && lightHours >= 6) {
    const photosynthesisBoost = Math.min(1.5, lightHours / 8) * (currentPlants / maxPlants);
    rawO2 += photosynthesisBoost * 1.4;
    rawCo2 = Math.max(3, rawCo2 - photosynthesisBoost * 3.5);
    rawNitrate = Math.max(0, rawNitrate - photosynthesisBoost * 8.0);
  }

  const nutrientFuel = Math.max(0, rawNitrate - 10) * 1.1 + Math.max(0, rawAmmonia) * 15;
  const rawAlgae =
    excessLightEnergy * 0.48 +
    nutrientFuel * (lightHours / 10) -
    algaeControlPower * 12;
  const algaeLevel = Number(Math.min(100, Math.max(0, rawAlgae)).toFixed(1));

  const co2PhShift = -Math.max(0, rawCo2 - 10) * 0.015;
  const finalPh = Number(Math.min(8.6, Math.max(5.4, ph + co2PhShift)).toFixed(2));
  const finalAmmonia = Number(Math.max(0, rawAmmonia).toFixed(2));
  const finalNitrite = Number(Math.max(0, rawNitrite).toFixed(2));
  const finalNitrate = Number(Math.max(0, rawNitrate).toFixed(1));
  const finalO2 = Number(Math.min(12.0, Math.max(1.5, rawO2)).toFixed(1));
  const finalCo2 = Number(Math.min(60.0, Math.max(2.0, rawCo2)).toFixed(1));
  const finalPpm = Math.round(Math.max(40, ppm));
  const finalGh = Number(Math.max(1, gh).toFixed(1));
  const finalKh = Number(Math.max(1, kh).toFixed(1));

  if (finalAmmonia >= 0.5) {
    warnings.push(`Yüksek Amonyak (${finalAmmonia} mg/L)! Su değişimi veya filtre gerekli.`);
  }
  if (finalNitrite >= 0.8) {
    warnings.push(`Kritik Nitrit (${finalNitrite} mg/L)! Balık solungaçları zarar görüyor.`);
  }
  if (finalNitrate >= 45) {
    warnings.push(`Yüksek Nitrat (${finalNitrate} mg/L)! Bitki ekleyin veya su değişimi yapın.`);
  }
  if (finalO2 <= 4.5) {
    warnings.push(`Düşük Oksijen (${finalO2} mg/L)! Hava/filtre akıntısını artırın.`);
  }
  if (finalCo2 >= 32) {
    warnings.push(`Yüksek CO2 (${finalCo2} ppm)! Balıklarda boğulma riski.`);
  }
  if (algaeLevel >= 50) {
    warnings.push(
      `Alg Patlaması (%${Math.round(algaeLevel)})! Işık süresini (${lightHours}s) azaltın veya alg yiyici ekleyin.`
    );
  }

  const activeSlugs = new Set(items.filter((i) => i.quantity > 0).map((i) => i.product.slug));
  const activeSpecies = new Set(
    items
      .filter((i) => i.quantity > 0 && i.product.species)
      .map((i) => i.product.species!)
  );

  const matchesRuleKey = (ruleSlug: string) => {
    if (activeSlugs.has(ruleSlug)) return true;
    if (ruleSlug === 'beta-erkek') {
      return items.some(
        (i) =>
          i.quantity > 0 &&
          i.product.species === 'beta' &&
          i.product.variant !== 'disi' &&
          i.product.variant !== 'yavru'
      );
    }
    if (ruleSlug === 'lepistes-erkek') {
      return items.some(
        (i) =>
          i.quantity > 0 &&
          i.product.species === 'lepistes' &&
          i.product.variant !== 'disi' &&
          i.product.variant !== 'yavru'
      );
    }
    return activeSpecies.has(ruleSlug);
  };

  rules.forEach((rule) => {
    if (rule.item_a_slug === rule.item_b_slug) {
      const matchingCount = items
        .filter((i) => i.quantity > 0)
        .reduce((sum, i) => {
          if (i.product.slug === rule.item_a_slug) return sum + i.quantity;
          if (
            rule.item_a_slug === 'beta-erkek' &&
            i.product.species === 'beta' &&
            i.product.variant !== 'disi' &&
            i.product.variant !== 'yavru'
          ) {
            return sum + i.quantity;
          }
          return sum;
        }, 0);

      if (matchingCount >= 2 && rule.status === 'uyumsuz') {
        if (!warnings.includes(rule.reason)) warnings.push(rule.reason);
      }
      return;
    }

    if (matchesRuleKey(rule.item_a_slug) && matchesRuleKey(rule.item_b_slug)) {
      if (rule.status === 'uyumsuz') {
        if (!warnings.includes(rule.reason)) warnings.push(rule.reason);
      } else if (rule.status === 'uyumlu') {
        if (!positiveNotes.includes(rule.reason)) positiveNotes.push(rule.reason);
      }
    }
  });

  const waterVisuals = computeBlendedWaterVisuals({
    ammonia: finalAmmonia,
    nitrite: finalNitrite,
    nitrate: finalNitrate,
    oxygen: finalO2,
    algaeLevel,
    tanninScore,
    warnings,
  });

  return {
    ph: finalPh,
    temperature: 25.0,
    bioLoad: Number(totalBioLoad.toFixed(1)),
    ammonia: finalAmmonia,
    nitrite: finalNitrite,
    nitrate: finalNitrate,
    oxygen: finalO2,
    co2: finalCo2,
    ppm: finalPpm,
    gh: finalGh,
    kh: finalKh,
    totalLumens: Math.round(totalLumens),
    lightHours,
    lumenPerLiter: Number(lumenPerLiter.toFixed(1)),
    algaeLevel,
    waterVisuals,
    warnings,
    positiveNotes,
    isHealthy: warnings.length === 0,
    maxPlants,
    currentPlants,
  };
}

export function isSpongeOrAirFilter(product: {
  slug?: string;
  name?: string;
  needs_air_pump?: boolean;
}): boolean {
  const slug = (product.slug || '').toLowerCase();
  const name = (product.name || '').toLowerCase();
  return (
    product.needs_air_pump === true ||
    slug.includes('pipo') ||
    slug.includes('sunger') ||
    name.includes('pipo') ||
    name.includes('sünger')
  );
}

export function calculateTankBounds(
  tankCapacity: number,
  totalSandKg: number = 0
): TankBounds {
  const dims = getTankDimensionsCm(tankCapacity);
  const width = dims.sceneWidth;
  const height = dims.sceneHeight;
  const depth = dims.sceneDepth;
  const glassThickness = 0.04;

  const bottomInnerY = -height / 2 + glassThickness;
  const waterTop = height / 2 - 0.18;

  const innerW = width - glassThickness * 2;
  const innerD = depth - glassThickness * 2;
  const sandVol = Math.max(0, totalSandKg) * 0.65;
  const sandHeight = Math.min(height * 0.35, sandVol / Math.max(0.1, innerW * innerD));
  const substrateTop = bottomInnerY + sandHeight;

  return {
    width,
    height,
    depth,
    waterLevel: waterTop,
    glassThickness,
    minX: -innerW / 2,
    maxX: innerW / 2,
    minY: bottomInnerY,
    maxY: height / 2,
    minZ: -innerD / 2,
    maxZ: innerD / 2,
    substrateTop,
    waterTop,
  };
}

export function findValidPlacement(
  product: TankItem['product'],
  existingItems: PlacedSceneItem[],
  bounds: TankBounds
): [number, number, number] {
  const randX = (margin = 0.35) =>
    (Math.random() * 2 - 1) * Math.max(0.2, bounds.width / 2 - margin);
  const randZ = (margin = 0.35) =>
    (Math.random() * 2 - 1) * Math.max(0.2, bounds.depth / 2 - margin);

  if (product.sub_category === 'hava-motorlari') {
    const pumpIndex = existingItems.filter(
      (i) => i.product.sub_category === 'hava-motorlari'
    ).length;
    const x = -bounds.width / 2 - 0.78;
    const startZ = bounds.depth / 2 - 0.55;
    const stepZ = Math.max(0.75, (bounds.depth - 0.85) / 3);
    const z = startZ - Math.min(3, pumpIndex) * stepZ;
    return [x, -bounds.height / 2, z];
  }

  if (product.sub_category === 'aydinlatmalar') {
    return [0, bounds.height / 2, 0];
  }

  if (
    product.category === 'kumlar' ||
    product.category === 'bitkiler' ||
    product.sub_category === 'hava-taslari' ||
    isSpongeOrAirFilter(product)
  ) {
    return [randX(0.45), bounds.substrateTop, randZ(0.45)];
  }

  if (product.sub_category === 'filtreler') {
    return [
      bounds.maxX - 0.25,
      Math.max(bounds.substrateTop + 0.1, bounds.waterTop - 1.05),
      bounds.minZ + 0.15,
    ];
  }

  const usableH = Math.max(0.4, bounds.waterTop - bounds.substrateTop);
  let y = bounds.substrateTop + usableH * 0.5;
  if (product.swim_zone === 'dip') {
    y = bounds.substrateTop + 0.12 + Math.random() * (usableH * 0.2);
  } else if (product.swim_zone === 'ust') {
    y = bounds.substrateTop + usableH * (0.68 + Math.random() * 0.22);
  } else {
    y = bounds.substrateTop + usableH * (0.32 + Math.random() * 0.36);
  }

  return [randX(0.4), y, randZ(0.4)];
}