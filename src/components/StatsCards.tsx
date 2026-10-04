import React from 'react';
import { ThemeConfig, GradientOption } from '../types';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface StatsCardsProps {
  theme: ThemeConfig;
  gradient?: GradientOption;
  showFlatFallback?: boolean;
  inProgressCount: number;
  inWaitingCount: number;
  completedCount: number;
  totalCount?: number;
  activeFilter: string;
  onFilterSelect: (filter: string) => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  theme,
  inProgressCount,
  inWaitingCount,
  completedCount,
  activeFilter,
  onFilterSelect,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* 1. В работе - Warm Honey Amber */}
      <div
        onClick={() => onFilterSelect(activeFilter === 'in_progress' ? 'all' : 'in_progress')}
        className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 relative overflow-hidden group shadow-2xs hover:shadow-xs ${
          activeFilter === 'in_progress' ? 'ring-2 ring-amber-400' : ''
        }`}
        style={{
          backgroundColor: theme.keyColors.cardBg,
          borderColor: theme.keyColors.cardBorder,
        }}
      >
        {/* Rich gradient top stripe: warm honey amber */}
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
          style={{
            background: 'linear-gradient(90deg, #FDE68A 0%, #F59E0B 50%, #B45309 100%)',
          }}
        />

        <div className="flex items-center justify-between mb-3">
          <span
            className="text-xs font-semibold tracking-wide"
            style={{ color: theme.keyColors.textSecondary }}
          >
            В работе
          </span>
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center border"
            style={{
              backgroundColor: '#FEF3C7',
              borderColor: '#FDE68A',
              color: '#B45309',
            }}
          >
            <Clock className="w-4 h-4 stroke-[2]" />
          </div>
        </div>

        <div
          className="text-3xl font-extrabold tracking-tight tabular-nums mb-1"
          style={{ color: '#92400E' }}
        >
          {inProgressCount}
        </div>

        <div
          className="text-xs font-medium flex items-center gap-1.5"
          style={{ color: theme.keyColors.textSecondary }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#F59E0B' }} />
          <span>в работе</span>
        </div>
      </div>

      {/* 2. В ожидании (From Image 1) - Rich coral / rose */}
      <div
        onClick={() => onFilterSelect(activeFilter === 'in_waiting' ? 'all' : 'in_waiting')}
        className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 relative overflow-hidden group shadow-2xs hover:shadow-xs ${
          activeFilter === 'in_waiting' ? 'ring-2 ring-rose-400' : ''
        }`}
        style={{
          backgroundColor: theme.keyColors.cardBg,
          borderColor: theme.keyColors.cardBorder,
        }}
      >
        {/* Rich gradient top stripe: coral rose */}
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
          style={{
            background: 'linear-gradient(90deg, #FECDD3 0%, #F43F5E 50%, #BE123C 100%)',
          }}
        />

        <div className="flex items-center justify-between mb-3">
          <span
            className="text-xs font-semibold tracking-wide"
            style={{ color: theme.keyColors.textSecondary }}
          >
            В ожидании
          </span>
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center border"
            style={{
              backgroundColor: '#FFE4E6',
              borderColor: '#FECDD3',
              color: '#BE123C',
            }}
          >
            <AlertCircle className="w-4 h-4 stroke-[2]" />
          </div>
        </div>

        <div
          className="text-3xl font-extrabold tracking-tight tabular-nums mb-1"
          style={{ color: '#9F1239' }}
        >
          {inWaitingCount}
        </div>

        <div
          className="text-xs font-medium flex items-center gap-1.5"
          style={{ color: theme.keyColors.textSecondary }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#F43F5E' }} />
          <span>ожидают решения</span>
        </div>
      </div>

      {/* 3. Выполнено - Rich fresh emerald / mint */}
      <div
        onClick={() => onFilterSelect(activeFilter === 'completed' ? 'all' : 'completed')}
        className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 relative overflow-hidden group shadow-2xs hover:shadow-xs ${
          activeFilter === 'completed' ? 'ring-2 ring-emerald-400' : ''
        }`}
        style={{
          backgroundColor: theme.keyColors.cardBg,
          borderColor: theme.keyColors.cardBorder,
        }}
      >
        {/* Rich gradient top stripe: fresh emerald */}
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
          style={{
            background: 'linear-gradient(90deg, #A7F3D0 0%, #10B981 50%, #047857 100%)',
          }}
        />

        <div className="flex items-center justify-between mb-3">
          <span
            className="text-xs font-semibold tracking-wide"
            style={{ color: theme.keyColors.textSecondary }}
          >
            Выполнено
          </span>
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center border"
            style={{
              backgroundColor: '#D1FAE5',
              borderColor: '#A7F3D0',
              color: '#047857',
            }}
          >
            <CheckCircle className="w-4 h-4 stroke-[2]" />
          </div>
        </div>

        <div
          className="text-3xl font-extrabold tracking-tight tabular-nums mb-1"
          style={{ color: '#065F46' }}
        >
          {completedCount}
        </div>

        <div
          className="text-xs font-medium flex items-center gap-1.5"
          style={{ color: theme.keyColors.textSecondary }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#10B981' }} />
          <span>закрыто за сегодня</span>
        </div>
      </div>
    </div>
  );
};
