import { Bus, Bike, Car, Clock, ExternalLink } from "lucide-react";
import { InfoPageShell } from "@/components/InfoPageShell";

interface ScheduleInfo {
  origin: string;
  destination: string;
  weekdayFirst: string;
  weekdayLast: string;
  holidayFirst: string;
  holidayLast: string;
}

interface TransportLink {
  label: string;
  url: string;
}

interface TransportItem {
  title: string;
  desc: string;
  icon: typeof Bus;
  tag: string;
  tips: string;
  schedule?: ScheduleInfo;
  links?: TransportLink[];
}

const TRANSPORT_ITEMS: TransportItem[] = [
  {
    title: "132 市區公車（往返中壢火車站）",
    desc: "中大往返中壢市區最主要的骨幹公車，停靠正門圓環、依仁堂等站，直達中壢火車站商圈。",
    icon: Bus,
    tag: "市區公車",
    schedule: {
      origin: "中央大學觀景台",
      destination: "中壢火車站",
      weekdayFirst: "07:00",
      weekdayLast: "21:40",
      holidayFirst: "07:00",
      holidayLast: "21:40",
    },
    tips: "尖峰時段約 10~15 分鐘一班，車程約 20~25 分鐘，可使用悠遊卡、一卡通、TPASS 或乘車碼。",
    links: [
      {
        label: "桃園公車即時動態",
        url: "https://ebus.tycg.gov.tw/ebus/driving-map/132",
      },
      {
        label: "官方詳細時刻表",
        url: "http://www.tybus.com.tw/default.aspx?page=BusTime",
      },
    ],
  },
  {
    title: "133A 快速市區公車（往返中壢火車站）",
    desc: "中大往返中壢火車站的快速輔助路線，行經環南路直達火車站，避開市區繁複繞行。",
    icon: Bus,
    tag: "市區快速",
    schedule: {
      origin: "中央大學觀景台",
      destination: "中壢火車站",
      weekdayFirst: "08:30",
      weekdayLast: "17:30",
      holidayFirst: "08:30",
      holidayLast: "17:30",
    },
    tips: "平日與假日固定班次運行，上車前建議確認發車時刻，中壢火車站停靠中壢客運總站。",
    links: [
      {
        label: "桃園公車即時動態",
        url: "https://ebus.tycg.gov.tw/ebus/driving-map/133",
      },
      {
        label: "中壢客運官方班表",
        url: "http://www.chunglibus.com.tw/",
      },
    ],
  },
  {
    title: "172 路直達公車（往返高鐵桃園站）",
    desc: "中大學生週五返鄉與週日收假首選！依仁堂與正門圓環發車，直達高鐵桃園站及機捷 A18 站。",
    icon: Bus,
    tag: "高鐵直達",
    schedule: {
      origin: "中央大學觀景台",
      destination: "桃園高鐵站",
      weekdayFirst: "08:30",
      weekdayLast: "16:50",
      holidayFirst: "14:30",
      holidayLast: "16:50",
    },
    tips: "週五下午與週日傍晚為返鄉收假尖峰常客滿，假日首班為 14:30 發車，建議提早 10 分鐘至依仁堂候車。",
    links: [
      {
        label: "172 即時公車動態",
        url: "https://ebus.tycg.gov.tw/ebus/driving-map/172",
      },
      {
        label: "中壢客運官方班表",
        url: "http://www.chunglibus.com.tw/",
      },
    ],
  },
  {
    title: "173 路市區公車（往返高鐵桃園站）",
    desc: "經市區串聯高鐵桃園站之接駁公車，提供清晨早班車與傍晚通勤服務，往返青埔與高鐵站。",
    icon: Bus,
    tag: "高鐵接駁",
    schedule: {
      origin: "中央大學觀景台",
      destination: "桃園高鐵站",
      weekdayFirst: "07:15",
      weekdayLast: "18:00",
      holidayFirst: "15:40",
      holidayLast: "18:00",
    },
    tips: "平日清晨 07:15 即有早班車出發，假日首班車為 15:40，直達高鐵站 5 號公車月台。",
    links: [
      {
        label: "173 即時公車動態",
        url: "https://ebus.tycg.gov.tw/ebus/driving-map/173",
      },
      {
        label: "桃園公車時刻表",
        url: "https://ebus.tycg.gov.tw/",
      },
    ],
  },
  {
    title: "9025A 國道客運（直達台北松山機場）",
    desc: "中大直達台北市區的國道客運！由中大觀景台出發，行經國道一號直達捷運行天宮站、台北大學與松山機場。",
    icon: Bus,
    tag: "國道客運",
    schedule: {
      origin: "中央大學觀景台",
      destination: "松山機場",
      weekdayFirst: "12:00",
      weekdayLast: "17:50",
      holidayFirst: "07:00",
      holidayLast: "18:00",
    },
    tips: "假日自 07:00 晨間即有發車，平日中午 12:00 起發車；北上返家或實習免轉乘火車極度便利。",
    links: [
      {
        label: "公路客運即時動態",
        url: "https://www.taiwanbus.tw/eBusPage.aspx?RouteNo=9025",
      },
      {
        label: "台北客運 9025 班表",
        url: "http://www.tpebus.com.tw/",
      },
    ],
  },
  {
    title: "YouBike 2.0 租借站點",
    desc: "校園內外設有 4 處主要站點：正門警衛室、後門商圈、依仁堂體育館、男九舍後方。",
    icon: Bike,
    tag: "單車代步",
    tips: "中大斜坡多，下坡路段騎乘請注意減速慢行，雨天請留意路面濕滑。可搭配專屬 App 查詢即時車位。",
    links: [
      {
        label: "YouBike 2.0 即時車位查詢",
        url: "https://www.youbike.com.tw/region/tycg/stations/",
      },
    ],
  },
  {
    title: "自行開車與訪客停車須知",
    desc: "訪客汽車一律由正門進出，採車牌辨識自動計費進場。大草坪周邊與正門環校道路設有合格停車格。",
    icon: Car,
    tag: "停車指引",
    tips: "平日 30 元/小時，假日 50 元/小時（前 30 分鐘免費），校園內全區限速 30 公里以策安全。",
    links: [
      {
        label: "總務處停車管理規章",
        url: "https://oga.ncu.edu.tw/",
      },
    ],
  },
];

