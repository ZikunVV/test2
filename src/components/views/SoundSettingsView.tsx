import React, { useState, useRef } from 'react';
import { ThemeConfig, GradientOption, UserItem } from '../../types';
import {
  SOUND_VARIANTS,
  SoundVariantId,
  UserSoundSettings,
  DEFAULT_SOUND_SETTINGS,
  CustomSoundItem,
  playSoundVariant,
  playCustomAudio,
  registerCustomSoundInMemory,
  speakAlertText,
  triggerDeviceVibration,
  setBackgroundKeepAliveActive,
} from '../../utils/soundAlerts';
import {
  Volume2,
  VolumeX,
  Bell,
  AlertTriangle,
  MessageSquare,
  CheckSquare,
  Play,
  Check,
  ArrowLeft,
  Sliders,
  Smartphone,
  Mic,
  Eye,
  BellRing,
  RotateCcw,
  FolderOpen,
  Sparkles,
  Radio,
  ExternalLink,
  Upload,
  Music,
  Trash2,
  Palette,
} from 'lucide-react';

interface SoundSettingsViewProps {
  theme: ThemeConfig;
  gradient: GradientOption;
  showFlatFallback: boolean;
  currentUser?: UserItem;
  soundSettings: UserSoundSettings;
  onUpdateSoundSettings: (next: UserSoundSettings) => void;
  onTriggerTestAlert: (
    type: 'new_ticket' | 'urgent_ticket' | 'ticket_status' | 'new_message' | 'personal_task'
  ) => void;
  onNavigateToColors?: () => void;
  onBackToHome: () => void;
}

