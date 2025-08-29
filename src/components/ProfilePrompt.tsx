// src/components/ProfilePrompt.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { useProfileStore } from '@/lib/userProfile';
import { X, User, Target, Heart } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePrompt() {
  const { profile, isComplete } = useProfileStore();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Show prompt if no profile or profile is incomplete, and not dismissed
    const dismissed = localStorage.getItem('profile-prompt-dismissed');
    if ((!profile || !isComplete) && !dismissed) {
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [profile, isComplete]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('profile-prompt-dismissed', 'true');
  };

  if (!isVisible || isDismissed || (profile && isComplete)) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000,
      maxWidth: '320px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.95), rgba(139, 92, 246, 0.95))',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        borderRadius: 'var(--radius)',
        padding: '20px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
      }}>
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
        
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <User className="text-purple-400" size={20} />
            <h3 className="text-white font-semibold">Get Personalized Results</h3>
          </div>
          <p className="text-gray-300 text-sm">
            Create your health profile to get personalized supplement recommendations and enhanced scanning results.
          </p>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center space-x-3 text-sm text-gray-300">
            <Target className="text-green-400 flex-shrink-0" size={16} />
            <span>Goal-specific recommendations</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-300">
            <Heart className="text-red-400 flex-shrink-0" size={16} />
            <span>Safety checks for your medications</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-300">
            <User className="text-blue-400 flex-shrink-0" size={16} />
            <span>Dosage based on your profile</span>
          </div>
        </div>

        <div className="flex space-x-2">
          <Link
            href="/profile"
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-center py-2 px-4 rounded-lg font-medium transition-all text-sm"
          >
            Setup Profile
          </Link>
          <button
            onClick={handleDismiss}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}