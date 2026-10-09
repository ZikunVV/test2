export type SoundVariantId =
  | 'crystal_chime'
  | 'dispatcher_bell'
  | 'emergency_siren'
  | 'digital_pulse'
  | 'warm_marimba'
  | 'walkie_talkie'
  | 'aurora_chord'
  | 'strict_buzzer';

export type AlertEventType =
  | 'new_ticket'
  | 'urgent_ticket'
  | 'ticket_status'
  | 'new_message'
  | 'personal_task';

export interface SoundVariantOption {
  id: SoundVariantId;
  name: string;
  subtitle: string;
  description: string;
  recommendedFor: string;
  badgeColor: string;
  durationLabel: string;
}

export const SOUND_VARIANTS: SoundVariantOption[] = [
  {
    id: 'crystal_chime',
    name: 'Хрустальный перезвон',
    subtitle: 'Мягкий мелодичный аккорд',
    description: 'Чистый трёхтональный перезвон (До–Ми–Соль–До). Не утомляет при частых уведомлениях.',
    recommendedFor: 'Новые заявки и общие уведомления',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-200',
    durationLabel: '0.8 сек',
  },
  {
    id: 'dispatcher_bell',
    name: 'Диспетчерский колокольчик',
    subtitle: 'Классический двойной звонок',
    description: 'Звонкий двойной удар настольного колокольчика диспетчерской службы.',
    recommendedFor: 'Поступление новой заявки в работу',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
    durationLabel: '0.7 сек',
  },
  {
    id: 'emergency_siren',
    name: 'Аварийная сирена',
    subtitle: 'Тревожный двухтональный сигнал',
    description: 'Интенсивный перелив сирены повышенного внимания. Слышно даже в шумном помещении.',
    recommendedFor: 'Аварийные и срочные заявки',
    badgeColor: 'bg-rose-100 text-rose-900 border-rose-200',
    durationLabel: '1.2 сек',
  },
  {
    id: 'digital_pulse',
    name: 'Цифровой импульс',
    subtitle: 'Современный сигнал мессенджера',
    description: 'Короткий двойной электронный импульс с мягким затуханием.',
    recommendedFor: 'Сообщения администратору и ответы',
    badgeColor: 'bg-sky-100 text-sky-900 border-sky-200',
    durationLabel: '0.5 сек',
  },
  {
    id: 'warm_marimba',
    name: 'Мягкая маримба',
    subtitle: 'Тёплый деревянный тон',
    description: 'Приятное акустическое звучание деревянных клавиш для спокойной работы.',
    recommendedFor: 'Личный список дел и напоминания',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    durationLabel: '0.6 сек',
  },
  {
    id: 'walkie_talkie',
    name: 'Радиостанция (Рация)',
    subtitle: 'Сигнал вызова оперативной бригады',
    description: 'Характерный тройной писк рации перед началом связи мастера с диспетчером.',
    recommendedFor: 'Смена статуса и отчёты сотрудников',
    badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-200',
    durationLabel: '0.6 сек',
  },
  {
    id: 'aurora_chord',
    name: 'Торжественный аккорд',
    subtitle: 'Восходящая мажорная фанфара',
    description: 'Яркий позитивный восходящий сигнал подтверждения и успешного выполнения.',
    recommendedFor: 'Выполненные работы и отчёты',
    badgeColor: 'bg-teal-100 text-teal-900 border-teal-200',
    durationLabel: '0.9 сек',
  },
  {
    id: 'strict_buzzer',
    name: 'Строгий зуммер',
    subtitle: 'Резкий прерывистый сигнал',
    description: 'Контрастный трёхкратный зуммер для ситуаций, требующих немедленной реакции.',
    recommendedFor: 'Критические заявки и срочные вызовы',
    badgeColor: 'bg-orange-100 text-orange-900 border-orange-200',
    durationLabel: '1.0 сек',
  },
];

