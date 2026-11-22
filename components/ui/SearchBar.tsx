'use client';

import React from 'react';
import { Search, Plus } from 'lucide-react';
import { useAquariumStore } from '../../store/useAquariumStore';

export default function SearchBar() {
  const { catalog, searchQuery, setSearchQuery, addToTank } = useAquariumStore();

  const filtered = catalog.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative w-full">
      {/* Yukarı Doğru Açılan Sonuç Listesi */}
      {searchQuery.trim().length > 0 && (
        <div className="absolute bottom-full mb-2 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl p-2 shadow-2xl z-30 max-h-60 overflow-y-auto space-y-1">
          {filtered.length === 0 ? (
            <div className="p-3 text-xs text-slate-400 text-center">Ürün bulunamadı.</div>
          ) : (
            filtered.map(product => (
              <div
                key={product.id}
                className="flex items-center justify-between p-2.5 hover:bg-slate-800/80 rounded-xl transition border border-transparent hover:border-slate-700"
              >
                <div>
                  <div className="text-xs font-semibold text-white">{product.name}</div>
                  <div className="text-[11px] text-slate-400">{product.price.toFixed(2)} ₺ • Min {product.min_liters}L</div>
                </div>
                <button
                  onClick={() => {
                    addToTank(product);
                    setSearchQuery('');
                  }}
                  className="w-7 h-7 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg flex items-center justify-center transition shadow-md shadow-cyan-500/20"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Arama Çubuğu */}
      <div className="relative flex items-center">
        <Search className="absolute left-4 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Katalogda ara (örn. Lepistes, Anubias)..."
          className="w-full pl-11 pr-4 py-2.5 bg-slate-900/85 backdrop-blur-xl border border-slate-700/80 focus:border-cyan-400 rounded-full text-sm text-white placeholder-slate-400 shadow-2xl focus:outline-none transition"
        />
      </div>
    </div>
  );
}

