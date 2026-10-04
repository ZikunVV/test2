import React, { useState, useEffect } from 'react';
import { ThemeConfig, DisplaySettings, SavedColorPreset } from '../types';
import {
  X,
  Sliders,
  Palette,
  Contrast,
  Sun,
  Eye,
  RotateCcw,
  Check,
  Minimize2,
  Maximize2,
  BookmarkPlus,
  Trash2,
  Bookmark,
  Sparkles,
  Tag,
} from 'lucide-react';

interface DisplaySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeConfig;
  settings: DisplaySettings;
  onChangeSettings: (newSettings: DisplaySettings) => void;
  onReset: () => void;
}

export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  saturation: 100,
  contrast: 100,
  brightness: 100,
  warmth: 0,
};

const INITIAL_SAVED_PRESETS: SavedColorPreset[] = [
  {
    id: 'preset-cozy-evening',
    name: 'Мой вечерний уют',
    settings: {
      saturation: 75,
      contrast: 95,
      brightness: 95,
      warmth: 15,
    },
    createdAt: 'по умолчанию',
  },
];

export const DisplaySettingsModal: React.FC<DisplaySettingsModalProps> = ({
  isOpen,
  onClose,
  theme,
  settings,
  onChangeSettings,
  onReset,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  // Saved user variants/presets state with localStorage
  const [savedPresets, setSavedPresets] = useState<SavedColorPreset[]>(() => {
    try {
      const stored = localStorage.getItem('app_saved_color_presets');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      // fallback
    }
    return INITIAL_SAVED_PRESETS;
  });

  // Save new variant form state
  const [isSaveFormOpen, setIsSaveFormOpen] = useState(false);
  const [customPresetName, setCustomPresetName] = useState('');
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Sync saved presets to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('app_saved_color_presets', JSON.stringify(savedPresets));
    } catch (e) {
      // ignore
    }
  }, [savedPresets]);

  if (!isOpen) return null;

  const handleUpdate = (field: keyof DisplaySettings, value: number) => {
    onChangeSettings({
      ...settings,
      [field]: value,
    });
  };

  const applyPreset = (preset: Partial<DisplaySettings>) => {
    onChangeSettings({
      ...settings,
      ...preset,
    });
  };

  const handleSaveCurrentVariant = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customPresetName.trim();
    const finalName = trimmed || `Мой вариант ${savedPresets.length + 1}`;

    const newPreset: SavedColorPreset = {
      id: `preset-${Date.now()}`,
      name: finalName,
      settings: { ...settings },
      createdAt: new Date().toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setSavedPresets((prev) => [newPreset, ...prev]);
    setCustomPresetName('');
    setIsSaveFormOpen(false);
    setSaveFeedback(`Вариант «${finalName}» сохранён!`);
    setTimeout(() => setSaveFeedback(null), 3500);
  };

  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedPresets((prev) => prev.filter((p) => p.id !== id));
  };

  const isCurrentMatching = (presetSettings: DisplaySettings) => {
    return (
      settings.saturation === presetSettings.saturation &&
      settings.contrast === presetSettings.contrast &&
      settings.brightness === presetSettings.brightness &&
      settings.warmth === presetSettings.warmth
    );
  };

  const isDefault =
    settings.saturation === 100 &&
    settings.contrast === 100 &&
    settings.brightness === 100 &&
    settings.warmth === 0;

  // Real-time filter string for live preview inside the widget
  const previewFilter = `saturate(${settings.saturation}%) contrast(${settings.contrast}%) brightness(${settings.brightness}%) sepia(${settings.warmth}%)`;

  return (
    /* UNDOCKED FLOATING PANEL (NO DARK BACKDROP: the user can freely see and interact with the page in real time!) */
    <aside
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-80 sm:w-96 max-w-[calc(100vw-2rem)] select-none shadow-2xl rounded-2xl border transition-all duration-200 backdrop-blur-md"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: '#C084FC',
        boxShadow:
          '0 20px 40px -12px rgba(118, 82, 181, 0.35), 0 0 0 1px rgba(192, 132, 252, 0.4)',
      }}
      aria-label="Открепленная панель настройки цвета"
    >
      {/* Panel Top Header Bar (Draggable appearance, Minimize & Close) */}
      <div className="flex items-center justify-between p-3.5 border-b border-purple-100 bg-purple-50/70 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-700 text-white flex items-center justify-center shadow-xs">
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-purple-950">
                Настройки цвета
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-purple-200/80 text-purple-800 font-semibold">
                Откреплено
              </span>
            </div>
            <p className="text-[10px] text-slate-500">
              Живой просмотр на странице
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-purple-800 hover:bg-purple-100 transition-colors"
            title={isMinimized ? 'Развернуть панель' : 'Свернуть панель'}
          >
            {isMinimized ? (
              <Maximize2 className="w-3.5 h-3.5" />
            ) : (
              <Minimize2 className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Закрыть настройки"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* When minimized: Compact pill view */}
      {isMinimized ? (
        <div className="p-3 flex items-center justify-between text-xs gap-2">
          <div className="text-[11px] text-slate-600 font-mono">
            Насыщ: <strong>{settings.saturation}%</strong> · Контр:{' '}
            <strong>{settings.contrast}%</strong>
          </div>
          <button
            onClick={() => setIsMinimized(false)}
            className="text-xs text-purple-700 font-bold hover:underline"
          >
            Развернуть
          </button>
        </div>
      ) : (
        /* Full Expanded Controls */
        <div className="p-4 space-y-4 max-h-[calc(100vh-140px)] overflow-y-auto text-xs">
          {/* Success Feedback Alert */}
          {saveFeedback && (
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center gap-1.5 animate-in fade-in duration-150">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{saveFeedback}</span>
            </div>
          )}

          {/* 1. Live Preview Strip INSIDE the panel itself, updating dynamically */}
          <div className="p-2.5 rounded-xl border border-purple-200/90 bg-[#F9F7FD] space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-purple-900">
              <span>Превью элементов</span>
              <span className="text-[9px] text-slate-400 font-normal">
                (меняется вместе с сайтом)
              </span>
            </div>

            <div
              className="flex flex-wrap items-center gap-1.5 transition-all duration-75 p-1 rounded-lg bg-white/80"
              style={{ filter: previewFilter }}
            >
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                style={{
                  background:
                    'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 50%, #FECDD3 100%)',
                  borderColor: '#FECDD3',
                  color: '#9F1239',
                }}
              >
                ● Ожидание
              </span>

              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                style={{
                  background:
                    'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 50%, #FDE68A 100%)',
                  borderColor: '#FDE68A',
                  color: '#92400E',
                }}
              >
                ● В работе
              </span>

              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                style={{
                  background:
                    'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 50%, #A7F3D0 100%)',
                  borderColor: '#A7F3D0',
                  color: '#065F46',
                }}
              >
                ✓ Выполнено
              </span>

              <span
                className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold text-white shadow-2xs ml-auto"
                style={{
                  background:
                    'linear-gradient(135deg, #9D71DE 0%, #7652B5 50%, #563692 100%)',
                }}
              >
                + Заявка
              </span>
            </div>
          </div>

          {/* 2. Interactive Sliders */}
          <div className="space-y-3.5">
            {/* Saturation */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                  <Palette className="w-3.5 h-3.5 text-purple-600" />
                  <span>Насыщенность цветов</span>
                </div>
                <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 border border-purple-200">
                  {settings.saturation}%
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="180"
                step="1"
                value={settings.saturation}
                onChange={(e) =>
                  handleUpdate('saturation', Number(e.target.value))
                }
                className="w-full accent-purple-600 cursor-pointer h-2 bg-purple-100 rounded-lg"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-medium">
                <span>30% (Мягко)</span>
                <span className="text-purple-700 font-bold">100% (Норма)</span>
                <span>180% (Сочно)</span>
              </div>
            </div>

            {/* Contrast */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                  <Contrast className="w-3.5 h-3.5 text-purple-600" />
                  <span>Контрастность</span>
                </div>
                <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 border border-purple-200">
                  {settings.contrast}%
                </span>
              </div>
              <input
                type="range"
                min="60"
                max="150"
                step="1"
                value={settings.contrast}
                onChange={(e) =>
                  handleUpdate('contrast', Number(e.target.value))
                }
                className="w-full accent-purple-600 cursor-pointer h-2 bg-purple-100 rounded-lg"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-medium">
                <span>60% (Сглаженно)</span>
                <span className="text-purple-700 font-bold">100% (Баланс)</span>
                <span>150% (Чётко)</span>
              </div>
            </div>

            {/* Brightness */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                  <Sun className="w-3.5 h-3.5 text-purple-600" />
                  <span>Яркость экрана</span>
                </div>
                <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 border border-purple-200">
                  {settings.brightness}%
                </span>
              </div>
              <input
                type="range"
                min="75"
                max="125"
                step="1"
                value={settings.brightness}
                onChange={(e) =>
                  handleUpdate('brightness', Number(e.target.value))
                }
                className="w-full accent-purple-600 cursor-pointer h-2 bg-purple-100 rounded-lg"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-medium">
                <span>75% (Темнее)</span>
                <span className="text-purple-700 font-bold">100% (Норма)</span>
                <span>125% (Светлее)</span>
              </div>
            </div>

            {/* Warmth / Eye Comfort */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                  <Eye className="w-3.5 h-3.5 text-amber-600" />
                  <span>Тёплый фильтр (защита глаз)</span>
                </div>
                <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                  {settings.warmth}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={settings.warmth}
                onChange={(e) => handleUpdate('warmth', Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer h-2 bg-amber-100 rounded-lg"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-medium">
                <span className="text-purple-700 font-bold">0% (Нейтрально)</span>
                <span>25% (Тёплый)</span>
                <span>50% (Вечерний)</span>
              </div>
            </div>
          </div>

          {/* 3. SAVE VARIANT & SIGN (СОХРАНИТЬ ВАРИАНТ И ПОДПИСАТЬ) */}
          <div className="p-3 rounded-xl border border-purple-200 bg-purple-50/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-[11px] text-purple-950">
                <BookmarkPlus className="w-3.5 h-3.5 text-purple-700" />
                <span>Сохранить текущие настройки</span>
              </div>

              {!isSaveFormOpen && (
                <button
                  type="button"
                  onClick={() => setIsSaveFormOpen(true)}
                  className="px-2 py-1 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold text-[10px] flex items-center gap-1 shadow-2xs transition-colors"
                >
                  <BookmarkPlus className="w-3 h-3" />
                  <span>Подписать и сохранить</span>
                </button>
              )}
            </div>

            {/* Expanded Save Form */}
            {isSaveFormOpen ? (
              <form onSubmit={handleSaveCurrentVariant} className="space-y-2 pt-1">
                <label className="text-[10px] font-semibold text-slate-700 block">
                  Подпишите название вашего варианта:
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    autoFocus
                    value={customPresetName}
                    onChange={(e) => setCustomPresetName(e.target.value)}
                    placeholder="Например: Мой для вечера, Для работы..."
                    className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-purple-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium"
                    maxLength={32}
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-lg shadow-xs transition-colors shrink-0 flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    <span>Сохранить</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSaveFormOpen(false);
                      setCustomPresetName('');
                    }}
                    className="px-2 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium text-xs rounded-lg transition-colors shrink-0"
                  >
                    Отмена
                  </button>
                </div>

                {/* Quick preset title suggestions */}
                <div className="flex flex-wrap items-center gap-1 pt-0.5">
                  <span className="text-[9px] text-slate-400">Подсказки:</span>
                  {['Вечерний отдых', 'Дневная работа', 'Мягкий пастель', 'Мой идеал'].map(
                    (tag) => (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => setCustomPresetName(tag)}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-white hover:bg-purple-100 text-purple-800 border border-purple-200 font-medium transition-colors"
                      >
                        +{tag}
                      </button>
                    )
                  )}
                </div>
              </form>
            ) : (
              <p className="text-[10px] text-slate-500">
                Текущие значения: {settings.saturation}% нас. · {settings.contrast}% контр. · {settings.brightness}% ярк. · {settings.warmth}% тепл.
              </p>
            )}
          </div>

          {/* 4. USER'S SAVED VARIANTS LIST (МОИ СОХРАНЁННЫЕ ВАРИАНТЫ) */}
          {savedPresets.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <Bookmark className="w-3 h-3 text-purple-700" />
                  <span>Сохранённые варианты ({savedPresets.length})</span>
                </span>
                <span className="text-[9px] font-normal text-slate-400">
                  Кликните для применения
                </span>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
                {savedPresets.map((preset) => {
                  const isActive = isCurrentMatching(preset.settings);
                  return (
                    <div
                      key={preset.id}
                      onClick={() => onChangeSettings(preset.settings)}
                      className={`p-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                        isActive
                          ? 'border-purple-600 bg-purple-100/90 font-bold text-purple-950 shadow-2xs'
                          : 'border-purple-200/80 bg-white hover:bg-purple-50 text-slate-800'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-[11px] font-bold truncate">
                            {preset.name}
                          </span>
                          {isActive && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-700 text-white font-semibold">
                              Активен
                            </span>
                          )}
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                          <span>
                            Н: {preset.settings.saturation}% · К: {preset.settings.contrast}% · Я: {preset.settings.brightness}%
                            {preset.settings.warmth > 0 && ` · Т: ${preset.settings.warmth}%`}
                          </span>
                          {preset.createdAt && (
                            <span className="text-slate-400">({preset.createdAt})</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handleDeletePreset(preset.id, e)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title={`Удалить вариант «${preset.name}»`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. Standard Fast Presets (1-click) */}
          <div className="pt-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Базовые пресеты
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    saturation: 100,
                    contrast: 100,
                    brightness: 100,
                    warmth: 0,
                  })
                }
                className={`px-2 py-1.5 rounded-lg border text-left transition-all ${
                  isDefault
                    ? 'border-purple-600 bg-purple-100/70 font-bold text-purple-950'
                    : 'border-purple-200/80 bg-white hover:bg-purple-50 text-slate-700'
                }`}
              >
                <div className="text-[11px]">🎨 Стандартный</div>
                <div className="text-[9px] text-slate-400">100% цвета</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    saturation: 75,
                    contrast: 95,
                    brightness: 98,
                    warmth: 10,
                  })
                }
                className={`px-2 py-1.5 rounded-lg border text-left transition-all ${
                  settings.saturation === 75 && settings.warmth === 10
                    ? 'border-purple-600 bg-purple-100/70 font-bold text-purple-950'
                    : 'border-purple-200/80 bg-white hover:bg-purple-50 text-slate-700'
                }`}
              >
                <div className="text-[11px]">🌿 Комфорт глаз</div>
                <div className="text-[9px] text-slate-400">Не режет глаза</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    saturation: 55,
                    contrast: 90,
                    brightness: 102,
                    warmth: 4,
                  })
                }
                className={`px-2 py-1.5 rounded-lg border text-left transition-all ${
                  settings.saturation === 55
                    ? 'border-purple-600 bg-purple-100/70 font-bold text-purple-950'
                    : 'border-purple-200/80 bg-white hover:bg-purple-50 text-slate-700'
                }`}
              >
                <div className="text-[11px]">🌸 Пастельный</div>
                <div className="text-[9px] text-slate-400">Мягкие тона</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    saturation: 115,
                    contrast: 125,
                    brightness: 100,
                    warmth: 0,
                  })
                }
                className={`px-2 py-1.5 rounded-lg border text-left transition-all ${
                  settings.contrast === 125
                    ? 'border-purple-600 bg-purple-100/70 font-bold text-purple-950'
                    : 'border-purple-200/80 bg-white hover:bg-purple-50 text-slate-700'
                }`}
              >
                <div className="text-[11px]">⚡ Контраст</div>
                <div className="text-[9px] text-slate-400">Чёткий текст</div>
              </button>
            </div>
          </div>

          {/* 6. Footer: Reset button & Done button */}
          <div className="flex items-center justify-between pt-2 border-t border-purple-100">
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-purple-900 hover:bg-purple-50 text-[11px] font-medium transition-colors"
              title="Сбросить все ползунки к 100%"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Сбросить к 100%</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-2xs transition-colors"
            >
              Закрыть панель
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
