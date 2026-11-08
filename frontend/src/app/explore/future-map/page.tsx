"use client";

import { Compass } from "lucide-react";
import { InfoPageShell } from "@/components/InfoPageShell";
import { FutureMapExplorerView } from "@/components/future_map/FutureMapExplorerView";

export default function FutureMapPage() {
  return (
    <InfoPageShell
      wide
      icon={Compass}
      eyebrow="Future Map"
      title="Future Map 夢想導航"
      subtitle="我的夢想，在中央怎麼實現？切換方案即可查看專屬的四年課表與重要申請時程"
    >
      <FutureMapExplorerView />
    </InfoPageShell>
  );
}
