import { Ticket } from '../types';

export interface SuggestionItem {
  id: string;
  type: 'sentence' | 'phrase' | 'word';
  text: string;
  category: string;
  score: number;
}

export type SuggestionContext = 'problem' | 'report' | 'materials' | 'work' | 'withdraw' | 'general';

// Pre-seeded professional vocabulary and phrases for Housing & Utility services (ЖКХ, аварийные службы)
const PRESEEDED_SUGGESTIONS: Record<SuggestionContext, { sentences: string[]; phrases: string[]; words: string[] }> = {
  problem: {
    sentences: [
      'Течь стояка холодного водоснабжения (ХВС).',
      'Течь стояка горячего водоснабжения (ГВС).',
      'Забита ливневая канализация, вода переливается на козырёк.',
      'Засор центрального канализационного стояка, затапливает подвал.',
      'Отсутствует отопление по стояку в жилых комнатах.',
      'Завоздушена система отопления, радиаторы холодные.',
      'Слабый напор воды на верхних этажах в часы пик.',
      'Протечка кровли во время дождя, мокнет потолок в подъезде.',
      'Искрит автоматический выключатель в этажном электрощитке.',
      'Нет освещения на лестничной клетке между этажами.',
      'Не работает доводчик входной двери, дверь хлопает.',
      'Заблокирован замок входной двери в подвальное помещение.',
      'Разбито стекло в оконной раме подъезда на лестничной площадке.',
      'Сильный запах канализации в подъезде и подвале.',
      'Шум и вибрация в насосной станции в подвале.',
      'Течь резьбового соединения перед прибором учёта (счётчиком).',
      'Течь радиатора отопления в квартире.',
      'Засор сифона под кухонной мойкой.',
      'Повреждение водосточной трубы на фасаде здания.',
      'Провисание электропроводки в техническом коридоре.',
      'Аварийный прорыв трубы отопления в подвальном помещении.',
      'Требуется замена перегоревших ламп освещения входа.',
    ],
    phrases: [
      'течь стояка ХВС',
      'течь стояка ГВС',
      'засор канализации',
      'забита ливнёвка',
      'нет отопления',
      'завоздушена система',
      'слабый напор воды',
      'протечка кровли',
      'искрит электрощит',
      'нет освещения',
      'не работает доводчик',
      'запах канализации',
      'замена ламп освещения',
      'прорыв трубы в подвале',
      'ремонт замка',
      'герметизация швов',
      'аварийное отключение',
    ],
    words: [
      'стояк',
      'водоснабжение',
      'канализация',
      'отопление',
      'протечка',
      'засор',
      'ливнёвка',
      'радиатор',
      'вентиль',
      'кран',
      'подвал',
      'кровля',
      'подъезд',
      'электрощитовая',
      'освещение',
      'проводка',
      'автомат',
      'доводчик',
      'замок',
      'насос',
      'давление',
      'герметизация',
      'опрессовка',
      'фитинг',
      'муфта',
      'трубопровод',
      'водосток',
      'перекрытие',
      'фасад',
      'счётчик',
    ],
  },
  report: {
    sentences: [
      'Работы выполнены в полном объёме, система запущена в штатном режиме.',
      'Устранена течь на резьбовом соединении стояка ХВС с заменой уплотнителей.',
      'Устранена течь на резьбовом соединении стояка ГВС с заменой уплотнителей.',
      'Произведена замена повреждённого участка трубы и установлена ремонтная муфта.',
      'Выполнена механическая прочистка канализационного стояка тросом, слив восстановлен.',
      'Произведён сброс воздуха из системы отопления, прогрев радиаторов проверен.',
      'Заменены перегоревшие лампы освещения на энергосберегающие светодиодные LED.',
      'Отрегулирован доводчик входной двери подъезда, закрывание плавное и бесшумное.',
      'Составлен акт осмотра, претензий со стороны заявителя не имеется.',
      'Система опрессована под рабочим давлением, утечек не обнаружено.',
      'Заменён вводной шаровый кран перед прибором учёта.',
      'Проведена гидродинамическая промывка ливневого стока, пропускная способность в норме.',
      'Отремонтирована проводка в распределительной коробке, подача питания восстановлена.',
      'Работы согласованы с диспетчером, подача воды возобновлена.',
      'Работы выполнены частично, требуется дополнительная закупка материалов.',
      'Доступ в квартиру заявителем не предоставлен, составлен акт о недопуске.',
      'Установлен временный ремонтный бандаж, требуется плановая замена стояка.',
    ],
    phrases: [
      'работы выполнены в полном объёме',
      'система запущена в штатном режиме',
      'устранена течь на стояке',
      'произведена замена участка трубы',
      'выполнена прочистка канализации',
      'произведён сброс воздуха',
      'заменены лампы освещения',
      'отрегулирован доводчик',
      'претензий у жильцов нет',
      'утечек не обнаружено',
      'система опрессована',
      'заменён шаровый кран',
      'доступ не предоставлен',
      'требуется закупка материалов',
      'установлен ремонтный хомут',
    ],
    words: [
      'выполнены',
      'устранена',
      'заменено',
      'прочищено',
      'отрегулировано',
      'проверено',
      'опрессовано',
      'восстановлено',
      'загерметизировано',
      'смонтировано',
      'установлено',
      'согласовано',
      'протестировано',
      'претензий',
      'давление',
      'уплотнитель',
      'штатный',
      'аварийный',
      'промывка',
      'светодиодные',
      'бандаж',
      'хомут',
      'вентиль',
      'утечка',
    ],
  },
  work: {
    sentences: [
      'Демонтаж старого участка трубы и монтаж полипропиленовой трубы d25.',
      'Замена прокладок и сальниковой набивки на запорной арматуре.',
      'Сварочные работы по восстановлению целостности трубопровода.',
      'Прочистка канализационного выпуска в дворовой колодец тросом 15м.',
      'Герметизация стыков перекрытия цементно-песчаным раствором.',
      'Замена неисправного автоматического выключателя 16А в этажном щитке.',
      'Локальный ремонт рулонного кровельного покрытия гидроизолом.',
      'Регулировка петель и смазка замкового механизма тамбурной двери.',
      'Замена участка ливнестока с установкой компенсационного патрубка.',
    ],
    phrases: [
      'демонтаж и монтаж трубы',
      'замена прокладок и сальников',
      'сварочные работы',
      'прочистка выпуска тросом',
      'герметизация стыков',
      'замена автоматического выключателя',
      'локальный ремонт кровли',
      'регулировка и смазка петель',
    ],
    words: [
      'демонтаж',
      'монтаж',
      'сварка',
      'прочистка',
      'герметизация',
      'регулировка',
      'смазка',
      'изоляция',
      'покраска',
      'зачистка',
      'установка',
      'подключение',
      'крепление',
      'набивка',
      'пайка',
    ],
  },
  materials: {
    sentences: [
      'Кран шаровый 1/2 дюйма внутренняя-внутренняя резьба — 1 шт.',
      'Кран шаровый 3/4 дюйма внутренняя-внутренняя резьба — 1 шт.',
      'Труба полипропиленовая армированная PN20 d25 — 2 метра.',
      'Муфта соединительная полипропиленовая d25 — 2 шт.',
      'Лента ФУМ сантехническая, паста Unipak и сантехнический лён.',
      'Хомут ремонтный металлический с резиновой прокладкой 1 дюйм.',
      'Лампа светодиодная LED 12W цоколь E27 — 3 шт.',
      'Автоматический выключатель однополюсный 16А характеристика C.',
    ],
    phrases: [
      'кран шаровый 1/2',
      'кран шаровый 3/4',
      'кран шаровый 1 дюйм',
      'труба полипропиленовая d20',
      'труба полипропиленовая d25',
      'труба полипропиленовая d32',
      'муфта полипропиленовая',
      'тройник полипропиленовый',
      'лента ФУМ сантехническая',
      'лён сантехнический и паста Unipak',
      'герметик силиконовый санитарный',
      'хомут ремонтный металлический',
      'прокладки резиновые паронитовые',
      'лампа светодиодная LED 12W E27',
      'автоматический выключатель 16А',
      'кабель ВВГ-Пнг 3х1.5',
      'кабель ВВГ-Пнг 3х2.5',
      'пена монтажная всесезонная',
    ],
    words: [
      'кран',
      'труба',
      'муфта',
      'тройник',
      'уголок',
      'фитинг',
      'сгон',
      'американка',
      'хомут',
      'фум',
      'лён',
      'паста',
      'герметик',
      'прокладка',
      'паронит',
      'лампа',
      'кабель',
      'автомат',
      'электроды',
      'дюбель',
      'саморез',
      'болт',
      'гайка',
      'шайба',
      'пена',
      'изолента',
      'раствор',
      'цемент',
    ],
  },
  withdraw: {
    sentences: [
      'Повторная заявка (дубликат ранее зарегистрированного обращения).',
      'Устранено заявителем самостоятельно до прибытия аварийной бригады.',
      'Ложный вызов: дефект или неисправность при осмотре не обнаружены.',
      'Не предоставлен доступ в жилое помещение, жильцы отсутствуют.',
      'Передано по подведомственности в специализированную городскую службу.',
      'Работы относятся к зоне личной ответственности собственника квартиры.',
    ],
    phrases: [
      'повторная заявка (дубликат)',
      'устранено жильцами самостоятельно',
      'ложный вызов',
      'не предоставлен доступ в квартиру',
      'передано в городскую службу',
      'зона ответственности собственника',
    ],
    words: [
      'дубликат',
      'повторно',
      'самостоятельно',
      'ложный',
      'недопуск',
      'отсутствует',
      'передано',
      'спецслужба',
      'собственник',
    ],
  },
  general: {
    sentences: [
      'Работы согласованы с диспетчерской службой и главным инженером.',
      'Заявка принята в работу дежурной аварийной бригадой.',
      'Требуется плановое обследование коммуникаций в дневное время.',
    ],
    phrases: [
      'согласовано с диспетчером',
      'дежурная бригада',
      'плановое обследование',
    ],
    words: [
      'диспетчер',
      'инженер',
      'бригада',
      'слесарь',
      'сантехник',
      'электрик',
      'мастер',
      'осмотр',
      'акт',
      'заявка',
    ],
  },
};

