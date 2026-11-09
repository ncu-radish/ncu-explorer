import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Bus, Coffee, Compass, Map, Users, type LucideIcon } from "lucide-react";

type InfoCard = {
  href: string;
  title: string;
  icon: LucideIcon;
  description: string;
};

// 排列順序（寬螢幕一排三個）：
// 第一排：課程、地圖、Future Map
// 第二排：交通、飲食、社團
const CARDS: InfoCard[] = [
  {
    href: "/courses",
    title: "課程資訊與檢索",
    icon: BookOpen,
    description: "查詢全校開課清單、系所必選修、授課時段與學分資訊，並提供修業路徑參考。",
  },
  {
    href: "/map",
    title: "3D 校園地圖與館舍設施",
    icon: Map,
    description: "瀏覽各大教學大樓、行政處室、學生宿舍與運動場館分佈，提供 3D 立體導覽與館舍定位。",
  },
  {
    href: "/explore/future-map",
    title: "Future Map 夢想導航",
    icon: Compass,
    description: "我的夢想，在中央怎麼實現？切換基礎、中階、進階方案，即刻查看專屬的四年動態課表與重要申請時程。",
  },
  {
    href: "/explore/transport",
    title: "交通方式與指引",
    icon: Bus,
    description: "收錄 132/133 市區公車、172 高鐵接駁、YouBike 2.0 租借與自行開車停車指南。",
  },
  {
    href: "/explore/food",
    title: "飲食指南與美食",
    icon: Coffee,
    description: "後門餐廳一條街、宵夜街人氣美食、松苑與男九舍校內學餐、校園咖啡與便利超商。",
  },
  {
    href: "/clubs",
    title: "學生社團與活動",
    icon: Users,
    description: "涵蓋學術研究、康樂藝文、體育運動與自治社團組織，探索多采多姿的課外校園生活。",
  },
];

export default function ExplorePage() {
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
        {CARDS.map(({ href, title, icon: Icon, description }) => (
          <Link
            key={href}
            href={href}
            className="surface group flex flex-col justify-between p-6 transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg"
          >
            <div>
              <div className="mb-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 text-white">
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <h2 className="mb-2 text-lg font-bold text-stone-900 transition-colors group-hover:text-violet-700">
                {title}
              </h2>
              <p className="mb-4 text-sm leading-relaxed text-stone-600">{description}</p>
            </div>
            <div className="flex items-center justify-between border-t border-stone-100 pt-4 text-xs font-semibold text-violet-600">
              <span>查看詳細內容</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