export interface UserSoundSettings {
  masterEnabled: boolean;
  volume: number; // 0..100
  // Галочки типов событий и оповещений:
  enableNewTicket: boolean;
  enableUrgentTicket: boolean;
  enableTicketStatus: boolean;
  enableNewMessage: boolean;
  enablePersonalTask: boolean;
  enableVisualBanner: boolean;
  enableVoiceAnnounce: boolean;
  enableBrowserPush: boolean;
  enableVibration: boolean;
  // Подключенные галочками варианты звуков:
  enabledVariants: SoundVariantId[];
  // Привязка вариантов звуков к категориям событий:
  normalSoundVariant: SoundVariantId;
  urgentSoundVariant: SoundVariantId;
  statusSoundVariant: SoundVariantId;
  messageSoundVariant: SoundVariantId;
  taskSoundVariant: SoundVariantId;
}

export const DEFAULT_SOUND_SETTINGS: UserSoundSettings = {
  masterEnabled: true,
  volume: 80,
  enableNewTicket: true,
  enableUrgentTicket: true,
  enableTicketStatus: true,
  enableNewMessage: true,
  enablePersonalTask: true,
  enableVisualBanner: true,
  enableVoiceAnnounce: false,
  enableBrowserPush: false,
  enableVibration: true,
  enabledVariants: [
    'crystal_chime',
    'emergency_siren',
    'digital_pulse',
    'warm_marimba',
  ],
  normalSoundVariant: 'crystal_chime',
  urgentSoundVariant: 'emergency_siren',
  statusSoundVariant: 'walkie_talkie',
  messageSoundVariant: 'digital_pulse',
  taskSoundVariant: 'warm_marimba',
};

