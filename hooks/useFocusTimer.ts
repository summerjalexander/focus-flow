import { useState, useEffect, useRef, useCallback } from 'react';
import { FocusSession } from '../types.ts';
import { WORK_DURATION, BREAK_DURATION } from '../constants.ts';
import { playStartSound, playEndSound } from '../services/audioService.ts';

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

  const switchMode = useCallback((newMode: 'work' | 'break', shouldAutoStart: boolean) => {
    const isNewModeWork = newMode === 'work';
    const newDuration = isNewModeWork ? WORK_DURATION : BREAK_DURATION;

    setFocusSession(prev => ({
      ...prev,
      isActive: shouldAutoStart,
      mode: newMode,
      timeLeft: newDuration,
      initialDuration: newDuration,
    }));
    if(shouldAutoStart) playStartSound();
  }, []);

  const tick = useCallback(() => {
    setFocusSession(prev => {
      if (prev.timeLeft > 1) {
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      }
      
      playEndSound();
      if (prev.mode === 'work') {
        switchMode('break', true);
      } else {
        switchMode('work', true);
      }
      return { ...prev, timeLeft: 0 };
    });
  }, [switchMode]);

  useEffect(() => {
    if (focusSession.isActive) {
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
    if (focusSession.taskId !== taskId || focusSession.mode !== 'work') {
      if(intervalRef.current) clearInterval(intervalRef.current);
      playStartSound();
      setFocusSession({
        isActive: true,
        mode: 'work',
        timeLeft: WORK_DURATION,
        initialDuration: WORK_DURATION,
        taskId,
        taskText,
      });
    } else { // It's the same task, so just resume
        if(!focusSession.isActive) {
            playStartSound();
            setFocusSession(prev => ({ ...prev, isActive: true}));
        }
    }
  }, [focusSession.taskId, focusSession.isActive, focusSession.mode]);

  const pauseTimer = useCallback(() => {
    setFocusSession(prev => ({ ...prev, isActive: !prev.isActive }));
     if (!focusSession.isActive) {
        playStartSound();
    }
  }, [focusSession.isActive]);

  const resetTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
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
        const delta = newTimeLeft - prev.timeLeft;
        // Ensure initial duration doesn't go below the new time left.
        const newInitialDuration = Math.max(newTimeLeft, prev.initialDuration + delta);

        return {
            ...prev,
            timeLeft: newTimeLeft,
            initialDuration: newInitialDuration,
        };
    });
  }, []);
  
  return { focusSession, startTimer, pauseTimer, resetTimer, adjustTimer };
};

export default useFocusTimer;
