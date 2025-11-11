import React from "react";

export default function ProgressRing({ value = 0, size = 48, color = "#0ea5e9" }) {
  const pct = Math.max(0, Math.min(100, value));
  const bg = `conic-gradient(${color} ${pct * 3.6}deg, #e5e7eb 0deg)`;
  const s = { width: size, height: size, backgroundImage: bg };
  return (
    <div className="relative rounded-full" style={s}>
      <div className="absolute inset-1 rounded-full bg-white flex items-center justify-center">
        <span className="text-xs font-semibold text-gray-700">{Math.round(pct)}%</span>
      </div>
    </div>
  );
}