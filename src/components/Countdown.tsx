"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface CountdownProps {
  targetTime: number | bigint;
  label?: string;
  onEnd?: () => void;
}

export function Countdown({ targetTime, label, onEnd }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    ended: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, ended: false });

  useEffect(() => {
    const target = Number(targetTime) * 1000;

    function calculate() {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, ended: true });
        if (onEnd) onEnd();
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, ended: false });
    }

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetTime, onEnd]);

  if (timeLeft.ended) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 bg-surface/50 px-2.5 py-1 rounded-lg border border-surface-border">
        <Clock className="w-3.5 h-3.5 text-slate-500" />
        <span>Sale Ended</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-xs text-slate-400">{label}</span>}
      <div className="flex items-center gap-1 font-mono text-xs text-primary font-semibold bg-primary-dim px-2.5 py-1 rounded-lg border border-primary/20">
        <Clock className="w-3.5 h-3.5 text-primary" />
        {timeLeft.days > 0 && <span>{timeLeft.days}d</span>}
        <span>{String(timeLeft.hours).padStart(2, "0")}h</span>
        <span>{String(timeLeft.minutes).padStart(2, "0")}m</span>
        <span>{String(timeLeft.seconds).padStart(2, "0")}s</span>
      </div>
    </div>
  );
}