export default function TransportPage() {
  return (
    <InfoPageShell
      icon={Bus}
      eyebrow="Transport"
      title="交通方式與聯外指引"
      subtitle="市區公車路線、高鐵接駁時刻、國道客運直達車與校園 YouBike / 停車資訊"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {TRANSPORT_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title} className="surface flex flex-col justify-between p-6">
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                    {item.tag}
                  </span>
                </div>

                <h2 className="mb-1.5 text-base font-bold text-stone-900">{item.title}</h2>

                {item.schedule && (
                  <div className="mb-3 flex items-center gap-1.5 text-xs text-stone-600">
                    <span className="rounded-md bg-stone-100 px-2 py-0.5 font-medium text-stone-700">
                      {item.schedule.origin}
                    </span>
                    <span className="text-stone-400 font-bold">⇄</span>
                    <span className="rounded-md bg-stone-100 px-2 py-0.5 font-medium text-stone-700">
                      {item.schedule.destination}
                    </span>
                  </div>
                )}

                <p className="mb-4 text-sm leading-relaxed text-stone-600">{item.desc}</p>

                {item.schedule && (
                  <div className="mb-4 flex flex-col gap-2 rounded-xl bg-stone-50/90 p-3 text-xs border border-stone-200/60">
                    <div className="flex items-center justify-between pb-1.5 border-b border-stone-200/50">
                      <span className="flex items-center gap-1.5 font-bold text-stone-800">
                        <Clock className="h-3.5 w-3.5 text-violet-600" />
                        首末班發車時刻 (中央大學發車)
                      </span>
                      <span className="text-[11px] text-stone-400 font-medium">觀景台站</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex flex-col gap-0.5 rounded-lg bg-white p-2 border border-stone-100 shadow-2xs">
                        <span className="text-[11px] text-stone-400 font-medium">平日發車</span>
                        <span className="font-bold text-stone-800">
                          {item.schedule.weekdayFirst} ~ {item.schedule.weekdayLast}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5 rounded-lg bg-white p-2 border border-stone-100 shadow-2xs">
                        <span className="text-[11px] text-stone-400 font-medium">假日發車</span>
                        <span className="font-bold text-stone-800">
                          {item.schedule.holidayFirst} ~ {item.schedule.holidayLast}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {item.links && item.links.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {item.links.map((link) => (
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
                )}
              </div>

              <p className="rounded-xl bg-stone-50 p-3 text-xs text-stone-500">
                💡 貼心小提醒：{item.tips}
              </p>
            </article>
          );
        })}
      </div>
    </InfoPageShell>
  );
}
