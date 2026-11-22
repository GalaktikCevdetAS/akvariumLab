'use client';

import React from 'react';
import { Activity, Thermometer, Droplet, AlertTriangle, CheckCircle2, Waves } from 'lucide-react';
import { useAquariumStore } from '../../store/useAquariumStore';
import { evaluateWaterPhase } from '../../lib/simulation/ecosystemEngine';

export default function SideStatusPanel() {
  const { tankCapacity, setTankCapacity, ecosystemStatus } = useAquariumStore();

  const maxLoad = Math.max(1, tankCapacity * 0.2);
  const loadPercentage = Math.min(100, Math.max(0, (ecosystemStatus.bioLoad / maxLoad) * 100));
  const loadColor = loadPercentage > 85 ? 'bg-rose-500' : loadPercentage > 60 ? 'bg-amber-400' : 'bg-emerald-400';

  const waterPhase = evaluateWaterPhase(tankCapacity, ecosystemStatus.bioLoad, ecosystemStatus.warnings);

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/70 rounded-2xl p-3.5 shadow-2xl space-y-3">
      {/* Tank Hacmi Seçici */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-cyan-400" /> Ekosistem
        </span>
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-0.5 flex items-center gap-0.5">
          {[50, 100, 200].map((vol) => (
            <button
              key={vol}
              onClick={() => setTankCapacity(vol)}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition ${
                tankCapacity === vol
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-700/70'
              }`}
            >
              {vol}L
            </button>
          ))}
        </div>
      </div>

      {/* Biyolojik Yük Çubuğu & Su Berraklık Durumu */}
      <div>
        <div className="flex justify-between text-[11px] mb-1">
          <span className="text-slate-400">Biyolojik Yük</span>
          <span className="text-slate-200 font-medium">{ecosystemStatus.bioLoad} / {maxLoad}</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <div className={`h-full transition-all duration-300 ${loadColor}`} style={{ width: `${loadPercentage}%` }} />
        </div>
        <div className="flex items-center justify-between mt-1 text-[10px]">
          <span className="text-slate-400 flex items-center gap-1">
            <Waves className="w-3 h-3 text-cyan-400" /> Su Durumu:
          </span>
          <span
            className={`font-semibold flex items-center gap-1 ${
              waterPhase.phase === 'critical'
                ? 'text-rose-400 animate-pulse'
                : waterPhase.phase === 'moderate'
                ? 'text-lime-400'
                : 'text-cyan-400'
            }`}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: waterPhase.color }}
            />
            {waterPhase.label}
          </span>
        </div>
      </div>

      {/* pH ve Sıcaklık Mini Kutucuklar */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-800/60 rounded-xl p-2 text-center border border-slate-700/40">
          <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <Droplet className="w-3 h-3 text-cyan-400" /> pH
          </div>
          <div className="text-xs font-bold text-white mt-0.5">{ecosystemStatus.ph}</div>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-2 text-center border border-slate-700/40">
          <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <Thermometer className="w-3 h-3 text-orange-400" /> Sıcaklık
          </div>
          <div className="text-xs font-bold text-white mt-0.5">{ecosystemStatus.temperature}°C</div>
        </div>
      </div>

      {/* Sağlık & Uyumluluk */}
      {ecosystemStatus.isHealthy ? (
        <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 p-2 rounded-xl text-emerald-300 text-[11px]">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
          <span>Ekosistem dengede.</span>
        </div>
      ) : (
        <div className="space-y-1 max-h-24 overflow-y-auto">
          {ecosystemStatus.warnings.map((warning, idx) => (
            <div key={idx} className="flex items-start gap-1.5 bg-rose-500/15 border border-rose-500/30 p-2 rounded-xl text-rose-300 text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-400" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
