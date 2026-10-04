import {
  Ticket,
  NotificationItem,
  House,
  PersonalTask,
  PersonalPerson,
  InternalPerson,
  AuditLogItem,
  UserItem,
} from '../types';

export const INITIAL_TICKETS: Ticket[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export const MANAGED_BUILDINGS: Array<{
  address: string;
  apartmentsCount: number;
  year: number;
  status: string;
  activeTickets: number;
}> = [];

export const INITIAL_HOUSES: House[] = [];

export const INITIAL_PERSONAL_TASKS: PersonalTask[] = [];

export const INITIAL_PERSONAL_PEOPLE: PersonalPerson[] = [];

export const INITIAL_INTERNAL_PEOPLE: InternalPerson[] = [];

export const INITIAL_AUDIT_LOG: AuditLogItem[] = [
  {
    id: 1,
    action: 'Инициализация чистой рабочей базы',
    entity: 'Система',
    entity_id: 'sys',
    user_name: 'Главный администратор',
    details: 'База данных очищена и подготовлена к внесению реальных домов, жильцов и заявок.',
    created_at: '2026-09-27 10:00',
    can_undo: false,
  },
];

export const INITIAL_USERS: UserItem[] = [
  {
    id: 1,
    organization_id: 'all',
    username: 'admin',
    password: 'admin',
    full_name: 'Главный администратор',
    phone: '+38 (050) 000-00-01',
    role: 'admin',
    approved: true,
    created_at: '2026-01-10',
    permissions: [
      'home',
      'map',
      'houses',
      'new_house',
      'edit_house',
      'new_request',
      'send_messenger',
      'accept_request',
      'edit_request',
      'complete_request',
      'delete_request',
      'planned',
      'my_tasks_view',
      'people_view',
      'add_employee',
      'internal',
      'delete_employee',
      'search',
      'audit',
      'notifications',
      'messages',
      'admin',
    ],
  },
  {
    id: 2,
    organization_id: 'org-1',
    username: 'dispatcher',
    password: '123',
    full_name: 'Дежурный диспетчер',
    phone: '+38 (067) 554-12-88',
    role: 'editor',
    approved: true,
    created_at: '2026-02-15',
    permissions: [
      'home',
      'map',
      'houses',
      'new_house',
      'edit_house',
      'new_request',
      'send_messenger',
      'accept_request',
      'edit_request',
      'complete_request',
      'planned',
      'my_tasks_view',
      'people_view',
      'add_employee',
      'internal',
      'search',
      'notifications',
    ],
  },
  {
    id: 3,
    organization_id: 'org-1',
    username: 'worker',
    password: '123',
    full_name: 'Сотрудник службы',
    phone: '+38 (093) 111-22-33',
    role: 'viewer',
    approved: true,
    created_at: '2026-03-01',
    permissions: ['home', 'map', 'houses', 'search'],
  },
];
