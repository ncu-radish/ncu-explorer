"use client";

import { Activity, BookOpen, Users, Coins } from "lucide-react";
import { Stats } from "@/store/useSimulatorStore";
import { cn } from "@/lib/utils";

function barTone(ratio: number) {
  if (ratio > 0.6) return "bg-emerald-500";
  if (ratio > 0.3) return "bg-amber-500";
  return "bg-rose-500";
}

export function StatsBar({ stats }: { stats: Stats }) {
  const items = [
    { label: "體力", value: stats.stamina, max: 100, unit: "%", icon: Activity, iconBg: "bg-rose-50 text-rose-600" },
    { label: "學業", value: stats.study, max: 100, unit: "分", icon: BookOpen, iconBg: "bg-violet-50 text-violet-600" },
    { label: "社交", value: stats.social, max: 100, unit: "點", icon: Users, iconBg: "bg-purple-50 text-purple-600" },
    { label: "生活費", value: stats.money, max: 3000, unit: "元", icon: Coins, iconBg: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        const ratio = Math.min(1, Math.max(0, item.value / item.max));
        return (
          <div key={item.label} className="surface flex items-center gap-3 p-3.5">
            <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", item.iconBg)}>
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-medium text-stone-500">{item.label}</span>
                <span className="font-mono text-sm font-bold text-stone-900">
                  {item.value}
                  <span className="ml-0.5 text-[10px] font-normal text-stone-400">{item.unit}</span>
                </span>
              </div>
              <div
                className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-stone-100"
                role="progressbar"
                aria-label={item.label}
                aria-valuenow={item.value}
                aria-valuemin={0}
                aria-valuemax={item.max}
              >
                <div
                  className={cn("h-full rounded-full transition-all duration-500", barTone(ratio))}
                  style={{ width: `${ratio * 100}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
