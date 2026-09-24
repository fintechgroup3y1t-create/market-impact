// ข้อมูลตัวอย่าง (สมมติทั้งหมด) สำหรับชิ้นที่ 1
// - ตัวเลขตลาดอยู่ใน metrics เท่านั้น ข้อความอ้างถึงผ่าน placeholder เช่น {{DAL.ret_1d}}
// - ค่าในวงเล็บเหลี่ยม เช่น [x%] คือช่องที่จะเติมจากแหล่งจริงในชิ้นถัดไป (10-K, ข้อมูลย้อนหลัง)
// - ชิ้นที่ 2 จะแทนไฟล์นี้ด้วยข้อมูลจากฐานข้อมูล

import type {
  CalendarItem,
  Company,
  Evidence,
  HomeData,
  Line,
  MarketEvent,
  MarketMetrics,
  StockExposure,
} from "../types";

export const lines: Line[] = [
  { id: "oil", name: "สายน้ำมัน", short: "น้ำมัน", color: "a" },
  { id: "inflation", name: "สายเงินเฟ้อ", short: "เงินเฟ้อ", color: "b" },
  { id: "dollar", name: "สายดอลลาร์", short: "ดอลลาร์", color: "c" },
];

// ตัวเลขสมมติ แทนค่าที่ backend (Python) จะคำนวณในชิ้นที่ 2
const pct = (value: number) => ({ value, unit: "pct" as const });
export const metrics: MarketMetrics = {
  WTI: { ret_1d: pct(4.2), close: { value: 84.3, unit: "usd" } },
  SPX: { ret_1d: pct(-0.8) },
  GOLD: { ret_1d: pct(1.1) },
  US10Y: { chg_bps: { value: 6, unit: "bps" } },
  AIRLINES: { ret_1d: pct(-3.6) },
  ENERGY: { ret_1d: pct(2.4) },
  DAL: { ret_1d: pct(-3.9), abn_ret_1d: pct(-3.1), beta_oil_2y: { value: -0.42, unit: "number" } },
  UAL: { ret_1d: pct(-4.4) },
  XOM: { ret_1d: pct(2.6), abn_ret_1d: pct(3.4), beta_oil_2y: { value: 0.61, unit: "number" } },
  CVX: { ret_1d: pct(2.1) },
  NVDA: { ret_1d: pct(-1.2) },
  NEM: { ret_1d: pct(2.3) },
  AAPL: { ret_1d: pct(-0.5) },
  XYZW: { ret_1d: pct(0.7) },
};

const edgar10k = (ticker: string) =>
  `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${ticker}&type=10-K`;

export const evidence: Evidence[] = [
  {
    id: "ev-news-oil",
    sourceName: "[สำนักข่าว]",
    kind: "ข่าว",
    note: "หลักฐานโดยตรง",
    url: null,
    linkLabel: "อ่านต้นฉบับ",
    publishedAt: "2026-09-24T19:40:00+07:00",
    retrievedAt: "2026-09-24T19:55:00+07:00",
  },
  {
    id: "ev-eia-wpsr",
    sourceName: "EIA",
    kind: "ข้อมูลทางการ",
    note: "หลักฐานสนับสนุน รายงานสต็อกน้ำมันรายสัปดาห์",
    url: "https://www.eia.gov/petroleum/supply/weekly/",
    linkLabel: "ดูข้อมูล",
    publishedAt: "2026-09-23T21:30:00+07:00",
    retrievedAt: "2026-09-23T22:00:00+07:00",
  },
  {
    id: "ev-dal-10k",
    sourceName: "SEC 10-K ของ Delta Air Lines",
    kind: "เอกสารบริษัท",
    note: "สัดส่วนต้นทุน",
    url: edgar10k("DAL"),
    linkLabel: "ดูเอกสาร",
    publishedAt: null,
    retrievedAt: "2026-09-01T09:00:00+07:00",
  },
  {
    id: "ev-xom-10k",
    sourceName: "SEC 10-K ของ ExxonMobil",
    kind: "เอกสารบริษัท",
    note: "สัดส่วนกำไรตามธุรกิจ",
    url: edgar10k("XOM"),
    linkLabel: "ดูเอกสาร",
    publishedAt: null,
    retrievedAt: "2026-09-01T09:00:00+07:00",
  },
  {
    id: "ev-market",
    sourceName: "[ผู้ให้บริการข้อมูลตลาด]",
    kind: "ข้อมูลตลาด",
    note: "ราคาหุ้นและดัชนี",
    url: null,
    linkLabel: "ดูข้อมูล",
    publishedAt: "2026-09-24T21:00:00+07:00",
    retrievedAt: "2026-09-24T21:05:00+07:00",
  },
];

