import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile as updateFirebaseProfile,
} from 'firebase/auth';
import { auth, syncUserProfile } from '../services/firebase';

export interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  formatAuthError: (error: any) => string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Sync profile record in Firestore
        await syncUserProfile(user);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    await syncUserProfile(cred.user);
  };

  const signUp = async (email: string, pass: string, displayName?: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    if (displayName && displayName.trim()) {
      await updateFirebaseProfile(cred.user, { displayName: displayName.trim() });
    }
    await syncUserProfile({
      uid: cred.user.uid,
      email: cred.user.email,
      displayName: displayName?.trim() || cred.user.displayName,
    });
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const formatAuthError = (err: any): string => {
    if (!err || !err.code) return err?.message || 'An unexpected error occurred.';
    switch (err.code) {
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-not-found':
        return 'No account found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please double check and retry.';
      case 'auth/email-already-in-use':
        return 'An account already exists with this email address.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/too-many-requests':
        return 'Access temporarily blocked due to many failed attempts. Try again later or reset password.';
      case 'auth/network-request-failed':
        return 'Network connection failed. Please check your internet connection.';
      default:
        return err.message.replace('Firebase: ', '');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        formatAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
