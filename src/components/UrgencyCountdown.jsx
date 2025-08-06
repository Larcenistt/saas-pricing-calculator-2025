import { useState, useEffect } from 'react';

export default function UrgencyCountdown() {
  const STORAGE_KEY = 'launch_countdown_end';
  const COUNTDOWN_DAYS = 3;
  
  const getEndDate = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return new Date(stored);
    }
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + COUNTDOWN_DAYS);
    endDate.setHours(23, 59, 59, 999);
    localStorage.setItem(STORAGE_KEY, endDate.toISOString());
    return endDate;
  };

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const endDate = getEndDate();
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endDate.getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsExpired(true);
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (isExpired) {
    return null;
  }

  const isUrgent = timeLeft.days === 0 && timeLeft.hours < 12;

  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 mb-8 ${
      isUrgent ? 'bg-gradient-to-r from-red-600/20 to-orange-600/20 border-2 border-red-500/50' 
                : 'bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20'
    }`}>
      {isUrgent && (
        <div className="absolute top-0 right-0 bg-red-600 text-white px-3 py-1 text-xs font-bold rounded-bl-lg">
          LAST CHANCE!
        </div>
      )}
      
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </div>
          <p className={`font-bold text-lg ${isUrgent ? 'text-red-400' : 'text-primary'}`}>
            LAUNCH PRICE ENDS IN:
          </p>
        </div>
        
        <div className="flex justify-center gap-3 md:gap-6 mb-4">
          <div className="bg-black/30 rounded-lg p-3 min-w-[60px]">
            <div className="text-3xl md:text-4xl font-bold text-white">
              {timeLeft.days.toString().padStart(2, '0')}
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Days</div>
          </div>
          <div className="bg-black/30 rounded-lg p-3 min-w-[60px]">
            <div className="text-3xl md:text-4xl font-bold text-white">
              {timeLeft.hours.toString().padStart(2, '0')}
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Hours</div>
          </div>
          <div className="bg-black/30 rounded-lg p-3 min-w-[60px]">
            <div className="text-3xl md:text-4xl font-bold text-white">
              {timeLeft.minutes.toString().padStart(2, '0')}
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Min</div>
          </div>
          <div className="bg-black/30 rounded-lg p-3 min-w-[60px]">
            <div className={`text-3xl md:text-4xl font-bold ${isUrgent ? 'text-red-400' : 'text-white'}`}>
              {timeLeft.seconds.toString().padStart(2, '0')}
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Sec</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="text-lg font-semibold text-white">
            Save $50 - Only <span className="text-accent text-2xl">$99</span>
            <span className="text-gray-400 line-through ml-2">$149</span>
          </p>
          <p className="text-sm text-gray-300">
            ⚡ {Math.floor(Math.random() * 20) + 5} people viewing this offer right now
          </p>
        </div>
      </div>
    </div>
  );
}