import { useState, useEffect, useRef, useCallback } from 'react';
import { FocusSession } from '../types';
import { WORK_DURATION, BREAK_DURATION } from '../constants';
import { playStartSound, playEndSound } from '../services/audioService';

const useFocusTimer = () => {
  const [focusSession, setFocusSession] = useState<FocusSession>({
    isActive: false,
    mode: 'work',
    timeLeft: WORK_DURATION,
    initialDuration: WORK_DURATION,
    taskId: null,
    taskText: null,
  });

  const intervalRef = useRef<number | null>(null);
  const expectedEndTimeRef = useRef<number | null>(null);

  const switchMode = useCallback((newMode: 'work' | 'break', shouldAutoStart: boolean) => {
    const isNewModeWork = newMode === 'work';
    const newDuration = isNewModeWork ? WORK_DURATION : BREAK_DURATION;

    if (shouldAutoStart) {
      expectedEndTimeRef.current = Date.now() + newDuration * 1000;
    } else {
      expectedEndTimeRef.current = null;
    }

    setFocusSession(prev => ({
      ...prev,
      isActive: shouldAutoStart,
      mode: newMode,
      timeLeft: newDuration,
      initialDuration: newDuration,
    }));

    if (shouldAutoStart) {
      playStartSound();
    }
  }, []);

  const tick = useCallback(() => {
    if (!expectedEndTimeRef.current) {
      return;
    }

    const newTimeLeft = Math.round((expectedEndTimeRef.current - Date.now()) / 1000);

    if (newTimeLeft <= 0) {
      playEndSound();
      if (focusSession.mode === 'work') {
        switchMode('break', true);
      } else {
        switchMode('work', true);
      }
    } else {
      setFocusSession(prev => ({ ...prev, timeLeft: newTimeLeft }));
    }
  }, [focusSession.mode, switchMode]);

  useEffect(() => {
    if (focusSession.isActive) {
      // Immediately correct the time in case of a delay before the interval starts
      tick();
      intervalRef.current = window.setInterval(tick, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [focusSession.isActive, tick]);
  
  const startTimer = useCallback((taskId: string, taskText: string) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    playStartSound();
    
    expectedEndTimeRef.current = Date.now() + WORK_DURATION * 1000;

    setFocusSession({
      isActive: true,
      mode: 'work',
      timeLeft: WORK_DURATION,
      initialDuration: WORK_DURATION,
      taskId,
      taskText,
    });
  }, []);

  const pauseTimer = useCallback(() => {
    setFocusSession(prev => {
      const isNowActive = !prev.isActive;
      if (isNowActive) { // Resuming
        playStartSound();
        expectedEndTimeRef.current = Date.now() + prev.timeLeft * 1000;
      }
      // If pausing, timeLeft is correct from the last tick.
      return { ...prev, isActive: isNowActive };
    });
  }, []);

  const resetTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    expectedEndTimeRef.current = null;
    setFocusSession({
      isActive: false,
      mode: 'work',
      timeLeft: WORK_DURATION,
      initialDuration: WORK_DURATION,
      taskId: null,
      taskText: null,
    });
  }, []);

  const adjustTimer = useCallback((minutes: number) => {
    setFocusSession(prev => {
        if (prev.isActive || prev.mode !== 'work') {
            return prev;
        }

        const newTimeLeft = Math.max(5 * 60, Math.min(90 * 60, prev.timeLeft + (minutes * 60)));
        
        return {
            ...prev,
            timeLeft: newTimeLeft,
            // Also update initial duration so the progress bar is consistent with the new time
            initialDuration: newTimeLeft,
        };
    });
  }, []);
  
  return { focusSession, startTimer, pauseTimer, resetTimer, adjustTimer };
};

export default useFocusTimer;