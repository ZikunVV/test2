import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LIGHT_LAVENDER_THEME } from './data/themes';
import { GRADIENT_VARIANTS } from './data/gradients';
import {
  subscribeToCloudWorkspace,
  saveCloudWorkspace,
} from './utils/firebase';
import {
  INITIAL_TICKETS,
  INITIAL_NOTIFICATIONS,
  INITIAL_HOUSES,
  INITIAL_PERSONAL_TASKS,
  INITIAL_PERSONAL_PEOPLE,
  INITIAL_INTERNAL_PEOPLE,
  INITIAL_AUDIT_LOG,
  INITIAL_USERS,
} from './data/mockData';
import {
  GradientId,
  Ticket,
  NotificationItem,
  House,
  PersonalTask,
  PersonalPerson,
  InternalPerson,
  AuditLogItem,
  UserItem,
  StreetItem,
  Organization,
} from './types';
import {
  DEFAULT_STREETS,
  batchReplaceStreetInHousesAndTickets,
} from './utils/streets';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { StatsCards } from './components/StatsCards';
import { TicketCard } from './components/TicketCard';
import { NewTicketModal } from './components/NewTicketModal';
import { TicketDetailModal } from './components/TicketDetailModal';
import { EditTicketModal } from './components/EditTicketModal';
import { NotificationsPopover } from './components/NotificationsPopover';
import { downloadProjectArchive } from './utils/exportProject';
import { EmployeeDetailModal, InspectedWorkerInfo } from './components/EmployeeDetailModal';
import { AdminMessagesModal, AdminMessageItem } from './components/AdminMessagesModal';
import { AuthScreen } from './components/AuthScreen';
import { OfflineIndicator } from './components/PWAInstallButton';

// Views for sections from app.py & PROJECT_HISTORY.md
import { HousesView } from './components/views/HousesView';
import { MapView } from './components/views/MapView';
import { PlannedView } from './components/views/PlannedView';
import { PersonalTasksView } from './components/views/PersonalTasksView';
import { PeopleView } from './components/views/PeopleView';
import { SearchView } from './components/views/SearchView';
import { InternalView } from './components/views/InternalView';
import { AdminView } from './components/views/AdminView';
import { SoundSettingsView } from './components/views/SoundSettingsView';
import {
  UserSoundSettings,
  AlertEventType,
  loadUserSoundSettings,
  saveUserSoundSettings,
  playSoundVariant,
  playReminderAlarm5Seconds,
  speakAlertText,
  triggerDeviceVibration,
  sendBrowserNotification,
  setBackgroundKeepAliveActive,
} from './utils/soundAlerts';
import {
  DatabaseBackupModal,
  DatabaseBackupPayload,
} from './components/DatabaseBackupModal';
import { VoiceControlModal } from './components/VoiceControlModal';

import {
  Search,
  Mic,
  Volume2,
  AlertTriangle,
  Bell,
  X,
  Radio,
} from 'lucide-react';

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item) return JSON.parse(item);
  } catch (e) {
    // fallback
  }
  return fallback;
}

