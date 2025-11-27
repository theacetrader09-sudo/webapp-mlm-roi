'use client';

import { useState, useEffect, useRef } from 'react';

interface ROICountdownProps {
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export default function ROICountdown({ showLabel = true, size = 'medium' }: ROICountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const lastTriggerTimeRef = useRef<number>(0);

  useEffect(() => {
    const calculateTimeUntilNextROI = () => {
      const now = new Date();
      
      // Get current UTC time
      const utcNow = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        now.getUTCHours(),
        now.getUTCMinutes(),
        now.getUTCSeconds()
      ));
      
      // Get today's midnight UTC
      const todayMidnight = new Date(Date.UTC(
        utcNow.getUTCFullYear(),
        utcNow.getUTCMonth(),
        utcNow.getUTCDate(),
        0, 0, 0, 0
      ));
      
      // Calculate next midnight UTC
      let nextROI = new Date(todayMidnight);
      
      // If current time is past today's midnight, next ROI is tomorrow's midnight
      if (utcNow >= todayMidnight) {
        nextROI.setUTCDate(nextROI.getUTCDate() + 1);
      }

      const diff = nextROI.getTime() - utcNow.getTime();
      
      // Ensure non-negative values
      const hours = Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
      const minutes = Math.max(0, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));
      const seconds = Math.max(0, Math.floor((diff % (1000 * 60)) / 1000));

      return { hours, minutes, seconds, totalSeconds: diff / 1000 };
    };

    const updateCountdown = () => {
      const timeData = calculateTimeUntilNextROI();
      setTimeLeft({
        hours: timeData.hours,
        minutes: timeData.minutes,
        seconds: timeData.seconds,
      });

      // Auto-trigger ROI cron when countdown reaches zero (within 10 seconds tolerance)
      // This is a fallback for local development - production uses Vercel Cron
      // Only trigger once per day (prevent multiple triggers)
      const now = Date.now();
      const oneDayAgo = now - (24 * 60 * 60 * 1000);
      
      if (timeData.totalSeconds >= 0 && timeData.totalSeconds <= 10 && lastTriggerTimeRef.current < oneDayAgo) {
        // Trigger ROI cron automatically (only once per day)
        lastTriggerTimeRef.current = now;
        fetch('/api/cron/daily-roi', {
          method: 'GET',
          credentials: 'include',
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.status === 'success' || data.status === 'already_run') {
              console.log('✅ ROI cron triggered successfully:', data.message);
              // Refresh page after 2 seconds to show updated balances
              setTimeout(() => {
                window.location.reload();
              }, 2000);
            }
          })
          .catch((error) => {
            console.log('ROI cron auto-trigger attempted (may have already run)');
          });
      }
    };

    // Initial calculation
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!timeLeft) {
    return (
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const sizeClasses = {
    small: {
      container: 'text-sm',
      time: 'text-lg',
      label: 'text-xs',
      gap: 'gap-1',
    },
    medium: {
      container: 'text-base',
      time: 'text-2xl',
      label: 'text-sm',
      gap: 'gap-2',
    },
    large: {
      container: 'text-lg',
      time: 'text-4xl',
      label: 'text-base',
      gap: 'gap-3',
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className={`flex flex-col items-center ${classes.container}`}>
      {showLabel && (
        <p className={`${classes.label} text-white/90 mb-2 font-semibold`}>
          Next ROI Credit
        </p>
      )}
      <div className={`flex items-center ${classes.gap} font-mono`}>
        {/* Hours */}
        <div className="flex flex-col items-center">
          <div className={`${classes.time} font-bold text-white bg-white/20 backdrop-blur-sm px-4 py-3 rounded-xl border-2 border-white/30 shadow-lg`}>
            {String(timeLeft.hours).padStart(2, '0')}
          </div>
          <span className={`${classes.label} text-white/80 mt-2 font-medium`}>H</span>
        </div>
        
        <span className={`${classes.time} text-white font-bold mx-1`}>:</span>
        
        {/* Minutes */}
        <div className="flex flex-col items-center">
          <div className={`${classes.time} font-bold text-white bg-white/20 backdrop-blur-sm px-4 py-3 rounded-xl border-2 border-white/30 shadow-lg`}>
            {String(timeLeft.minutes).padStart(2, '0')}
          </div>
          <span className={`${classes.label} text-white/80 mt-2 font-medium`}>M</span>
        </div>
        
        <span className={`${classes.time} text-white font-bold mx-1`}>:</span>
        
        {/* Seconds */}
        <div className="flex flex-col items-center">
          <div className={`${classes.time} font-bold text-white bg-white/20 backdrop-blur-sm px-4 py-3 rounded-xl border-2 border-white/30 shadow-lg`}>
            {String(timeLeft.seconds).padStart(2, '0')}
          </div>
          <span className={`${classes.label} text-white/80 mt-2 font-medium`}>S</span>
        </div>
      </div>
      {showLabel && (
        <p className={`${classes.label} text-white/75 mt-3 font-medium`}>
          (00:00 UTC)
        </p>
      )}
    </div>
  );
}

