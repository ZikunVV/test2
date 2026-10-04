import React from 'react';
import { PersonalPerson } from '../types';
import { User, Briefcase, Building, MapPin, Phone, X, Check } from 'lucide-react';

export interface InspectedWorkerInfo {
  id?: string;
  full_name: string;
  position?: string;
  organization?: string;
  residence_address?: string;
  phones?: string[];
  notes?: string;
  owner_surname?: string;
  isManual?: boolean;
}

interface EmployeeDetailModalProps {
  worker: InspectedWorkerInfo | null;
  onClose: () => void;
}

export const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({ worker, onClose }) => {
  if (!worker) return null;

  return (
    <div
      className="fixed inset-0 z-70 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 border border-purple-200 shadow-2xl space-y-4 text-xs animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-purple-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black shrink-0 shadow-2xs">
              <User className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                Карточка сотрудника
              </span>
              <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                {worker.full_name}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Information Grid */}
        <div className="space-y-2.5">
          {/* Position / Profession */}
          <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-100">
            <span className="text-[10px] text-slate-400 block font-semibold">
              Кем работает / Должность
            </span>
            <span className="font-bold text-slate-900 flex items-center gap-1.5 mt-0.5 text-xs">
              <Briefcase className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>{worker.position || 'Должность не указана'}</span>
            </span>
          </div>

          {/* Organization */}
          <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-100">
            <span className="text-[10px] text-slate-400 block font-semibold">
              Организация / Где работает
            </span>
            <span className="font-bold text-slate-900 flex items-center gap-1.5 mt-0.5 text-xs">
              <Building className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>{worker.organization || 'Организация не указана'}</span>
            </span>
          </div>

          {/* Residence Address */}
          <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-100">
            <span className="text-[10px] text-slate-400 block font-semibold">
              Адрес проживания
            </span>
            <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5 text-xs">
              <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>{worker.residence_address || 'Адрес проживания не указан'}</span>
            </span>
          </div>

          {/* Phone Numbers with tel:, Telegram & Viber links */}
          <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-100">
            <span className="text-[10px] text-slate-400 block font-semibold mb-1.5">
              Контактные телефоны и мессенджеры
            </span>
            {worker.phones && worker.phones.length > 0 ? (
              <div className="space-y-2">
                {worker.phones.map((phone, i) => {
                  const digitsOnly = phone.replace(/[^0-9]/g, '');
                  const intlPhone = digitsOnly.startsWith('0')
                    ? `38${digitsOnly}`
                    : digitsOnly;
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-2 flex-wrap bg-white p-2 rounded-xl border border-purple-200 shadow-2xs"
                    >
                      <a
                        href={`tel:${phone}`}
                        className="inline-flex items-center gap-1.5 text-purple-800 hover:text-purple-950 font-mono font-bold text-xs"
                      >
                        <Phone className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span>{phone}</span>
                      </a>
                      {intlPhone.length >= 10 && (
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`https://t.me/+${intlPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold text-[10px] transition-colors"
                            title="Открыть чат в Telegram"
                          >
                            Telegram
                          </a>
                          <a
                            href={`viber://chat?number=%2B${intlPhone}`}
                            className="px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-bold text-[10px] transition-colors"
                            title="Открыть чат в Viber"
                          >
                            Viber
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <span className="text-slate-400 text-xs italic">
                Телефон не указан (для образца: +38 (050) 000-00-00)
              </span>
            )}
          </div>

          {/* Notes */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-400 block font-semibold mb-0.5">
              Личные заметки и примечания
            </span>
            <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-wrap">
              {worker.notes || 'Личные заметки отсутствуют.'}
            </p>
          </div>

          {/* Account status / owner */}
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">Статус учётной записи:</span>
            <span className="font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200">
              {worker.owner_surname || (worker.isManual ? 'Введён вручную' : 'Активен')}
            </span>
          </div>

          {/* Manual notice */}
          {worker.isManual && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              Сотрудник указан вручную при оформлении. В корпоративном справочнике «Сотрудники» запись с такими данными пока не создана.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-purple-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold transition-all shadow-xs"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
