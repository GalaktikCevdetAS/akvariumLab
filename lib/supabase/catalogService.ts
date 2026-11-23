export interface Product {
  id: string;
  slug: string;
  species?: string;
  variant?: 'erkek' | 'disi' | 'yavru' | 'standart' | string;
  name: string;
  category: 'canlilar' | 'bitkiler' | 'kumlar' | 'malzemeler';
  sub_category: string;
  price: number;
  min_liters: number;
  ideal_temp_min: number;
  ideal_temp_max: number;
  ideal_ph_min: number;
  ideal_ph_max: number;
  bio_load: number;
  description: string;
  color: string;
  fin_color?: string;
  image_url?: string;
  swim_zone?: 'dip' | 'orta' | 'ust';
  length_cm: number;

  // Biyokimya, Mineral, Gaz ve Işık Parametreleri
  ammonia_rate: number;
  nitrite_rate: number;
  nitrate_rate: number;
  o2_rate: number;
  co2_rate: number;
  ppm_impact: number;
  gh_impact: number;
  kh_impact: number;
  ph_impact: number;
  tannin_rate: number;
  algae_control_rate: number;
  lumen: number;
  kelvin?: number;
  light_spectrum?: 'beyaz' | 'beyaz-mavi' | 'uc-renk' | string;
}

export interface CompatibilityRule {
  id: string;
  item_a_slug: string;
  item_b_slug: string;
  status: 'uyumlu' | 'uyumsuz' | string;
  reason: string;
}

export interface TankItem {
  product: Product;
  quantity: number;
}

export interface CatalogResponse {
  products: Product[];
  rules: CompatibilityRule[];
  source: 'supabase' | 'error';
  errorMessage?: string;
}

function normalizeCategory(rawCategory: string): Product['category'] {
  const cat = (rawCategory || '').toLowerCase().trim();
  if (cat === 'balik' || cat === 'baliklar' || cat === 'canli' || cat === 'canlilar') {
    return 'canlilar';
  }
  if (cat === 'bitki' || cat === 'bitkiler') return 'bitkiler';
  if (cat === 'kum' || cat === 'kumlar' || cat === 'taban' || cat === 'dekor') return 'kumlar';
  return 'malzemeler';
}

function inferSubCategory(
  slug: string,
  name: string,
  category: Product['category'],
  rawSub?: string
): string {
  if (rawSub && rawSub.trim().length > 0) return rawSub.toLowerCase().trim();
  const s = `${slug} ${name}`.toLowerCase();

  if (category === 'canlilar') {
    if (s.includes('karides') || s.includes('shrimp') || s.includes('neocaridina')) return 'karidesler';
    if (s.includes('salyangoz') || s.includes('snail') || s.includes('midye') || s.includes('nerite') || s.includes('elma')) return 'kabuklular';
    if (s.includes('bocek') || s.includes('böcek') || s.includes('su-piresi') || s.includes('artemia')) return 'bocekler';
    return 'baliklar';
  }

  if (category === 'bitkiler') {
    if (s.includes('moss') || s.includes('yosun')) return 'yosunlar';
    if (s.includes('anubias') || s.includes('bucephalandra') || s.includes('fern')) return 'rizom';
    if (s.includes('pistia') || s.includes('salvinia') || s.includes('mercimek') || s.includes('ust')) return 'su-ustu';
    return 'govdeli';
  }

  if (category === 'kumlar') {
    if (s.includes('toprak') || s.includes('soil') || s.includes('aktif')) return 'aktif-toprak';
    if (s.includes('kok') || s.includes('kök') || s.includes('mangrow') || s.includes('kaya') || s.includes('tas')) return 'dekor';
    return 'kum';
  }

  if (s.startsWith('led-') || s.includes('isik') || s.includes('ışık') || s.includes('aydinlatma')) return 'isiklar';
  if (s.includes('filtre') || s.includes('motor') || s.includes('kafa') || s.includes('hava')) return 'motorlar';
  if (s.includes('isitici') || s.includes('ısıtıcı') || s.includes('co2') || s.includes('termostat')) return 'isitici-co2';
  return 'diger-ekipman';
}

function inferSpeciesFromSlug(slug: string): string {
  if (slug.startsWith('lepistes')) return 'lepistes';
  if (slug.startsWith('beta')) return 'beta';
  return slug;
}

function inferVariantFromSlug(slug: string): string {
  if (slug.includes('crowntail')) return 'crowntail';
  if (slug.includes('plakat')) return 'plakat';
  if (slug.includes('dumbo')) return 'dumbo';
  if (slug.includes('double-sword')) return 'double-sword';
  if (slug.includes('lyra')) return 'lyra';
  if (slug.endsWith('-erkek')) return 'erkek';
  if (slug.endsWith('-disi')) return 'disi';
  if (slug.endsWith('-yavru')) return 'yavru';
  return 'standart';
}

