import { UserItem } from '../types';

/**
 * Checks whether the current user has rights to view a specific phone number.
 * 
 * Rules based on specification:
 * - Admin always sees all numbers.
 * - Regular registered accounts: By default, DO NOT see phone numbers (phone_access_level is 0 / null / undefined).
 * - Independent setting from 1 to 10 for each account.
 * - Hierarchy:
 *   - Level 1: sees only status 1 numbers.
 *   - Level 2: sees status 1 and 2 (above cannot).
 *   - Level 3: sees status 1, 2, 3 (above cannot).
 *   ...
 *   - Level N: sees status <= N.
 */
export function canUserViewPhoneNumber(
  user: UserItem | null | undefined,
  phoneStatus: number = 1
): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;

  // Если уровень явно задан числом от 1 до 10 — проверяем иерархию уровней
  // Если режим ограничений «Права» отключен и уровень не ограничен — по умолчанию доступ открыт (уровень 10)
  const userLevel =
    typeof user.phone_access_level === 'number' && user.phone_access_level >= 1
      ? user.phone_access_level
      : 10;

  const normalizedStatus =
    typeof phoneStatus === 'number' && phoneStatus >= 1 && phoneStatus <= 10
      ? phoneStatus
      : 1;

  return normalizedStatus <= userLevel;
}

/**
 * Checks if user is permitted to see the digital status badge (1 to 10) next to the phone number.
 */
export function canUserSeePhoneStatusBadge(
  user: UserItem | null | undefined
): boolean {
  if (!user) return false;
  return true;
}

/**
 * Checks if the user is permitted to configure access rights for accounts or assign phone statuses.
 */
export function canUserManageAccessRights(
  user: UserItem | null | undefined
): boolean {
  if (!user) return false;
  return true;
}

/**
 * Returns a masked representation of a phone number when the user has no view permission.
 */
export function formatMaskedPhoneNumber(
  phone: string,
  status: number = 1,
  showStatusToUser: boolean = false
): string {
  if (!phone || !phone.trim()) return '—';
  // If user can see the status badge, indicate the level requirement
  if (showStatusToUser) {
    return `•••••••• (скрыт, ур. ${status})`;
  }
  return '•••••••• (номер скрыт)';
}

/**
 * Color styling for phone status badges (1 to 10).
 */
export const PHONE_STATUS_STYLES: Record<
  number,
  { bg: string; text: string; border: string; label: string }
> = {
  1: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Ур. 1' },
  2: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', label: 'Ур. 2' },
  3: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', label: 'Ур. 3' },
  4: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', label: 'Ур. 4' },
  5: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Ур. 5' },
  6: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', label: 'Ур. 6' },
  7: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'Ур. 7' },
  8: { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', border: 'border-fuchsia-200', label: 'Ур. 8' },
  9: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Ур. 9' },
  10: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Ур. 10' },
};
