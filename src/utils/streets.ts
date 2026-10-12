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
