// src/components/ProgressTracking.tsx - Track weekly progress and mood
"use client";
import React, { useState, useEffect } from 'react';

interface DailyEntry {
  date: string;
  mood: string;
  energy: number; // 1-5 scale
  symptoms: string[]; // Which symptoms were present
  notes?: string;
}

interface ProgressTrackingProps {
  selectedSymptoms: Array<{id: string, name: string, icon: string, severity: number}>;
  onProgressUpdate?: (progress: DailyEntry[]) => void;
}

const MOOD_OPTIONS = [
  { emoji: '😫', label: 'Terrible', value: 1, color: '#ef4444' },
  { emoji: '😞', label: 'Poor', value: 2, color: '#f97316' },
  { emoji: '😐', label: 'Okay', value: 3, color: '#eab308' },
  { emoji: '😊', label: 'Good', value: 4, color: '#22c55e' },
  { emoji: '🤩', label: 'Amazing', value: 5, color: '#10b981' }
];

const ENERGY_LABELS = ['Exhausted', 'Low', 'Okay', 'Good', 'Energized'];

export default function ProgressTracking({ selectedSymptoms, onProgressUpdate }: ProgressTrackingProps) {
  const [weeklyProgress, setWeeklyProgress] = useState<DailyEntry[]>([]);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [todaysEntry, setTodaysEntry] = useState<Partial<DailyEntry>>({});
  const [insights, setInsights] = useState<string[]>([]);

  const today = new Date().toISOString().split('T')[0];
  const hasCheckedInToday = weeklyProgress.some(entry => entry.date === today);

  // Load progress from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('weeklyProgress');
      if (saved) {
        try {
          const progress = JSON.parse(saved);
          setWeeklyProgress(progress);
          generateInsights(progress);
        } catch {
          setWeeklyProgress([]);
        }
      }
    }
  }, []);

  // Save progress when it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && weeklyProgress.length > 0) {
      localStorage.setItem('weeklyProgress', JSON.stringify(weeklyProgress));
      onProgressUpdate?.(weeklyProgress);
      generateInsights(weeklyProgress);
    }
  }, [weeklyProgress, onProgressUpdate]);

  const generateInsights = (progress: DailyEntry[]) => {
    const recentEntries = progress.slice(-7); // Last 7 days
    if (recentEntries.length < 3) return;

    const newInsights = [];
    
    // Energy trend analysis
    const energyLevels = recentEntries.map(e => e.energy).filter(e => e > 0);
    if (energyLevels.length >= 3) {
      const avgEnergy = energyLevels.reduce((a, b) => a + b, 0) / energyLevels.length;
      if (avgEnergy >= 4) {
        newInsights.push('🎉 Your energy levels have been consistently high this week!');
      } else if (avgEnergy <= 2) {
        newInsights.push('💡 Your energy has been low lately. Consider reviewing your sleep and supplement routine.');
      }
    }

    // Mood pattern analysis  
    const moodValues = recentEntries.map(e => MOOD_OPTIONS.find(m => m.emoji === e.mood)?.value || 3);
    const avgMood = moodValues.reduce((a, b) => a + b, 0) / moodValues.length;
    if (avgMood >= 4) {
      newInsights.push('😊 You\'ve been feeling great lately - keep up whatever you\'re doing!');
    }

    // Symptom improvement analysis
    const symptomCounts: Record<string, number> = {};
    recentEntries.forEach(entry => {
      entry.symptoms.forEach(symptom => {
        symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
      });
    });

    const improvingSymptoms = Object.entries(symptomCounts)
      .filter(([_, count]) => count < recentEntries.length * 0.4) // Present less than 40% of time
      .map(([symptom]) => symptom);

    if (improvingSymptoms.length > 0) {
      newInsights.push(`📈 Great progress! These symptoms are appearing less often: ${improvingSymptoms.join(', ')}`);
    }

    setInsights(newInsights.slice(0, 3)); // Max 3 insights
  };

  const saveCheckIn = () => {
    const entry: DailyEntry = {
      date: today,
      mood: todaysEntry.mood || '😐',
      energy: todaysEntry.energy || 3,
      symptoms: todaysEntry.symptoms || [],
      notes: todaysEntry.notes
    };

    setWeeklyProgress(prev => {
      const filtered = prev.filter(e => e.date !== today); // Remove existing entry for today
      return [...filtered, entry].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });

    setTodaysEntry({});
    setShowCheckIn(false);
  };

  const toggleSymptomForToday = (symptomId: string) => {
    setTodaysEntry(prev => ({
      ...prev,
      symptoms: prev.symptoms?.includes(symptomId)
        ? prev.symptoms.filter(id => id !== symptomId)
        : [...(prev.symptoms || []), symptomId]
    }));
  };

  const getStreakCount = () => {
    const sortedEntries = [...weeklyProgress].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    let streak = 0;
    let currentDate = new Date();
    
    for (const entry of sortedEntries) {
      const entryDate = new Date(entry.date);
      const diffTime = currentDate.getTime() - entryDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= streak + 1) {
        streak++;
        currentDate = entryDate;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const entry = weeklyProgress.find(e => e.date === dateStr);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      days.push({
        date: dateStr,
        dayName,
        entry
      });
    }
    return days;
  };

  const streak = getStreakCount();
  const last7Days = getLast7Days();

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '24px',
      marginBottom: '24px'
    }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: '0 0 4px', color: 'var(--text)' }}>
            📈 Your Health Journey
          </h3>
          {streak > 0 && (
            <div style={{ fontSize: '14px', color: 'var(--accent)' }}>
              🔥 {streak} day streak!
            </div>
          )}
        </div>
        
        {!hasCheckedInToday && (
          <button
            onClick={() => setShowCheckIn(true)}
            style={{
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px'
            }}
          >
            Daily Check-in
          </button>
        )}
      </div>

      {/* 7-Day Progress Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '8px',
        marginBottom: '20px'
      }}>
        {last7Days.map(({ date, dayName, entry }) => (
          <div key={date} style={{
            textAlign: 'center',
            padding: '12px 8px',
            background: entry ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            border: entry ? '1px solid rgba(74, 222, 128, 0.3)' : '1px solid var(--border)'
          }}>
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>
              {entry ? entry.mood : '⭕'}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '2px' }}>
              {dayName}
            </div>
            {entry && (
              <div style={{ fontSize: '8px', color: 'var(--muted)' }}>
                Energy: {entry.energy}/5
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '12px', color: 'var(--accent2)' }}>
            💡 Insights
          </h4>
          {insights.map((insight, i) => (
            <div key={i} style={{
              padding: '8px 12px',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '6px',
              fontSize: '13px',
              marginBottom: '6px',
              color: '#60a5fa'
            }}>
              {insight}
            </div>
          ))}
        </div>
      )}

      {/* Check-in Modal */}
      {showCheckIn && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--surface)',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '100%',
            border: '1px solid var(--border)',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '20px', textAlign: 'center' }}>
              How are you feeling today?
            </h3>

            {/* Mood Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>
                Overall mood:
              </label>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                {MOOD_OPTIONS.map(mood => (
                  <button
                    key={mood.emoji}
                    onClick={() => setTodaysEntry(prev => ({ ...prev, mood: mood.emoji }))}
                    style={{
                      background: todaysEntry.mood === mood.emoji ? mood.color + '20' : 'transparent',
                      border: `2px solid ${todaysEntry.mood === mood.emoji ? mood.color : 'var(--border)'}`,
                      borderRadius: '8px',
                      padding: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      minWidth: '60px'
                    }}
                  >
                    <span style={{ fontSize: '24px', marginBottom: '4px' }}>{mood.emoji}</span>
                    <span style={{ fontSize: '10px', color: 'var(--muted)' }}>{mood.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Energy Level */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>
                Energy level: {ENERGY_LABELS[(todaysEntry.energy || 3) - 1]}
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={todaysEntry.energy || 3}
                onChange={(e) => setTodaysEntry(prev => ({ ...prev, energy: parseInt(e.target.value) }))}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--muted)' }}>
                <span>Exhausted</span>
                <span>Energized</span>
              </div>
            </div>

            {/* Symptom Check */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '12px', display: 'block' }}>
                Which symptoms did you experience today?
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedSymptoms.slice(0, 8).map(symptom => {
                  const isSelected = todaysEntry.symptoms?.includes(symptom.id);
                  return (
                    <button
                      key={symptom.id}
                      onClick={() => toggleSymptomForToday(symptom.id)}
                      style={{
                        background: isSelected ? 'var(--accent)20' : 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: '20px',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: isSelected ? 'var(--accent)' : 'var(--text)'
                      }}
                    >
                      <span>{symptom.icon}</span>
                      <span>{symptom.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Notes */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>
                Notes (optional):
              </label>
              <textarea
                value={todaysEntry.notes || ''}
                onChange={(e) => setTodaysEntry(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional notes about how you're feeling..."
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '13px',
                  resize: 'vertical',
                  minHeight: '60px'
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCheckIn(false)}
                style={{
                  background: 'none',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveCheckIn}
                disabled={!todaysEntry.mood}
                style={{
                  background: todaysEntry.mood ? 'var(--accent)' : 'var(--muted)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: todaysEntry.mood ? 'pointer' : 'not-allowed',
                  fontWeight: '500'
                }}
              >
                Save Check-in
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {weeklyProgress.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '12px',
          padding: '16px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '8px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '600', color: 'var(--accent)' }}>
              {weeklyProgress.length}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Total Check-ins</div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '600', color: 'var(--accent2)' }}>
              {Math.round(weeklyProgress.reduce((sum, e) => sum + e.energy, 0) / weeklyProgress.length * 10) / 10}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Avg Energy</div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '600', color: '#f59e0b' }}>
              {streak}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Day Streak</div>
          </div>
        </div>
      )}
    </div>
  );
}