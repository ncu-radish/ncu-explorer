"use client";

import { Activity, BookOpen, Users, Coins } from "lucide-react";
import { Stats } from "@/store/useSimulatorStore";

export function StatsBar({ stats }: { stats: Stats }) {
  const statItems = [
    {
      label: "體力",
      value: stats.stamina,
      max: 100,
      unit: "%",
      icon: Activity,
      color: "bg-emerald-500",
      textColor: "text-emerald-400",
    },
    {
      label: "學業",
      value: stats.study,
      max: 100,
      unit: "分",
      icon: BookOpen,
      color: "bg-blue-500",
      textColor: "text-blue-400",
    },
    {
      label: "社交",
      value: stats.social,
      max: 100,
      unit: "點",
      icon: Users,
      color: "bg-purple-500",
      textColor: "text-purple-400",
    },
    {
      label: "生活費",
      value: stats.money,
      max: 3000,
      unit: "元",
      icon: Coins,
      color: "bg-amber-500",
      textColor: "text-amber-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {statItems.map((item, idx) => {
        const Icon = item.icon;
        const percent = Math.min(100, Math.max(0, (item.value / item.max) * 100));

        return (
          <div key={idx} className="glass-panel p-3 rounded-xl border border-white/5">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Icon className={`w-3.5 h-3.5 ${item.textColor}`} />
                <span className="text-xs text-gray-400">{item.label}</span>
              </div>
              <span className={`text-xs font-bold font-mono ${item.textColor}`}>
                {item.value} {item.unit}
              </span>
            </div>
            <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
              <div
                className={`h-full ${item.color} transition-all duration-500 rounded-full`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
