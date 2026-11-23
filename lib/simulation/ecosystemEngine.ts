import * as THREE from 'three';
import { TankItem, CompatibilityRule } from '../supabase/catalogService';

export interface WaterVisualState {
  phase: 'clean' | 'moderate' | 'algae' | 'tannin' | 'critical';
  color: string;
  opacity: number;
  roughness: number;
  label: string;
  isLethal: boolean; // Balıkların ters dönüp su yüzeyine çıkma durumu
}

export interface EcosystemStatus {
  ph: number;
  temperature: number;
  bioLoad: number;

  // Azot Döngüsü (mg/L)
  ammonia: number; // NH3/NH4+ (0.25 üstü tehlikeli, 1.0 üstü ölümcül)
  nitrite: number; // NO2- (0.5 üstü tehlikeli, 2.0 üstü ölümcül)
  nitrate: number; // NO3- (0-25 ideal, 40+ alg tetikleyici, 80+ toksik)

  // Gaz Dengesi
  oxygen: number;  // O2 (mg/L - 6.5-8.5 ideal, 4.0 altı hipoksi)
  co2: number;     // CO2 (ppm - 10-25 bitkili ideal, 35+ boğucu)

  // Mineraller & Sertlik
  ppm: number;     // TDS / Toplam Çözünmüş Katı Madde (120-350 ppm)
  gh: number;      // Genel Sertlik (°dH)
  kh: number;      // Karbonat Sertliği (°dH)

  // Aydınlatma & Alg Fotokimyası
  totalLumens: number;
  lightHours: number;
  lumenPerLiter: number;
  algaeLevel: number; // 0 - 100%

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
    return { widthCm: 100, depthCm: 40, heightCm: 50, sceneWidth: 10.0, sceneHeight: 5.0, sceneDepth: 4.0 };
  }
  if (tankCapacity === 100) {
    return { widthCm: 80, depthCm: 35, heightCm: 40, sceneWidth: 8.0, sceneHeight: 4.0, sceneDepth: 3.5 };
  }
  return { widthCm: 50, depthCm: 30, heightCm: 35, sceneWidth: 5.0, sceneHeight: 3.5, sceneDepth: 3.0 };
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

