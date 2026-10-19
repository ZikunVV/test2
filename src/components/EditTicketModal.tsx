import React, { useState, useEffect } from 'react';
import { Ticket, ThemeConfig, PersonalPerson, UserItem, StreetItem, House } from '../types';
import {
  canUserSeePhoneStatusBadge,
  canUserManageAccessRights,
  PHONE_STATUS_STYLES,
} from '../utils/phoneAccess';
import {
  normalizeStreetName,
  formatStreetDisplay,
  extractAddressParts,
} from '../utils/streets';
import {
  X,
  Check,
  FileEdit,
  Building,
  MapPin,
  User,
  Calendar,
  Phone,
  AlertCircle,
  AlertTriangle,
  Plus,
  Trash2,
} from 'lucide-react';

interface EditTicketModalProps {
  isOpen: boolean;
  ticket: Ticket | null;
  onClose: () => void;
  onSaveTicket: (updatedTicket: Ticket) => void;
  theme: ThemeConfig;
  currentUser?: UserItem | null;
  people?: PersonalPerson[];
  streets?: StreetItem[];
  houses?: House[];
  onInspectWorker?: (workerName: string) => void;
  canDelete?: boolean;
  onDeleteTicket?: (ticketId: string) => void;
}

export const EditTicketModal: React.FC<EditTicketModalProps> = ({
  isOpen,
  ticket,
  onClose,
  onSaveTicket,
  theme,
  currentUser,
  people = [],
  streets = [],
  houses = [],
  onInspectWorker,
  canDelete = false,
  onDeleteTicket,
}) => {
  if (!isOpen || !ticket) return null;

  const [title, setTitle] = useState(ticket.title || '');
  const [status, setStatus] = useState<Ticket['status']>(ticket.status);
  const [urgency, setUrgency] = useState<Ticket['urgency']>(ticket.urgency || 'normal');

  // Address fields: street, house_number, building, location_type, apartmentNumber, entranceNumber, locationValue
  const [street, setStreet] = useState<string>('');
  const [houseNumber, setHouseNumber] = useState<string>('');
  const [building, setBuilding] = useState<string>('');
  const [isStreetSuggestionsOpen, setIsStreetSuggestionsOpen] = useState(false);
  const [locationType, setLocationType] = useState<
    'apartment' | 'entrance' | 'basement' | 'roof' | 'yard' | 'technical' | 'other'
  >('apartment');
  const [apartmentNumber, setApartmentNumber] = useState('');
  const [entranceNumber, setEntranceNumber] = useState('');
  const [locationValue, setLocationValue] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [date, setDate] = useState(ticket.date || '');
  const [executionDate, setExecutionDate] = useState(ticket.execution_date || '');
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>(() => {
    if (ticket.assignees && ticket.assignees.length > 0) return ticket.assignees;
    if (ticket.assignee && ticket.assignee !== 'Не назначен') {
      return ticket.assignee.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return [];
  });
  const [customWorker, setCustomWorker] = useState('');
  const [phone, setPhone] = useState(ticket.phone || '');
  const [residentName, setResidentName] = useState(ticket.residentName || '');
  const [description, setDescription] = useState(ticket.description || '');
  const [workDescription, setWorkDescription] = useState(ticket.work_description || '');
  const [workMaterials, setWorkMaterials] = useState(ticket.work_materials || '');

  const canSeeStatus = canUserSeePhoneStatusBadge(currentUser);
  const canManage = canUserManageAccessRights(currentUser);

  const [phoneStatus, setPhoneStatus] = useState<number>(ticket.phone_status || 1);
  const [additionalPhones, setAdditionalPhones] = useState<string[]>(ticket.additional_phones || []);
  const [additionalPhoneStatuses, setAdditionalPhoneStatuses] = useState<number[]>(
    ticket.additional_phone_statuses || (ticket.additional_phones || []).map(() => 1)
  );

  // Reset values when ticket changes
  useEffect(() => {
    if (ticket) {
      setTitle(ticket.title || '');
      setStatus(ticket.status);
      setUrgency(ticket.urgency || 'normal');
      setDate(ticket.date || '');
      setExecutionDate(ticket.execution_date || '');

      // Parse address parts
      const parts = extractAddressParts(ticket);
      setStreet(ticket.street || parts.street || '');
      setHouseNumber(ticket.house_number || parts.houseNumber || '');
      setBuilding(ticket.building || parts.building || '');

      // Determine location type and values
      let inferredLocType: 'apartment' | 'entrance' | 'basement' | 'roof' | 'yard' | 'technical' | 'other' = 'apartment';
      if (ticket.location_type) {
        inferredLocType = ticket.location_type as any;
      } else if (parts.locationType) {
        inferredLocType = parts.locationType as any;
      } else {
        const aptLower = (ticket.apartment || '').toLowerCase();
        if (aptLower.includes('подъезд')) inferredLocType = 'entrance';
        else if (aptLower.includes('подвал')) inferredLocType = 'basement';
        else if (aptLower.includes('кровл') || aptLower.includes('крыш')) inferredLocType = 'roof';
        else if (aptLower.includes('двор')) inferredLocType = 'yard';
        else if (aptLower.includes('тех')) inferredLocType = 'technical';
        else inferredLocType = 'apartment';
      }
      setLocationType(inferredLocType);

      if (inferredLocType === 'apartment') {
        const aptClean = (ticket.apartment || parts.apartment || '')
          .replace(/^(?:кв\.|квартира)\s*/i, '')
          .trim();
        setApartmentNumber(aptClean);
        setEntranceNumber('');
        setLocationValue('');
      } else {
        setApartmentNumber('');
        const combined = `${ticket.apartment || ''} ${ticket.location_value || ''}`;
        const entMatch = combined.match(/(?:подъезд|под\.)\s*([0-9]+)/i);
        if (entMatch) {
          setEntranceNumber(entMatch[1]);
        } else if (combined.toLowerCase().includes('все подъезды')) {
          setEntranceNumber('all');
        } else {
          setEntranceNumber('');
        }
        setLocationValue(ticket.location_value || parts.locationValue || '');
      }

      const workers = ticket.assignees && ticket.assignees.length > 0
        ? ticket.assignees
        : ticket.assignee && ticket.assignee !== 'Не назначен'
        ? ticket.assignee.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      setSelectedWorkers(workers);
      setCustomWorker('');
      setPhone(ticket.phone || ticket.residentPhone || '');
      setPhoneStatus(ticket.phone_status || 1);
      setAdditionalPhones(ticket.additional_phones || []);
      setAdditionalPhoneStatuses(
        ticket.additional_phone_statuses || (ticket.additional_phones || []).map(() => 1)
      );
      setResidentName(ticket.residentName || ticket.given_by || '');
      setDescription(ticket.description || '');
      setWorkDescription(ticket.work_description || '');
      setWorkMaterials(ticket.work_materials || '');
      setErrorMessage(null);
    }
  }, [ticket]);

  const handleAddAdditionalPhone = () => {
    setAdditionalPhones([...additionalPhones, '']);
    setAdditionalPhoneStatuses([...additionalPhoneStatuses, 1]);
  };

  const handleUpdateAdditionalPhone = (idx: number, val: string) => {
    const nextPhones = [...additionalPhones];
    nextPhones[idx] = val;
    setAdditionalPhones(nextPhones);
  };

  const handleUpdateAdditionalPhoneStatus = (idx: number, st: number) => {
    const nextStatuses = [...additionalPhoneStatuses];
    nextStatuses[idx] = st;
    setAdditionalPhoneStatuses(nextStatuses);
  };

  const handleRemoveAdditionalPhone = (idx: number) => {
    setAdditionalPhones(additionalPhones.filter((_, i) => i !== idx));
    setAdditionalPhoneStatuses(additionalPhoneStatuses.filter((_, i) => i !== idx));
  };

  // Corporate employees strictly filtered: people from "Личный список дел" must NOT get into available workers
  const corporateEmployees = React.useMemo(() => {
    return (people || []).filter((p) => !p.owner_user_id && !p.owner_surname);
  }, [people]);

  // Extract worker names strictly from corporate employees
  const availableWorkers = React.useMemo(() => {
    return Array.from(
      new Set(
        corporateEmployees
          .map((p) => p.full_name?.trim())
          .filter((name): name is string => Boolean(name && name.length > 0))
      )
    );
  }, [corporateEmployees]);

  // Dynamic professions with actual workers (no empty fields)
  const dynamicProfessions = React.useMemo(() => {
    const profMap = new Map<string, string>();
    corporateEmployees.forEach((p) => {
      const pos = p.position?.trim();
      if (pos && p.full_name?.trim()) {
        const key = pos.toLowerCase();
        if (!profMap.has(key)) {
          const capitalized = pos.charAt(0).toUpperCase() + pos.slice(1);
          profMap.set(key, capitalized);
        }
      }
    });
    return Array.from(profMap.values()).sort((a, b) => a.localeCompare(b, 'ru'));
  }, [corporateEmployees]);

  // Street normalization & suggestions
  const streetNormCheck = React.useMemo(() => {
    return normalizeStreetName(street, streets);
  }, [street, streets]);

  const allKnownStreetItems = React.useMemo(() => {
    const map = new Map<string, { name: string; oldNames: string }>();

    streets.forEach((s) => {
      const clean = (s.current_name || '').trim();
      if (!clean) return;
      map.set(clean.toLocaleLowerCase('ru-RU'), {
        name: clean,
        oldNames: s.old_names || '',
      });
    });

    houses.forEach((h) => {
      const clean = (h.street || '').trim();
      if (!clean) return;
      const key = clean.toLocaleLowerCase('ru-RU');
      if (!map.has(key)) {
        map.set(key, { name: clean, oldNames: '' });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }, [streets, houses]);

  const matchingStreetSuggestions = React.useMemo(() => {
    const query = street.trim().toLocaleLowerCase('ru-RU');
    if (!query) return allKnownStreetItems.slice(0, 10);

    const startsWithList: typeof allKnownStreetItems = [];
    const containsList: typeof allKnownStreetItems = [];

    allKnownStreetItems.forEach((item) => {
      const nameLower = item.name.toLocaleLowerCase('ru-RU');
      const oldLower = (item.oldNames || '').toLocaleLowerCase('ru-RU');
      if (nameLower.startsWith(query)) {
        startsWithList.push(item);
      } else if (nameLower.includes(query) || oldLower.includes(query)) {
        containsList.push(item);
      }
    });

    return [...startsWithList, ...containsList].slice(0, 15);
  }, [street, allKnownStreetItems]);

  const handleAddCustomWorker = () => {
    const trimmed = customWorker.trim();
    if (!trimmed) return;
    if (!selectedWorkers.includes(trimmed)) {
      setSelectedWorkers([...selectedWorkers, trimmed]);
    }
    setCustomWorker('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Ошибка: Укажите название / тему заявки!');
      return;
    }
    if (!street.trim() || !houseNumber.trim()) {
      setErrorMessage('Ошибка: Поля «Улица» и «Номер дома» обязательны для заполнения!');
      return;
    }
    if (locationType === 'apartment' && !apartmentNumber.trim()) {
      setErrorMessage(
        'Ошибка: При уточнении «Квартира» поле «№ квартиры» обязательно для заполнения!'
      );
      return;
    }

    const cleanHouseNum = houseNumber.trim();
    const cleanBuilding = building.trim();
    const finalStreet = streetNormCheck.isNormalized
      ? streetNormCheck.officialName
      : street.trim();

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
          : locationType === 'technical'
          ? 'техэтаж'
          : 'общедомовое';
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

    const fullAddress = `${formatStreetDisplay(finalStreet, streets)}, д. ${cleanHouseNum}${
      cleanBuilding ? ' корп. ' + cleanBuilding : ''
    }, ${locLabel}`;

    const finalAssignees =
      selectedWorkers.length > 0
        ? selectedWorkers
        : customWorker.trim()
        ? [customWorker.trim()]
        : [];
    const finalAssignee =
      finalAssignees.length > 0 ? finalAssignees.join(', ') : 'Не назначен';

    const updatedTicket: Ticket = {
      ...ticket,
      title: title.trim(),
      status,
      urgency,
      address: fullAddress,
      street: finalStreet,
      house_number: cleanHouseNum,
      building: cleanBuilding || undefined,
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
      apartment:
        locationType === 'apartment'
          ? apartmentNumber.trim()
          : locationType === 'entrance' && entranceNumber.trim()
          ? entranceNumber === 'all'
            ? 'Все подъезды'
            : `Подъезд ${entranceNumber.trim()}`
          : undefined,
      date,
      execution_date: executionDate || undefined,
      assignee: finalAssignee,
      assignees: finalAssignees,
      phone: phone.trim() || undefined,
      phone_status: phoneStatus,
      additional_phones: additionalPhones.map((p) => p.trim()).filter(Boolean),
      additional_phone_statuses: additionalPhoneStatuses,
      residentName: residentName.trim() || undefined,
      description: description.trim() || undefined,
      work_description: workDescription.trim() || undefined,
      work_materials: workMaterials.trim() || undefined,
    };

    onSaveTicket(updatedTicket);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start sm:items-center justify-center px-3 py-3 sm:p-4 overflow-y-auto overflow-x-hidden">
      <div
        className="rounded-2xl w-full max-w-[calc(100vw-24px)] sm:max-w-2xl p-3.5 sm:p-6 shadow-2xl border transition-all text-xs my-auto max-h-[92vh] overflow-y-auto overflow-x-hidden box-border"
        style={{
          backgroundColor: theme.keyColors.cardBg,
          borderColor: theme.keyColors.cardBorder,
          color: theme.keyColors.textPrimary,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-purple-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <FileEdit className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                Редактирование заявки
              </span>
              <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                Заявка #{ticket.number}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-black/5 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Title & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">
                Название / Тема заявки <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например: Замена крана на кухне"
                className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300 font-semibold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Статус заявки
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Ticket['status'])}
                className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300 font-bold bg-white"
              >
                <option value="in_waiting">В ожидании</option>
                <option value="in_progress">В работе</option>
                <option value="completed">Выполнена</option>
              </select>
            </div>
          </div>

          {/* Error Message if any */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* SECTION: Адрес объекта в управлении (улица, номер дома, корпус, № квартиры, место уточнения) */}
          <div className="p-3.5 rounded-xl border border-purple-100 bg-[#F9F8FD] space-y-3">
            <div className="font-bold text-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-purple-950 font-extrabold">
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

            {/* Location Type & Specification (Apartment / Entrance / Technical / etc.) */}
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
                      Номер подъезда {locationType === 'entrance' ? <span className="text-rose-500">*</span> : <span className="text-slate-400 font-normal">(если применимо)</span>}
                    </label>
                    <input
                      type="text"
                      value={entranceNumber}
                      onChange={(e) => setEntranceNumber(e.target.value)}
                      placeholder="напр. 1, 2 или «Все»"
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white font-medium focus:ring-2 focus:ring-purple-400"
                      required={locationType === 'entrance'}
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-slate-700">
                    Дополнительное уточнение места
                  </label>
                  <input
                    type="text"
                    value={locationValue}
                    onChange={(e) => setLocationValue(e.target.value)}
                    placeholder="напр. возле электрощитовой, 3-й этаж, теплопункт..."
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Date, Execution Date, Urgency */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-purple-600" />
                <span>Дата подачи</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-purple-600" />
                <span>Срок исполнения</span>
              </label>
              <input
                type="date"
                value={executionDate}
                onChange={(e) => setExecutionDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Срочность
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as Ticket['urgency'])}
                className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
              >
                <option value="low">Низкая</option>
                <option value="normal">Обычная</option>
                <option value="high">Высокая</option>
                <option value="critical">Аварийная</option>
              </select>
            </div>
          </div>

          {/* Assignee Selection (Strictly from People) */}
          <div className="space-y-3 p-3.5 rounded-xl border border-purple-100 bg-[#F9F8FD]">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-purple-600" />
                <span>Исполнитель</span>
              </label>
              <span className="text-[11px] font-semibold text-purple-700">
                Выбрано: {selectedWorkers.length}
              </span>
            </div>

            {/* General dropdown from all people */}
            {availableWorkers.length > 0 ? (
              <div>
                <label className="text-[11px] text-slate-600 font-semibold block mb-1">
                  Выбор из списка сотрудников:
                </label>
                <select
                  value=""
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && !selectedWorkers.includes(val)) {
                      setSelectedWorkers([...selectedWorkers, val]);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white text-xs font-medium"
                >
                  <option value="">-- Выберите сотрудника для назначения --</option>
                  {availableWorkers.map((name) => (
                    <option key={name} value={name}>
                      {name} {selectedWorkers.includes(name) ? '✓ (уже назначен)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 italic">
                В справочнике «Люди» пока нет сотрудников.
              </p>
            )}

            {/* Selection by professions: only professions with actual workers */}
            <div className="pt-2 border-t border-purple-100/80 space-y-2">
              <label className="text-[11px] text-slate-700 font-bold block">
                Выбор по профессиям («Кем работает»):
              </label>
              {dynamicProfessions.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {dynamicProfessions.map((prof) => {
                    const profWorkers = corporateEmployees.filter(
                      (p) =>
                        (p.position || '').trim().toLowerCase() === prof.toLowerCase() &&
                        Boolean(p.full_name?.trim())
                    );
                    return (
                      <div key={prof} className="space-y-1">
                        <div className="text-[11px] font-semibold text-slate-600 flex items-center justify-between">
                          <span>{prof}:</span>
                          <span className="text-[10px] text-slate-400">
                            ({profWorkers.length})
                          </span>
                        </div>
                        <select
                          value=""
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val && !selectedWorkers.includes(val)) {
                              setSelectedWorkers([...selectedWorkers, val]);
                            }
                          }}
                          className="w-full px-3 py-1.5 rounded-xl border border-purple-200 bg-white text-xs font-medium focus:ring-2 focus:ring-purple-400"
                        >
                          <option value="">-- Выбрать: {prof} --</option>
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
              ) : (
                <p className="text-[11px] text-slate-400 italic">
                  Поля по профессиям появятся автоматически при добавлении сотрудников с указанием их должности («Кем работает»).
                </p>
              )}
            </div>

            {/* Custom Manual Input for Assignee (ФИО) */}
            <div className="space-y-1 pt-2 border-t border-purple-100/80">
              <label className="text-[11px] text-slate-600 font-semibold block">
                Или ввести исполнителя вручную:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customWorker}
                  onChange={(e) => setCustomWorker(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomWorker();
                    }
                  }}
                  placeholder="ФИО специалиста..."
                  className="flex-1 px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-300"
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
                      onDoubleClick={() => onInspectWorker && onInspectWorker(w)}
                      title="Двойной клик — полная информация о сотруднике"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-purple-100 text-purple-900 border border-purple-200 font-medium cursor-pointer hover:bg-purple-200 transition-colors"
                    >
                      <span>{w}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedWorkers(selectedWorkers.filter((item) => item !== w));
                        }}
                        className="text-purple-400 hover:text-rose-600 p-0.5"
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

          {/* Resident Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                ФИО заявителя
              </label>
              <input
                type="text"
                value={residentName}
                onChange={(e) => setResidentName(e.target.value)}
                placeholder="Иванов И.И."
                className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-purple-600" />
                  <span>Телефон заявителя</span>
                </label>
                {canSeeStatus && (
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                    Статус {phoneStatus}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+38 (0__) ___-__-__"
                  className="flex-1 px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300 font-mono text-xs"
                />
                {canSeeStatus && (
                  <select
                    value={phoneStatus}
                    disabled={!canManage}
                    onChange={(e) => setPhoneStatus(Number(e.target.value))}
                    className="px-2 py-2 rounded-xl border border-purple-200 bg-purple-50 font-bold text-xs text-purple-950 focus:ring-2 focus:ring-purple-300"
                    title="Цифровой статус номера от 1 до 10"
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((s) => (
                      <option key={s} value={s}>
                        Ур. {s}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Additional phones list */}
              <div className="mt-2 space-y-1.5">
                {additionalPhones.map((ph, idx) => {
                  const st = additionalPhoneStatuses[idx] || 1;
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="tel"
                        value={ph}
                        onChange={(e) => handleUpdateAdditionalPhone(idx, e.target.value)}
                        placeholder="Доп. номер (+38...)"
                        className="flex-1 px-3 py-1.5 rounded-xl border border-purple-200 bg-white font-mono text-xs focus:ring-2 focus:ring-purple-300"
                      />
                      {canSeeStatus && (
                        <select
                          value={st}
                          disabled={!canManage}
                          onChange={(e) =>
                            handleUpdateAdditionalPhoneStatus(idx, Number(e.target.value))
                          }
                          className="px-2 py-1.5 rounded-xl border border-purple-200 bg-purple-50 font-bold text-xs text-purple-950"
                          title="Цифровой статус доп. номера (1-10)"
                        >
                          {Array.from({ length: 10 }, (_, i) => i + 1).map((s) => (
                            <option key={s} value={s}>
                              Ур. {s}
                            </option>
                          ))}
                        </select>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveAdditionalPhone(idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Удалить номер"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={handleAddAdditionalPhone}
                  className="mt-1 text-[11px] font-bold text-purple-700 hover:text-purple-900 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Добавить ещё номер</span>
                </button>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Описание проблемы
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Подробности заявки..."
              className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>

          {/* Work Description & Materials (Acts) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Описание выполненных работ
              </label>
              <textarea
                rows={2}
                value={workDescription}
                onChange={(e) => setWorkDescription(e.target.value)}
                placeholder="Что было сделано..."
                className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Использованные материалы
              </label>
              <textarea
                rows={2}
                value={workMaterials}
                onChange={(e) => setWorkMaterials(e.target.value)}
                placeholder="Трубы, фитинги, муфты..."
                className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-purple-100 flex-wrap">
            {canDelete && onDeleteTicket ? (
              <button
                type="button"
                onClick={() => {
                  onDeleteTicket(ticket.id);
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Удалить заявку (требуется подтверждение)"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Удалить заявку</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-colors cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Сохранить изменения</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
