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
  volume_per_unit_lt?: number;
  temperament?: string;
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

  // Ekipman & Teknik Parametreler
  watt?: number;
  outlet_count?: number;
  flow_rate_lph?: number;
  filtration_power?: number;
  shrimp_safe?: boolean;
  needs_air_pump?: boolean;
  placement_zone?: 'outside_left' | 'substrate' | 'glass_wall' | 'top_rim' | string;
}

export interface CatalogCategory {
  id: number;
  name: string;
  slug: string;
  parent_slug: string | null;
  target_table: string | null;
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
  categories: CatalogCategory[];
  rules: CompatibilityRule[];
  source: 'supabase' | 'error';
  errorMessage?: string;
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

function buildAutoDescription(row: any, category: Product['category'], subCategory: string): string {
  if (row.description && String(row.description).trim().length > 0) {
    return String(row.description);
  }
  if (subCategory === 'aydinlatmalar') {
    return `${row.length_cm || 50} cm • ${row.kelvin || 6500}K • ${row.lumen || 0} Lümen LED akvaryum armatürü.`;
  }
  if (subCategory === 'filtreler') {
    const flow = row.flow_rate_lph ? `${row.flow_rate_lph} L/h debi • ` : '';
    const shrimp = row.shrimp_safe ? 'Karides güvenli • ' : '';
    return `${flow}${shrimp}Filtrasyon gücü: %${Math.round(Number(row.filtration_power || 0) * 100)}.`;
  }
  if (subCategory === 'hava-motorlari') {
    return `${row.watt || 0}W • ${row.outlet_count || 1} çıkışlı • ${row.flow_rate_lph || 0} L/h hava motoru.`;
  }
  if (subCategory === 'hava-taslari') {
    return `${row.length_cm || 3} cm hava taşı / difüzör (Hava motoru gerektirir).`;
  }
  if (category === 'kumlar') {
    return `1 Kg başına ${row.volume_per_unit_lt ?? 0.65}L taban hacmi sağlar.`;
  }
  if (category === 'bitkiler') {
    return `Doğal nitrat ve CO₂ tüketimi ile su kalitesini dengeler.`;
  }
  const temp =
    row.min_temp && row.max_temp ? `${row.min_temp}-${row.max_temp}°C • ` : '';
  const ph =
    row.min_ph && row.max_ph ? `pH ${row.min_ph}-${row.max_ph}` : '';
  return `${temp}${ph}`.trim() || 'Akvaryum ekosistemi uyumlu ürün.';
}

function normalizeRowToProduct(
  row: any,
  category: Product['category'],
  subCategory: string
): Product {
  const slug = String(row.slug || row.id);
  const name = String(row.name || 'İsimsiz Ürün');
  const bodyColor = row.color
    ? String(row.color)
    : getDefaultColorBySlug(slug, category);

  return {
    id: String(row.id),
    slug,
    species: row.species ? String(row.species) : undefined,
    variant: row.variant ? String(row.variant) : 'standart',
    name,
    category,
    sub_category: subCategory,
    price: Number(row.price ?? 0),
    min_liters: Number(row.min_volume_lt ?? row.min_liters ?? 0),
    ideal_temp_min: Number(row.min_temp ?? 20),
    ideal_temp_max: Number(row.max_temp ?? 28),
    ideal_ph_min: Number(row.min_ph ?? 6.5),
    ideal_ph_max: Number(row.max_ph ?? 7.8),
    bio_load: Number(row.bio_load ?? 0),
    volume_per_unit_lt:
      row.volume_per_unit_lt !== undefined && row.volume_per_unit_lt !== null
        ? Number(row.volume_per_unit_lt)
        : undefined,
    temperament: row.temperament ? String(row.temperament) : undefined,
    description: buildAutoDescription(row, category, subCategory),
    color: bodyColor,
    fin_color: row.fin_color ? String(row.fin_color) : bodyColor,
    image_url: row.image_url ? String(row.image_url) : undefined,
    swim_zone: (row.swim_zone as Product['swim_zone']) || 'orta',
    length_cm: Number(row.length_cm ?? (category === 'bitkiler' ? 14 : 4.5)),

    ammonia_rate: Number(row.ammonia_rate ?? 0),
    nitrite_rate: Number(row.nitrite_rate ?? 0),
    nitrate_rate: Number(row.nitrate_rate ?? 0),
    o2_rate: Number(row.o2_rate ?? 0),
    co2_rate: Number(row.co2_rate ?? 0),
    ppm_impact: Number(row.ppm_impact ?? 0),
    gh_impact: Number(row.gh_impact ?? 0),
    kh_impact: Number(row.kh_impact ?? 0),
    ph_impact: Number(row.ph_impact ?? 0),
    tannin_rate: Number(row.tannin_rate ?? 0),
    algae_control_rate: Number(row.algae_control_rate ?? 0),
    lumen: Number(row.lumen ?? 0),
    kelvin: row.kelvin ? Number(row.kelvin) : undefined,
    light_spectrum: row.light_spectrum ? String(row.light_spectrum) : undefined,

    watt: row.watt !== undefined && row.watt !== null ? Number(row.watt) : undefined,
    outlet_count:
      row.outlet_count !== undefined && row.outlet_count !== null
        ? Number(row.outlet_count)
        : undefined,
    flow_rate_lph:
      row.flow_rate_lph !== undefined && row.flow_rate_lph !== null
        ? Number(row.flow_rate_lph)
        : undefined,
    filtration_power:
      row.filtration_power !== undefined && row.filtration_power !== null
        ? Number(row.filtration_power)
        : undefined,
    shrimp_safe:
      row.shrimp_safe !== undefined && row.shrimp_safe !== null
        ? Boolean(row.shrimp_safe)
        : undefined,
    needs_air_pump:
      row.needs_air_pump !== undefined && row.needs_air_pump !== null
        ? Boolean(row.needs_air_pump)
        : undefined,
    placement_zone: row.placement_zone ? String(row.placement_zone) : undefined,
  };
}

export async function fetchCatalogWithStatus(): Promise<CatalogResponse> {
  try {
    const { createClient } = await import('./client');
    const supabase = createClient();

    if (!supabase) {
      return {
        products: [],
        categories: [],
        rules: [],
        source: 'error',
        errorMessage: '.env.local dosyasında NEXT_PUBLIC_SUPABASE_URL veya ANON_KEY eksik.',
      };
    }

    // Kolon bağımlılığı olmaması için .order() kullanmadan ham SELECT * çekip JS tarafında sıralıyoruz
    const [
      categoriesRes,
      rulesRes,
      baliklarRes,
      karideslerRes,
      salyangozlarRes,
      bitkilerRes,
      kumlarRes,
      aydinlatmalarRes,
      havaMotorlariRes,
      havaTaslariRes,
      filtrelerRes,
    ] = await Promise.all([
      supabase.from('catalog_categories').select('*'),
      supabase.from('compatibility_rules').select('*'),
      supabase.from('baliklar').select('*'),
      supabase.from('karidesler').select('*'),
      supabase.from('salyangozlar').select('*'),
      supabase.from('bitkiler').select('*'),
      supabase.from('kumlar').select('*'),
      supabase.from('aydinlatmalar').select('*'),
      supabase.from('hava_motorlari').select('*'),
      supabase.from('hava_taslari').select('*'),
      supabase.from('filtreler').select('*'),
    ]);

    const tableQueries = [
      { table: 'baliklar', res: baliklarRes },
      { table: 'karidesler', res: karideslerRes },
      { table: 'salyangozlar', res: salyangozlarRes },
      { table: 'bitkiler', res: bitkilerRes },
      { table: 'kumlar', res: kumlarRes },
      { table: 'aydinlatmalar', res: aydinlatmalarRes },
      { table: 'hava_motorlari', res: havaMotorlariRes },
      { table: 'hava_taslari', res: havaTaslariRes },
      { table: 'filtreler', res: filtrelerRes },
    ];

    const errors = tableQueries
      .filter((q) => q.res.error)
      .map((q) => `${q.table}: ${q.res.error!.message} (${q.res.error!.code})`);

    const allProducts: Product[] = [
      ...(baliklarRes.data || []).map((r) => normalizeRowToProduct(r, 'canlilar', 'baliklar')),
      ...(karideslerRes.data || []).map((r) => normalizeRowToProduct(r, 'canlilar', 'karidesler')),
      ...(salyangozlarRes.data || []).map((r) => normalizeRowToProduct(r, 'canlilar', 'salyangozlar')),
      ...(bitkilerRes.data || []).map((r) => normalizeRowToProduct(r, 'bitkiler', 'bitkiler')),
      ...(kumlarRes.data || []).map((r) => normalizeRowToProduct(r, 'kumlar', 'kumlar')),
      ...(aydinlatmalarRes.data || []).map((r) =>
        normalizeRowToProduct(r, 'malzemeler', 'aydinlatmalar')
      ),
      ...(havaMotorlariRes.data || []).map((r) =>
        normalizeRowToProduct(r, 'malzemeler', 'hava-motorlari')
      ),
      ...(havaTaslariRes.data || []).map((r) =>
        normalizeRowToProduct(r, 'malzemeler', 'hava-taslari')
      ),
      ...(filtrelerRes.data || []).map((r) =>
        normalizeRowToProduct(r, 'malzemeler', 'filtreler')
      ),
    ];

    // İsim sırasına göre JS içinde güvenli sırala
    allProducts.sort((a, b) => a.name.localeCompare(b.name, 'tr'));

    const normalizedCategories: CatalogCategory[] = (categoriesRes.data || [])
      .map((c: any) => ({
        id: Number(c.id),
        name: String(c.name),
        slug: String(c.slug),
        parent_slug: c.parent_slug ? String(c.parent_slug) : null,
        target_table: c.target_table ? String(c.target_table) : null,
      }))
      .sort((a, b) => a.id - b.id);

    const normalizedRules: CompatibilityRule[] = (rulesRes.data || []).map((r: any) => ({
      id: String(r.id),
      item_a_slug: String(r.item_a_slug),
      item_b_slug: String(r.item_b_slug),
      status: String(r.status),
      reason: String(r.reason),
    }));

    // Hiç ürün dönmediyse nedenini açıkça raporla (RLS veya tablo hatası)
    if (allProducts.length === 0) {
      const detail =
        errors.length > 0
          ? `Tablo Hataları -> ${errors.join(' | ')}`
          : 'Tüm tablolardan 0 satır döndü. Supabase RLS (Row Level Security) açık kalmış olabilir; tablolara SELECT (anon) izni verin.';
      return {
        products: [],
        categories: normalizedCategories,
        rules: normalizedRules,
        source: 'error',
        errorMessage: detail,
      };
    }

    return {
      products: allProducts,
      categories: normalizedCategories,
      rules: normalizedRules,
      source: 'supabase',
      errorMessage: errors.length > 0 ? errors.join(' | ') : undefined,
    };
  } catch (err: any) {
    return {
      products: [],
      categories: [],
      rules: [],
      source: 'error',
      errorMessage: err?.message || 'Bilinmeyen bağlantı hatası',
    };
  }
}

export async function fetchCatalog(): Promise<Product[]> {
  const res = await fetchCatalogWithStatus();
  if (res.errorMessage) {
    console.error('[Supabase Katalog Uyarısı]:', res.errorMessage);
  }
  return res.products;
}