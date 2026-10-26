import React, { useState, useRef, useEffect } from 'react';
import { UserItem } from '../types';
import {
  canUserViewPhoneNumber,
  canUserSeePhoneStatusBadge,
  canUserManageAccessRights,
  PHONE_STATUS_STYLES,
} from '../utils/phoneAccess';
import { Phone, Lock, ChevronDown, Check } from 'lucide-react';

export interface PhoneBadgeDisplayProps {
  phone: string;
  status?: number;
  currentUser?: UserItem | null;
  onUpdateStatus?: (newStatus: number) => void;
  allowCallLinks?: boolean;
  className?: string;
  size?: 'xs' | 'sm' | 'md';
  forceCanView?: boolean;
}

export const PhoneBadgeDisplay: React.FC<PhoneBadgeDisplayProps> = ({
  phone,
  status = 1,
  currentUser,
  onUpdateStatus,
  allowCallLinks = true,
  className = '',
  size = 'sm',
  forceCanView,
}) => {
  const currentStatus = typeof status === 'number' && status >= 1 && status <= 10 ? status : 1;
  const canView =
    forceCanView !== undefined
      ? forceCanView
      : canUserViewPhoneNumber(currentUser, currentStatus);
  const canSeeStatus = canUserSeePhoneStatusBadge(currentUser);
  const canManage = canUserManageAccessRights(currentUser);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const style = PHONE_STATUS_STYLES[currentStatus] || PHONE_STATUS_STYLES[1];

  const textSize =
    size === 'xs'
      ? 'text-[11px]'
      : size === 'md'
      ? 'text-sm'
      : 'text-xs';

  if (!phone || !phone.trim()) {
    return <span className="text-slate-400 text-xs">Не указан</span>;
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 flex-wrap ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Phone representation */}
      {canView ? (
        allowCallLinks ? (
          <a
            href={`tel:${phone}`}
            className={`font-mono font-bold ${textSize} text-purple-700 hover:text-purple-950 inline-flex items-center gap-1 hover:underline transition-colors`}
            title="Позвонить"
          >
            <Phone className="w-3.5 h-3.5 text-purple-500 shrink-0" />
            <span>{phone}</span>
          </a>
        ) : (
          <span className={`font-mono font-bold ${textSize} text-slate-800 inline-flex items-center gap-1`}>
            <Phone className="w-3.5 h-3.5 text-purple-500 shrink-0" />
            <span>{phone}</span>
          </span>
        )
      ) : (
        <span
          className={`font-mono ${textSize} text-slate-400 inline-flex items-center gap-1 select-none`}
          title={`Номер телефона скрыт настройками доступа (требуется цифровой уровень доступа не ниже ${currentStatus})`}
        >
          <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>•••••••• (скрыт)</span>
        </span>
      )}

      {/* Digital status badge (visible ONLY to admin or authorized users) */}
      {canSeeStatus && (
        <div className="relative inline-block" ref={dropdownRef}>
          {canManage && onUpdateStatus ? (
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-black border tracking-wider transition-all cursor-pointer flex items-center gap-1 shadow-2xs hover:scale-105 ${style.bg} ${style.text} ${style.border}`}
              title={`Цифровой статус номера: ${currentStatus}. Нажмите, чтобы изменить статус (1-10)`}
            >
              <span>{style.label}</span>
              <ChevronDown className="w-2.5 h-2.5 opacity-60" />
            </button>
          ) : (
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-black border tracking-wider select-none ${style.bg} ${style.text} ${style.border}`}
              title={`Цифровой статус номера: ${currentStatus} (виден с уровня ${currentStatus} и выше)`}
            >
              {style.label}
            </span>
          )}

          {/* Quick status picker popover (1 to 10) */}
          {dropdownOpen && canManage && onUpdateStatus && (
            <div className="absolute left-0 top-full mt-1 z-50 bg-white rounded-xl shadow-xl border border-purple-200 p-2 w-44 animate-in fade-in zoom-in-95 duration-100">
              <div className="text-[10px] font-bold text-slate-500 mb-1 px-1">
                Статус номера (1–10):
              </div>
              <div className="grid grid-cols-5 gap-1">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((val) => {
                  const s = PHONE_STATUS_STYLES[val];
                  const isCur = val === currentStatus;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        onUpdateStatus(val);
                        setDropdownOpen(false);
                      }}
                      className={`py-1 rounded-lg text-xs font-black border transition-all cursor-pointer flex items-center justify-center ${
                        isCur
                          ? 'bg-purple-800 text-white border-purple-950 ring-2 ring-purple-300'
                          : `${s.bg} ${s.text} ${s.border} hover:scale-105`
                      }`}
                      title={`Установить статус ${val}`}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
              <div className="mt-1.5 pt-1 border-t border-purple-100 text-[9px] text-slate-400 px-1 leading-tight">
                Статус определяет уровень доступа (1–10), с которого разрешён просмотр этого номера.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
