export type ThemeId = 'light_lavender';

export type GradientId = 'soft_to_deep' | 'amethyst_dawn' | 'lavender_indigo' | 'pearl_ombre';

export interface GradientOption {
  id: GradientId;
  number: number;
  name: string;
  nameEn: string;
  badge: string;
  description: string;
  fromColor: string;
  viaColor?: string;
  toColor: string;
  cssGradient: string;
  hoverGradient: string;
  activeItemGradient: string;
  glowShadow: string;
  buttonShadow: string;
  textColor: string;
  hexSteps: string[];
  stylingNote: string;
  keyFeatures: string[];
}

export interface ThemeConfig {
  id: ThemeId;
  number: number;
  name: string;
  nameEn: string;
  badge: string;
  paletteRef: string;
  description: string;
  keyColors: {
    sidebarBg: string;
    sidebarText: string;
    sidebarHover: string;
    accent: string;
    canvasBg: string;
    cardBg: string;
    cardBorder: string;
    textPrimary: string;
    textSecondary: string;
  };
  hexCodes: string[];
  stylingPhilosophy: string;
  improvementsOverOriginal: string[];
}

export type TicketStatus = 'in_waiting' | 'in_progress' | 'completed';

export interface Ticket {
  id: string;
  organization_id?: string;
  number: string;
  date: string;
  title: string;
  status: TicketStatus;
  address: string;
  street?: string;
  house_number?: string;
  building?: string;
  apartment?: string;
  location_type?: 'apartment' | 'entrance' | 'basement' | 'roof' | 'yard' | 'technical';
  location_value?: string;
  execution_date?: string;
  phone?: string;
  additional_phones?: string[];
  given_by?: string;
  assignee: string;
  assignees?: string[];
  category: 'water' | 'drain' | 'roof' | 'entrance' | 'electric' | 'general';
  urgency: 'low' | 'normal' | 'high' | 'critical';
  description?: string;
  work_description?: string;
  work_materials?: string;
  future_plan?: string;
  residentName?: string;
  residentPhone?: string;
  createdTime?: string;
  planned?: boolean;
  photos?: string[];
  worker_report?: string;
  worker_report_type?: string;
  worker_report_recipient?: string;
  worker_report_at?: string;
  withdrawn_by?: string;
  withdrawn_at?: string;
  withdrawn_reason?: string;
  works?: {
    id: string;
    work_date: string;
    description: string;
    materials: string;
    worker: string;
    result: string;
  }[];
}

export interface NotificationItem {
  id: string;
  time: string;
  title: string;
  description: string;
  unread: boolean;
  type: 'urgent' | 'info' | 'success';
}

export interface DisplaySettings {
  saturation: number; // 30% - 180% (default: 100)
  contrast: number;   // 60% - 150% (default: 100)
  brightness: number; // 75% - 125% (default: 100)
  warmth: number;     // 0% - 50% (default: 0)
}

export interface SavedColorPreset {
  id: string;
  name: string;
  settings: DisplaySettings;
  createdAt?: string;
}

export interface Entrance {
  entrance_no: number;
  floors: number;
  apartment_from?: number;
  apartment_to?: number;
  description: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  registration_code?: string; // 6-значный код регистрации, который задаёт Администратор
  phone?: string;
  address?: string;
  email?: string;
  contact_person?: string;
  notes?: string;
  logo?: string;
  created_at?: string;
  active?: boolean;
}

export interface House {
  id: string;
  organization_id?: string;
  street: string;
  house_number: string;
  building?: string;
  floors: number;
  apartments: number;
  area?: number;
  entrances_count: number;
  notes?: string;
  technical_specs?: string;
  house_data?: string;
  managing_organization?: string;
  latitude?: number;
  longitude?: number;
  entrances: Entrance[];
  planFileName?: string;
}

export interface PersonalTask {
  id: string;
  organization_id?: string;
  task_date: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  owner_user_id?: number;
  owner_surname?: string; // неизменяемый статус «фамилия учётной записи»
}

export interface PersonalPerson {
  id: string;
  organization_id?: string;
  full_name: string;
  organization: string;
  position: string;
  residence_address: string;
  phones: string[];
  notes: string;
  owner_user_id?: number;
  owner_surname?: string; // статус «фамилия учётной записи»
}

export interface InternalPerson {
  id: string;
  organization_id?: string;
  full_name: string;
  organization: string;
  position: string;
  phones: string[];
  telegram?: string;
  viber?: string;
  notes: string;
}

export interface AuditLogItem {
  id: number;
  action: string;
  entity: string;
  entity_id?: string | number;
  user_name: string;
  details: string;
  created_at: string;
  can_undo?: boolean;
  undone?: boolean;
}

export interface UserItem {
  id: number;
  organization_id?: string;
  username: string;
  password?: string;
  full_name: string;
  phone: string;
  role: 'admin' | 'editor' | 'viewer';
  approved: boolean;
  created_at: string;
  permissions: string[];
  personal_tasks_limit?: number; // Лимит записей в Личном списке дел (по умолчанию 100)
}

export interface StreetItem {
  id: number;
  current_name: string;
  old_names: string;
}
