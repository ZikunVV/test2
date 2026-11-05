import React, { useState, useMemo } from 'react';
import { ThemeConfig, GradientOption, Ticket, UserItem, StreetItem } from '../../types';
import { PhoneBadgeDisplay } from '../PhoneBadgeDisplay';
import {
  extractAddressParts,
  normalizeHouseNumber,
  normalizeStreetName,
  canonicalStreetKey,
  cleanStreetPrefix,
  formatTicketAddressWithNewStreet,
  replaceOldStreetNamesInTicket,
  replaceAllOldStreetNamesInTickets,
  DEFAULT_STREETS,
} from '../../utils/streets';
import {
  Search,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Filter,
  RotateCcw,
  User,
  MapPin,
  LayoutGrid,
  StretchHorizontal,
  Trash2,
  ArrowUpDown,
  Sparkles,
  RefreshCw,
  X,
} from 'lucide-react';

interface SearchViewProps {
  theme: ThemeConfig;
  gradient: GradientOption;
  showFlatFallback: boolean;
  tickets: Ticket[];
  streets?: StreetItem[];
  currentUser?: UserItem | null;
  canDelete?: boolean;
  onDeleteTicket?: (ticketId: string) => void;
  onOpenTicket: (ticket: Ticket) => void;
  onInspectWorker?: (workerName: string) => void;
  onUpdateTicketPhoneStatus?: (
    ticketId: string,
    newStatus: number,
    isAdditional?: boolean,
    additionalIndex?: number
  ) => void;
  onBatchUpdateTickets?: (updatedTickets: Ticket[]) => void;
  onBackToHome: () => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  theme,
  gradient,
  showFlatFallback,
  tickets,
  streets = [],
  currentUser,
  canDelete = false,
  onDeleteTicket,
  onOpenTicket,
  onInspectWorker,
  onUpdateTicketPhoneStatus,
  onBatchUpdateTickets,
  onBackToHome,
}) => {
  // Base streets combined with default streets
  const baseStreets = useMemo(() => {
    return streets && streets.length > 0 ? streets : DEFAULT_STREETS;
  }, [streets]);

  // Search filters for completed work
  const [query, setQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reqNo, setReqNo] = useState('');
  const [executor, setExecutor] = useState('');
  const [street, setStreet] = useState('');
  const [houseNo, setHouseNo] = useState('');
  const [building, setBuilding] = useState('');
  const [apartment, setApartment] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Street autocomplete & auto-renaming state
  const [isStreetSuggestionsOpen, setIsStreetSuggestionsOpen] = useState(false);
  const [renamedNotice, setRenamedNotice] = useState<{ oldName: string; newName: string } | null>(null);

  // Layout mode for Completed work cards: 'compact' (grid) vs 'expanded' (full width rows)
  const [completedCardLayout, setCompletedCardLayout] = useState<'compact' | 'expanded'>(() => {
    try {
      const saved = localStorage.getItem('app_completed_card_layout') || localStorage.getItem('app_card_layout_mode');
      if (saved === 'compact' || saved === 'expanded') return saved;
    } catch (e) {}
    return 'expanded';
  });

  const handleSetCompletedCardLayout = (mode: 'compact' | 'expanded') => {
    setCompletedCardLayout(mode);
    try {
      localStorage.setItem('app_completed_card_layout', mode);
      localStorage.setItem('app_card_layout_mode', mode);
    } catch (e) {}
  };

  // Only completed requests (v48.10 & v48.16 rule: only completed work, personal tasks excluded)
  // Ensure that every completed ticket immediately has any old street names replaced with new official names!
  const completedTickets = useMemo(() => {
    return tickets
      .filter((t) => t.status === 'completed')
      .map((t) => replaceOldStreetNamesInTicket(t, baseStreets).ticket);
  }, [tickets, baseStreets]);

  // Streets known in directory and existing completed tickets
  const allKnownStreetItems = useMemo(() => {
    const map = new Map<string, { name: string; oldNames: string }>();

    baseStreets.forEach((s) => {
      const clean = (s.current_name || '').trim();
      if (!clean) return;
      const key = clean.toLocaleLowerCase('ru-RU');
      map.set(key, {
        name: clean,
        oldNames: s.old_names || '',
      });
    });

    completedTickets.forEach((t) => {
      let st = (t.street || '').trim();
      if (!st && t.address) {
        const parts = extractAddressParts(t);
        st = parts.street;
      }
      if (st) {
        const norm = normalizeStreetName(st, baseStreets);
        const official = norm.officialName || st;
        const key = official.toLocaleLowerCase('ru-RU');
        if (!map.has(key)) {
          map.set(key, { name: official, oldNames: '' });
        }
      }
    });

    return Array.from(map.values());
  }, [baseStreets, completedTickets]);

  const matchingStreetSuggestions = useMemo(() => {
    const rawQ = street.trim().toLowerCase();
    if (!rawQ || rawQ.length < 1) return [];

    return allKnownStreetItems.filter((item) => {
      const nameMatch = item.name.toLowerCase().includes(rawQ);
      const oldMatch = item.oldNames.toLowerCase().includes(rawQ);
      const keyMatch = canonicalStreetKey(item.name).includes(canonicalStreetKey(rawQ));
      return nameMatch || oldMatch || keyMatch;
    });
  }, [street, allKnownStreetItems]);

  const handleStreetChange = (value: string) => {
    setStreet(value);
    setIsStreetSuggestionsOpen(true);

    // Instant normalization check: if typed text matches an old street name
    const norm = normalizeStreetName(value, baseStreets);
    if (norm.isNormalized && norm.officialName && norm.matchedOldName) {
      const cleanVal = cleanStreetPrefix(value).toLowerCase();
      const cleanOld = cleanStreetPrefix(norm.matchedOldName).toLowerCase();
      // If user typed the full old name or a recognized complete alias
      if (cleanVal === cleanOld || value.trim().toLowerCase() === norm.matchedOldName.toLowerCase()) {
        setStreet(norm.officialName);
        setRenamedNotice({ oldName: norm.matchedOldName, newName: norm.officialName });
        setIsStreetSuggestionsOpen(false);
        return;
      }
    }
    if (renamedNotice) {
      setRenamedNotice(null);
    }
  };

  const handleStreetBlur = () => {
    setTimeout(() => {
      setIsStreetSuggestionsOpen(false);
    }, 200);

    if (!street.trim()) return;

    const norm = normalizeStreetName(street, baseStreets);
    if (norm.isNormalized && norm.officialName && norm.officialName !== street) {
      setStreet(norm.officialName);
      setRenamedNotice({
        oldName: norm.matchedOldName || street,
        newName: norm.officialName,
      });
    }
  };

  const handleSelectStreetSuggestion = (item: { name: string; oldNames: string }) => {
    setStreet(item.name);
    setIsStreetSuggestionsOpen(false);
    if (item.oldNames) {
      setRenamedNotice({
        oldName: item.oldNames.split(/[,;]/)[0]?.trim() || item.oldNames,
        newName: item.name,
      });
    }
  };

  // Detect completed tickets that contain old street names
  const completedTicketsWithOldStreets = useMemo(() => {
    return completedTickets.filter((t) => {
      const res = replaceOldStreetNamesInTicket(t, baseStreets);
      return res.changed;
    });
  }, [completedTickets, baseStreets]);

  const handleMigrateAllOldStreets = () => {
    const { updatedTickets, changedCount } = replaceAllOldStreetNamesInTickets(tickets, baseStreets);
    if (changedCount > 0 && onBatchUpdateTickets) {
      onBatchUpdateTickets(updatedTickets);
    }
  };

  // Sorting state: 'desc' (от большего номера к меньшему) vs 'asc' (от меньшего к большему)
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const filteredTickets = completedTickets
    .filter((t) => {
      if (query) {
        const q = query.toLowerCase();
        const parts = extractAddressParts(t);
        const match =
          t.number.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          t.address.toLowerCase().includes(q) ||
          (t.building || parts.building || '').toLowerCase().includes(q) ||
          (t.apartment || parts.apartment || '').toLowerCase().includes(q) ||
          t.assignee.toLowerCase().includes(q) ||
          (t.description || '').toLowerCase().includes(q) ||
          ((t.planned || t.category === 'general') && 'плановые'.includes(q));
        if (!match) return false;
      }
      if (dateFrom && t.date < dateFrom) return false;
      if (dateTo && t.date > dateTo) return false;
      if (reqNo && !t.number.toLowerCase().includes(reqNo.toLowerCase()))
        return false;
      if (executor && !t.assignee.toLowerCase().includes(executor.toLowerCase()))
        return false;

      // Address granular filtering: Street, House No, Building, Apartment
      if (street || houseNo || building || apartment) {
        const parts = extractAddressParts(t);

        if (street) {
          const normQuery = street.trim().toLowerCase();
          const queryNorm = normalizeStreetName(street, baseStreets);
          const officialKey = canonicalStreetKey(queryNorm.officialName || street);

          // Find street in directory to get all historical aliases
          const foundStreetItem = baseStreets.find(
            (s) => canonicalStreetKey(s.current_name) === officialKey
          );
          const oldAliases = foundStreetItem?.old_names
            ? foundStreetItem.old_names.split(/[,;]/).map((a) => cleanStreetPrefix(a).toLowerCase().trim()).filter(Boolean)
            : [];

          const tOfficialNorm = normalizeStreetName(t.street || parts.street || '', baseStreets);
          const tOfficialKey = canonicalStreetKey(tOfficialNorm.officialName || t.street || parts.street || '');

          const matchStreet =
            // Canonical official key match
            (officialKey && tOfficialKey && officialKey === tOfficialKey) ||
            // Direct substring match
            (t.street && t.street.toLowerCase().includes(normQuery)) ||
            (parts.street && parts.street.toLowerCase().includes(normQuery)) ||
            (t.address && t.address.toLowerCase().includes(normQuery)) ||
            // Or matches any known old alias
            oldAliases.some(
              (alias) =>
                (t.street && t.street.toLowerCase().includes(alias)) ||
                (t.address && t.address.toLowerCase().includes(alias))
            );

          if (!matchStreet) return false;
        }

        if (houseNo) {
          const cleanHouse = houseNo.trim().toLowerCase();
          const normHouse = normalizeHouseNumber(cleanHouse);
          const tHouse = (t.house_number || parts.houseNumber || '').toLowerCase();
          const matchHouse =
            tHouse === cleanHouse ||
            normalizeHouseNumber(tHouse) === normHouse ||
            tHouse.includes(cleanHouse) ||
            (t.address && t.address.toLowerCase().includes(cleanHouse));
          if (!matchHouse) return false;
        }

        if (building) {
          const cleanBld = building.trim().toLowerCase();
          const normBld = normalizeHouseNumber(cleanBld);
          const tBld = (t.building || parts.building || '').toLowerCase();
          const addrLower = (t.address || '').toLowerCase();
          const matchBld =
            tBld === cleanBld ||
            normalizeHouseNumber(tBld) === normBld ||
            tBld.includes(cleanBld) ||
            addrLower.includes(`корп. ${cleanBld}`) ||
            addrLower.includes(`корп.${cleanBld}`) ||
            addrLower.includes(`корпус ${cleanBld}`) ||
            addrLower.includes(`к. ${cleanBld}`) ||
            addrLower.includes(`к.${cleanBld}`) ||
            addrLower.includes(`/${cleanBld}`);
          if (!matchBld) return false;
        }

        if (apartment) {
          const cleanApt = apartment.trim().toLowerCase();
          const normApt = normalizeHouseNumber(cleanApt);
          const tApt = (t.apartment || parts.apartment || '').toLowerCase();
          const addrLower = (t.address || '').toLowerCase();
          const locValLower = (t.location_value || '').toLowerCase();
          const matchApt =
            tApt === cleanApt ||
            normalizeHouseNumber(tApt) === normApt ||
            tApt.includes(cleanApt) ||
            locValLower.includes(cleanApt) ||
            addrLower.includes(`кв. ${cleanApt}`) ||
            addrLower.includes(`кв.${cleanApt}`) ||
            addrLower.includes(`квартира ${cleanApt}`);
          if (!matchApt) return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      const numA = a.number || '';
      const numB = b.number || '';
      const cmp = numA.localeCompare(numB, undefined, { numeric: true, sensitivity: 'base' });
      return sortOrder === 'desc' ? -cmp : cmp;
    });

  const handleResetFilters = () => {
    setQuery('');
    setDateFrom('');
    setDateTo('');
    setReqNo('');
    setExecutor('');
    setStreet('');
    setHouseNo('');
    setBuilding('');
    setApartment('');
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between pb-3 border-b border-purple-100">
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={onBackToHome}
            className="flex items-center gap-1 font-semibold text-purple-700 hover:text-purple-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Главная</span>
          </button>
          <span className="text-slate-300">/</span>
          <span className="font-bold text-slate-800">
            Поиск выполненных работ
          </span>
        </div>
      </div>

      {/* Header and Filter Form */}
      <div className="bg-white p-5 rounded-2xl border border-purple-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Поиск выполненных работ</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Архив завершённых заявок и ремонтов. Личные дела в этот поиск не входят.
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1 self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Сбросить фильтры</span>
          </button>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="sm:col-span-2">
            <label className="font-bold text-slate-700 block mb-1">
              Текстовый поиск
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-purple-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Слова из заявки, адрес, работа, мастер..."
                  className="w-full pl-9 pr-7 py-2 text-xs rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300 font-medium bg-white"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                    title="Очистить поиск"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Кнопка переключения вида в правом углу без надписей */}
              <button
                type="button"
                onClick={() => handleSetCompletedCardLayout(completedCardLayout === 'compact' ? 'expanded' : 'compact')}
                className={`p-2 rounded-xl border transition-all cursor-pointer shadow-2xs flex items-center justify-center shrink-0 ${
                  completedCardLayout === 'expanded'
                    ? 'bg-purple-700 text-white border-purple-800 ring-2 ring-purple-300 shadow-xs'
                    : 'bg-white text-purple-800 border-purple-200 hover:bg-purple-50 hover:border-purple-300'
                }`}
                title={
                  completedCardLayout === 'compact'
                    ? 'Растянутый на весь экран'
                    : 'Компактный'
                }
                aria-label="Переключить размещение карточек"
              >
                {completedCardLayout === 'compact' ? (
                  <LayoutGrid className="w-4 h-4" />
                ) : (
                  <StretchHorizontal className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              № заявки
            </label>
            <input
              type="text"
              value={reqNo}
              onChange={(e) => setReqNo(e.target.value)}
              placeholder="№19.09.2026..."
              className="w-full px-3 py-1.5 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300 font-mono"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Исполнитель
            </label>
            <input
              type="text"
              value={executor}
              onChange={(e) => setExecutor(e.target.value)}
              placeholder="Смирнов, Иванов..."
              className="w-full px-3 py-1.5 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-2">
            <label className="font-bold text-slate-700 block mb-1">
              Улица, № дома, корпус, квартира
            </label>
            <div className="grid grid-cols-12 gap-1.5">
              <div className="col-span-12 sm:col-span-5 relative">
                <input
                  type="text"
                  value={street}
                  onChange={(e) => handleStreetChange(e.target.value)}
                  onFocus={() => setIsStreetSuggestionsOpen(true)}
                  onBlur={handleStreetBlur}
                  placeholder="Улица (напр. Левка Лук'яненка)"
                  className="w-full pl-2.5 pr-7 py-1.5 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300 font-medium"
                />
                {street && (
                  <button
                    type="button"
                    onClick={() => {
                      setStreet('');
                      setIsStreetSuggestionsOpen(false);
                      setRenamedNotice(null);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer text-xs"
                    title="Очистить улицу"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Выпадающие подсказки улицы */}
                {isStreetSuggestionsOpen && matchingStreetSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white rounded-xl border border-purple-200 shadow-xl max-h-56 overflow-y-auto divide-y divide-purple-50 animate-in fade-in">
                    <div className="px-2.5 py-1.5 bg-purple-50 text-[10px] font-extrabold text-purple-800 uppercase tracking-wider flex items-center justify-between sticky top-0 backdrop-blur-xs">
                      <span>Подсказки улиц ({matchingStreetSuggestions.length})</span>
                      <span className="text-[9px] text-purple-600 font-semibold">Нажмите для выбора</span>
                    </div>
                    {matchingStreetSuggestions.map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectStreetSuggestion(item);
                        }}
                        className="w-full px-2.5 py-2 text-left text-xs hover:bg-purple-50 flex items-center justify-between gap-2 transition-colors cursor-pointer"
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
              </div>

              <input
                type="text"
                value={houseNo}
                onChange={(e) => setHouseNo(e.target.value)}
                placeholder="Дом"
                className="col-span-4 sm:col-span-2 px-2 py-1.5 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300 font-medium"
              />
              <input
                type="text"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                placeholder="Корпус"
                title="Номер корпуса"
                className="col-span-4 sm:col-span-2 px-2 py-1.5 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300 font-medium"
              />
              <input
                type="text"
                value={apartment}
                onChange={(e) => setApartment(e.target.value)}
                placeholder="Кв."
                title="Номер квартиры"
                className="col-span-4 sm:col-span-3 px-2 py-1.5 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300 font-medium"
              />

              {/* Уведомление об автоматической замене старого названия на новое */}
              {renamedNotice && (
                <div className="col-span-12 mt-1 text-[11px] text-purple-900 bg-purple-100/90 px-2.5 py-1.5 rounded-xl border border-purple-300 flex items-center justify-between gap-2 font-medium animate-in fade-in">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                    <span>
                      Прежнее название «<strong>{renamedNotice.oldName}</strong>» автоматически заменено на актуальное «<strong>{renamedNotice.newName}</strong>».
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRenamedNotice(null)}
                    className="text-purple-600 hover:text-purple-950 font-bold text-xs p-0.5"
                    title="Закрыть подсказку"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1 border-t border-purple-100">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Дата исполнения от
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Дата исполнения до
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>
        </div>
      </div>

      {/* Баннер: В выполненных работах обнаружены устаревшие названия улиц */}
      {completedTicketsWithOldStreets.length > 0 && onBatchUpdateTickets && (
        <div className="p-3.5 bg-gradient-to-r from-purple-50 via-amber-50 to-orange-50 border border-purple-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-xl text-purple-800 shrink-0">
              <MapPin className="w-4 h-4 text-purple-700" />
            </div>
            <div>
              <div className="font-extrabold text-slate-900 flex items-center gap-1.5 flex-wrap">
                <span>В «Выполненных работах» найдены заявки со старыми названиями улиц</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-mono text-[11px] font-bold">
                  {completedTicketsWithOldStreets.length}
                </span>
              </div>
              <div className="text-slate-600 text-[11px] mt-0.5">
                Например: ул. Рокоссовского → просп. Левка Лук'яненка, ул. Ленина → просп. Мира, ул. Деснянская → Доценка и др.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleMigrateAllOldStreets}
            className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl transition-all shadow-xs cursor-pointer text-xs whitespace-nowrap self-start sm:self-auto flex items-center gap-1.5 shrink-0 active:scale-95"
            title="Заменить во всех заявках старые названия улиц на новые"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Заменить старые названия на новые ({completedTicketsWithOldStreets.length})</span>
          </button>
        </div>
      )}

      {/* Results List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 flex-wrap gap-2.5">
          <span>
            Найдено выполненных работ:{' '}
            <strong className="text-purple-900 font-mono text-sm">{filteredTickets.length}</strong>
          </span>

          {/* Кнопка сортировки по номеру заявки (только стрелочки вверх и вниз) */}
          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            className="p-2 rounded-xl border border-purple-200 bg-white hover:bg-purple-50 text-purple-800 shadow-2xs transition-all cursor-pointer active:scale-90 flex items-center justify-center"
            title={
              sortOrder === 'desc'
                ? 'Сортировка: от большего к меньшему (нажмите для переключения)'
                : 'Сортировка: от меньшего к большему (нажмите для переключения)'
            }
            aria-label="Сортировка по номеру заявки"
          >
            <ArrowUpDown className="w-4 h-4 text-purple-700 stroke-[2.4]" />
          </button>
        </div>

        {/* List of Completed Tickets: compact grid vs expanded full-width rows */}
        <div className={completedCardLayout === 'compact' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5' : 'space-y-2.5'}>
          {filteredTickets.map((t) => {
            const isSelected = selectedTicketId === t.id;
            const checkOld = replaceOldStreetNamesInTicket(t, baseStreets);
            const hadOldStreet = checkOld.changed;
            const updatedTicket = checkOld.ticket;
            const displayAddress = formatTicketAddressWithNewStreet(t, baseStreets);

            return (
              <div
                key={t.id}
                onClick={() => setSelectedTicketId(isSelected ? null : t.id)}
                onDoubleClick={() => onOpenTicket(updatedTicket)}
                className={`w-full p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer text-xs flex ${
                  completedCardLayout === 'compact'
                    ? 'flex-col justify-between items-stretch'
                    : 'flex-col md:flex-row md:items-center justify-between'
                } gap-4 select-none ${
                  isSelected
                    ? 'ring-2 ring-purple-600 bg-purple-100/90 border-purple-400 shadow-md scale-[1.002]'
                    : 'border-purple-200/80 bg-white hover:border-purple-300 hover:bg-purple-50/30 shadow-2xs hover:shadow-xs'
                }`}
                title="Один клик — выделить цветом. Двойной клик — открыть заявку"
              >
                {/* Left: Number, Title, Address, Assignees, Date, Description */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-purple-950 text-xs px-2 py-0.5 rounded-md bg-purple-100 border border-purple-200">
                      {t.number}
                    </span>

                    {(t.planned || t.category === 'general') && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                        Плановые
                      </span>
                    )}

                    <h4 className="font-extrabold text-sm text-slate-900 truncate">
                      {t.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-4 text-slate-600 text-[11px] flex-wrap">
                    <div className="flex items-center gap-1.5 font-medium flex-wrap">
                      <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>
                        {displayAddress}
                        {t.building && !displayAddress.toLowerCase().includes('корп') ? ` корп. ${t.building}` : ''}
                        {t.apartment && t.apartment !== '—' && !displayAddress.toLowerCase().includes('кв') ? `, кв. ${t.apartment}` : ''}
                      </span>
                      {hadOldStreet && (
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300"
                          title={`Старое название в адресе обновлено на новое: ${displayAddress}`}
                        >
                          Новое название
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-500">Исполнитель:</span>
                      {(t.assignees && t.assignees.length > 0 ? t.assignees : [t.assignee || 'Не назначен']).map(
                        (workerName, wIdx) => (
                          <span
                            key={wIdx}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              if (onInspectWorker && workerName !== 'Не назначен') {
                                onInspectWorker(workerName);
                              }
                            }}
                            title={
                              workerName !== 'Не назначен'
                                ? 'Двойной клик — информация о сотруднике'
                                : undefined
                            }
                            className={`inline-flex items-center px-2 py-0.5 rounded-md font-bold text-[11px] transition-colors ${
                              workerName !== 'Не назначен'
                                ? 'bg-purple-100 text-purple-900 border border-purple-200 hover:bg-purple-200 cursor-pointer'
                                : 'text-slate-500'
                            }`}
                          >
                            {workerName}
                          </span>
                        )
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>Дата: {t.date}</span>
                    </div>
                  </div>

                  {t.description && (
                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      {t.description}
                    </p>
                  )}

                  {/* Contact phones with digital status (1-10) */}
                  {(t.phone ||
                    t.residentPhone ||
                    (t.additional_phones && t.additional_phones.length > 0)) && (
                    <div
                      className="flex flex-wrap items-center gap-2 pt-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {(t.phone || t.residentPhone) && (
                        <PhoneBadgeDisplay
                          phone={t.phone || t.residentPhone || ''}
                          status={t.phone_status || 1}
                          currentUser={currentUser}
                          onUpdateStatus={
                            onUpdateTicketPhoneStatus
                              ? (newStatus) =>
                                  onUpdateTicketPhoneStatus(t.id, newStatus, false)
                              : undefined
                          }
                          size="xs"
                        />
                      )}
                      {t.additional_phones &&
                        t.additional_phones.map((p, idx) => (
                          <PhoneBadgeDisplay
                            key={idx}
                            phone={p}
                            status={
                              (t.additional_phone_statuses &&
                                t.additional_phone_statuses[idx]) ||
                              1
                            }
                            currentUser={currentUser}
                            onUpdateStatus={
                              onUpdateTicketPhoneStatus
                                ? (newStatus) =>
                                    onUpdateTicketPhoneStatus(
                                      t.id,
                                      newStatus,
                                      true,
                                      idx
                                    )
                                : undefined
                            }
                            size="xs"
                          />
                        ))}
                    </div>
                  )}
                </div>

                {/* Right: "Выполнено" status badge & quick delete button */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Выполнено</span>
                  </span>
                  {canDelete && onDeleteTicket && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTicket(t.id);
                      }}
                      className="p-1.5 rounded-xl border border-rose-200 text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-all flex items-center justify-center cursor-pointer shadow-2xs shrink-0"
                      title="Удалить заявку (требуется подтверждение)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredTickets.length === 0 && (
            <div className="p-10 rounded-2xl border border-purple-100 bg-white text-center text-xs text-slate-500">
              По заданным критериям выполненных заявок не найдено.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