/**
 * Dynamically harvest clean sentences, phrases and frequent words from current tickets
 */
export function extractDynamicPhrasesFromTickets(tickets: Ticket[] = []): {
  sentences: string[];
  words: string[];
} {
  const sentenceSet = new Set<string>();
  const wordFreqMap = new Map<string, number>();

  const addText = (text?: string) => {
    if (!text || typeof text !== 'string') return;
    const clean = text.trim();
    if (!clean) return;

    // Split into sentences
    const sents = clean.split(/(?<=[.!?])\s+|\n+/);
    for (const s of sents) {
      const trimmed = s.trim();
      if (trimmed.length >= 8 && trimmed.length <= 150) {
        sentenceSet.add(trimmed);
      }
    }

    // Split into words
    const words = clean.toLowerCase().split(/[^a-zа-яёіїєґ0-9-]+/i);
    for (const w of words) {
      if (w.length >= 3 && !/^\d+$/.test(w)) {
        wordFreqMap.set(w, (wordFreqMap.get(w) || 0) + 1);
      }
    }
  };

  for (const t of tickets) {
    addText(t.title);
    addText(t.description);
    addText(t.work_description);
    addText(t.work_materials);
    addText(t.worker_report);
    addText(t.future_plan);
    addText(t.withdrawn_reason);
    if (t.works) {
      for (const w of t.works) {
        addText(w.description);
        addText(w.materials);
      }
    }
  }

  // Top frequent words (occurred at least 2 times)
  const sortedWords = Array.from(wordFreqMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([w]) => w);

  return {
    sentences: Array.from(sentenceSet),
    words: sortedWords,
  };
}

