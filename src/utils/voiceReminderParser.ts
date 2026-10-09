export interface ParsedVoiceReminder {
  isReminder: boolean;
  reminderAtIso: string;
  taskDateIso: string;
  timeLabel: string;
  title: string;
  rawTargetDate: Date;
}

const WORD_NUMBERS: Record<string, number> = {
  один: 1,
  одну: 1,
  одна: 1,
  одно: 1,
  два: 2,
  две: 2,
  три: 3,
  четыре: 4,
  чотири: 4,
  пять: 5,
  "п'ять": 5,
  шесть: 6,
  шість: 6,
  семь: 7,
  сім: 7,
  восемь: 8,
  вісім: 8,
  девять: 9,
  "дев'ять": 9,
  десять: 10,
  одиннадцать: 11,
  одинадцять: 11,
  двенадцать: 12,
  дванадцять: 12,
  тринадцать: 13,
  тринадцять: 13,
  четырнадцать: 14,
  чотирнадцять: 14,
  пятнадцать: 15,
  "п'ятнадцять": 15,
  шестнадцать: 16,
  шістнадцять: 16,
  семнадцать: 17,
  сімнадцять: 17,
  восемнадцать: 18,
  вісімнадцять: 18,
  девятнадцать: 19,
  "дев'ятнадцять": 19,
  двадцать: 20,
  двадцять: 20,
  тридцать: 30,
  тридцять: 30,
  сорок: 40,
  пятьдесят: 50,
  "п'ятдесят": 50,
  шестьдесят: 60,
  шістдесят: 60,
};

function parseSpokenNumberTokens(raw: string): number | null {
  const clean = raw
    .trim()
    .toLowerCase()
    .replace(/[.,!?]/g, '');
  if (!clean) return null;

  if (/^\d+$/.test(clean)) {
    return parseInt(clean, 10);
  }

  // Handle compound spoken numbers like "двадцать пять", "тридцать пять", "сорок пять"
  const parts = clean.split(/\s+/);
  let sum = 0;
  let matchedAny = false;
  for (const part of parts) {
    if (/^\d+$/.test(part)) {
      sum += parseInt(part, 10);
      matchedAny = true;
    } else if (WORD_NUMBERS[part] !== undefined) {
      sum += WORD_NUMBERS[part];
      matchedAny = true;
    } else {
      return null;
    }
  }
  return matchedAny ? sum : null;
}

