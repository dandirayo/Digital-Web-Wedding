"use client";

import { useEffect, useState } from "react";

export function Countdown({ 
  targetDate, 
  className = "", 
  itemClassName = "rounded-md border border-white/12 bg-white/8 p-5 text-center",
  valueClassName = "text-3xl font-semibold sm:text-4xl",
  labelClassName = "mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/58"
}: { 
  targetDate: string; 
  className?: string;
  itemClassName?: string;
  valueClassName?: string;
  labelClassName?: string;
}) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isOver: false,
    initialized: false
  });

  useEffect(() => {
    const target = new Date(targetDate).getTime();
    
    // Initial check immediately
    const checkTime = () => {
      const now = new Date().getTime();
      const distance = target - now;

      if (distance < 0) {
        setTimeLeft(prev => ({ ...prev, isOver: true, initialized: true }));
        return true; // is over
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
        isOver: false,
        initialized: true
      });
      return false;
    };

    if (checkTime()) return;

    const interval = setInterval(() => {
      if (checkTime()) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (!timeLeft.initialized) {
    return null; // Or a skeleton
  }

  if (timeLeft.isOver) {
    return (
      <div className={`text-center p-4 font-semibold text-lg ${className}`}>
        Acara Telah Berlangsung
      </div>
    );
  }

  return (
    <div className={`grid gap-3 sm:grid-cols-4 ${className}`}>
      {[
        [timeLeft.days.toString().padStart(2, "0"), "Hari"],
        [timeLeft.hours.toString().padStart(2, "0"), "Jam"],
        [timeLeft.minutes.toString().padStart(2, "0"), "Menit"],
        [timeLeft.seconds.toString().padStart(2, "0"), "Detik"],
      ].map(([value, label]) => (
        <div key={label} className={itemClassName}>
          <div className={valueClassName}>{value}</div>
          <div className={labelClassName}>
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}
