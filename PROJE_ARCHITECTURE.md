# fishLab — Mimari Anayasa, Kurallar ve Yol Haritası

> **ÖNEMLİ UYARI (AI ASİSTAN İÇİN BAĞLAYICI KURALLAR):**
> Bu dosya projenin kesinleşmiş teknik kararlarını, 3D modelleme standartlarını, fiziksel yerleşim kurallarını ve ilerleme planını içerir. Herhangi bir kod üretmeden önce bu kurallar kesin olarak uygulanmalıdır.

---

## 1. Proje Amacı ve Temel Vizyon
**fishLab**, kullanıcıların akvaryum hacmini belirleyip; kum, bitki, balık, omurgasız (karides/salyangoz), aydınlatma ve filtrasyon/havalandırma ekipmanlarını gerçekçi biyolojik ve fiziksel kurallara göre kurgulayabildiği **etkileşimli 3D akvaryum ekosistem simülasyonu ve e-ticaret** web platformudur.

---

## 2. Kesin Teknoloji ve Mimari Kurallar (YASAKLAR & ZORUNLULUKLAR)
1. **%100 Prosedürel Three.js Mimarisi (GLB/GLTF KESİNLİKLE YASAK):**
   - Projede **hiçbir zaman** dışarıdan `.glb`, `.gltf`, `.obj` veya `.fbx` dosyası yüklenmeyecektir (`useGLTF`, `GLTFLoader` yasaktır).
   - Tüm canlılar, bitkiler, zeminler, aydınlatmalar ve ekipmanlar **saf Three.js geometrileri (`BufferGeometry`, `LatheGeometry`, `ExtrudeGeometry`, `TubeGeometry`, `CylinderGeometry` vb.), prosedürel `CanvasTexture` dokuları ve özel GLSL shader'lar** ile yüksek detaylı ve anatomik/endüstriyel gerçekçilikte kodlanacaktır.
2. **Katmanlı Ayrım (Decoupled Architecture):**
   - **3D Görselleştirme (`models/` ve `components/scene/`):** Sadece sahne render, shader animasyonları, fiziksel konumlandırma ve sürükle-bırak etkileşiminden sorumludur.
   - **Ekosistem Kuralları (`lib/simulation/ecosystemEngine.ts`):** Su kimyası (amonyak, nitrat, pH, sıcaklık, oksijen doygunluğu), canlı uyumluluğu, hacim yeterliliği ve biyolojik yük hesaplamaları 3D döngüsünden tamamen bağımsızdır.
   - **Durum Yönetimi (`store/useAquariumStore.ts`):** Tüm sepet, tank içi ürünler, yerleşimli ekipman koordinatları ve simülasyon parametreleri Zustand üzerinden yönetilir.
   - **Veri Katmanı (`services/catalogService.ts`):** Katalog verileri Supabase'den normalize edilerek çekilir; katalog ikonları ve alt kategori eşleşmeleri eksiksiz olmalıdır.

---

## 3. Klasör Yapısı ve Modülerlik Standartları
```text
├── PROJECT_ARCHITECTURE.md          # Bu anayasa dosyası
├── app/                             # Next.js App Router sayfaları
├── components/
│   ├── scene/                       # R3F Canvas, Tank, Sahne Kayıtçısı, Sürükleme & Bağlantılar
│   └── ui/                          # Katalog, Sepet, Ekosistem Analiz Paneli, Ekipman Kontrol HUD
├── lib/
│   └── simulation/                  # ecosystemEngine.ts (Biyolojik & fiziksel hesaplamalar)
├── models/                          # Yüksek detaylı prosedürel 3D varlık fabrikaları
│   ├── baliklar/                    # lepistes/, beta/, vatoz/
│   ├── canlilar/                    # karides/, salyangoz/
│   ├── kumlar/                      # silis-kum/, hagen/, aktif-toprak/
│   └── malzemeler/
│       ├── aydinlatma/              # BeyazIsikMesh, BeyazMaviIsikMesh, UcRenkIsikMesh
│       └── ekipman/                 # HavaMotoruMesh, PipoFiltreMesh, IcFiltreMesh, HavaTasiMesh
├── services/                        # catalogService.ts (Supabase entegrasyonu)
└── store/                           # useAquariumStore.ts (Zustand state)