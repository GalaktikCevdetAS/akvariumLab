export interface Product {
  id: string;
  slug: string;
  name: string;
  category: 'baliklar' | 'bitkiler' | 'kumlar' | 'malzemeler';
  price: number;
  min_liters: number;
  ideal_temp_min: number;
  ideal_temp_max: number;
  ideal_ph_min: number;
  ideal_ph_max: number;
  bio_load: number;
  description: string;
  color: string;
  swim_zone?: 'dip' | 'orta' | 'ust';
}

export interface TankItem {
  product: Product;
  quantity: number;
}

export const MOCK_CATALOG: Product[] = [
  {
    id: '1',
    slug: 'lepistes',
    name: 'Lepistes (Guppy)',
    category: 'baliklar',
    price: 45.00,
    min_liters: 5,
    ideal_temp_min: 22,
    ideal_temp_max: 28,
    ideal_ph_min: 6.8,
    ideal_ph_max: 7.8,
    bio_load: 2,
    description: 'Renkli kuyrukları ve hareketli yapısıyla akvaryumların vazgeçilmez canlı doğuran türü.',
    color: '#ff6b6b',
    swim_zone: 'orta'
  },
  {
    id: '2',
    slug: 'anubias',
    name: 'Anubias Barteri',
    category: 'bitkiler',
    price: 85.00,
    min_liters: 10,
    ideal_temp_min: 20,
    ideal_temp_max: 28,
    ideal_ph_min: 6.0,
    ideal_ph_max: 7.5,
    bio_load: -1,
    description: 'Dayanıklı yaprakları olan, düşük ışıkta bile harika gelişen popüler akvaryum bitkisi.',
    color: '#2b8a3e'
  },
  {
    id: '3',
    slug: 'silis-kum',
    name: 'Natürel Silis Kum (1kg)',
    category: 'kumlar',
    price: 35.00,
    min_liters: 0,
    ideal_temp_min: 15,
    ideal_temp_max: 32,
    ideal_ph_min: 6.0,
    ideal_ph_max: 8.0,
    bio_load: 0,
    description: 'Balıklarınızı yaralamayan, bitki kökleri ve dip balıkları için ideal 0.5mm taban kumu.',
    color: '#e2e8f0'
  },
  {
    id: '4',
    slug: 'ic-filtre',
    name: 'AquaPro İç Filtre 300L/h',
    category: 'malzemeler',
    price: 220.00,
    min_liters: 20,
    ideal_temp_min: 15,
    ideal_temp_max: 32,
    ideal_ph_min: 6.0,
    ideal_ph_max: 8.0,
    bio_load: -5,
    description: 'Akvaryumunuzda kristal berraklığında su sağlayan, oksijen veren yüksek performanslı iç filtre.',
    color: '#339af0'
  }
];

export async function fetchCatalog(): Promise<Product[]> {
  try {
    const { createClient } = await import('./client');
    const supabase = createClient();
    if (!supabase) {
      console.warn('[Supabase] İstemci başlatılamadı (.env.local bilgileri kontrol edin), Mock katalog kullanılıyor.');
      return MOCK_CATALOG;
    }
    
    // Önce 'catalog' tablosunu dene, yoksa 'products' tablosunu kontrol et
    let { data, error } = await supabase.from('catalog').select('*');
    if (error && error.code === 'PGRST205') {
      const fallbackQuery = await supabase.from('products').select('*');
      if (!fallbackQuery.error && fallbackQuery.data && fallbackQuery.data.length > 0) {
        data = fallbackQuery.data;
        error = null;
      }
    }

    if (error) {
      console.warn('[Supabase] Tablo sorgulanamadı:', error.message, '- Mock katalog kullanılıyor.');
      return MOCK_CATALOG;
    }

    if (!data || data.length === 0) {
      console.info('[Supabase] Tablo bulundu ancak boş, Mock katalog kullanılıyor.');
      return MOCK_CATALOG;
    }

    console.info(`[Supabase] Başarıyla ${data.length} adet ürün yüklendi.`);
    return data as Product[];
  } catch (err: any) {
    console.error('[Supabase] Bağlantı hatası:', err?.message || err, '- Mock katalog kullanılıyor.');
    return MOCK_CATALOG;
  }
}

