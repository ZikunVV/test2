import React from 'react';
import {
  ThemeConfig,
  GradientOption,
  GradientId,
  BackgroundMode,
  DisplaySettings,
} from '../types';
import { GRADIENT_VARIANTS } from '../data/gradients';
import {
  X,
  Eye,
  Sliders,
  Palette,
  CheckCircle2,
  Clock,
  MapPin,
  User,
  Sparkles,
  RotateCcw,
  Check,
  Monitor,
  Layers,
} from 'lucide-react';

interface EyeComfortSampleModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeConfig;
  gradient: GradientOption;
  showFlatFallback: boolean;
  onToggleFlatFallback?: (val: boolean) => void;
  displaySettings: DisplaySettings;
  onUpdateDisplaySettings: (settings: DisplaySettings) => void;
  onResetDisplaySettings: () => void;
  currentGradientId?: GradientId;
  onSelectGradient?: (id: GradientId) => void;
  backgroundMode?: BackgroundMode;
  onChangeBackgroundMode?: (mode: BackgroundMode) => void;
}

const BG_OPTIONS: { id: BackgroundMode; name: string; bgClass: string; hex: string }[] = [
  { id: 'palette', name: 'В тон палитры', bgClass: 'border-purple-300', hex: 'adaptive' },
  { id: 'lavender', name: 'Светлая лаванда', bgClass: 'border-purple-200', hex: '#FAF8FD' },
  { id: 'scandinavian', name: 'Белоснежный', bgClass: 'border-slate-300', hex: '#F8FAFC' },
  { id: 'warm_ivory', name: 'Тёплый крем-брюле', bgClass: 'border-amber-300', hex: '#FAF6F0' },
  { id: 'soft_mint', name: 'Мятный штиль', bgClass: 'border-emerald-300', hex: '#F0FDF4' },
  { id: 'ice_sky', name: 'Ледяной бриз', bgClass: 'border-sky-300', hex: '#F0F9FF' },
  { id: 'dark_slate', name: 'Тёмный ночной', bgClass: 'border-slate-700', hex: '#0B0F19' },
];

