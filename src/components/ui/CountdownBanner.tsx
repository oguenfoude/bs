/**
 * Countdown Banner Component
 * 
 * PURPOSE: Creates urgency with countdown timer.
 * 
 * DESIGN: Red background, white text, sticky at top.
 * 
 * FIX: Prevents hydration mismatch by only rendering on client-side.
 */

"use client";

import { useState, useEffect } from "react";
import { Timer } from "lucide-react";

export default function CountdownBanner() {
  // Prevent hydration mismatch by starting with null
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // Calculate time until end of day (resets daily)
  const getTimeUntilMidnight = () => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return midnight.getTime() - now.getTime();
  };

  useEffect(() => {
    // Only set mounted and initial time on client
    setMounted(true);
    setTimeLeft(getTimeUntilMidnight());

    const timer = setInterval(() => {
      const remaining = getTimeUntilMidnight();
      setTimeLeft(remaining);
      
      // Reset if past midnight
      if (remaining <= 0) {
        setTimeLeft(getTimeUntilMidnight());
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Don't render until mounted (prevents hydration mismatch)
  if (!mounted) {
    return (
      <div className="p-4 bg-gradient-to-r from-rose-50 to-red-50 rounded-xl border-2 border-rose-200">
        <div className="flex items-center justify-center gap-2 text-rose-700">
          <Timer className="w-5 h-5 animate-pulse" />
          <span className="font-bold text-base">
            العرض ينتهي خلال: 00:00:00
          </span>
        </div>
      </div>
    );
  }

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  const formatTime = (num: number) => num.toString().padStart(2, "0");

  return (
    <div className="p-4 bg-gradient-to-r from-rose-50 to-red-50 rounded-xl border-2 border-rose-200">
      <div className="flex items-center justify-center gap-2 text-rose-700">
        <Timer className="w-5 h-5 animate-pulse" />
        <span className="font-bold text-base">
          العرض ينتهي خلال: {formatTime(hours)}:{formatTime(minutes)}:{formatTime(seconds)}
        </span>
      </div>
    </div>
  );
}
