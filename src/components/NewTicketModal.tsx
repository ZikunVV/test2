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
} from 'lucide-react';
import { normalizeStreetName } from '../utils/streets';

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeConfig;
  gradient: GradientOption;
  showFlatFallback: boolean;
  houses: House[];
  streets?: StreetItem[];
  people?: PersonalPerson[];
  prefilledDate?: string;
  isPlannedDefault?: boolean;
  onCreateTicket: (ticket: Omit<Ticket, 'id' | 'number'>) => void;
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
  prefilledDate,
  isPlannedDefault = false,
  onCreateTicket,
  canInspectWorker = true,
}) => {
  // Sorted houses in alphabetical order (by street, house number, building)
  const sortedHouses = React.useMemo(() => {
    return [...houses].sort((a, b) => {
      const streetCmp = (a.street || '').localeCompare(b.street || '', 'ru', { numeric: true, sensitivity: 'base' });
      if (streetCmp !== 0) return streetCmp;
      const numCmp = (a.house_number || '').localeCompare(b.house_number || '', 'ru', { numeric: true, sensitivity: 'base' });
      if (numCmp !== 0) return numCmp;
      return (a.building || '').localeCompare(b.building || '', 'ru', { numeric: true, sensitivity: 'base' });
    });
  }, [houses]);

  // Address selection
  const [selectedHouseId, setSelectedHouseId] = useState<string>(houses[0]?.id || '');
  const [street, setStreet] = useState<string>(houses[0]?.street || '');
  const [houseNumber, setHouseNumber] = useState<string>(houses[0]?.house_number || '');
  const [building, setBuilding] = useState<string>(houses[0]?.building || '');

  // Specific location & apartment validation
  const [locationType, setLocationType] = useState<
    'apartment' | 'entrance' | 'basement' | 'roof' | 'yard' | 'technical'
  >('apartment');
  const [apartmentNumber, setApartmentNumber] = useState('');
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

  // Sync house selection
  useEffect(() => {
    if (selectedHouseId) {
      const h = houses.find((item) => item.id === selectedHouseId);
      if (h) {
        setStreet(h.street);
        setHouseNumber(h.house_number);
        setBuilding(h.building || '');
      }
    }
  }, [selectedHouseId, houses]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!street.trim() || !houseNumber.trim()) {
      setErrorMessage('Ошибка: Поля «Улица» и «Номер дома» обязательны для заполнения!');
      return;
    }

    // v48.20 strict validation:
    // If Location Type is 'apartment', apartment number is strictly required!
    if (locationType === 'apartment' && !apartmentNumber.trim()) {
      setErrorMessage(
        'Ошибка: При уточнении «Квартира» поле «№ квартиры» обязательно для заполнения!'
      );
      return;
    }

    if (!goal.trim()) {
      setErrorMessage('Укажите суть / неисправность обращения.');
      return;
    }

    const normalized = normalizeStreetName(street, streets);
    const finalStreet = normalized.officialName || street.trim();
    const cleanHouseNum = houseNumber.trim();
    const cleanBuilding = building.trim();
    const fullAddress = `ул. ${finalStreet}, д. ${cleanHouseNum}${cleanBuilding ? ' корп. ' + cleanBuilding : ''}`;

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
          : locationType === 'entrance'
          ? `Подъезд ${locationValue || '1'}`
          : locationType === 'basement'
          ? 'Подвал'
          : locationType === 'roof'
          ? 'Кровля'
          : locationType === 'yard'
          ? 'Двор'
          : 'Техэтаж',
      location_type: locationType,
      location_value: locationValue.trim(),
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        className="rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border transition-all my-8 max-h-[90vh] overflow-y-auto"
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

            {/* Quick prefill from registry if houses exist */}
            {houses.length > 0 && (
              <div>
                <label className="font-semibold block mb-1 text-slate-500 text-[11px]">
                  Быстрый выбор из реестра домов:
                </label>
                <select
                  value={selectedHouseId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedHouseId(id);
                    const h = houses.find((item) => item.id === id);
                    if (h) {
                      setStreet(h.street);
                      setHouseNumber(h.house_number);
                      setBuilding(h.building || '');
                    }
                  }}
                  className="w-full px-3 py-1.5 rounded-xl border border-purple-200 bg-white font-medium text-xs focus:ring-2 focus:ring-purple-400"
                >
                  <option value="">-- Заполнить адрес вручную или выбрать из реестра --</option>
                  {sortedHouses.map((h) => (
                    <option key={h.id} value={h.id}>
                      ул. {h.street}, д. {h.house_number}
                      {h.building ? ` корп. ${h.building}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Separate manual fields for Street, House Number and Building */}
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
              <div className="sm:col-span-3">
                <label className="font-semibold block mb-1 text-slate-700">
                  Улица <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  list="new-ticket-street-suggestions"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Введите улицу (напр. Доценка)"
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium"
                  required
                />
                <datalist id="new-ticket-street-suggestions">
                  {streets.map((s) => (
                    <option key={s.id} value={s.current_name}>
                      {s.current_name} {s.old_names ? `(ранее: ${s.old_names})` : ''}
                    </option>
                  ))}
                </datalist>
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

            {/* Location Type and Apartment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="font-semibold block mb-1 text-slate-700">
                  Место уточнения <span className="text-rose-500">*</span>
                </label>
                <select
                  value={locationType}
                  onChange={(e) =>
                    setLocationType(e.target.value as any)
                  }
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white font-medium focus:ring-2 focus:ring-purple-400"
                >
                  <option value="apartment">Квартира</option>
                  <option value="entrance">Подъезд</option>
                  <option value="basement">Подвал</option>
                  <option value="roof">Кровля</option>
                  <option value="yard">Двор</option>
                  <option value="technical">Техэтаж</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700">
                  № квартиры{' '}
                  {locationType === 'apartment' ? (
                    <span className="text-rose-600 font-black">
                      (Обязательно *)
                    </span>
                  ) : (
                    <span className="text-slate-400 font-normal">
                      (не обязательно)
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={apartmentNumber}
                  onChange={(e) => setApartmentNumber(e.target.value)}
                  placeholder={
                    locationType === 'apartment'
                      ? 'Введите номер квартиры'
                      : 'Дополнительное уточнение'
                  }
                  required={locationType === 'apartment'}
                  className={`w-full px-3 py-2 rounded-xl border font-medium bg-white focus:outline-none focus:ring-2 ${
                    locationType === 'apartment' && !apartmentNumber.trim()
                      ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/20'
                      : 'border-purple-200 focus:ring-purple-400'
                  }`}
                />
              </div>
            </div>
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
      </div>
    </div>
  );
};