export const events: MarketEvent[] = [
  {
    slug: "oil-supply",
    lineId: "oil",
    title: "ราคาน้ำมันพุ่ง จากความกังวลเรื่องอุปทาน",
    updatedAt: "2026-09-24T21:00:00+07:00",
    reviewStatus: "approved",
    explanationSource: { by: "team" },
    quick: {
      what: "ราคาน้ำมันขึ้น เพราะตลาดกังวลว่าน้ำมันจะมีไม่พอ",
      who: "บริษัทน้ำมันได้ประโยชน์ สายการบินมีต้นทุนเพิ่ม ส่วนธุรกิจการผลิตได้รับผลทั้งสองทาง",
      tickers: ["XOM", "CVX", "DAL", "UAL"],
    },
    understand: [
      {
        q: "เกิดอะไรขึ้น?",
        a: "ราคาน้ำมันดิบปรับขึ้นแรงในวันนี้ หลังมีข่าวว่าอุปทานน้ำมันจากบางแหล่งอาจหายไปจากตลาด",
        glossary: {
          term: "อุปทาน",
          def: "อุปทาน (Supply) คือปริมาณสินค้าที่มีขายในตลาด ถ้าของน้อยลงแต่คนยังต้องการเท่าเดิม ราคามักสูงขึ้น",
        },
      },
      {
        q: "ทำไมถึงเกิดขึ้น?",
        a: "[สาเหตุจากข่าว เช่น ความไม่สงบในพื้นที่ผลิต หรือการประกาศลดกำลังผลิต] ทำให้ตลาดคาดว่าน้ำมันจะเข้าสู่ตลาดน้อยลง",
      },
      {
        q: "ทำไมตลาดถึงสนใจ?",
        a: "น้ำมันเป็นต้นทุนของแทบทุกอย่าง ตั้งแต่ค่าขนส่งไปจนถึงค่าไฟ ถ้าแพงนาน อาจดันเงินเฟ้อและกระทบกำไรของหลายธุรกิจ",
      },
      {
        q: "กระทบใครบ้าง?",
        a: "ผู้ผลิตน้ำมันได้ประโยชน์จากราคาขายที่สูงขึ้น ส่วนสายการบินและธุรกิจขนส่งมีต้นทุนเพิ่มขึ้น ดูเส้นทางแต่ละสายด้านล่าง",
      },
    ],
    claims: [
      {
        kind: "fact",
        text: "ราคาน้ำมันดิบ WTI ปิดที่ {{WTI.close}} ดอลลาร์ต่อบาร์เรล เพิ่มขึ้น {{WTI.ret_1d|abs}}",
        note: "ข้อมูลตลาดจาก [ผู้ให้บริการ], คำนวณโดยระบบ",
        evidenceIds: ["ev-market"],
      },
      {
        kind: "analysis",
        text: "ถ้าราคาน้ำมันอยู่ในระดับสูงต่อเนื่อง ต้นทุนเชื้อเพลิงของสายการบินอาจเพิ่มขึ้นในไตรมาสถัดไป",
        note: "เป็นการตีความจากข้อมูล ไม่ใช่ข้อเท็จจริง",
        evidenceIds: ["ev-dal-10k"],
      },
      {
        kind: "uncertainty",
        text: "สายการบินบางแห่งซื้อน้ำมันล่วงหน้าไว้แล้ว (hedge) อาจขึ้นค่าตั๋วเพื่อส่งต่อต้นทุน และถ้าความกังวลคลี่คลาย ราคาน้ำมันอาจกลับลงเร็ว",
        evidenceIds: [],
      },
    ],
    deep: {
      timeline: [
        { when: "[วันที่]", text: "มีรายงานครั้งแรกเรื่อง [เหตุการณ์]" },
        { when: "[วันที่]", text: "[หน่วยงาน] ยืนยันผลกระทบต่อการผลิต" },
        { when: "วันนี้", text: "ราคาน้ำมันขึ้น {{WTI.ret_1d|abs}} หุ้นพลังงานบวก หุ้นสายการบินลบ" },
      ],
      history: {
        text: "ช่วงที่น้ำมันขึ้นเกิน [x%] ภายใน 1 สัปดาห์ หุ้นกลุ่มสายการบินให้ผลตอบแทนเฉลี่ย [x.x%] เทียบกับตลาด ([n] ครั้ง ตั้งแต่ปี [ปี])",
        note: "คำนวณโดยระบบจากข้อมูลราคาย้อนหลัง อดีตไม่ได้รับประกันอนาคต",
      },
      watch:
        "รายงานสต็อกน้ำมันรายสัปดาห์ของ EIA, ท่าทีของกลุ่มผู้ผลิตน้ำมันรายใหญ่, และสิ่งที่สายการบินพูดถึงต้นทุนเชื้อเพลิงในการประกาศงบรอบหน้า",
    },
    faq: [
      {
        q: "น้ำมันแพงขึ้น แล้วค่าตั๋วเครื่องบินจะแพงขึ้นไหม?",
        a: "เป็นไปได้ แต่ไม่แน่นอน สายการบินบางแห่งส่งต่อต้นทุนผ่านราคาตั๋วหรือค่าธรรมเนียมเชื้อเพลิง แต่ถ้าการแข่งขันสูง อาจเลือกรับต้นทุนไว้เองบางส่วน",
        evidenceNote: "อ้างอิง SEC 10-K ของ Delta Air Lines",
      },
      {
        q: "ทำไมหุ้นพลังงานถึงได้ประโยชน์?",
        a: "บริษัทอย่าง XOM และ CVX มีรายได้หลักจากการขายน้ำมันและก๊าซ เมื่อราคาขายสูงขึ้นแต่ต้นทุนการขุดเจาะไม่ได้เพิ่มตาม กำไรต่อบาร์เรลจึงมักดีขึ้น",
        evidenceNote: "อ้างอิง SEC 10-K ของ ExxonMobil และ Chevron",
      },
      {
        q: "ควรซื้อหุ้นพลังงานตอนนี้ไหม?",
        a: "เราไม่ให้คำแนะนำซื้อขาย เพราะการตัดสินใจขึ้นกับเป้าหมายและความเสี่ยงของแต่ละคน สิ่งที่ช่วยได้คือดูหลักฐานของหุ้นแต่ละตัว และหัวข้อสิ่งที่อาจทำให้ต่างไปด้านบน",
        evidenceNote: "",
        link: { href: "/event/oil-supply/stock/DAL", label: "ดูหลักฐานของ DAL" },
      },
    ],
    chains: [
      {
        id: "to-airlines",
        label: "ไปสายการบิน",
        ticker: "DAL",
        exposure: "neg",
        steps: [
          { layer: "เหตุการณ์", name: "ราคาน้ำมันดิบปรับขึ้น", desc: "ราคา WTI เพิ่มขึ้น {{WTI.ret_1d|abs}} ในวันนี้", confidence: "ข้อเท็จจริงจากข้อมูลตลาด", strength: "solid" },
          { layer: "เศรษฐกิจ", name: "ต้นทุนพลังงานสูงขึ้น", desc: "น้ำมันดิบถูกกลั่นเป็นเชื้อเพลิงเครื่องบินและดีเซล ราคาจึงมักขยับตามกัน", confidence: "ความมั่นใจ สูง", strength: "solid" },
          { layer: "อุตสาหกรรม", name: "สายการบิน", desc: "ค่าเชื้อเพลิงเป็นหนึ่งในต้นทุนก้อนใหญ่ที่สุดของสายการบิน", confidence: "ความมั่นใจ สูง", strength: "dashed" },
          { layer: "บริษัท", name: "Delta Air Lines", desc: "รายงานประจำปี [ปี] ระบุค่าเชื้อเพลิงราว [x%] ของต้นทุนดำเนินงาน แต่บริษัทมีโรงกลั่นของตัวเอง", confidence: "ความมั่นใจ กลาง", strength: "solid" },
        ],
      },
      {
        id: "to-oil-producers",
        label: "ไปบริษัทน้ำมัน",
        ticker: "XOM",
        exposure: "pos",
        steps: [
          { layer: "เหตุการณ์", name: "ราคาน้ำมันดิบปรับขึ้น", desc: "ราคา WTI เพิ่มขึ้น {{WTI.ret_1d|abs}} ในวันนี้", confidence: "ข้อเท็จจริงจากข้อมูลตลาด", strength: "solid" },
          { layer: "เศรษฐกิจ", name: "ราคาขายน้ำมันสูงขึ้น", desc: "ผู้ผลิตขายน้ำมันแต่ละบาร์เรลได้เงินมากขึ้น", confidence: "ความมั่นใจ สูง", strength: "solid" },
          { layer: "อุตสาหกรรม", name: "ผู้ผลิตน้ำมันและก๊าซ", desc: "รายได้ของกลุ่มนี้ผูกกับราคาขายโดยตรง", confidence: "ความมั่นใจ สูง", strength: "solid" },
          { layer: "บริษัท", name: "ExxonMobil", desc: "รายงานประจำปี [ปี] แสดงว่าธุรกิจต้นน้ำสร้างกำไรราว [x%] ของทั้งบริษัท", confidence: "ความมั่นใจ สูง", strength: "solid" },
        ],
      },
    ],
    impacts: [
      { ticker: "XOM", exposure: "pos", reason: "รายได้หลักจากการขายน้ำมัน" },
      { ticker: "CVX", exposure: "pos", reason: "รายได้หลักจากการขายน้ำมัน" },
      { ticker: "DAL", exposure: "neg", reason: "ค่าเชื้อเพลิงเป็นต้นทุนหลัก" },
      { ticker: "UAL", exposure: "neg", reason: "ค่าเชื้อเพลิงเป็นต้นทุนหลัก" },
    ],
    evidenceIds: ["ev-news-oil", "ev-eia-wpsr", "ev-dal-10k", "ev-xom-10k", "ev-market"],
  },
];

