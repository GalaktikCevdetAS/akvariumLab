'use client';

import React, { useState } from 'react';
import {
  Activity,
  Thermometer,
  Droplet,
  AlertTriangle,
  CheckCircle2,
  Waves,
  Sprout,
  Wind,
  FlaskConical,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAquariumStore } from '../../store/useAquariumStore';
import { getTankDimensionsCm } from '../../lib/simulation/ecosystemEngine';

export default function SideStatusPanel() {
  const { tankCapacity, setTankCapacity, ecosystemStatus } = useAquariumStore();
  const [errorsExpanded, setErrorsExpanded] = useState(false);

  const dims = getTankDimensionsCm(tankCapacity);
  const { waterVisuals } = ecosystemStatus;
  const warningCount = ecosystemStatus.warnings.length;

  const getBadgeTone = (isBad: boolean, isWarn: boolean) =>
    isBad
      ? 'text-rose-400 font-bold'
      : isWarn
      ? 'text-amber-300 font-semibold'
      : 'text-emerald-300 font-semibold';

  return (
    <div className="bg-slate-900/85 backdrop-blur-xl border border-slate-700/70 rounded-2xl p-3.5 shadow-2xl space-y-2.5 max-h-[80vh] overflow-y-auto">
      {/* 1. Tank Hacmi Seçici */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-cyan-400" /> Su Kimyası
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

      {/* 2. Fiziksel Ölçüler & Bitki Kapasitesi */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 bg-slate-800/50 px-2.5 py-1.5 rounded-xl border border-slate-700/40">
        <span>
          {dims.widthCm}×{dims.depthCm}×{dims.heightCm} cm
        </span>
        <span className="flex items-center gap-1 text-emerald-400 font-medium">
          <Sprout className="w-3 h-3" /> {ecosystemStatus.currentPlants}/{ecosystemStatus.maxPlants} Bitki
        </span>
      </div>

      {/* 3. Dinamik Su Rengi & Alg Yoğunluğu */}
      <div className="bg-slate-800/60 rounded-xl p-2 border border-slate-700/50 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <Waves className="w-3 h-3 text-cyan-400" /> Su Rengi:
          </span>
          <span className="text-[11px] font-semibold text-slate-100 flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full border border-white/30 shadow-sm"
              style={{ backgroundColor: waterVisuals.color }}
            />
            {waterVisuals.label}
          </span>
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 pt-0.5 border-t border-slate-700/40">
          <span>Alg Yoğunluğu:</span>
          <span
            className={getBadgeTone(
              ecosystemStatus.algaeLevel >= 50,
              ecosystemStatus.algaeLevel >= 25
            )}
          >
            %{ecosystemStatus.algaeLevel}
          </span>
        </div>
      </div>

      {/* 4. Azot Döngüsü (NH3 Amonyak / NO2 Nitrit / NO3 Nitrat) */}
      <div className="bg-slate-800/50 rounded-xl p-2 border border-slate-700/40 space-y-1">
        <div className="text-[10px] font-semibold text-slate-300 flex items-center gap-1">
          <FlaskConical className="w-3 h-3 text-purple-400" /> Azot Döngüsü (mg/L)
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-center pt-0.5">
          <div className="bg-slate-900/60 rounded-lg py-1 px-1">
            <div className="text-[9px] text-slate-400">NH₃ Amonyak</div>
            <div
              className={`text-[11px] ${getBadgeTone(
                ecosystemStatus.ammonia >= 0.5,
                ecosystemStatus.ammonia >= 0.2
              )}`}
            >
              {ecosystemStatus.ammonia}
            </div>
          </div>
          <div className="bg-slate-900/60 rounded-lg py-1 px-1">
            <div className="text-[9px] text-slate-400">NO₂ Nitrit</div>
            <div
              className={`text-[11px] ${getBadgeTone(
                ecosystemStatus.nitrite >= 0.8,
                ecosystemStatus.nitrite >= 0.3
              )}`}
            >
              {ecosystemStatus.nitrite}
            </div>
          </div>
          <div className="bg-slate-900/60 rounded-lg py-1 px-1">
            <div className="text-[9px] text-slate-400">NO₃ Nitrat</div>
            <div
              className={`text-[11px] ${getBadgeTone(
                ecosystemStatus.nitrate >= 45,
                ecosystemStatus.nitrate >= 25
              )}`}
            >
              {ecosystemStatus.nitrate}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Çözünmüş Gazlar (O2 & CO2) */}
      <div className="bg-slate-800/50 rounded-xl p-2 border border-slate-700/40 space-y-1">
        <div className="text-[10px] font-semibold text-slate-300 flex items-center gap-1">
          <Wind className="w-3 h-3 text-sky-400" /> Gaz Dengesi
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-center">
          <div className="bg-slate-900/60 rounded-lg py-1 px-1">
            <div className="text-[9px] text-slate-400">O₂ (Oksijen)</div>
            <div
              className={`text-[11px] ${getBadgeTone(
                ecosystemStatus.oxygen <= 4.5,
                ecosystemStatus.oxygen <= 6.0
              )}`}
            >
              {ecosystemStatus.oxygen} mg/L
            </div>
          </div>
          <div className="bg-slate-900/60 rounded-lg py-1 px-1">
            <div className="text-[9px] text-slate-400">CO₂ (Karbondioksit)</div>
            <div
              className={`text-[11px] ${getBadgeTone(
                ecosystemStatus.co2 >= 32,
                ecosystemStatus.co2 >= 24
              )}`}
            >
              {ecosystemStatus.co2} ppm
            </div>
          </div>
        </div>
      </div>

      {/* 6. Mineraller (PPM, GH/KH), pH ve Sıcaklık */}
      <div className="grid grid-cols-3 gap-1.5 text-center">
        <div className="bg-slate-800/60 rounded-xl p-1.5 border border-slate-700/40">
          <div className="text-[9px] text-slate-400">TDS / Mineral</div>
          <div className="text-[11px] font-bold text-cyan-300 mt-0.5">{ecosystemStatus.ppm} ppm</div>
          <div className="text-[8px] text-slate-500">
            GH {ecosystemStatus.gh} / KH {ecosystemStatus.kh}
          </div>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-1.5 border border-slate-700/40">
          <div className="text-[9px] text-slate-400 flex items-center justify-center gap-0.5">
            <Droplet className="w-2.5 h-2.5 text-cyan-400" /> pH
          </div>
          <div className="text-[11px] font-bold text-white mt-0.5">{ecosystemStatus.ph}</div>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-1.5 border border-slate-700/40">
          <div className="text-[9px] text-slate-400 flex items-center justify-center gap-0.5">
            <Thermometer className="w-2.5 h-2.5 text-orange-400" /> Isı
          </div>
          <div className="text-[11px] font-bold text-white mt-0.5">
            {ecosystemStatus.temperature}°C
          </div>
        </div>
      </div>

      {/* 7. Gizli "Hatalar" Çekmecesi (Tıklandığında detayları açılır) */}
      {warningCount === 0 ? (
        <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 p-2 rounded-xl text-emerald-300 text-[11px]">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
          <span>Ekosistem dengede.</span>
        </div>
      ) : (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl overflow-hidden">
          <button
            onClick={() => setErrorsExpanded((prev) => !prev)}
            className="w-full flex items-center justify-between px-2.5 py-2 text-left text-rose-300 hover:bg-rose-500/15 transition"
          >
            <span className="flex items-center gap-1.5 text-[11px] font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>Hatalar ({warningCount})</span>
            </span>
            {errorsExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-rose-400" />
            )}
          </button>

          {errorsExpanded && (
            <div className="px-2.5 pb-2 pt-1 space-y-1.5 border-t border-rose-500/20 max-h-32 overflow-y-auto">
              {ecosystemStatus.warnings.map((warning, idx) => (
                <div
                  key={idx}
                  className="text-[10px] text-rose-200 leading-snug bg-rose-950/50 px-2 py-1.5 rounded-lg border border-rose-500/20"
                >
                  • {warning}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}