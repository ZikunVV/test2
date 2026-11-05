import { StreetItem, House, Ticket } from '../types';

export const DEFAULT_STREETS: StreetItem[] = [
  { id: 1, current_name: 'Доценка', old_names: 'ул. Деснянская, Деснянська' },
  { id: 2, current_name: 'Шевченко', old_names: 'ул. Советская, Радянська' },
  { id: 3, current_name: 'просп. Мира', old_names: 'проспект Ленина, пр-т Ленина, ул. Ленина' },
  { id: 4, current_name: 'Героев', old_names: 'ул. Октябрьская, Жовтнева' },
  { id: 5, current_name: 'Космонавтов', old_names: 'ул. Гагарина' },
  { id: 6, current_name: 'Европейская', old_names: 'ул. Щорса' },
  {
    id: 7,
    current_name: "просп. Левка Лук'яненка",
    old_names:
      "ул. Рокоссовского, ул. Рокосовского, Рокоссовского, Рокосовского, ул. Рокоссовського, Рокоссовського, ул. Рокосовського, Рокосовського, ул. Рокоссовская, Рокоссовская, просп. Рокоссовского, просп. Рокосовского, ул.Левка Лук'яненка, ул. Левка Лук'яненка, просп.Левка Лук'яненка, Левка Лук'яненка, Левка Лук’яненка, ул.Левка Лук’яненка, Левка Лукьяненко, Левка Лукьяненка",
  },
];

/**
 * Normalizes all apostrophe variants (', ’, ʼ, `) into standard ASCII apostrophe (')
 */
