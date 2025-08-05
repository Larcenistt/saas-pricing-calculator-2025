import { useState, useEffect } from 'react';

export default function LaunchCountdown() {
  const [timeLeft, setTimeLeft] = useState({
    days: 7,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    // Set the launch end date to 7 days from now
    const launchEndDate = new Date();
    launchEndDate.setDate(launchEndDate.getDate() + 7);
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = launchEndDate.getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
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

  return (
    <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-lg p-4 mb-8">
      <div className="text-center">
        <p className="text-primary text-sm font-semibold mb-2">
          Launch Price Ends In:
        </p>
        <div className="flex justify-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{timeLeft.days}</div>
            <div className="text-xs text-gray-400">Days</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{timeLeft.hours.toString().padStart(2, '0')}</div>
            <div className="text-xs text-gray-400">Hours</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{timeLeft.minutes.toString().padStart(2, '0')}</div>
            <div className="text-xs text-gray-400">Min</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{timeLeft.seconds.toString().padStart(2, '0')}</div>
            <div className="text-xs text-gray-400">Sec</div>
          </div>
        </div>
        <p className="text-sm text-gray-300 mt-2">
          Price increases to $197 when timer ends
        </p>
      </div>
    </div>
  );
}