function formatDateIso(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatTimeHHMM(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${min}`;
}

/**
 * Распознаёт голосовые фразы с временем в любом падеже и порядке слов (UTF-8 Кириллица):
 * - «Напомнить через 15 минут»
 * - «Напомни мне через два часа позвонить мастеру»
 * - «Через 15 минут проверить кран»
 * - «Напомни в 12 00 проверить подвал»
 * - «Напомни мне в 14:30»
 * - «Напомни завтра в 9 утра»
 * - «Напомни через полчаса»
 * - «Через 5 минут»
 */
export function parseVoiceReminderCommand(
  rawText: string,
  forceAssumeReminder: boolean = false
): ParsedVoiceReminder | null {
  const text = rawText.trim().replace(/\s+/g, ' ');
  if (!text) return null;

  // Check if it contains reminder keywords OR explicit time expressions like "через 15 минут"
  const hasReminderKeyword = /(?:напомн|напомин|нагад|будильник|сигнал)/i.test(text);
  const hasExplicitRelativeTime =
    /(?:^|\s)через\s+(?:полчаса|пол\s+часа|півгодини|полтора\s+часа|півтори\s+години|(?:\d+|[а-яёіїєґ']+(?:\s+[а-яёіїєґ']+)?)\s*(?:час|годин|мин|хвил|сек)|(?:час|годин|мин|хвил|сек))/i.test(
      text
    );
  const hasExplicitAbsoluteTime =
    /(?:^|\s)(?:в|о|на)\s*(?:\d{1,2}[:.\s-]\d{2}|\d{1,2}\s*(?:час|годин|утра|вечера|дня|ночи))/i.test(
      text
    );

  if (!forceAssumeReminder && !hasReminderKeyword && !hasExplicitRelativeTime && !hasExplicitAbsoluteTime) {
    return null;
  }

  const now = new Date();
  let targetDate: Date | null = null;

  // Strip all leading reminder trigger phrases ("Напомни мне", "Напомнить", "Напомни пожалуйста", etc.)
  // Using (?:^|\s) instead of \b because \b in JS RegExp does NOT work with Cyrillic characters!
  let remainingText = text
    .replace(
      /^(?:пожалуйста\s+|будь\s+ласка\s+)?(?:сделай\s+|поставь\s+|установи\s+|создай\s+|включи\s+)?(?:звуковое\s+|голосовое\s+)?(?:напоминание|напомнить|напомни|нагадай|нагадати|нагадування|будильник|сигнал)(?:\s+мне|\s+мені)?(?:\s+пожалуйста|\s+будь\s+ласка)?\s*/i,
      ''
    )
    .trim();

  // If the user repeated "напомни / напомнить" (e.g. when "Напомни " was prepended to "напомнить через 15 минут")
  remainingText = remainingText
    .replace(
      /^(?:напоминание|напомнить|напомни|нагадай|нагадати|нагадування|будильник|сигнал)(?:\s+мне|\s+мені)?\s*/i,
      ''
    )
    .trim();

  // 1. Check "через полчаса" / "через півгодини" anywhere in the phrase
  const halfHourRegex = /(?:^|\s)(?:через\s+)?(полчаса|пол\s+часа|півгодини|пів\s+години)(?=\s|$|[.,!?])/i;
  const halfHourMatch = remainingText.match(halfHourRegex);
  if (halfHourMatch) {
    targetDate = new Date(now.getTime() + 30 * 60 * 1000);
    remainingText = remainingText.replace(halfHourRegex, ' ').trim();
  }

  // 2. Check "через полтора часа" / "через півтори години"
  if (!targetDate) {
    const oneHalfRegex = /(?:^|\s)(?:через\s+)?(полтора\s+часа|півтори\s+години)(?=\s|$|[.,!?])/i;
    const oneHalfMatch = remainingText.match(oneHalfRegex);
    if (oneHalfMatch) {
      targetDate = new Date(now.getTime() + 90 * 60 * 1000);
      remainingText = remainingText.replace(oneHalfRegex, ' ').trim();
    }
  }

  // 3. Check "через [число] (минут|минуты|минуту|мин|часов|часа|час|секунд)" OR "через час / через минуту"
  // Note: No \b used around Cyrillic!
  if (!targetDate) {
    const relativeRegex =
      /(?:^|\s)через\s+(?:(\d+|[а-яёіїєґ']+(?:\s+[а-яёіїєґ']+)?)\s+)?(час(?:а|ов)?|годин(?:у|и)?|минут(?:у|ы)?|мин\.?|хвилин(?:у|и)?|хв\.?|секунд(?:у|ы)?|сек\.?)(?=\s|$|[.,!?])/i;
    const relMatch = remainingText.match(relativeRegex);
    if (relMatch) {
      const rawNum = relMatch[1];
      const rawUnit = relMatch[2].toLowerCase();
      let amount = 1;
      if (rawNum) {
        const parsed = parseSpokenNumberTokens(rawNum);
        if (parsed !== null && parsed > 0) {
          amount = parsed;
        }
      }

      let deltaMs = 0;
      if (rawUnit.startsWith('час') || rawUnit.startsWith('годин')) {
        deltaMs = amount * 60 * 60 * 1000;
      } else if (rawUnit.startsWith('мин') || rawUnit.startsWith('хв')) {
        deltaMs = amount * 60 * 1000;
      } else if (rawUnit.startsWith('сек')) {
        deltaMs = amount * 1000;
      }

      if (deltaMs > 0) {
        targetDate = new Date(now.getTime() + deltaMs);
        remainingText = remainingText.replace(relativeRegex, ' ').trim();
      }
    }
  }

  // 4. Also handle if user said just "15 минут" or "2 часа" without the word "через" (e.g. "Напомнить 15 минут")
  if (!targetDate) {
    const bareRelativeRegex =
      /^(?:на\s+)?(\d+|[а-яёіїєґ']+)\s+(час(?:а|ов)?|годин(?:у|и)?|минут(?:у|ы)?|мин\.?|хвилин(?:у|и)?|секунд(?:у|ы)?)(?=\s|$|[.,!?])/i;
    const bareMatch = remainingText.match(bareRelativeRegex);
    if (bareMatch) {
      const parsed = parseSpokenNumberTokens(bareMatch[1]);
      const rawUnit = bareMatch[2].toLowerCase();
      if (parsed !== null && parsed > 0) {
        let deltaMs = 0;
        if (rawUnit.startsWith('час') || rawUnit.startsWith('годин')) {
          deltaMs = parsed * 60 * 60 * 1000;
        } else if (rawUnit.startsWith('мин') || rawUnit.startsWith('хв')) {
          deltaMs = parsed * 60 * 1000;
        } else if (rawUnit.startsWith('сек')) {
          deltaMs = parsed * 1000;
        }
        if (deltaMs > 0) {
          targetDate = new Date(now.getTime() + deltaMs);
          remainingText = remainingText.replace(bareRelativeRegex, ' ').trim();
        }
      }
    }
  }

  // 5. Check absolute time: "(сегодня|завтра)? (в|о|на) HH:MM" or "в HH MM" or "в HH часов"
  if (!targetDate) {
    const absRegex =
      /(?:^|\s)(?:(сегодня|сьогодні|завтра)\s+)?(?:в|о|на)\s*(\d{1,2}|один|два|три|четыре|чотири|пять|п'ять|шесть|шість|семь|сім|восемь|вісім|девять|дев'ять|десять|одиннадцать|одинадцять|двенадцать|дванадцять)(?:[:.\s-](\d{1,2}|00|ноль\s*ноль|нуль\s*нуль|пятнадцать|тридцать|сорок\s*пять))?(?:\s*(?:час(?:а|ов)?|годин(?:и|у)?|утра|вечера|дня|ночи))?(?=\s|$|[.,!?])/i;
    const absMatch = remainingText.match(absRegex);
    if (absMatch) {
      const dayMod = (absMatch[1] || '').toLowerCase();
      const rawHour = absMatch[2];
      const rawMin = absMatch[3];

      let hours = parseSpokenNumberTokens(rawHour);
      let minutes = 0;
      if (rawMin) {
        if (/ноль|нуль/i.test(rawMin)) {
          minutes = 0;
        } else {
          minutes = parseSpokenNumberTokens(rawMin) || 0;
        }
      }

      if (hours !== null && hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        if (hours < 12 && /(?:дня|вечера)/i.test(absMatch[0])) {
          hours += 12;
        }
        const candidate = new Date(now);
        candidate.setHours(hours, minutes, 0, 0);

        if (dayMod === 'завтра') {
          candidate.setDate(candidate.getDate() + 1);
        } else if (dayMod !== 'сегодня' && dayMod !== 'сьогодні') {
          if (candidate.getTime() <= now.getTime() - 60 * 1000) {
            candidate.setDate(candidate.getDate() + 1);
          }
        }

        targetDate = candidate;
        remainingText = remainingText.replace(absRegex, ' ').trim();
      }
    }
  }

  // If no explicit time was matched, only default to +15 minutes if reminder keyword was explicitly spoken
  if (!targetDate) {
    if (!hasReminderKeyword && !forceAssumeReminder) {
      return null;
    }
    targetDate = new Date(now.getTime() + 15 * 60 * 1000);
  }

  // Clean up remainingText
  const cleanedTitle = remainingText
    .replace(/\s+/g, ' ')
    .replace(
      /^(?:мне\s+|мені\s+)?(?:о\s+том\s+что(?:бы)?|что\s+нужно|что\s+надо|чтобы|что|про\s+то\s+что|про)\s+/i,
      ''
    )
    .replace(/^[.,!?;:\-\s]+|[.,!?;:\-\s]+$/g, '')
    .trim();

  // Compute human-friendly relative description for default title if user didn't specify a custom subject
  const diffMin = Math.max(1, Math.round((targetDate.getTime() - now.getTime()) / 60000));
  const defaultTitle =
    diffMin < 60
      ? `Напоминание (через ${diffMin} мин.)`
      : `Напоминание на ${formatTimeHHMM(targetDate)}`;

  const finalTitle =
    cleanedTitle.length > 0
      ? cleanedTitle.charAt(0).toUpperCase() + cleanedTitle.slice(1)
      : defaultTitle;

  const taskDateIso = formatDateIso(targetDate);
  const todayIso = formatDateIso(now);
  const timeHHMM = formatTimeHHMM(targetDate);

  const timeLabel =
    taskDateIso === todayIso ? `Сегодня в ${timeHHMM}` : `${taskDateIso} в ${timeHHMM}`;

  return {
    isReminder: true,
    reminderAtIso: targetDate.toISOString(),
    taskDateIso,
    timeLabel,
    title: finalTitle,
    rawTargetDate: targetDate,
  };
}

/**
 * Генерирует ссылку для добавления напоминания в системный Календарь телефона (Android / iOS),
 * который прозвонит даже если браузер и сайт полностью закрыты.
 */
export function buildGoogleCalendarReminderUrl(title: string, targetDate: Date): string {
  const start = new Date(targetDate.getTime());
  const end = new Date(targetDate.getTime() + 15 * 60 * 1000);

  const toCalUtc = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `🔔 WORKFLOW: ${title}`,
    details: 'Голосовое напоминание из диспетчерской системы WORKFLOW ЖКХ',
    dates: `${toCalUtc(start)}/${toCalUtc(end)}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Скачивает .ics файл будильника/события для встроенного календаря iPhone / Android
 */
export function downloadIcsReminderFile(title: string, targetDate: Date): void {
  const start = new Date(targetDate.getTime());
  const end = new Date(targetDate.getTime() + 15 * 60 * 1000);

  const toCalUtc = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//WORKFLOW ЖКХ//Voice Reminder//RU',
    'BEGIN:VEVENT',
    `UID:wf-rem-${Date.now()}@workflow.app`,
    `DTSTAMP:${toCalUtc(new Date())}`,
    `DTSTART:${toCalUtc(start)}`,
    `DTEND:${toCalUtc(end)}`,
    `SUMMARY:🔔 ${title}`,
    'DESCRIPTION:Звуковое напоминание WORKFLOW ЖКХ',
    'BEGIN:VALARM',
    'TRIGGER:-PT0M',
    'ACTION:DISPLAY',
    `DESCRIPTION:🔔 ${title}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `reminder-${formatTimeHHMM(targetDate).replace(':', '-')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
