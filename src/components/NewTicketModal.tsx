import React, { useState, useEffect } from 'react';
import { ThemeConfig, GradientOption, Ticket, House, StreetItem, UserItem, PersonalPerson } from '../types';
import {
  X,
  PlusCircle,
  Building,
  Home,
  AlertTriangle,
  FileText,
  User,
  Phone,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Check,
  Briefcase,
  MapPin,
  Info,
  History,
  AlertCircle,
} from 'lucide-react';
import {
  normalizeStreetName,
  findTicketsForAddress,
  findTicketsForFullAddress,
  isSameFullAddressTicket,
  extractAddressParts,
  getStandardLocationKey,
  cleanStreetPrefix,
  normalizeHouseNumber,
} from '../utils/streets';

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeConfig;
  gradient: GradientOption;
  showFlatFallback: boolean;
  houses: House[];
  streets?: StreetItem[];
  people?: PersonalPerson[];
  tickets?: Ticket[];
  prefilledDate?: string;
  isPlannedDefault?: boolean;
  onCreateTicket: (ticket: Omit<Ticket, 'id' | 'number'>) => void;
  onAddStreet?: (streetName: string) => void;
  canInspectWorker?: boolean;
}

export const NewTicketModal: React.FC<NewTicketModalProps> = ({
  isOpen,
  onClose,
  theme,
  gradient,
  showFlatFallback,
  houses,
  streets = [],
  people = [],
  tickets = [],
  prefilledDate,
  isPlannedDefault = false,
  onCreateTicket,
  onAddStreet,
  canInspectWorker = true,
}) => {
  // Address selection (manual entry with street dropdown suggestions from first letters)
  const [street, setStreet] = useState<string>('');
  const [houseNumber, setHouseNumber] = useState<string>('');
  const [building, setBuilding] = useState<string>('');
  const [isStreetSuggestionsOpen, setIsStreetSuggestionsOpen] = useState(false);
  const [locallyAddedStreets, setLocallyAddedStreets] = useState<string[]>([]);

  // Specific location & apartment validation
  const [locationType, setLocationType] = useState<
    'apartment' | 'entrance' | 'basement' | 'roof' | 'yard' | 'technical'
  >('apartment');
  const [apartmentNumber, setApartmentNumber] = useState('');
  const [entranceNumber, setEntranceNumber] = useState('');
  const [locationValue, setLocationValue] = useState('');

  // Dates: Default to today or prefilled
  const todayStr = new Date().toISOString().slice(0, 10);
  const [requestDate, setRequestDate] = useState<string>(prefilledDate || todayStr);
  const [executionDate, setExecutionDate] = useState<string>('');

  // Contacts & Reporter
  const [givenBy, setGivenBy] = useState('');
  const [mainPhone, setMainPhone] = useState('');
  const [additionalPhones, setAdditionalPhones] = useState<string[]>([]);

  // Executors strictly from the "Люди" directory (no unregistered names, no forced "Главный администратор")
  const availableWorkers = React.useMemo(() => {
    if (!people || people.length === 0) {
      return [];
    }
    const names = Array.from(
      new Set(people.map((p) => p.full_name?.trim()).filter(Boolean))
    );
    return names;
  }, [people]);

  // Dynamic professions from People directory ("Кем работает" / position)
  const dynamicProfessions = React.useMemo(() => {
    const base = ['Сантехник', 'Электрик', 'Каменщик', 'Кровельщик'];
    const set = new Set<string>(base);
    people.forEach((p) => {
      const pos = p.position?.trim();
      if (pos) {
        const exists = Array.from(set).some(
          (item) => item.toLowerCase() === pos.toLowerCase()
        );
        if (!exists) {
          const capitalized = pos.charAt(0).toUpperCase() + pos.slice(1);
          set.add(capitalized);
        }
      }
    });
    return Array.from(set);
  }, [people]);

  // Selected workers: starts empty, no forced default
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [customWorkerInput, setCustomWorkerInput] = useState<string>('');

  // Request core
  const [goal, setGoal] = useState('');
  const [category, setCategory] = useState<Ticket['category']>('water');
  const [urgency, setUrgency] = useState<Ticket['urgency']>('normal');
  const [isPlanned, setIsPlanned] = useState<boolean>(isPlannedDefault);

  // Real-time check if entered street matches an old street name in directory
  const streetNormCheck = React.useMemo(() => {
    return normalizeStreetName(street, streets);
  }, [street, streets]);

  // All unique streets from streets directory, houses, tickets, and user-added streets
  // "при написании новой улицы добавь её в подсказки улицы, что бы при следующем вводе улицы по первым буквам выскакивало полное название улицы"
  const allKnownStreetItems = React.useMemo(() => {
    const map = new Map<
      string,
      { name: string; oldNames: string }
    >();

    // 1. Directory streets
    streets.forEach((s) => {
      const clean = (s.current_name || '').trim();
      if (!clean) return;
      const key = clean.toLocaleLowerCase('ru-RU');
      map.set(key, {
        name: clean,
        oldNames: s.old_names || '',
      });
    });

    // 2. Houses streets
    houses.forEach((h) => {
      const clean = (h.street || '').trim();
      if (!clean) return;
      const key = clean.toLocaleLowerCase('ru-RU');
      if (!map.has(key)) {
        map.set(key, {
          name: clean,
          oldNames: '',
        });
      }
    });

    // 3. Tickets streets
    tickets.forEach((t) => {
      let st = (t.street || '').trim();
      if (!st && t.address) {
        const parts = extractAddressParts(t);
        st = parts.street;
      }
      if (!st) return;
      const key = st.toLocaleLowerCase('ru-RU');
      if (!map.has(key)) {
        map.set(key, {
          name: st,
          oldNames: '',
        });
      }
    });

    // 4. Locally added streets in this session
    locallyAddedStreets.forEach((st) => {
      const clean = st.trim();
      if (!clean) return;
      const key = clean.toLocaleLowerCase('ru-RU');
      if (!map.has(key)) {
        map.set(key, {
          name: clean,
          oldNames: '',
        });
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name, 'ru', { sensitivity: 'base' })
    );
  }, [streets, houses, tickets, locallyAddedStreets]);

  // Autocomplete street suggestions starting from first typed letters (case-insensitive)
  const matchingStreetSuggestions = React.useMemo(() => {
    const raw = street.trim();
    const cleanedQuery = raw
      .replace(/^(?:ул\.|улица|вул\.|вулиця|пр-т|проспект|просп\.|пер\.|переулок|провулок)\s+/i, '')
      .trim()
      .toLocaleLowerCase('ru-RU');

    if (!cleanedQuery) {
      return allKnownStreetItems.slice(0, 10);
    }

    const startsWithList: typeof allKnownStreetItems = [];
    const containsList: typeof allKnownStreetItems = [];

    allKnownStreetItems.forEach((item) => {
      const lowerName = item.name
        .replace(/^(?:ул\.|улица|вул\.|вулиця|пр-т|проспект|просп\.|пер\.|переулок|провулок)\s+/i, '')
        .trim()
        .toLocaleLowerCase('ru-RU');
      const lowerFullName = item.name.toLocaleLowerCase('ru-RU');
      const lowerOld = (item.oldNames || '').toLocaleLowerCase('ru-RU');

      if (lowerName.startsWith(cleanedQuery) || lowerFullName.startsWith(cleanedQuery)) {
        startsWithList.push(item);
      } else if (
        lowerName.includes(cleanedQuery) ||
        lowerFullName.includes(cleanedQuery) ||
        lowerOld.includes(cleanedQuery)
      ) {
        containsList.push(item);
      }
    });

    return [...startsWithList, ...containsList];
  }, [street, allKnownStreetItems]);

  // Collapsible detailed sections (v48.20 rule: can be collapsed by default if empty)
  const [showWorkDetails, setShowWorkDetails] = useState(false);
  const [workDescription, setWorkDescription] = useState('');
  const [workMaterials, setWorkMaterials] = useState('');
  const [futurePlan, setFuturePlan] = useState('');

  // Validation errors
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Inspected worker details modal (double click on assigned worker)
  const [inspectedWorker, setInspectedWorker] = useState<PersonalPerson | { full_name: string; isManual?: boolean } | null>(null);

  const handleInspectWorker = (workerName: string) => {
    if (!canInspectWorker) return;
    const found = people.find(
      (p) => p.full_name?.trim().toLowerCase() === workerName.trim().toLowerCase()
    );
    if (found) {
      setInspectedWorker(found);
    } else {
      setInspectedWorker({ full_name: workerName, isManual: true });
    }
  };

  // Matched house from management registry to know total entrances if configured
  const matchedHouse = React.useMemo(() => {
    if (!street.trim() || !houseNumber.trim()) return null;
    const normSt = cleanStreetPrefix(
      normalizeStreetName(street, streets).officialName || street
    ).trim().toLowerCase();
    const normH = normalizeHouseNumber(houseNumber);
    const normB = normalizeHouseNumber(building);
    return houses.find((h) => {
      const hSt = cleanStreetPrefix(
        normalizeStreetName(h.street, streets).officialName || h.street
      ).trim().toLowerCase();
      const hNum = normalizeHouseNumber(h.house_number);
      const hBld = normalizeHouseNumber(h.building || '');
      return hSt === normSt && hNum === normH && hBld === normB;
    }) || null;
  }, [street, houseNumber, building, houses, streets]);

  const maxEntrancesCount = Math.max(matchedHouse?.entrances_count || 0, 10);

  // Standard location key for 3-indicator exact match
  // "полное совпадение это когда ещё и номер квартиры или место уточнения то есть введено минимум обязательно три показателя ( улица, номер дома, место уточнения )"
  const targetLocationKey = React.useMemo(() => {
    return getStandardLocationKey({
      locationType,
      apartmentNumber,
      entranceNumber,
      locationValue,
    });
  }, [locationType, apartmentNumber, entranceNumber, locationValue]);

  // All tickets for the house (street + house number + building)
  // "когда вводишь название улицы потом пишешь номер дома, сразу после этого появляется надпись (По этому адресу уже есть заявки: 3(нажмите для ознакомления) Ознакомиться)"
  const matchingHouseTickets = React.useMemo(() => {
    if (!street.trim() || !houseNumber.trim()) return [];
    return findTicketsForAddress(
      tickets,
      {
        street,
        houseNumber,
        building,
      },
      streets
    );
  }, [tickets, street, houseNumber, building, streets]);

  // Exact 3-indicator full match tickets (street + house number + location specification)
  // "а полное совпадение это когда ещё и номер квартиры или место уточнения то есть введено минимум обязательно три показателя ( улица, номер дома, место уточнения )"
  const matchingFullAddressTickets = React.useMemo(() => {
    if (!street.trim() || !houseNumber.trim() || !targetLocationKey) return [];
    return findTicketsForFullAddress(
      tickets,
      {
        street,
        houseNumber,
        building,
        locationKey: targetLocationKey,
      },
      streets
    );
  }, [tickets, street, houseNumber, building, targetLocationKey, streets]);

  // Active tickets list for review modal
  const matchingPreviousTickets = React.useMemo(() => {
    if (matchingFullAddressTickets.length > 0) return matchingFullAddressTickets;
    return matchingHouseTickets;
  }, [matchingFullAddressTickets, matchingHouseTickets]);

  const [reviewFilter, setReviewFilter] = useState<'all' | 'full'>('all');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  // If user edits any of the 3 address indicators, reset reviewed flag
  useEffect(() => {
    setHasReviewed(false);
  }, [street, houseNumber, building, targetLocationKey]);

  useEffect(() => {
    if (prefilledDate) {
      setRequestDate(prefilledDate);
      setIsPlanned(true);
    }
  }, [prefilledDate]);

  if (!isOpen) return null;

  const handleAddPhone = () => {
    setAdditionalPhones([...additionalPhones, '']);
  };

  const handleUpdatePhone = (idx: number, val: string) => {
    const updated = [...additionalPhones];
    updated[idx] = val;
    setAdditionalPhones(updated);
  };

  const handleRemovePhone = (idx: number) => {
    setAdditionalPhones(additionalPhones.filter((_, i) => i !== idx));
  };

  const toggleWorker = (w: string) => {
    if (selectedWorkers.includes(w)) {
      setSelectedWorkers(selectedWorkers.filter((item) => item !== w));
    } else {
      setSelectedWorkers([...selectedWorkers, w]);
    }
  };

  const handleAddCustomWorker = () => {
    const trimmed = customWorkerInput.trim();
    if (!trimmed) return;
    if (!selectedWorkers.includes(trimmed)) {
      setSelectedWorkers([...selectedWorkers, trimmed]);
    }
    setCustomWorkerInput('');
  };

  const executeCreateTicket = () => {
    const normalized = normalizeStreetName(street, streets);
    const finalStreet = normalized.officialName || street.trim();
    if (finalStreet) {
      setLocallyAddedStreets((prev) =>
        prev.includes(finalStreet) ? prev : [...prev, finalStreet]
      );
      if (onAddStreet) {
        onAddStreet(finalStreet);
      }
    }
    const cleanHouseNum = houseNumber.trim();
    const cleanBuilding = building.trim();

    let locLabel = '';
    if (locationType === 'apartment') {
      locLabel = `кв. ${apartmentNumber.trim()}`;
    } else {
      const typeName =
        locationType === 'entrance'
          ? 'подъезд'
          : locationType === 'basement'
          ? 'подвал'
          : locationType === 'roof'
          ? 'кровля'
          : locationType === 'yard'
          ? 'двор'
          : 'техэтаж';
      const entLabel = entranceNumber.trim()
        ? entranceNumber === 'all'
          ? 'все подъезды'
          : `подъезд ${entranceNumber.trim()}`
        : '';
      const extraLabel = locationValue.trim();

      if (locationType === 'entrance') {
        locLabel = entLabel || 'подъезд';
        if (extraLabel) locLabel += ` (${extraLabel})`;
      } else {
        const parts = [typeName];
        if (entLabel) parts.push(`(${entLabel})`);
        if (extraLabel) parts.push(`- ${extraLabel}`);
        locLabel = parts.join(' ');
      }
    }

    const fullAddress = `ул. ${finalStreet}, д. ${cleanHouseNum}${
      cleanBuilding ? ' корп. ' + cleanBuilding : ''
    }, ${locLabel}`;

    onCreateTicket({
      date: requestDate || todayStr,
      title: goal.trim(),
      status: 'in_waiting',
      address: fullAddress,
      street: finalStreet,
      house_number: cleanHouseNum,
      building: cleanBuilding || undefined,
      apartment:
        locationType === 'apartment'
          ? apartmentNumber.trim()
          : locationType === 'entrance' && entranceNumber.trim()
          ? entranceNumber === 'all'
            ? 'Все подъезды'
            : `Подъезд ${entranceNumber.trim()}`
          : undefined,
      location_type: locationType,
      location_value:
        locationType === 'apartment'
          ? apartmentNumber.trim()
          : [
              entranceNumber.trim()
                ? entranceNumber === 'all'
                  ? 'Все подъезды'
                  : `Подъезд ${entranceNumber.trim()}`
                : '',
              locationValue.trim(),
            ]
              .filter(Boolean)
              .join(', ') || undefined,
      execution_date: executionDate || undefined,
      phone: mainPhone.trim() || undefined,
      additional_phones: additionalPhones.filter((p) => p.trim().length > 0),
      given_by: givenBy.trim() || undefined,
      assignee: selectedWorkers.length > 0 ? selectedWorkers.join(', ') : 'Не назначен',
      assignees: selectedWorkers,
      category,
      urgency,
      description: goal.trim(),
      work_description: workDescription.trim() || undefined,
      work_materials: workMaterials.trim() || undefined,
      future_plan: futurePlan.trim() || undefined,
      residentName: givenBy.trim() || 'Житель дома',
      residentPhone: mainPhone.trim() || undefined,
      createdTime: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      planned: isPlanned,
      photos: [],
      works: [],
    });

    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!street.trim() || !houseNumber.trim()) {
      setErrorMessage('Ошибка: Поля «Улица» и «Номер дома» обязательны для заполнения!');
      return;
    }

    // Three mandatory indicators validation:
    if (locationType === 'apartment' && !apartmentNumber.trim()) {
      setErrorMessage(
        'Ошибка: При уточнении «Квартира» поле «№ квартиры» обязательно для заполнения!'
      );
      return;
    }

    if (locationType !== 'apartment' && !entranceNumber.trim()) {
      setErrorMessage(
        'Ошибка: Выберите номер подъезда для уточнения места объекта!'
      );
      return;
    }

    if (!goal.trim()) {
      setErrorMessage('Укажите суть / неисправность обращения.');
      return;
    }

    // If there were previous tickets for this address and user hasn't reviewed them yet:
    if (matchingPreviousTickets.length > 0 && !hasReviewed) {
      setShowReviewModal(true);
      return;
    }

    executeCreateTicket();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-black/60 backdrop-blur-xs flex items-start sm:items-center justify-center px-3 py-3 sm:p-4">
      <div
        className="rounded-2xl w-full max-w-[calc(100vw-24px)] sm:max-w-2xl p-3.5 sm:p-6 shadow-2xl border transition-all my-auto max-h-[90vh] overflow-y-auto overflow-x-hidden box-border"
        style={{
          backgroundColor: theme.keyColors.cardBg,
          borderColor: theme.keyColors.cardBorder,
          color: theme.keyColors.textPrimary,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-purple-100">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-2xs shrink-0"
              style={{
                background: showFlatFallback ? '#7652B5' : gradient.cssGradient,
              }}
            >
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Новая заявка (WORKFLOW)
              </h3>
              <p
                className="text-xs"
                style={{ color: theme.keyColors.textSecondary }}
              >
                Создание наряда и назначение исполнителей
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-black/5 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification if validation fails */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* SECTION 1: Address selection and manual inputs */}
          <div className="p-3.5 rounded-xl border border-purple-100 bg-[#F9F8FD] space-y-3">
            <div className="font-bold text-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Building className="w-4 h-4 text-purple-700" />
                <span>Адрес объекта в управлении</span>
              </div>
            </div>


            {/* Separate manual fields for Street, House Number and Building */}
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
              <div className="sm:col-span-3 relative">
                <label className="font-semibold block mb-1 text-slate-700">
                  Улица <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={street}
                    onFocus={() => setIsStreetSuggestionsOpen(true)}
                    onBlur={() => {
                      setTimeout(() => setIsStreetSuggestionsOpen(false), 220);
                    }}
                    onChange={(e) => {
                      setStreet(e.target.value);
                      setIsStreetSuggestionsOpen(true);
                    }}
                    placeholder="Введите улицу (напр. Доценка, Шевченко)"
                    className="w-full px-3 py-2 pr-7 rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium"
                    required
                    autoComplete="off"
                  />
                  {street && (
                    <button
                      type="button"
                      onClick={() => {
                        setStreet('');
                        setIsStreetSuggestionsOpen(false);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
                      title="Очистить улицу"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Выпадающие подсказки улицы с ввода первых букв */}
                {isStreetSuggestionsOpen && matchingStreetSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white rounded-xl border border-purple-200 shadow-xl max-h-56 overflow-y-auto divide-y divide-purple-50 animate-in fade-in duration-100">
                    <div className="px-2.5 py-1.5 bg-purple-50/90 text-[10px] font-extrabold text-purple-800 uppercase tracking-wider flex items-center justify-between sticky top-0 backdrop-blur-xs">
                      <span>Подсказки улиц ({matchingStreetSuggestions.length})</span>
                      <span className="text-[9px] text-purple-600 font-semibold">Нажмите для выбора</span>
                    </div>
                    {matchingStreetSuggestions.map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setStreet(item.name);
                          setIsStreetSuggestionsOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left text-xs hover:bg-purple-50 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="font-extrabold text-slate-900 truncate">
                            {item.name}
                          </div>
                          {item.oldNames && (
                            <div className="text-[10px] text-slate-400 truncate">
                              Прежнее назв.: {item.oldNames}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-bold shrink-0">
                          Выбрать
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {streetNormCheck.isNormalized && (
                  <div className="mt-1 text-[11px] text-purple-800 bg-purple-100/70 px-2.5 py-1 rounded-lg border border-purple-200 flex items-center gap-1 font-medium animate-in fade-in">
                    <span>Прежнее название «{streetNormCheck.matchedOldName}» будет автоматически сохранено как актуальное «{streetNormCheck.officialName}».</span>
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="font-semibold block mb-1 text-slate-700">
                  Номер дома <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={houseNumber}
                  onChange={(e) => setHouseNumber(e.target.value)}
                  placeholder="напр. 1, 5а"
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium"
                  required
                />
              </div>

              <div className="sm:col-span-1">
                <label className="font-semibold block mb-1 text-slate-700">
                  Корпус
                </label>
                <input
                  type="text"
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  placeholder="если есть"
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Появление надписи сразу после ввода улицы и номера дома */}
            {/* "когда вводишь название улицы потом пишешь номер дома, сразу после этого появляется надпись (По этому адресу уже есть заявки: 3(нажмите для ознакомления) Ознакомиться)" */}
            {matchingHouseTickets.length > 0 && (
              <div className="p-2.5 sm:p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-center justify-between gap-2.5 animate-in fade-in">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold">
                      По этому адресу уже есть заявки: {matchingHouseTickets.length}
                      {matchingFullAddressTickets.length > 0 && (
                        <span className="text-amber-800 font-semibold ml-1">
                          (из них с полным совпадением по кв./месту: {matchingFullAddressTickets.length})
                        </span>
                      )}
                    </span>
                    <span className="hidden sm:inline text-amber-800 ml-1">
                      (нажмите для ознакомления)
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (matchingFullAddressTickets.length > 0) {
                      setReviewFilter('full');
                    } else {
                      setReviewFilter('all');
                    }
                    setShowReviewModal(true);
                  }}
                  className="px-2.5 sm:px-3 py-1 bg-amber-200/90 hover:bg-amber-300 text-amber-950 font-bold rounded-lg text-xs transition-colors shrink-0 shadow-2xs flex items-center gap-1 cursor-pointer"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Ознакомиться</span>
                </button>
              </div>
            )}

            {/* Location Type & Specification (Apartment / Entrance / Technical / etc.) */}
            {/* "введи поле выбора номера подъезда, при выборе Место уточнения если это не квартира" */}
            {locationType === 'apartment' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700">
                    Место уточнения <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={locationType}
                    onChange={(e) => {
                      const next = e.target.value as any;
                      setLocationType(next);
                      if (next === 'apartment') {
                        setEntranceNumber('');
                      } else {
                        setApartmentNumber('');
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white font-medium focus:ring-2 focus:ring-purple-400"
                  >
                    <option value="apartment">Квартира</option>
                    <option value="entrance">Подъезд</option>
                    <option value="basement">Подвал</option>
                    <option value="roof">Кровля / Крыша</option>
                    <option value="yard">Двор / Территория</option>
                    <option value="technical">Техэтаж / Чердак</option>
                    <option value="other">Иное общедомовое имущество</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-700">
                    № квартиры <span className="text-rose-600 font-black">(Обязательно *)</span>
                  </label>
                  <input
                    type="text"
                    value={apartmentNumber}
                    onChange={(e) => setApartmentNumber(e.target.value)}
                    placeholder="Введите номер квартиры (напр. 42)"
                    required
                    className={`w-full px-3 py-2 rounded-xl border font-medium bg-white focus:outline-none focus:ring-2 ${
                      !apartmentNumber.trim()
                        ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/20'
                        : 'border-purple-200 focus:ring-purple-400'
                    }`}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold block mb-1 text-slate-700">
                      Место уточнения <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={locationType}
                      onChange={(e) => {
                        const next = e.target.value as any;
                        setLocationType(next);
                        if (next === 'apartment') {
                          setEntranceNumber('');
                        } else {
                          setApartmentNumber('');
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white font-medium focus:ring-2 focus:ring-purple-400"
                    >
                      <option value="apartment">Квартира</option>
                      <option value="entrance">Подъезд</option>
                      <option value="basement">Подвал</option>
                      <option value="roof">Кровля / Крыша</option>
                      <option value="yard">Двор / Территория</option>
                      <option value="technical">Техэтаж / Чердак</option>
                      <option value="other">Иное общедомовое имущество</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1 text-slate-700">
                      Номер подъезда <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={entranceNumber === 'all' ? 'Все' : entranceNumber}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        if (val.toLowerCase() === 'все') {
                          setEntranceNumber('all');
                        } else {
                          setEntranceNumber(val);
                        }
                      }}
                      placeholder="Выберите быстрым выбором или введите"
                      className={`w-full px-3 py-2 rounded-xl border font-bold bg-white focus:outline-none focus:ring-2 text-xs ${
                        !entranceNumber.trim()
                          ? 'border-rose-300 focus:ring-rose-400'
                          : 'border-purple-200 focus:ring-purple-400'
                      }`}
                      required
                    />

                    {/* Quick entrance number selection pills */}
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400">Быстрый выбор:</span>
                      {Array.from(
                        { length: Math.min(matchedHouse?.entrances_count || 10, 12) },
                        (_, i) => i + 1
                      ).map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setEntranceNumber(String(num))}
                          className={`text-[11px] px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                            entranceNumber === String(num)
                              ? 'bg-purple-700 text-white shadow-2xs'
                              : 'bg-purple-100 text-purple-900 hover:bg-purple-200'
                          }`}
                        >
                          №{num}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setEntranceNumber('all')}
                        className={`text-[11px] px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                          entranceNumber === 'all'
                            ? 'bg-purple-700 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Все
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-700 text-[11px]">
                    Дополнительное уточнение места (не обязательно)
                  </label>
                  <input
                    type="text"
                    value={locationValue}
                    onChange={(e) => setLocationValue(e.target.value)}
                    placeholder="напр. стояк отопления, левое крыло, тамбур..."
                    className="w-full px-3 py-1.5 rounded-xl border border-purple-200 bg-white font-medium text-xs focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: Topic & Core Problem */}
          <div className="space-y-3">
            <div>
              <label className="font-bold text-slate-800 block mb-1">
                Цель заявки / Неисправность{' '}
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Например: Забита ливнёвка, течь стояка ХВС, замена ламп..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-semibold block mb-1 text-slate-700">
                  Дата заявки (по умолчанию сегодня)
                </label>
                <input
                  type="date"
                  value={requestDate}
                  onChange={(e) => setRequestDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white font-medium focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700">
                  Дата исполнения
                </label>
                <input
                  type="date"
                  value={executionDate}
                  onChange={(e) => setExecutionDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white font-medium focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700">
                  Срочность
                </label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white font-medium"
                >
                  <option value="normal">Обычная</option>
                  <option value="low">Низкая (плановая)</option>
                  <option value="high">Высокая</option>
                  <option value="critical">Аварийная</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 3: Reporter & Phones */}
          <div className="p-3.5 rounded-xl border border-purple-100 bg-[#F9F8FD] space-y-3">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <User className="w-4 h-4 text-purple-700" />
              <span>Заявитель и контактные телефоны</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold block mb-1 text-slate-700">
                  Кем дана (ФИО жильца или заявителя)
                </label>
                <input
                  type="text"
                  value={givenBy}
                  onChange={(e) => setGivenBy(e.target.value)}
                  placeholder="Иванов Сергей Павлович"
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700">
                  Основной телефон
                </label>
                <input
                  type="tel"
                  value={mainPhone}
                  onChange={(e) => setMainPhone(e.target.value)}
                  placeholder="+38 (0__) ___-__-__"
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Additional phones */}
            {additionalPhones.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-semibold text-slate-500 block">
                  Дополнительные номера:
                </span>
                {additionalPhones.map((ph, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="tel"
                      value={ph}
                      onChange={(e) => handleUpdatePhone(idx, e.target.value)}
                      placeholder="+38 (0__) ___-__-__"
                      className="flex-1 px-3 py-1.5 rounded-xl border border-purple-200 bg-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhone(idx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={handleAddPhone}
              className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1 mt-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Добавить ещё номер телефона</span>
            </button>
          </div>

          {/* SECTION 4: Executors selection */}
          <div className="space-y-3 p-3.5 rounded-xl border border-purple-100 bg-[#F9F8FD]">
            <div className="font-bold text-slate-800 flex items-center justify-between">
              <span>Назначенные исполнители</span>
              <span className="text-[11px] font-semibold text-purple-700">
                Выбрано: {selectedWorkers.length}
              </span>
            </div>

            {/* General dropdown to select from people directory */}
            {availableWorkers.length > 0 ? (
              <div>
                <label className="text-[11px] text-slate-600 font-semibold block mb-1">
                  Выбор из списка сотрудников
                </label>
                <select
                  value=""
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && !selectedWorkers.includes(val)) {
                      setSelectedWorkers([...selectedWorkers, val]);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs font-medium focus:ring-2 focus:ring-purple-400"
                >
                  <option value="">-- Выберите сотрудника для назначения --</option>
                  {availableWorkers.map((w) => (
                    <option key={w} value={w}>
                      {w} {selectedWorkers.includes(w) ? '✓ (уже назначен)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 italic">
                В справочнике «Люди» пока нет сотрудников. Вы можете ввести ФИО исполнителя вручную ниже.
              </p>
            )}

            {/* Selection fields by professions: «сантехник», «электрик», «каменщик», «кровельщик» + dynamic */}
            <div className="pt-2 border-t border-purple-100/80 space-y-2">
              <label className="text-[11px] text-slate-700 font-bold block">
                Выбор по профессиям («Кем работает»):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {dynamicProfessions.map((prof) => {
                  const profWorkers = people.filter(
                    (p) =>
                      (p.position || '').trim().toLowerCase() === prof.toLowerCase() &&
                      Boolean(p.full_name?.trim())
                  );
                  return (
                    <div key={prof} className="space-y-1">
                      <div className="text-[11px] font-semibold text-slate-600 flex items-center justify-between">
                        <span>{prof}:</span>
                        <span className="text-[10px] text-slate-400">
                          {profWorkers.length > 0 ? `(${profWorkers.length})` : '(нет в штате)'}
                        </span>
                      </div>
                      <select
                        value=""
                        disabled={profWorkers.length === 0}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val && !selectedWorkers.includes(val)) {
                            setSelectedWorkers([...selectedWorkers, val]);
                          }
                        }}
                        className="w-full px-3 py-1.5 rounded-xl border border-purple-200 bg-white text-xs font-medium focus:ring-2 focus:ring-purple-400 disabled:bg-slate-50 disabled:text-slate-400"
                      >
                        <option value="">
                          {profWorkers.length === 0
                            ? `-- ${prof} (нет в базе) --`
                            : `-- Выбрать: ${prof} --`}
                        </option>
                        {profWorkers.map((p) => (
                          <option key={p.id} value={p.full_name.trim()}>
                            {p.full_name.trim()} {selectedWorkers.includes(p.full_name.trim()) ? '✓ (назначен)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Manual Input for Assignee (ФИО) */}
            <div className="space-y-1 pt-2 border-t border-purple-100/80">
              <label className="text-[11px] text-slate-600 font-semibold block">
                Или введите ФИО исполнителя вручную:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customWorkerInput}
                  onChange={(e) => setCustomWorkerInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomWorker();
                    }
                  }}
                  placeholder="Введите ФИО исполнителя вручную..."
                  className="flex-1 px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                <button
                  type="button"
                  onClick={handleAddCustomWorker}
                  className="px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-2xs transition-colors shrink-0"
                >
                  + Добавить
                </button>
              </div>
            </div>

            {/* Currently Selected workers summary - allows 2 or more workers */}
            {selectedWorkers.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-purple-100/80">
                <div className="flex items-center justify-between text-[11px] font-semibold">
                  <span className="text-slate-600">
                    Назначены на заявку ({selectedWorkers.length}):
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedWorkers([])}
                    className="text-rose-500 hover:text-rose-700 text-[10px] font-semibold"
                  >
                    Очистить всех
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {selectedWorkers.map((w) => (
                    <span
                      key={w}
                      onDoubleClick={() => handleInspectWorker(w)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-purple-100 text-purple-900 border border-purple-200 font-medium cursor-pointer hover:bg-purple-200/90 transition-colors select-none"
                      title="Двойной клик — просмотр полной информации о сотруднике"
                    >
                      <span onDoubleClick={() => handleInspectWorker(w)}>{w}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedWorkers(selectedWorkers.filter((item) => item !== w));
                        }}
                        className="text-purple-400 hover:text-rose-600 p-0.5 ml-0.5"
                        title="Удалить исполнителя"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 5: Planned work checkbox */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-purple-50/50 border border-purple-200">
            <input
              type="checkbox"
              id="is_planned_checkbox"
              checked={isPlanned}
              onChange={(e) => setIsPlanned(e.target.checked)}
              className="w-4 h-4 rounded accent-purple-700 cursor-pointer"
            />
            <label
              htmlFor="is_planned_checkbox"
              className="text-xs font-semibold text-purple-900 cursor-pointer select-none"
            >
              Плановая работа (отображать в разделе «Плановые работы» и календаре)
            </label>
          </div>

          {/* SECTION 6: Collapsible detailed specs: works, materials, future plan */}
          <div className="border border-purple-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowWorkDetails(!showWorkDetails)}
              className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between font-semibold text-slate-700 transition-colors"
            >
              <span>Работы по заявке, материалы и планы (дополнительно)</span>
              {showWorkDetails ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {showWorkDetails && (
              <div className="p-4 space-y-3 bg-white border-t border-purple-100">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700">
                    Работы по заявке
                  </label>
                  <textarea
                    rows={2}
                    value={workDescription}
                    onChange={(e) => setWorkDescription(e.target.value)}
                    placeholder="Описание выполняемых действий..."
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-[#F9F8FD] resize-none"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-700">
                    Материалы
                  </label>
                  <textarea
                    rows={2}
                    value={workMaterials}
                    onChange={(e) => setWorkMaterials(e.target.value)}
                    placeholder="Трубы, муфты, прокладки, кабель..."
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-[#F9F8FD] resize-none"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-700">
                    План на будущее
                  </label>
                  <textarea
                    rows={2}
                    value={futurePlan}
                    onChange={(e) => setFuturePlan(e.target.value)}
                    placeholder="Требуется кап. ремонт в следующем сезоне..."
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-[#F9F8FD] resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-purple-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl text-white font-bold transition-all shadow-xs hover:opacity-95"
              style={{
                background: showFlatFallback ? '#7652B5' : gradient.cssGradient,
                boxShadow: showFlatFallback ? 'none' : gradient.glowShadow,
              }}
            >
              Создать заявку
            </button>
          </div>
        </form>

        {/* EMPLOYEE INFO MODAL (ON DOUBLE CLICK ON ASSIGNED WORKER) */}
        {inspectedWorker && (
          <div
            className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={(e) => {
              e.stopPropagation();
              setInspectedWorker(null);
            }}
          >
            <div
              className="bg-white rounded-2xl max-w-md w-full p-5 border border-purple-200 shadow-2xl space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-purple-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                      Карточка сотрудника
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                      {'full_name' in inspectedWorker ? inspectedWorker.full_name : ''}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectedWorker(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {'position' in inspectedWorker && inspectedWorker.position && (
                  <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-100">
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      Кем работает / Должность
                    </span>
                    <span className="font-bold text-slate-900 flex items-center gap-1.5 mt-0.5 text-xs">
                      <Briefcase className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>{inspectedWorker.position}</span>
                    </span>
                  </div>
                )}

                {'organization' in inspectedWorker && inspectedWorker.organization && (
                  <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-100">
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      Организация / Где работает
                    </span>
                    <span className="font-bold text-slate-900 flex items-center gap-1.5 mt-0.5 text-xs">
                      <Building className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>{inspectedWorker.organization}</span>
                    </span>
                  </div>
                )}

                {'residence_address' in inspectedWorker && inspectedWorker.residence_address && (
                  <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-100">
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      Адрес проживания
                    </span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5 text-xs">
                      <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>{inspectedWorker.residence_address}</span>
                    </span>
                  </div>
                )}

                {'phones' in inspectedWorker && inspectedWorker.phones && inspectedWorker.phones.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-100">
                    <span className="text-[10px] text-slate-400 block font-semibold mb-1">
                      Контакты / Телефоны
                    </span>
                    <div className="space-y-1">
                      {inspectedWorker.phones.map((phone, i) => (
                        <a
                          key={i}
                          href={`tel:${phone}`}
                          className="flex items-center gap-1.5 text-purple-700 font-mono font-bold text-xs hover:underline"
                        >
                          <Phone className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          <span>{phone}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {'notes' in inspectedWorker && inspectedWorker.notes && (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-semibold mb-0.5">
                      Примечания / Сведения
                    </span>
                    <p className="text-slate-700 text-xs leading-relaxed">
                      {inspectedWorker.notes}
                    </p>
                  </div>
                )}

                {'isManual' in inspectedWorker && inspectedWorker.isManual && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                    Исполнитель был введён вручную. В корпоративном справочнике «Сотрудники» подробная карточка отсутствует.
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end pt-2 border-t border-purple-100">
                <button
                  type="button"
                  onClick={() => setInspectedWorker(null)}
                  className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold transition-all shadow-xs"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        )}
        {/* PREVIOUS TICKETS REVIEW MODAL */}
        {showReviewModal && (
          <div
            className="fixed inset-0 z-70 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
            onClick={() => setShowReviewModal(false)}
          >
            <div
              className="bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-6 border border-amber-200 shadow-2xl space-y-4 text-xs animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-amber-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black shrink-0">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                      История обращений по точному адресу и месту уточнения
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                      ул. {street}, д. {houseNumber}{building ? ` корп. ${building}` : ''}
                      {locationType === 'apartment' && apartmentNumber ? `, кв. ${apartmentNumber}` : ''}
                      {locationType !== 'apartment' && entranceNumber ? `, подъезд ${entranceNumber}` : ''}
                      {locationValue ? ` (${locationValue})` : ''}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2 shrink-0 flex-wrap">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Найдено заявок по адресу: <strong>{matchingHouseTickets.length}</strong>
                    {matchingFullAddressTickets.length > 0 && (
                      <span className="ml-1 text-amber-900 font-bold">
                        (из них с полным совпадением кв./места: {matchingFullAddressTickets.length})
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Tabs for switching between all house tickets and full match tickets */}
              {matchingFullAddressTickets.length > 0 && (
                <div className="flex items-center gap-2 border-b border-amber-100 pb-2">
                  <button
                    type="button"
                    onClick={() => setReviewFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      reviewFilter === 'all'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                    }`}
                  >
                    Все по дому ({matchingHouseTickets.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewFilter('full')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      reviewFilter === 'full'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                    }`}
                  >
                    <span>⭐ Полное совпадение: кв./место</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-white text-amber-900 font-extrabold text-[10px]">
                      {matchingFullAddressTickets.length}
                    </span>
                  </button>
                </div>
              )}

              <div className="overflow-y-auto pr-1 space-y-2.5 flex-1 min-h-0 max-h-[50vh]">
                {(reviewFilter === 'full' && matchingFullAddressTickets.length > 0
                  ? matchingFullAddressTickets
                  : matchingHouseTickets
                ).map((t: Ticket) => {
                  const isFullMatch = isSameFullAddressTicket(
                    t,
                    street,
                    houseNumber,
                    building,
                    targetLocationKey,
                    streets
                  );

                  const statusBadgeClass =
                    t.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : t.status === 'in_progress'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-rose-100 text-rose-800 border-rose-300';

                  const statusText =
                    t.status === 'completed'
                      ? 'Выполнена'
                      : t.status === 'in_progress'
                      ? 'В работе'
                      : 'В ожидании';

                  return (
                    <div
                      key={t.id}
                      className={`p-3 rounded-xl border transition-all ${
                        isFullMatch
                          ? 'border-amber-400 bg-amber-50/70 shadow-xs ring-2 ring-amber-300'
                          : 'border-slate-200 bg-white hover:border-purple-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-slate-900 text-xs">
                            № {t.number}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadgeClass}`}
                          >
                            {statusText}
                          </span>
                          {t.planned && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                              Плановая
                            </span>
                          )}
                          {isFullMatch ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-600 text-white shadow-2xs flex items-center gap-1">
                              <span>⭐ Полное совпадение адреса!</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                              {t.apartment ? `кв. ${t.apartment}` : t.location_value || 'Другое место в доме'}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {t.date} {t.createdTime || ''}
                        </div>
                      </div>

                      <div className="font-bold text-slate-800 text-xs mb-1">
                        {t.title}
                      </div>

                      {t.description && t.description !== t.title && (
                        <div className="text-slate-600 text-[11px] mb-1.5 line-clamp-2">
                          {t.description}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-slate-500 pt-1.5 border-t border-slate-100">
                        <div>
                          <span className="text-slate-400">Место:</span>{' '}
                          <span className="font-semibold text-slate-700">
                            {t.apartment ? `кв. ${t.apartment}` : t.location_value || 'Общедомовая'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Исполнитель:</span>{' '}
                          <span className="font-semibold text-slate-700">
                            {t.assignee || 'Не назначен'}
                          </span>
                        </div>
                        {(t.residentName || t.given_by) && (
                          <div className="sm:col-span-2">
                            <span className="text-slate-400">Заявитель:</span>{' '}
                            <span className="font-semibold text-slate-700">
                              {t.residentName || t.given_by}
                            </span>
                            {t.phone && (
                              <span className="font-mono text-purple-700 ml-1 font-bold">
                                ({t.phone})
                              </span>
                            )}
                          </div>
                        )}
                        {t.worker_report && (
                          <div className="sm:col-span-2 text-emerald-800 bg-emerald-50/70 p-1.5 rounded-lg border border-emerald-100 mt-1">
                            <span className="font-bold">Отчёт:</span> {t.worker_report}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-amber-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold transition-colors text-xs"
                >
                  ← Вернуться к заявке
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHasReviewed(true);
                    setShowReviewModal(false);
                    executeCreateTicket();
                  }}
                  className="w-full sm:w-auto px-5 py-2 rounded-xl text-white font-bold transition-all shadow-md hover:opacity-95 text-xs flex items-center justify-center gap-1.5"
                  style={{
                    background: showFlatFallback ? '#7652B5' : gradient.cssGradient,
                  }}
                >
                  <Check className="w-4 h-4" />
                  <span>Ознакомился, создать заявку</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