export const exposures: StockExposure[] = [
  {
    eventSlug: "oil-supply",
    ticker: "DAL",
    exposure: "neg",
    confidence: "กลาง",
    summary: "หลักฐาน 3 จาก 4 ชั้นชี้ไปทางเดียวกัน อีกชั้นหนึ่งมีปัจจัยที่อาจช่วยลดผลกระทบ",
    layers: [
      {
        title: "กลไกทางธุรกิจ",
        signal: "support",
        text: "น้ำมันแพง ทำให้เชื้อเพลิงเครื่องบินแพง ต้นทุนต่อเที่ยวบินจึงสูงขึ้น",
        note: "กฎที่ทีมงานตรวจสอบแล้ว",
      },
      {
        title: "จากงบการเงินของบริษัท",
        signal: "support",
        kv: [
          { k: "สัดส่วนค่าเชื้อเพลิง", v: "[x%] ของต้นทุน" },
          { k: "ตลาดหลัก", v: "[ภูมิภาค]" },
        ],
        note: "",
        link: { href: "/event/oil-supply#sources", label: "SEC 10-K ปี [ปี], ดูหน้าที่อ้างอิง" },
      },
      {
        title: "ปฏิกิริยาในอดีต",
        signal: "support",
        kv: [{ k: "Beta ต่อราคาน้ำมัน (2 ปี)", v: "{{DAL.beta_oil_2y}}" }],
        glossary: {
          term: "Beta",
          def: "บอกว่าในอดีตหุ้นตัวนี้ขยับตามปัจจัยนั้นมากน้อยแค่ไหน ค่าติดลบแปลว่ามักขยับสวนทาง",
        },
        note: "คำนวณโดยระบบ ไม่ใช่ AI",
      },
      {
        title: "ปัจจัยที่อาจช่วยลดผลกระทบ",
        signal: "offset",
        text: "บริษัทเปิดเผยว่ามีโรงกลั่นของตัวเอง ซึ่งอาจชดเชยต้นทุนบางส่วน และอาจส่งต่อต้นทุนผ่านราคาตั๋ว",
        note: "อ้างอิง SEC 10-K, ทีมงานตรวจแล้ว",
      },
    ],
    today: [
      { label: "DAL", value: "{{DAL.ret_1d}}" },
      { label: "กลุ่มสายการบิน", value: "{{AIRLINES.ret_1d}}" },
      { label: "S&P 500", value: "{{SPX.ret_1d}}" },
      { label: "ต่างจากตลาด", value: "{{DAL.abn_ret_1d}}", emphasis: true },
    ],
  },
  {
    eventSlug: "oil-supply",
    ticker: "XOM",
    exposure: "pos",
    confidence: "สูง",
    summary: "หลักฐาน 3 จาก 4 ชั้นชี้ไปทางเดียวกัน อีกชั้นหนึ่งมีปัจจัยที่อาจทำให้ผลน้อยกว่าที่คิด",
    layers: [
      {
        title: "กลไกทางธุรกิจ",
        signal: "support",
        text: "น้ำมันแพง ทำให้ผู้ผลิตขายน้ำมันแต่ละบาร์เรลได้เงินมากขึ้น",
        note: "กฎที่ทีมงานตรวจสอบแล้ว",
      },
      {
        title: "จากงบการเงินของบริษัท",
        signal: "support",
        kv: [
          { k: "กำไรจากธุรกิจต้นน้ำ", v: "[x%] ของกำไรรวม" },
          { k: "แหล่งผลิตหลัก", v: "[ภูมิภาค]" },
        ],
        note: "",
        link: { href: "/event/oil-supply#sources", label: "SEC 10-K ปี [ปี], ดูหน้าที่อ้างอิง" },
      },
      {
        title: "ปฏิกิริยาในอดีต",
        signal: "support",
        kv: [{ k: "Beta ต่อราคาน้ำมัน (2 ปี)", v: "{{XOM.beta_oil_2y}}" }],
        glossary: {
          term: "Beta",
          def: "บอกว่าในอดีตหุ้นตัวนี้ขยับตามปัจจัยนั้นมากน้อยแค่ไหน ค่าบวกแปลว่ามักขยับทางเดียวกัน",
        },
        note: "คำนวณโดยระบบ ไม่ใช่ AI",
      },
      {
        title: "ปัจจัยที่อาจทำให้ผลน้อยกว่าที่คิด",
        signal: "offset",
        text: "บริษัทมีธุรกิจโรงกลั่นและเคมีภัณฑ์ที่ใช้น้ำมันเป็นวัตถุดิบ ต้นทุนส่วนนั้นจึงสูงขึ้นด้วย",
        note: "อ้างอิง SEC 10-K, ทีมงานตรวจแล้ว",
      },
    ],
    today: [
      { label: "XOM", value: "{{XOM.ret_1d}}" },
      { label: "กลุ่มพลังงาน", value: "{{ENERGY.ret_1d}}" },
      { label: "S&P 500", value: "{{SPX.ret_1d}}" },
      { label: "ต่างจากตลาด", value: "{{XOM.abn_ret_1d}}", emphasis: true },
    ],
  },
];

