import { Bus, Bike, Car } from "lucide-react";
import { InfoPageShell } from "@/components/InfoPageShell";

const TRANSPORT_ITEMS = [
  {
    title: "132 / 133 市區公車（往返中壢火車站）",
    desc: "中大主要通勤路線，班次密集。停靠正門圓環、依仁堂等站，直達中壢火車站商圈。",
    icon: Bus,
    tag: "市區公車",
    tips: "尖峰時段約 10~15 分鐘一班，可使用悠遊卡、一卡通或乘車碼。",
  },
  {
    title: "172 路直達公車（往返高鐵桃園站）",
    desc: "週五返鄉與週日收假首選！依仁堂與正門發車，直達高鐵桃園站及機捷 A18 站。",
    icon: Bus,
    tag: "高鐵接駁",
    tips: "週五下午與週日傍晚為尖峰乘車時段，建議提早 10 分鐘候車。",
  },
  {
    title: "YouBike 2.0 租借站點",
    desc: "校園內外設有 4 處主要站點：正門警衛室、後門商圈、依仁堂體育館、男九舍。",
    icon: Bike,
    tag: "單車代步",
    tips: "中大斜坡多，下坡路段騎乘請注意減速慢行，雨天請留意路面濕滑。",
  },
  {
    title: "自行開車與訪客停車須知",
    desc: "訪客汽車一律由正門進出，採車牌辨識自動計費進場。大草坪周邊與正門設有停車格。",
    icon: Car,
    tag: "停車指引",
    tips: "平日 30 元/小時，假日 50 元/小時，校園內全區限速 30 公里以策安全。",
  },
];

export default function TransportPage() {
  return (
    <InfoPageShell
      icon={Bus}
      eyebrow="Transport"
      title="交通方式與聯外指引"
      subtitle="市區公車路線、高鐵接駁時刻建議、校園 YouBike 站點與停車資訊"
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
                <h2 className="mb-2 text-base font-bold text-stone-900">{item.title}</h2>
                <p className="mb-4 text-sm leading-relaxed text-stone-600">{item.desc}</p>
              </div>
              <p className="rounded-xl bg-stone-50 p-3 text-xs text-stone-500">貼心小提醒：{item.tips}</p>
            </article>
          );
        })}
      </div>
    </InfoPageShell>
  );
}
