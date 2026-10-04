import React, { useState } from 'react';
import { ThemeConfig, GradientOption, InternalPerson } from '../../types';
import {
  Users2,
  Phone,
  Send,
  Building,
  Briefcase,
  MapPin,
  ArrowLeft,
  Plus,
  MessageCircle,
  FileText,
  Search,
} from 'lucide-react';

interface InternalViewProps {
  theme: ThemeConfig;
  gradient: GradientOption;
  showFlatFallback: boolean;
  people: InternalPerson[];
  onBackToHome: () => void;
  isAdmin?: boolean;
}

export const InternalView: React.FC<InternalViewProps> = ({
  theme,
  gradient,
  showFlatFallback,
  people,
  onBackToHome,
  isAdmin = true,
}) => {
  const [activeTab, setActiveTab] = useState<'people' | 'streets'>('people');
  const [searchQuery, setSearchQuery] = useState('');

  // Streets directory (matching app.py streets table)
  const streetsData = [
    { id: 1, current_name: 'Доценка', old_names: 'ул. Деснянская' },
    { id: 2, current_name: 'Шевченко', old_names: 'ул. Советская' },
    { id: 3, current_name: 'Мира', old_names: 'проспект Ленина' },
    { id: 4, current_name: 'Героев', old_names: 'ул. Октябрьская' },
  ];

  const filteredPeople = people.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.full_name.toLowerCase().includes(q) ||
      p.organization.toLowerCase().includes(q) ||
      p.position.toLowerCase().includes(q) ||
      p.phones.some((ph) => ph.includes(q))
    );
  });

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
            Корпоративная информация
          </span>
        </div>
      </div>

      {/* Header and Tab switcher */}
      <div className="bg-white p-5 rounded-2xl border border-purple-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Users2 className="w-5 h-5 text-purple-700" />
              <span>Корпоративная информация</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Телефоны служб, диспетчеров, аварийных бригад и справочник улиц.
            </p>
          </div>

          <div className="flex items-center p-1 rounded-xl border border-purple-200 bg-white text-xs">
            <button
              onClick={() => setActiveTab('people')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'people'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-purple-900'
              }`}
            >
              Службы и сотрудники ({people.length})
            </button>
            <button
              onClick={() => setActiveTab('streets')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'streets'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-purple-900'
              }`}
            >
              Справочник улиц ({streetsData.length})
            </button>
          </div>
        </div>

        {activeTab === 'people' && (
          <div className="relative">
            <Search className="w-4 h-4 text-purple-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по ФИО, организации, должности или телефону..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 font-medium"
            />
          </div>
        )}
      </div>

      {/* Tab: People / Services */}
      {activeTab === 'people' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredPeople.map((person) => (
            <div
              key={person.id}
              className="p-4 rounded-2xl border border-purple-200/80 bg-white hover:border-purple-300 transition-all text-xs space-y-2.5 shadow-2xs hover:shadow-xs flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                  {person.organization}
                </span>
                <h3 className="font-extrabold text-sm text-slate-900 mt-0.5">
                  {person.full_name}
                </h3>
                <div className="text-slate-500 text-[11px] font-medium mt-0.5">
                  {person.position}
                </div>

                {/* Phones */}
                <div className="mt-2.5 pt-2 border-t border-purple-100 space-y-1">
                  {person.phones.map((phone, idx) => (
                    <a
                      key={idx}
                      href={`tel:${phone}`}
                      className="flex items-center gap-1.5 font-mono font-bold text-purple-900 hover:underline text-[11px]"
                    >
                      <Phone className="w-3 h-3 text-purple-600 shrink-0" />
                      <span>{phone}</span>
                    </a>
                  ))}
                </div>

                {/* Messengers: Telegram & Viber */}
                {(person.telegram || person.viber) && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-purple-100 text-[11px]">
                    {person.telegram && (
                      <span className="flex items-center gap-1 text-sky-700 font-medium">
                        <Send className="w-3 h-3" />
                        <span>@{person.telegram}</span>
                      </span>
                    )}
                    {person.viber && (
                      <span className="flex items-center gap-1 text-purple-700 font-medium">
                        <MessageCircle className="w-3 h-3" />
                        <span>Viber</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Notes */}
                {person.notes && (
                  <p className="text-[10px] text-slate-500 mt-2 bg-purple-50/50 p-2 rounded-lg leading-relaxed">
                    {person.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Tab: Streets Directory */
        <div className="bg-white rounded-2xl border border-purple-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-purple-100 bg-purple-50/50">
            <h3 className="font-bold text-sm text-slate-900">
              Реестр наименований и переименований улиц
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Используется для сквозного поиска и автодополнения адресов домов и заявок.
            </p>
          </div>

          <div className="divide-y divide-purple-100 text-xs">
            {streetsData.map((st) => (
              <div
                key={st.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-purple-50/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-600 shrink-0" />
                  <div>
                    <span className="font-extrabold text-sm text-slate-900">
                      ул. {st.current_name}
                    </span>
                    {st.old_names && (
                      <span className="text-slate-400 text-xs ml-2">
                        (ранее: {st.old_names})
                      </span>
                    )}
                  </div>
                </div>

                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-semibold self-start sm:self-auto">
                  Действующая
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
