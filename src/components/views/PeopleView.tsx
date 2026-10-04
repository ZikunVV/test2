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
  Trash2,
  X,
  Check,
} from 'lucide-react';

interface PeopleViewProps {
  theme: ThemeConfig;
  gradient: GradientOption;
  showFlatFallback: boolean;
  people: PersonalPerson[];
  canEdit?: boolean;
  canAdd?: boolean;
  canDelete?: boolean;
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
  isRegistered = true,
  onUpdatePerson,
  onCreatePerson,
  onDeletePerson,
  onBackToHome,
}) => {
  // Search state (v48.15: по Фамилии, Где работает, Кем работает, Адрес проживания, Телефоны)
  const [searchQuery, setSearchQuery] = useState('');

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
    setPhones(p.phones.length > 0 ? [...p.phones] : ['']);
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
    if (!fullName.trim()) return;

    const cleanPhones = phones.map((ph) => ph.trim()).filter(Boolean);

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
        {isRegistered && (
          <div className="relative">
            <Search className="w-4 h-4 text-purple-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по Фамилии, Где работает, Кем работает, Адресу проживания или Телефону..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 font-medium"
            />
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
      ) : (
        /* Compact Cards Grid (v48.13 & v48.14) */
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
                {/* Header: Full Name */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[9px] font-bold text-purple-700 uppercase tracking-wider block">
                        Сотрудник
                      </span>
                    </div>
                    <h3 className="font-extrabold text-sm text-slate-900 leading-snug">
                      {person.full_name}
                    </h3>
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

              {/* Phones List (multiple supported v48.11) */}
              {person.phones && person.phones.length > 0 && (
                <div className="mt-2 pt-2 border-t border-purple-100 space-y-1">
                  {person.phones.map((phone, i) => (
                    <a
                      key={i}
                      href={`tel:${phone}`}
                      className="flex items-center gap-1.5 text-purple-700 font-mono font-bold text-[11px] hover:underline"
                    >
                      <Phone className="w-3 h-3 text-purple-500 shrink-0" />
                      <span>{phone}</span>
                    </a>
                  ))}
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

        {filteredPeople.length === 0 && (
          <div className="col-span-full p-8 rounded-2xl border border-purple-100 bg-white text-center text-xs text-slate-500">
            {searchQuery
              ? 'По вашему запросу никого не найдено.'
              : 'В вашем списке людей пока нет записей.'}
          </div>
        )}
        </div>
      )}

      {/* CREATE / EDIT PERSON MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-purple-200 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-purple-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingPerson ? 'Редактировать сотрудника' : 'Добавить сотрудника'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePerson} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  ФИО <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Иванов Иван Иванович"
                  className="w-full px-3 py-1.5 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Где работает
                  </label>
                  <input
                    type="text"
                    value={org}
                    onChange={(e) => setOrg(e.target.value)}
                    placeholder="Организация, ЖЭК..."
                    className="w-full px-3 py-1.5 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Кем работает
                  </label>
                  <input
                    type="text"
                    value={pos}
                    onChange={(e) => setPos(e.target.value)}
                    placeholder="Должность, сантехник..."
                    className="w-full px-3 py-1.5 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Адрес проживания
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="ул. Доценка, 1а, кв. 10..."
                  className="w-full px-3 py-1.5 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>

              {/* Multiple phone numbers (v48.11) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">
                    Телефоны
                  </label>
                  <button
                    type="button"
                    onClick={handleAddPhoneField}
                    className="text-purple-700 hover:underline font-bold text-[10px]"
                  >
                    + Добавить номер
                  </button>
                </div>
                <div className="space-y-1.5">
                  {phones.map((phone, idx) => (
                    <div key={idx} className="flex gap-1.5">
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => handlePhoneChange(idx, e.target.value)}
                        placeholder="+38 (067) 123-45-67"
                        className="flex-1 px-3 py-1.5 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300 font-mono text-xs"
                      />
                      {phones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePhoneField(idx)}
                          className="px-2 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Заметки
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="График работы, ключи от подвала..."
                  className="w-full px-3 py-1.5 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-purple-100">
                <div>
                  {editingPerson && canDelete && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        setPersonToDelete(editingPerson);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Удалить запись"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Удалить запись</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Отмена
                  </button>
                  {((editingPerson && canEdit) || (!editingPerson && canAdd)) && (
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold cursor-pointer"
                    >
                      Сохранить
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
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPersonToDelete(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 border border-rose-200 shadow-2xl space-y-4 text-xs animate-in fade-in zoom-in-95"
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
