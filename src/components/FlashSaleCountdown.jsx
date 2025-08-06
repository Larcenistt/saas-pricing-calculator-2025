import React, { useState, useEffect } from 'react';

export default function FlashSaleCountdown() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 47,
    minutes: 59,
    seconds: 59
  });

  useEffect(() => {
    // Get or set the flash sale end time (48 hours from first visit)
    let endTime = localStorage.getItem('flashSaleEndTime');
    
    if (!endTime) {
      // Set end time to 48 hours from now
      endTime = Date.now() + (48 * 60 * 60 * 1000);
      localStorage.setItem('flashSaleEndTime', endTime);
    }

    const timer = setInterval(() => {
      const now = Date.now();
      const difference = parseInt(endTime) - now;

      if (difference > 0) {
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 48);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        setTimeLeft({ hours, minutes, seconds });
      } else {
        // Flash sale ended
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-full shadow-lg animate-pulse">
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div className="flex items-center gap-1 text-white font-bold">
        <span className="text-lg">FLASH SALE ENDS IN:</span>
        <div className="flex items-center gap-1 ml-2">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-mono">{String(timeLeft.hours).padStart(2, '0')}</span>
            <span className="text-xs opacity-75">HRS</span>
          </div>
          <span className="text-2xl mx-1">:</span>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-mono">{String(timeLeft.minutes).padStart(2, '0')}</span>
            <span className="text-xs opacity-75">MIN</span>
          </div>
          <span className="text-2xl mx-1">:</span>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-mono">{String(timeLeft.seconds).padStart(2, '0')}</span>
            <span className="text-xs opacity-75">SEC</span>
          </div>
        </div>
      </div>
    </div>
  );
}