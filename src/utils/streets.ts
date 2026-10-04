import { StreetItem, House, Ticket } from '../types';

export const DEFAULT_STREETS: StreetItem[] = [
  { id: 1, current_name: 'Доценка', old_names: 'ул. Деснянская, Деснянська' },
  { id: 2, current_name: 'Шевченко', old_names: 'ул. Советская, Радянська' },
  { id: 3, current_name: 'Мира', old_names: 'проспект Ленина, пр-т Ленина' },
  { id: 4, current_name: 'Героев', old_names: 'ул. Октябрьская, Жовтнева' },
  { id: 5, current_name: 'Космонавтов', old_names: 'ул. Гагарина' },
  { id: 6, current_name: 'Европейская', old_names: 'ул. Щорса' },
];

/**
 * Strips common prefixes like "ул.", "улица", "проспект", "просп.", "пер." etc.
 */
export function cleanStreetPrefix(str: string): string {
  if (!str) return '';
  return str
    .replace(/^(ул\.|улица|вул\.|вулиця|пр-т|проспект|просп\.|пер\.|переулок|провулок)\s+/i, '')
    .trim();
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

  const cleanedInput = cleanStreetPrefix(trimmed).toLowerCase();

  for (const s of streets) {
    const cleanedCurrent = cleanStreetPrefix(s.current_name).toLowerCase();
    if (cleanedInput === cleanedCurrent) {
      return { officialName: s.current_name, isNormalized: false };
    }

    if (s.old_names) {
      const oldList = s.old_names
        .split(/[,;]/)
        .map((o) => cleanStreetPrefix(o.trim()).toLowerCase())
        .filter(Boolean);

      for (const old of oldList) {
        if (cleanedInput === old) {
          return {
            officialName: s.current_name,
            isNormalized: true,
            matchedOldName: old,
          };
        }
      }
    }
  }

  // Not in directory, return as entered (stripped of leading "ул.")
  const cleaned = cleanStreetPrefix(trimmed);
  return { officialName: cleaned || trimmed, isNormalized: false };
}

/**
 * Batch replaces an old street name across houses and tickets
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
  const cleanedTarget = cleanStreetPrefix(targetName).toLowerCase();
  const cleanedNew = cleanStreetPrefix(newOfficialName);

  let housesChanged = 0;
  const updatedHouses = houses.map((house) => {
    const cleanedHouseStreet = cleanStreetPrefix(house.street).toLowerCase();
    if (cleanedHouseStreet === cleanedTarget) {
      housesChanged++;
      return {
        ...house,
        street: cleanedNew,
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
      const cleanedTicketStreet = cleanStreetPrefix(ticket.street).toLowerCase();
      if (cleanedTicketStreet === cleanedTarget) {
        newStreet = cleanedNew;
        changed = true;
      }
    }

    // Also check full address string
    if (ticket.address) {
      const regex = new RegExp(`\\b${targetName}\\b`, 'gi');
      if (regex.test(ticket.address)) {
        newAddress = ticket.address.replace(regex, cleanedNew);
        changed = true;
      } else {
        const cleanedRegex = new RegExp(`\\b${cleanedTarget}\\b`, 'gi');
        if (cleanedRegex.test(ticket.address)) {
          newAddress = ticket.address.replace(cleanedRegex, cleanedNew);
          changed = true;
        }
      }
    }

    if (changed) {
      ticketsChanged++;
      return {
        ...ticket,
        street: newStreet || cleanedNew,
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
