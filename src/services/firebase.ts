import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  getDocFromServer,
} from 'firebase/firestore';
import { firebaseConfig } from './config';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Target provisioned Firebase Authentication
export const auth = getAuth(app);

// Target provisioned Firestore Database
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export interface UserDocument {
  uid: string;
  email: string;
  displayName?: string;
  createdAt: string;
  lastLoginAt: string;
}

/**
 * Ensure user document exists and records the latest login timestamp
 */
export async function syncUserProfile(user: {
  uid: string;
  email?: string | null;
  displayName?: string | null;
}): Promise<void> {
  if (!user.uid) return;
  const userRef = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(userRef);
    const now = new Date().toISOString();
    if (!snap.exists()) {
      const newDoc: UserDocument = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || '',
        createdAt: now,
        lastLoginAt: now,
      };
      await setDoc(userRef, newDoc);
    } else {
      const existing = snap.data() as UserDocument;
      await setDoc(userRef, {
        ...existing,
        lastLoginAt: now,
        displayName: user.displayName || existing.displayName || '',
      });
    }
  } catch (err) {
    console.error('Failed to sync user profile:', err);
  }
}

/**
 * Save user's complete fitness data state to Firestore under their user ID
 */
export async function saveUserFitnessState(userId: string, state: any): Promise<boolean> {
  if (!userId) return false;
  try {
    let payload = state;
    let payloadJson = JSON.stringify(payload);

    // Guard against Firestore 1,048,576 bytes document limit
    if (payloadJson.length > 900_000) {
      console.warn(`State payload is ${payloadJson.length} bytes, safely pruning history to stay under Firestore 1MB limit...`);
      payload = {
        ...state,
        weights: Array.isArray(state.weights) ? state.weights.slice(-1500) : state.weights,
        cardioSessions: Array.isArray(state.cardioSessions) ? state.cardioSessions.slice(-600) : state.cardioSessions,
        completedWorkouts: Array.isArray(state.completedWorkouts) ? state.completedWorkouts.slice(-400) : state.completedWorkouts,
        loggedFoods: Array.isArray(state.loggedFoods) ? state.loggedFoods.slice(-800) : state.loggedFoods,
        dailyAggregates: Array.isArray(state.dailyAggregates) ? state.dailyAggregates.slice(-400) : state.dailyAggregates,
      };
      payloadJson = JSON.stringify(payload);
    }

    const stateRef = doc(db, 'users', userId, 'fitnessData', 'state');
    await setDoc(stateRef, {
      userId,
      updatedAt: new Date().toISOString(),
      payloadJson,
      version: 1,
    });
    return true;
  } catch (err) {
    console.error('Failed to save user fitness state to Firestore:', err);
    throw err;
  }
}

/**
 * Load user's saved fitness data state from Firestore
 */
export async function loadUserFitnessState(userId: string): Promise<any | null> {
  if (!userId) return null;
  try {
    const stateRef = doc(db, 'users', userId, 'fitnessData', 'state');
    const snap = await getDoc(stateRef);
    if (!snap.exists()) {
      return null;
    }
    const data = snap.data();
    if (data && data.payloadJson) {
      return JSON.parse(data.payloadJson);
    }
    return null;
  } catch (err) {
    console.error('Failed to load user fitness state from Firestore:', err);
    return null;
  }
}

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
 * Submit a bug, fix, or improvement note to the developer database in Firestore
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

  const cleanIssue: Record<string, any> = {
    id: issueId,
    type: data.type,
    description: data.description.trim(),
    severity: data.severity || 'medium',
    status: 'open',
    createdAt: new Date().toISOString(),
    deviceInfo: userAgent.slice(0, 200),
    appVersion: '3.1.0',
  };
  if (data.title?.trim()) {
    cleanIssue.title = data.title.trim();
  }

  try {
    const issueRef = doc(db, 'feedback_issues', issueId);
    await setDoc(issueRef, cleanIssue);
    return cleanIssue as FeedbackIssue;
  } catch (err) {
    console.error('Failed to write issue to Firestore:', err);
    throw err;
  }
}

/**
 * Fetch recorded bugs and suggestions from Firestore
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
    return true;
  }
}
