"use client";

import { useState } from "react";
import { Bus, Bike, Car, Zap, Clock, ExternalLink, MapPin } from "lucide-react";
import { InfoPageShell } from "@/components/InfoPageShell";

interface TransportLink {
  label: string;
  url: string;
}

interface BusRoute {
  id: string;
  name: string;
  origin: string;
  destination: string;
  desc: string;
  weekdayFirst: string;
  weekdayLast: string;
  holidayFirst: string;
  holidayLast: string;
  tips: string;
  links: TransportLink[];
}

const BUS_ROUTES: BusRoute[] = [
  {
    id: "132",
    name: "132 市區公車",
    origin: "中央大學觀景台",
    destination: "中壢火車站",
    desc: "中大往返中壢市區最主要的骨幹公車，停靠正門圓環、依仁堂等站，直達中壢火車站商圈。",
    weekdayFirst: "07:00",
    weekdayLast: "21:40",
    holidayFirst: "07:00",
    holidayLast: "21:40",
    tips: "尖峰時段約 10~15 分鐘一班，車程約 20~25 分鐘，可使用悠遊卡、一卡通、TPASS 或乘車碼。",
    links: [
      {
        label: "132 即時公車動態",
        url: "https://ebus.tycg.gov.tw/ebus/driving-map/3220",
      },
    ],
  },
  {
    id: "133A",
    name: "133A 快速市區公車",
    origin: "中央大學觀景台",
    destination: "中壢火車站",
    desc: "中大往返中壢火車站的快速輔助路線，行經環南路直達火車站，避開市區繁複繞行。",
    weekdayFirst: "08:30",
    weekdayLast: "17:30",
    holidayFirst: "08:30",
    holidayLast: "17:30",
    tips: "平日與假日固定班次運行，上車前建議確認發車時刻，中壢火車站停靠中壢客運總站。",
    links: [
      {
        label: "133 即時公車動態",
        url: "https://ebus.tycg.gov.tw/ebus/driving-map/133",
      },
    ],
  },
  {
    id: "172",
    name: "172 直達高鐵公車",
    origin: "中央大學觀景台",
    destination: "桃園高鐵站",
    desc: "中大學生週五返鄉與週日收假首選！依仁堂與正門圓環發車，直達高鐵桃園站及機捷 A18 站。",
    weekdayFirst: "08:30",
    weekdayLast: "16:50",
    holidayFirst: "14:30",
    holidayLast: "16:50",
    tips: "週五下午與週日傍晚為返鄉收假尖峰常客滿，假日首班為 14:30 發車，建議提早 10 分鐘候車。",
    links: [
      {
        label: "172 即時公車動態",
        url: "https://ebus.tycg.gov.tw/ebus/driving-map/3221",
      },
    ],
  },
  {
    id: "173",
    name: "173 高鐵市區公車",
    origin: "中央大學觀景台",
    destination: "桃園高鐵站",
    desc: "經市區串聯高鐵桃園站之接駁公車，提供清晨早班車與傍晚通勤服務，往返青埔與高鐵站。",
    weekdayFirst: "07:15",
    weekdayLast: "18:00",
    holidayFirst: "15:40",
    holidayLast: "18:00",
    tips: "平日清晨 07:15 即有早班車出發，假日首班車為 15:40，直達高鐵站 5 號公車月台。",
    links: [
      {
        label: "173 即時公車動態",
        url: "https://ebus.tycg.gov.tw/ebus/driving-map/173",
      },
    ],
  },
  {
    id: "9025A",
    name: "9025A 台北國道客運",
    origin: "中央大學觀景台",
    destination: "松山機場",
    desc: "中大直達台北市區的國道客運！由觀景台出發，行經國道一號直達捷運行天宮站、台北大學與松山機場。",
    weekdayFirst: "12:00",
    weekdayLast: "17:50",
    holidayFirst: "07:00",
    holidayLast: "18:00",
    tips: "假日自 07:00 晨間即有發車，平日中午 12:00 起發車；北上返家免轉乘火車極度便利。",
    links: [
      {
        label: "9025 公運即時動態",
        url: "https://www.taiwanbus.tw/eBusPage.aspx?RouteNo=9025",
      },
    ],
  },
];

