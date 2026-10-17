import React, { useState } from 'react';
import { ThemeConfig, GradientOption, PersonalPerson } from '../../types';
import {
  Users,
  Search,
  Plus,
  ArrowLeft,
  Phone,
  Building,
  Briefcase,
  MapPin,
  FileText,
  Edit,
  Edit2,
  Trash2,
  X,
  Check,
  Lock,
  LayoutGrid,
  StretchHorizontal,
} from 'lucide-react';

interface PeopleViewProps {
  theme: ThemeConfig;
  gradient: GradientOption;
  showFlatFallback: boolean;
  people: PersonalPerson[];
  canEdit?: boolean;
  canAdd?: boolean;
  canDelete?: boolean;
  canViewPhone?: boolean;
  isRegistered?: boolean;
  onUpdatePerson: (person: PersonalPerson) => void;
  onCreatePerson: (person: PersonalPerson) => void;
  onDeletePerson: (id: string) => void;
  onBackToHome?: () => void;
}

export const PeopleView: React.FC<PeopleViewProps> = ({
  theme,
  gradient,
  showFlatFallback,
  people,
  canEdit = true,
  canAdd = canEdit,
  canDelete = canEdit,
  canViewPhone = true,
  isRegistered = true,
  onUpdatePerson,
  onCreatePerson,
  onDeletePerson,
  onBackToHome,
}) => {
  // Search state (v48.15: по Фамилии, Где работает, Кем работает, Адрес проживания, Телефоны)
  const [searchQuery, setSearchQuery] = useState('');

  // Card layout: 'compact' (grid) vs 'expanded' (full width row by row like tickets)
  const [cardLayout, setCardLayout] = useState<'compact' | 'expanded'>(() => {
    try {
      const saved = localStorage.getItem('app_employee_card_layout');
      if (saved === 'expanded' || saved === 'compact') return saved;
    } catch (e) {}
    return 'compact';
  });

  const handleSetCardLayout = (mode: 'compact' | 'expanded') => {
    setCardLayout(mode);
    try {
      localStorage.setItem('app_employee_card_layout', mode);
    } catch (e) {}
  };

  // Selected person (one click highlights the employee form/card)
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  // Modal create/edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<PersonalPerson | null>(null);
  const [personToDelete, setPersonToDelete] = useState<PersonalPerson | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [org, setOrg] = useState('');
  const [pos, setPos] = useState('');
  const [address, setAddress] = useState('');
  const [phones, setPhones] = useState<string[]>(['']);
  const [notes, setNotes] = useState('');

  // Filtered people (corporate only; personal account entries are kept in PersonalTasksView)
  const filteredPeople = people.filter((p) => {
    if (p.owner_user_id) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchName = p.full_name.toLowerCase().includes(q);
    const matchOrg = p.organization.toLowerCase().includes(q);
    const matchPos = p.position.toLowerCase().includes(q);
    const matchAddr = p.residence_address.toLowerCase().includes(q);
    const matchPhones = p.phones.some((ph) => ph.toLowerCase().includes(q));
    return matchName || matchOrg || matchPos || matchAddr || matchPhones;
  });

  const handleOpenCreate = () => {
    setEditingPerson(null);
    setFullName('');
    setOrg('');
    setPos('');
    setAddress('');
    setPhones(['']);
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: PersonalPerson) => {
    setEditingPerson(p);
    setFullName(p.full_name);
    setOrg(p.organization);
    setPos(p.position);
    setAddress(p.residence_address);
    setPhones(canViewPhone && p.phones.length > 0 ? [...p.phones] : ['']);
    setNotes(p.notes);
    setIsModalOpen(true);
  };

  const handlePhoneChange = (idx: number, val: string) => {
    const updated = [...phones];
    updated[idx] = val;
    setPhones(updated);
  };

  const handleAddPhoneField = () => {
    setPhones([...phones, '']);
  };

  const handleRemovePhoneField = (idx: number) => {
    if (phones.length <= 1) {
      setPhones(['']);
    } else {
      setPhones(phones.filter((_, i) => i !== idx));
    }
  };

  const handleSavePerson = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhones = canViewPhone
      ? phones.map((ph) => ph.trim()).filter(Boolean)
      : (editingPerson?.phones || []);

    if (editingPerson) {
      onUpdatePerson({
        ...editingPerson,
        full_name: fullName.trim(),
        organization: org.trim(),
        position: pos.trim(),
        residence_address: address.trim(),
        phones: cleanPhones,
        notes: notes.trim(),
      });
    } else {
      const newPerson: PersonalPerson = {
        id: `pp-${Date.now()}`,
        full_name: fullName.trim(),
        organization: org.trim(),
        position: pos.trim(),
        residence_address: address.trim(),
        phones: cleanPhones,
        notes: notes.trim(),
      };
      onCreatePerson(newPerson);
    }
    setIsModalOpen(false);
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
          <span className="font-bold text-slate-800">Сотрудники</span>
        </div>

        {canAdd && (
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl text-white font-bold text-xs shadow-xs hover:opacity-95 transition-opacity"
            style={{
              background: showFlatFallback ? '#7652B5' : gradient.cssGradient,
            }}
          >
            <span>Добавить сотрудника</span>
          </button>
        )}
      </div>

      {/* Header & Search */}
      <div className="bg-white p-5 rounded-2xl border border-purple-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-700" />
            <span>Сотрудники</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            Всего: {filteredPeople.length}
          </span>
        </div>

        {/* Live Search input */}
        {/* Live Search input + compact button on right side */}
        {isRegistered && (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-purple-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по Фамилии, Где работает, Кем работает, Адресу проживания или Телефону..."
                className="w-full pl-9 pr-7 py-2 text-xs rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                  title="Очистить поиск"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Single active button toggle without text labels on right side of search */}
            <button
              type="button"
              onClick={() => handleSetCardLayout(cardLayout === 'compact' ? 'expanded' : 'compact')}
              className={`p-2 rounded-xl border transition-all cursor-pointer shadow-2xs flex items-center justify-center shrink-0 ${
                cardLayout === 'expanded'
                  ? 'bg-purple-700 text-white border-purple-800 ring-2 ring-purple-300 shadow-xs'
                  : 'bg-white text-purple-800 border-purple-200 hover:bg-purple-50 hover:border-purple-300'
              }`}
              title={
                cardLayout === 'compact'
                  ? 'Растянутый на весь экран'
                  : 'Компактный'
              }
              aria-label="Переключить размещение карточек"
            >
              {cardLayout === 'compact' ? (
                <LayoutGrid className="w-4 h-4" />
              ) : (
                <StretchHorizontal className="w-4 h-4" />
              )}
            </button>
          </div>
        )}
      </div>

      {!isRegistered ? (
        <div className="p-8 rounded-2xl border border-purple-200 bg-white text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-800">
            Справочник сотрудников
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Просматривать и изменять этот раздел могут только сотрудники с соответствующим разрешением от администратора.
          </p>
        </div>
      ) : filteredPeople.length === 0 ? (
        <div className="p-8 rounded-2xl border border-purple-100 bg-white text-center text-xs text-slate-500">
          {searchQuery
            ? 'По вашему запросу никого не найдено.'
            : 'В вашем списке людей пока нет записей.'}
        </div>
      ) : cardLayout === 'compact' ? (
        /* Compact Cards Grid (плитка) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredPeople.map((person) => {
            const isSelected = selectedPersonId === person.id;
            return (
              <div
                key={person.id}
                onClick={() => setSelectedPersonId(isSelected ? null : person.id)}
                onDoubleClick={() => (canEdit || canDelete) && handleOpenEdit(person)}
                className={`p-4 rounded-2xl border transition-all text-xs space-y-2.5 flex flex-col justify-between cursor-pointer select-none ${
                  isSelected
                    ? 'ring-2 ring-purple-600 bg-purple-50/90 border-purple-400 shadow-md scale-[1.01]'
                    : 'border-purple-200/80 bg-white hover:border-purple-300 shadow-2xs hover:shadow-xs'
                }`}
              >
                <div>
                  {/* Header: Full Name & Action Buttons */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[9px] font-bold text-purple-700 uppercase tracking-wider block">
                          Сотрудник
                        </span>
                      </div>
                      <h3 className="font-extrabold text-sm text-slate-900 leading-snug truncate">
                        {person.full_name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {canEdit && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(person);
                          }}
                          className="p-1 rounded-lg border border-purple-200 hover:bg-purple-100 text-purple-700 transition-colors cursor-pointer"
                          title="Редактировать сотрудника"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPersonToDelete(person);
                          }}
                          className="p-1 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                          title="Удалить сотрудника"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Work & Position */}
                  {(person.organization || person.position) && (
                    <div className="text-[11px] text-slate-600 mt-1 space-y-0.5">
                      {person.organization && (
                        <div className="flex items-center gap-1 font-semibold text-purple-950">
                          <Building className="w-3 h-3 text-purple-600 shrink-0" />
                          <span>{person.organization}</span>
                        </div>
                      )}
                      {person.position && (
                        <div className="flex items-center gap-1 text-slate-500">
                          <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{person.position}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Address */}
                  {person.residence_address && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-600 mt-1.5">
                      <MapPin className="w-3 h-3 text-purple-600 shrink-0" />
                      <span>{person.residence_address}</span>
                    </div>
                  )}

                  {/* Phones List */}
                  {person.phones && person.phones.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-purple-100 space-y-1">
                      {canViewPhone ? (
                        person.phones.map((phone, i) => (
                          <a
                            key={i}
                            href={`tel:${phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-purple-700 font-mono font-bold text-[11px] hover:underline"
                          >
                            <Phone className="w-3 h-3 text-purple-500 shrink-0" />
                            <span>{phone}</span>
                          </a>
                        ))
                      ) : (
                        <div
                          className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px] select-none"
                          title="Номер телефона скрыт (нет прав доступа)"
                        >
                          <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>Номер скрыт (нет прав)</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  {person.notes && (
                    <p className="text-[10px] text-slate-500 mt-2 bg-purple-50/50 p-2 rounded-lg border border-purple-100/60 leading-relaxed">
                      {person.notes}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Expanded Full-Width Cards (растянутый на весь экран, как на главной заявки) */
        <div className="space-y-3">
          {filteredPeople.map((person) => {
            const isSelected = selectedPersonId === person.id;
            return (
              <div
                key={person.id}
                onClick={() => setSelectedPersonId(isSelected ? null : person.id)}
                onDoubleClick={() => (canEdit || canDelete) && handleOpenEdit(person)}
                className={`group cursor-pointer w-full rounded-2xl p-4 md:p-5 border transition-all duration-200 relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-4 select-none ${
                  isSelected
                    ? 'ring-2 ring-purple-400 shadow-md scale-[1.004]'
                    : 'border-purple-200/80 bg-white hover:border-purple-300 shadow-2xs hover:shadow-xs'
                }`}
                style={{
                  backgroundColor: isSelected ? '#FAF5FF' : '#FFFFFF',
                  borderColor: isSelected ? '#C084FC' : undefined,
                }}
              >
                {/* Left accent indicator stripe like on main TicketCard */}
                <div
                  className={`absolute left-0 top-0 bottom-0 transition-all duration-200 ${
                    isSelected ? 'w-2.5 shadow-xs' : 'w-1.5'
                  }`}
                  style={{
                    background: isSelected
                      ? 'linear-gradient(180deg, #E9D5FF 0%, #A855F7 50%, #6B21A8 100%)'
                      : 'linear-gradient(180deg, #E2E8F0 0%, #CBD5E1 100%)',
                  }}
                />

                {/* Content row stretched across full screen */}
                <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0 pl-1.5">
                  {/* Col 1: Employee Badge & Full Name */}
                  <div className="min-w-0 md:w-64 lg:w-72 shrink-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200/60 inline-block">
                        Сотрудник
                      </span>
                    </div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug truncate" title={person.full_name}>
                      {person.full_name}
                    </h3>
                  </div>

                  {/* Col 2: Work Organization & Position & Address */}
                  <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="space-y-1">
                      {person.organization && (
                        <div className="flex items-center gap-1.5 font-semibold text-purple-950 text-xs">
                          <Building className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span className="truncate">{person.organization}</span>
                        </div>
                      )}
                      {person.position && (
                        <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{person.position}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      {person.residence_address && (
                        <div className="flex items-center gap-1.5 text-slate-700 text-xs">
                          <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span className="truncate" title={person.residence_address}>{person.residence_address}</span>
                        </div>
                      )}
                      {person.notes && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                          {person.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Col 3: Contact Phones */}
                  {person.phones && person.phones.length > 0 && (
                    <div className="shrink-0 flex flex-col gap-1 min-w-[170px]">
                      {canViewPhone ? (
                        person.phones.map((phone, i) => (
                          <a
                            key={i}
                            href={`tel:${phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-purple-700 font-mono font-bold text-xs hover:underline hover:text-purple-900"
                          >
                            <Phone className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                            <span>{phone}</span>
                          </a>
                        ))
                      ) : (
                        <div
                          className="flex items-center gap-1.5 text-slate-400 font-mono text-xs select-none"
                          title="Номер телефона скрыт (нет прав доступа)"
                        >
                          <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Номер скрыт (нет прав)</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons: Edit & Delete */}
                <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-purple-100">
                  {canEdit && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(person);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-purple-200 hover:bg-purple-100 text-purple-700 transition-colors cursor-pointer flex items-center gap-1.5 font-bold text-xs"
                      title="Редактировать сотрудника (форма на всю ширину)"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Редактировать</span>
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPersonToDelete(person);
                      }}
                      className="p-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                      title="Удалить сотрудника"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT PERSON MODAL — FULL SCREEN WIDTH */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-start sm:items-center justify-center p-1 sm:p-2 md:p-4 overflow-y-auto overflow-x-hidden">
          <div className="bg-white rounded-2xl w-full max-w-[calc(100vw-12px)] sm:max-w-[calc(100vw-24px)] md:max-w-[calc(100vw-36px)] lg:max-w-[calc(100vw-48px)] p-4 sm:p-6 md:p-8 border border-purple-200 shadow-2xl space-y-4 text-xs my-auto max-h-[94vh] overflow-y-auto overflow-x-hidden box-border">
            <div className="flex items-center justify-between border-b border-purple-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                  Справочник сотрудников · Форма «Сотрудник»
                </span>
                <h3 className="text-base sm:text-xl font-black text-slate-900">
                  {editingPerson ? 'Редактировать сотрудника' : 'Добавить сотрудника в справочник'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Закрыть"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePerson} className="space-y-4">
              {/* Row 1: Primary Information across 4 columns on large screens to take full advantage of screen width */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ФИО сотрудника <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Иванов Иван Иванович"
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300 font-medium text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Где работает (Организация / Участок)
                  </label>
                  <input
                    type="text"
                    value={org}
                    onChange={(e) => setOrg(e.target.value)}
                    placeholder="КП «ЖЄК-10», Участок 1..."
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300 text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Кем работает (Должность / Профессия)
                  </label>
                  <input
                    type="text"
                    value={pos}
                    onChange={(e) => setPos(e.target.value)}
                    placeholder="Сантехник, Электрик, Мастер..."
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300 text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Адрес проживания сотрудника
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="г. Киев, ул. Доценка, 1а, кв. 10..."
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300 text-xs bg-white"
                  />
                </div>
              </div>

              {/* Row 2: Phones & Notes side-by-side in 2 wide columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
                {/* Column 1: Phones */}
                <div className="p-3.5 rounded-xl border border-purple-100 bg-purple-50/30 space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-purple-700" />
                      <span>Контактные телефоны</span>
                    </label>
                    {canViewPhone && (
                      <button
                        type="button"
                        onClick={handleAddPhoneField}
                        className="text-purple-700 hover:text-purple-900 font-bold text-xs underline cursor-pointer"
                      >
                        + Добавить ещё телефон
                      </button>
                    )}
                  </div>
                  {!canViewPhone ? (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs">
                      <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Номера телефонов скрыты (нет разрешения-доступа на просмотр и изменение)</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {phones.map((phone, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="text"
                            value={phone}
                            onChange={(e) => handlePhoneChange(idx, e.target.value)}
                            placeholder="+38 (067) 123-45-67"
                            className="flex-1 px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300 font-mono text-xs bg-white"
                          />
                          {phones.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemovePhoneField(idx)}
                              className="px-3 rounded-xl border border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-700 font-bold transition-colors cursor-pointer"
                              title="Удалить номер"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Column 2: Notes */}
                <div className="p-3.5 rounded-xl border border-purple-100 bg-purple-50/30 space-y-2">
                  <label className="font-bold text-slate-800 block mb-1">
                    Дополнительные заметки и служебная информация
                  </label>
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="График работы, дежурства, ключи от подвалов, особенности обслуживания..."
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300 text-xs bg-white resize-y"
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-purple-100">
                <div>
                  {editingPerson && canDelete && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        setPersonToDelete(editingPerson);
                      }}
                      className="px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
                      title="Удалить сотрудника из базы"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Удалить сотрудника</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer text-xs"
                  >
                    Отмена
                  </button>
                  {((editingPerson && canEdit) || (!editingPerson && canAdd)) && (
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold cursor-pointer text-xs shadow-xs"
                    >
                      Сохранить сотрудника
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE PERSON CONFIRMATION MODAL */}
      {personToDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-start sm:items-center justify-center px-3 py-3 sm:p-4 overflow-y-auto overflow-x-hidden"
          onClick={() => setPersonToDelete(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-[calc(100vw-24px)] sm:max-w-sm p-3.5 sm:p-6 border border-rose-200 shadow-2xl space-y-3.5 sm:space-y-4 text-xs animate-in fade-in zoom-in-95 my-auto overflow-x-hidden box-border"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">
                  Подтверждение удаления
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Действительно удалить запись?
                </h3>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-100 text-slate-700 space-y-1">
              <div className="font-extrabold text-sm text-slate-900">
                {personToDelete.full_name}
              </div>
              {(personToDelete.position || personToDelete.organization) && (
                <div className="text-[11px] text-slate-500">
                  {[personToDelete.position, personToDelete.organization]
                    .filter(Boolean)
                    .join(' · ')}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPersonToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeletePerson(personToDelete.id);
                  setPersonToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs cursor-pointer"
              >
                Да, удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
