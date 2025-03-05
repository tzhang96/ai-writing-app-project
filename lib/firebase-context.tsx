"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { auth } from './firebase';
import { signInAnonymously } from 'firebase/auth';

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  error: Error | null;
}

const FirebaseContext = createContext<FirebaseContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  error: null
});

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const signIn = async () => {
    try {
      console.log('Attempting to sign in anonymously...');
      await signInAnonymously(auth);
      setError(null);
    } catch (err) {
      console.error('Error signing in anonymously:', err);
      setError(err as Error);
      // Continue without authentication - this allows the app to work
      // even if Firebase auth is not properly configured
      setLoading(false);
    }
  };

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log('Auth state changed:', user ? 'User signed in' : 'No user');
      setUser(user);
      setLoading(false);
      
      // If no user is signed in, sign in anonymously
      if (!user) {
        signIn().catch(err => {
          console.error('Failed to sign in anonymously:', err);
          // Continue without authentication
          setLoading(false);
        });
      }
    }, (err) => {
      console.error('Auth state change error:', err);
      setError(err as Error);
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  return (
    <FirebaseContext.Provider value={{ user, loading, signIn, error }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => useContext(FirebaseContext); 