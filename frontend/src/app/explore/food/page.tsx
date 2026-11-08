"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Coffee, MapPin } from "lucide-react";
import { exploreApi } from "@/lib/api";
import { sanitizeHtml } from "@/lib/sanitize";
import { InfoPageShell } from "@/components/InfoPageShell";

type FoodItem = {
  id: number;
  title: string;
  location_id?: string | null;
  location_name?: string | null;
  tags: string[];
  game_snippet: string;
  content_html: string;
};

export default function FoodPage() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<FoodItem | null>(null);

  useEffect(() => {
    exploreApi
      .getLifeInfo("food")
      .then((res) => setItems(res as FoodItem[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <InfoPageShell
      icon={Coffee}
      eyebrow="Dining"
      title="飲食生活與周邊美食"
      subtitle="精選中大人必吃後門早餐、宵夜街排隊名店、校內學餐與超商資訊"
    >
      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-xs"
          onClick={() => setDetail(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={detail.title}
            className="surface-raised w-full max-w-2xl p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between border-b border-stone-200 pb-3">
              <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                {detail.tags[0] || "飲食"}
              </span>
              <button
                onClick={() => setDetail(null)}
                className="cursor-pointer rounded-full bg-stone-100 px-3.5 py-1.5 text-xs text-stone-600 hover:bg-stone-200"
              >
                關閉
              </button>
            </div>
            <h2 className="mb-3 text-xl font-bold text-stone-900">{detail.title}</h2>
            <div className="mb-5 max-h-80 overflow-y-auto rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm leading-relaxed text-stone-700">
              {detail.content_html ? (
                <div className="prose-content" dangerouslySetInnerHTML={{ __html: sanitizeHtml(detail.content_html) }} />
              ) : (
                <p>{detail.game_snippet}</p>
              )}
            </div>
            {detail.location_id && (
              <Link
                href={`/map?loc=${detail.location_id}`}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-xs font-semibold text-white transition-colors hover:bg-violet-700"
              >
                <MapPin className="h-4 w-4" /> 在地圖中查看位置
              </Link>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <p className="py-16 text-center text-sm text-stone-500">正在載入飲食資料...</p>
      ) : items.length === 0 ? (
        <p className="py-16 text-center text-sm text-stone-500">目前沒有可顯示的飲食資料。</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => setDetail(item)}
              className="surface group flex cursor-pointer flex-col justify-between p-6 text-left transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg"
            >
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                    {item.tags[0] || "飲食"}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-stone-500">
                    <MapPin className="h-3.5 w-3.5 text-stone-500" /> {item.location_name || "校園周邊"}
                  </span>
                </div>
                <h2 className="mb-2 text-base font-bold text-stone-900 transition-colors group-hover:text-violet-700">
                  {item.title}
                </h2>
                <p className="mb-4 text-sm leading-relaxed text-stone-600">{item.game_snippet}</p>
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.slice(0, 5).map((tag) => (
                    <span key={tag} className="rounded-md border border-stone-200 bg-stone-50 px-2 py-0.5 text-xs text-stone-600">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <span className="mt-4 border-t border-stone-100 pt-3 text-xs font-semibold text-violet-600">
                點擊查看完整店家資訊
              </span>
            </button>
          ))}
        </div>
      )}
    </InfoPageShell>
  );
}
