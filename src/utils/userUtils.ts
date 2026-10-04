import { UserItem } from '../types';

/**
 * Extract surname or designated account name for personal isolation.
 * For example:
 * "Зикун В.В." -> "Зикун"
 * "Иванов Иван Иванович" -> "Иванов"
 * "Главный администратор" -> "Главный администратор"
 * "Дежурный диспетчер" -> "Диспетчер"
 */
export const getUserSurname = (user?: UserItem | null): string => {
  if (!user) return 'Пользователь';
  const fullName = user.full_name?.trim() || user.username || 'Пользователь';
  const parts = fullName.split(/\s+/);
  if (parts.length > 1 && parts[0].toLowerCase() === 'главный' && parts[1]?.toLowerCase().includes('админ')) {
    return 'Главный администратор';
  }
  if (parts.length > 1 && parts[0].toLowerCase() === 'дежурный' && parts[1]?.toLowerCase().includes('диспетчер')) {
    return 'Диспетчер';
  }
  return parts[0] || fullName;
};