export default function App() {
  // Base fixed theme: "Светлая лаванда"
  const theme = LIGHT_LAVENDER_THEME;

  // Fixed active gradient: Variant 2: "Аметистовый рассвет" (Amethyst Dawn) as requested!
  const [currentGradientId, setCurrentGradientId] =
    useState<GradientId>('amethyst_dawn');
  const currentGradient = GRADIENT_VARIANTS[currentGradientId];

  // Compare mode: flat color fallback vs gradient
  const [showFlatFallback, setShowFlatFallback] = useState<boolean>(false);

  // Selected ticket for single-click color change
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Persistent Data States (Cleared for real production/testing data)
  const [tickets, setTickets] = useState<Ticket[]>(() => {
    if (localStorage.getItem('app_db_cleared_for_real_data_v2') !== 'true') {
      localStorage.removeItem('app_tickets');
      localStorage.removeItem('app_houses');
      localStorage.removeItem('app_personal_tasks');
      localStorage.removeItem('app_personal_people');
      localStorage.removeItem('app_recently_viewed_houses');
      localStorage.setItem('app_db_cleared_for_real_data_v2', 'true');
      return [];
    }
    return loadStorage('app_tickets', INITIAL_TICKETS);
  });
  const [houses, setHouses] = useState<House[]>(() => {
    if (localStorage.getItem('app_db_cleared_for_real_data_v2') !== 'true') {
      return [];
    }
    return loadStorage<House[]>('app_houses', INITIAL_HOUSES);
  });
  const [personalTasks, setPersonalTasks] = useState<PersonalTask[]>(() => {
    if (localStorage.getItem('app_db_cleared_for_real_data_v2') !== 'true') {
      return [];
    }
    return loadStorage('app_personal_tasks', INITIAL_PERSONAL_TASKS);
  });
  const [personalPeople, setPersonalPeople] = useState<PersonalPerson[]>(() => {
    if (localStorage.getItem('app_db_cleared_for_real_data_v2') !== 'true') {
      return [];
    }
    return loadStorage('app_personal_people', INITIAL_PERSONAL_PEOPLE);
  });
  const [internalPeople] = useState<InternalPerson[]>(INITIAL_INTERNAL_PEOPLE);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(() =>
    loadStorage('app_audit_logs', INITIAL_AUDIT_LOG)
  );
  const [users, setUsers] = useState<UserItem[]>(() => {
    const loaded = loadStorage('app_users', INITIAL_USERS);
    return loaded.map((u) => {
      const isAdminUser = u.username === 'admin';
      const nextPass = isAdminUser
        ? !u.password || u.password === 'admin'
          ? 'Vjqgfhjkm0639444986Admin'
          : u.password
        : u.password || '123';
      return {
        ...u,
        organization_id: u.organization_id || (isAdminUser ? 'all' : 'org-1'),
        password: nextPass,
        personal_tasks_limit:
          typeof u.personal_tasks_limit === 'number' ? u.personal_tasks_limit : 100,
      };
    });
  });

  useEffect(() => {
    try {
      localStorage.setItem('app_users', JSON.stringify(users));
    } catch (e) {}
  }, [users]);

  // Streets Directory state
  const [streets, setStreets] = useState<StreetItem[]>(() =>
    loadStorage('app_streets', DEFAULT_STREETS)
  );

  useEffect(() => {
    try {
      localStorage.setItem('app_streets', JSON.stringify(streets));
    } catch (e) {}
  }, [streets]);

  // Organizations Directory state (Multi-tenancy foundation)
  const [organizations, setOrganizations] = useState<Organization[]>(() => {
    const loaded = loadStorage('app_organizations', [
      {
        id: 'org-1',
        name: 'КП «ЖЄК-10»',
        slug: 'zhek10',
        registration_code: '101010',
        phone: '+38 (067) 123-45-67',
        address: 'г. Киев, ул. Шевченко, 10',
        contact_person: 'Главный Администратор',
        active: true,
        created_at: '2026-10-01',
      },
      {
        id: 'org-2',
        name: 'ООО «Комфорт»',
        slug: 'comfort',
        registration_code: '202020',
        phone: '+38 (050) 987-65-43',
        address: 'г. Киев, ул. Победы, 8',
        contact_person: 'Алексей (Управляющий)',
        active: true,
        created_at: '2026-10-02',
      },
    ]);
    // Migrate legacy name "Участок «Доценка»" to "КП «ЖЄК-10»" and ensure registration_code
    return loaded.map((org: Organization, idx: number) => ({
      ...org,
      name:
        org.id === 'org-1' && (org.name === 'Участок «Доценка»' || org.name.includes('Доценка'))
          ? 'КП «ЖЄК-10»'
          : org.name,
      registration_code:
        org.registration_code && /^\d{6}$/.test(org.registration_code)
          ? org.registration_code
          : idx === 0
          ? '101010'
          : '202020',
    }));
  });

  // Active organization state (Multi-Tenancy Шаг 2)
  const [currentOrganizationId, setCurrentOrganizationId] = useState<string>(() => {
    try {
      return localStorage.getItem('app_current_org_id') || 'org-1';
    } catch (e) {
      return 'org-1';
    }
  });

  const handleSelectOrganization = (orgId: string) => {
    setCurrentOrganizationId(orgId);
    try {
      localStorage.setItem('app_current_org_id', orgId);
    } catch (e) {}
  };

  useEffect(() => {
    try {
      localStorage.setItem('app_organizations', JSON.stringify(organizations));
    } catch (e) {}
  }, [organizations]);

  // Automatic Organization Detection from URL (?org=slug or slug.azikun.com subdomain)
  useEffect(() => {
    if (typeof window === 'undefined' || organizations.length === 0) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const querySlug = params.get('org')?.toLowerCase().trim();
      const host = window.location.hostname.toLowerCase();
      let subSlug: string | null = null;
      if (host.endsWith('.azikun.com')) {
        subSlug = host.replace('.azikun.com', '').split('.')[0];
      }

      const targetSlug = querySlug || subSlug;
      if (targetSlug && targetSlug !== 'www') {
        const matchedOrg = organizations.find(
          (o) => o.slug.toLowerCase() === targetSlug || o.id.toLowerCase() === targetSlug
        );
        if (matchedOrg && matchedOrg.id !== currentOrganizationId) {
          handleSelectOrganization(matchedOrg.id);
        }
      }
    } catch (e) {}
  }, [organizations]);

  // Selected house ID to open directly in HousesView
  const [selectedHouseDetailId, setSelectedHouseDetailId] = useState<string | null>(null);

  // Selected house ID to highlight and center in MapView
  const [selectedHouseIdOnMap, setSelectedHouseIdOnMap] = useState<string | null>(null);

  // Active user and permissions (v48.20 + Moderator access rules + Step 3 Auth & Org binding)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('app_is_authenticated') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [currentUserId, setCurrentUserId] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('app_current_user_id');
      return saved ? Number(saved) : 1;
    } catch (e) {
      return 1;
    }
  });
  const currentUser = users.find((u) => u.id === currentUserId) || users[0];

  const handleSwitchUser = (userId: number) => {
    setCurrentUserId(userId);
    try {
      localStorage.setItem('app_current_user_id', String(userId));
    } catch (e) {}
    const targetUser = users.find((u) => u.id === userId);
    if (
      targetUser &&
      targetUser.organization_id &&
      targetUser.organization_id !== 'all'
    ) {
      handleSelectOrganization(targetUser.organization_id);
    }
  };

  const handleLoginSuccess = (loggedInUser: UserItem) => {
    setCurrentUserId(loggedInUser.id);
    setIsAuthenticated(true);
    try {
      localStorage.setItem('app_current_user_id', String(loggedInUser.id));
      localStorage.setItem('app_is_authenticated', 'true');
    } catch (e) {}
    if (
      loggedInUser.organization_id &&
      loggedInUser.organization_id !== 'all'
    ) {
      handleSelectOrganization(loggedInUser.organization_id);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.setItem('app_is_authenticated', 'false');
    } catch (e) {}
  };

  // Enforce organization lock if current user is bound to a specific organization
  useEffect(() => {
    if (
      currentUser &&
      currentUser.role !== 'admin' &&
      currentUser.organization_id &&
      currentUser.organization_id !== 'all' &&
      currentOrganizationId !== currentUser.organization_id
    ) {
      handleSelectOrganization(currentUser.organization_id);
    }
  }, [currentUser, currentOrganizationId]);
  const isAdmin = currentUser.role === 'admin';
  const isApproved = currentUser?.approved ?? false;
  const hasPermission = (key: string) => {
    if (!isApproved) return false;
    if (isAdmin) return true;
    return Boolean(currentUser.permissions?.includes(key));
  };

  // Granular permissions for sections and actions
  const canCreateTicket = hasPermission('new_request');
  const canSendMessenger = hasPermission('send_messenger') || hasPermission('new_request');
  const canAcceptTicket = hasPermission('accept_request') || hasPermission('new_request');
  const canEditTickets = hasPermission('edit_request') || hasPermission('new_request');
  const canCompleteTicket = hasPermission('complete_request') || hasPermission('new_request');
  const canDeleteTicket = hasPermission('delete_request');

  const canAddHouses = hasPermission('new_house');
  const canEditHouses = hasPermission('edit_house') || hasPermission('new_house');
  const canEditCoordinates = hasPermission('edit_house') || (currentUser.role === 'editor' && hasPermission('map'));

  const canViewPeople = hasPermission('people_view') || hasPermission('internal') || hasPermission('add_employee');
  const canViewEmployeeCard =
    isAdmin ||
    hasPermission('view_employee_card') ||
    (currentUser.role !== 'viewer' &&
      (hasPermission('people_view') ||
        hasPermission('internal') ||
        hasPermission('add_employee')));
  const canAddPeople = hasPermission('add_employee') || hasPermission('internal');
  const canEditPeople = hasPermission('internal');
  const canDeletePeople = hasPermission('delete_employee') || hasPermission('internal');
  const canViewPersonalTasks = hasPermission('my_tasks_view');
  const canUseVoiceControl = hasPermission('voice_control');

  // Planned ticket modal prefill state
  const [newTicketPrefilledDate, setNewTicketPrefilledDate] = useState<
    string | undefined
  >(undefined);
  const [isNewTicketPlanned, setIsNewTicketPlanned] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    INITIAL_NOTIFICATIONS
  );
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
  const [isAdminMessagesOpen, setIsAdminMessagesOpen] = useState<boolean>(false);
  const [adminMessages, setAdminMessages] = useState<AdminMessageItem[]>(() =>
    loadStorage('app_admin_messages', [])
  );

  // Per-user Sound & Alert Signal settings (stored per user ID)
  const [soundSettings, setSoundSettings] = useState<UserSoundSettings>(() =>
    loadUserSoundSettings(currentUserId)
  );
  const [activeAlertToast, setActiveAlertToast] = useState<{
    id: string;
    type: AlertEventType;
    title: string;
    description: string;
  } | null>(null);
  const soundSettingsRef = useRef<UserSoundSettings>(soundSettings);
  useEffect(() => {
    soundSettingsRef.current = soundSettings;
  }, [soundSettings]);

  useEffect(() => {
    setSoundSettings(loadUserSoundSettings(currentUserId));
  }, [currentUserId]);

  const handleUpdateSoundSettings = (next: UserSoundSettings) => {
    setSoundSettings(next);
    saveUserSoundSettings(currentUserId, next);
  };

  const triggerAlertSignal = (
    type: AlertEventType,
    title: string,
    description: string,
    forceTest: boolean = false
  ) => {
    const cfg = soundSettingsRef.current;
    if (!forceTest && !cfg.masterEnabled) return;

    const isEventEnabled =
      forceTest ||
      (type === 'new_ticket' && cfg.enableNewTicket) ||
      (type === 'urgent_ticket' && cfg.enableUrgentTicket) ||
      (type === 'ticket_status' && cfg.enableTicketStatus) ||
      (type === 'new_message' && cfg.enableNewMessage) ||
      (type === 'personal_task' && cfg.enablePersonalTask);

    if (!isEventEnabled) return;

    const variantId =
      type === 'urgent_ticket'
        ? cfg.urgentSoundVariant
        : type === 'ticket_status'
        ? cfg.statusSoundVariant
        : type === 'new_message'
        ? cfg.messageSoundVariant
        : type === 'personal_task'
        ? cfg.taskSoundVariant
        : cfg.normalSoundVariant;

    if (cfg.masterEnabled || forceTest) {
      if (type === 'personal_task') {
        playReminderAlarm5Seconds(variantId, Math.max(95, cfg.volume));
      } else {
        playSoundVariant(variantId, cfg.volume);
      }
    }

    if (cfg.enableVibration || type === 'personal_task') {
      triggerDeviceVibration(type === 'urgent_ticket', type === 'personal_task');
    }

    if (cfg.enableVoiceAnnounce) {
      speakAlertText(`${title}. ${description}`, cfg.volume);
    }

    if (cfg.enableBrowserPush) {
      sendBrowserNotification(title, description);
    }

    if (cfg.enableVisualBanner || forceTest) {
      const toastId = `alert-${Date.now()}`;
      setActiveAlertToast({
        id: toastId,
        type,
        title,
        description,
      });
      setTimeout(() => {
        setActiveAlertToast((prev) => (prev?.id === toastId ? null : prev));
      }, 6500);
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem('app_admin_messages', JSON.stringify(adminMessages));
    } catch (e) {}
  }, [adminMessages]);

  // Step 4: Real-time Cloud Synchronization via Firebase Firestore
  const isHydratingFromCloudRef = useRef(false);
  const initialCloudCheckDoneRef = useRef(false);
  const lastSavedSignatureRef = useRef<string>('');

  const buildPayloadSignature = (payload: {
    organizations: Organization[];
    houses: House[];
    tickets: Ticket[];
    streets: StreetItem[];
    users: UserItem[];
    personalTasks: PersonalTask[];
    personalPeople: PersonalPerson[];
    auditLogs: AuditLogItem[];
    adminMessages: AdminMessageItem[];
  }) => {
    return JSON.stringify({
      organizations: payload.organizations,
      houses: payload.houses,
      tickets: payload.tickets,
      streets: payload.streets,
      users: payload.users,
      personalTasks: payload.personalTasks,
      personalPeople: payload.personalPeople,
      auditLogs: payload.auditLogs,
      adminMessages: payload.adminMessages,
    });
  };

  useEffect(() => {
    const unsubscribe = subscribeToCloudWorkspace((cloudData) => {
      if (cloudData) {
        const incomingSig = buildPayloadSignature({
          organizations: cloudData.organizations || [],
          houses: cloudData.houses || [],
          tickets: cloudData.tickets || [],
          streets: cloudData.streets || [],
          users: cloudData.users || [],
          personalTasks: cloudData.personalTasks || [],
          personalPeople: cloudData.personalPeople || [],
          auditLogs: cloudData.auditLogs || [],
          adminMessages: cloudData.adminMessages || [],
        });

        if (incomingSig !== lastSavedSignatureRef.current) {
          isHydratingFromCloudRef.current = true;
          lastSavedSignatureRef.current = incomingSig;

          if (cloudData.organizations && cloudData.organizations.length > 0) {
            setOrganizations(cloudData.organizations);
          }
          if (cloudData.houses) setHouses(cloudData.houses);
          if (cloudData.tickets) {
            if (initialCloudCheckDoneRef.current) {
              setTickets((prevTickets) => {
                const prevIds = new Set(prevTickets.map((t) => t.id));
                const newlyAdded = cloudData.tickets!.filter((t) => !prevIds.has(t.id));
                if (newlyAdded.length > 0) {
                  const latest = newlyAdded[0];
                  const isUrgent =
                    latest.urgency === 'critical' ||
                    latest.urgency === 'high' ||
                    (latest.title || '').toLowerCase().includes('авар');
                  setTimeout(() => {
                    triggerAlertSignal(
                      isUrgent ? 'urgent_ticket' : 'new_ticket',
                      isUrgent
                        ? 'Внимание! Новая аварийная заявка'
                        : 'Поступила новая заявка',
                      `${latest.number}: ${latest.title} (${latest.address})`
                    );
                  }, 100);
                }
                return cloudData.tickets!;
              });
            } else {
              setTickets(cloudData.tickets);
            }
          }
          if (cloudData.streets && cloudData.streets.length > 0) {
            setStreets(cloudData.streets);
          }
          if (cloudData.users && cloudData.users.length > 0) {
            setUsers(
              cloudData.users.map((u) =>
                u.username === 'admin' && (!u.password || u.password === 'admin')
                  ? { ...u, password: 'Vjqgfhjkm0639444986Admin' }
                  : u
              )
            );
          }
          if (cloudData.personalTasks) setPersonalTasks(cloudData.personalTasks);
          if (cloudData.personalPeople) setPersonalPeople(cloudData.personalPeople);
          if (cloudData.auditLogs) setAuditLogs(cloudData.auditLogs);
          if (cloudData.adminMessages) {
            if (initialCloudCheckDoneRef.current) {
              setAdminMessages((prevMsgs) => {
                const prevIds = new Set(prevMsgs.map((m) => m.id));
                const newlyAdded = cloudData.adminMessages!.filter(
                  (m) => !prevIds.has(m.id)
                );
                if (newlyAdded.length > 0) {
                  const latest = newlyAdded[0];
                  setTimeout(() => {
                    triggerAlertSignal(
                      'new_message',
                      `Новое сообщение: ${latest.subject}`,
                      `${latest.senderName}: ${latest.text}`
                    );
                  }, 100);
                }
                return cloudData.adminMessages!;
              });
            } else {
              setAdminMessages(cloudData.adminMessages);
            }
          }

          try {
            if (cloudData.organizations) {
              localStorage.setItem('app_organizations', JSON.stringify(cloudData.organizations));
            }
            if (cloudData.houses) {
              localStorage.setItem('app_houses', JSON.stringify(cloudData.houses));
            }
            if (cloudData.tickets) {
              localStorage.setItem('app_tickets', JSON.stringify(cloudData.tickets));
            }
            if (cloudData.streets) {
              localStorage.setItem('app_streets', JSON.stringify(cloudData.streets));
            }
            if (cloudData.users) {
              localStorage.setItem('app_users', JSON.stringify(cloudData.users));
            }
            if (cloudData.personalTasks) {
              localStorage.setItem('app_personal_tasks', JSON.stringify(cloudData.personalTasks));
            }
            if (cloudData.personalPeople) {
              localStorage.setItem('app_personal_people', JSON.stringify(cloudData.personalPeople));
            }
            if (cloudData.auditLogs) {
              localStorage.setItem('app_audit_logs', JSON.stringify(cloudData.auditLogs));
            }
            if (cloudData.adminMessages) {
              localStorage.setItem('app_admin_messages', JSON.stringify(cloudData.adminMessages));
            }
          } catch (e) {}

          setTimeout(() => {
            isHydratingFromCloudRef.current = false;
          }, 150);
        }
        initialCloudCheckDoneRef.current = true;
      } else {
        // Cloud document does not exist yet — seed it with current local state
        initialCloudCheckDoneRef.current = true;
        const currentSig = buildPayloadSignature({
          organizations,
          houses,
          tickets,
          streets,
          users,
          personalTasks,
          personalPeople,
          auditLogs,
          adminMessages,
        });
        lastSavedSignatureRef.current = currentSig;
        saveCloudWorkspace({
          updatedBy: currentUser?.full_name || 'Главный администратор',
          updatedAtIso: new Date().toISOString(),
          organizations,
          houses,
          tickets,
          streets,
          users,
          personalTasks,
          personalPeople,
          auditLogs,
          adminMessages,
        }).catch(() => {});
      }
    });

    return () => unsubscribe();
  }, []);

  // Push local changes to Firestore in real-time
  useEffect(() => {
    if (!initialCloudCheckDoneRef.current || isHydratingFromCloudRef.current) {
      return;
    }

    const nextSig = buildPayloadSignature({
      organizations,
      houses,
      tickets,
      streets,
      users,
      personalTasks,
      personalPeople,
      auditLogs,
      adminMessages,
    });

    if (nextSig === lastSavedSignatureRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      lastSavedSignatureRef.current = nextSig;
      saveCloudWorkspace({
        updatedBy: currentUser?.full_name || 'Система',
        updatedAtIso: new Date().toISOString(),
        organizations,
        houses,
        tickets,
        streets,
        users,
        personalTasks,
        personalPeople,
        auditLogs,
        adminMessages,
      }).catch(() => {});
    }, 300);

    return () => clearTimeout(timer);
  }, [
    organizations,
    houses,
    tickets,
    streets,
    users,
    personalTasks,
    personalPeople,
    auditLogs,
    adminMessages,
    currentUser,
  ]);

  const handleSendAdminMessage = (subject: string, text: string) => {
    const newMsg: AdminMessageItem = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.full_name,
      senderRole: currentUser.role,
      organizationId: currentOrganizationId,
      subject,
      text,
      createdAt: new Date().toLocaleString('ru-RU'),
      resolved: false,
    };
    setAdminMessages((prev) => [newMsg, ...prev]);
    setNotifications((prev) => [
      {
        id: `notif-msg-${Date.now()}`,
        title: `Сообщение администратору: ${subject}`,
        description: `${currentUser.full_name}: ${text}`,
        time: 'Только что',
        unread: true,
        type: 'info',
      },
      ...prev,
    ]);
    setAuditLogs((prev) => [
      {
        id: Date.now(),
        action: 'Отправлено сообщение администратору',
        entity: 'Сообщение',
        entity_id: newMsg.id,
        user_name: currentUser.full_name,
        details: `[${subject}] ${text}`,
        created_at: new Date().toLocaleString('ru-RU'),
        can_undo: false,
      },
      ...prev,
    ]);
    triggerAlertSignal(
      'new_message',
      `Новое сообщение: ${subject}`,
      `${currentUser.full_name}: ${text}`
    );
  };

  const handleReplyAdminMessage = (id: string, replyText: string) => {
    setAdminMessages((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              adminReply: replyText,
              repliedAt: new Date().toLocaleString('ru-RU'),
              resolved: true,
            }
          : m
      )
    );
    triggerAlertSignal(
      'new_message',
      'Ответ администратора',
      replyText
    );
  };

  const handleToggleAdminMessageResolved = (id: string) => {
    setAdminMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, resolved: !m.resolved } : m))
    );
  };

  const handleDeleteAdminMessage = (id: string) => {
    setAdminMessages((prev) => prev.filter((m) => m.id !== id));
  };

  // Global inspected worker modal state (double click on any employee badge/pill)
  const [inspectedWorker, setInspectedWorker] = useState<InspectedWorkerInfo | null>(null);

  const handleInspectWorker = (workerName: string) => {
    if (!canViewEmployeeCard) {
      return;
    }
    if (!workerName || workerName.trim() === '' || workerName === 'Не назначен') return;
    const cleanName = workerName.trim();
    const foundInPersonal = personalPeople.find(
      (p) => p.full_name?.trim().toLowerCase() === cleanName.toLowerCase()
    );
    if (foundInPersonal) {
      setInspectedWorker(foundInPersonal);
      return;
    }
    const foundInInternal = internalPeople.find(
      (p) => p.full_name?.trim().toLowerCase() === cleanName.toLowerCase()
    );
    if (foundInInternal) {
      setInspectedWorker({
        full_name: foundInInternal.full_name,
        position: foundInInternal.position,
        organization: foundInInternal.organization,
        phones: foundInInternal.phones,
        notes: foundInInternal.notes,
        owner_surname: 'Корпоративный справочник',
      });
      return;
    }
    const foundInUsers = users.find(
      (u) => u.full_name?.trim().toLowerCase() === cleanName.toLowerCase()
    );
    if (foundInUsers) {
      setInspectedWorker({
        full_name: foundInUsers.full_name,
        position:
          foundInUsers.role === 'admin'
            ? 'Главный администратор'
            : foundInUsers.role === 'editor'
            ? 'Диспетчер'
            : 'Сотрудник службы',
        organization: 'ЖЭК / Управляющая компания',
        phones: foundInUsers.phone ? [foundInUsers.phone] : [],
        notes: `Учётная запись системы (${foundInUsers.username})`,
        owner_surname: 'Системный пользователь',
      });
      return;
    }
    setInspectedWorker({
      full_name: cleanName,
      isManual: true,
      owner_surname: 'Введён вручную',
    });
  };

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('app_tickets', JSON.stringify(tickets));
    } catch (e) {}
  }, [tickets]);

  useEffect(() => {
    try {
      localStorage.setItem('app_houses', JSON.stringify(houses));
    } catch (e) {}
  }, [houses]);

  useEffect(() => {
    try {
      localStorage.setItem('app_personal_tasks', JSON.stringify(personalTasks));
    } catch (e) {}
  }, [personalTasks]);

  // Фоновый таймер звуковых напоминаний («Напомни мне через два часа», «Напомни в 12:00»)
  const [isBgWatcherMode, setIsBgWatcherMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('bg_watcher') === '1';
    }
    return false;
  });

  // Автоматическое поддержание фонового аудио-канала, если есть ожидающие напоминания или открыта дежурная вкладка
  useEffect(() => {
    const hasPendingReminders = personalTasks.some(
      (t) => t.status !== 'completed' && !t.reminder_fired && Boolean(t.reminder_at_iso)
    );
    if (isBgWatcherMode || hasPendingReminders) {
      setBackgroundKeepAliveActive(true);
    }
  }, [isBgWatcherMode, personalTasks]);

  // Синхронизация задач между вкладками (чтобы дежурная фоновая вкладка мгновенно видела новые напоминания)
  useEffect(() => {
    const handleStorageSync = (e: StorageEvent) => {
      if (e.key === 'app_personal_tasks' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setPersonalTasks(parsed);
          }
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorageSync);
    return () => window.removeEventListener('storage', handleStorageSync);
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const checkDueReminders = () => {
      const nowMs = Date.now();
      let hasTriggered = false;
      const firedTasks: PersonalTask[] = [];

      setPersonalTasks((prev) => {
        const next = prev.map((task) => {
          if (
            task.status !== 'completed' &&
            !task.reminder_fired &&
            task.reminder_at_iso &&
            (task.owner_user_id === currentUser.id ||
              (task.owner_user_id === undefined && currentUser.id === 1))
          ) {
            const targetMs = new Date(task.reminder_at_iso).getTime();
            if (!isNaN(targetMs) && nowMs >= targetMs) {
              hasTriggered = true;
              firedTasks.push(task);
              return { ...task, reminder_fired: true };
            }
          }
          return task;
        });
        return hasTriggered ? next : prev;
      });

      if (firedTasks.length > 0) {
        const latest = firedTasks[0];
        const cleanTitle = latest.title.replace(/^🔔\s*/, '');
        triggerAlertSignal(
          'personal_task',
          `🔔 Звуковое напоминание: ${cleanTitle}`,
          latest.reminder_time_label
            ? `Время напоминания (${latest.reminder_time_label}): ${cleanTitle}`
            : cleanTitle,
          true
        );

        setNotifications((prev) => [
          {
            id: `rem-${Date.now()}`,
            time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
            title: `🔔 Напоминание: ${cleanTitle}`,
            description: latest.description || 'Сработало голосовое звуковое напоминание',
            unread: true,
            type: 'urgent',
          },
          ...prev,
        ]);
      }
    };

    checkDueReminders();
    const intervalId = setInterval(checkDueReminders, 1000);
    return () => clearInterval(intervalId);
  }, [currentUser, soundSettings]);

  useEffect(() => {
    try {
      localStorage.setItem('app_personal_people', JSON.stringify(personalPeople));
    } catch (e) {}
  }, [personalPeople]);

  useEffect(() => {
    try {
      localStorage.setItem('app_audit_logs', JSON.stringify(auditLogs));
    } catch (e) {}
  }, [auditLogs]);

  useEffect(() => {
    try {
      localStorage.setItem('app_users', JSON.stringify(users));
    } catch (e) {}
  }, [users]);

  // Navigation State
  const [activeSidebarNav, setActiveSidebarNav] = useState<string>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Filter & Search state (Main Work List)
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAddressFilter, setSelectedAddressFilter] =
    useState<string>('all');

  // Modals state
  const [isComparisonModalOpen, setIsComparisonModalOpen] =
    useState<boolean>(false);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] =
    useState<boolean>(false);
  const [selectedTicketForDetail, setSelectedTicketForDetail] =
    useState<Ticket | null>(null);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [isEditTicketModalOpen, setIsEditTicketModalOpen] =
    useState<boolean>(false);
  const [isDownloadingProject, setIsDownloadingProject] =
    useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] =
    useState<boolean>(false);
  const [isVoiceControlOpen, setIsVoiceControlOpen] =
    useState<boolean>(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState<boolean>(false);

  // Multi-Tenancy Data Isolation (Шаг 2):
  // Filter tickets strictly by currently active organization
  const currentOrgTickets = useMemo(() => {
    return tickets.filter((t) => (t.organization_id || 'org-1') === currentOrganizationId);
  }, [tickets, currentOrganizationId]);

  // Filter houses strictly by currently active organization
  const currentOrgHouses = useMemo(() => {
    return houses.filter((h) => (h.organization_id || 'org-1') === currentOrganizationId);
  }, [houses, currentOrganizationId]);

  // Stats for Admin View organizations tab
  const housesCountByOrg = useMemo(() => {
    const acc: Record<string, number> = {};
    houses.forEach((h) => {
      const orgId = h.organization_id || 'org-1';
      acc[orgId] = (acc[orgId] || 0) + 1;
    });
    return acc;
  }, [houses]);

  const ticketsCountByOrg = useMemo(() => {
    const acc: Record<string, number> = {};
    tickets.forEach((t) => {
      const orgId = t.organization_id || 'org-1';
      acc[orgId] = (acc[orgId] || 0) + 1;
    });
    return acc;
  }, [tickets]);

  // Helper to get today's date in YYYY-MM-DD and DD.MM.YYYY formats
  const isTicketCompletedToday = (ticket: Ticket): boolean => {
    if (ticket.status !== 'completed') return false;
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayIso = `${yyyy}-${mm}-${dd}`;
    const todayDot = `${dd}.${mm}.${yyyy}`;
    const todaySpace = `${dd} ${mm} ${yyyy}`;

    // If execution_date is explicitly set, check if it matches today
    const execDate = (ticket.execution_date || '').trim();
    if (execDate) {
      return (
        execDate.startsWith(todayIso) ||
        execDate.startsWith(todayDot) ||
        execDate.startsWith(todaySpace)
      );
    }

    // Fallback: if execution_date wasn't stored, check ticket.date
    const ticketDate = (ticket.date || '').trim();
    return (
      ticketDate.startsWith(todayIso) ||
      ticketDate.startsWith(todayDot) ||
      ticketDate.startsWith(todaySpace)
    );
  };

  // Derived counts (strictly scoped to currently active organization)
  const inProgressCount = useMemo(
    () =>
      currentOrgTickets.filter(
        (t) => (!t.planned || t.status === 'completed') && t.status === 'in_progress'
      ).length,
    [currentOrgTickets]
  );
  const inWaitingCount = useMemo(
    () =>
      currentOrgTickets.filter(
        (t) => (!t.planned || t.status === 'completed') && t.status === 'in_waiting'
      ).length,
    [currentOrgTickets]
  );
  // On the Home screen, "Выполнено" shows only tickets completed TODAY (older completed tickets go to "Выполненные работы" archive)
  const completedCount = useMemo(
    () => currentOrgTickets.filter((t) => isTicketCompletedToday(t)).length,
    [currentOrgTickets]
  );
  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => n.unread).length,
    [notifications]
  );

  // Filtered tickets on Home screen (strictly from currentOrgTickets)
  const filteredTickets = useMemo(() => {
    return currentOrgTickets.filter((ticket) => {
      // User requirement:
      // "Все заявки заполненные из «Плановые работы» идут с дополнительным неизменяемым статусом «Плановые» и отображаются только в «Плановые работы». Все заявки со статусом «Плановые» но «Выполненные» отображаются со всеми заявками в «Выполненные работы»."
      if (ticket.planned && ticket.status !== 'completed') {
        return false;
      }

      // Completed tickets from previous days are archived in "Выполненные работы" and hidden from Home screen "За сегодня"
      if (ticket.status === 'completed' && !isTicketCompletedToday(ticket)) {
        return false;
      }

      if (activeFilter === 'in_progress' && ticket.status !== 'in_progress')
        return false;
      if (activeFilter === 'in_waiting' && ticket.status !== 'in_waiting')
        return false;
      if (activeFilter === 'completed' && ticket.status !== 'completed')
        return false;

      if (
        selectedAddressFilter !== 'all' &&
        !ticket.address.toLowerCase().includes(selectedAddressFilter.toLowerCase())
      ) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = ticket.title.toLowerCase().includes(query);
        const matchesAddress = ticket.address.toLowerCase().includes(query);
        const matchesNumber = ticket.number.toLowerCase().includes(query);
        const matchesAssignee = ticket.assignee.toLowerCase().includes(query);
        return (
          matchesTitle || matchesAddress || matchesNumber || matchesAssignee
        );
      }

      return true;
    });
  }, [currentOrgTickets, activeFilter, searchQuery, selectedAddressFilter]);

  // Handlers for Ticket Actions
  const handleUpdateStatus = (ticketId: string, newStatus: Ticket['status']) => {
    if (newStatus === 'in_progress' && !canAcceptTicket && !canEditTickets) {
      alert('У вас нет разрешения для принятия заявки в работу.');
      return;
    }
    if (newStatus === 'completed' && !canCompleteTicket && !canEditTickets) {
      alert('У вас нет разрешения для завершения заявки.');
      return;
    }
    if (newStatus === 'in_waiting' && !canEditTickets) {
      alert('У вас нет разрешения для изменения статуса заявки.');
      return;
    }
    const now = new Date();
    const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(now.getDate()).padStart(2, '0')}`;

    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: newStatus,
              execution_date:
                newStatus === 'completed' ? todayIso : t.execution_date,
            }
          : t
      )
    );
    if (selectedTicketForDetail?.id === ticketId) {
      setSelectedTicketForDetail((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
              execution_date:
                newStatus === 'completed' ? todayIso : prev.execution_date,
            }
          : null
      );
    }
  };

  const handleCreateTicket = (
    newTicketData: Omit<Ticket, 'id' | 'number'>
  ) => {
    if (!canCreateTicket) {
      alert('У вас нет прав доступа для создания заявок.');
      return;
    }
    const today = new Date();
    const formattedDate = `${String(today.getDate()).padStart(2, '0')}.${String(
      today.getMonth() + 1
    ).padStart(2, '0')}.${today.getFullYear()}`;
    const sequenceNum = String(tickets.length + 1).padStart(3, '0');
    const newNumber = `№${formattedDate}-${sequenceNum}`;

    const newTicket: Ticket = {
      ...newTicketData,
      id: `ticket-${Date.now()}`,
      organization_id: currentOrganizationId,
      number: newNumber,
      date: newTicketData.date || today.toISOString().split('T')[0],
      planned: Boolean(newTicketData.planned || isNewTicketPlanned),
    };

    setTickets((prev) => [newTicket, ...prev]);

    // Audit log entry
    setAuditLogs((prev) => [
      {
        id: Date.now(),
        action: 'Создана новая заявка',
        entity: 'Заявка',
        entity_id: newTicket.id,
        user_name: currentUser.full_name,
        details: `${newTicket.number}: ${newTicket.title} (${newTicket.address})`,
        created_at: new Date().toLocaleString('ru-RU'),
        can_undo: false,
      },
      ...prev,
    ]);

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: 'Новая заявка создана',
        description: `${newTicket.title} по адресу ${newTicket.address}`,
        time: 'Только что',
        unread: true,
        type: 'urgent',
      },
      ...prev,
    ]);

    const isUrgent =
      newTicket.urgency === 'critical' ||
      newTicket.urgency === 'high' ||
      newTicket.title.toLowerCase().includes('авар') ||
      newTicket.title.toLowerCase().includes('прорыв');

    triggerAlertSignal(
      isUrgent ? 'urgent_ticket' : 'new_ticket',
      isUrgent ? 'Внимание! Аварийная заявка' : 'Новая заявка создана',
      `${newTicket.number}: ${newTicket.title} (${newTicket.address})`
    );
  };

  const handleOpenEditTicket = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setIsEditTicketModalOpen(true);
  };

  const handleUpdateTicket = (updatedTicket: Ticket) => {
    if (!canEditTickets) {
      alert('У вас нет прав доступа для редактирования заявок.');
      return;
    }
    setTickets((prev) =>
      prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t))
    );
    if (selectedTicketForDetail?.id === updatedTicket.id) {
      setSelectedTicketForDetail(updatedTicket);
    }
    setAuditLogs((prev) => [
      {
        id: Date.now(),
        action: 'Редактирование заявки',
        entity: 'Заявка',
        entity_id: updatedTicket.id,
        user_name: currentUser.full_name,
        details: `${updatedTicket.number}: ${updatedTicket.title} (${updatedTicket.address})`,
        created_at: new Date().toLocaleString('ru-RU'),
        can_undo: false,
      },
      ...prev,
    ]);
  };

  const handleDownloadProject = async () => {
    try {
      setIsDownloadingProject(true);
      await downloadProjectArchive({
        currentDatabase: {
          tickets,
          houses,
          users,
          personalPeople,
          personalTasks,
          streets,
          auditLogs,
        },
      });
    } catch (err) {
      console.error('Failed to download project archive:', err);
      alert('Не удалось создать архив проекта. Пожалуйста, попробуйте снова.');
    } finally {
      setIsDownloadingProject(false);
    }
  };

  // Worker report submission
  const handleSubmitReport = (
    ticketId: string,
    reportText: string,
    reportType: string,
    recipient: string
  ) => {
    const reportAt = new Date().toLocaleString('ru-RU');
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              worker_report: reportText,
              worker_report_type: reportType,
              worker_report_recipient: recipient,
              worker_report_at: reportAt,
              status: reportType === 'completed' ? 'completed' : 'in_progress',
            }
          : t
      )
    );
    if (selectedTicketForDetail?.id === ticketId) {
      setSelectedTicketForDetail((prev) =>
        prev
          ? {
              ...prev,
              worker_report: reportText,
              worker_report_type: reportType,
              worker_report_recipient: recipient,
              worker_report_at: reportAt,
              status: reportType === 'completed' ? 'completed' : 'in_progress',
            }
          : null
      );
    }
    setAuditLogs((prev) => [
      {
        id: Date.now(),
        action: 'Сдан отчёт сотрудника',
        entity: 'Заявка',
        entity_id: ticketId,
        user_name: currentUser.full_name,
        details: `Отчёт: ${reportText} (тип: ${reportType})`,
        created_at: reportAt,
        can_undo: false,
      },
      ...prev,
    ]);
    triggerAlertSignal(
      'ticket_status',
      'Сдан отчёт сотрудника',
      `${currentUser.full_name}: ${reportText}`
    );
  };
  const handleWithdrawTicket = (
    ticketId: string,
    adminName: string,
    reason: string
  ) => {
    const withdrawnAt = new Date().toLocaleString('ru-RU');
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: 'completed',
              withdrawn_by: adminName,
              withdrawn_at: withdrawnAt,
              withdrawn_reason: reason,
            }
          : t
      )
    );
    setAuditLogs((prev) => [
      {
        id: Date.now(),
        action: 'Заявка снята',
        entity: 'Заявка',
        entity_id: ticketId,
        user_name: adminName,
        details: `Заявка #${ticketId} снята администратором. Причина: ${reason}`,
        created_at: withdrawnAt,
        can_undo: true,
      },
      ...prev,
    ]);
  };

  // Add work act to ticket
  const handleAddWork = (
    ticketId: string,
    work: {
      work_date: string;
      description: string;
      materials: string;
      worker: string;
      result: string;
    }
  ) => {
    const newWorkItem = { ...work, id: `w-${Date.now()}` };
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              works: [...(t.works || []), newWorkItem],
            }
          : t
      )
    );
    if (selectedTicketForDetail?.id === ticketId) {
      setSelectedTicketForDetail((prev) =>
        prev
          ? {
              ...prev,
              works: [...(prev.works || []), newWorkItem],
            }
          : null
      );
    }
    setAuditLogs((prev) => [
      {
        id: Date.now(),
        action: 'Добавлен акт выполненных работ',
        entity: 'Заявка',
        entity_id: ticketId,
        user_name: currentUser.full_name,
        details: `${work.description} (${work.worker})`,
        created_at: new Date().toLocaleString('ru-RU'),
        can_undo: false,
      },
      ...prev,
    ]);
  };

  // Houses handlers
  const handleUpdateHouse = (updatedHouse: House) => {
    if (!canEditHouses) {
      alert('У вас нет прав доступа для редактирования данных домов.');
      return;
    }
    setHouses((prev) => {
      const next = prev.map((h) => (h.id === updatedHouse.id ? updatedHouse : h));
      try {
        localStorage.setItem('app_houses', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    setAuditLogs((prev) => [
      {
        id: Date.now(),
        action: 'Изменены данные дома',
        entity: 'Дом',
        entity_id: updatedHouse.id,
        user_name: currentUser.full_name,
        details: `Обновлены данные дома ул. ${updatedHouse.street}, ${updatedHouse.house_number}${updatedHouse.building ? ' к. ' + updatedHouse.building : ''}`,
        created_at: new Date().toLocaleString('ru-RU'),
        can_undo: false,
      },
      ...prev,
    ]);
  };

  const handleCreateHouse = (newHouse: House) => {
    if (!canAddHouses) {
      alert('У вас нет прав доступа для добавления новых домов.');
      return;
    }
    const houseWithOrg: House = {
      ...newHouse,
      organization_id: currentOrganizationId,
    };
    setHouses((prev) => {
      const next = [houseWithOrg, ...prev];
      try {
        localStorage.setItem('app_houses', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    setAuditLogs((prev) => [
      {
        id: Date.now(),
        action: 'Создан новый дом',
        entity: 'Дом',
        entity_id: houseWithOrg.id,
        user_name: currentUser.full_name,
        details: `Добавлен дом ул. ${houseWithOrg.street}, ${houseWithOrg.house_number}${houseWithOrg.building ? ' к. ' + houseWithOrg.building : ''}`,
        created_at: new Date().toLocaleString('ru-RU'),
        can_undo: false,
      },
      ...prev,
    ]);
  };

  // Organization Management Handlers (Multi-Tenancy Шаг 2)
  const handleCreateOrganization = (newOrg: Organization) => {
    setOrganizations((prev) => {
      const next = [...prev, newOrg];
      try {
        localStorage.setItem('app_organizations', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    setAuditLogs((prev) => [
      {
        id: Date.now(),
        action: 'Создана организация',
        entity: 'Организация',
        entity_id: newOrg.id,
        user_name: currentUser.full_name,
        details: `Создана организация «${newOrg.name}» (${newOrg.slug}.azikun.com)`,
        created_at: new Date().toLocaleString('ru-RU'),
        can_undo: false,
      },
      ...prev,
    ]);
  };

  const handleUpdateOrganization = (updatedOrg: Organization) => {
    setOrganizations((prev) => {
      const next = prev.map((o) => (o.id === updatedOrg.id ? updatedOrg : o));
      try {
        localStorage.setItem('app_organizations', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const handleDeleteOrganization = (orgId: string) => {
    if (organizations.length <= 1) {
      alert('Нельзя удалить единственную оставшуюся организацию в системе.');
      return;
    }
    const org = organizations.find((o) => o.id === orgId);
    if (!org) return;

    if (
      !confirm(
        `Вы действительно хотите удалить организацию «${org.name}»? База домов и заявок будет сохранена, но доступ к ней будет закрыт.`
      )
    ) {
      return;
    }

    setOrganizations((prev) => {
      const next = prev.filter((o) => o.id !== orgId);
      try {
        localStorage.setItem('app_organizations', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    if (currentOrganizationId === orgId) {
      const fallback = organizations.find((o) => o.id !== orgId)?.id || 'org-1';
      handleSelectOrganization(fallback);
    }
  };

  const handleUpdateCoordinates = (
    houseId: string,
    lat: number,
    lng: number
  ) => {
    if (!canEditCoordinates) {
      alert('У вас нет прав доступа для изменения координат.');
      return;
    }
    setHouses((prev) =>
      prev.map((h) =>
        h.id === houseId ? { ...h, latitude: lat, longitude: lng } : h
      )
    );
    setAuditLogs((prev) => [
      {
        id: Date.now(),
        action: 'Изменены координаты дома',
        entity: 'Дом',
        entity_id: houseId,
        user_name: currentUser.full_name,
        details: `Установлены координаты: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        created_at: new Date().toLocaleString('ru-RU'),
        can_undo: false,
      },
      ...prev,
    ]);
  };

  // Personal Tasks Handlers (Restricted strictly to the authenticated user account with my_tasks_view permission)
  const handleUpdatePersonalTask = (updated: PersonalTask) => {
    if (!currentUser || !currentUser.approved || !canViewPersonalTasks) {
      alert('У вас нет разрешения для работы с личным списком дел.');
      return;
    }
    if (updated.owner_user_id !== undefined && updated.owner_user_id !== currentUser.id) {
      alert('Вы не можете изменять чужие личные записи.');
      return;
    }
    setPersonalTasks((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );
  };

  const handleCreatePersonalTask = (newTask: PersonalTask) => {
    if (!currentUser || !currentUser.approved || !canViewPersonalTasks) {
      alert('У вас нет разрешения для добавления записей в личный список дел.');
      return;
    }
    const maxLimit =
      typeof currentUser.personal_tasks_limit === 'number'
        ? currentUser.personal_tasks_limit
        : 100;
    const userTaskCount = personalTasks.filter((t) =>
      t.owner_user_id !== undefined ? t.owner_user_id === currentUser.id : currentUser.id === 1
    ).length;
    if (userTaskCount >= maxLimit) {
      alert(
        `Достигнут установленный администратором лимит записей в Личном списке дел (${maxLimit} шт.). Удалите старые записи или обратитесь к Администратору для увеличения лимита.`
      );
      return;
    }
    setPersonalTasks((prev) => [newTask, ...prev]);
    triggerAlertSignal(
      'personal_task',
      'Личный список дел',
      `Добавлена запись: ${newTask.title}`
    );
  };

  const handleDeletePersonalTask = (id: string) => {
    if (!currentUser || !currentUser.approved || !canViewPersonalTasks) {
      alert('У вас нет разрешения для удаления записей из личного списка дел.');
      return;
    }
    setPersonalTasks((prev) =>
      prev.filter((t) => {
        if (t.id !== id) return true;
        return t.owner_user_id !== undefined && t.owner_user_id !== currentUser.id;
      })
    );
  };

  // Personal Account People Handlers (Made strictly inside PersonalTasksView, isolated to this account)
  const handleUpdateAccountPerson = (updated: PersonalPerson) => {
    if (!currentUser || !currentUser.approved || !canViewPersonalTasks) return;
    if (updated.owner_user_id !== undefined && updated.owner_user_id !== currentUser.id) return;
    setPersonalPeople((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
  };

  const handleCreateAccountPerson = (newPerson: PersonalPerson) => {
    if (!currentUser || !currentUser.approved || !canViewPersonalTasks) return;
    const maxLimit =
      typeof currentUser.personal_tasks_limit === 'number'
        ? currentUser.personal_tasks_limit
        : 100;
    const userPeopleCount = personalPeople.filter(
      (p) => p.owner_user_id === currentUser.id
    ).length;
    if (userPeopleCount >= maxLimit) {
      alert(
        `Достигнут установленный администратором лимит личных контактов (${maxLimit} шт.). Удалите неактуальные записи или обратитесь к Администратору.`
      );
      return;
    }
    setPersonalPeople((prev) => [newPerson, ...prev]);
  };

  const handleDeleteAccountPerson = (id: string) => {
    if (!currentUser || !currentUser.approved || !canViewPersonalTasks) return;
    setPersonalPeople((prev) =>
      prev.filter((p) => {
        if (p.id !== id) return true;
        return p.owner_user_id !== undefined && p.owner_user_id !== currentUser.id;
      })
    );
  };

  // Corporate People Handlers (Admin & Corporate Directory)
  const handleUpdatePersonalPerson = (updated: PersonalPerson) => {
    if (!canEditPeople) {
      alert('У вас нет прав доступа для редактирования списка сотрудников.');
      return;
    }
    setPersonalPeople((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
  };

  const handleCreatePersonalPerson = (newPerson: PersonalPerson) => {
    if (!canAddPeople) {
      alert('У вас нет прав доступа для добавления сотрудников.');
      return;
    }
    setPersonalPeople((prev) => [newPerson, ...prev]);
  };

  const handleDeletePersonalPerson = (id: string) => {
    if (!canDeletePeople) {
      alert('У вас нет прав доступа для удаления сотрудников.');
      return;
    }
    setPersonalPeople((prev) => prev.filter((p) => p.id !== id));
  };

  // Admin handlers
  const handleUpdateUserRole = (
    userId: number,
    role: 'admin' | 'editor' | 'viewer'
  ) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        let nextPerms = u.permissions || [];
        if (role === 'admin') {
          nextPerms = [
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
            'view_employee_card',
            'add_employee',
            'internal',
            'delete_employee',
            'search',
            'audit',
            'notifications',
            'messages',
            'voice_control',
            'admin',
          ];
        } else if (role === 'editor' && u.role === 'viewer') {
          nextPerms = [
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
            'view_employee_card',
            'add_employee',
            'internal',
            'search',
            'notifications',
          ];
        } else if (role === 'viewer') {
          nextPerms = ['home', 'map', 'houses', 'search'];
        }
        return { ...u, role, permissions: nextPerms };
      })
    );
  };

  const handleUpdateUserOrganization = (
    userId: number,
    organizationId: string
  ) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, organization_id: organizationId } : u
      )
    );
    if (currentUserId === userId && organizationId !== 'all') {
      handleSelectOrganization(organizationId);
    }
  };

  const handleCreateUser = (
    newUser: Omit<UserItem, 'id' | 'created_at' | 'approved' | 'permissions'>
  ): UserItem => {
    const defaultPerms =
      newUser.role === 'admin'
        ? [
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
            'view_employee_card',
            'add_employee',
            'internal',
            'delete_employee',
            'search',
            'audit',
            'notifications',
            'messages',
            'admin',
          ]
        : newUser.role === 'editor'
        ? [
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
            'view_employee_card',
            'add_employee',
            'internal',
            'search',
            'notifications',
          ]
        : ['home', 'map', 'houses', 'search'];

    const created: UserItem = {
      ...newUser,
      id: Date.now(),
      approved: true,
      created_at: new Date().toISOString().split('T')[0],
      permissions: defaultPerms,
      personal_tasks_limit:
        typeof newUser.personal_tasks_limit === 'number'
          ? newUser.personal_tasks_limit
          : 100,
    };

    setUsers((prev) => [...prev, created]);
    setAuditLogs((prev) => [
      {
        id: Date.now(),
        action: 'Добавлен пользователь',
        entity: 'Пользователь',
        entity_id: created.id,
        user_name: currentUser?.full_name || 'Система',
        details: `Создана учётная запись «${created.full_name}» (логин: ${created.username})`,
        created_at: new Date().toLocaleString('ru-RU'),
        can_undo: false,
      },
      ...prev,
    ]);
    return created;
  };

  const handleDeleteUser = (userId: number) => {
    const target = users.find((u) => u.id === userId);
    if (!target || target.username === 'admin') return;
    if (!confirm(`Удалить учётную запись «${target.full_name}»?`)) return;
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    if (currentUserId === userId) {
      handleSwitchUser(1);
    }
  };

  const handleToggleUserApproved = (userId: number) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, approved: !u.approved } : u))
    );
  };

  const handleUpdateUserPermissions = (
    userId: number,
    permissions: string[]
  ) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, permissions } : u))
    );
  };

  const handleUpdateUserPersonalLimit = (userId: number, limit: number) => {
    const safeLimit = Math.max(0, Math.min(5000, Math.floor(Number(limit) || 0)));
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, personal_tasks_limit: safeLimit } : u
      )
    );
  };

  const handleUndoAuditAction = (logId: number) => {
    const targetLog = auditLogs.find((l) => l.id === logId);
    if (targetLog && targetLog.entity_id) {
      const ticketId = String(targetLog.entity_id);
      if (targetLog.action === 'Заявка снята') {
        setTickets((prev) =>
          prev.map((t) =>
            t.id === ticketId
              ? {
                  ...t,
                  status: 'in_progress',
                  withdrawn_by: undefined,
                  withdrawn_at: undefined,
                  withdrawn_reason: undefined,
                }
              : t
          )
        );
      } else if (targetLog.action === 'Заявка принята в работу') {
        setTickets((prev) =>
          prev.map((t) =>
            t.id === ticketId ? { ...t, status: 'in_waiting' } : t
          )
        );
      }
    }
    setAuditLogs((prev) =>
      prev.map((l) => (l.id === logId ? { ...l, undone: true } : l))
    );
  };

  // Database Backup, Restore and Clear Handlers (Chief Administrator)
  const handleRestoreDatabase = (backup: DatabaseBackupPayload) => {
    setHouses(backup.houses || []);
    setTickets(backup.tickets || []);
    if (backup.streets && backup.streets.length > 0) setStreets(backup.streets);
    if (backup.personalTasks) setPersonalTasks(backup.personalTasks);
    if (backup.personalPeople) setPersonalPeople(backup.personalPeople);
    if (backup.users && backup.users.length > 0) setUsers(backup.users);
    if (backup.organizations && backup.organizations.length > 0) {
      setOrganizations(backup.organizations);
    }

    try {
      localStorage.setItem('app_houses', JSON.stringify(backup.houses || []));
      localStorage.setItem('app_tickets', JSON.stringify(backup.tickets || []));
      if (backup.streets) localStorage.setItem('app_streets', JSON.stringify(backup.streets));
      localStorage.setItem('app_personal_tasks', JSON.stringify(backup.personalTasks || []));
      localStorage.setItem('app_personal_people', JSON.stringify(backup.personalPeople || []));
      if (backup.users) localStorage.setItem('app_users', JSON.stringify(backup.users));
      if (backup.organizations) localStorage.setItem('app_organizations', JSON.stringify(backup.organizations));
    } catch (e) {}

    setAuditLogs((prev) => [
      {
        id: Date.now(),
        action: 'Восстановление базы данных из резервной копии',
        entity: 'Система',
        entity_id: 'backup',
        user_name: currentUser.full_name,
        details: `Восстановлено: ${backup.houses?.length || 0} домов, ${backup.tickets?.length || 0} заявок`,
        created_at: new Date().toLocaleString('ru-RU'),
        can_undo: false,
      },
      ...prev,
    ]);
  };

  const handleClearDatabase = () => {
    setHouses([]);
    setTickets([]);
    setPersonalTasks([]);
    setPersonalPeople([]);
    setNotifications([]);

    try {
      localStorage.setItem('app_houses', JSON.stringify([]));
      localStorage.setItem('app_tickets', JSON.stringify([]));
      localStorage.setItem('app_personal_tasks', JSON.stringify([]));
      localStorage.setItem('app_personal_people', JSON.stringify([]));
      localStorage.setItem('app_recently_viewed_houses', JSON.stringify([]));
    } catch (e) {}

    setAuditLogs((prev) => [
      {
        id: Date.now(),
        action: 'Полная очистка базы данных',
        entity: 'Система',
        entity_id: 'clear',
        user_name: currentUser.full_name,
        details: 'База данных очищена главным администратором для внесения реальных рабочих данных',
        created_at: new Date().toLocaleString('ru-RU'),
        can_undo: false,
      },
      ...prev,
    ]);
  };

  const handleBatchRenameStreet = (oldName: string, newName: string) => {
    const { updatedHouses, updatedTickets, housesChanged, ticketsChanged } =
      batchReplaceStreetInHousesAndTickets(oldName, newName, houses, tickets);

    setHouses(updatedHouses);
    setTickets(updatedTickets);

    try {
      localStorage.setItem('app_houses', JSON.stringify(updatedHouses));
      localStorage.setItem('app_tickets', JSON.stringify(updatedTickets));
    } catch (e) {}

    setAuditLogs((prev) => [
      {
        id: Date.now(),
        action: 'Переименование улицы в объектах',
        entity: 'Улица',
        entity_id: newName,
        user_name: currentUser.full_name,
        details: `Старое название «${oldName}» заменено на актуальное «${newName}». Обновлено домов: ${housesChanged}, заявок: ${ticketsChanged}`,
        created_at: new Date().toLocaleString('ru-RU'),
        can_undo: false,
      },
      ...prev,
    ]);
  };

  const handleSelectNav = (navId: string) => {
    if (navId === 'notifications') {
      setIsNotificationsOpen(true);
    } else if (navId === 'messages') {
      setIsAdminMessagesOpen(true);
    } else {
      setActiveSidebarNav(navId);
    }
  };

  const handleResetFilters = () => {
    setActiveFilter('all');
    setSearchQuery('');
    setSelectedAddressFilter('all');
    setSelectedTicketId(null);
  };

  if (!isAuthenticated) {
    return (
      <AuthScreen
        theme={theme}
        gradient={currentGradient}
        showFlatFallback={showFlatFallback}
        users={users}
        organizations={organizations}
        onLoginSuccess={handleLoginSuccess}
        onRegisterUser={(newUserData) =>
          handleCreateUser({
            ...newUserData,
            role: 'viewer',
          })
        }
        onSendMessageToAdmin={(senderName, subject, text) => {
          const newMsg: AdminMessageItem = {
            id: `msg-${Date.now()}`,
            senderId: 0,
            senderName,
            senderRole: 'viewer',
            organizationId: currentOrganizationId,
            subject,
            text,
            createdAt: new Date().toLocaleString('ru-RU'),
            resolved: false,
          };
          setAdminMessages((prev) => [newMsg, ...prev]);
          setNotifications((prev) => [
            {
              id: `notif-msg-${Date.now()}`,
              title: `Сообщение с экрана входа: ${subject}`,
              description: `${senderName}: ${text}`,
              time: 'Только что',
              unread: true,
              type: 'info',
            },
            ...prev,
          ]);
        }}
      />
    );
  }

  return (
    <div
      className="min-h-screen font-sans transition-colors duration-200 relative flex flex-col"
      style={{
        backgroundColor: theme.keyColors.canvasBg,
        color: theme.keyColors.textPrimary,
      }}
    >
        {/* Main Container: Sidebar + Content Area */}
        <div className="flex flex-1">
          {/* 2. SIDEBAR WITH ACTIVE SELECTION GRADIENT ("АМЕТИСТОВЫЙ РАССВЕТ") */}
          <Sidebar
            theme={theme}
            gradient={currentGradient}
            showFlatFallback={showFlatFallback}
            activeNav={activeSidebarNav}
            onSelectNav={handleSelectNav}
            unreadNotificationsCount={unreadNotificationsCount}
            isOpenMobile={isMobileMenuOpen}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
            onOpenNewMessage={() => setIsAdminMessagesOpen(true)}
            currentUser={currentUser}
            users={users}
            onSwitchUser={handleSwitchUser}
            organizations={organizations}
            currentOrganizationId={currentOrganizationId}
            onSelectOrganization={handleSelectOrganization}
            onLogout={handleLogout}
          />

          {/* 3. MAIN WORKSPACE */}
          <div className="flex-1 min-w-0 flex flex-col min-h-screen">
            {/* Header */}
            <Header
              theme={theme}
              gradient={currentGradient}
              showFlatFallback={showFlatFallback}
              onBackClick={handleResetFilters}
              onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              onOpenNotifications={() => setIsNotificationsOpen(true)}
              onOpenVoiceControl={() => setIsVoiceControlOpen(true)}
              unreadCount={unreadNotificationsCount}
              isAdmin={isAdmin}
              onOpenBackupModal={isAdmin ? () => setIsBackupModalOpen(true) : undefined}
              onDownloadProject={isAdmin ? handleDownloadProject : undefined}
              isDownloadingProject={isDownloadingProject}
              currentUser={currentUser}
            />

            {/* Content Body */}
            <main className="p-3 sm:p-6 md:p-8 max-w-7xl w-full mx-auto space-y-4 sm:space-y-6 overflow-x-hidden">
              {/* ROUTING BETWEEN VIEWS */}

              {/* VIEW: HOUSES (ДОМА В УПРАВЛЕНИИ) */}
              {activeSidebarNav === 'buildings' && (
                <HousesView
                  theme={theme}
                  gradient={currentGradient}
                  showFlatFallback={showFlatFallback}
                  houses={currentOrgHouses}
                  tickets={currentOrgTickets}
                  streets={streets}
                  initialSelectedHouseId={selectedHouseDetailId}
                  onClearInitialSelectedHouseId={() => setSelectedHouseDetailId(null)}
                  onShowOnMap={(h) => {
                    setSelectedHouseIdOnMap(h.id);
                    setActiveSidebarNav('map');
                  }}
                  onOpenTicket={(t) => setSelectedTicketForDetail(t)}
                  onUpdateHouse={handleUpdateHouse}
                  onCreateHouse={handleCreateHouse}
                  onBackToHome={() => setActiveSidebarNav('home')}
                  isAdmin={canEditHouses}
                  canAddHouse={canAddHouses}
                  canEditHouse={canEditHouses}
                />
              )}

              {/* VIEW: MAP (КАРТА) */}
              {activeSidebarNav === 'map' && (
                <MapView
                  theme={theme}
                  gradient={currentGradient}
                  showFlatFallback={showFlatFallback}
                  houses={currentOrgHouses}
                  streets={streets}
                  initialSelectedHouseId={selectedHouseIdOnMap}
                  onClearInitialSelectedHouseId={() => setSelectedHouseIdOnMap(null)}
                  onOpenHouse={(h) => {
                    setSelectedHouseDetailId(h.id);
                    setActiveSidebarNav('buildings');
                  }}
                  onUpdateCoordinates={handleUpdateCoordinates}
                  onBackToHome={() => setActiveSidebarNav('home')}
                  isAdmin={canEditCoordinates}
                />
              )}

              {/* VIEW: PLANNED (ПЛАНОВЫЕ РАБОТЫ & КАЛЕНДАРЬ) */}
              {activeSidebarNav === 'scheduled' && (
                <PlannedView
                  theme={theme}
                  gradient={currentGradient}
                  showFlatFallback={showFlatFallback}
                  tickets={currentOrgTickets}
                  onOpenTicket={(t) => setSelectedTicketForDetail(t)}
                  onEditTicket={(t) => handleOpenEditTicket(t)}
                  onAccept={(id) => handleUpdateStatus(id, 'in_progress')}
                  onComplete={(id) => handleUpdateStatus(id, 'completed')}
                  canEdit={canEditTickets}
                  canCreate={canCreateTicket}
                  canAccept={canAcceptTicket}
                  canComplete={canCompleteTicket}
                  canSendMessenger={canSendMessenger}
                  onInspectWorker={canViewEmployeeCard ? handleInspectWorker : undefined}
                  onNewPlannedTicket={(prefilledDate) => {
                    setNewTicketPrefilledDate(prefilledDate);
                    setIsNewTicketPlanned(true);
                    setIsNewTicketModalOpen(true);
                  }}
                  onBackToHome={() => setActiveSidebarNav('home')}
                />
              )}

              {/* VIEW: PERSONAL TASKS (ЛИЧНЫЙ СПИСОК ДЕЛ) */}
              {activeSidebarNav === 'my_tasks' && (
                <PersonalTasksView
                  theme={theme}
                  gradient={currentGradient}
                  showFlatFallback={showFlatFallback}
                  currentUser={canViewPersonalTasks ? currentUser : undefined}
                  canUseVoiceControl={canUseVoiceControl}
                  onOpenWriteToAdmin={() => setIsAdminMessagesOpen(true)}
                  tasks={personalTasks}
                  personalPeople={personalPeople}
                  onUpdateTask={handleUpdatePersonalTask}
                  onCreateTask={handleCreatePersonalTask}
                  onDeleteTask={handleDeletePersonalTask}
                  onUpdatePersonalPerson={handleUpdateAccountPerson}
                  onCreatePersonalPerson={handleCreateAccountPerson}
                  onDeletePersonalPerson={handleDeleteAccountPerson}
                  onBackToHome={() => setActiveSidebarNav('home')}
                />
              )}

              {/* VIEW: PEOPLE (ЛЮДИ - СПРАВОЧНИК) */}
              {activeSidebarNav === 'people' && (
                <PeopleView
                  theme={theme}
                  gradient={currentGradient}
                  showFlatFallback={showFlatFallback}
                  people={personalPeople}
                  canEdit={canEditPeople}
                  canAdd={canAddPeople}
                  canDelete={canDeletePeople}
                  isRegistered={Boolean(currentUser && currentUser.approved && canViewPeople)}
                  onUpdatePerson={handleUpdatePersonalPerson}
                  onCreatePerson={handleCreatePersonalPerson}
                  onDeletePerson={handleDeletePersonalPerson}
                  onBackToHome={() => setActiveSidebarNav('home')}
                />
              )}

              {/* VIEW: COMPLETED SEARCH (ПОИСК ВЫПОЛНЕННЫХ РАБОТ) */}
              {activeSidebarNav === 'completed' && (
                <SearchView
                  theme={theme}
                  gradient={currentGradient}
                  showFlatFallback={showFlatFallback}
                  tickets={currentOrgTickets}
                  onOpenTicket={(t) => setSelectedTicketForDetail(t)}
                  onInspectWorker={canViewEmployeeCard ? handleInspectWorker : undefined}
                  onBackToHome={() => setActiveSidebarNav('home')}
                />
              )}

              {/* VIEW: INTERNAL (КОРПОРАТИВНАЯ ИНФОРМАЦИЯ) */}
              {activeSidebarNav === 'corporate' && (
                <InternalView
                  theme={theme}
                  gradient={currentGradient}
                  showFlatFallback={showFlatFallback}
                  people={internalPeople}
                  onBackToHome={() => setActiveSidebarNav('home')}
                  isAdmin={true}
                />
              )}

              {/* VIEW: ADMIN & AUDIT (АДМИНИСТРИРОВАНИЕ) */}
              {(activeSidebarNav === 'admin' ||
                activeSidebarNav === 'history') && (
                <AdminView
                  theme={theme}
                  gradient={currentGradient}
                  showFlatFallback={showFlatFallback}
                  users={users}
                  auditLogs={auditLogs}
                  streets={streets}
                  organizations={organizations}
                  currentOrganizationId={currentOrganizationId}
                  housesCountByOrg={housesCountByOrg}
                  ticketsCountByOrg={ticketsCountByOrg}
                  onSelectOrganization={handleSelectOrganization}
                  onCreateOrganization={handleCreateOrganization}
                  onUpdateOrganization={handleUpdateOrganization}
                  onDeleteOrganization={handleDeleteOrganization}
                  onUpdateStreets={setStreets}
                  onBatchRenameStreet={handleBatchRenameStreet}
                  onUpdateUserRole={handleUpdateUserRole}
                  onUpdateUserOrganization={handleUpdateUserOrganization}
                  onCreateUser={handleCreateUser}
                  onDeleteUser={handleDeleteUser}
                  onToggleUserApproved={handleToggleUserApproved}
                  onUpdateUserPermissions={handleUpdateUserPermissions}
                  onUpdateUserPersonalLimit={handleUpdateUserPersonalLimit}
                  onUndoAuditAction={handleUndoAuditAction}
                  onBackToHome={() => setActiveSidebarNav('home')}
                  onOpenBackupModal={() => setIsBackupModalOpen(true)}
                />
              )}

              {/* VIEW: SETTINGS -> SOUNDS (НАСТРОЙКИ -> ПАПКА "ЗВУКИ") */}
              {activeSidebarNav === 'sounds' && (
                <SoundSettingsView
                  theme={theme}
                  gradient={currentGradient}
                  showFlatFallback={showFlatFallback}
                  currentUser={currentUser}
                  soundSettings={soundSettings}
                  onUpdateSoundSettings={handleUpdateSoundSettings}
                  onTriggerTestAlert={(type) => {
                    if (type === 'urgent_ticket') {
                      triggerAlertSignal(
                        'urgent_ticket',
                        'Тест: Внимание! Аварийная заявка',
                        'Прорыв трубы ХВС по адресу ул. Шевченко, 10',
                        true
                      );
                    } else if (type === 'new_message') {
                      triggerAlertSignal(
                        'new_message',
                        'Тест: Новое сообщение',
                        'Проверка звукового сигнала входящего сообщения',
                        true
                      );
                    } else if (type === 'personal_task') {
                      triggerAlertSignal(
                        'personal_task',
                        'Тест: Личный список дел',
                        'Напоминание о запланированной задаче',
                        true
                      );
                    } else {
                      triggerAlertSignal(
                        'new_ticket',
                        'Тест: Новая заявка создана',
                        'Проверка выбранной мелодии оповещения',
                        true
                      );
                    }
                  }}
                  onBackToHome={() => setActiveSidebarNav('home')}
                />
              )}

              {/* VIEW: HOME (ГЛАВНАЯ СТРАНИЦА: СПИСОК РАБОТ) */}
              {activeSidebarNav === 'home' && (
                <>
                  {/* Breadcrumb & Title Section */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div
                        className="text-xs mb-1 font-medium"
                        style={{ color: theme.keyColors.textSecondary }}
                      >
                        Главная
                      </div>
                      <h1
                        className="text-2xl md:text-3xl font-black tracking-tight"
                        style={{ color: theme.keyColors.textPrimary }}
                      >
                        Добрый день!
                      </h1>
                    </div>

                    {/* Action Buttons on Home ("Главная"): "Голосовой набор" + "Подать заявку" */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <button
                        type="button"
                        onClick={() => setIsVoiceControlOpen(true)}
                        className="px-4 py-2.5 rounded-xl text-xs font-extrabold text-purple-950 bg-purple-100 hover:bg-purple-200 border border-purple-300 transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] shadow-2xs cursor-pointer"
                        title="Голосовой набор заметки и голосовая навигация по разделам сайта"
                      >
                        <Mic className="w-4 h-4 text-purple-700 shrink-0" />
                        <span>Голосовой набор</span>
                      </button>

                      {canCreateTicket && (
                        <button
                          onClick={() => setIsNewTicketModalOpen(true)}
                          className="group relative px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all duration-200 flex items-center justify-center hover:scale-[1.02] active:scale-[0.98] overflow-hidden shadow-sm cursor-pointer"
                          style={{
                            background: showFlatFallback
                              ? '#7652B5'
                              : currentGradient.cssGradient,
                            boxShadow: showFlatFallback
                              ? 'none'
                              : currentGradient.buttonShadow,
                          }}
                        >
                          <div className="absolute inset-0 opacity-25 pointer-events-none bg-gradient-to-b from-white to-transparent" />
                          <span className="tracking-wide">Подать заявку</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 4. STAT SUMMARY CARDS ("В работе", "В ожидании", "Выполнено") */}
                  <StatsCards
                    theme={theme}
                    gradient={currentGradient}
                    showFlatFallback={showFlatFallback}
                    inProgressCount={inProgressCount}
                    inWaitingCount={inWaitingCount}
                    completedCount={completedCount}
                    activeFilter={activeFilter}
                    onFilterSelect={(f) => setActiveFilter(f)}
                  />

                  {/* 5. WORK LIST SECTION ("Список работ") */}
                  <div className="space-y-4 pt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-purple-100 gap-3">
                      <div className="flex items-center gap-3">
                        <h3
                          className="text-lg font-bold"
                          style={{ color: theme.keyColors.textPrimary }}
                        >
                          Список работ
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-100 text-purple-900 border border-purple-200">
                          {filteredTickets.length}
                        </span>
                      </div>

                      {/* Поисковая строка по журналу заявок на Главной */}
                      <div className="relative w-full sm:w-80 md:w-96">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-purple-500" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Поиск: номер заявки, адрес, работа, мастер..."
                          className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white shadow-2xs text-slate-800 font-medium placeholder:text-slate-400 transition-all"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 p-1"
                            title="Очистить поиск"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Active filter and search chips */}
                    {(activeFilter !== 'all' || searchQuery.trim()) && (
                      <div className="flex items-center gap-2 pt-1 text-xs flex-wrap">
                        {activeFilter !== 'all' && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500">Фильтр по статусу:</span>
                            <span className="px-2.5 py-0.5 rounded-full font-bold bg-purple-100 text-purple-900 border border-purple-200 flex items-center gap-1.5">
                              <span>
                                {activeFilter === 'in_progress'
                                  ? 'В работе'
                                  : activeFilter === 'in_waiting'
                                  ? 'В ожидании'
                                  : 'Выполненные'}
                              </span>
                              <button
                                onClick={() => setActiveFilter('all')}
                                className="hover:text-rose-600 font-bold ml-1"
                                title="Сбросить фильтр"
                              >
                                ×
                              </button>
                            </span>
                          </div>
                        )}
                        {searchQuery.trim() && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500">Поиск:</span>
                            <span className="px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1.5">
                              <span>«{searchQuery}»</span>
                              <button
                                onClick={() => setSearchQuery('')}
                                className="hover:text-rose-600 font-bold ml-1"
                                title="Очистить поиск"
                              >
                                ×
                              </button>
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Ticket Cards List - all tickets go in order row by row */}
                    <div className="space-y-3">
                      {filteredTickets.map((ticket) => (
                        <TicketCard
                          key={ticket.id}
                          ticket={ticket}
                          theme={theme}
                          isSelected={selectedTicketId === ticket.id}
                          canEdit={canEditTickets}
                          canAccept={canAcceptTicket}
                          canComplete={canCompleteTicket}
                          canSendMessenger={canSendMessenger}
                          onSelect={() => {
                            setSelectedTicketId(
                              selectedTicketId === ticket.id ? null : ticket.id
                            );
                          }}
                          onAccept={(id) => handleUpdateStatus(id, 'in_progress')}
                          onComplete={(id) => handleUpdateStatus(id, 'completed')}
                          onOpenDetails={(t) => setSelectedTicketForDetail(t)}
                          onEditTicket={(t) => handleOpenEditTicket(t)}
                          onInspectWorker={canViewEmployeeCard ? handleInspectWorker : undefined}
                        />
                      ))}
                    </div>

                    {/* Empty state */}
                    {filteredTickets.length === 0 && (
                      <div
                        className="py-12 px-4 text-center rounded-2xl border border-dashed border-purple-200 bg-white/50 text-xs"
                        style={{ color: theme.keyColors.textSecondary }}
                      >
                        <Search className="w-8 h-8 mx-auto text-purple-300 mb-2" />
                        <p className="font-semibold text-sm text-slate-700">
                          Заявок не найдено
                        </p>
                        <p className="mt-1">
                          Попробуйте сбросить фильтры или строку поиска.
                        </p>
                        <button
                          onClick={handleResetFilters}
                          className="mt-3 px-3 py-1.5 rounded-lg text-purple-700 font-bold bg-purple-100 hover:bg-purple-200 transition-colors inline-block"
                        >
                          Сбросить фильтры
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </main>
          </div>
        </div>

      {/* New Ticket Modal (+ Заявка) */}
      <NewTicketModal
        isOpen={isNewTicketModalOpen}
        onClose={() => {
          setIsNewTicketModalOpen(false);
          setNewTicketPrefilledDate(undefined);
          setIsNewTicketPlanned(false);
        }}
        theme={theme}
        gradient={currentGradient}
        showFlatFallback={showFlatFallback}
        houses={currentOrgHouses}
        streets={streets}
        people={personalPeople}
        prefilledDate={newTicketPrefilledDate}
        isPlannedDefault={isNewTicketPlanned}
        onCreateTicket={handleCreateTicket}
        canInspectWorker={canViewEmployeeCard}
      />

      {/* Ticket Details / Edit Form Modal (Opens on Double Click) */}
      <TicketDetailModal
        ticket={selectedTicketForDetail}
        onClose={() => setSelectedTicketForDetail(null)}
        theme={theme}
        isAdmin={canEditTickets}
        canAccept={canAcceptTicket}
        canComplete={canCompleteTicket}
        canEdit={canEditTickets}
        canSendMessenger={canSendMessenger}
        canDelete={canDeleteTicket}
        onOpenEdit={(t) => handleOpenEditTicket(t)}
        onUpdateStatus={handleUpdateStatus}
        onSubmitReport={handleSubmitReport}
        onWithdrawTicket={handleWithdrawTicket}
        onAddWork={handleAddWork}
        onInspectWorker={canViewEmployeeCard ? handleInspectWorker : undefined}
      />

      {/* Edit Ticket Modal (for editing ready/completed tickets from Список работ) */}
      <EditTicketModal
        isOpen={isEditTicketModalOpen}
        ticket={editingTicket}
        onClose={() => {
          setIsEditTicketModalOpen(false);
          setEditingTicket(null);
        }}
        onSaveTicket={handleUpdateTicket}
        theme={theme}
        people={personalPeople}
        onInspectWorker={canViewEmployeeCard ? handleInspectWorker : undefined}
      />

      {/* Notifications Drawer */}
      <NotificationsPopover
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        theme={theme}
        notifications={notifications}
        onMarkAllAsRead={() =>
          setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
        }
      />

      {/* Voice Control & Quick Voice Note Modal */}
      <VoiceControlModal
        isOpen={isVoiceControlOpen}
        onClose={() => setIsVoiceControlOpen(false)}
        theme={theme}
        gradient={currentGradient}
        showFlatFallback={showFlatFallback}
        currentUser={currentUser}
        canUseVoiceControl={canUseVoiceControl}
        canCreateTicket={canCreateTicket}
        canViewPersonalTasks={canViewPersonalTasks}
        onNavigate={(navId) => handleSelectNav(navId)}
        onOpenNewTicket={() => setIsNewTicketModalOpen(true)}
        onCreatePersonalTask={handleCreatePersonalTask}
        onSetHomeSearch={(q) => setSearchQuery(q)}
        onOpenWriteToAdmin={() => setIsAdminMessagesOpen(true)}
      />

      {/* Database Backup & Export / Import Modal (Only for Chief Administrator) */}
      {isAdmin && (
        <DatabaseBackupModal
          isOpen={isBackupModalOpen}
          onClose={() => setIsBackupModalOpen(false)}
          houses={houses}
          tickets={tickets}
          streets={streets}
          personalTasks={personalTasks}
          personalPeople={personalPeople}
          auditLogs={auditLogs}
          users={users}
          organizations={organizations}
          onRestoreDatabase={handleRestoreDatabase}
          onClearDatabase={handleClearDatabase}
        />
      )}

      {/* Global Employee Detail Modal (opens on double-click on any employee badge/pill, only if user has permission) */}
      {canViewEmployeeCard && (
        <EmployeeDetailModal
          worker={inspectedWorker}
          onClose={() => setInspectedWorker(null)}
          canSendMessenger={canSendMessenger}
        />
      )}

      {/* Admin Messages Modal ("Написать администратору" & "Сообщения") */}
      <AdminMessagesModal
        isOpen={isAdminMessagesOpen}
        onClose={() => setIsAdminMessagesOpen(false)}
        theme={theme}
        currentUser={currentUser}
        isAdmin={isAdmin}
        messages={adminMessages}
        onSendMessage={handleSendAdminMessage}
        onReplyMessage={handleReplyAdminMessage}
        onToggleResolved={handleToggleAdminMessageResolved}
        onDeleteMessage={handleDeleteAdminMessage}
      />

      {/* Visual Signal-Alert Banner (Всплывающий сигнал-оповещение сверху экрана — компактный на телефоне по ширине заявок) */}
      {activeAlertToast && (
        <div className="fixed top-3 left-3 right-3 sm:left-auto sm:right-4 sm:w-96 max-w-[calc(100vw-24px)] z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`w-full max-w-full rounded-2xl p-3 sm:p-4 shadow-2xl border-2 flex items-start gap-2.5 sm:gap-3 overflow-hidden box-border ${
              activeAlertToast.type === 'urgent_ticket'
                ? 'bg-rose-600 text-white border-rose-300'
                : 'bg-white text-slate-900 border-purple-400'
            }`}
          >
            <div
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${
                activeAlertToast.type === 'urgent_ticket'
                  ? 'bg-white/20 text-white animate-bounce'
                  : 'bg-purple-100 text-purple-800'
              }`}
            >
              {activeAlertToast.type === 'urgent_ticket' ? (
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md truncate ${
                    activeAlertToast.type === 'urgent_ticket'
                      ? 'bg-white/25 text-white'
                      : 'bg-purple-100 text-purple-900'
                  }`}
                >
                  Сигнал-оповещение
                </span>
                <button
                  type="button"
                  onClick={() => setActiveAlertToast(null)}
                  className={`p-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
                    activeAlertToast.type === 'urgent_ticket'
                      ? 'hover:bg-white/20 text-white'
                      : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="text-xs sm:text-sm font-black mt-1 leading-snug break-words">
                {activeAlertToast.title}
              </div>
              <div
                className={`text-[11px] sm:text-xs mt-0.5 line-clamp-2 break-words ${
                  activeAlertToast.type === 'urgent_ticket'
                    ? 'text-rose-100'
                    : 'text-slate-600'
                }`}
              >
                {activeAlertToast.description}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSidebarNav('sounds');
                    setActiveAlertToast(null);
                  }}
                  className={`text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer ${
                    activeAlertToast.type === 'urgent_ticket'
                      ? 'bg-white text-rose-700 hover:bg-rose-50'
                      : 'bg-purple-100 text-purple-900 hover:bg-purple-200'
                  }`}
                >
                  <Volume2 className="w-3 h-3 shrink-0" />
                  <span>Настроить звуки</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PWA Offline Indicator */}
      <OfflineIndicator />

      {/* Полоска дежурной фоновой вкладки (?bg_watcher=1) */}
      {isBgWatcherMode && (
        <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-4 sm:w-96 z-40 rounded-2xl bg-purple-900 text-white p-3 shadow-2xl border border-purple-400 flex items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
              <Radio className="w-4 h-4 text-emerald-300 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-[11px] sm:text-xs text-emerald-300 truncate">
                Фоновый дежурный режим активен
              </div>
              <div className="text-[10px] text-purple-100 leading-tight">
                Оставьте эту вкладку открытой в фоне — звуковые напоминания и сигналы сработают вовремя.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setBackgroundKeepAliveActive(true);
              playSoundVariant(soundSettings.taskSoundVariant, soundSettings.volume);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-[10px] shrink-0 cursor-pointer"
          >
            Проверить звук
          </button>
        </div>
      )}

    </div>
  );
}
