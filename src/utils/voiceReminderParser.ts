export interface ParsedVoiceReminder {
  isReminder: boolean;
  reminderAtIso: string;
  taskDateIso: string;
  timeLabel: string;
  title: string;
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
  пятнадцать: 15,
  "п'ятнадцять": 15,
  двадцать: 20,
  двадцять: 20,
  тридцать: 30,
  тридцять: 30,
  сорок: 40,
  пятьдесят: 50,
  шестьдесят: 60,
};

function parseSpokenNumber(token: string): number | null {
  const clean = token.trim().toLowerCase();
  if (/^\d+$/.test(clean)) {
    return parseInt(clean, 10);
  }
  if (WORD_NUMBERS[clean] !== undefined) {
    return WORD_NUMBERS[clean];
  }
  return null;
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
 * Распознаёт голосовые фразы вида:
 * - «Напомни мне через два часа позвонить мастеру»
 * - «Напомни через 15 минут»
 * - «Напомни в 12 00 проверить подвал»
 * - «Напомни мне в 14:30»
 * - «Напомни завтра в 9 утра»
 * - «Напомни через полчаса»
 * - «Нагадати мені через 2 години»
 */
export function parseVoiceReminderCommand(rawText: string): ParsedVoiceReminder | null {
  const text = rawText.trim();
  if (!text) return null;

  const lower = text.toLowerCase();

  // Check if it starts with or contains reminder keywords
  const hasReminderKeyword =
    lower.includes('напомни') ||
    lower.includes('напоминание') ||
    lower.includes('напомнить') ||
    lower.includes('нагадай') ||
    lower.includes('нагадування') ||
    lower.includes('будильник') ||
    lower.includes('сигнал через') ||
    lower.includes('сигнал в ');

  if (!hasReminderKeyword) return null;

  const now = new Date();
  let targetDate: Date | null = null;
  let remainingText = text;

  // Strip leading reminder trigger words: "напомни мне", "напомни", "сделай напоминание", etc.
  remainingText = remainingText
    .replace(
      /^(?:пожалуйста\s+)?(?:сделай\s+|поставь\s+|установи\s+|создай\s+)?(?:звуковое\s+)?(?:напоминание|напомни|напомнить|нагадай|нагадування|будильник)(?:\s+мне|\s+мені)?\s*/i,
      ''
    )
    .trim();

  // Case 1: "через полчаса" / "через півгодини"
  const halfHourMatch = remainingText.match(/^(?:через\s+)?(?:полчаса|пол\s+часа|півгодини|пів\s+години)\b\s*(.*)/i);
  if (halfHourMatch) {
    targetDate = new Date(now.getTime() + 30 * 60 * 1000);
    remainingText = (halfHourMatch[1] || '').trim();
  }

  // Case 2: "через полтора часа"
  if (!targetDate) {
    const oneAndHalfMatch = remainingText.match(/^(?:через\s+)?(?:полтора\s+часа|півтори\s+години)\b\s*(.*)/i);
    if (oneAndHalfMatch) {
      targetDate = new Date(now.getTime() + 90 * 60 * 1000);
      remainingText = (oneAndHalfMatch[1] || '').trim();
    }
  }

  // Case 3: "через [N] (часов|часа|час|минут|минуты|минуту|секунд)" or "через час" / "через минуту"
  if (!targetDate) {
    const relativeMatch = remainingText.match(
      /^через\s+(?:(\d+|один|одну|одна|два|две|три|четыре|чотири|пять|п'ять|шесть|шість|семь|сім|восемь|вісім|девять|дев'ять|десять|одиннадцать|двенадцать|пятнадцать|двадцать|тридцать|сорок|пятьдесят|шестьдесят)\s+)?(час(?:а|ов)?|годин(?:у|и)?|минут(?:у|ы)?|хвилин(?:у|и)?|секунд(?:у|ы)?)\b\s*(.*)/i
    );
    if (relativeMatch) {
      const numToken = relativeMatch[1];
      const unitToken = relativeMatch[2].toLowerCase();
      const amount = numToken ? parseSpokenNumber(numToken) || 1 : 1;

      let deltaMs = 0;
      if (unitToken.startsWith('час') || unitToken.startsWith('годин')) {
        deltaMs = amount * 60 * 60 * 1000;
      } else if (unitToken.startsWith('мин') || unitToken.startsWith('хвил')) {
        deltaMs = amount * 60 * 1000;
      } else if (unitToken.startsWith('сек')) {
        deltaMs = amount * 1000;
      }

      if (deltaMs > 0) {
        targetDate = new Date(now.getTime() + deltaMs);
        remainingText = (relativeMatch[3] || '').trim();
      }
    }
  }

  // Case 4: "(завтра | сегодня )? в HH:MM" or "в HH MM" or "в HH часов (MM минут)?"
  if (!targetDate) {
    const absoluteMatch = remainingText.match(
      /^(?:(сегодня|сьогодні|завтра)\s+)?(?:в|о|на)\s*(\d{1,2}|один|два|три|четыре|пять|шесть|семь|восемь|девять|десять|одиннадцать|двенадцать)(?:[:.\s-](\d{1,2}|ноль\s*ноль|00|тридцать|пятнадцать|сорок\s*пять))?(?:\s*(?:час(?:а|ов)?|годин(?:и|у)?|утра|вечера|дня|ночи))?\b\s*(.*)/i
    );

    if (absoluteMatch) {
      const dayModifier = (absoluteMatch[1] || '').toLowerCase();
      const rawHour = absoluteMatch[2];
      const rawMin = absoluteMatch[3];
      const tail = (absoluteMatch[4] || '').trim();

      let hours = parseSpokenNumber(rawHour);
      let minutes = 0;
      if (rawMin) {
        if (/ноль/i.test(rawMin)) {
          minutes = 0;
        } else if (/сорок\s*пять/i.test(rawMin)) {
          minutes = 45;
        } else {
          minutes = parseSpokenNumber(rawMin) || 0;
        }
      }

      if (hours !== null && hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        // Adjust if user said "в 2 часа дня" / "в 7 вечера"
        if (hours < 12 && /\b(?:дня|вечера)\b/i.test(remainingText)) {
          hours += 12;
        }

        const candidate = new Date(now);
        candidate.setHours(hours, minutes, 0, 0);

        if (dayModifier === 'завтра') {
          candidate.setDate(candidate.getDate() + 1);
        } else if (dayModifier !== 'сегодня' && dayModifier !== 'сьогодні') {
          // If time has already passed today by more than 1 minute, schedule for tomorrow
          if (candidate.getTime() <= now.getTime() - 60 * 1000) {
            candidate.setDate(candidate.getDate() + 1);
          }
        }

        targetDate = candidate;
        remainingText = tail;
      }
    }
  }

  // Case 5: Relative or absolute time at the END of the phrase (e.g. "Напомни позвонить мастеру через 2 часа" or "Напомни сдать отчёт в 12 00")
  if (!targetDate) {
    const endRelativeMatch = remainingText.match(
      /^(.*?)\s+через\s+(?:(\d+|один|одну|одна|два|две|три|четыре|чотири|пять|шесть|семь|восемь|девять|десять|пятнадцать|двадцать|тридцать|сорок|пятьдесят)\s+)?(полчаса|час(?:а|ов)?|годин(?:у|и)?|минут(?:у|ы)?|хвилин(?:у|и)?|секунд(?:у|ы)?)$/i
    );
    if (endRelativeMatch) {
      const taskPart = endRelativeMatch[1].trim();
      const numToken = endRelativeMatch[2];
      const unitToken = endRelativeMatch[3].toLowerCase();

      if (unitToken === 'полчаса') {
        targetDate = new Date(now.getTime() + 30 * 60 * 1000);
      } else {
        const amount = numToken ? parseSpokenNumber(numToken) || 1 : 1;
        let deltaMs = 0;
        if (unitToken.startsWith('час') || unitToken.startsWith('годин')) {
          deltaMs = amount * 60 * 60 * 1000;
        } else if (unitToken.startsWith('мин') || unitToken.startsWith('хвил')) {
          deltaMs = amount * 60 * 1000;
        } else if (unitToken.startsWith('сек')) {
          deltaMs = amount * 1000;
        }
        if (deltaMs > 0) {
          targetDate = new Date(now.getTime() + deltaMs);
        }
      }
      if (targetDate && taskPart) {
        remainingText = taskPart;
      }
    }
  }

  if (!targetDate) {
    const endAbsoluteMatch = remainingText.match(
      /^(.*?)\s+(?:(сегодня|завтра)\s+)?(?:в|на)\s+(\d{1,2})(?:[:.\s-](\d{2}))?(?:\s*(?:час(?:а|ов)?|утра|вечера|дня))?$/i
    );
    if (endAbsoluteMatch) {
      const taskPart = endAbsoluteMatch[1].trim();
      const dayMod = (endAbsoluteMatch[2] || '').toLowerCase();
      const hh = parseInt(endAbsoluteMatch[3], 10);
      const mm = endAbsoluteMatch[4] ? parseInt(endAbsoluteMatch[4], 10) : 0;

      if (hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) {
        const candidate = new Date(now);
        candidate.setHours(hh, mm, 0, 0);
        if (dayMod === 'завтра' || candidate.getTime() <= now.getTime() - 60 * 1000) {
          candidate.setDate(candidate.getDate() + 1);
        }
        targetDate = candidate;
        if (taskPart) {
          remainingText = taskPart;
        }
      }
    }
  }

  // If user just said "Напомни мне проверить насос" without explicit time, default to +1 hour
  if (!targetDate) {
    targetDate = new Date(now.getTime() + 60 * 60 * 1000);
  }

  // Clean up remainingText (remove leading "о том что", "что нужно", "про то что", etc.)
  const cleanedTitle = remainingText
    .replace(/^(?:мне\s+|мені\s+)?(?:о\s+том\s+что(?:бы)?|что\s+нужно|что\s+надо|чтобы|что|про\s+то\s+что|про)\s+/i, '')
    .trim();

  const finalTitle =
    cleanedTitle.length > 0
      ? cleanedTitle.charAt(0).toUpperCase() + cleanedTitle.slice(1)
      : 'Голосовое напоминание';

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
  };
}
