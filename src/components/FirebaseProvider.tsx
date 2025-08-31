// src/components/FirebaseProvider.tsx
"use client";
import { useEffect } from 'react';
import { useProfileStore } from '@/lib/userProfile';

export default function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const initializeAuth = useProfileStore(state => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return <>{children}</>;
}