export default function TransportPage() {
  const [selectedRouteId, setSelectedRouteId] = useState<string>("132");

  const currentRoute =
    BUS_ROUTES.find((r) => r.id === selectedRouteId) || BUS_ROUTES[0];

  return (
    <InfoPageShell
      icon={Bus}
      eyebrow="Transport"
      title="交通方式與聯外指引"
      subtitle="公車客運時刻、YouBike 租借、訪客開車停車與 oloo 校園共享滑板車"
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* 1. 公車客運大卡片 */}
        <article className="surface flex flex-col justify-between p-6">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                <Bus className="h-5 w-5" />
              </span>
              <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                大眾運輸
              </span>
            </div>

            <h2 className="mb-2 text-lg font-bold text-stone-900">
              公車客運路線與發車時刻
            </h2>
            <p className="mb-3 text-xs text-stone-500">
              點擊下方路線切換查看觀景台發車時間與即時動態：
            </p>

            {/* 路線切換頁籤 Tabs */}
            <div className="mb-4 flex flex-wrap gap-1.5">
              {BUS_ROUTES.map((route) => {
                const isActive = route.id === currentRoute.id;
                return (
                  <button
                    key={route.id}
                    type="button"
                    onClick={() => setSelectedRouteId(route.id)}
                    className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                      isActive
                        ? "bg-violet-600 text-white shadow-xs"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900"
                    }`}
                  >
                    {route.id}
                  </button>
                );
              })}
            </div>

            {/* 選中路線詳情 */}
            <div className="rounded-xl border border-stone-200/80 bg-stone-50/50 p-3.5 mb-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-bold text-sm text-stone-900">
                  {currentRoute.name}
                </span>
                <div className="flex items-center gap-1 text-xs text-stone-600">
                  <span className="rounded bg-white px-2 py-0.5 font-medium border border-stone-200/60">
                    {currentRoute.origin}
                  </span>
                  <span className="text-stone-400 font-bold">⇄</span>
                  <span className="rounded bg-white px-2 py-0.5 font-medium border border-stone-200/60">
                    {currentRoute.destination}
                  </span>
                </div>
              </div>

              <p className="mb-3 text-xs leading-relaxed text-stone-600">
                {currentRoute.desc}
              </p>

              {/* 首末班時刻區塊 */}
              <div className="flex flex-col gap-1.5 rounded-lg bg-white p-2.5 border border-stone-200/60 text-xs">
                <div className="flex items-center justify-between pb-1 border-b border-stone-100 text-[11px] text-stone-500 font-medium">
                  <span className="flex items-center gap-1 text-stone-800 font-semibold">
                    <Clock className="h-3.5 w-3.5 text-violet-600" />
                    首末班發車時刻 (中央大學發車)
                  </span>
                  <span>觀景台站</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="flex flex-col gap-0.5 rounded-md bg-stone-50/80 p-2">
                    <span className="text-[11px] text-stone-400 font-medium">
                      平日發車
                    </span>
                    <span className="font-bold text-stone-800">
                      {currentRoute.weekdayFirst} ~ {currentRoute.weekdayLast}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5 rounded-md bg-stone-50/80 p-2">
                    <span className="text-[11px] text-stone-400 font-medium">
                      假日發車
                    </span>
                    <span className="font-bold text-stone-800">
                      {currentRoute.holidayFirst} ~ {currentRoute.holidayLast}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 即時連結按鈕 */}
            <div className="mb-4 flex flex-wrap gap-2">
              {currentRoute.links.map((link) => (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700 transition hover:bg-violet-100 hover:text-violet-800"
                >
                  <span>{link.label}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              ))}
            </div>
          </div>

          <p className="rounded-xl bg-stone-50 p-3 text-xs text-stone-500">
            💡 貼心小提醒：{currentRoute.tips}
          </p>
        </article>

        {/* 2. YouBike 2.0 卡片 */}
        <article className="surface flex flex-col justify-between p-6">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Bike className="h-5 w-5" />
              </span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                單車代步
              </span>
            </div>

            <h2 className="mb-2 text-lg font-bold text-stone-900">
              YouBike 2.0 公共自行車
            </h2>
            <p className="mb-4 text-sm leading-relaxed text-stone-600">
              校園內設有 3 處 YouBike 2.0 借還站點，方便同學與訪客在校園及周邊生活圈短程代步。
            </p>

            <div className="mb-4 flex flex-col gap-2.5 rounded-xl border border-stone-200/60 bg-stone-50/70 p-3.5 text-xs">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <div className="w-full">
                  <span className="font-bold text-stone-800">校內 3 大借還站點：</span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <span className="rounded-md bg-white px-2 py-0.5 font-medium text-stone-700 border border-stone-200/60 shadow-2xs">
                      📍 中大國民運動中心
                    </span>
                    <span className="rounded-md bg-white px-2 py-0.5 font-medium text-stone-700 border border-stone-200/60 shadow-2xs">
                      📍 中央大學依仁堂
                    </span>
                    <span className="rounded-md bg-white px-2 py-0.5 font-medium text-stone-700 border border-stone-200/60 shadow-2xs">
                      📍 中央大學圖書館
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-stone-200/50 pt-2 text-stone-600">
                <span className="font-bold text-stone-800">租借與費率：</span>
                <span className="ml-1">
                  支援悠遊卡、一卡通及官方 App 掃碼租借。享桃園市公共自行車前 30 分鐘優惠。
                </span>
              </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              <a
                href="https://www.youbike.com.tw/region/tycg/stations/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                <span>YouBike 2.0 即時車位查詢</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="https://www.youbike.com.tw/region/tycg/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700 transition hover:bg-stone-200"
              >
                <span>微笑單車官方站點</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          <p className="rounded-xl bg-stone-50 p-3 text-xs text-stone-500">
            💡 貼心小提醒：中大斜坡多，百花川及下坡路段請減速慢行並禮讓行人；還車務必確認車機扣款成功。
          </p>
        </article>

        {/* 3. 自行開車與停車須知卡片 */}
        <article className="surface flex flex-col justify-between p-6">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Car className="h-5 w-5" />
              </span>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                停車指引
              </span>
            </div>

            <h2 className="mb-2 text-lg font-bold text-stone-900">
              自行開車與訪客停車須知
            </h2>
            <p className="mb-4 text-sm leading-relaxed text-stone-600">
              訪客汽車一律由正門進出，全校採車牌自動辨識計費進場。大草坪周邊與正門環校道路設有合格停車格。
            </p>

            <div className="mb-4 flex flex-col gap-2 rounded-xl border border-stone-200/60 bg-stone-50/70 p-3.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-stone-200/50">
                <span className="font-bold text-stone-700">進出通道</span>
                <span className="font-medium text-stone-800">正門單一出入口（車牌辨識）</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-stone-200/50">
                <span className="font-bold text-stone-700">收費標準</span>
                <span className="font-medium text-stone-800">平日 30 元/時，假日 50 元/時</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="font-bold text-stone-700">免收費優惠</span>
                <span className="font-medium text-emerald-700">進場前 30 分鐘免費</span>
              </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              <a
                href="https://oga.ncu.edu.tw/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                <span>總務處停車管理規章</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          <p className="rounded-xl bg-stone-50 p-3 text-xs text-stone-500">
            💡 貼心小提醒：校園全區嚴格限速 30 公里以策安全；尖峰活動期間車位易滿，建議多利用正門周邊環校道路停車。
          </p>
        </article>

        {/* 4. oloo 共享電動滑板車卡片 */}
        <article className="surface flex flex-col justify-between p-6">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <Zap className="h-5 w-5" />
              </span>
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                校園共享
              </span>
            </div>

            <h2 className="mb-2 text-lg font-bold text-stone-900">
              oloo 共享電動滑板車
            </h2>
            <p className="mb-4 text-sm leading-relaxed text-stone-600">
              中央大學引進之綠能共享運具，適合在廣大坡地校園中省時快速通勤，採專屬虛擬站點定點借還。
            </p>

            <div className="mb-4 flex flex-col gap-2 rounded-xl border border-stone-200/60 bg-stone-50/70 p-3.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-stone-200/50">
                <span className="font-bold text-stone-700">租借方式</span>
                <span className="font-medium text-stone-800">下載 oloo App 掃碼即開鎖</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-stone-200/50">
                <span className="font-bold text-stone-700">借還模式</span>
                <span className="font-medium text-stone-800">校內指定虛擬停車格（定點借還）</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="font-bold text-stone-700">安全速限</span>
                <span className="font-medium text-amber-700">校園內全區限速 15 公里</span>
              </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              <a
                href="https://www.oloo.work/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
              >
                <span>oloo 官方網站</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="https://www.oloo.work/how-to-use"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700 transition hover:bg-stone-200"
              >
                <span>借還教學與規範</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          <p className="rounded-xl bg-stone-50 p-3 text-xs text-stone-500">
            💡 貼心小提醒：騎乘請務必注意行人與路況、嚴禁雙載；還車時須停放在 App 指定之校內合法格位內並拍照完成還車手續。
          </p>
        </article>
      </div>
    </InfoPageShell>
  );
}