export const companies: Company[] = [
  { ticker: "DAL", name: "Delta Air Lines", sector: "กลุ่มสายการบิน", covered: true, sensitivities: ["ราคาน้ำมัน", "ความต้องการเดินทาง", "ดอกเบี้ย"] },
  { ticker: "UAL", name: "United Airlines", sector: "กลุ่มสายการบิน", covered: true, sensitivities: ["ราคาน้ำมัน", "ความต้องการเดินทาง"] },
  { ticker: "XOM", name: "ExxonMobil", sector: "กลุ่มพลังงาน", covered: true, sensitivities: ["ราคาน้ำมัน", "ราคาก๊าซธรรมชาติ"] },
  { ticker: "CVX", name: "Chevron", sector: "กลุ่มพลังงาน", covered: true, sensitivities: ["ราคาน้ำมัน", "ราคาก๊าซธรรมชาติ"] },
  { ticker: "NVDA", name: "NVIDIA", sector: "กลุ่มเซมิคอนดักเตอร์", covered: true, sensitivities: ["ดอกเบี้ย", "การลงทุนด้าน AI"] },
  { ticker: "NEM", name: "Newmont", sector: "กลุ่มเหมืองทอง", covered: true, sensitivities: ["ราคาทองคำ", "ค่าเงินดอลลาร์"] },
  { ticker: "AAPL", name: "Apple", sector: "กลุ่มเทคโนโลยี", covered: true, sensitivities: ["ความต้องการของผู้บริโภค", "ค่าเงินดอลลาร์"] },
  { ticker: "XYZW", name: "[บริษัทที่ยังไม่ครอบคลุม]", sector: "", covered: false, sensitivities: [] },
];

