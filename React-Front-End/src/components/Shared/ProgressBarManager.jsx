import React, { useState, useRef, useEffect, useCallback } from 'react';
import '../../CSS/Styles.css';

// Progress Bar Component
const ProgressBar = ({ progress, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className={`top-progress-bar ${progress >= 100 ? 'complete' : ''}`}>
      <div 
        className="progress-fill" 
        style={{ width: `${Math.min(progress, 100)}%` }}
      />
    </div>
  );
};

// Main ProgressBarManager Component
const ProgressBarManager = ({ 
  loadingState = null, 
  autoStartDelay = 500, 
  children 
}) => {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const isRunningRef = useRef(false);
  const hasAutoStartedRef = useRef(false);

  const startProgress = useCallback((forceRestart = false) => {
    // Prevent multiple starts unless force restart is requested
    if (isRunningRef.current && !forceRestart) {
      return null;
    }
    
    // Allow restart if explicitly requested or if previously completed
    if (forceRestart || isCompleted) {
      setIsCompleted(false);
    }

    isRunningRef.current = true;
    setIsVisible(true);
    setProgress(0);
    
    // Clear any existing intervals/timeouts
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Simulate progress with intervals
    let currentProgress = 0;
    intervalRef.current = setInterval(() => {
      currentProgress += Math.random() * 15 + 5; // Random increment between 5-20%
      
      if (currentProgress >= 95) {
        currentProgress = 95; // Stop at 95% to wait for completion
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      setProgress(currentProgress);
    }, 200);
    
    return intervalRef.current;
  }, [isCompleted]);

  const completeProgress = useCallback(() => {
    // Only complete if currently running and not already completed
    if (!isRunningRef.current || isCompleted) {
      return;
    }

    // Clear any running intervals
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setProgress(100);
    setIsCompleted(true);
    
    // Hide after completion animation
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      isRunningRef.current = false;
    }, 500);
  }, [isCompleted]);

  const resetProgress = useCallback(() => {
    // Clear all intervals and timeouts
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setProgress(0);
    setIsVisible(false);
    setIsCompleted(false);
    isRunningRef.current = false;
    hasAutoStartedRef.current = false;
  }, []);

  // Auto-start progress bar for initial page load
  useEffect(() => {
    if (!hasAutoStartedRef.current) {
      hasAutoStartedRef.current = true;
      const progressInterval = startProgress();
      
      // Complete progress after specified delay
      const timer = setTimeout(() => {
        completeProgress();
      }, autoStartDelay);
      
      return () => {
        if (progressInterval) {
          clearInterval(progressInterval);
        }
        clearTimeout(timer);
      };
    }
  }, []); // Only run once on mount

  // Handle external loading states (for dynamic loading)
  useEffect(() => {
    if (loadingState === null) return;

    if (loadingState === true) {
      // Start progress for external loading
      startProgress(true);
    } else if (loadingState === false) {
      // Complete progress for external loading
      completeProgress();
    }
  }, [loadingState, startProgress, completeProgress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetProgress();
    };
  }, [resetProgress]);

  return (
    <>
      <ProgressBar progress={progress} isVisible={isVisible} />
      {children}
    </>
  );
};

export default ProgressBarManager; 