/**
 * Finds intelligent suggestions based on current text, cursor position, and context.
 */
export function getSmartSuggestions(
  text: string,
  cursorPos: number,
  context: SuggestionContext = 'general',
  tickets: Ticket[] = []
): SuggestionItem[] {
  const safeText = text || '';
  const currentPos = Math.min(Math.max(0, cursorPos), safeText.length);

  // Extract the word currently being typed under cursor
  const textBeforeCursor = safeText.slice(0, currentPos);
  const wordMatch = textBeforeCursor.match(/([a-zа-яёіїєґ0-9-]+)$/i);
  const currentWord = wordMatch ? wordMatch[1] : '';
  const currentWordLower = currentWord.toLowerCase();

  // Extract the current sentence/clause before cursor
  const lastDelimiterIndex = Math.max(
    textBeforeCursor.lastIndexOf('.'),
    textBeforeCursor.lastIndexOf('!'),
    textBeforeCursor.lastIndexOf('?'),
    textBeforeCursor.lastIndexOf('\n'),
    textBeforeCursor.lastIndexOf(',')
  );
  const currentClause = (
    lastDelimiterIndex >= 0
      ? textBeforeCursor.slice(lastDelimiterIndex + 1)
      : textBeforeCursor
  ).trim();
  const currentClauseLower = currentClause.toLowerCase();

  // If user hasn't typed anything or only 1 character and no clause
  if (!currentWordLower && currentClauseLower.length < 2) {
    return [];
  }

  const results: SuggestionItem[] = [];
  const seenTexts = new Set<string>();

  // Gather sources: Context-specific + Dynamic from tickets + General fallback
  const contextData = PRESEEDED_SUGGESTIONS[context] || PRESEEDED_SUGGESTIONS.general;
  const generalData = PRESEEDED_SUGGESTIONS.general;
  const dynamicData = extractDynamicPhrasesFromTickets(tickets);

  const allSentences = [
    ...contextData.sentences,
    ...dynamicData.sentences,
    ...generalData.sentences,
  ];

  const allPhrases = [
    ...contextData.phrases,
    ...generalData.phrases,
  ];

  const allWords = [
    ...contextData.words,
    ...dynamicData.words,
    ...generalData.words,
  ];

  // 1. Matches for Sentence / Full Proposal (Priority if current clause matches start or substring)
  if (currentClauseLower.length >= 2) {
    for (const sent of allSentences) {
      const sentLower = sent.toLowerCase();
      // Match if sentence starts with typed clause or contains it
      if (sentLower.startsWith(currentClauseLower) && sentLower !== currentClauseLower) {
        if (!seenTexts.has(sent)) {
          seenTexts.add(sent);
          results.push({
            id: `sent-start-${results.length}`,
            type: 'sentence',
            text: sent,
            category: 'Готовое предложение',
            score: 100 - results.length,
          });
        }
      } else if (
        currentClauseLower.length >= 4 &&
        sentLower.includes(currentClauseLower) &&
        sentLower !== currentClauseLower
      ) {
        if (!seenTexts.has(sent)) {
          seenTexts.add(sent);
          results.push({
            id: `sent-inc-${results.length}`,
            type: 'sentence',
            text: sent,
            category: 'Предложение',
            score: 80 - results.length,
          });
        }
      }
      if (results.length >= 4) break;
    }
  }

  // 2. Matches for Phrases
  if (currentClauseLower.length >= 2 || currentWordLower.length >= 2) {
    const query = currentClauseLower.length >= 2 ? currentClauseLower : currentWordLower;
    for (const phrase of allPhrases) {
      const phraseLower = phrase.toLowerCase();
      if (phraseLower.startsWith(query) && phraseLower !== query) {
        if (!seenTexts.has(phrase)) {
          seenTexts.add(phrase);
          results.push({
            id: `phrase-start-${results.length}`,
            type: 'phrase',
            text: phrase,
            category: 'Фраза',
            score: 70 - results.length,
          });
        }
      } else if (phraseLower.includes(currentWordLower) && currentWordLower.length >= 3 && phraseLower !== currentWordLower) {
        if (!seenTexts.has(phrase)) {
          seenTexts.add(phrase);
          results.push({
            id: `phrase-inc-${results.length}`,
            type: 'phrase',
            text: phrase,
            category: 'Фраза',
            score: 60 - results.length,
          });
        }
      }
      if (results.length >= 7) break;
    }
  }

  // 3. Matches for Individual Words (if typing a word of 2+ chars)
  if (currentWordLower.length >= 2) {
    for (const word of allWords) {
      const wordLower = word.toLowerCase();
      if (wordLower.startsWith(currentWordLower) && wordLower !== currentWordLower) {
        // Capitalize word if currentWord was capitalized
        const formattedWord =
          currentWord[0] === currentWord[0].toUpperCase() && currentWord[0] !== currentWord[0].toLowerCase()
            ? word.charAt(0).toUpperCase() + word.slice(1)
            : word;

        if (!seenTexts.has(formattedWord)) {
          seenTexts.add(formattedWord);
          results.push({
            id: `word-${results.length}`,
            type: 'word',
            text: formattedWord,
            category: 'Слово',
            score: 50 - results.length,
          });
        }
      }
      if (results.length >= 10) break;
    }
  }

  return results.slice(0, 6);
}