/** เรื่องอื่นที่เกี่ยวกับหุ้น (นอกจาก event หลัก) ใช้ในหน้าค้นหุ้น */
export const relatedPlaceholders: Record<string, { title: string; sub: string; exposure: "pos" | "neg" | "mix"; lineId?: string }[]> = {
  DAL: [
    { title: "[เหตุการณ์ด้านการเดินทาง]", sub: "[วันที่], ความต้องการเดินทาง", exposure: "pos" },
    { title: "[เหตุการณ์ด้านดอกเบี้ย]", sub: "[วันที่], ต้นทุนการกู้ยืม", exposure: "mix", lineId: "inflation" },
  ],
};

export const home: HomeData = {
  asOf: "2026-09-24T21:00:00+07:00",
  mood: "ตลาดวันนี้กังวลเรื่องน้ำมันแพง",
  pulse: [
    { label: "น้ำมัน WTI", metric: "WTI.ret_1d" },
    { label: "S&P 500", metric: "SPX.ret_1d" },
    { label: "ทองคำ", metric: "GOLD.ret_1d" },
    { label: "บอนด์ 10 ปี", metric: "US10Y.chg_bps" },
  ],
  signs: [
    {
      lineId: "oil",
      title: "ราคาน้ำมันพุ่ง จากความกังวลเรื่องอุปทาน",
      body: "ตลาดกังวลว่าน้ำมันที่ส่งเข้าสู่ตลาดโลกอาจลดลง ราคาจึงขึ้น ส่งผลทั้งกับบริษัทที่ขายน้ำมันและธุรกิจที่ใช้น้ำมันเป็นต้นทุน",
      effects: [
        { exposure: "pos", text: "พลังงาน ขายน้ำมันได้ราคาดีขึ้น" },
        { exposure: "neg", text: "สายการบิน ค่าเชื้อเพลิงเป็นต้นทุนก้อนใหญ่" },
      ],
      cta: { label: "อ่านเรื่องนี้ใน 1 นาที", href: "/event/oil-supply" },
      meta: "5 แหล่งอ้างอิง ตรวจโดยทีมงานแล้ว",
    },
    {
      lineId: "inflation",
      title: "ตลาดรอตัวเลขเงินเฟ้อสหรัฐฯ คืนนี้",
      body: "ถ้าเงินเฟ้อสูงกว่าเดิม ตลาดมักคาดว่าดอกเบี้ยจะอยู่สูงนานขึ้น ซึ่งกดดันมูลค่าหุ้นเทคที่คาดหวังกำไรในอนาคต ถ้าต่ำกว่าเดิม ผลมักกลับด้าน",
      effects: [{ exposure: "mix", text: "หุ้นเทค ขึ้นกับว่าตัวเลขออกมาทางไหน" }],
      cta: { label: "ดูในปฏิทินเศรษฐกิจ", href: "/calendar" },
      meta: "เหตุการณ์ที่กำลังจะเกิด",
    },
    {
      lineId: "dollar",
      title: "ดอลลาร์อ่อนค่า หนุนราคาสินค้าโภคภัณฑ์",
      body: "ทองคำและสินค้าโภคภัณฑ์ซื้อขายเป็นดอลลาร์ เมื่อดอลลาร์อ่อน คนที่ถือสกุลเงินอื่นซื้อได้ถูกลง ความต้องการจึงมักเพิ่มขึ้น",
      effects: [{ exposure: "pos", text: "เหมืองทอง ขายทองได้ราคาดีขึ้น" }],
      cta: null,
      meta: "หน้ารายละเอียดของเรื่องนี้ยังไม่มีในตัวอย่าง",
    },
  ],
  quiz: {
    question: "น้ำมันแพงขึ้น ธุรกิจไหนมักได้ผลบวก?",
    options: [
      { text: "สายการบิน", correct: false },
      { text: "บริษัทผลิตน้ำมัน", correct: true },
      { text: "บริษัทขนส่งสินค้า", correct: false },
    ],
    explanation:
      "บริษัทผลิตน้ำมันขายน้ำมันได้ราคาดีขึ้น ส่วนสายการบินและบริษัทขนส่งใช้น้ำมันเป็นต้นทุน จึงมักได้ผลลบ ดูเส้นสีม่วงบนแผนที่ด้านบนประกอบได้",
    evidenceNote: "อ้างอิง SEC 10-K ของ ExxonMobil และ Delta Air Lines",
  },
  others: [
    { title: "ตัวเลขเงินเฟ้อสหรัฐฯ ประกาศคืนนี้", sub: "ดูในปฏิทินว่าตลาดจับตาอะไร", lineId: "inflation", href: "/calendar" },
    { title: "บริษัทชิปรายใหญ่เตรียมประกาศงบไตรมาส", sub: "ผลประกอบการ, [วันที่]" },
    { title: "EIA ประกาศสต็อกน้ำมันรายสัปดาห์แล้ว", sub: "เกี่ยวข้องกับสายน้ำมันวันนี้", lineId: "oil", href: "/calendar" },
  ],
};

