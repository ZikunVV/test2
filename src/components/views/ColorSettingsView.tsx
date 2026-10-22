import React, { useState } from 'react';
import {
  ThemeConfig,
  GradientOption,
  GradientId,
  BackgroundMode,
  DisplaySettings,
  UserItem,
} from '../../types';
import { GRADIENT_VARIANTS } from '../../data/gradients';
import { EyeComfortSampleModal } from '../EyeComfortSampleModal';
import {
  Palette,
  Sliders,
  Sparkles,
  Check,
  RotateCcw,
  Sun,
  Contrast,
  Eye,
  SlidersHorizontal,
  Layout,
  Volume2,
  FolderOpen,
  Layers,
  CheckCircle2,
  Monitor,
  Moon,
  Coffee,
  ArrowUp,
} from 'lucide-react';

interface ColorSettingsViewProps {
  theme: ThemeConfig;
  currentGradient: GradientOption;
  currentGradientId: GradientId;
  onSelectGradient: (id: GradientId) => void;
  showFlatFallback: boolean;
  onToggleFlatFallback: (val: boolean) => void;
  backgroundMode?: BackgroundMode;
  onChangeBackgroundMode?: (mode: BackgroundMode) => void;
  displaySettings: DisplaySettings;
  onUpdateDisplaySettings: (settings: DisplaySettings) => void;
  onResetDisplaySettings: () => void;
  onResetAllSettings?: () => void;
  displayFiltersEnabled?: boolean;
  onToggleDisplayFilters?: (enabled: boolean) => void;
  currentUser?: UserItem;
  onNavigateToSounds: () => void;
  onBackToHome: () => void;
}

const getBgModeName = (mode: BackgroundMode = 'palette'): string => {
  switch (mode) {
    case 'palette':
      return 'В тон палитры (Адаптивный)';
    case 'lavender':
      return 'Светлая лаванда';
    case 'scandinavian':
      return 'Белоснежный';
    case 'warm_ivory':
      return 'Тёплый крем-брюле';
    case 'soft_mint':
      return 'Мятный штиль';
    case 'ice_sky':
      return 'Ледяной бриз';
    case 'dark_slate':
      return 'Тёмный ночной';
    default:
      return 'В тон палитры';
  }
};