export const EyeComfortSampleModal: React.FC<EyeComfortSampleModalProps> = ({
  isOpen,
  onClose,
  theme,
  gradient,
  showFlatFallback,
  onToggleFlatFallback,
  displaySettings,
  onUpdateDisplaySettings,
  onResetDisplaySettings,
  currentGradientId = gradient.id,
  onSelectGradient,
  backgroundMode = 'palette',
  onChangeBackgroundMode,
}) => {
  if (!isOpen) return null;

  const allGradients = Object.values(GRADIENT_VARIANTS);

  const applyScreenPreset = (preset: Partial<DisplaySettings>) => {
    onUpdateDisplaySettings({
      ...displaySettings,
      ...preset,
    });
  };

  const isDarkBg = backgroundMode === 'dark_slate';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-4xl w-full border border-purple-200 shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="p-4 sm:p-5 text-white flex items-center justify-between gap-3 shadow-xs shrink-0"
          style={{
            background: showFlatFallback ? '#7652B5' : gradient.cssGradient,
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20 border border-white/30 text-white shrink-0">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">
                Образец просмотра (Проверка комфорта глаз и контраста)
              </h3>
              <div className="flex items-center gap-2 text-[11px] text-white/90 mt-0.5 flex-wrap">
                <span>Кнопки: <strong>{gradient.name}</strong></span>
                <span>•</span>
                <span>Фон: <strong>{BG_OPTIONS.find((b) => b.id === backgroundMode)?.name || 'В тон палитры'}</strong></span>
                <span>•</span>
                <span>Настройки сохраняются в вашем аккаунте</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
            title="Закрыть образец"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* COMPACT SELECTORS SECTION: BUTTONS & BACKGROUND COLOR (БЕЗ ОПИСАНИЯ, ТОЛЬКО НАЗВАНИЯ) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
            {/* 1. Compact Background Color Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[11px] uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-purple-700" />
                  <span>Цвет фона сайта (без описания):</span>
                </span>
                <span className="text-[11px] font-bold text-purple-900 bg-purple-100/70 px-2 py-0.5 rounded-md">
                  {BG_OPTIONS.find((b) => b.id === backgroundMode)?.name}
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {BG_OPTIONS.map((opt) => {
                  const isActive = backgroundMode === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onChangeBackgroundMode?.(opt.id)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                        isActive
                          ? 'bg-purple-700 text-white border-purple-700 shadow-xs ring-2 ring-purple-300'
                          : 'bg-white hover:bg-purple-50/50 text-slate-800 border-slate-200 hover:border-purple-300'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border shrink-0"
                        style={{
                          backgroundColor:
                            opt.hex === 'adaptive'
                              ? '#9333EA'
                              : opt.hex,
                          borderColor: isActive ? '#FFFFFF' : '#CBD5E1',
                        }}
                      />
                      <span>{opt.name}</span>
                      {isActive && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Compact Buttons Palette Selector */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200/80">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[11px] uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-purple-700" />
                  <span>Цвет кнопок (палитра, без описания):</span>
                </span>
                <div className="flex items-center gap-2">
                  {onToggleFlatFallback && (
                    <button
                      type="button"
                      onClick={() => onToggleFlatFallback(!showFlatFallback)}
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold border border-purple-200 bg-white hover:bg-purple-50 text-purple-800 cursor-pointer flex items-center gap-1"
                    >
                      <Layers className="w-3 h-3 text-purple-700" />
                      <span>{showFlatFallback ? 'Режим: Монохром' : 'Режим: Градиент'}</span>
                    </button>
                  )}
                  <span className="text-[11px] font-bold text-purple-900 bg-purple-100/70 px-2 py-0.5 rounded-md">
                    {gradient.name}
                  </span>
                </div>
              </div>

              {/* Scrollable / wrap compact chips of palettes */}
              <div className="flex items-center gap-1.5 flex-wrap max-h-32 overflow-y-auto pr-1">
                {allGradients.map((item) => {
                  const isActive = currentGradientId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectGradient?.(item.id)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                        isActive
                          ? 'bg-purple-700 text-white border-purple-700 shadow-xs ring-2 ring-purple-300 scale-[1.02]'
                          : 'bg-white hover:bg-purple-50/50 text-slate-800 border-slate-200 hover:border-purple-300'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs border border-white/60"
                        style={{ background: item.cssGradient }}
                      />
                      <span className="truncate max-w-[160px]">{item.name}</span>
                      {isActive && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Sliders Bar for Eye Comfort & Contrast */}
          <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/90 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-extrabold text-xs text-purple-950 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-purple-700" />
                <span>Фильтры экрана (яркость, контраст, тёплый вечерний свет)</span>
              </span>
              <button
                type="button"
                onClick={onResetDisplaySettings}
                className="px-2.5 py-1 rounded-lg bg-white border border-purple-200 hover:bg-purple-100 text-purple-800 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Сбросить до 100%</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Saturation */}
              <div className="bg-white p-2 rounded-xl border border-purple-100 space-y-1">
                <div className="flex justify-between font-bold text-[11px] text-slate-700">
                  <span>Насыщенность</span>
                  <span className="text-purple-700 font-mono">{displaySettings.saturation}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="180"
                  value={displaySettings.saturation}
                  onChange={(e) =>
                    onUpdateDisplaySettings({
                      ...displaySettings,
                      saturation: Number(e.target.value),
                    })
                  }
                  className="w-full accent-purple-700 cursor-pointer"
                />
              </div>

              {/* Contrast */}
              <div className="bg-white p-2 rounded-xl border border-purple-100 space-y-1">
                <div className="flex justify-between font-bold text-[11px] text-slate-700">
                  <span>Контраст</span>
                  <span className="text-purple-700 font-mono">{displaySettings.contrast}%</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="150"
                  value={displaySettings.contrast}
                  onChange={(e) =>
                    onUpdateDisplaySettings({
                      ...displaySettings,
                      contrast: Number(e.target.value),
                    })
                  }
                  className="w-full accent-purple-700 cursor-pointer"
                />
              </div>

              {/* Brightness */}
              <div className="bg-white p-2 rounded-xl border border-purple-100 space-y-1">
                <div className="flex justify-between font-bold text-[11px] text-slate-700">
                  <span>Яркость</span>
                  <span className="text-purple-700 font-mono">{displaySettings.brightness}%</span>
                </div>
                <input
                  type="range"
                  min="75"
                  max="125"
                  value={displaySettings.brightness}
                  onChange={(e) =>
                    onUpdateDisplaySettings({
                      ...displaySettings,
                      brightness: Number(e.target.value),
                    })
                  }
                  className="w-full accent-purple-700 cursor-pointer"
                />
              </div>

              {/* Warmth */}
              <div className="bg-amber-50/70 p-2 rounded-xl border border-amber-200 space-y-1">
                <div className="flex justify-between font-bold text-[11px] text-amber-950">
                  <span>Тёплый свет</span>
                  <span className="text-amber-800 font-mono">{displaySettings.warmth}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={displaySettings.warmth}
                  onChange={(e) =>
                    onUpdateDisplaySettings({
                      ...displaySettings,
                      warmth: Number(e.target.value),
                    })
                  }
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Quick Presets Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] font-bold text-slate-600 mr-1">Пресеты:</span>
              <button
                type="button"
                onClick={() => applyScreenPreset({ saturation: 100, contrast: 100, brightness: 100, warmth: 0 })}
                className="px-2 py-0.5 rounded-md bg-white border border-purple-200 hover:bg-purple-100 text-purple-900 font-semibold text-[10px] cursor-pointer"
              >
                Стандарт
              </button>
              <button
                type="button"
                onClick={() => applyScreenPreset({ saturation: 75, contrast: 95, brightness: 95, warmth: 16 })}
                className="px-2 py-0.5 rounded-md bg-amber-100/80 border border-amber-200 hover:bg-amber-200 text-amber-900 font-semibold text-[10px] cursor-pointer"
              >
                🌙 Вечерний уют
              </button>
              <button
                type="button"
                onClick={() => applyScreenPreset({ saturation: 110, contrast: 120, brightness: 105, warmth: 0 })}
                className="px-2 py-0.5 rounded-md bg-blue-100/80 border border-blue-200 hover:bg-blue-200 text-blue-900 font-semibold text-[10px] cursor-pointer"
              >
                Высокий контраст
              </button>
              <button
                type="button"
                onClick={() => applyScreenPreset({ saturation: 80, contrast: 95, brightness: 100, warmth: 5 })}
                className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-800 font-semibold text-[10px] cursor-pointer"
              >
                Мягкая пастель
              </button>
            </div>
          </div>

          {/* DYNAMIC CANVAS WRAPPER: PREVIEWS WORKSPACE WITH THE CURRENT BACKGROUND COLOR */}
          <div
            className="p-4 sm:p-5 rounded-2xl border transition-colors space-y-4 shadow-inner"
            style={{
              backgroundColor: theme.keyColors.canvasBg,
              borderColor: theme.keyColors.cardBorder,
            }}
          >
            {/* SAMPLE SECTION 1: BUTTONS & ACCENTS (ФОКУС НА ВЫБРАННОЙ ПАЛИТРЕ КНОПОК) */}
            <div
              className="p-3.5 rounded-xl border shadow-2xs space-y-2.5"
              style={{
                backgroundColor: theme.keyColors.cardBg,
                borderColor: theme.keyColors.cardBorder,
              }}
            >
              <h4
                className="font-extrabold text-xs uppercase tracking-wider flex items-center justify-between"
                style={{ color: theme.keyColors.textPrimary }}
              >
                <span>Образец кнопок и элементов управления ({gradient.name})</span>
                <span className="text-[10px] font-semibold text-slate-500 lowercase">
                  стиль: {showFlatFallback ? 'flat монохром' : 'световой градиент'}
                </span>
              </h4>

              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Main Action Button */}
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5 transition-transform hover:scale-[1.02]"
                  style={{
                    background: showFlatFallback ? '#7652B5' : gradient.cssGradient,
                    boxShadow: showFlatFallback ? 'none' : gradient.buttonShadow,
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>+ Подать заявку</span>
                </button>

                {/* Active Menu Tab */}
                <div
                  className="px-3.5 py-2 rounded-xl text-xs font-black text-white flex items-center gap-2 shadow-2xs"
                  style={{
                    background: showFlatFallback ? '#7652B5' : gradient.activeItemGradient,
                  }}
                >
                  <span>Список работ</span>
                  <span className="px-1.5 py-0.2 rounded bg-white/20 text-[10px]">12</span>
                </div>

                {/* Complete Action Button */}
                <button
                  type="button"
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Завершить работу</span>
                </button>

                {/* Secondary Neutral Button */}
                <button
                  type="button"
                  className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs"
                >
                  Отмена
                </button>
              </div>
            </div>

            {/* SAMPLE SECTION 2: TICKET CARDS ON CURRENT BACKGROUND */}
            <div className="space-y-2">
              <h4
                className="font-extrabold text-xs uppercase tracking-wider"
                style={{ color: isDarkBg ? '#F3F4F6' : '#1E293B' }}
              >
                Образцы карточек заявок
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {/* Card 1: Waiting */}
                <div
                  className="p-3 rounded-xl border shadow-2xs space-y-2"
                  style={{
                    backgroundColor: theme.keyColors.cardBg,
                    borderColor: theme.keyColors.cardBorder,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-xs text-rose-950 px-2 py-0.5 rounded bg-rose-100">
                      № 2026-101
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-rose-600" />
                      <span>В ожидании</span>
                    </span>
                  </div>
                  <h5
                    className="font-bold text-xs leading-snug"
                    style={{ color: theme.keyColors.textPrimary }}
                  >
                    Прорыв трубы отопления
                  </h5>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                    <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>ул. Шевченко, д. 12, кв. 45</span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 pt-1 border-t border-slate-100">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Бригада: Слесари №2</span>
                  </div>
                </div>

                {/* Card 2: In Progress */}
                <div
                  className="p-3 rounded-xl border shadow-2xs space-y-2"
                  style={{
                    backgroundColor: theme.keyColors.cardBg,
                    borderColor: theme.keyColors.cardBorder,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-xs text-amber-950 px-2 py-0.5 rounded bg-amber-100">
                      № 2026-102
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" />
                      <span>В работе</span>
                    </span>
                  </div>
                  <h5
                    className="font-bold text-xs leading-snug"
                    style={{ color: theme.keyColors.textPrimary }}
                  >
                    Замена вводного кабеля
                  </h5>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                    <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span>ул. Доценка, д. 4, под. 2</span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 pt-1 border-t border-slate-100">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Электрик: Петров В.</span>
                  </div>
                </div>

                {/* Card 3: Completed */}
                <div
                  className="p-3 rounded-xl border shadow-2xs space-y-2"
                  style={{
                    backgroundColor: theme.keyColors.cardBg,
                    borderColor: theme.keyColors.cardBorder,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-xs text-emerald-950 px-2 py-0.5 rounded bg-emerald-100">
                      № 2026-103
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Выполнено</span>
                    </span>
                  </div>
                  <h5
                    className="font-bold text-xs leading-snug"
                    style={{ color: theme.keyColors.textPrimary }}
                  >
                    Устранение течи стояка
                  </h5>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>просп. Мира, д. 18, кв. 7</span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 pt-1 border-t border-slate-100">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Мастер: Сидоров К.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SAMPLE SECTION 3: TYPOGRAPHY & CONTRAST */}
            <div
              className="p-3.5 rounded-xl border shadow-2xs space-y-1.5"
              style={{
                backgroundColor: theme.keyColors.cardBg,
                borderColor: theme.keyColors.cardBorder,
              }}
            >
              <h1
                className="text-base sm:text-lg font-black leading-tight"
                style={{ color: theme.keyColors.textPrimary }}
              >
                Журнал оперативных заявок ЖКХ и диспетчеризации
              </h1>
              <p
                className="text-xs leading-relaxed"
                style={{ color: theme.keyColors.textSecondary }}
              >
                Проведена ревизия запорной арматуры, устранён свищ на трубопроводе отопления.
                Давление в контуре нормализовано до 4.2 бар, подача теплоносителя возобновлена.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-slate-500 text-xs">
            Настройки применяются моментально внутри вашего текущего аккаунта
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs cursor-pointer transition-all"
          >
            Готово / Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
