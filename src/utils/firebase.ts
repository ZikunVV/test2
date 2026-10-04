import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  Organization,
  House,
  Ticket,
  StreetItem,
  UserItem,
  PersonalTask,
  PersonalPerson,
  AuditLogItem,
} from '../types';
import { AdminMessageItem } from '../components/AdminMessagesModal';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on startup
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export interface WorkspaceCloudPayload {
  id: string;
  updatedBy: string;
  updatedAtIso: string;
  organizations: Organization[];
  houses: House[];
  tickets: Ticket[];
  streets: StreetItem[];
  users: UserItem[];
  personalTasks: PersonalTask[];
  personalPeople: PersonalPerson[];
  auditLogs: AuditLogItem[];
  adminMessages: AdminMessageItem[];
}

// Recursively remove undefined fields so Firestore setDoc never rejects optional undefined properties
function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        cleaned[k] = stripUndefined(v);
      }
    }
    return cleaned as T;
  }
  return value;
}

const WORKSPACE_DOC_ID = 'main';
const WORKSPACE_PATH = `workspaces/${WORKSPACE_DOC_ID}`;

export function subscribeToCloudWorkspace(
  onData: (data: WorkspaceCloudPayload | null) => void
) {
  const docRef = doc(db, 'workspaces', WORKSPACE_DOC_ID);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onData(snapshot.data() as WorkspaceCloudPayload);
      } else {
        onData(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, WORKSPACE_PATH);
    }
  );
}

export async function saveCloudWorkspace(payload: Omit<WorkspaceCloudPayload, 'id'>) {
  const docRef = doc(db, 'workspaces', WORKSPACE_DOC_ID);
  const sanitized: WorkspaceCloudPayload = stripUndefined({
    id: WORKSPACE_DOC_ID,
    updatedBy: (payload.updatedBy || 'Система').slice(0, 200),
    updatedAtIso: (payload.updatedAtIso || new Date().toISOString()).slice(0, 64),
    organizations: (payload.organizations || []).slice(0, 500),
    houses: (payload.houses || []).slice(0, 5000),
    tickets: (payload.tickets || []).slice(0, 5000),
    streets: (payload.streets || []).slice(0, 2000),
    users: (payload.users || []).slice(0, 1000),
    personalTasks: (payload.personalTasks || []).slice(0, 5000),
    personalPeople: (payload.personalPeople || []).slice(0, 5000),
    auditLogs: (payload.auditLogs || []).slice(0, 5000),
    adminMessages: (payload.adminMessages || []).slice(0, 2000),
  });

  try {
    await setDoc(docRef, sanitized);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, WORKSPACE_PATH);
  }
}