/**
 * Returns a list of quick starter phrases for empty/focused inputs in a given context
 */
export function getQuickStarterPhrases(context: SuggestionContext = 'general'): string[] {
  const data = PRESEEDED_SUGGESTIONS[context] || PRESEEDED_SUGGESTIONS.general;
  return data.phrases.slice(0, 5);
}

/**
 * Inserts selected suggestion into existing text smoothly
 */
export function applySuggestion(
  fullText: string,
  cursorPos: number,
  suggestion: SuggestionItem
): { newText: string; newCursorPos: number } {
  const safeText = fullText || '';
  const pos = Math.min(Math.max(0, cursorPos), safeText.length);
  const textBefore = safeText.slice(0, pos);
  const textAfter = safeText.slice(pos);

  if (suggestion.type === 'word') {
    // Replace the partial word being typed
    const match = textBefore.match(/([a-zа-яёіїєґ0-9-]+)$/i);
    const wordStart = match ? pos - match[1].length : pos;
    const replacement = suggestion.text + ' ';
    const newText = safeText.slice(0, wordStart) + replacement + textAfter;
    return {
      newText,
      newCursorPos: wordStart + replacement.length,
    };
  } else {
    // Sentence or Phrase
    // Check if we should replace the current clause or append
    const lastDelimiterIndex = Math.max(
      textBefore.lastIndexOf('.'),
      textBefore.lastIndexOf('!'),
      textBefore.lastIndexOf('?'),
      textBefore.lastIndexOf('\n')
    );

    let prefix = '';
    if (lastDelimiterIndex >= 0) {
      prefix = textBefore.slice(0, lastDelimiterIndex + 1);
      // add space if needed
      if (!prefix.endsWith(' ') && !prefix.endsWith('\n')) {
        prefix += ' ';
      }
    } else {
      prefix = '';
    }

    // Capitalize first letter of suggestion
    let formattedText = suggestion.text;
    if (formattedText.length > 0) {
      formattedText = formattedText.charAt(0).toUpperCase() + formattedText.slice(1);
    }
    // If it's a sentence and doesn't end with punctuation, add a period
    if (suggestion.type === 'sentence' && !/[.!?]$/.test(formattedText)) {
      formattedText += '.';
    }
    formattedText += ' ';

    const newText = prefix + formattedText + textAfter.replace(/^[\s,.;]+/, '');
    return {
      newText,
      newCursorPos: prefix.length + formattedText.length,
    };
  }
}