export const calendar: CalendarItem[] = [
  {
    group: "วันนี้",
    when: "[เวลา]",
    importance: "สำคัญมาก",
    name: "เงินเฟ้อสหรัฐฯ (CPI)",
    lineId: "inflation",
    values: [{ label: "ครั้งก่อน", value: "{{CPI.previous|abs}}" }],
    explainer: {
      q: "ถ้าตัวเลขสูงหรือต่ำ มักส่งผลอย่างไร",
      a: "ถ้าเงินเฟ้อสูงขึ้น ตลาดมักมองว่าเฟดอาจคงดอกเบี้ยสูงไว้นานขึ้น ผลตอบแทนพันธบัตรมักปรับขึ้น และหุ้นกลุ่มเติบโตอาจถูกกดดันด้านมูลค่า ถ้าต่ำลง กลไกมักกลับด้าน",
      source: "กลไกที่ตลาดมักพูดถึง ไม่ใช่การทำนาย ที่มา BLS",
    },
  },
  {
    group: "วันนี้",
    when: "[เวลา]",
    importance: "ประกาศแล้ว",
    status: "released",
    name: "สต็อกน้ำมันดิบสหรัฐฯ รายสัปดาห์",
    lineId: "oil",
    values: [
      { label: "ครั้งก่อน", value: "{{EIA_CRUDE.previous|abs}} ล้านบาร์เรล" },
      { label: "ล่าสุด", value: "{{EIA_CRUDE.latest|abs}} ล้านบาร์เรล" },
    ],
    explainer: {
      q: "ตัวเลขนี้บอกอะไร",
      a: "ถ้าสต็อกลดลงมากกว่าปกติ แปลว่าน้ำมันถูกใช้มากหรือผลิตน้อย ราคาน้ำมันมักได้แรงหนุน ถ้าสต็อกเพิ่มขึ้น ราคามักถูกกดดัน",
      source: "ที่มา EIA",
      link: { href: "/event/oil-supply", label: "ดูเรื่องน้ำมันวันนี้" },
    },
  },
  {
    group: "สัปดาห์นี้",
    when: "[วัน]",
    importance: "สำคัญมาก",
    name: "ประชุมกำหนดดอกเบี้ย (FOMC)",
    values: [{ label: "ดอกเบี้ยปัจจุบัน", value: "{{FEDFUNDS.latest|abs}}" }],
    explainer: {
      q: "ถ้าลดหรือคงดอกเบี้ย มักส่งผลอย่างไร",
      a: "ถ้าเฟดลดดอกเบี้ย ต้นทุนการกู้ยืมมักลดลง ซึ่งมักเป็นผลดีต่อธุรกิจที่ใช้เงินกู้มาก ถ้าคงหรือขึ้น ผลมักกลับด้าน ตลาดยังฟังด้วยว่าเฟดพูดถึงทิศทางข้างหน้าอย่างไร",
      source: "ที่มา Federal Reserve",
    },
  },
  {
    group: "สัปดาห์นี้",
    when: "[วัน]",
    importance: "สำคัญมาก",
    name: "การจ้างงานนอกภาคเกษตร",
    values: [{ label: "ครั้งก่อน", value: "{{NFP.previous}} พันตำแหน่ง" }],
    explainer: {
      q: "ถ้าตัวเลขแข็งแรงหรืออ่อนแอ มักส่งผลอย่างไร",
      a: "ถ้าการจ้างงานแข็งแรง แปลว่าเศรษฐกิจยังดี แต่อาจทำให้เฟดไม่รีบลดดอกเบี้ย ถ้าอ่อนแอ ตลาดอาจกังวลเรื่องเศรษฐกิจชะลอ แต่ก็อาจคาดว่าดอกเบี้ยจะลดเร็วขึ้น",
      source: "ที่มา BLS",
    },
  },
];