export const ColorSettingsView: React.FC<ColorSettingsViewProps> = ({
  theme,
  currentGradient,
  currentGradientId,
  onSelectGradient,
  showFlatFallback,
  onToggleFlatFallback,
  backgroundMode = 'palette',
  onChangeBackgroundMode,
  displaySettings,
  onUpdateDisplaySettings,
  onResetDisplaySettings,
  onResetAllSettings,
  displayFiltersEnabled = false,
  onToggleDisplayFilters,
  currentUser,
  onNavigateToSounds,
}) => {
  const allGradients = Object.values(GRADIENT_VARIANTS);
  const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);

  const applyScreenPreset = (preset: Partial<DisplaySettings>) => {
    onUpdateDisplaySettings({
      ...displaySettings,
      ...preset,
    });
    if (!displayFiltersEnabled && onToggleDisplayFilters) {
      onToggleDisplayFilters(true);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* GLOBAL SETTINGS TABS: [ 🎨 Цветовой режим ]  [ 🔊 Звуки ] */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-2 border-2 border-purple-200 shadow-sm flex items-center gap-2">
        <button
          type="button"
          className="flex-1 py-3 px-4 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2.5 cursor-default bg-purple-700 text-white shadow-md ring-2 ring-purple-300"
        >
          <Palette className="w-4 h-4 stroke-[2.5]" />
          <span>🎨 Цветовой режим (Фон, Кнопки, Контраст)</span>
        </button>

        <button
          type="button"
          onClick={onNavigateToSounds}
          className="flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-slate-700 hover:text-purple-950 hover:bg-purple-50 transition-all flex items-center justify-center gap-2.5 cursor-pointer border border-transparent hover:border-purple-200"
        >
          <Volume2 className="w-4 h-4 text-purple-700" />
          <span>🔊 Звуки и оповещения</span>
        </button>
      </div>

      {/* Header & Breadcrumb ("Настройки" -> "Цветовой режим") */}
      <div className="bg-white rounded-2xl p-5 border border-purple-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 text-xs font-bold">
              <Sliders className="w-3.5 h-3.5 text-purple-700" />
              <span>Настройки</span>
            </span>
            <span className="text-slate-400 font-bold">/</span>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-white text-xs font-extrabold shadow-2xs"
              style={{
                background: showFlatFallback ? '#7652B5' : currentGradient.cssGradient,
              }}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Папка «Цветовой режим»</span>
            </span>
          </div>

          <h2
            className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5 pt-1"
            style={{ color: theme.keyColors.textPrimary }}
          >
            <Palette className="w-6 h-6 text-purple-700 shrink-0" />
            <span>Выбор цветового режима, фона сайта и стиля оформления</span>
          </h2>
          <p className="text-xs text-slate-600">
            Индивидуальные настройки для аккаунта:{' '}
            <span className="font-extrabold text-purple-900 bg-purple-100/80 px-2 py-0.5 rounded-md">
              {currentUser?.full_name || 'Главный администратор'}
            </span>
            {' '}— настройки оформления (палитра, фон, фильтры) сохраняются строго внутри вашей учётной записи и не распространяются на другие аккаунты (аналогично разделу «Звуки»).
          </p>
        </div>

        {/* Top folder switcher: Sounds vs Colors + Reset to Defaults */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0 flex-wrap">
          <button
            type="button"
            onClick={onNavigateToSounds}
            className="px-3.5 py-2 rounded-xl border border-purple-200 bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-900 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
            title="Перейти к настройке звуковых сигналов"
          >
            <Volume2 className="w-4 h-4 text-purple-600" />
            <span>Папка «Звуки»</span>
          </button>

          {/* Dedicated active button "По умолчанию" / "Сбросить настройки" */}
          <button
            type="button"
            onClick={onResetAllSettings || onResetDisplaySettings}
            className="px-3.5 py-2 rounded-xl border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs hover:scale-[1.02] active:scale-[0.98]"
            title="Сбросить все настройки оформления (палитра, фон сайта, фильтры) до стандартных значений по умолчанию"
          >
            <RotateCcw className="w-3.5 h-3.5 text-purple-700 stroke-[2.5]" />
            <span>По умолчанию</span>
          </button>

          {onResetAllSettings && (
            <button
              type="button"
              onClick={onResetAllSettings}
              className="px-3 py-2 rounded-xl border-2 border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              title="Сбросить настройки к исходному виду сайта (до создания папки «Цветовой режим»)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600 stroke-[2.5]" />
              <span>Сбросить настройки</span>
            </button>
          )}
        </div>
      </div>

      {/* SECTION 1: LIVE PREVIEW OF SELECTED THEME */}
      <div className="bg-gradient-to-r from-purple-50/80 via-white to-purple-50/60 p-5 rounded-2xl border border-purple-200/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs font-black text-purple-950 uppercase tracking-wider">
            <Layout className="w-4 h-4 text-purple-700" />
            <span>Интерактивный предпросмотр текущего режима</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-white border border-purple-200 text-purple-800 shadow-2xs">
              Палитра: {currentGradient.name}
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-purple-100 text-purple-900">
              Фон сайта: {getBgModeName(backgroundMode)}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-purple-100 shadow-2xs grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Sample Button */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
              Кнопка «+ Подать заявку»
            </span>
            <button
              type="button"
              className="w-full px-4 py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 shadow-sm transition-all"
              style={{
                background: showFlatFallback
                  ? '#7652B5'
                  : currentGradient.cssGradient,
                boxShadow: showFlatFallback ? 'none' : currentGradient.buttonShadow,
              }}
            >
              <Sparkles className="w-4 h-4" />
              <span>+ Подать заявку</span>
            </button>
          </div>

          {/* Sample Active Menu Item */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
              Активный пункт меню
            </span>
            <div
              className="w-full px-3.5 py-2.5 rounded-xl text-xs font-extrabold text-white flex items-center justify-between shadow-2xs"
              style={{
                background: showFlatFallback
                  ? '#7652B5'
                  : currentGradient.activeItemGradient,
              }}
            >
              <span>Список работ</span>
              <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px]">
                12
              </span>
            </div>
          </div>

          {/* Sample Card Badge */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
              Карточка заявки (статус)
            </span>
            <div className="p-2.5 rounded-xl border border-purple-200/80 bg-purple-50/40 flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-purple-950">№2026-104</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Выполнена</span>
              </span>
            </div>
          </div>
        </div>

        {/* Informative strip with quick reset link */}
        <div className="pt-2 border-t border-purple-100/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <span className="text-slate-600 text-[11px]">
            ⚡ Все изменения применяются моментально. Внизу экрана доступна плавающая панель живого предпросмотра при скролле.
          </span>
          {onResetAllSettings && (
            <button
              type="button"
              onClick={onResetAllSettings}
              className="text-[11px] font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1 underline underline-offset-2 cursor-pointer self-start sm:self-auto"
              title="Вернуть оформление сайта к исходному состоянию (до создания папки «Цветовой режим»)"
            >
              <RotateCcw className="w-3 h-3 text-rose-600" />
              <span>Вернуться к исходным настройкам сайта</span>
            </button>
          )}
        </div>
      </div>

      {/* SECTION 2: SITE BACKGROUND MODE (ИЗМЕНЕНИЕ ЦВЕТОВОГО ФОНА САЙТА) */}
      <div className="bg-white rounded-2xl p-5 border border-purple-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
            <Monitor className="w-4 h-4 text-purple-700" />
            <span>Цветовой фон самого сайта</span>
          </div>
          <span className="text-xs text-slate-500">
            Фон подстраивается под ваши предпочтения
          </span>
        </div>
        <p className="text-xs text-slate-600">
          Выберите, как оформлять общий фон веб-приложения и бокового меню: привязать его к выбранной цветовой палитре или зафиксировать определенный базовый тон.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1">
          {/* Mode 1: Bound to Palette */}
          <button
            type="button"
            onClick={() => onChangeBackgroundMode?.('palette')}
            className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
              backgroundMode === 'palette'
                ? 'border-purple-600 bg-purple-50 shadow-xs ring-2 ring-purple-300/50'
                : 'border-slate-200 hover:border-purple-300 bg-white'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-4 h-4 rounded-full border border-purple-300 shadow-2xs shrink-0"
                style={{ background: currentGradient.cssGradient }}
              />
              <span className="font-extrabold text-xs text-slate-900 truncate">
                В тон палитры
              </span>
            </div>
            {backgroundMode === 'palette' && (
              <CheckCircle2 className="w-4 h-4 text-purple-700 shrink-0" />
            )}
          </button>

          {/* Mode 2: Light Lavender */}
          <button
            type="button"
            onClick={() => onChangeBackgroundMode?.('lavender')}
            className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
              backgroundMode === 'lavender'
                ? 'border-purple-600 bg-purple-50 shadow-xs ring-2 ring-purple-300/50'
                : 'border-slate-200 hover:border-purple-300 bg-white'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-4 h-4 rounded-full bg-purple-100 border border-purple-300 shadow-2xs shrink-0" />
              <span className="font-extrabold text-xs text-slate-900 truncate">
                Светлая лаванда
              </span>
            </div>
            {backgroundMode === 'lavender' && (
              <CheckCircle2 className="w-4 h-4 text-purple-700 shrink-0" />
            )}
          </button>

          {/* Mode 3: Scandinavian White */}
          <button
            type="button"
            onClick={() => onChangeBackgroundMode?.('scandinavian')}
            className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
              backgroundMode === 'scandinavian'
                ? 'border-purple-600 bg-purple-50 shadow-xs ring-2 ring-purple-300/50'
                : 'border-slate-200 hover:border-purple-300 bg-white'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-4 h-4 rounded-full bg-slate-100 border border-slate-300 shadow-2xs shrink-0" />
              <span className="font-extrabold text-xs text-slate-900 truncate">
                Белоснежный
              </span>
            </div>
            {backgroundMode === 'scandinavian' && (
              <CheckCircle2 className="w-4 h-4 text-purple-700 shrink-0" />
            )}
          </button>

          {/* Mode 4: Warm Ivory */}
          <button
            type="button"
            onClick={() => onChangeBackgroundMode?.('warm_ivory')}
            className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
              backgroundMode === 'warm_ivory'
                ? 'border-purple-600 bg-purple-50 shadow-xs ring-2 ring-purple-300/50'
                : 'border-slate-200 hover:border-purple-300 bg-white'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-4 h-4 rounded-full bg-amber-50 border border-amber-300 shadow-2xs shrink-0" />
              <span className="font-extrabold text-xs text-slate-900 truncate">
                Тёплый крем-брюле
              </span>
            </div>
            {backgroundMode === 'warm_ivory' && (
              <CheckCircle2 className="w-4 h-4 text-purple-700 shrink-0" />
            )}
          </button>

          {/* Mode 5: Soft Mint */}
          <button
            type="button"
            onClick={() => onChangeBackgroundMode?.('soft_mint')}
            className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
              backgroundMode === 'soft_mint'
                ? 'border-purple-600 bg-purple-50 shadow-xs ring-2 ring-purple-300/50'
                : 'border-slate-200 hover:border-purple-300 bg-white'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-4 h-4 rounded-full bg-emerald-50 border border-emerald-300 shadow-2xs shrink-0" />
              <span className="font-extrabold text-xs text-slate-900 truncate">
                Мятный штиль
              </span>
            </div>
            {backgroundMode === 'soft_mint' && (
              <CheckCircle2 className="w-4 h-4 text-purple-700 shrink-0" />
            )}
          </button>

          {/* Mode 6: Ice Sky */}
          <button
            type="button"
            onClick={() => onChangeBackgroundMode?.('ice_sky')}
            className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
              backgroundMode === 'ice_sky'
                ? 'border-purple-600 bg-purple-50 shadow-xs ring-2 ring-purple-300/50'
                : 'border-slate-200 hover:border-purple-300 bg-white'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-4 h-4 rounded-full bg-sky-50 border border-sky-300 shadow-2xs shrink-0" />
              <span className="font-extrabold text-xs text-slate-900 truncate">
                Ледяной бриз
              </span>
            </div>
            {backgroundMode === 'ice_sky' && (
              <CheckCircle2 className="w-4 h-4 text-purple-700 shrink-0" />
            )}
          </button>

          {/* Mode 7: Dark Night Mode */}
          <button
            type="button"
            onClick={() => onChangeBackgroundMode?.('dark_slate')}
            className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
              backgroundMode === 'dark_slate'
                ? 'border-purple-600 bg-purple-50 shadow-xs ring-2 ring-purple-300/50'
                : 'border-slate-200 hover:border-purple-300 bg-white'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-4 h-4 rounded-full bg-slate-900 border border-slate-700 shadow-2xs shrink-0" />
              <span className="font-extrabold text-xs text-slate-900 truncate">
                Тёмный ночной
              </span>
            </div>
            {backgroundMode === 'dark_slate' && (
              <CheckCircle2 className="w-4 h-4 text-purple-700 shrink-0" />
            )}
          </button>
        </div>
      </div>

      {/* SECTION 3: EXPANDED COLOR SCHEMES / GRADIENTS GRID (13 ПАЛИТР) */}
      <div className="bg-white rounded-2xl p-5 border border-purple-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
            <Palette className="w-4 h-4 text-purple-700" />
            <span>Цветовые палитры оформления ({allGradients.length})</span>
          </div>
          <span className="text-xs text-slate-500">
            Нажмите на карточку палитры — фон сайта и акценты изменятся моментально
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {allGradients.map((item) => {
            const isSelected = currentGradientId === item.id;
            return (
              <div
                key={item.id}
                onClick={() => onSelectGradient(item.id)}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative group flex flex-col justify-between gap-3 text-left ${
                  isSelected
                    ? 'border-purple-600 bg-purple-50/60 shadow-md ring-2 ring-purple-300/70 scale-[1.02]'
                    : 'border-purple-100 hover:border-purple-300 bg-white hover:bg-purple-50/20 shadow-2xs hover:shadow-xs'
                }`}
              >
                {/* Active selection badge */}
                {isSelected && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-700 text-white text-[10px] font-extrabold shadow-xs z-10">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>Выбрано</span>
                  </div>
                )}

                <div className="space-y-2">
                  {/* Swatch Preview Bar */}
                  <div
                    className="h-10 rounded-xl shadow-xs border border-white/50 flex items-center justify-end px-3 transition-transform group-hover:scale-[1.01]"
                    style={{ background: item.cssGradient }}
                  >
                    <span className="text-[10px] font-bold text-white drop-shadow-sm">
                      {item.badge}
                    </span>
                  </div>

                  <div className="pt-0.5">
                    <div className="font-extrabold text-xs sm:text-sm text-slate-900 leading-snug">
                      {item.name}
                    </div>
                  </div>

                  {/* Instant visual live preview row right on each card */}
                  <div className="pt-2 pb-1 space-y-1.5 border-t border-purple-100/70">
                    <div className="flex items-center gap-1.5 justify-between flex-wrap">
                      <div
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-white shadow-2xs flex items-center gap-1 shrink-0"
                        style={{
                          background: showFlatFallback ? '#7652B5' : item.cssGradient,
                          boxShadow: showFlatFallback ? 'none' : item.buttonShadow,
                        }}
                      >
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>+ Заявка</span>
                      </div>

                      <div
                        className="px-2 py-0.5 rounded-md text-[9px] font-bold text-white shadow-2xs truncate"
                        style={{
                          background: showFlatFallback ? '#7652B5' : item.activeItemGradient,
                        }}
                      >
                        <span>Список работ</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Color steps / Hex points */}
                <div className="pt-2 border-t border-purple-100/80 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {item.hexSteps.map((hex, i) => (
                      <span
                        key={i}
                        className="w-4 h-4 rounded-full border border-white shadow-2xs inline-block"
                        style={{ backgroundColor: hex }}
                        title={hex}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {item.fromColor} → {item.toColor}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 4: ACCENT STYLE TOGGLE (GRADIENT VS FLAT) */}
      <div className="bg-white rounded-2xl p-5 border border-purple-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
          <Layers className="w-4 h-4 text-purple-700" />
          <span>Стиль прорисовки элементов</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => onToggleFlatFallback(false)}
            className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
              !showFlatFallback
                ? 'border-purple-600 bg-purple-50/70 shadow-sm ring-1 ring-purple-300'
                : 'border-slate-200 hover:border-purple-300 bg-white'
            }`}
          >
            <div className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-700" />
              <span>Объёмный градиент</span>
            </div>
            {!showFlatFallback && (
              <CheckCircle2 className="w-4 h-4 text-purple-700 shrink-0" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onToggleFlatFallback(true)}
            className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
              showFlatFallback
                ? 'border-purple-600 bg-purple-50/70 shadow-sm ring-1 ring-purple-300'
                : 'border-slate-200 hover:border-purple-300 bg-white'
            }`}
          >
            <div className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-700" />
              <span>Плоский монохромный цвет (Flat)</span>
            </div>
            {showFlatFallback && (
              <CheckCircle2 className="w-4 h-4 text-purple-700 shrink-0" />
            )}
          </button>
        </div>
      </div>

      {/* PROMINENT SECTION: SAMPLE PREVIEW (ОБРАЗЕЦ ПРОСМОТРА) — PLACED RIGHT ABOVE EYE COMFORT SECTION */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-100 via-indigo-50 to-purple-50 border-2 border-purple-300/80 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-purple-700 text-white flex items-center justify-center shadow-md shrink-0">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-slate-900 leading-tight">
                Образец просмотра (Проверка комфорта глаз и контраста)
              </h3>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Компактный выбор цвета фона и кнопок (без описания) для быстрой настройки и оценки читаемости.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsSampleModalOpen(true)}
            className="px-5 py-2.5 rounded-xl text-white font-extrabold text-xs shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            style={{
              background: showFlatFallback ? '#7652B5' : currentGradient.cssGradient,
              boxShadow: showFlatFallback ? 'none' : currentGradient.buttonShadow,
            }}
          >
            <Eye className="w-4 h-4 text-white stroke-[2.5]" />
            <span>Открыть образец просмотра</span>
          </button>
        </div>

        {/* Compact in-place selector: background & buttons (без описания) */}
        <div className="p-3 rounded-xl bg-white/95 border border-purple-200/90 shadow-2xs space-y-2.5">
          {/* Background choice */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-600 flex items-center gap-1 shrink-0">
              <Monitor className="w-3.5 h-3.5 text-purple-700" />
              <span>Цвет фона:</span>
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'palette', name: 'В тон палитры', hex: '#9333EA' },
                { id: 'lavender', name: 'Светлая лаванда', hex: '#FAF8FD' },
                { id: 'scandinavian', name: 'Белоснежный', hex: '#F8FAFC' },
                { id: 'warm_ivory', name: 'Тёплый крем-брюле', hex: '#FAF6F0' },
                { id: 'soft_mint', name: 'Мятный штиль', hex: '#F0FDF4' },
                { id: 'ice_sky', name: 'Ледяной бриз', hex: '#F0F9FF' },
                { id: 'dark_slate', name: 'Тёмный ночной', hex: '#0B0F19' },
              ].map((b) => {
                const active = backgroundMode === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => onChangeBackgroundMode?.(b.id as BackgroundMode)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                      active
                        ? 'bg-purple-700 text-white border-purple-700 shadow-2xs ring-1 ring-purple-300'
                        : 'bg-white hover:bg-purple-50 text-slate-700 border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-slate-300 shrink-0"
                      style={{ backgroundColor: b.hex }}
                    />
                    <span>{b.name}</span>
                    {active && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Buttons / Palettes choice */}
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-purple-100">
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-600 flex items-center gap-1 shrink-0">
              <Palette className="w-3.5 h-3.5 text-purple-700" />
              <span>Цвет кнопок:</span>
            </span>
            <div className="flex items-center gap-1.5 flex-wrap max-h-24 overflow-y-auto pr-1">
              {allGradients.map((item) => {
                const active = currentGradientId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectGradient(item.id)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                      active
                        ? 'bg-purple-700 text-white border-purple-700 shadow-2xs ring-1 ring-purple-300'
                        : 'bg-white hover:bg-purple-50 text-slate-700 border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                      style={{ background: item.cssGradient }}
                    />
                    <span>{item.name}</span>
                    {active && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5: EYE COMFORT, CONTRAST & EVENING FILTER (КОМФОРТ ДЛЯ ГЛАЗ) */}
      <div className="bg-white rounded-2xl p-5 border border-purple-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
            <Eye className="w-4 h-4 text-purple-700" />
            <span>Комфорт для глаз, контрастность и вечерний фильтр</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick button to open sample preview right inside the eye comfort section */}
            <button
              type="button"
              onClick={() => setIsSampleModalOpen(true)}
              className="px-3 py-1 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Открыть демонстрационный образец для проверки"
            >
              <Eye className="w-3.5 h-3.5 text-white stroke-[2.5]" />
              <span>Образец просмотра</span>
            </button>

            {/* Toggle to enable/disable filters so palette always works perfectly */}
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none px-2.5 py-1 rounded-xl bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-colors">
              <input
                type="checkbox"
                checked={displayFiltersEnabled}
                onChange={(e) => onToggleDisplayFilters?.(e.target.checked)}
                className="w-4 h-4 accent-purple-700 rounded cursor-pointer"
              />
              <span>Активировать фильтры экрана</span>
            </label>

            <button
              type="button"
              onClick={onResetDisplaySettings}
              className="px-2.5 py-1 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              title="Сбросить все параметры фильтрации до 100% / 0%"
            >
              Сбросить (100% / 0%)
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-600">
          Точная регулировка оптических параметров экрана. Если вы хотите видеть чистые цвета выбранной палитры без искажений, сбросьте параметры или отключите фильтры галочкой.
        </p>

        {/* Quick Presets */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-xs font-bold text-slate-700 mr-1">
            Быстрые пресеты:
          </span>
          <button
            type="button"
            onClick={() =>
              applyScreenPreset({
                saturation: 100,
                contrast: 100,
                brightness: 100,
                warmth: 0,
              })
            }
            className="px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100 text-purple-900 text-xs font-bold transition-colors cursor-pointer"
          >
            Дневной стандарт
          </button>

          <button
            type="button"
            onClick={() =>
              applyScreenPreset({
                saturation: 85,
                contrast: 98,
                brightness: 95,
                warmth: 16,
              })
            }
            className="px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-colors cursor-pointer"
          >
            🌙 Вечерний уют (тёплый)
          </button>

          <button
            type="button"
            onClick={() =>
              applyScreenPreset({
                saturation: 110,
                contrast: 118,
                brightness: 104,
                warmth: 0,
              })
            }
            className="px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold transition-colors cursor-pointer"
          >
            Высокая чёткость
          </button>

          <button
            type="button"
            onClick={() =>
              applyScreenPreset({
                saturation: 85,
                contrast: 95,
                brightness: 100,
                warmth: 6,
              })
            }
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
          >
            Мягкая пастель
          </button>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Saturation */}
          <div className="p-3.5 rounded-xl bg-purple-50/40 border border-purple-100 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-purple-700" />
                <span>Насыщенность</span>
              </span>
              <span className="font-mono text-purple-900">
                {displaySettings.saturation}%
              </span>
            </div>
            <input
              type="range"
              min="30"
              max="180"
              value={displaySettings.saturation}
              onChange={(e) => {
                onUpdateDisplaySettings({
                  ...displaySettings,
                  saturation: Number(e.target.value),
                });
                if (!displayFiltersEnabled && onToggleDisplayFilters) {
                  onToggleDisplayFilters(true);
                }
              }}
              className="w-full accent-purple-700 cursor-pointer"
            />
          </div>

          {/* Contrast */}
          <div className="p-3.5 rounded-xl bg-purple-50/40 border border-purple-100 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1.5">
                <Contrast className="w-3.5 h-3.5 text-purple-700" />
                <span>Контрастность</span>
              </span>
              <span className="font-mono text-purple-900">
                {displaySettings.contrast}%
              </span>
            </div>
            <input
              type="range"
              min="60"
              max="150"
              value={displaySettings.contrast}
              onChange={(e) => {
                onUpdateDisplaySettings({
                  ...displaySettings,
                  contrast: Number(e.target.value),
                });
                if (!displayFiltersEnabled && onToggleDisplayFilters) {
                  onToggleDisplayFilters(true);
                }
              }}
              className="w-full accent-purple-700 cursor-pointer"
            />
          </div>

          {/* Brightness */}
          <div className="p-3.5 rounded-xl bg-purple-50/40 border border-purple-100 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-purple-700" />
                <span>Яркость</span>
              </span>
              <span className="font-mono text-purple-900">
                {displaySettings.brightness}%
              </span>
            </div>
            <input
              type="range"
              min="75"
              max="125"
              value={displaySettings.brightness}
              onChange={(e) => {
                onUpdateDisplaySettings({
                  ...displaySettings,
                  brightness: Number(e.target.value),
                });
                if (!displayFiltersEnabled && onToggleDisplayFilters) {
                  onToggleDisplayFilters(true);
                }
              }}
              className="w-full accent-purple-700 cursor-pointer"
            />
          </div>

          {/* Warmth (Blue light filter) */}
          <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-amber-950">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-amber-600" />
                <span>Тёплый фильтр</span>
              </span>
              <span className="font-mono text-amber-900">
                {displaySettings.warmth}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={displaySettings.warmth}
              onChange={(e) => {
                onUpdateDisplaySettings({
                  ...displaySettings,
                  warmth: Number(e.target.value),
                });
                if (!displayFiltersEnabled && onToggleDisplayFilters) {
                  onToggleDisplayFilters(true);
                }
              }}
              className="w-full accent-amber-600 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* STICKY FLOATING PREVIEW DOCK — SOLVES USER SCROLLING ISSUE (ЖИВОЙ ПРЕДПРОСМОТР ПРИ СКРОЛЛЕ) */}
      <div className="sticky bottom-3 z-30 w-full max-w-4xl mx-auto px-2 pointer-events-none">
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-4 border-2 border-purple-400 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-150 ring-1 ring-purple-200">
          {/* Left: Current palette info */}
          <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
            <div
              className="w-10 h-10 rounded-xl shadow-md border-2 border-white flex items-center justify-center shrink-0 transition-transform"
              style={{ background: showFlatFallback ? '#7652B5' : currentGradient.cssGradient }}
            >
              <Palette className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] uppercase font-bold text-slate-400">Выбрано:</span>
                <span className="text-xs font-black text-slate-900">{currentGradient.name}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-900">
                  {currentGradient.badge}
                </span>
              </div>
              <div className="text-[11px] text-purple-700 font-semibold mt-0.5">
                Фон: {getBgModeName(backgroundMode)} • {showFlatFallback ? 'Flat (моно)' : 'Градиент'}
              </div>
            </div>
          </div>

          {/* Center: Live interactive preview elements that reflect changes instantly */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <div
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-sm transition-all"
              style={{
                background: showFlatFallback ? '#7652B5' : currentGradient.cssGradient,
                boxShadow: showFlatFallback ? 'none' : currentGradient.buttonShadow,
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>+ Подать заявку</span>
            </div>

            <div
              className="px-3 py-1.5 rounded-xl text-xs font-extrabold text-white shadow-2xs transition-all"
              style={{
                background: showFlatFallback ? '#7652B5' : currentGradient.activeItemGradient,
              }}
            >
              <span>Список работ</span>
            </div>

            <div className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold flex items-center gap-1 shrink-0">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Выполнена</span>
            </div>
          </div>

          {/* Right: Quick actions */}
          <div className="flex items-center gap-2 shrink-0 self-end md:self-center flex-wrap">
            <button
              type="button"
              onClick={() => setIsSampleModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Открыть образец просмотра в модальном окне"
            >
              <Eye className="w-3.5 h-3.5 text-white stroke-[2.5]" />
              <span>Образец</span>
            </button>

            {onResetAllSettings && (
              <button
                type="button"
                onClick={onResetAllSettings}
                className="px-2.5 py-1.5 rounded-xl border-2 border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                title="Сбросить все настройки оформления к исходному виду сайта (до создания папки «Цветовой режим»)"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-600 stroke-[2.5]" />
                <span>Сброс</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="p-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              title="Прокрутить наверх к началу раздела"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* SAMPLE PREVIEW MODAL */}
      <EyeComfortSampleModal
        isOpen={isSampleModalOpen}
        onClose={() => setIsSampleModalOpen(false)}
        theme={theme}
        gradient={currentGradient}
        currentGradientId={currentGradientId}
        onSelectGradient={onSelectGradient}
        backgroundMode={backgroundMode}
        onChangeBackgroundMode={onChangeBackgroundMode}
        showFlatFallback={showFlatFallback}
        onToggleFlatFallback={onToggleFlatFallback}
        displaySettings={displaySettings}
        onUpdateDisplaySettings={onUpdateDisplaySettings}
        onResetDisplaySettings={onResetDisplaySettings}
      />
    </div>
  );
};
