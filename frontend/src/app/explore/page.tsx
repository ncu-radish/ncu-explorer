import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Bus, Coffee, Map, Users, type LucideIcon } from "lucide-react";

type InfoCard = {
  href: string;
  title: string;
  icon: LucideIcon;
  badge: string;
  description: string;
  highlights: string[];
};

const CARDS: InfoCard[] = [
  {
    href: "/courses",
    title: "課程資訊與檢索",
    icon: BookOpen,
    badge: "修課與選課",
    description: "查詢全校開課清單、系所必選修、授課時段與學分資訊，並提供修業路徑參考。",
    highlights: ["全校課程檢索", "系所修業地圖", "AI 智慧顧問推薦"],
  },
  {
    href: "/map",
    title: "3D 校園地圖與館舍設施",
    icon: Map,
    badge: "3D 空間導覽",
    description: "瀏覽各大教學大樓、行政處室、學生宿舍與運動場館分佈，提供 3D 立體導覽與館舍定位。",
    highlights: ["立體空間 3D 地圖", "館舍系所檢索", "教室位置定位"],
  },
  {
    href: "/explore/transport",
    title: "交通方式與指引",
    icon: Bus,
    badge: "往返與通勤",
    description: "收錄 132/133 市區公車、172 高鐵接駁、YouBike 2.0 租借與自行開車停車指南。",
    highlights: ["132/133 公車時刻", "高鐵與火車轉乘", "校園 YouBike 站點"],
  },
  {
    href: "/explore/food",
    title: "飲食指南與美食",
    icon: Coffee,
    badge: "生活餐飲",
    description: "後門早餐一條街、宵夜街人氣美食、松苑與男九舍校內學餐、校園咖啡與便利超商。",
    highlights: ["後門早午餐商圈", "宵夜街人氣必吃", "校內平價學生餐廳"],
  },
  {
    href: "/clubs",
    title: "學生社團與活動",
    icon: Users,
    badge: "課外學習",
    description: "涵蓋學術研究、康樂藝文、體育運動與自治社團組織，探索多采多姿的課外校園生活。",
    highlights: ["社團活動時段", "社辦位置指引", "招新資訊一覽"],
  },
];

// 保留的空位（未來另作他用）：排在第一排最右側，即右上角
const PLACEHOLDER_INDEX = 2;

export default function ExplorePage() {
  // 依序排列，PLACEHOLDER_INDEX 位置插入 null 代表空位
  const slots: (InfoCard | null)[] = [...CARDS];
  slots.splice(PLACEHOLDER_INDEX, 0, null);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 md:py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 transition hover:border-violet-300 hover:text-violet-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            回首頁
          </Link>
          <p className="eyebrow">NCU Info</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-stone-900 md:text-4xl">中大資訊</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {slots.map((card, i) => {
          if (card === null) {
            return (
              <div
                key={`placeholder-${i}`}
                aria-hidden
                className="surface hidden min-h-48 lg:block"
              />
            );
          }
          const { href, title, icon: Icon, badge, description, highlights } = card;
          return (
            <Link
              key={href}
              href={href}
              className="surface group flex flex-col justify-between p-6 transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg"
            >
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                    {badge}
                  </span>
                </div>
                <h2 className="mb-2 text-lg font-bold text-stone-900 transition-colors group-hover:text-violet-700">
                  {title}
                </h2>
                <p className="mb-4 text-sm leading-relaxed text-stone-600">{description}</p>
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {highlights.map((h) => (
                    <span key={h} className="rounded-md border border-stone-200 bg-stone-50 px-2 py-0.5 text-xs text-stone-600">
                      {h}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-stone-100 pt-4 text-xs font-semibold text-violet-600">
                <span>查看詳細內容</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
