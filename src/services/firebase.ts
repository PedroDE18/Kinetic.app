import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
  limit,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Target provisioned Firestore Database
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export interface FeedbackIssue {
  id: string;
  type: 'bug' | 'fix' | 'suggestion' | 'feature';
  title?: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
  deviceInfo?: string;
  appVersion: string;
}

/**
 * Submit a bug, fix, or improvement note to the shared developer database in Firestore
 */
export async function submitFeedbackIssue(
  data: {
    type: 'bug' | 'fix' | 'suggestion' | 'feature';
    title?: string;
    description: string;
    severity?: 'low' | 'medium' | 'high';
  }
): Promise<FeedbackIssue> {
  const issueId = `issue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';

  const issue: FeedbackIssue = {
    id: issueId,
    type: data.type,
    title: data.title?.trim() || undefined,
    description: data.description.trim(),
    severity: data.severity || 'medium',
    status: 'open',
    createdAt: new Date().toISOString(),
    deviceInfo: userAgent.slice(0, 200),
    appVersion: '3.1.0',
  };

  try {
    const issueRef = doc(db, 'feedback_issues', issueId);
    await setDoc(issueRef, issue);
    return issue;
  } catch (err) {
    console.error('Failed to write issue to Firestore:', err);
    throw err;
  }
}

/**
 * Fetch all recorded bugs and suggestions from Firestore
 */
export async function fetchFeedbackIssues(): Promise<FeedbackIssue[]> {
  try {
    const colRef = collection(db, 'feedback_issues');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(50));
    const snap = await getDocs(q);

    const issues: FeedbackIssue[] = [];
    snap.forEach((d) => {
      issues.push(d.data() as FeedbackIssue);
    });
    return issues;
  } catch (err) {
    console.error('Failed to fetch issues from Firestore:', err);
    return [];
  }
}

/**
 * Sync entire application JSON backup to cloud Firestore
 */
export async function syncBackupToFirebase(payloadJson: string): Promise<boolean> {
  try {
    const backupId = 'latest_user_backup';
    const backupRef = doc(db, 'app_backups', backupId);
    await setDoc(backupRef, {
      id: backupId,
      updatedAt: new Date().toISOString(),
      payloadJson,
    });
    return true;
  } catch (err) {
    console.error('Failed to sync app backup to Firebase:', err);
    return false;
  }
}

/**
 * Test connectivity to Firestore instance
 */
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'feedback_issues', 'health-check-probe'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client appears offline.');
      return false;
    }
    // If the doc doesn't exist, the connection is still alive and successful
    return true;
  }
}