/**
 * Çok Parametreli Ortalama Su Rengi ve Optik Görünüm Hesaplayıcısı
 * - Temiz Kristal Mavi (#0284c7)
 * - Alg Patlaması / Yeşil Su (#15803d / #4d7c0f)
 * - Amonyak / Nitrit Toksisitesi (#dc2626 / #ea580c)
 * - Tanen / Kök Salınımı (#92400e)
 */
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

  // Toksisite skoru (0..1)
  const toxicityFactor = Math.min(
    1,
    Math.max(
      ammonia / 1.2,
      nitrite / 2.0,
      oxygen < 4.2 ? (4.2 - oxygen) / 2.5 : 0
    )
  );

  // Alg yeşillenme skoru (0..1)
  const algaeFactor = Math.min(1, algaeLevel / 100);

  // Tanen amber skoru (0..1)
  const tanninFactor = Math.min(1, tanninScore / 10);

  // Temel renk vektörleri
  const cleanColor = new THREE.Color('#0284c7');   // Kristal berrak mavi
  const algaeColor = new THREE.Color('#16a34a');   // Zümrüt/yosun yeşili
  const toxicColor = new THREE.Color('#dc2626');   // Toksik kızıl-turuncu
  const tanninColor = new THREE.Color('#b45309');  // Amber / Blackwater

  // Ağırlıklı renk harmanlaması
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

  // Bulanıklık (opacity ve roughness)
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

  // Litre ölçek faktörü (50L baz alınır)
  const volumeScale = 50 / Math.max(10, tankCapacity);

  let totalBioLoad = 0;
  let minLitersRequired = 0;

  // Ham akvaryum başlangıç değerleri (musluk / dinlenmiş çeşme suyu)
  let rawAmmonia = 0;
  let rawNitrite = 0;
  let rawNitrate = 5.0; // Başlangıç 5 mg/L nitrat
  let rawO2 = 7.8;      // Başlangıç 7.8 mg/L çözünmüş oksijen
  let rawCo2 = 6.0;     // Başlangıç 6 ppm CO2
  let ppm = 160;        // Başlangıç 160 ppm TDS
  let gh = 6.0;         // Başlangıç 6 °dH GH
  let kh = 4.5;         // Başlangıç 4.5 °dH KH
  let ph = 7.2;
  let tanninScore = 0;
  let algaeControlPower = 0;
  let extraLumens = 0;

  // Kum ve bitki sayımları
  const sandItems = items.filter((i) => i.product.category === 'kumlar');
  const totalSandKg = sandItems.reduce((acc, i) => acc + i.quantity, 0);
  const maxSandKg = Math.floor((tankCapacity * 0.25) / 0.65);

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

  // Tüm ürünlerin kimyasal/fiziksel etkilerini topla
  items.forEach((item) => {
    const p = item.product;
    const qty = item.quantity;
    if (qty <= 0) return;

    totalBioLoad += p.bio_load * qty;
    if (p.min_liters > 0) {
      minLitersRequired = Math.max(minLitersRequired, p.min_liters);
    }

    rawAmmonia += p.ammonia_rate * qty * volumeScale;
    rawNitrite += p.nitrite_rate * qty * volumeScale;
    rawNitrate += p.nitrate_rate * qty * volumeScale;
    rawO2 += p.o2_rate * qty * volumeScale;
    rawCo2 += p.co2_rate * qty * volumeScale;

    ppm += p.ppm_impact * qty * volumeScale;
    gh += p.gh_impact * qty * volumeScale;
    kh += p.kh_impact * qty * volumeScale;
    ph += p.ph_impact * qty * volumeScale;
    tanninScore += p.tannin_rate * qty * volumeScale;
    algaeControlPower += p.algae_control_rate * qty * volumeScale;
    extraLumens += p.lumen * qty;
  });

  if (minLitersRequired > tankCapacity) {
    warnings.push(`Seçilen tank hacmi (${tankCapacity}L) yetersiz! Önerilen min: ${minLitersRequired}L`);
  }

  // Azot Döngüsü (Nitrifikasyon): Filtre varsa Amonyak -> Nitrit -> Nitrat dönüşümü gerçekleşir
  const hasFilter = items.some(
  (i) =>
    i.quantity > 0 &&
    (i.product.sub_category === 'motorlar' || i.product.slug.includes('filtre'))
);
  if (hasFilter) {
    // Biyolojik filtrasyon amonyak ve nitriti parçalar, son ürün olarak bir miktar nitrat üretir
    const convertedAmmonia = Math.max(0, rawAmmonia * 0.78);
    rawAmmonia = Math.max(0, rawAmmonia - convertedAmmonia);
    rawNitrite = Math.max(0, rawNitrite - convertedAmmonia * 0.65);
    rawNitrate += convertedAmmonia * 2.2;
  } else if (totalBioLoad > 3) {
    warnings.push('Filtrasyon yok! Amonyak ve Nitrit hızla birikiyor.');
  }

  // Işık (Lümen × Saat) ve Bitki Fotosentez / Alg Dengesi
  // Varsayılan tank kapağı ışığı (tank kapasitesine göre) + eklenen aydınlatmalar
  const baseTankLumens = tankCapacity === 200 ? 2200 : tankCapacity === 100 ? 1200 : 650;
  const totalLumens = baseTankLumens + extraLumens;
  const lumenPerLiter = totalLumens / Math.max(10, tankCapacity);
  const dailyLightEnergy = lumenPerLiter * lightHours; // Örn: 15 lm/L * 8 saat = 120 birim

  // Bitkiler ışık varken CO2 ve Nitrat tüketip O2 üretir; ışık aşırıysa tüketemedikleri besin alge dönüşür
  const plantLightCapacity = (currentPlants / Math.max(1, maxPlants)) * 180;
  const excessLightEnergy = Math.max(0, dailyLightEnergy - (95 + plantLightCapacity));

  if (currentPlants > 0 && lightHours >= 6) {
    const photosynthesisBoost = Math.min(1.5, lightHours / 8) * (currentPlants / maxPlants);
    rawO2 += photosynthesisBoost * 1.4;
    rawCo2 = Math.max(3, rawCo2 - photosynthesisBoost * 3.5);
    rawNitrate = Math.max(0, rawNitrate - photosynthesisBoost * 8.0);
  }

  // Alg Yoğunluğu Hesabı (Aşırı ışık + yüksek Nitrat - Alg yiyiciler/filtre)
  const nutrientFuel = Math.max(0, rawNitrate - 10) * 1.1 + Math.max(0, rawAmmonia) * 15;
  const rawAlgae = (excessLightEnergy * 0.48) + (nutrientFuel * (lightHours / 10)) - (algaeControlPower * 12);
  const algaeLevel = Number(Math.min(100, Math.max(0, rawAlgae)).toFixed(1));

  // CO2 artışı pH'ı düşürür (karbonik asit dengesi)
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

  // Kimyasal Eşik Uyarıları
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
    warnings.push(`Alg Patlaması (%${Math.round(algaeLevel)})! Işık süresini (${lightHours}s) azaltın veya alg yiyici ekleyin.`);
  }

  // Supabase compatibility_rules kontrolü
  const activeSlugs = new Set(items.filter((i) => i.quantity > 0).map((i) => i.product.slug));
  rules.forEach((rule) => {
    if (activeSlugs.has(rule.item_a_slug) && activeSlugs.has(rule.item_b_slug)) {
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