export const SoundSettingsView: React.FC<SoundSettingsViewProps> = ({
  theme,
  gradient,
  showFlatFallback,
  currentUser,
  soundSettings,
  onUpdateSoundSettings,
  onTriggerTestAlert,
  onNavigateToColors,
  onBackToHome,
}) => {
  const [playingVariantId, setPlayingVariantId] = useState<SoundVariantId | null>(null);
  const [browserPermStatus, setBrowserPermStatus] = useState<string>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadFeedback, setUploadFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 8MB for sound effect / melody)
    if (file.size > 8 * 1024 * 1024) {
      setUploadFeedback({
        type: 'error',
        text: 'Файл слишком большой (максимум 8 МБ). Пожалуйста, выберите более короткий аудиофайл.',
      });
      setTimeout(() => setUploadFeedback(null), 4000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const soundId = `custom_${Date.now()}`;
      const cleanName = file.name.replace(/\.[^/.]+$/, '').trim() || 'Пользовательский звук';
      const sizeKb = `${(file.size / 1024).toFixed(0)} КБ`;

      const newCustom: CustomSoundItem = {
        id: soundId,
        name: cleanName,
        dataUrl,
        sizeLabel: sizeKb,
        createdAt: new Date().toLocaleDateString('ru-RU'),
      };

      registerCustomSoundInMemory(soundId, dataUrl);
      playCustomAudio(dataUrl, soundSettings.volume);

      const nextCustoms = [newCustom, ...(soundSettings.customSounds || [])];
      const nextEnabled = soundSettings.enabledVariants.includes(soundId)
        ? soundSettings.enabledVariants
        : [...soundSettings.enabledVariants, soundId];

      onUpdateSoundSettings({
        ...soundSettings,
        customSounds: nextCustoms,
        enabledVariants: nextEnabled,
      });

      setUploadFeedback({
        type: 'success',
        text: `Звук «${cleanName}» успешно загружен и добавлен в список! Теперь вы можете назначить его на любое событие.`,
      });
      setTimeout(() => setUploadFeedback(null), 4500);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      setUploadFeedback({
        type: 'error',
        text: 'Не удалось прочитать выбранный файл. Попробуйте другой аудиофайл.',
      });
      setTimeout(() => setUploadFeedback(null), 4000);
    };

    reader.readAsDataURL(file);
  };

  const handleDeleteCustomSound = (id: string, name: string) => {
    const nextCustoms = (soundSettings.customSounds || []).filter((cs) => cs.id !== id);
    const nextEnabled = soundSettings.enabledVariants.filter((vId) => vId !== id);

    onUpdateSoundSettings({
      ...soundSettings,
      customSounds: nextCustoms,
      enabledVariants: nextEnabled,
      normalSoundVariant: soundSettings.normalSoundVariant === id ? 'crystal_chime' : soundSettings.normalSoundVariant,
      urgentSoundVariant: soundSettings.urgentSoundVariant === id ? 'emergency_siren' : soundSettings.urgentSoundVariant,
      statusSoundVariant: soundSettings.statusSoundVariant === id ? 'walkie_talkie' : soundSettings.statusSoundVariant,
      messageSoundVariant: soundSettings.messageSoundVariant === id ? 'digital_pulse' : soundSettings.messageSoundVariant,
      taskSoundVariant: soundSettings.taskSoundVariant === id ? 'warm_marimba' : soundSettings.taskSoundVariant,
    });

    setUploadFeedback({
      type: 'success',
      text: `Звук «${name}» удалён.`,
    });
    setTimeout(() => setUploadFeedback(null), 3000);
  };

  const handlePlayPreview = (variantId: SoundVariantId) => {
    setPlayingVariantId(variantId);
    playSoundVariant(variantId, soundSettings.volume);
    setTimeout(() => {
      setPlayingVariantId((prev) => (prev === variantId ? null : prev));
    }, 1200);
  };

  const handleToggleEventCheckbox = (key: keyof UserSoundSettings) => {
    const currentVal = Boolean(soundSettings[key]);
    const nextVal = !currentVal;

    if (
      key === 'enableBrowserPush' &&
      nextVal &&
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission !== 'granted'
    ) {
      Notification.requestPermission().then((perm) => {
        setBrowserPermStatus(perm);
      });
    }

    const updated: UserSoundSettings = {
      ...soundSettings,
      [key]: nextVal,
    };
    onUpdateSoundSettings(updated);

    // При включении галочки сразу даём короткий отклик
    if (nextVal) {
      if (key === 'enableUrgentTicket') {
        playSoundVariant(soundSettings.urgentSoundVariant, soundSettings.volume);
      } else if (key === 'enableNewMessage') {
        playSoundVariant(soundSettings.messageSoundVariant, soundSettings.volume);
      } else if (key === 'enablePersonalTask') {
        playSoundVariant(soundSettings.taskSoundVariant, soundSettings.volume);
      } else if (key === 'enableVoiceAnnounce') {
        speakAlertText('Голосовое оповещение включено', soundSettings.volume);
      } else if (key === 'enableVibration') {
        triggerDeviceVibration(false);
      } else {
        playSoundVariant(soundSettings.normalSoundVariant, soundSettings.volume);
      }
    }
  };

  const handleToggleVariantCheckbox = (variantId: SoundVariantId) => {
    const isChecked = soundSettings.enabledVariants.includes(variantId);
    let nextEnabled: SoundVariantId[];

    if (isChecked) {
      // Оставляем хотя бы 1 подключенный вариант
      if (soundSettings.enabledVariants.length <= 1) {
        handlePlayPreview(variantId);
        return;
      }
      nextEnabled = soundSettings.enabledVariants.filter((id) => id !== variantId);
    } else {
      nextEnabled = [...soundSettings.enabledVariants, variantId];
      handlePlayPreview(variantId);
    }

    // Если пользователь подключил вариант галочкой — автоматически назначаем его подходящей категории,
    // либо если отключил — переключаем категорию на первый доступный подключенный вариант
    const fallbackVariant = nextEnabled[0] || 'crystal_chime';
    const nextSettings: UserSoundSettings = {
      ...soundSettings,
      enabledVariants: nextEnabled,
      normalSoundVariant: !isChecked
        ? variantId !== 'emergency_siren' && variantId !== 'strict_buzzer'
          ? variantId
          : soundSettings.normalSoundVariant
        : nextEnabled.includes(soundSettings.normalSoundVariant)
        ? soundSettings.normalSoundVariant
        : fallbackVariant,
      urgentSoundVariant: !isChecked
        ? variantId === 'emergency_siren' || variantId === 'strict_buzzer'
          ? variantId
          : soundSettings.urgentSoundVariant
        : nextEnabled.includes(soundSettings.urgentSoundVariant)
        ? soundSettings.urgentSoundVariant
        : fallbackVariant,
      statusSoundVariant: nextEnabled.includes(soundSettings.statusSoundVariant)
        ? soundSettings.statusSoundVariant
        : fallbackVariant,
      messageSoundVariant: nextEnabled.includes(soundSettings.messageSoundVariant)
        ? soundSettings.messageSoundVariant
        : fallbackVariant,
      taskSoundVariant: nextEnabled.includes(soundSettings.taskSoundVariant)
        ? soundSettings.taskSoundVariant
        : fallbackVariant,
    };

    onUpdateSoundSettings(nextSettings);
  };

  const handleAssignCategoryVariant = (
    categoryKey:
      | 'normalSoundVariant'
      | 'urgentSoundVariant'
      | 'statusSoundVariant'
      | 'messageSoundVariant'
      | 'taskSoundVariant',
    variantId: SoundVariantId
  ) => {
    const nextEnabled = soundSettings.enabledVariants.includes(variantId)
      ? soundSettings.enabledVariants
      : [...soundSettings.enabledVariants, variantId];

    onUpdateSoundSettings({
      ...soundSettings,
      enabledVariants: nextEnabled,
      [categoryKey]: variantId,
    });
    handlePlayPreview(variantId);
  };

  const handleResetDefaults = () => {
    onUpdateSoundSettings(DEFAULT_SOUND_SETTINGS);
    playSoundVariant(DEFAULT_SOUND_SETTINGS.normalSoundVariant, DEFAULT_SOUND_SETTINGS.volume);
  };

  const eventCheckboxes: {
    key: keyof UserSoundSettings;
    title: string;
    description: string;
    icon: React.FC<{ className?: string }>;
    badge: string;
    badgeClass: string;
  }[] = [
    {
      key: 'enableNewTicket',
      title: 'Сигнал при новой заявке (обычной или плановой)',
      description: 'Звуковое оповещение при добавлении новой заявки в журнал работ',
      icon: Bell,
      badge: 'Заявки',
      badgeClass: 'bg-purple-100 text-purple-900 border-purple-200',
    },
    {
      key: 'enableUrgentTicket',
      title: 'Усиленный сигнал при АВАРИЙНОЙ / срочной заявке',
      description: 'Особый тревожный сигнал для заявок с высоким или критическим приоритетом',
      icon: AlertTriangle,
      badge: 'Авария / Срочно',
      badgeClass: 'bg-rose-100 text-rose-900 border-rose-200',
    },
    {
      key: 'enableTicketStatus',
      title: 'Сигнал при смене статуса заявки и сдаче отчёта',
      description: 'Звук при принятии заявки в работу, сдаче отчёта мастером или завершении',
      icon: Sparkles,
      badge: 'Статусы и отчёты',
      badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-200',
    },
    {
      key: 'enableNewMessage',
      title: 'Сигнал при новом сообщении или ответе администратора',
      description: 'Звуковое уведомление о входящем сообщении в разделе «Сообщения»',
      icon: MessageSquare,
      badge: 'Сообщения',
      badgeClass: 'bg-sky-100 text-sky-900 border-sky-200',
    },
    {
      key: 'enablePersonalTask',
      title: 'Сигнал для Личного списка дел и голосовых заметок',
      description: 'Звуковое подтверждение и напоминание по личным задачам',
      icon: CheckSquare,
      badge: 'Личный список дел',
      badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    },
    {
      key: 'enableVisualBanner',
      title: 'Всплывающее сигнальное окно на экране',
      description: 'Показывает заметную карточку оповещения сверху экрана при любом событии',
      icon: Eye,
      badge: 'Визуальный сигнал',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-200',
    },
    {
      key: 'enableVoiceAnnounce',
      title: 'Голосовое озвучивание событий (Диктор)',
      description: 'Проговаривает голосом тип события (например: «Внимание! Новая аварийная заявка»)',
      icon: Mic,
      badge: 'Голос',
      badgeClass: 'bg-violet-100 text-violet-900 border-violet-200',
    },
    {
      key: 'enableVibration',
      title: 'Вибрация на смартфоне при сигнале',
      description: 'Короткий виброотклик телефона при поступлении заявки или сообщения',
      icon: Smartphone,
      badge: 'Для телефона',
      badgeClass: 'bg-teal-100 text-teal-900 border-teal-200',
    },
    {
      key: 'enableBrowserPush',
      title: 'Системные Push-уведомления браузера (в фоне)',
      description:
        browserPermStatus === 'granted'
          ? 'Разрешение получено — уведомления приходят даже когда вкладка свёрнута'
          : 'Показывать системное окно уведомления поверх других программ',
      icon: BellRing,
      badge: 'Фоновый режим',
      badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
    },
  ];

  return (
    <div className="space-y-6">
      {/* GLOBAL SETTINGS TABS: [ 🎨 Цветовой режим ]  [ 🔊 Звуки ] */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-2 border-2 border-purple-200 shadow-sm flex items-center gap-2">
        <button
          type="button"
          onClick={onNavigateToColors}
          className="flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-slate-700 hover:text-purple-950 hover:bg-purple-50 transition-all flex items-center justify-center gap-2.5 cursor-pointer border border-transparent hover:border-purple-200"
        >
          <Palette className="w-4 h-4 text-purple-700" />
          <span>🎨 Цветовой режим (Фон, Кнопки, Контраст)</span>
        </button>

        <button
          type="button"
          className="flex-1 py-3 px-4 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2.5 cursor-default bg-purple-700 text-white shadow-md ring-2 ring-purple-300"
        >
          <Volume2 className="w-4 h-4 stroke-[2.5]" />
          <span>🔊 Звуки и оповещения</span>
        </button>
      </div>

      {/* Header & Folder Path ("Настройки" -> "Звуки") */}
      <div className="bg-white rounded-2xl p-5 border border-purple-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          {/* Папка Настройки -> Звуки */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 text-xs font-bold">
              <Sliders className="w-3.5 h-3.5 text-purple-700" />
              <span>Настройки</span>
            </span>
            <span className="text-slate-400 font-bold">/</span>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-white text-xs font-extrabold shadow-2xs"
              style={{
                background: showFlatFallback ? '#7652B5' : gradient.cssGradient,
              }}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Папка «Звуки»</span>
            </span>
          </div>

          <h2
            className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5 pt-1"
            style={{ color: theme.keyColors.textPrimary }}
          >
            <Volume2 className="w-6 h-6 text-purple-700 shrink-0" />
            <span>Настройка звуковых сигналов и оповещений</span>
          </h2>
          <p className="text-xs text-slate-600">
            Индивидуальные настройки для пользователя{' '}
            <span className="font-bold text-purple-900">
              {currentUser?.full_name || 'Главный администратор'}
            </span>
            . Отметьте галочками нужные сигналы и выберите понравившиеся варианты звуков.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0 flex-wrap">
          {onNavigateToColors && (
            <button
              type="button"
              onClick={onNavigateToColors}
              className="px-3.5 py-2 rounded-xl border border-purple-200 bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-900 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
              title="Перейти к выбору цветового режима и стиля оформления"
            >
              <Palette className="w-4 h-4 text-purple-600" />
              <span>Папка «Цветовой режим»</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-900 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Вернуть стандартные настройки звуков"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>По умолчанию</span>
          </button>

          <button
            type="button"
            onClick={onBackToHome}
            className="px-3.5 py-2 rounded-xl border border-purple-200 bg-white hover:bg-purple-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>На Главную</span>
          </button>
        </div>
      </div>

      {/* Master Switch & Volume + Instant Test Bar */}
      <div className="bg-white rounded-2xl p-5 border border-purple-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-purple-100">
          {/* Главная галочка включения всех звуков */}
          <label className="flex items-start sm:items-center gap-3.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={soundSettings.masterEnabled}
              onChange={() => handleToggleEventCheckbox('masterEnabled')}
              className="sr-only"
            />
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all shrink-0 mt-0.5 sm:mt-0 ${
                soundSettings.masterEnabled
                  ? 'bg-purple-700 border-purple-700 text-white shadow-xs'
                  : 'bg-white border-slate-300 text-transparent'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
            <div>
              <div className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>Включить звуковые сигналы-оповещения на сайте</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase ${
                    soundSettings.masterEnabled
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}
                >
                  {soundSettings.masterEnabled ? 'Активно' : 'Выключено'}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                Главный переключатель всех звуковых сигналов для вашего устройства
              </div>
            </div>
          </label>

          {/* Ползунок громкости */}
          <div className="flex items-center gap-3 bg-purple-50/70 px-4 py-2.5 rounded-xl border border-purple-200/70 min-w-[240px]">
            {soundSettings.volume === 0 || !soundSettings.masterEnabled ? (
              <VolumeX className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <Volume2 className="w-4 h-4 text-purple-700 shrink-0" />
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-purple-950 mb-1">
                <span>Громкость сигнала</span>
                <span>{soundSettings.volume}%</span>
              </div>
              <input
                type="range"
                min={5}
                max={100}
                step={5}
                value={soundSettings.volume}
                onChange={(e) => {
                  const nextVol = Number(e.target.value);
                  onUpdateSoundSettings({
                    ...soundSettings,
                    volume: nextVol,
                  });
                }}
                onMouseUp={() =>
                  playSoundVariant(soundSettings.normalSoundVariant, soundSettings.volume)
                }
                onTouchEnd={() =>
                  playSoundVariant(soundSettings.normalSoundVariant, soundSettings.volume)
                }
                className="w-full accent-purple-700 cursor-pointer h-1.5 bg-purple-200 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Кнопки быстрой проверки сигналов */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-extrabold text-slate-600 mr-1">
            Проверить как работает сигнал:
          </span>
          <button
            type="button"
            onClick={() => onTriggerTestAlert('new_ticket')}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-100 hover:bg-purple-200 text-purple-950 border border-purple-300 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            <Bell className="w-3.5 h-3.5 text-purple-700" />
            <span>Тест: Новая заявка</span>
          </button>

          <button
            type="button"
            onClick={() => onTriggerTestAlert('urgent_ticket')}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-100 hover:bg-rose-200 text-rose-950 border border-rose-300 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
            <span>Тест: Аварийная заявка</span>
          </button>

          <button
            type="button"
            onClick={() => onTriggerTestAlert('new_message')}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-100 hover:bg-sky-200 text-sky-950 border border-sky-300 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            <MessageSquare className="w-3.5 h-3.5 text-sky-700" />
            <span>Тест: Новое сообщение</span>
          </button>

          <button
            type="button"
            onClick={() => onTriggerTestAlert('personal_task')}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border border-emerald-300 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-700" />
            <span>Тест: Список дел</span>
          </button>
        </div>

        {/* Блок фоновой работы сигналов (отдельная дежурная вкладка) */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-purple-50/80 border border-purple-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="text-xs sm:text-sm font-black text-purple-950 flex items-center gap-2">
              <Radio className="w-4 h-4 text-purple-700 shrink-0" />
              <span>Работа сигналов в фоновом режиме (если вкладка свёрнута)</span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
              Чтобы звуковые напоминания гарантированно срабатывали, вы можете открыть отдельную <strong>фоновую вкладку-дежурный</strong> (с поддержкой фонового аудио-канала) или добавлять напоминания в системный Календарь/Будильник телефона прямо из окна «Голосовой набор».
            </p>
          </div>
          <a
            href="?bg_watcher=1"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setBackgroundKeepAliveActive(true)}
            className="px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shrink-0 shadow-xs transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            <span>Открыть фоновую вкладку</span>
          </a>
        </div>
      </div>

      {/* SECTION 1: ГАЛОЧКИ СОБЫТИЙ ("Что именно оповещать") */}
      <div className="bg-white rounded-2xl p-5 border border-purple-200/80 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <span>1. На какие события включить сигнал (выставьте галочки)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Отметьте галочками те события и способы оповещения, которые вы хотите получать:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {eventCheckboxes.map((item) => {
            const Icon = item.icon;
            const checked = Boolean(soundSettings[item.key]);

            return (
              <div
                key={item.key}
                onClick={() => handleToggleEventCheckbox(item.key)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                  checked
                    ? 'bg-purple-50/60 border-purple-300 shadow-2xs'
                    : 'bg-slate-50/60 border-slate-200 opacity-75 hover:opacity-100'
                }`}
              >
                {/* Checkbox */}
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-all shrink-0 mt-0.5 ${
                    checked
                      ? 'bg-purple-700 border-purple-700 text-white'
                      : 'bg-white border-slate-300 text-transparent'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                      <span>{item.title}</span>
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeClass}`}
                    >
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: ВАРИАНТЫ ЗВУКОВ С ГАЛОЧКАМИ */}
      <div className="bg-white rounded-2xl p-5 border border-purple-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-purple-700" />
              <span>2. Варианты звуков (выберите галочкой какой вариант подключить)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Поставьте галочку на понравившийся вариант звука (он сразу проиграется) и укажите, для каких уведомлений его использовать:
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-purple-900 border border-purple-200 self-start sm:self-center shrink-0">
            Подключено вариантов: {soundSettings.enabledVariants.length} из {SOUND_VARIANTS.length}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {SOUND_VARIANTS.map((variant) => {
            const isConnected = soundSettings.enabledVariants.includes(variant.id);
            const isPlaying = playingVariantId === variant.id;

            const isForNormal = soundSettings.normalSoundVariant === variant.id;
            const isForUrgent = soundSettings.urgentSoundVariant === variant.id;
            const isForStatus = soundSettings.statusSoundVariant === variant.id;
            const isForMessage = soundSettings.messageSoundVariant === variant.id;
            const isForTask = soundSettings.taskSoundVariant === variant.id;

            return (
              <div
                key={variant.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                  isConnected
                    ? 'bg-purple-50/40 border-purple-300 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-purple-200'
                }`}
              >
                <div className="space-y-2">
                  {/* Top row: Checkbox + Sound Name + Play Button */}
                  <div className="flex items-start justify-between gap-2">
                    <label
                      onClick={() => handleToggleVariantCheckbox(variant.id)}
                      className="flex items-start gap-3 cursor-pointer select-none flex-1 min-w-0"
                    >
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-all shrink-0 mt-0.5 ${
                          isConnected
                            ? 'bg-purple-700 border-purple-700 text-white'
                            : 'bg-white border-slate-300 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-black text-slate-900 flex items-center gap-2 flex-wrap">
                          <span>{variant.name}</span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            {variant.durationLabel}
                          </span>
                        </div>
                        <div className="text-[11px] font-bold text-purple-800">
                          {variant.subtitle}
                        </div>
                      </div>
                    </label>

                    <button
                      type="button"
                      onClick={() => handlePlayPreview(variant.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border transition-all shrink-0 cursor-pointer ${
                        isPlaying
                          ? 'bg-purple-700 text-white border-purple-700 scale-95'
                          : 'bg-white hover:bg-purple-100 text-purple-900 border-purple-200 shadow-2xs'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isPlaying ? 'Звучит...' : 'Прослушать'}</span>
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 pl-8">
                    {variant.description}
                  </p>
                </div>

                {/* Bottom row: Checkboxes to assign this sound variant to specific events */}
                <div className="pl-8 pt-2 border-t border-purple-100/80 space-y-1.5">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Использовать этот звук для (отметьте галочкой):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        handleAssignCategoryVariant('normalSoundVariant', variant.id)
                      }
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                        isForNormal
                          ? 'bg-purple-700 text-white border-purple-700 shadow-2xs'
                          : 'bg-white hover:bg-purple-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-xs flex items-center justify-center border ${
                          isForNormal
                            ? 'bg-white text-purple-800 border-white'
                            : 'border-slate-300'
                        }`}
                      >
                        {isForNormal && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <span>Новые заявки</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleAssignCategoryVariant('urgentSoundVariant', variant.id)
                      }
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                        isForUrgent
                          ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                          : 'bg-white hover:bg-rose-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-xs flex items-center justify-center border ${
                          isForUrgent
                            ? 'bg-white text-rose-700 border-white'
                            : 'border-slate-300'
                        }`}
                      >
                        {isForUrgent && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <span>Аварии / Срочные</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleAssignCategoryVariant('statusSoundVariant', variant.id)
                      }
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                        isForStatus
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-white hover:bg-indigo-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-xs flex items-center justify-center border ${
                          isForStatus
                            ? 'bg-white text-indigo-700 border-white'
                            : 'border-slate-300'
                        }`}
                      >
                        {isForStatus && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <span>Статус / Отчёт</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleAssignCategoryVariant('messageSoundVariant', variant.id)
                      }
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                        isForMessage
                          ? 'bg-sky-600 text-white border-sky-600 shadow-2xs'
                          : 'bg-white hover:bg-sky-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-xs flex items-center justify-center border ${
                          isForMessage
                            ? 'bg-white text-sky-700 border-white'
                            : 'border-slate-300'
                        }`}
                      >
                        {isForMessage && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <span>Сообщения</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleAssignCategoryVariant('taskSoundVariant', variant.id)
                      }
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                        isForTask
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-white hover:bg-emerald-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-xs flex items-center justify-center border ${
                          isForTask
                            ? 'bg-white text-emerald-700 border-white'
                            : 'border-slate-300'
                        }`}
                      >
                        {isForTask && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <span>Список дел</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: CUSTOM AUDIO & MUSIC UPLOAD */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white border border-purple-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-100 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Music className="w-5 h-5 text-purple-700" />
              <span>3. Своя музыка и звуки (загрузка файлов для звуковых эффектов)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Вы можете добавить свои любимые аудиофайлы или рингтоны (.mp3, .wav, .ogg, .m4a) и назначить их на любые оповещения в программе:
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.webm"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs flex items-center gap-2 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>Загрузить свой звук / музыку</span>
            </button>
          </div>
        </div>

        {/* Upload feedback message */}
        {uploadFeedback && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-200 ${
              uploadFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            {uploadFeedback.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{uploadFeedback.text}</span>
          </div>
        )}

        {/* List of uploaded custom sounds */}
        {(!soundSettings.customSounds || soundSettings.customSounds.length === 0) ? (
          <div className="p-8 rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/30 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
              <Music className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-purple-950">
              Пока нет загруженных аудиофайлов
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Нажмите кнопку «Загрузить свой звук / музыку», чтобы выбрать любой аудиофайл с вашего компьютера или телефона. После загрузки вы сможете прослушать его и назначить на оповещения.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {soundSettings.customSounds.map((cs) => {
              const isConnected = soundSettings.enabledVariants.includes(cs.id);
              const isPlaying = playingVariantId === cs.id;

              const isForNormal = soundSettings.normalSoundVariant === cs.id;
              const isForUrgent = soundSettings.urgentSoundVariant === cs.id;
              const isForStatus = soundSettings.statusSoundVariant === cs.id;
              const isForMessage = soundSettings.messageSoundVariant === cs.id;
              const isForTask = soundSettings.taskSoundVariant === cs.id;

              return (
                <div
                  key={cs.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    isConnected
                      ? 'bg-purple-50/50 border-purple-300 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-purple-200'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Header: Checkbox + Name + Actions */}
                    <div className="flex items-start justify-between gap-2">
                      <label
                        onClick={() => handleToggleVariantCheckbox(cs.id)}
                        className="flex items-start gap-3 cursor-pointer select-none flex-1 min-w-0"
                      >
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-all shrink-0 mt-0.5 ${
                            isConnected
                              ? 'bg-purple-700 border-purple-700 text-white'
                              : 'bg-white border-slate-300 text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-black text-slate-900 truncate">
                            {cs.name}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                            <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-900 font-mono font-bold">
                              {cs.sizeLabel || 'Аудиофайл'}
                            </span>
                            <span>Добавлен: {cs.createdAt}</span>
                          </div>
                        </div>
                      </label>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handlePlayPreview(cs.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border transition-all cursor-pointer ${
                            isPlaying
                              ? 'bg-purple-700 text-white border-purple-700 scale-95'
                              : 'bg-white hover:bg-purple-100 text-purple-900 border-purple-200 shadow-2xs'
                          }`}
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{isPlaying ? 'Звучит...' : 'Прослушать'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomSound(cs.id, cs.name)}
                          className="p-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                          title="Удалить этот звук"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Assign to category buttons */}
                  <div className="pt-2 border-t border-purple-100/70 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">
                      Назначить эту музыку для:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          handleAssignCategoryVariant('normalSoundVariant', cs.id)
                        }
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                          isForNormal
                            ? 'bg-purple-700 text-white border-purple-700 shadow-2xs'
                            : 'bg-white hover:bg-purple-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded-xs flex items-center justify-center border ${
                            isForNormal
                              ? 'bg-white text-purple-700 border-white'
                              : 'border-slate-300'
                          }`}
                        >
                          {isForNormal && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span>Новые заявки</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleAssignCategoryVariant('urgentSoundVariant', cs.id)
                        }
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                          isForUrgent
                            ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                            : 'bg-white hover:bg-rose-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded-xs flex items-center justify-center border ${
                            isForUrgent
                              ? 'bg-white text-rose-700 border-white'
                              : 'border-slate-300'
                          }`}
                        >
                          {isForUrgent && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span>Срочные</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleAssignCategoryVariant('statusSoundVariant', cs.id)
                        }
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                          isForStatus
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-white hover:bg-indigo-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded-xs flex items-center justify-center border ${
                            isForStatus
                              ? 'bg-white text-indigo-700 border-white'
                              : 'border-slate-300'
                          }`}
                        >
                          {isForStatus && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span>Смена статуса</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleAssignCategoryVariant('messageSoundVariant', cs.id)
                        }
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                          isForMessage
                            ? 'bg-sky-600 text-white border-sky-600 shadow-2xs'
                            : 'bg-white hover:bg-sky-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded-xs flex items-center justify-center border ${
                            isForMessage
                              ? 'bg-white text-sky-700 border-white'
                              : 'border-slate-300'
                          }`}
                        >
                          {isForMessage && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span>Сообщения</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleAssignCategoryVariant('taskSoundVariant', cs.id)
                        }
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                          isForTask
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-white hover:bg-emerald-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded-xs flex items-center justify-center border ${
                            isForTask
                              ? 'bg-white text-emerald-700 border-white'
                              : 'border-slate-300'
                          }`}
                        >
                          {isForTask && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span>Список дел</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
