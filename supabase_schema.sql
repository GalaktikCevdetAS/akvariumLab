-- =========================================================
-- AkvaryumLab (fishLab) Supabase 'catalog' Tablosu Kurulumu
-- Bu SQL kodunu Supabase Dashboard -> SQL Editor kısmına yapıştırıp RUN butonuna basın.
-- =========================================================

-- 1. 'catalog' tablosunu oluştur
CREATE TABLE IF NOT EXISTS public.catalog (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('baliklar', 'bitkiler', 'kumlar', 'malzemeler')),
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    min_liters INTEGER NOT NULL DEFAULT 0,
    ideal_temp_min NUMERIC(4, 1) NOT NULL DEFAULT 20,
    ideal_temp_max NUMERIC(4, 1) NOT NULL DEFAULT 28,
    ideal_ph_min NUMERIC(3, 1) NOT NULL DEFAULT 6.5,
    ideal_ph_max NUMERIC(3, 1) NOT NULL DEFAULT 7.5,
    bio_load INTEGER NOT NULL DEFAULT 0,
    description TEXT NOT NULL DEFAULT '',
    color TEXT NOT NULL DEFAULT '#38bdf8',
    swim_zone TEXT DEFAULT 'orta' CHECK (swim_zone IN ('dip', 'orta', 'ust')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Herkesin okuyabilmesi için RLS (Row Level Security) politikasını etkinleştir
ALTER TABLE public.catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes katalog ürünlerini görebilir" 
ON public.catalog 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- 3. Başlangıç Ürün Verilerini Ekle (Mevcutsa güncelle)
INSERT INTO public.catalog (id, slug, name, category, price, min_liters, ideal_temp_min, ideal_temp_max, ideal_ph_min, ideal_ph_max, bio_load, description, color, swim_zone)
VALUES
(
    '1',
    'lepistes',
    'Lepistes (Guppy)',
    'baliklar',
    45.00,
    5,
    22.0,
    28.0,
    6.8,
    7.8,
    2,
    'Renkli kuyrukları ve hareketli yapısıyla akvaryumların vazgeçilmez canlı doğuran türü.',
    '#ff6b6b',
    'orta'
),
(
    '2',
    'anubias',
    'Anubias Barteri',
    'bitkiler',
    85.00,
    10,
    20.0,
    28.0,
    6.0,
    7.5,
    -1,
    'Dayanıklı yaprakları olan, düşük ışıkta bile harika gelişen popüler akvaryum bitkisi.',
    '#2b8a3e',
    'dip'
),
(
    '3',
    'silis-kum',
    'Natürel Silis Kum (1kg)',
    'kumlar',
    35.00,
    0,
    15.0,
    32.0,
    6.0,
    8.0,
    0,
    'Balıklarınızı yaralamayan, bitki kökleri ve dip balıkları için ideal 0.5mm taban kumu.',
    '#e2e8f0',
    'dip'
),
(
    '4',
    'ic-filtre',
    'AquaPro İç Filtre 300L/h',
    'malzemeler',
    220.00,
    20,
    15.0,
    32.0,
    6.0,
    8.0,
    -5,
    'Akvaryumunuzda kristal berraklığında su sağlayan, oksijen veren yüksek performanslı iç filtre.',
    '#339af0',
    'dip'
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    min_liters = EXCLUDED.min_liters,
    ideal_temp_min = EXCLUDED.ideal_temp_min,
    ideal_temp_max = EXCLUDED.ideal_temp_max,
    ideal_ph_min = EXCLUDED.ideal_ph_min,
    ideal_ph_max = EXCLUDED.ideal_ph_max,
    bio_load = EXCLUDED.bio_load,
    description = EXCLUDED.description,
    color = EXCLUDED.color,
    swim_zone = EXCLUDED.swim_zone;