function getDefaultColorBySlug(slug: string, category: Product['category']): string {
  if (slug.includes('golden') || slug.includes('yellow')) return '#facc15';
  if (slug.includes('moscow-blue')) return '#1d4ed8';
  if (slug.includes('blue-neon') || slug.includes('turquoise')) return '#38bdf8';
  if (slug.includes('full-red') || slug.includes('super-red')) return '#ef4444';
  if (slug.includes('mustard-gas')) return '#0284c7';
  if (slug.includes('platinum') || slug.includes('white')) return '#f8fafc';
  if (slug === 'lepistes-erkek' || slug === 'lepistes') return '#ff6b6b';
  if (slug === 'lepistes-disi') return '#f59e0b';
  if (slug === 'lepistes-yavru') return '#fda4af';
  if (slug === 'beta-erkek' || slug === 'beta') return '#2563eb';
  if (slug === 'beta-disi') return '#ec4899';
  if (slug === 'beta-yavru') return '#a78bfa';
  if (slug === 'anubias') return '#2b8a3e';
  if (slug === 'silis-kum') return '#e2e8f0';
  if (category === 'canlilar') return '#38bdf8';
  if (category === 'bitkiler') return '#22c55e';
  if (category === 'kumlar') return '#f59e0b';
  return '#a855f7';
}

export async function fetchCatalogWithStatus(): Promise<CatalogResponse> {
  try {
    const { createClient } = await import('./client');
    const supabase = createClient();

    if (!supabase) {
      return {
        products: [],
        rules: [],
        source: 'error',
        errorMessage: '.env.local dosyasında Supabase URL veya Anon Key eksik.',
      };
    }

    const [itemsRes, rulesRes] = await Promise.all([
      supabase.from('catalog_items').select('*').order('name', { ascending: true }),
      supabase.from('compatibility_rules').select('*'),
    ]);

    if (itemsRes.error) {
      return {
        products: [],
        rules: [],
        source: 'error',
        errorMessage: `Supabase Sorgu Hatası (${itemsRes.error.code}): ${itemsRes.error.message}`,
      };
    }

    const normalizedProducts: Product[] = (itemsRes.data || []).map((item: any) => {
      const normalizedCategory = normalizeCategory(item.category);
      const slug = String(item.slug);
      const name = String(item.name);
      const bodyColor = item.color ? String(item.color) : getDefaultColorBySlug(slug, normalizedCategory);
      return {
        id: String(item.id),
        slug,
        species: item.species ? String(item.species) : inferSpeciesFromSlug(slug),
        variant: item.variant ? String(item.variant) : inferVariantFromSlug(slug),
        name,
        category: normalizedCategory,
        sub_category: inferSubCategory(slug, name, normalizedCategory, item.sub_category),
        price: Number(item.price ?? 0),
        min_liters: Number(item.min_volume_lt ?? item.min_liters ?? 0),
        ideal_temp_min: Number(item.min_temp ?? item.ideal_temp_min ?? 20),
        ideal_temp_max: Number(item.max_temp ?? item.ideal_temp_max ?? 28),
        ideal_ph_min: Number(item.min_ph ?? item.ideal_ph_min ?? 6.5),
        ideal_ph_max: Number(item.max_ph ?? item.ideal_ph_max ?? 7.8),
        bio_load: Number(item.bio_load ?? 0),
        description: String(item.description ?? ''),
        color: bodyColor,
        fin_color: item.fin_color ? String(item.fin_color) : bodyColor,
        image_url: item.image_url ? String(item.image_url) : undefined,
        swim_zone: (item.swim_zone as Product['swim_zone']) || 'orta',
        length_cm: Number(item.length_cm ?? (normalizedCategory === 'bitkiler' ? 14 : 4.5)),

        ammonia_rate: Number(item.ammonia_rate ?? 0),
        nitrite_rate: Number(item.nitrite_rate ?? 0),
        nitrate_rate: Number(item.nitrate_rate ?? 0),
        o2_rate: Number(item.o2_rate ?? 0),
        co2_rate: Number(item.co2_rate ?? 0),
        ppm_impact: Number(item.ppm_impact ?? 0),
        gh_impact: Number(item.gh_impact ?? 0),
        kh_impact: Number(item.kh_impact ?? 0),
        ph_impact: Number(item.ph_impact ?? 0),
        tannin_rate: Number(item.tannin_rate ?? 0),
        algae_control_rate: Number(item.algae_control_rate ?? 0),
        lumen: Number(item.lumen ?? 0),
        kelvin: item.kelvin ? Number(item.kelvin) : slug.includes('10000k') ? 10000 : 6500,
        light_spectrum: item.light_spectrum
          ? String(item.light_spectrum)
          : slug.includes('uc-renk')
          ? 'uc-renk'
          : slug.includes('beyaz-mavi')
          ? 'beyaz-mavi'
          : slug.startsWith('led-')
          ? 'beyaz'
          : undefined,
      };
    });

    const normalizedRules: CompatibilityRule[] = (rulesRes.data || []).map((r: any) => ({
      id: String(r.id),
      item_a_slug: String(r.item_a_slug),
      item_b_slug: String(r.item_b_slug),
      status: String(r.status),
      reason: String(r.reason),
    }));

    return {
      products: normalizedProducts,
      rules: normalizedRules,
      source: 'supabase',
    };
  } catch (err: any) {
    return {
      products: [],
      rules: [],
      source: 'error',
      errorMessage: err?.message || 'Bilinmeyen bağlantı hatası',
    };
  }
}

export async function fetchCatalog(): Promise<Product[]> {
  const res = await fetchCatalogWithStatus();
  if (res.source === 'error' && res.errorMessage) {
    console.error('[Supabase Hatası]:', res.errorMessage);
  }
  return res.products;
}