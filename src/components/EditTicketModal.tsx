import React, { useState, useEffect } from 'react';
import { Ticket, ThemeConfig, PersonalPerson } from '../types';
import { X, Check, FileEdit, Building, MapPin, User, Calendar, Phone, AlertCircle } from 'lucide-react';

interface EditTicketModalProps {
  isOpen: boolean;
  ticket: Ticket | null;
  onClose: () => void;
  onSaveTicket: (updatedTicket: Ticket) => void;
  theme: ThemeConfig;
  people?: PersonalPerson[];
  onInspectWorker?: (workerName: string) => void;
}

export const EditTicketModal: React.FC<EditTicketModalProps> = ({
  isOpen,
  ticket,
  onClose,
  onSaveTicket,
  theme,
  people = [],
  onInspectWorker,
}) => {
  if (!isOpen || !ticket) return null;

  const [title, setTitle] = useState(ticket.title || '');
  const [status, setStatus] = useState<Ticket['status']>(ticket.status);
  const [urgency, setUrgency] = useState<Ticket['urgency']>(ticket.urgency || 'normal');
  const [address, setAddress] = useState(ticket.address || '');
  const [apartment, setApartment] = useState(ticket.apartment || '');
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

  // Reset values when ticket changes
  useEffect(() => {
    if (ticket) {
      setTitle(ticket.title || '');
      setStatus(ticket.status);
      setUrgency(ticket.urgency || 'normal');
      setAddress(ticket.address || '');
      setApartment(ticket.apartment || '');
      setDate(ticket.date || '');
      setExecutionDate(ticket.execution_date || '');
      const workers = ticket.assignees && ticket.assignees.length > 0
        ? ticket.assignees
        : ticket.assignee && ticket.assignee !== 'Не назначен'
        ? ticket.assignee.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      setSelectedWorkers(workers);
      setCustomWorker('');
      setPhone(ticket.phone || '');
      setResidentName(ticket.residentName || '');
      setDescription(ticket.description || '');
      setWorkDescription(ticket.work_description || '');
      setWorkMaterials(ticket.work_materials || '');
    }
  }, [ticket]);

  // Extract worker names strictly from the "Люди" directory
  const availableWorkers = Array.from(
    new Set(
      people
        .map((p) => p.full_name?.trim())
        .filter((name): name is string => Boolean(name && name.length > 0))
    )
  );

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
    if (!title.trim() || !address.trim()) return;

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
      address: address.trim(),
      apartment: apartment.trim(),
      date,
      execution_date: executionDate || undefined,
      assignee: finalAssignee,
      assignees: finalAssignees,
      phone: phone.trim() || undefined,
      residentName: residentName.trim() || undefined,
      description: description.trim() || undefined,
      work_description: workDescription.trim() || undefined,
      work_materials: workMaterials.trim() || undefined,
    };

    onSaveTicket(updatedTicket);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        className="rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border transition-all text-xs my-8 max-h-[92vh] overflow-y-auto"
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

          {/* Address, Apartment, Urgency */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-purple-600" />
                <span>Адрес дома <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="ул. Ленина, д. 10"
                className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                № Квартиры
              </label>
              <input
                type="text"
                value={apartment}
                onChange={(e) => setApartment(e.target.value)}
                placeholder="42"
                className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>
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

            {/* Selection by professions: «сантехник», «электрик», «каменщик», «кровельщик» + dynamic */}
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
              <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-purple-600" />
                <span>Телефон заявителя</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+38 (0__) ___-__-__"
                className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
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
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-purple-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Сохранить изменения</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
