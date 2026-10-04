import React, { useState } from 'react';
import { ThemeConfig, GradientOption, Ticket } from '../../types';
import {
  Search,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Filter,
  RotateCcw,
  User,
  MapPin,
} from 'lucide-react';

interface SearchViewProps {
  theme: ThemeConfig;
  gradient: GradientOption;
  showFlatFallback: boolean;
  tickets: Ticket[];
  onOpenTicket: (ticket: Ticket) => void;
  onInspectWorker?: (workerName: string) => void;
  onBackToHome: () => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  theme,
  gradient,
  showFlatFallback,
  tickets,
  onOpenTicket,
  onInspectWorker,
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

  // Only completed requests (v48.10 & v48.16 rule: only completed work, personal tasks excluded)
  const completedTickets = tickets.filter((t) => t.status === 'completed');

  const filteredTickets = completedTickets.filter((t) => {
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
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Текстовый поиск
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Слова из заявки..."
              className="w-full px-3 py-1.5 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
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
        <div className="flex items-center justify-between text-xs font-bold text-slate-600 flex-wrap gap-2">
          <span>
            Найдено выполненных работ:{' '}
            <strong className="text-purple-900 font-mono">{filteredTickets.length}</strong>
          </span>
          <span className="text-[11px] text-slate-400 font-normal">
            Один клик — выделить цветом · Двойной клик — открыть заявку
          </span>
        </div>

        {/* Full-Row List of Completed Tickets */}
        <div className="space-y-2.5">
          {filteredTickets.map((t) => {
            const isSelected = selectedTicketId === t.id;

            return (
              <div
                key={t.id}
                onClick={() => setSelectedTicketId(isSelected ? null : t.id)}
                onDoubleClick={() => onOpenTicket(t)}
                className={`w-full p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer text-xs flex flex-col md:flex-row md:items-center justify-between gap-4 select-none ${
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
                </div>

                {/* Right: "Выполнено" status badge */}
                <div className="flex items-center shrink-0 self-end md:self-center">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Выполнено</span>
                  </span>
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
