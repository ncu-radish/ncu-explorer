export interface ExchangeSchoolItem {
  id: string;
  name_zh: string;
  name_en?: string;
  country: string;
  flag: string;
  region: "歐洲地區" | "美洲與大洋洲" | "亞洲地區";
  official_languages: string[];
  field_restrictions: string[];
  is_restricted_program: boolean;
  lifestyle_tags: string[];
  official_note: string;
}

export const NCU_AY116_EXCHANGE_DATABASE: ExchangeSchoolItem[] = [
  // ==========================================
  // 歐洲地區 (Europe) - 法國
  // ==========================================
  {
    id: "fr-sorbonne-paris-nord",
    name_zh: "索邦北巴黎大學",
    name_en: "Université Sorbonne Paris Nord",
    country: "法國",
    flag: "🇫🇷",
    region: "歐洲地區",
    official_languages: ["法語"],
    field_restrictions: ["商管學院"],
    is_restricted_program: true,
    lifestyle_tags: ["歐洲藝文"],
    official_note: "限申請 International Programme in Business and Management 全英/法語商管專案。"
  },
  {
    id: "fr-eivp",
    name_zh: "巴黎市立工程師學校",
    name_en: "École des Ingénieurs de la Ville de Paris (EIVP)",
    country: "法國",
    flag: "🇫🇷",
    region: "歐洲地區",
    official_languages: ["法語"],
    field_restrictions: ["土木工程", "工程機械"],
    is_restricted_program: true,
    lifestyle_tags: ["歐洲藝文"],
    official_note: "限土木系學生申請，專攻智慧城市與都市基礎建設工程。"
  },
  {
    id: "fr-utbm",
    name_zh: "貝爾福-蒙貝利亞技術大學",
    name_en: "Université de Technologie de Belfort-Montbéliard (UTBM)",
    country: "法國",
    flag: "🇫🇷",
    region: "歐洲地區",
    official_languages: ["法語"],
    field_restrictions: ["理學自然", "工程機械", "資電資訊"],
    is_restricted_program: true,
    lifestyle_tags: ["歐洲藝文"],
    official_note: "交換科系限理學院、工學院及資電學院學生申請。"
  },
  {
    id: "fr-clermont-inp",
    name_zh: "克萊蒙-奧弗涅大學",
    name_en: "Clermont Auvergne INP",
    country: "法國",
    flag: "🇫🇷",
    region: "歐洲地區",
    official_languages: ["法語"],
    field_restrictions: ["生醫理工"],
    is_restricted_program: true,
    lifestyle_tags: ["歐洲藝文"],
    official_note: "適合生醫相關科系（適合醫院及生醫領域同學申請）。"
  },
  {
    id: "fr-ensea",
    name_zh: "國立高等應用電子學院 (ENSEA)",
    name_en: "École Nationale Supérieure de l'Électronique et de ses Applications",
    country: "法國",
    flag: "🇫🇷",
    region: "歐洲地區",
    official_languages: ["法語", "英語"],
    field_restrictions: ["資電資訊", "生醫理工", "工程機械"],
    is_restricted_program: true,
    lifestyle_tags: ["歐洲藝文"],
    official_note: "適合資電學院、生醫理工學院及工學院同學申請，提供優質電子與嵌入式軟硬體研習。"
  },
  {
    id: "fr-lasalle-estaca",
    name_zh: "拉薩爾博舍综合理工學院 / 航太工程高等學院",
    name_en: "UniLaSalle / ESTACA",
    country: "法國",
    flag: "🇫🇷",
    region: "歐洲地區",
    official_languages: ["法語"],
    field_restrictions: ["太空科技", "工程機械"],
    is_restricted_program: true,
    lifestyle_tags: ["歐洲藝文"],
    official_note: "適合太空系所及機械系所同學申請，專精航空動力與太空酬載研發。"
  },
  {
    id: "fr-rennes-sb",
    name_zh: "雷恩商學院",
    name_en: "Rennes School of Business",
    country: "法國",
    flag: "🇫🇷",
    region: "歐洲地區",
    official_languages: ["法語", "英語"],
    field_restrictions: ["商管學院", "理學自然", "工程機械", "資電資訊", "生醫理工"],
    is_restricted_program: true,
    lifestyle_tags: ["歐洲藝文"],
    official_note: "限管院、理學院、工學院、資電院、生醫理工學院學生申請（獲 AACSB/EQUIS 雙認證）。"
  },
  {
    id: "fr-isit",
    name_zh: "傳播與跨文化管理學院 (ISIT)",
    name_en: "ISIT Paris Intercultural Management and Communication",
    country: "法國",
    flag: "🇫🇷",
    region: "歐洲地區",
    official_languages: ["法語"],
    field_restrictions: ["人文社會", "文學院"],
    is_restricted_program: true,
    lifestyle_tags: ["歐洲藝文"],
    official_note: "適合文學院、外文及跨文化傳播同學申請，頂尖口筆譯與國際溝通名校。"
  },
  {
    id: "fr-edc-neoma",
    name_zh: "EDC巴黎商學院 / 阿萊斯礦業 / 諾歐商學院",
    name_en: "EDC Paris / IMT Alès / NEOMA Business School",
    country: "法國",
    flag: "🇫🇷",
    region: "歐洲地區",
    official_languages: ["法語", "英語"],
    field_restrictions: ["商管學院"],
    is_restricted_program: true,
    lifestyle_tags: ["歐洲藝文"],
    official_note: "適合管理學院同學申請，提供歐洲精品管理與跨國金融專案課程。"
  },
  {
    id: "fr-lyon-catholique",
    name_zh: "法國里昂天主教大學 / IDRAC商業學院",
    name_en: "UCLy / IDRAC Business School",
    country: "法國",
    flag: "🇫🇷",
    region: "歐洲地區",
    official_languages: ["法語"],
    field_restrictions: ["商管學院", "人文社會"],
    is_restricted_program: true,
    lifestyle_tags: ["歐洲藝文"],
    official_note: "限特定科系（商管與外語人文）申請。"
  },
  {
    id: "fr-general-paris",
    name_zh: "巴黎天主教大學",
    name_en: "Institut Catholique de Paris",
    country: "法國",
    flag: "🇫🇷",
    region: "歐洲地區",
    official_languages: ["法語"],
    field_restrictions: ["全校開放"],
    is_restricted_program: false,
    lifestyle_tags: ["歐洲藝文"],
    official_note: "無特定科系限制，位於巴黎核心第六區，極具法式人文與古典生活氛圍。"
  },
  {
    id: "fr-strasbourg",
    name_zh: "史特拉斯堡大學",
    name_en: "Université de Strasbourg",
    country: "法國",
    flag: "🇫🇷",
    region: "歐洲地區",
    official_languages: ["法語"],
    field_restrictions: ["全校開放"],
    is_restricted_program: false,
    lifestyle_tags: ["歐洲藝文"],
    official_note: "無特定計畫限制，座落德法交界歐洲首都，文化多元、學術聲譽卓著。"
  },
  {
    id: "fr-grenoble",
    name_zh: "格勒諾布爾大學",
    name_en: "Université Grenoble Alpes",
    country: "法國",
    flag: "🇫🇷",
    region: "歐洲地區",
    official_languages: ["法語"],
    field_restrictions: ["全校開放"],
    is_restricted_program: false,
    lifestyle_tags: ["歐洲藝文", "北歐自然"],
    official_note: "無特定計畫限制，阿爾卑斯山腳下的創新科技與人文大城，生活環境壯麗。"
  },
  {
    id: "fr-lyon3",
    name_zh: "里昂第三大學",
    name_en: "Université Jean Moulin Lyon 3",
    country: "法國",
    flag: "🇫🇷",
    region: "歐洲地區",
    official_languages: ["法語"],
    field_restrictions: ["全校開放"],
    is_restricted_program: false,
    lifestyle_tags: ["歐洲藝文"],
    official_note: "無特定計畫限制，法國第二大城，美食與歐洲古典文藝生活交匯。"
  },

  // ==========================================
  // 歐洲地區 (Europe) - 德國
  // ==========================================
  {
    id: "de-weimar",
    name_zh: "魏瑪包豪斯大學",
    name_en: "Bauhaus-Universität Weimar",
    country: "德國",
    flag: "🇩🇪",
    region: "歐洲地區",
    official_languages: ["德語", "英語"],
    field_restrictions: ["土木工程", "人文社會"],
    is_restricted_program: true,
    lifestyle_tags: ["歐洲藝文"],
    official_note: "保留名額給媒體學院 (Faculty of media) 與土木工程學院 (Faculty of civil engineering)。"
  },
  {
    id: "de-ostfalia",
    name_zh: "奧斯特法利爾應用科技大學",
    name_en: "Ostfalia University of Applied Sciences",
    country: "德國",
    flag: "🇩🇪",
    region: "歐洲地區",
    official_languages: ["德語"],
    field_restrictions: ["商管學院", "工程機械"],
    is_restricted_program: true,
    lifestyle_tags: ["歐洲藝文"],
    official_note: "名額嚴格分配至商學院 (Faculty of Business) 與機械工程學院 (Faculty of Mechanical Engineering)。"
  },
  {
    id: "de-karlsruhe",
    name_zh: "卡斯魯爾應用科學大學",
    name_en: "Karlsruhe University of Applied Sciences",
    country: "德國",
    flag: "🇩🇪",
    region: "歐洲地區",
    official_languages: ["德語", "英語"],
    field_restrictions: ["資電資訊", "工程機械"],
    is_restricted_program: true,
    lifestyle_tags: ["歐洲藝文"],
    official_note: "設有專屬 International Program 全英語工程與技術研習計畫。"
  },
  {
    id: "de-wurzburg",
    name_zh: "符茲堡大學",
    name_en: "Julius-Maximilians-Universität Würzburg",
    country: "德國",
    flag: "🇩🇪",
    region: "歐洲地區",
    official_languages: ["德語"],
    field_restrictions: ["商管學院"],
    is_restricted_program: true,
    lifestyle_tags: ["歐洲藝文"],
    official_note: "限管院學生申請姐妹校的 Faculty of Business Management and Economics。"
  },
  {
    id: "de-hohenheim",
    name_zh: "霍恩海姆大學",
    name_en: "University of Hohenheim",
    country: "德國",
    flag: "🇩🇪",
    region: "歐洲地區",
    official_languages: ["德語"],
    field_restrictions: ["商管學院", "人文社會"],
    is_restricted_program: true,
    lifestyle_tags: ["歐洲藝文"],
    official_note: "限管院大三以上學生，並限申請 Faculty of Business, Economics and Social Sciences。"
  },
  {
    id: "de-munich",
    name_zh: "慕尼黑應用科技大學",
    name_en: "Munich University of Applied Sciences",
    country: "德國",
    flag: "🇩🇪",
    region: "歐洲地區",
    official_languages: ["德語"],
    field_restrictions: ["全校開放"],
    is_restricted_program: false,
    lifestyle_tags: ["歐洲藝文"],
    official_note: "無特定計畫限制，座落巴伐利亞邦首府，兼具德國頂尖產業聚落與阿爾卑斯自然風情。"
  },

  // ==========================================
  // 歐洲地區 (Europe) - 比利時
  // ==========================================
  {
    id: "be-liege",
    name_zh: "列日大學",
    name_en: "University of Liège",
    country: "比利時",
    flag: "🇧🇪",
    region: "歐洲地區",
    official_languages: ["法語"],
    field_restrictions: ["工程機械", "理學自然", "資電資訊"],
    is_restricted_program: true,
    lifestyle_tags: ["歐洲藝文"],
    official_note: "限申請姐妹校的 Faculty of Applied Sciences 應用科學學院。"
  },
  {
    id: "be-mons",
    name_zh: "芒斯大學",
    name_en: "University of Mons",
    country: "比利時",
    flag: "🇧🇪",
    region: "歐洲地區",
    official_languages: ["法語"],
    field_restrictions: ["人文社會", "文學院"],
    is_restricted_program: true,
    lifestyle_tags: ["歐洲藝文"],
    official_note: "限文學院學生申請，限交換至 Languages, Literature and Translation Studies 口筆譯專業。"
  },
  {
    id: "be-louvain",
    name_zh: "魯汶天主教大學",
    name_en: "UCLouvain",
    country: "比利時",
    flag: "🇧🇪",
    region: "歐洲地區",
    official_languages: ["法語"],
    field_restrictions: ["人文社會", "文學院"],
    is_restricted_program: true,
    lifestyle_tags: ["歐洲藝文"],
    official_note: "限文學院學生申請，歐洲最負盛名之古典歷史學府之一。"
  },
  {
    id: "be-ulb",
    name_zh: "布魯塞爾自由大學",
    name_en: "Université libre de Bruxelles (ULB)",
    country: "比利時",
    flag: "🇧🇪",
    region: "歐洲地區",
    official_languages: ["法語"],
    field_restrictions: ["全校開放"],
    is_restricted_program: false,
    lifestyle_tags: ["歐洲藝文"],
    official_note: "無特別限制，位於歐盟首府布魯塞爾，法語環境純熟，跨國樞紐交通極為便利。"
  },

  // ==========================================
  // 歐洲地區 (Europe) - 荷蘭、瑞士、西班牙、瑞典
  // ==========================================
  {
    id: "nl-hanze",
    name_zh: "漢斯應用科技大學",
    name_en: "Hanze University of Applied Sciences",
    country: "荷蘭",
    flag: "🇳🇱",
    region: "歐洲地區",
    official_languages: ["荷蘭語", "英語"],
    field_restrictions: ["商管學院", "人文社會", "生醫理工", "工程機械"],
    is_restricted_program: true,
    lifestyle_tags: ["歐洲藝文"],
    official_note: "第一種專案限管院及文院同學（涵蓋 International Business School 與 Media & IT）；第二種限生科、環境與工程所。"
  },
  {
    id: "ch-hslu",
    name_zh: "盧森應用科學與藝術大學",
    name_en: "Lucerne University of Applied Sciences and Arts",
    country: "瑞士",
    flag: "🇨🇭",
    region: "歐洲地區",
    official_languages: ["德語", "英語"],
    field_restrictions: ["資電資訊"],
    is_restricted_program: true,
    lifestyle_tags: ["歐洲藝文", "北歐自然"],
    official_note: "適合資電院同學，限交換至 School of Computer Science and Information Technology。"
  },
  {
    id: "ch-zhaw",
    name_zh: "蘇黎世應用科學大學",
    name_en: "ZHAW Zurich University of Applied Sciences",
    country: "瑞士",
    flag: "🇨🇭",
    region: "歐洲地區",
    official_languages: ["德語", "英語"],
    field_restrictions: ["工程機械", "資電資訊"],
    is_restricted_program: true,
    lifestyle_tags: ["歐洲藝文", "北歐自然"],
    official_note: "提供 School of Engineering 開放資工、機械與工程領域申請。"
  },
  {
    id: "es-upc",
    name_zh: "加泰隆尼亞理工大學",
    name_en: "Universitat Politècnica de Catalunya (UPC)",
    country: "西班牙",
    flag: "🇪🇸",
    region: "歐洲地區",
    official_languages: ["西班牙語", "英語"],
    field_restrictions: ["資電資訊", "工程機械", "太空科技"],
    is_restricted_program: true,
    lifestyle_tags: ["歐洲藝文"],
    official_note: "限定資電、機械、化材、航太等系所申請，巴塞隆納頂尖理工學府。"
  },
  {
    id: "es-comillas",
    name_zh: "科米利亞斯主教大學",
    name_en: "Comillas Pontifical University",
    country: "西班牙",
    flag: "🇪🇸",
    region: "歐洲地區",
    official_languages: ["西班牙語"],
    field_restrictions: ["工程機械", "資電資訊"],
    is_restricted_program: true,
    lifestyle_tags: ["歐洲藝文"],
    official_note: "限工學院及資電學院學生申請，馬德里知名頂尖學府。"
  },
  {
    id: "es-alacant",
    name_zh: "阿利坎特大學",
    name_en: "University of Alicante",
    country: "西班牙",
    flag: "🇪🇸",
    region: "歐洲地區",
    official_languages: ["西班牙語"],
    field_restrictions: ["全校開放"],
    is_restricted_program: false,
    lifestyle_tags: ["歐洲藝文"],
    official_note: "無特定計畫限制，座落美麗的地中海沿岸，享受陽光海灘與道地西班牙生活。"
  },
  {
    id: "se-linkoping",
    name_zh: "林雪坪大學",
    name_en: "Linköping University",
    country: "瑞典",
    flag: "🇸🇪",
    region: "歐洲地區",
    official_languages: ["瑞典語", "英語"],
    field_restrictions: ["理學自然", "工程機械", "資電資訊", "生醫理工"],
    is_restricted_program: true,
    lifestyle_tags: ["北歐自然"],
    official_note: "限理、工、資電學院及生醫理工學院學生申請，北歐頂尖科技重鎮。"
  },
  {
    id: "se-chalmers",
    name_zh: "查爾莫斯理工大學",
    name_en: "Chalmers University of Technology",
    country: "瑞典",
    flag: "🇸🇪",
    region: "歐洲地區",
    official_languages: ["瑞典語", "英語"],
    field_restrictions: ["工程機械", "資電資訊"],
    is_restricted_program: true,
    lifestyle_tags: ["北歐自然"],
    official_note: "適合理工相關學院學生申請，北歐首屈一指的工業科技創新基地。"
  },

  // ==========================================
  // 美洲與大洋洲地區 (Americas & Oceania)
  // ==========================================
  {
    id: "us-ufl",
    name_zh: "佛羅里達大學",
    name_en: "University of Florida",
    country: "美國",
    flag: "🇺🇸",
    region: "美洲與大洋洲",
    official_languages: ["英語"],
    field_restrictions: ["資電資訊"],
    is_restricted_program: true,
    lifestyle_tags: ["美洲風情"],
    official_note: "限電機系同學申請，美國頂尖公立常春藤名校。"
  },
  {
    id: "us-wisc",
    name_zh: "威斯康辛大學麥迪遜分校",
    name_en: "University of Wisconsin–Madison",
    country: "美國",
    flag: "🇺🇸",
    region: "美洲與大洋洲",
    official_languages: ["英語"],
    field_restrictions: ["全校開放"],
    is_restricted_program: true,
    lifestyle_tags: ["美洲風情"],
    official_note: "限申請該校之 VISP Program (Visiting International Student Program，全額自費)。"
  },
  {
    id: "us-uc-davis",
    name_zh: "加州大學戴維斯分校",
    name_en: "University of California, Davis",
    country: "美國",
    flag: "🇺🇸",
    region: "美洲與大洋洲",
    official_languages: ["英語"],
    field_restrictions: ["全校開放"],
    is_restricted_program: false,
    lifestyle_tags: ["美洲風情"],
    official_note: "無特定計畫限制（部分限大學部），全美頂尖研究型公立學府，加州校園生活陽光明媚。"
  },
  {
    id: "us-hawaii",
    name_zh: "夏威夷大學馬諾阿分校",
    name_en: "University of Hawaiʻi at Mānoa",
    country: "美國",
    flag: "🇺🇸",
    region: "美洲與大洋洲",
    official_languages: ["英語"],
    field_restrictions: ["全校開放"],
    is_restricted_program: false,
    lifestyle_tags: ["美洲風情"],
    official_note: "無特定計畫限制，太平洋島嶼風情，兼具美式高階學術與熱帶文化體驗。"
  },
  {
    id: "ca-montreal",
    name_zh: "蒙特婁大學",
    name_en: "Université de Montréal",
    country: "加拿大",
    flag: "🇨🇦",
    region: "美洲與大洋洲",
    official_languages: ["法語", "英語"],
    field_restrictions: ["全校開放"],
    is_restricted_program: false,
    lifestyle_tags: ["美洲風情", "歐洲藝文"],
    official_note: "無特定限制，北美頂尖法語學府，感受北美小巴黎的雙語文化與前沿 AI 研發氛圍。"
  },

  // ==========================================
  // 亞洲地區 (Asia) - 日本
  // ==========================================
  {
    id: "jp-shibaura",
    name_zh: "東京芝浦工業大學",
    name_en: "Shibaura Institute of Technology",
    country: "日本",
    flag: "🇯🇵",
    region: "亞洲地區",
    official_languages: ["日語", "英語"],
    field_restrictions: ["資電資訊", "工程機械"],
    is_restricted_program: true,
    lifestyle_tags: ["亞洲文化"],
    official_note: "設有專屬 Exchange Student Program 等全英科技研究室交換計畫。"
  },
  {
    id: "jp-hiroshima",
    name_zh: "廣島大學",
    name_en: "Hiroshima University",
    country: "日本",
    flag: "🇯🇵",
    region: "亞洲地區",
    official_languages: ["日語", "英語"],
    field_restrictions: ["全校開放"],
    is_restricted_program: true,
    lifestyle_tags: ["亞洲文化"],
    official_note: "提供專屬 HUSA Program (Hiroshima University Study Abroad) 供多元領域申請。"
  },
  {
    id: "jp-toyama",
    name_zh: "富山大學",
    name_en: "University of Toyama",
    country: "日本",
    flag: "🇯🇵",
    region: "亞洲地區",
    official_languages: ["日語", "英語"],
    field_restrictions: ["全校開放"],
    is_restricted_program: true,
    lifestyle_tags: ["亞洲文化"],
    official_note: "開設 Program A (供英語或日語授課) 以及 Program B (具 JLPT 日語檢定條件)。"
  },
  {
    id: "jp-nufs",
    name_zh: "名古屋外國語大學",
    name_en: "Nagoya University of Foreign Studies",
    country: "日本",
    flag: "🇯🇵",
    region: "亞洲地區",
    official_languages: ["日語"],
    field_restrictions: ["人文社會", "文學院"],
    is_restricted_program: true,
    lifestyle_tags: ["亞洲文化"],
    official_note: "開設 Global Japan Program 以及 Study Abroad at NUFS 兩類外語跨文化計畫。"
  },
  {
    id: "jp-chuo",
    name_zh: "日本中央大學",
    name_en: "Chuo University",
    country: "日本",
    flag: "🇯🇵",
    region: "亞洲地區",
    official_languages: ["日語"],
    field_restrictions: ["商管學院", "理學自然"],
    is_restricted_program: true,
    lifestyle_tags: ["亞洲文化"],
    official_note: "商學院與理工學院無開設全英語授課，需具備日語修課能力。"
  },
  {
    id: "jp-kumamoto",
    name_zh: "熊本大學",
    name_en: "Kumamoto University",
    country: "日本",
    flag: "🇯🇵",
    region: "亞洲地區",
    official_languages: ["日語"],
    field_restrictions: ["生醫理工"],
    is_restricted_program: true,
    lifestyle_tags: ["亞洲文化"],
    official_note: "限生醫理工學院學生申請姐妹校的 School of Medicine 醫學系所。"
  },
  {
    id: "jp-kochi",
    name_zh: "高知工科大學",
    name_en: "Kochi University of Technology",
    country: "日本",
    flag: "🇯🇵",
    region: "亞洲地區",
    official_languages: ["日語", "英語"],
    field_restrictions: ["地球科學", "理學自然"],
    is_restricted_program: true,
    lifestyle_tags: ["亞洲文化"],
    official_note: "限地科院學生申請，具備頂尖地震防災與環境遙測工程實驗室。"
  },
  {
    id: "jp-shizuoka",
    name_zh: "靜岡大學",
    name_en: "Shizuoka University",
    country: "日本",
    flag: "🇯🇵",
    region: "亞洲地區",
    official_languages: ["日語"],
    field_restrictions: ["工程機械"],
    is_restricted_program: true,
    lifestyle_tags: ["亞洲文化"],
    official_note: "限工學院學生申請，專攻精密製造、機械與影像光電工程。"
  },
  {
    id: "jp-kansai",
    name_zh: "關西大學",
    name_en: "Kansai University",
    country: "日本",
    flag: "🇯🇵",
    region: "亞洲地區",
    official_languages: ["日語"],
    field_restrictions: ["全校開放"],
    is_restricted_program: false,
    lifestyle_tags: ["亞洲文化"],
    official_note: "無特定計畫限制，座落大阪精華腹地，關西四大名門學府之一，校園生活極具活力。"
  },
  {
    id: "jp-meiji",
    name_zh: "明治大學",
    name_en: "Meiji University",
    country: "日本",
    flag: "🇯🇵",
    region: "亞洲地區",
    official_languages: ["日語"],
    field_restrictions: ["全校開放"],
    is_restricted_program: false,
    lifestyle_tags: ["亞洲文化"],
    official_note: "無特定限制，東京 MARCH 名校，御茶之水校區交通極便利，政商人脈鼎盛。"
  },

  // ==========================================
  // 亞洲地區 (Asia) - 韓國、新加坡、香港
  // ==========================================
  {
    id: "kr-dankook",
    name_zh: "檀國大學",
    name_en: "Dankook University",
    country: "韓國",
    flag: "🇰🇷",
    region: "亞洲地區",
    official_languages: ["韓語", "英語"],
    field_restrictions: ["資電資訊", "人文社會"],
    is_restricted_program: true,
    lifestyle_tags: ["亞洲文化"],
    official_note: "其國際學系和移動通訊工程系提供豐富全英語授課課程。"
  },
  {
    id: "kr-dongguk",
    name_zh: "東國大學",
    name_en: "Dongguk University",
    country: "韓國",
    flag: "🇰🇷",
    region: "亞洲地區",
    official_languages: ["韓語", "英語"],
    field_restrictions: ["商管學院", "人文社會"],
    is_restricted_program: true,
    lifestyle_tags: ["亞洲文化"],
    official_note: "Business School 與 English department 約有 50% 課程為全英語授課。"
  },
  {
    id: "kr-korea-cau",
    name_zh: "韓國中央大學",
    name_en: "Chung-Ang University",
    country: "韓國",
    flag: "🇰🇷",
    region: "亞洲地區",
    official_languages: ["韓語"],
    field_restrictions: ["全校開放"],
    is_restricted_program: false,
    lifestyle_tags: ["亞洲文化"],
    official_note: "無特定限制，首爾知名頂尖學府，大傳、影視文創與人文專業聲譽卓越。"
  },
  {
    id: "sg-nyp",
    name_zh: "南洋理工商管學院 (NYP)",
    name_en: "Nanyang Polytechnic - School of Business Management",
    country: "新加坡",
    flag: "🇸🇬",
    region: "亞洲地區",
    official_languages: ["英語"],
    field_restrictions: ["商管學院"],
    is_restricted_program: true,
    lifestyle_tags: ["亞洲文化"],
    official_note: "限申請 School of Business Management 商學院課程。"
  },
  {
    id: "sg-ntu-eee",
    name_zh: "南洋理工大學 (NTU)",
    name_en: "Nanyang Technological University",
    country: "新加坡",
    flag: "🇸🇬",
    region: "亞洲地區",
    official_languages: ["英語"],
    field_restrictions: ["資電資訊"],
    is_restricted_program: true,
    lifestyle_tags: ["亞洲文化"],
    official_note: "部分名額限電機系同學申請 College of Engineering 之 School of Electrical and Electronic Engineering (EEE)。"
  },
  {
    id: "hk-cityu",
    name_zh: "香港城市大學",
    name_en: "City University of Hong Kong",
    country: "香港地區",
    flag: "🇭🇰",
    region: "亞洲地區",
    official_languages: ["英語"],
    field_restrictions: ["工學工程", "理學自然", "資電資訊"],
    is_restricted_program: true,
    lifestyle_tags: ["亞洲文化"],
    official_note: "限工、理及資電學院學生申請，全英語國際頂尖大學環境。"
  },
  {
    id: "hk-hkust",
    name_zh: "香港科技大學",
    name_en: "Hong Kong University of Science and Technology",
    country: "香港地區",
    flag: "🇭🇰",
    region: "亞洲地區",
    official_languages: ["英語"],
    field_restrictions: ["理學自然"],
    is_restricted_program: true,
    lifestyle_tags: ["亞洲文化"],
    official_note: "限理學院學生申請，亞洲排名前茅之頂尖理科研究型學府。"
  }
];