export function loadUserSoundSettings(userId?: number): UserSoundSettings {
  const key = `app_sound_settings_user_${userId || 1}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SOUND_SETTINGS,
        ...parsed,
        enabledVariants:
          Array.isArray(parsed.enabledVariants) && parsed.enabledVariants.length > 0
            ? parsed.enabledVariants
            : DEFAULT_SOUND_SETTINGS.enabledVariants,
      };
    }
  } catch (e) {}
  return DEFAULT_SOUND_SETTINGS;
}

export function saveUserSoundSettings(
  userId: number | undefined,
  settings: UserSoundSettings
): void {
  const key = `app_sound_settings_user_${userId || 1}`;
  try {
    localStorage.setItem(key, JSON.stringify(settings));
  } catch (e) {}
}

let sharedAudioCtx: AudioContext | null = null;
let activeReminderLoopTimer: ReturnType<typeof setInterval> | null = null;
let activeReminderStopTimeout: ReturnType<typeof setTimeout> | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

/**
 * Разблокирует аудио-движок на мобильных браузерах (iOS Safari / Android Chrome)
 * при нажатии на кнопку микрофона или быструю кнопку напоминания.
 */
export function unlockMobileAudio(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch (e) {}
}

/**
 * Останавливает текущий 5-секундный сигнал напоминания, если он играет
 */
export function stopReminderAlarmSound(): void {
  if (activeReminderLoopTimer) {
    clearInterval(activeReminderLoopTimer);
    activeReminderLoopTimer = null;
  }
  if (activeReminderStopTimeout) {
    clearTimeout(activeReminderStopTimeout);
    activeReminderStopTimeout = null;
  }
}

/**
 * Проигрывает громкий 5-секундный сигнал напоминания (для мобильных телефонов и ПК),
 * чтобы его было отчётливо слышно даже из кармана или на громкой связи.
 */
export function playReminderAlarm5Seconds(
  variantId: SoundVariantId = 'dispatcher_bell',
  volumePercent: number = 100
): void {
  stopReminderAlarmSound();
  const boostedVolume = Math.max(85, volumePercent);

  // Сразу запускаем первый цикл мелодии + усиливающий звонок будильника
  playSoundVariant(variantId, boostedVolume, true);

  let elapsedMs = 0;
  const intervalMs = 1000;

  activeReminderLoopTimer = setInterval(() => {
    elapsedMs += intervalMs;
    if (elapsedMs >= 5000) {
      stopReminderAlarmSound();
      return;
    }
    playSoundVariant(variantId, boostedVolume, true);
  }, intervalMs);

  activeReminderStopTimeout = setTimeout(() => {
    stopReminderAlarmSound();
  }, 5100);
}

/**
 * Проигрывает выбранный вариант звука через Web Audio API.
 * Если передан флаг isLoudBoost (для напоминаний на телефоне), используется максимальное усиление с компрессором.
 */
export function playSoundVariant(
  variantId: SoundVariantId,
  volumePercent: number = 80,
  isLoudBoost: boolean = false
): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Увеличенная громкость для динамика телефона (с динамическим компрессором без искажений)
  const normalizedVol = Math.max(0.1, Math.min(1, volumePercent / 100));
  const gainScale = isLoudBoost ? Math.max(0.85, normalizedVol * 0.98) : normalizedVol * 0.78;
  const now = ctx.currentTime;

  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-14, now);
  compressor.knee.setValueAtTime(12, now);
  compressor.ratio.setValueAtTime(6, now);
  compressor.attack.setValueAtTime(0.002, now);
  compressor.release.setValueAtTime(0.15, now);
  compressor.connect(ctx.destination);

  const playTone = (
    freq: number,
    startTime: number,
    duration: number,
    type: OscillatorType = 'sine',
    peakGain: number = gainScale,
    endFreq?: number
  ) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    if (endFreq) {
      osc.frequency.linearRampToValueAtTime(endFreq, startTime + duration);
    }

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(peakGain, startTime + Math.min(0.02, duration * 0.15));
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(compressor);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);

    // Для громкого режима на телефоне добавляем гармонику в средне-высоком диапазоне (1.5-2.5 кГц),
    // который лучше всего воспроизводится динамиком смартфона
    if (isLoudBoost) {
      const overtone = ctx.createOscillator();
      const overtoneGain = ctx.createGain();
      overtone.type = 'triangle';
      overtone.frequency.setValueAtTime(freq * 2, startTime);
      if (endFreq) {
        overtone.frequency.linearRampToValueAtTime(endFreq * 2, startTime + duration);
      }
      overtoneGain.gain.setValueAtTime(0.0001, startTime);
      overtoneGain.gain.linearRampToValueAtTime(peakGain * 0.55, startTime + Math.min(0.02, duration * 0.15));
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      overtone.connect(overtoneGain);
      overtoneGain.connect(compressor);
      overtone.start(startTime);
      overtone.stop(startTime + duration + 0.02);
    }
  };

  switch (variantId) {
    case 'crystal_chime': {
      // C5 -> E5 -> G5 -> C6
      playTone(523.25, now, 0.25, 'sine', gainScale);
      playTone(659.25, now + 0.12, 0.28, 'sine', gainScale);
      playTone(783.99, now + 0.24, 0.32, 'sine', gainScale);
      playTone(1046.5, now + 0.36, 0.48, 'triangle', gainScale * 0.9);
      break;
    }

    case 'dispatcher_bell': {
      // Двойной удар колокольчика с обертоном
      playTone(880, now, 0.3, 'triangle', gainScale);
      playTone(1760, now, 0.18, 'sine', gainScale * 0.5);
      playTone(880, now + 0.26, 0.42, 'triangle', gainScale);
      playTone(1760, now + 0.26, 0.25, 'sine', gainScale * 0.5);
      break;
    }

    case 'emergency_siren': {
      // Тревожная двухтональная сирена
      playTone(620, now, 0.28, 'sawtooth', gainScale * 0.85, 920);
      playTone(920, now + 0.28, 0.28, 'sawtooth', gainScale * 0.85, 620);
      playTone(620, now + 0.56, 0.28, 'sawtooth', gainScale * 0.85, 920);
      playTone(920, now + 0.84, 0.32, 'sawtooth', gainScale * 0.85, 620);
      break;
    }

    case 'digital_pulse': {
      // Современный мессенджер: два чистых электронных импульса
      playTone(740, now, 0.14, 'sine', gainScale);
      playTone(1108.73, now + 0.15, 0.28, 'sine', gainScale);
      break;
    }

    case 'warm_marimba': {
      // Деревянная маримба: D5 -> A5 -> F#5
      playTone(587.33, now, 0.18, 'sine', gainScale * 1.1);
      playTone(440.0, now + 0.14, 0.18, 'sine', gainScale * 0.9);
      playTone(880.0, now + 0.28, 0.32, 'triangle', gainScale);
      break;
    }

    case 'walkie_talkie': {
      // Рация: 3 коротких высокочастотных бипа
      playTone(1567.98, now, 0.09, 'square', gainScale * 0.55);
      playTone(1567.98, now + 0.13, 0.09, 'square', gainScale * 0.55);
      playTone(1975.53, now + 0.26, 0.16, 'square', gainScale * 0.6);
      break;
    }

    case 'aurora_chord': {
      // Восходящая фанфара: F4 -> A4 -> C5 -> F5
      playTone(349.23, now, 0.18, 'triangle', gainScale * 0.9);
      playTone(440.0, now + 0.12, 0.2, 'triangle', gainScale * 0.9);
      playTone(523.25, now + 0.24, 0.22, 'triangle', gainScale * 0.95);
      playTone(698.46, now + 0.36, 0.5, 'triangle', gainScale);
      break;
    }

    case 'strict_buzzer': {
      // Прерывистый строгий зуммер
      playTone(440, now, 0.2, 'sawtooth', gainScale * 0.8);
      playTone(440, now + 0.28, 0.2, 'sawtooth', gainScale * 0.8);
      playTone(554.37, now + 0.56, 0.32, 'sawtooth', gainScale * 0.9);
      break;
    }
  }
}

/**
 * Голосовое озвучивание текста через встроенный синтезатор речи браузера
 */
export function speakAlertText(text: string, volumePercent: number = 80): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = 1.05;
    utterance.volume = Math.max(0.1, Math.min(1, volumePercent / 100));
    window.speechSynthesis.speak(utterance);
  } catch (e) {}
}

/**
 * Вибрация на смартфоне (при напоминании — интенсивная серия на 5 секунд)
 */
export function triggerDeviceVibration(isUrgent: boolean = false, isFiveSecReminder: boolean = false): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (isFiveSecReminder) {
        navigator.vibrate([
          400, 150, 400, 150, 400, 200,
          400, 150, 400, 150, 400, 200,
          400, 150, 500
        ]);
      } else {
        navigator.vibrate(isUrgent ? [250, 100, 250, 100, 350] : [180, 80, 180]);
      }
    } catch (e) {}
  }
}

/**
 * Отправка системного браузерного уведомления (работает и через Service Worker на телефоне в фоне)
 */
export function sendBrowserNotification(title: string, body: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  try {
    if (Notification.permission === 'granted') {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then((reg) => {
          if (reg && reg.showNotification) {
            reg
              .showNotification(title, {
                body,
                icon: '/pwa-192x192.png',
                badge: '/pwa-192x192.png',
                vibrate: [250, 100, 250, 100, 350],
                requireInteraction: true,
                tag: `wf-alert-${Date.now()}`,
              } as NotificationOptions)
              .catch(() => {
                new Notification(title, { body });
              });
          } else {
            new Notification(title, { body });
          }
        });
      } else {
        new Notification(title, { body });
      }
    }
  } catch (e) {}
}

let backgroundKeepAliveOsc: OscillatorNode | null = null;
let backgroundKeepAliveGain: GainNode | null = null;
let wakeLockSentinel: any = null;

/**
 * Включает бесшумный фоновый аудио-канал и WakeLock, чтобы браузер не «усыплял» вкладку,
 * когда пользователь свернул её в фоновый режим или открыл отдельную дежурную вкладку.
 */
export function setBackgroundKeepAliveActive(active: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (active) {
      const ctx = getAudioContext();
      if (ctx && !backgroundKeepAliveOsc) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1, ctx.currentTime); // 1 Гц (неслышимая частота)
        gain.gain.setValueAtTime(0.00001, ctx.currentTime); // практически нулевая амплитуда
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        backgroundKeepAliveOsc = osc;
        backgroundKeepAliveGain = gain;
      }
      if ('wakeLock' in navigator && !wakeLockSentinel) {
        (navigator as any).wakeLock
          .request('screen')
          .then((sentinel: any) => {
            wakeLockSentinel = sentinel;
            sentinel.addEventListener('release', () => {
              wakeLockSentinel = null;
            });
          })
          .catch(() => {});
      }
    } else {
      if (backgroundKeepAliveOsc) {
        try {
          backgroundKeepAliveOsc.stop();
          backgroundKeepAliveOsc.disconnect();
        } catch (e) {}
        backgroundKeepAliveOsc = null;
      }
      if (backgroundKeepAliveGain) {
        try {
          backgroundKeepAliveGain.disconnect();
        } catch (e) {}
        backgroundKeepAliveGain = null;
      }
      if (wakeLockSentinel) {
        try {
          wakeLockSentinel.release();
        } catch (e) {}
        wakeLockSentinel = null;
      }
    }
  } catch (e) {}
}