export function normalizeApostrophes(str: string): string {
  if (!str) return '';
  return str.replace(/[’ʼ`]/g, "'");
}

/**
 * Strips common prefixes like "ул.", "улица", "проспект", "просп.", "пер." etc.
 */
export function cleanStreetPrefix(str: string): string {
  if (!str) return '';
  let s = normalizeApostrophes(str).trim();
  // Strip compound or accidental prefixes e.g. "ул. просп." or "ул. проспект"
  s = s.replace(/^(?:ул\.|улица|вул\.|вулиця)\s*(?:проспект|просп\.|просп|пр-т|пр\.)\s*/i, '');
  s = s.replace(/^(?:ул\.|улица|вул\.|вулиця)\s*/i, '');
  s = s.replace(/^(?:проспект|просп\.|просп|пр-т|пр\.)\s*/i, '');
  s = s.replace(/^(?:пер\.|переулок|провулок)\s*/i, '');
  s = s.replace(/^(?:бульв\.|бульвар|тупик|наб\.|набережная|пл\.|площадь|шоссе|проезд)\s*/i, '');
  s = s.replace(/\s*\(?(?:проспект|просп\.|просп|пр-т)\)?\s*$/i, '');
  return s.trim();
}

/**
 * Generates a canonical lowercase search key for comparing street names,
 * stripping prefixes, normalizing apostrophes and Cyrillic nuances (e.g. Лукьяненка / Лук'яненка, Рокоссовского / Рокосовского).
 */
export function canonicalStreetKey(str: string): string {
  if (!str) return '';
  let s = cleanStreetPrefix(str).toLowerCase().trim();
  // Normalize Russian/Ukrainian variations of Lukianenko
  s = s.replace(/лукьянен/g, "лук'янен");
  // Normalize Russian/Ukrainian variations of Rokossovsky / Rokosovsky
  s = s.replace(/рокосс/g, 'рокос');
  s = s.replace(/рокосовськ/g, 'рокосовск');
  return s;
}

/**
 * Checks if a street name or raw input is a prospect/avenue (проспект).
 * Matches Cyrillic text regardless of whether followed by space, dot, or Cyrillic letter.
 * Also checks known Ukrainian prospects (e.g. Левка Лук'яненка, Мира, Победы).
 */
export function isProspectStreet(name: string): boolean {
  if (!name) return false;
  const raw = normalizeApostrophes(name).trim().toLowerCase();

  // If written as "ул. просп." or "ул. проспект"
  if (/^(?:ул\.|улица|вул\.|вулиця)\s*(?:проспект|просп\.|просп|пр-т|пр\.)/i.test(raw)) {
    return true;
  }

  // Starts with or contains prospect designation
  if (/^(?:проспект|просп\.|просп|пр-т|пр\.)/i.test(raw)) {
    return true;
  }
  if (/(?:^|[\s,;."''«»(])(проспект|просп\.|просп|пр-т|пр\.)/i.test(raw)) {
    return true;
  }

  // Specifically known historical avenue: Левка Лук'яненка (бывшая Рокоссовского)
  if (raw.includes("лук'янен") || raw.includes('лукьянен')) {
    return true;
  }

  return false;
}

export type StreetKind = 'street' | 'prospect' | 'lane' | 'other';

/**
 * Analyzes street string and identifies its kind (street, prospect, lane, other).
 */
export function detectStreetType(str: string): { type: StreetKind; cleanName: string } {
  const trimmed = (str || '').trim();
  if (!trimmed) return { type: 'street', cleanName: '' };

  if (isProspectStreet(trimmed)) {
    const clean = cleanStreetPrefix(trimmed);
    return { type: 'prospect', cleanName: clean };
  }

  if (/^(?:пер\.|переулок|провулок)\s*/i.test(trimmed)) {
    const clean = cleanStreetPrefix(trimmed);
    return { type: 'lane', cleanName: clean };
  }

  if (/^(?:бульв\.|бульвар|тупик|наб\.|набережная|пл\.|площадь|шоссе|проезд)\s*/i.test(trimmed)) {
    return { type: 'other', cleanName: trimmed };
  }

  const clean = cleanStreetPrefix(trimmed);
  return { type: 'street', cleanName: clean || trimmed };
}

/**
 * Normalizes street input when renamed or entered:
 * Если пишется проспект, вместо сокращённого слова «ул.» пишем сокращённое название «просп.». «ул.» не пишем!
 */
export function formatRenamedStreet(input: string, streetType?: StreetKind | string): string {
  const trimmed = (input || '').trim();
  if (!trimmed) return '';

  const clean = cleanStreetPrefix(trimmed);

  if (streetType === 'prospect') {
    return `просп. ${clean || trimmed}`;
  }
  if (streetType === 'lane') {
    return `пер. ${clean || trimmed}`;
  }
  if (streetType === 'other') {
    return trimmed;
  }
  if (streetType === 'street') {
    return clean || trimmed;
  }

  // Auto-detection fallback
  if (isProspectStreet(trimmed)) {
    return `просп. ${clean || trimmed}`;
  }

  if (/^(?:пер\.|переулок|провулок)\s*/i.test(trimmed)) {
    return `пер. ${clean || trimmed}`;
  }

  return clean || trimmed;
}

/**
 * Formats street for UI display:
 * Если это проспект: "просп. <Название>" (никогда не пишем "ул.")
 * Если в справочнике улиц зарегистрирован как проспект: отображается как "просп. <Название>"
 * Если это Левка Лук'яненка: всегда отображается как "просп. Левка Лук'яненка"
 * Если другой тип (пер., бульв.): оставляет префикс
 * Иначе: "ул. <Название>"
 */
export function formatStreetDisplay(
  streetName: string,
  streets?: { current_name: string; old_names?: string }[]
): string {
  if (!streetName) return '';
  const trimmed = streetName.trim();
  const canonical = canonicalStreetKey(trimmed);

  // 0. Hardcoded rule: Левка Лук'яненка is an avenue / prospect — ALWAYS "просп. Левка Лук'яненка"
  if (canonical === "левка лук'яненка" || canonical.includes("лук'янен")) {
    return "просп. Левка Лук'яненка";
  }

  // 1. Check if matches any known street in the directory
  if (streets && Array.isArray(streets) && streets.length > 0) {
    const matched = streets.find((s) => {
      const sKey = canonicalStreetKey(s.current_name);
      if (sKey === canonical) return true;
      if (s.old_names) {
        return s.old_names
          .split(/[,;]/)
          .some((o) => canonicalStreetKey(o.trim()) === canonical);
      }
      return false;
    });

    if (matched) {
      if (isProspectStreet(matched.current_name)) {
        const c = cleanStreetPrefix(matched.current_name);
        return `просп. ${c}`;
      }
      if (/^(?:пер\.|переулок|провулок)\s*/i.test(matched.current_name)) {
        const c = cleanStreetPrefix(matched.current_name);
        return `пер. ${c}`;
      }
      if (/^(?:бульв\.|бульвар|тупик|наб\.|набережная|пл\.|площадь|шоссе|проезд)\s*/i.test(matched.current_name)) {
        return matched.current_name;
      }
      const c = cleanStreetPrefix(matched.current_name);
      return `ул. ${c}`;
    }
  }

  // 2. If the string itself is a prospect (even without space e.g. "просп.Левка Лук'яненка")
  if (isProspectStreet(trimmed)) {
    const clean = cleanStreetPrefix(trimmed);
    return `просп. ${clean}`;
  }

  // 3. Lane (проулок/переулок)
  if (/^(?:пер\.|переулок|провулок)\s*/i.test(trimmed)) {
    const clean = cleanStreetPrefix(trimmed);
    return `пер. ${clean}`;
  }

  // 4. Other types (бульвар, площадь etc.)
  if (/^(?:бульв\.|бульвар|тупик|наб\.|набережная|пл\.|площадь|шоссе|проезд)\s*/i.test(trimmed)) {
    return trimmed;
  }

  // 5. Standard street: prepend "ул." with single space
  const clean = cleanStreetPrefix(trimmed);
  return `ул. ${clean}`;
}

/**
 * Checks if input matches current_name or any old_names of known streets.
 * Returns the current official street name if matched, preserving case of current_name.
 */
export function normalizeStreetName(
  input: string,
  streets: StreetItem[]
): {
  officialName: string;
  isNormalized: boolean;
  matchedOldName?: string;
} {
  const trimmed = input.trim();
  if (!trimmed) {
    return { officialName: '', isNormalized: false };
  }

  const canonicalInput = canonicalStreetKey(trimmed);

  // If input matches Lukianenko or old name Rokossovsky / Rokosovsky in any spelling
  if (canonicalInput === "левка лук'яненка" || canonicalInput.includes("лук'янен")) {
    return { officialName: "просп. Левка Лук'яненка", isNormalized: false };
  }
  if (canonicalInput.includes('рокос')) {
    return {
      officialName: "просп. Левка Лук'яненка",
      isNormalized: true,
      matchedOldName: trimmed,
    };
  }

  for (const s of streets) {
    const canonicalCurrent = canonicalStreetKey(s.current_name);
    if (canonicalInput === canonicalCurrent) {
      return { officialName: s.current_name, isNormalized: false };
    }

    if (s.old_names) {
      const oldList = s.old_names
        .split(/[,;]/)
        .map((o) => canonicalStreetKey(o.trim()))
        .filter(Boolean);

      for (const old of oldList) {
        if (canonicalInput === old) {
          return {
            officialName: s.current_name,
            isNormalized: true,
            matchedOldName: old,
          };
        }
      }
    }
  }

  // Not in directory: если введен проспект, форматируем как "просп. <Название>" (без "ул.")
  if (isProspectStreet(trimmed)) {
    return { officialName: formatRenamedStreet(trimmed, 'prospect'), isNormalized: false };
  }

  // Not in directory, return as entered (stripped of leading "ул.")
  const cleaned = cleanStreetPrefix(trimmed);
  return { officialName: cleaned || trimmed, isNormalized: false };
}

/**
 * Batch replaces an old street name across houses and tickets.
 * Если новое название — проспект, вместо «ул.» подставляется «просп.». «ул.» не пишется!
 */
export function batchReplaceStreetInHousesAndTickets(
  targetName: string,
  newOfficialName: string,
  houses: House[],
  tickets: Ticket[]
): {
  updatedHouses: House[];
  updatedTickets: Ticket[];
  housesChanged: number;
  ticketsChanged: number;
} {
  const canonicalTarget = canonicalStreetKey(targetName);
  const isNewProspect = isProspectStreet(newOfficialName);
  const formattedNewStreet = isNewProspect
    ? formatRenamedStreet(newOfficialName, 'prospect')
    : cleanStreetPrefix(newOfficialName);

  let housesChanged = 0;
  const updatedHouses = houses.map((house) => {
    const canonicalHouseStreet = canonicalStreetKey(house.street);
    if (canonicalHouseStreet === canonicalTarget) {
      housesChanged++;
      return {
        ...house,
        street: formattedNewStreet,
      };
    }
    return house;
  });

  let ticketsChanged = 0;
  const updatedTickets = tickets.map((ticket) => {
    let changed = false;
    let newStreet = ticket.street;
    let newAddress = ticket.address;

    if (ticket.street) {
      const canonicalTicketStreet = canonicalStreetKey(ticket.street);
      if (canonicalTicketStreet === canonicalTarget) {
        newStreet = formattedNewStreet;
        changed = true;
      }
    }

    // Also check full address string
    if (ticket.address) {
      const escapedTarget = targetName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedCleanTarget = cleanStreetPrefix(targetName).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      const streetRegex = new RegExp(
        `(^|[^а-яёА-ЯЁіІїЇєЄґҐa-zA-Z0-9])(?:(?:ул\\.|улица|вул\\.|вулиця|пр-т|проспект|просп\\.)\\s*)?(?:${escapedTarget}|${escapedCleanTarget})(?![а-яёА-ЯЁіІїЇєЄґҐa-zA-Z0-9])`,
        'gi'
      );

      if (streetRegex.test(ticket.address)) {
        const replacement = isNewProspect ? `$1${formattedNewStreet}` : `$1ул. ${formattedNewStreet}`;
        newAddress = ticket.address.replace(streetRegex, replacement).trim();
        changed = true;
      }
    }

    if (changed) {
      ticketsChanged++;
      return {
        ...ticket,
        street: newStreet || formattedNewStreet,
        address: newAddress,
      };
    }
    return ticket;
  });

  return {
    updatedHouses,
    updatedTickets,
    housesChanged,
    ticketsChanged,
  };
}

/**
 * Replaces old street names with new official street names in a single ticket's street and address.
 */
export function replaceOldStreetNamesInTicket(
  ticket: Ticket,
  streets: StreetItem[] = []
): { ticket: Ticket; changed: boolean } {
  let changed = false;
  let newStreet = ticket.street || '';
  let newAddress = ticket.address || '';

  // Combine default streets and user-defined streets to be 100% comprehensive
  const allKnownStreets: StreetItem[] = [...DEFAULT_STREETS];
  for (const s of streets) {
    if (!allKnownStreets.some((k) => canonicalStreetKey(k.current_name) === canonicalStreetKey(s.current_name))) {
      allKnownStreets.push(s);
    }
  }

  // 1. Check ticket.street
  if (ticket.street) {
    const norm = normalizeStreetName(ticket.street, allKnownStreets);
    if (norm.officialName && norm.officialName !== ticket.street) {
      newStreet = norm.officialName;
      changed = true;
    }
  }

  // 2. Check ticket.address against all known old street names
  if (newAddress) {
    const origAddress = newAddress;

    // Special hardcoded fast checks for standard known Soviet/historical street renamings
    // a) Рокоссовского / Рокосовского / Рокоссовського / Рокосовського -> просп. Левка Лук'яненка
    if (/рокос/i.test(newAddress)) {
      newAddress = newAddress.replace(
        /(^|[^а-яёА-ЯЁіІїЇєЄґҐa-zA-Z0-9])(?:(?:ул\\.|улица|вул\\.|вулиця|пр-т|проспект|просп\\.)\\s*)?рокос+[а-яёієїґьъ]*(?![а-яёА-ЯЁіІїЇєЄґҐa-zA-Z0-9])/gi,
        "$1просп. Левка Лук'яненка"
      );
      if (!newStreet || /рокос/i.test(newStreet)) {
        newStreet = "просп. Левка Лук'яненка";
      }
    }

    // b) Ленина -> просп. Мира
    if (/ленин/i.test(newAddress) && !/ленинград/i.test(newAddress)) {
      newAddress = newAddress.replace(
        /(^|[^а-яёА-ЯЁіІїЇєЄґҐa-zA-Z0-9])(?:(?:ул\\.|улица|вул\\.|вулиця|пр-т|проспект|просп\\.)\\s*)?ленин[а-яёієїґьъ]*(?![а-яёА-ЯЁіІїЇєЄґҐa-zA-Z0-9])/gi,
        "$1просп. Мира"
      );
      if (!newStreet || /ленин/i.test(newStreet)) {
        newStreet = 'просп. Мира';
      }
    }

    // c) Деснянская -> ул. Доценка
    if (/деснян/i.test(newAddress)) {
      newAddress = newAddress.replace(
        /(^|[^а-яёА-ЯЁіІїЇєЄґҐa-zA-Z0-9])(?:(?:ул\\.|улица|вул\\.|вулиця)\s*)?деснянск[а-яёієїґьъ]*(?![а-яёА-ЯЁіІїЇєЄґҐa-zA-Z0-9])/gi,
        '$1ул. Доценка'
      );
      if (!newStreet || /деснян/i.test(newStreet)) {
        newStreet = 'Доценка';
      }
    }

    // d) Советская / Радянська -> ул. Шевченко
    if (/советск|радянськ/i.test(newAddress)) {
      newAddress = newAddress.replace(
        /(^|[^а-яёА-ЯЁіІїЇєЄґҐa-zA-Z0-9])(?:(?:ул\\.|улица|вул\\.|вулиця)\s*)?(?:советск|радянськ)[а-яёієїґьъ]*(?![а-яёА-ЯЁіІїЇєЄґҐa-zA-Z0-9])/gi,
        '$1ул. Шевченко'
      );
      if (!newStreet || /советск|радянськ/i.test(newStreet)) {
        newStreet = 'Шевченко';
      }
    }

    // e) Гагарина -> ул. Космонавтов
    if (/гагарин/i.test(newAddress)) {
      newAddress = newAddress.replace(
        /(^|[^а-яёА-ЯЁіІїЇєЄґҐa-zA-Z0-9])(?:(?:ул\\.|улица|вул\\.|вулиця)\s*)?гагарин[а-яёієїґьъ]*(?![а-яёА-ЯЁіІїЇєЄґҐa-zA-Z0-9])/gi,
        '$1ул. Космонавтов'
      );
      if (!newStreet || /гагарин/i.test(newStreet)) {
        newStreet = 'Космонавтов';
      }
    }

    // f) Щорса -> ул. Европейская
    if (/щорс/i.test(newAddress)) {
      newAddress = newAddress.replace(
        /(^|[^а-яёА-ЯЁіІїЇєЄґҐa-zA-Z0-9])(?:(?:ул\\.|улица|вул\\.|вулиця)\s*)?щорс[а-яёієїґьъ]*(?![а-яёА-ЯЁіІїЇєЄґҐa-zA-Z0-9])/gi,
        '$1ул. Европейская'
      );
      if (!newStreet || /щорс/i.test(newStreet)) {
        newStreet = 'Европейская';
      }
    }

    // g) Октябрьская / Жовтнева -> ул. Героев
    if (/октябрьск|жовтнев/i.test(newAddress)) {
      newAddress = newAddress.replace(
        /(^|[^а-яёА-ЯЁіІїЇєЄґҐa-zA-Z0-9])(?:(?:ул\\.|улица|вул\\.|вулиця)\s*)?(?:октябрьск|жовтнев)[а-яёієїґьъ]*(?![а-яёА-ЯЁіІїЇєЄґҐa-zA-Z0-9])/gi,
        '$1ул. Героев'
      );
      if (!newStreet || /октябрьск|жовтнев/i.test(newStreet)) {
        newStreet = 'Героев';
      }
    }

    // Loop through all known directory streets (including any user-added renamings)
    for (const s of allKnownStreets) {
      const isNewProspect = isProspectStreet(s.current_name);
      const cleanOfficial = cleanStreetPrefix(s.current_name);
      const formattedNewStreet = isNewProspect
        ? formatRenamedStreet(s.current_name, 'prospect')
        : cleanOfficial;

      const rawOldList = s.old_names ? s.old_names.split(/[,;]/).map((o) => o.trim()).filter(Boolean) : [];

      for (const old of rawOldList) {
        const cleanOld = cleanStreetPrefix(old).trim();
        if (cleanOld.length < 3) continue;
        if (canonicalStreetKey(cleanOld) === canonicalStreetKey(cleanOfficial)) continue;

        const escapedOld = old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const escapedCleanOld = cleanOld.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const streetRegex = new RegExp(
          `(^|[^а-яёА-ЯЁіІїЇєЄґҐa-zA-Z0-9])(?:(?:ул\\.|улица|вул\\.|вулиця|пр-т|проспект|просп\\.)\\s*)?(?:${escapedOld}|${escapedCleanOld})(?![а-яёА-ЯЁіІїЇєЄґҐa-zA-Z0-9])`,
          'gi'
        );

        if (streetRegex.test(newAddress)) {
          const replacement = isNewProspect ? `$1${formattedNewStreet}` : `$1ул. ${formattedNewStreet}`;
          newAddress = newAddress.replace(streetRegex, replacement);
        }
      }
    }

    // Special rule: if address still has "ул. просп." or "ул. Левка Лук'яненка"
    if (/(?:ул\.|улица)\s*(?:просп\.|проспект)\s*/i.test(newAddress)) {
      newAddress = newAddress.replace(/(?:ул\.|улица)\s*(?:просп\.|проспект)\s*/gi, 'просп. ');
    }
    if (/(?:ул\.|улица)\s*Левка Лук['’ʼ`]яненка/gi.test(newAddress)) {
      newAddress = newAddress.replace(/(?:ул\.|улица)\s*Левка Лук['’ʼ`]яненка/gi, "просп. Левка Лук'яненка");
    }

    newAddress = newAddress.trim();
    if (newAddress !== origAddress) {
      changed = true;
    }
  }

  if (changed) {
    return {
      ticket: {
        ...ticket,
        street: newStreet || ticket.street,
        address: newAddress,
      },
      changed: true,
    };
  }

  return { ticket, changed: false };
}

/**
 * Batch replaces all old street names with new official street names across tickets.
 */
export function replaceAllOldStreetNamesInTickets(
  tickets: Ticket[],
  streets: StreetItem[] = []
): { updatedTickets: Ticket[]; changedCount: number } {
  let changedCount = 0;
  const updatedTickets = tickets.map((t) => {
    const res = replaceOldStreetNamesInTicket(t, streets);
    if (res.changed) {
      changedCount++;
      return res.ticket;
    }
    return t;
  });

  return { updatedTickets, changedCount };
}

/**
 * Returns formatted address with new official street name for display.
 */
export function formatTicketAddressWithNewStreet(
  ticket: Ticket,
  streets: StreetItem[] = []
): string {
  const res = replaceOldStreetNamesInTicket(ticket, streets);
  return res.ticket.address;
}

/**
 * Normalizes house number (e.g. "5а", "5-А", "5 А" -> "5а")
 */
export function normalizeHouseNumber(val: string): string {
  if (!val) return '';
  return val.replace(/[\s\-_]/g, '').toLowerCase();
}

/**
 * Extracts structured address components (street, house number, building) from ticket.
 */
/**
 * Extracts structured address components from ticket.
 */
export function extractAddressParts(ticket: Ticket): {
  street: string;
  houseNumber: string;
  building: string;
  apartment: string;
  locationType: string;
  locationValue: string;
} {
  let street = (ticket.street || '').trim();
  let houseNumber = (ticket.house_number || '').trim();
  let building = (ticket.building || '').trim();
  let apartment = (ticket.apartment || '').trim();
  let locationType = (ticket.location_type || '').trim();
  let locationValue = (ticket.location_value || '').trim();

  const raw = ticket.address || '';
  if (!street || !houseNumber) {
    const m = raw.match(
      /(?:ул\.|улица|вул\.|вулиця|пр-т|проспект|пер\.|переулок)?\s*([^,]+?),\s*(?:д\.|дом)\s*([^,\s]+)(?:\s*(?:корп\.|корпус)\s*([^,\s]+))?/i
    );
    if (m) {
      if (!street) street = m[1].trim();
      if (!houseNumber) houseNumber = m[2].trim();
      if (!building && m[3]) building = m[3].trim();
    } else {
      const m2 = raw.match(
        /^([^,]+?),\s*([0-9]+[a-zA-Zа-яА-ЯёЁ\-_/]?)(?:\s*(?:корп\.|корпус|\/)\s*([^,\s]+))?/i
      );
      if (m2) {
        if (!street) street = m2[1].trim();
        if (!houseNumber) houseNumber = m2[2].trim();
        if (!building && m2[3]) building = m2[3].trim();
      }
    }
  }

  if (!apartment) {
    const aptMatch = raw.match(/(?:кв\.|квартира)\s*([^,\s]+)/i);
    if (aptMatch) {
      apartment = aptMatch[1].trim();
    }
  }

  return { street, houseNumber, building, apartment, locationType, locationValue };
}

/**
 * Checks if a ticket strictly matches the specified address (street, house number, and building/корпус).
 */
export function isSameAddressTicket(
  ticket: Ticket,
  targetStreet: string,
  targetHouseNumber: string,
  targetBuilding?: string,
  streets: StreetItem[] = []
): boolean {
  if (!targetStreet || !targetHouseNumber) return false;

  const { street: ticketStreetRaw, houseNumber: ticketHouseRaw, building: ticketBldRaw } =
    extractAddressParts(ticket);

  if (!ticketStreetRaw || !ticketHouseRaw) return false;

  const normTargetStreet = cleanStreetPrefix(
    normalizeStreetName(targetStreet, streets).officialName || targetStreet
  ).trim().toLowerCase();

  const normTicketStreet = cleanStreetPrefix(
    normalizeStreetName(ticketStreetRaw, streets).officialName || ticketStreetRaw
  ).trim().toLowerCase();

  if (normTargetStreet !== normTicketStreet) return false;

  const normTargetHouse = normalizeHouseNumber(targetHouseNumber);
  const normTicketHouse = normalizeHouseNumber(ticketHouseRaw);

  if (normTargetHouse !== normTicketHouse) return false;

  const normTargetBuilding = normalizeHouseNumber(targetBuilding || '');
  const normTicketBuilding = normalizeHouseNumber(ticketBldRaw || '');

  // Полное совпадение: корпус должен совпадать (оба пустые либо равны)
  return normTargetBuilding === normTicketBuilding;
}

export interface LocationSpecification {
  locationType?: 'apartment' | 'entrance' | 'basement' | 'roof' | 'yard' | 'technical' | string;
  apartmentNumber?: string;
  entranceNumber?: string;
  locationValue?: string;
}

/**
 * Computes a standardized location key for exact 3rd indicator matching.
 * Returns null if location specification has not been entered yet.
 */
export function getStandardLocationKey(spec: LocationSpecification): string | null {
  const locType = spec.locationType || (spec.apartmentNumber ? 'apartment' : '');

  if (locType === 'apartment') {
    const apt = (spec.apartmentNumber || '').trim();
    if (!apt) return null; // Номер квартиры ещё не введён
    return 'apt:' + normalizeHouseNumber(apt);
  }

  const ent = (spec.entranceNumber || '').trim();
  const val = (spec.locationValue || '').trim();

  // Если не квартира, но подъезд и уточнение не выбраны/не введены:
  if (!locType && !ent && !val) return null;

  const cleanEnt = ent ? normalizeHouseNumber(ent) : '';
  const cleanVal = val ? val.toLowerCase().replace(/[\s\-_]/g, '') : '';

  if (locType === 'entrance') {
    if (!cleanEnt && !cleanVal) return null;
    return 'entrance:' + (cleanEnt || cleanVal);
  }

  if (locType === 'basement') {
    if (!cleanEnt && !cleanVal) return null;
    return 'basement:' + (cleanEnt || cleanVal || 'all');
  }

  if (locType === 'roof') {
    if (!cleanEnt && !cleanVal) return null;
    return 'roof:' + (cleanEnt || cleanVal || 'all');
  }

  if (locType === 'yard') {
    if (!cleanEnt && !cleanVal) return null;
    return 'yard:' + (cleanEnt || cleanVal || 'all');
  }

  if (locType === 'technical') {
    if (!cleanEnt && !cleanVal) return null;
    return 'technical:' + (cleanEnt || cleanVal || 'all');
  }

  if (cleanEnt) return 'entrance:' + cleanEnt;
  if (cleanVal) return 'val:' + cleanVal;

  return null;
}

/**
 * Extracts standard location key from an existing Ticket.
 */
export function getTicketLocationKey(ticket: Ticket): string | null {
  const parts = extractAddressParts(ticket);

  // 1. Direct apartment property or parsed apartment
  if (parts.apartment) {
    const aptClean = parts.apartment.replace(/^(?:кв\.|квартира)\s*/i, '').trim();
    if (aptClean && !aptClean.toLowerCase().includes('подъезд')) {
      return 'apt:' + normalizeHouseNumber(aptClean);
    }
  }

  const locType = ticket.location_type;
  const locVal = (ticket.location_value || '').trim();
  const rawAddr = (ticket.address || '').toLowerCase();
  const aptField = (ticket.apartment || '').trim();

  // Look for apartment in address string if not caught
  const aptMatch = rawAddr.match(/(?:кв\.|квартира)\s*([0-9]+[a-zA-Zа-яА-Я]?)/i);
  if (aptMatch) {
    return 'apt:' + normalizeHouseNumber(aptMatch[1]);
  }

  // Look for entrance number in location_value, apartment, or address
  const combinedText = `${locVal} ${aptField} ${rawAddr}`.toLowerCase();
  const entMatch = combinedText.match(/(?:подъезд|под\.)\s*([0-9]+)/i);
  const entNum = entMatch ? normalizeHouseNumber(entMatch[1]) : '';

  if (locType === 'entrance' || aptField.toLowerCase().includes('подъезд') || combinedText.includes('подъезд')) {
    if (entNum) return 'entrance:' + entNum;
    if (locVal) return 'entrance:' + normalizeHouseNumber(locVal);
    return 'entrance:1';
  }

  if (locType === 'basement' || rawAddr.includes('подвал')) {
    return 'basement:' + (entNum || 'all');
  }

  if (locType === 'roof' || rawAddr.includes('кровл') || rawAddr.includes('крыш')) {
    return 'roof:' + (entNum || 'all');
  }

  if (locType === 'yard' || rawAddr.includes('двор')) {
    return 'yard:' + (entNum || 'all');
  }

  if (locType === 'technical' || rawAddr.includes('техэтаж')) {
    return 'technical:' + (entNum || 'all');
  }

  if (locVal) {
    return 'val:' + locVal.toLowerCase().replace(/[\s\-_]/g, '');
  }

  return null;
}

/**
 * Checks if a ticket matches on ALL THREE mandatory indicators:
 * 1. Street (улица)
 * 2. House number & Building (номер дома и корпус)
 * 3. Location specification (место уточнения: номер квартиры, подъезд или др.)
 * "полное совпадение это когда ещё и номер квартиры или место уточнения то есть введено минимум обязательно три показателя ( улица, номер дома, место уточнения )"
 */
export function isSameFullAddressTicket(
  ticket: Ticket,
  targetStreet: string,
  targetHouseNumber: string,
  targetBuilding: string | undefined,
  targetLocationKey: string | null,
  streets: StreetItem[] = []
): boolean {
  if (!targetLocationKey) return false;

  // 1 & 2: Street and house number + building must strictly match
  if (!isSameAddressTicket(ticket, targetStreet, targetHouseNumber, targetBuilding, streets)) {
    return false;
  }

  // 3: Location specification must strictly match
  const ticketLocKey = getTicketLocationKey(ticket);
  if (!ticketLocKey) return false;

  return ticketLocKey === targetLocationKey;
}

/**
 * Finds all previous tickets matching the specified address on ALL THREE indicators (street, house, location specification).
 */
export function findTicketsForFullAddress(
  allTickets: Ticket[],
  params: {
    street: string;
    houseNumber: string;
    building?: string;
    locationKey: string | null;
    excludeTicketId?: string;
  },
  streets: StreetItem[] = []
): Ticket[] {
  if (
    !allTickets ||
    allTickets.length === 0 ||
    !params.street ||
    !params.houseNumber ||
    !params.locationKey
  ) {
    return [];
  }

  return allTickets
    .filter((t) => {
      if (params.excludeTicketId && t.id === params.excludeTicketId) return false;
      return isSameFullAddressTicket(
        t,
        params.street,
        params.houseNumber,
        params.building,
        params.locationKey,
        streets
      );
    })
    .sort((a, b) => {
      const dateCmp = (b.date || '').localeCompare(a.date || '');
      if (dateCmp !== 0) return dateCmp;
      return (b.number || '').localeCompare(a.number || '', undefined, { numeric: true });
    });
}

/**
 * Finds all previous tickets matching the specified house address (for address history tab fallbacks).
 */
export function findTicketsForAddress(
  allTickets: Ticket[],
  params: {
    street: string;
    houseNumber: string;
    building?: string;
    excludeTicketId?: string;
  },
  streets: StreetItem[] = []
): Ticket[] {
  if (!allTickets || allTickets.length === 0 || !params.street || !params.houseNumber) return [];

  return allTickets
    .filter((t) => {
      if (params.excludeTicketId && t.id === params.excludeTicketId) return false;
      return isSameAddressTicket(t, params.street, params.houseNumber, params.building, streets);
    })
    .sort((a, b) => {
      const dateCmp = (b.date || '').localeCompare(a.date || '');
      if (dateCmp !== 0) return dateCmp;
      return (b.number || '').localeCompare(a.number || '', undefined, { numeric: true });
    });
}
