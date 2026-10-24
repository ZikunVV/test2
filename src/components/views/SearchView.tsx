import React, { useState } from 'react';
import { ThemeConfig, GradientOption, Ticket, UserItem } from '../../types';
import { PhoneBadgeDisplay } from '../PhoneBadgeDisplay';
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
} from 'lucide-react';

interface SearchViewProps {
  theme: ThemeConfig;
  gradient: GradientOption;
  showFlatFallback: boolean;
  tickets: Ticket[];
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
  onBackToHome: () => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  theme,
  gradient,
  showFlatFallback,
  tickets,
  currentUser,
  canDelete = false,
  onDeleteTicket,
  onOpenTicket,
  onInspectWorker,
  onUpdateTicketPhoneStatus,
  onBackToHome,
}) => {
  // v48.16 Search filters for completed work
  const [query, setQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reqNo, setReqNo] = useState('');
  const [executor, setExecutor] = useState('');
  const [street, setStreet] = useState('');
  const [houseNo, setHouseNo] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
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
  const completedTickets = tickets.filter((t) => t.status === 'completed');

  // Sorting state: 'desc' (от большего номера к меньшему) vs 'asc' (от меньшего к большему)
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const filteredTickets = completedTickets
    .filter((t) => {
      if (query) {
        const q = query.toLowerCase();
        const match =
          t.number.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          t.address.toLowerCase().includes(q) ||
          t.assignee.toLowerCase().includes(q) ||
          (t.description || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      if (dateFrom && t.date < dateFrom) return false;
      if (dateTo && t.date > dateTo) return false;
      if (reqNo && !t.number.toLowerCase().includes(reqNo.toLowerCase()))
        return false;
      if (executor && !t.assignee.toLowerCase().includes(executor.toLowerCase()))
        return false;
      if (street && !t.address.toLowerCase().includes(street.toLowerCase()))
        return false;
      if (houseNo && !t.address.includes(houseNo)) return false;
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

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Улица и № дома
            </label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Улица"
                className="w-2/3 px-2.5 py-1.5 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
              <input
                type="text"
                value={houseNo}
                onChange={(e) => setHouseNo(e.target.value)}
                placeholder="Дом"
                className="w-1/3 px-2 py-1.5 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
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

            return (
              <div
                key={t.id}
                onClick={() => setSelectedTicketId(isSelected ? null : t.id)}
                onDoubleClick={() => onOpenTicket(t)}
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

                    {t.planned && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                        Плановые
                      </span>
                    )}

                    <h4 className="font-extrabold text-sm text-slate-900 truncate">
                      {t.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-4 text-slate-600 text-[11px] flex-wrap">
                    <div className="flex items-center gap-1.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>
                        {t.address}
                        {t.apartment && t.apartment !== '—' ? `, кв. ${t.apartment}` : ''}
                      </span>
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
