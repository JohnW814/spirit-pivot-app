import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Compass,
  Zap,
  Brain,
  Heart,
  X,
  Activity,
  Flame,
  CloudRain,
  Wind,
  Mountain,
  Lock,
  Infinity,
  RefreshCw,
  MapPin,
  Sparkles,
  AlertTriangle,
  Star,
  Calendar,
  Crown,
  BookOpen,
  LineChart,
  BarChart3,
  Sigma,
  TrendingUp,
  CheckCircle2,
  Info,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

// ============================================================================
// 1. 核心資料庫 (Core Database) - 基於 SP-2025-DOC-001 v3.0 理論架構
// ============================================================================

const HEAVENLY_STEMS = [
  "甲",
  "乙",
  "丙",
  "丁",
  "戊",
  "己",
  "庚",
  "辛",
  "壬",
  "癸",
];
const EARTHLY_BRANCHES = [
  "子",
  "丑",
  "寅",
  "卯",
  "辰",
  "巳",
  "午",
  "未",
  "申",
  "酉",
  "戌",
  "亥",
];

// ★ 數據校正 (Data Rectification): 1966 丙午人 (寅時)
const FULL_NATAL_CHART: any = {
  子: { palace: "疾厄宮", main: ["太陽"], borrow: [], minor: [], status: "陷" },
  丑: {
    palace: "財帛宮",
    main: ["天府"],
    borrow: [],
    minor: ["地空"],
    status: "得",
  },
  寅: {
    palace: "子女宮",
    main: ["天機", "太陰"],
    borrow: [],
    minor: [],
    status: "旺",
  },
  卯: {
    palace: "夫妻宮",
    main: ["紫微", "貪狼"],
    borrow: [],
    minor: ["火星"],
    status: "旺平",
  },
  辰: {
    palace: "兄弟宮",
    main: ["巨門"],
    borrow: [],
    minor: ["陀羅"],
    status: "陷",
  },
  巳: {
    palace: "本命宮",
    main: ["天相"],
    borrow: [],
    minor: ["祿存", "鈴星", "右弼"],
    status: "得",
  },
  午: {
    palace: "父母宮",
    main: ["天梁"],
    borrow: [],
    minor: ["擎羊", "文曲"],
    status: "廟",
  },
  未: {
    palace: "福德宮",
    main: ["廉貞", "七殺"],
    borrow: [],
    minor: [],
    status: "廟",
  },
  申: {
    palace: "田宅宮",
    main: [],
    borrow: ["天機", "太陰"],
    minor: ["文昌", "天馬"],
    status: "借星",
  },
  酉: {
    palace: "官祿宮",
    main: [],
    borrow: ["紫微", "貪狼"],
    minor: ["左輔", "天鉞", "地劫"],
    status: "借星",
  },
  戌: { palace: "交友宮", main: ["天同"], borrow: [], minor: [], status: "平" },
  亥: {
    palace: "遷移宮",
    main: ["武曲", "破軍"],
    borrow: [],
    minor: ["天魁"],
    status: "平",
  },
};

const SI_HUA_TABLE: any = {
  甲: { lu: "廉貞", quan: "破軍", ke: "武曲", ji: "太陽" },
  乙: { lu: "天機", quan: "天梁", ke: "紫微", ji: "太陰" },
  丙: { lu: "天同", quan: "天機", ke: "文昌", ji: "廉貞" },
  丁: { lu: "太陰", quan: "天同", ke: "天機", ji: "巨門" },
  戊: { lu: "貪狼", quan: "太陰", ke: "右弼", ji: "天機" },
  己: { lu: "武曲", quan: "貪狼", ke: "天梁", ji: "文曲" },
  庚: { lu: "太陽", quan: "武曲", ke: "太陰", ji: "天同" },
  辛: { lu: "巨門", quan: "太陽", ke: "文曲", ji: "文昌" },
  壬: { lu: "天梁", quan: "紫微", ke: "左輔", ji: "武曲" },
  癸: { lu: "破軍", quan: "巨門", ke: "太陰", ji: "貪狼" },
};

const STAR_BASE_VALUES: any = {
  紫微: 10,
  天府: 9,
  太陽: 8,
  太陰: 8,
  武曲: 7,
  七殺: 7,
  破軍: 6,
  貪狼: 6,
  天相: 6,
  天梁: 6,
  天同: 5,
  天機: 5,
  廉貞: 5,
  巨門: 4,
  祿存: 5,
  左輔: 4,
  右弼: 4,
  天魁: 4,
  天鉞: 4,
  文昌: 3,
  文曲: 3,
  天馬: 2,
  擎羊: -5,
  陀羅: -5,
  火星: -4,
  鈴星: -4,
  地空: -4,
  地劫: -4,
};

const MALIGNANT_STARS = ["擎羊", "陀羅", "火星", "鈴星", "地空", "地劫"];

const BECM_TABLE: any = {
  廟: [1.5, 0.5],
  旺: [1.3, 0.8],
  得: [1.1, 1.0],
  利: [1.0, 1.0],
  平: [0.7, 1.2],
  陷: [0.3, 1.6],
  借星: [0.6, 0.9],
};

const SIHUA_DELTA = {
  lu: 15,
  quan: 10,
  ke: 8,
  ji: -15,
};

const STAR_DESCRIPTIONS: any = {
  紫微: "尊貴領袖，包容統御。",
  天機: "機智規劃，靈動多變。",
  太陽: "博愛付出，發散光熱。",
  武曲: "剛毅執行，務實理財。",
  天同: "赤子之心，協調享樂。",
  廉貞: "複雜能量，專注轉化。",
  天府: "穩健庫藏，寬厚守成。",
  太陰: "溫柔內斂，直覺敏銳。",
  貪狼: "多才多藝，長袖善舞。",
  巨門: "心思細膩，觀察入微。",
  天相: "居中協調，平衡輔佐。",
  天梁: "蔭庇眾生，公正解厄。",
  七殺: "獨當一面，勇於突破。",
  破軍: "除舊佈新，先破後成。",
  祿存: "天祿解厄，增添穩定。",
  左輔: "平輩助力，團隊合作。",
  右弼: "異性助力，機智圓融。",
  天魁: "陽貴提攜，機遇良好。",
  天鉞: "陰貴暗助，逢凶化吉。",
  文昌: "科名學術，條理分明。",
  文曲: "才藝口才，靈感豐富。",
  天馬: "奔波變動，越動越發。",
  擎羊: "衝擊決斷，宜技藝開創。",
  陀羅: "磨練心性，需耐心解結。",
  火星: "爆發力強，宜速戰速決。",
  鈴星: "深沉謀算，宜冷靜策劃。",
  地空: "跳脫框架，重靈性悟性。",
  地劫: "反向操作，重精神價值。",
};

const WISDOM_LIBRARY: any = {
  anger: [
    {
      q: "憤怒是封閉系統的劇烈熵增，正無效耗散您的生命能量。",
      s: "《心經》：無無明，亦無無明盡。火是虛幻的，因我執是虛幻的。",
      a: "觀想打開心靈窗戶，讓熱氣流向虛空。",
    },
    {
      q: "根據牛頓第三定律，攻擊別人，震傷的一定是自己。",
      s: "一切有為法，如夢幻泡影。別對著影子揮拳。",
      a: "立刻停止施力，深呼吸感受反作用力消失。",
    },
  ],
  greed: [
    {
      q: "貪婪如黑洞，質量越大引力越強，光都逃不掉。",
      s: "色不異空。物質本質99%是空隙。",
      a: "立刻做件給予的事，逆轉引力。",
    },
    {
      q: "測不準原理：越想抓緊結果，過程越混亂。",
      s: "以無所得故。不求，所以萬有。",
      a: "攤開手掌，告訴宇宙：我信任安排。",
    },
  ],
  ignorance: [
    {
      q: "全息宇宙：碎片含整體資訊。小處見大道。",
      s: "一花一世界。別被表象迷惑。",
      a: "從喝水看見雨水、太陽的因緣。",
    },
    {
      q: "世界是高維模擬。別把遊戲得失當真。",
      s: "如夢幻泡影。覺察玩家，不認同角色。",
      a: "問：「誰在經歷？」抽離當觀眾。",
    },
  ],
  pride: [
    {
      q: "相對論無絕對參考系。在別人眼中您是背景。",
      s: "無我相。無固定主宰。",
      a: "試著從對方視角看這件事。",
    },
    {
      q: "傲慢成孤立系統，熵值增加。連結引負熵。",
      s: "自性真空。放空智慧才進來。",
      a: "主動請教他人，真誠聆聽。",
    },
  ],
  doubt: [
    {
      q: "薛丁格的貓：未來疊加態。恐懼把貓殺死。",
      s: "心無掛礙。恐懼來自妄想。",
      a: "對未來開放：我有能力應對。",
    },
    {
      q: "路徑積分：路徑無限。別被死路嚇住。",
      s: "一切唯心造。心寬路寬。",
      a: "列出三種瘋狂解決方案。",
    },
  ],
};

// ============================================================================
// 2. 演算法邏輯 (Algorithmic Logic)
// ============================================================================

const getPrecisionGanZhi = (dateObj: any) => {
  const anchorDate = new Date("2025-12-20T12:00:00");
  const targetDate = new Date(dateObj);
  targetDate.setHours(12, 0, 0, 0);

  const dayDiff = Math.round(
    (targetDate.getTime() - anchorDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const baseStemIndex = 9;
  const baseBranchIndex = 11;

  let stemIndex = (baseStemIndex + dayDiff) % 10;
  if (stemIndex < 0) stemIndex += 10;

  let branchIndex = (baseBranchIndex + dayDiff) % 12;
  if (branchIndex < 0) branchIndex += 12;

  return {
    stem: HEAVENLY_STEMS[stemIndex],
    branch: EARTHLY_BRANCHES[branchIndex],
    branchKey: EARTHLY_BRANCHES[branchIndex],
  };
};

const calculateEnergyScore = (chartData: any, siHua: any) => {
  const { main, borrow, minor, status } = chartData;
  const stars = main.length > 0 ? main : borrow;
  const allStars = [...stars, ...minor];

  let totalScore = 0;
  const [goodCoeff, badCoeff] = BECM_TABLE[status] || [1.0, 1.0];

  allStars.forEach((star: any) => {
    let vBase = STAR_BASE_VALUES[star] || 0;
    const isMalignant = MALIGNANT_STARS.includes(star);

    if (isMalignant) {
      totalScore += vBase * badCoeff;
    } else {
      totalScore += vBase * goodCoeff;
    }
  });

  if (allStars.includes(siHua.lu)) totalScore += SIHUA_DELTA.lu;
  if (allStars.includes(siHua.quan)) totalScore += SIHUA_DELTA.quan;
  if (allStars.includes(siHua.ke)) totalScore += SIHUA_DELTA.ke;
  if (allStars.includes(siHua.ji)) totalScore += SIHUA_DELTA.ji;

  return Math.round(totalScore);
};

// ★ 新版三色區間邏輯 (UI Helper)
const getChartColor = (score: number) => {
  if (score >= 10) return "#10b981"; // Emerald-500 (順暢/吉)
  if (score >= -5) return "#94a3b8"; // Slate-400 (平穩/中) - 這是新增的灰色區間
  return "#f43f5e"; // Rose-500 (阻滯/凶)
};

const getEnergyLevel = (score: number) => {
  if (score >= 25)
    return {
      label: "極強 (Flow)",
      color: "text-amber-500",
      barColor: "bg-amber-500",
      percent: 100,
    };
  if (score >= 10)
    return {
      label: "順暢 (Smooth)",
      color: "text-emerald-500",
      barColor: "bg-emerald-500",
      percent: 75,
    };
  if (score >= -5)
    return {
      label: "平穩 (Stable)",
      color: "text-slate-400",
      barColor: "bg-slate-400",
      percent: 50,
    };
  if (score >= -20)
    return {
      label: "受阻 (Blocked)",
      color: "text-orange-500",
      barColor: "bg-orange-500",
      percent: 25,
    };
  return {
    label: "修煉 (Retreat)",
    color: "text-rose-500",
    barColor: "bg-rose-500",
    percent: 15,
  };
};

const generateDailyContent = (
  chartData: any,
  siHua: any,
  stem: string,
  score: number
) => {
  const { main, borrow, minor, status } = chartData;
  const calcStars = main.length > 0 ? main : borrow;

  let displayStars = "";
  if (main.length > 0) {
    displayStars = main.join(" · ");
    if (minor.length > 0) displayStars += " · " + minor.join(" · ");
  } else {
    displayStars = `(借)${borrow.join("·")}`;
    if (minor.length > 0) displayStars += " · " + minor.join(" · ");
  }

  const allStarsToCheck = [...calcStars, ...minor];
  const hits = {
    lu: allStarsToCheck.find((s: any) => s === siHua.lu),
    quan: allStarsToCheck.find((s: any) => s === siHua.quan),
    ke: allStarsToCheck.find((s: any) => s === siHua.ke),
    ji: allStarsToCheck.find((s: any) => s === siHua.ji),
  };

  let displaySiHua = [];
  let highlightColor = "text-emerald-400";
  let borderColor = "border-emerald-500/20";
  let bgOverlay = "bg-emerald-500/10";
  let statusBadgeBg = "bg-emerald-900/30";
  let statusBadgeBorder = "border-emerald-500/30";

  if (hits.lu) displaySiHua.push(`${hits.lu}祿`);
  if (hits.quan) displaySiHua.push(`${hits.quan}權`);
  if (hits.ke) displaySiHua.push(`${hits.ke}科`);
  if (hits.ji) displaySiHua.push(`${hits.ji}忌`);

  let statusText = displaySiHua.length > 0 ? displaySiHua.join("  ") : "平穩";

  if (hits.ji) {
    highlightColor = "text-rose-400";
    borderColor = "border-rose-500/20";
    bgOverlay = "bg-rose-500/10";
    statusBadgeBg = "bg-rose-900/30";
    statusBadgeBorder = "border-rose-500/30";
  } else if (hits.lu) {
    highlightColor = "text-amber-400";
    borderColor = "border-amber-500/20";
    bgOverlay = "bg-amber-500/10";
    statusBadgeBg = "bg-amber-900/30";
    statusBadgeBorder = "border-amber-500/30";
  } else if (hits.quan) {
    highlightColor = "text-purple-400";
    borderColor = "border-purple-500/20";
    bgOverlay = "bg-purple-500/10";
    statusBadgeBg = "bg-purple-900/30";
    statusBadgeBorder = "border-purple-500/30";
  } else if (hits.ke) {
    highlightColor = "text-sky-400";
    borderColor = "border-sky-500/20";
    bgOverlay = "bg-sky-500/10";
    statusBadgeBg = "bg-sky-900/30";
    statusBadgeBorder = "border-sky-500/30";
  }

  let actionText = "";

  if (hits.ji) {
    actionText += `⚠️ 【修心轉念】\n今日天干【${stem}】引發【${hits.ji}化忌】。`;
    if (minor.includes(hits.ji))
      actionText +=
        "此變化發生在輔星細節上，需留意文書細節、小人干擾或突發情緒。";
    else actionText += "此為主星化忌，能量波動較大，宜守不宜攻，以退為進。";
  } else if (hits.lu) {
    actionText += `✨ 【乘勢而起】\n今日天干【${stem}】引發【${hits.lu}化祿】。機遇良好，福氣自來，可積極推動計畫。`;
  } else if (hits.quan) {
    actionText += `⚔️ 【積極行動】\n今日天干【${stem}】引發【${hits.quan}化權】。掌握主導，執行力強。`;
  } else if (hits.ke) {
    actionText += `📜 【貴人相助】\n今日天干【${stem}】引發【${hits.ke}化科】。有利名聲、考試或文書契約。`;
  } else {
    actionText += `☯️ 【持盈保泰】\n今日四化未衝擊本宮，能量平穩，依循主星特質行事即可。`;
  }

  if (status === "陷") {
    actionText += `\n\n(註：今日宮位狀態為「陷」。吉星能量微弱，易有心無力；煞星凶性較強，需謹慎低調。)`;
  }

  actionText += `\n\n🔎 【星曜特質】\n`;
  calcStars.forEach((star: any) => {
    if (STAR_DESCRIPTIONS[star]) {
      actionText += `• ${star}：${STAR_DESCRIPTIONS[star]}\n`;
    }
  });
  minor.forEach((star: any) => {
    if (STAR_DESCRIPTIONS[star])
      actionText += `• ${star}：${STAR_DESCRIPTIONS[star]}\n`;
  });

  const energyLevel = getEnergyLevel(score);

  return {
    displayStars,
    statusText,
    highlightColor,
    borderColor,
    bgOverlay,
    actionText,
    statusBadgeBg,
    statusBadgeBorder,
    score,
    energyLevel,
  };
};

const createHistogramData = (scores: any[]) => {
  if (!scores.length) return { bins: [], min: 0, max: 0 };
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min;
  let binSize = Math.ceil(range / 7);
  if (binSize < 5) binSize = 5;

  const startBin = Math.floor(min / binSize) * binSize;
  const endBin = Math.ceil((max + 1) / binSize) * binSize;

  let bins = [];
  for (let i = startBin; i < endBin; i += binSize) {
    bins.push({
      label: `${i}`,
      min: i,
      max: i + binSize,
      count: 0,
    });
  }
  scores.forEach((s) => {
    const bin = bins.find((b) => s >= b.min && s < b.max);
    if (bin) bin.count++;
  });
  return { bins, min, max };
};

const normalPdf = (x: number, mean: number, stdDev: number) => {
  if (stdDev === 0) return 0;
  return (
    (1 / (stdDev * Math.sqrt(2 * Math.PI))) *
    Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2))
  );
};

// ============================================================================
// 3. UI 元件 (Components)
// ============================================================================

const ProfileDisplay = ({ ganZhi }: any) => (
  <div className="mt-1 flex flex-col items-end gap-1 select-none">
    <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-full px-3 py-1.5 shadow-lg relative z-20">
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
      <span className="text-xs font-bold text-slate-300">丙午人 (天相)</span>
    </div>
    <div className="text-[10px] text-slate-500 font-mono tracking-tighter bg-slate-900/30 px-2 py-0.5 rounded border border-slate-800/50">
      {typeof ganZhi === "string" ? ganZhi : ""}
    </div>
  </div>
);

const EnergyBar = ({ score, level }: any) => (
  <div className="flex items-center gap-3 w-full bg-slate-900/50 p-3 rounded-xl border border-slate-800/50 shadow-inner">
    <div className="flex-1">
      <div className="flex justify-between items-end mb-2">
        <span className="text-sm text-slate-400 font-bold flex items-center gap-2">
          <LineChart size={16} className={level.color} /> 生命能量
        </span>
        <span className={`text-lg font-bold font-mono ${level.color}`}>
          {score > 0 ? `+${score}` : score}
        </span>
      </div>
      <div className="relative w-full bg-slate-800 rounded-full h-2 overflow-hidden">
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-600/50 z-10"></div>
        <div
          className={`h-full rounded-full transition-all duration-1000 ${level.barColor}`}
          style={{ width: `${level.percent}%`, opacity: 0.9 }}
        ></div>
      </div>
    </div>
  </div>
);

const ScoreDot = ({
  x,
  y,
  score,
  isCycleStart,
  isToday,
  isActive,
  onClick,
}: any) => {
  // 使用新的三色邏輯
  const color = getChartColor(score);

  return (
    <g onClick={onClick} className="cursor-pointer">
      {isCycleStart && (
        <line
          x1={x}
          y1="0"
          x2={x}
          y2="150"
          stroke="#475569"
          strokeWidth="1"
          strokeDasharray="4 2"
          opacity="0.3"
        />
      )}
      {isToday && (
        <line
          x1={x}
          y1="0"
          x2={x}
          y2="150"
          stroke="#f59e0b"
          strokeWidth="1"
          strokeDasharray="2 2"
          opacity="0.8"
        />
      )}

      <circle
        cx={x}
        cy={y}
        r={isToday ? 5 : 3}
        fill={color}
        stroke={isToday ? "#fbbf24" : "#0f172a"}
        strokeWidth={isToday ? 2 : 2}
        className={isToday ? "animate-pulse" : ""}
      />
      {isActive && (
        <circle
          cx={x}
          cy={y}
          r={10}
          fill="none"
          stroke="white"
          strokeWidth="1"
          opacity="0.5"
          className="animate-ping"
        />
      )}

      <text
        x={x}
        y={y - 10}
        textAnchor="middle"
        fontSize={isToday ? "10" : "8"}
        fill={color}
        fontWeight="bold"
        style={{ pointerEvents: "none" }}
      >
        {score > 0 ? `+${score}` : score}
      </text>
    </g>
  );
};

const StatBox = ({ label, value, color = "text-white" }: any) => (
  <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg flex flex-col items-center">
    <span className="text-[9px] text-slate-500 uppercase">{label}</span>
    <span className={`text-base font-mono font-bold ${color}`}>{value}</span>
  </div>
);

const DistributionChart = ({ data, mean, stdDev }: any) => {
  if (!data || !data.bins) return null;
  const { bins } = data;
  const maxCount = Math.max(...bins.map((b: any) => b.count)) || 1;
  const height = 180;
  const width = 300;
  const paddingX = 20;
  const paddingBottom = 30;
  const paddingTop = 20;
  const barWidth = (width - 2 * paddingX) / bins.length - 4;

  let pathD = "";
  if (bins.length > 0 && stdDev > 0) {
    const points = [];
    const scaleY = maxCount / normalPdf(mean, mean, stdDev);
    const graphHeight = height - paddingBottom - paddingTop;
    for (let x = bins[0].min; x <= bins[bins.length - 1].max; x += 1) {
      const yVal = normalPdf(x, mean, stdDev) * scaleY;
      const xPercent =
        (x - bins[0].min) / (bins[bins.length - 1].max - bins[0].min);
      const svgX = xPercent * (width - 2 * paddingX) + paddingX;
      const svgY = height - paddingBottom - (yVal / maxCount) * graphHeight;
      points.push(`${svgX},${svgY}`);
    }
    pathD = "M" + points.join(" L");
  }

  return (
    <div className="relative flex justify-center py-2 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
      <svg width={width} height={height}>
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line
            key={ratio}
            x1={paddingX}
            y1={
              height -
              paddingBottom -
              ratio * (height - paddingBottom - paddingTop)
            }
            x2={width - paddingX}
            y2={
              height -
              paddingBottom -
              ratio * (height - paddingBottom - paddingTop)
            }
            stroke="#334155"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.3"
          />
        ))}
        {bins.map((b: any, i: number) => {
          const barHeight =
            (b.count / maxCount) * (height - paddingBottom - paddingTop);
          const xPos = paddingX + i * ((width - 2 * paddingX) / bins.length);
          // 使用新的三色邏輯
          const color = getChartColor(b.min);

          return (
            <g key={i}>
              <rect
                x={xPos}
                y={height - paddingBottom - barHeight}
                width={barWidth}
                height={barHeight}
                fill={color}
                opacity="0.8"
                rx="2"
              />
              {b.count > 0 && (
                <text
                  x={xPos + barWidth / 2}
                  y={height - paddingBottom - barHeight - 5}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#cbd5e1"
                  fontWeight="bold"
                >
                  {b.count}
                </text>
              )}
              <text
                x={xPos + barWidth / 2}
                y={height - 10}
                textAnchor="middle"
                fontSize="9"
                fill="#94a3b8"
              >
                {b.label}
              </text>
            </g>
          );
        })}
        <path
          d={pathD}
          fill="none"
          stroke="#60a5fa"
          strokeWidth="2"
          opacity="0.8"
        />
      </svg>
      {/* 簡單的圖例 Legend */}
      <div className="absolute top-2 right-2 flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-[8px] text-slate-400">順暢</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-slate-400"></div>
          <span className="text-[8px] text-slate-400">平穩</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-rose-500"></div>
          <span className="text-[8px] text-slate-400">阻滯</span>
        </div>
      </div>
    </div>
  );
};

const DetailPanel = ({ data, onClose }: any) => {
  if (!data) return null;
  const { dateStr, ganZhi, palace, stars, score, tags } = data;
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-slate-900 border-t border-slate-700 p-6 rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-10">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            {dateStr}{" "}
            <span className="font-mono text-slate-400 text-base">{ganZhi}</span>
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-bold text-indigo-300 bg-indigo-900/30 px-2 py-0.5 rounded border border-indigo-500/20">
              {palace}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded border ${
                score >= 0
                  ? "bg-emerald-900/30 border-emerald-500/30 text-emerald-400"
                  : "bg-rose-900/30 border-rose-500/30 text-rose-400"
              }`}
            >
              能量 {score}
            </span>
          </div>
          <p className="text-sm text-slate-300 mt-3 font-bold leading-relaxed">
            {stars}
          </p>
        </div>
        <button onClick={onClose} className="p-1 -mr-2 -mt-2">
          <X size={24} className="text-slate-500 hover:text-white" />
        </button>
      </div>
      <div className="space-y-2 text-sm pt-2 border-t border-slate-800">
        {tags.length > 0 ? (
          tags.map((tag: any, idx: number) => (
            <div
              key={idx}
              className={`flex items-center gap-2 p-2 rounded border ${
                tag.type === "ji"
                  ? "text-rose-400 bg-rose-900/10 border-rose-900/30"
                  : tag.type === "lu"
                  ? "text-amber-400 bg-amber-900/10 border-amber-900/30"
                  : "text-purple-400 bg-purple-900/10 border-purple-900/30"
              }`}
            >
              {tag.type === "ji" ? (
                <AlertTriangle size={14} />
              ) : (
                <Sparkles size={14} />
              )}
              <span>
                {tag.type === "ji" ? "警示" : "吉兆"}：
                <strong>{tag.star}</strong> 化{tag.label}
              </span>
            </div>
          ))
        ) : (
          <div className="flex items-center gap-2 text-slate-400 bg-slate-800/50 p-2 rounded">
            <Info size={14} /> <span>今日平穩，依循星曜特質行事。</span>
          </div>
        )}
      </div>
    </div>
  );
};

const WisdomCard = ({ type, data, onClose, onRefresh }: any) => {
  const [isFading, setIsFading] = useState(false);

  const handleRefresh = () => {
    setIsFading(true);
    setTimeout(() => {
      onRefresh();
      setIsFading(false);
    }, 300);
  };

  if (!data) return null;

  return (
    <div className="animate-in fade-in zoom-in duration-300 bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] z-[100]">
      <div
        className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl -mr-10 -mt-10 opacity-20 ${
          type === "anger"
            ? "bg-red-500"
            : type === "greed"
            ? "bg-blue-500"
            : type === "ignorance"
            ? "bg-purple-500"
            : type === "pride"
            ? "bg-amber-500"
            : "bg-slate-500"
        }`}
      ></div>
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2 text-slate-200">
            <Zap size={18} className="text-amber-500" />
            <span className="font-bold text-lg">
              當下覺察 ·{" "}
              {type === "anger"
                ? "火 (嗔)"
                : type === "greed"
                ? "水 (貪)"
                : type === "ignorance"
                ? "風 (癡)"
                : type === "pride"
                ? "山 (慢)"
                : "霧 (疑)"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 -mr-2 text-slate-500 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div
          className={`flex-1 overflow-y-auto custom-scrollbar space-y-4 transition-opacity duration-300 ${
            isFading ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="bg-indigo-950/40 p-4 rounded-xl border-l-2 border-indigo-400 shadow-inner">
            <h4 className="text-xs font-bold text-indigo-300 mb-2 flex items-center gap-2">
              <Brain size={14} /> 格物洞見 (Cognitive Reframing)
            </h4>
            <p className="text-sm text-indigo-100 leading-loose tracking-wide text-justify font-serif">
              {data.q}
            </p>
          </div>
          <div className="bg-amber-950/40 p-4 rounded-xl border-l-2 border-amber-500 shadow-inner">
            <h4 className="text-xs font-bold text-amber-500 mb-2 flex items-center gap-2">
              <Heart size={14} /> 般若心語 (Prajna Wisdom)
            </h4>
            <p className="text-sm text-amber-100 leading-loose tracking-wide text-justify font-serif">
              {data.s}
            </p>
          </div>
          <div className="text-center pt-2 pb-2">
            <span className="inline-block px-4 py-2 bg-emerald-900/40 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/30 animate-pulse leading-relaxed tracking-wide">
              指引：{data.a}
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 mt-2 flex justify-center shrink-0">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-all active:scale-95"
          >
            <RefreshCw size={14} /> 換一則醒語
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 6. 主程式 (Main Application)
// ============================================================================

export default function App() {
  const [dailyInfo, setDailyInfo] = useState({
    ganZhi: "",
    palace: "",
    stars: "",
    actionText: "",
    displayStars: "",
    statusText: "",
    highlightColor: "",
    borderColor: "",
    bgOverlay: "",
    statusBadgeBg: "",
    statusBadgeBorder: "",
    score: 0,
    energyLevel: { label: "", color: "", barColor: "", percent: 0 },
  });
  const [todayDate, setTodayDate] = useState({ western: "", lunar: "" });
  const [activeType, setActiveType] = useState<any>(null);
  const [currentWisdom, setCurrentWisdom] = useState<any>(null);
  const [lastWisdomIndex, setLastWisdomIndex] = useState<any>({});
  const [journalNote, setJournalNote] = useState("");

  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [cycleData, setCycleData] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [extremeDays, setExtremeDays] = useState<any>({ top: [], bottom: [] });
  const scrollRef = useRef<any>(null);

  useEffect(() => {
    const now = new Date();
    const western = now.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
    });
    let lunar = "";
    try {
      const lunarDate = new Intl.DateTimeFormat("zh-TW-u-ca-chinese", {
        month: "numeric",
        day: "numeric",
      }).format(now);
      lunar = lunarDate.replace("月", "月 ").replace("日", "");
    } catch (e) {
      lunar = "農曆運算中";
    }
    setTodayDate({ western, lunar });

    const { stem, branch, branchKey } = getPrecisionGanZhi(now);
    const dailyData = FULL_NATAL_CHART[branchKey];
    const dailySiHua = SI_HUA_TABLE[stem];
    const score = calculateEnergyScore(dailyData, dailySiHua);
    const content = generateDailyContent(dailyData, dailySiHua, stem, score);
    const ganZhiStr = `${stem}${branch}日`;

    setDailyInfo({
      ganZhi: ganZhiStr,
      palace: dailyData.palace,
      stars: content.displayStars,
      actionText: content.actionText,
      displayStars: content.displayStars,
      // @ts-ignore
      displaySiHua: content.statusText,
      statusText: content.statusText,
      highlightColor: content.highlightColor,
      borderColor: content.borderColor,
      bgOverlay: content.bgOverlay,
      statusBadgeBg: content.statusBadgeBg,
      statusBadgeBorder: content.statusBadgeBorder,
      score: score,
      energyLevel: getEnergyLevel(score),
    });

    const startDate = new Date(now);
    startDate.setDate(now.getDate() - 3);

    let cData = [];
    const daysToGenerate = 60;

    for (let i = 0; i < daysToGenerate; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      const { stem, branch, branchKey } = getPrecisionGanZhi(currentDate);
      const dData = FULL_NATAL_CHART[branchKey];
      const dSiHua = SI_HUA_TABLE[stem];
      const dScore = calculateEnergyScore(dData, dSiHua);

      const mainStars = dData.main.length > 0 ? dData.main : dData.borrow;
      let starStr = mainStars.join("·");
      if (dData.main.length === 0) starStr = `(借)${starStr}`;
      if (dData.minor.length > 0) starStr += "·" + dData.minor.join("·");

      let tags = [];
      const allStars = [...mainStars, ...dData.minor];
      if (allStars.includes(dSiHua.ji))
        tags.push({ type: "ji", label: "忌", star: dSiHua.ji });
      if (allStars.includes(dSiHua.lu))
        tags.push({ type: "lu", label: "祿", star: dSiHua.lu });
      if (allStars.includes(dSiHua.quan))
        tags.push({ type: "quan", label: "權", star: dSiHua.quan });
      if (allStars.includes(dSiHua.ke))
        tags.push({ type: "ke", label: "科", star: dSiHua.ke });

      const isToday = currentDate.toDateString() === now.toDateString();

      cData.push({
        id: i,
        dateObj: currentDate,
        dateStr: `${currentDate.getMonth() + 1}/${currentDate.getDate()}`,
        ganZhi: `${stem}${branch}`,
        palace: dData.palace,
        stars: starStr,
        siHua: dSiHua,
        tags: tags,
        score: dScore,
        isCycleStart: i % 10 === 0,
        isToday: isToday,
        details: dData,
      });
    }
    setCycleData(cData);

    const scores = cData.map((d) => d.score);
    const n = scores.length;
    const sum = scores.reduce((a, b) => a + b, 0);
    const mean = sum / n;

    const squareDiffs = scores.map((v) => Math.pow(v - mean, 2));
    const stdDev = Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / n);

    const cubedDiffs = scores.map((v) => Math.pow(v - mean, 3));
    const skewness =
      cubedDiffs.reduce((a, b) => a + b, 0) / n / Math.pow(stdDev, 3);

    const sorted = [...scores].sort((a, b) => a - b);
    const median =
      n % 2 !== 0
        ? sorted[Math.floor(n / 2)]
        : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;

    setStats({
      mean: mean.toFixed(1),
      stdDev: stdDev.toFixed(1),
      skewness: skewness.toFixed(2),
      median,
      max: sorted[n - 1],
      min: sorted[0],
    });
    setChartData(createHistogramData(scores));

    const sortedDays = [...cData].sort((a, b) => b.score - a.score);
    setExtremeDays({
      top: sortedDays.slice(0, 3),
      bottom: sortedDays.slice(-3).reverse(),
    });
  }, []);

  useEffect(() => {
    if (activeTab === "stats" && scrollRef.current && cycleData.length > 0) {
      const todayIndex = cycleData.findIndex((d) => d.isToday);
      if (todayIndex !== -1) {
        const scrollPos = todayIndex * 50 - 100;
        setTimeout(() => {
          scrollRef.current.scrollTo({ left: scrollPos, behavior: "smooth" });
        }, 500);
      }
    }
  }, [activeTab, cycleData]);

  const getRandomWisdom = (type: any) => {
    const pool = WISDOM_LIBRARY[type] || WISDOM_LIBRARY["doubt"];
    if (!pool || pool.length === 0)
      return { q: "靜心...", s: "...", a: "深呼吸" };

    let newIndex;
    const lastIndex = lastWisdomIndex[type];
    let attempts = 0;
    do {
      newIndex = Math.floor(Math.random() * pool.length);
      attempts++;
    } while (newIndex === lastIndex && attempts < 5);
    setLastWisdomIndex((prev: any) => ({ ...prev, [type]: newIndex }));
    return pool[newIndex];
  };

  const handleCapture = (type: any) => {
    setCurrentWisdom(getRandomWisdom(type));
    setActiveType(type);
  };

  const handleRefreshWisdom = () => {
    if (activeType) setCurrentWisdom(getRandomWisdom(activeType));
  };

  const handleSaveAndRelease = () => {
    setActiveType(null);
    setJournalNote("");
  };

  const renderLineChart = () => {
    if (cycleData.length === 0) return null;
    const pointSpacing = 50;
    const width = cycleData.length * pointSpacing;
    const height = 160;
    const padding = 20;
    const maxScore = 50;
    const minScore = -40;
    const range = maxScore - minScore;
    const getY = (score: number) =>
      height - padding - ((score - minScore) / range) * (height - 2 * padding);

    let pathD = `M ${padding} ${getY(cycleData[0].score)}`;
    cycleData.forEach(
      (d, i) => (pathD += ` L ${padding + i * pointSpacing} ${getY(d.score)}`)
    );

    return (
      <div className="overflow-x-auto custom-scrollbar pb-2" ref={scrollRef}>
        <div
          style={{ width: `${width + padding * 2}px` }}
          className="relative h-[180px]"
        >
          <div
            className="absolute left-0 right-0 border-t border-slate-700 border-dashed"
            style={{ top: `${getY(0)}px` }}
          ></div>
          <svg
            width={width + padding * 2}
            height={height}
            className="absolute top-0 left-0"
          >
            <path
              d={pathD}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2"
              strokeOpacity="0.6"
            />
            {cycleData.map((d, i) => (
              <ScoreDot
                key={i}
                x={padding + i * pointSpacing}
                y={getY(d.score)}
                score={d.score}
                isActive={selectedDay?.id === d.id}
                isCycleStart={d.isCycleStart}
                isToday={d.isToday}
                onClick={() => setSelectedDay(d)}
              />
            ))}
          </svg>
          <div
            className="absolute bottom-0 left-0 flex h-6 items-end"
            style={{ paddingLeft: `${padding - 20}px` }}
          >
            {cycleData.map((d, i) => (
              <div key={i} className="w-[50px] text-center">
                {d.isToday && (
                  <div className="text-[9px] text-amber-500 font-bold mb-0.5">
                    TODAY
                  </div>
                )}
                <span
                  className={`text-[9px] ${
                    d.isToday
                      ? "text-amber-400 font-bold"
                      : selectedDay?.id === d.id
                      ? "text-white"
                      : "text-slate-600"
                  }`}
                >
                  {d.dateStr}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (!dailyInfo.palace)
    return (
      <div className="bg-slate-950 min-h-screen flex items-center justify-center text-slate-500">
        初始化星盤矩陣...
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 max-w-md mx-auto relative overflow-hidden flex flex-col selection:bg-amber-500/30">
      <div className="absolute inset-0 pointer-events-none z-0 transition-colors duration-1000">
        <div
          className={`absolute top-[-20%] left-[-20%] w-[70%] h-[60%] rounded-full blur-[100px] opacity-15 ${
            dailyInfo.highlightColor.includes("rose")
              ? "bg-rose-600"
              : dailyInfo.highlightColor.includes("amber")
              ? "bg-amber-100"
              : dailyInfo.highlightColor.includes("purple")
              ? "bg-purple-600"
              : dailyInfo.highlightColor.includes("sky")
              ? "bg-sky-600"
              : "bg-emerald-900"
          }`}
        ></div>
      </div>

      <header className="px-6 pt-10 pb-6 z-10 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-md sticky top-0 flex justify-between items-start">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-100 to-amber-500 flex items-center gap-2">
            <Compass size={22} className="text-amber-500" />
            天樞 · 覺行 v2.1
          </h1>
          <div className="flex items-center gap-2 mt-2 text-[11px] font-mono text-slate-400 tracking-wide">
            <span className="text-slate-300">{todayDate.western}</span>
            <span className="text-slate-600">|</span>
            <span className="text-amber-500/80">農曆 {todayDate.lunar}</span>
          </div>
        </div>
        <ProfileDisplay ganZhi={dailyInfo.ganZhi} />
      </header>

      <div className="px-6 pb-2 z-10 sticky top-[88px] bg-slate-950/90 backdrop-blur flex gap-6 text-xs font-bold text-slate-500 border-b border-slate-800">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`pb-2 border-b-2 transition-colors flex items-center gap-1 ${
            activeTab === "dashboard"
              ? "text-white border-amber-500"
              : "hover:text-slate-300 border-transparent"
          }`}
        >
          <Compass size={12} /> 今日導航
        </button>
        <button
          onClick={() => setActiveTab("stats")}
          className={`pb-2 border-b-2 transition-colors flex items-center gap-1 ${
            activeTab === "stats"
              ? "text-white border-emerald-500"
              : "hover:text-slate-300 border-transparent"
          }`}
        >
          <Activity size={12} /> 關鍵統計
        </button>
      </div>

      <main className="flex-1 overflow-y-auto p-5 z-10 custom-scrollbar pb-24">
        {activeTab === "dashboard" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section className="mb-4">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-5 relative overflow-hidden shadow-xl flex flex-row items-center justify-center gap-3 flex-wrap">
                <div className="text-xs font-bold tracking-widest text-indigo-300 bg-indigo-900/30 px-2 py-1 rounded border border-indigo-500/20 whitespace-nowrap">
                  {dailyInfo.palace}
                </div>
                <h3 className="text-xl font-bold text-white tracking-wide drop-shadow-md whitespace-nowrap text-center">
                  {dailyInfo.displayStars}
                </h3>
                {dailyInfo.statusText !== "平穩" && (
                  <div
                    className={`text-xs font-bold px-2 py-1 rounded border whitespace-nowrap ${dailyInfo.statusBadgeBg} ${dailyInfo.statusBadgeBorder} ${dailyInfo.highlightColor}`}
                  >
                    {dailyInfo.statusText}
                  </div>
                )}
              </div>
            </section>

            <section className="mb-4">
              <EnergyBar
                score={dailyInfo.score}
                level={dailyInfo.energyLevel}
              />
            </section>

            <section className="mb-8">
              <div
                className={`bg-slate-950/60 border rounded-2xl p-6 relative overflow-hidden ${dailyInfo.borderColor}`}
              >
                <div
                  className={`absolute top-0 left-0 w-1 h-full ${dailyInfo.bgOverlay.replace(
                    "/50",
                    ""
                  )}`}
                ></div>
                <h4 className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1">
                  <BookOpen size={12} /> 演算指引
                </h4>
                <p className="text-sm text-slate-300 leading-loose text-justify font-serif tracking-wide whitespace-pre-wrap">
                  {dailyInfo.actionText}
                </p>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Infinity size={16} className="text-indigo-400" />
                  <h2 className="text-sm font-bold text-slate-300">
                    當下覺察{" "}
                  </h2>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleCapture("anger")}
                  className="group p-3 bg-slate-900 border border-slate-800 rounded-xl hover:border-red-500 hover:bg-red-950/30 transition-all active:scale-95 flex flex-col items-center"
                >
                  <Flame
                    size={20}
                    className="text-slate-500 group-hover:text-red-500 mb-2 transition-colors"
                  />
                  <span className="text-xs text-slate-400 mt-1">嗔 (火)</span>
                </button>
                <button
                  onClick={() => handleCapture("greed")}
                  className="group p-3 bg-slate-900 border border-slate-800 rounded-xl hover:border-blue-500 hover:bg-blue-950/30 transition-all active:scale-95 flex flex-col items-center"
                >
                  <CloudRain
                    size={20}
                    className="text-slate-500 group-hover:text-blue-500 mb-2 transition-colors"
                  />
                  <span className="text-xs text-slate-400 mt-1">貪 (水)</span>
                </button>
                <button
                  onClick={() => handleCapture("ignorance")}
                  className="group p-3 bg-slate-900 border border-slate-800 rounded-xl hover:border-purple-500 hover:bg-purple-950/30 transition-all active:scale-95 flex flex-col items-center"
                >
                  <Wind
                    size={20}
                    className="text-slate-500 group-hover:text-purple-500 mb-2 transition-colors"
                  />
                  <span className="text-xs text-slate-400 mt-1">癡 (風)</span>
                </button>
                <button
                  onClick={() => handleCapture("pride")}
                  className="col-span-1 group p-3 bg-slate-900 border border-slate-800 rounded-xl hover:border-amber-500 hover:bg-amber-950/30 transition-all active:scale-95 flex flex-col items-center"
                >
                  <Mountain
                    size={20}
                    className="text-slate-500 group-hover:text-amber-500 mb-2 transition-colors"
                  />
                  <span className="text-xs text-slate-400 mt-1">慢 (山)</span>
                </button>
                <button
                  onClick={() => handleCapture("doubt")}
                  className="col-span-2 group p-3 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-400 hover:bg-slate-800 transition-all active:scale-95 flex flex-row items-center justify-center gap-3"
                >
                  <Activity
                    size={20}
                    className="text-slate-500 group-hover:text-slate-300"
                  />
                  <span className="text-xs text-slate-400 group-hover:text-slate-300">
                    疑 (霧) · 焦慮不安
                  </span>
                </button>
              </div>
            </section>
          </div>
        )}

        {activeTab === "stats" && stats && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-inner">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <TrendingUp size={12} /> 能量趨勢 (60日動態推演)
                </h2>
                <div className="flex gap-2 text-[9px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    順
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-slate-400"></div>平
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-rose-500"></div>阻
                  </span>
                </div>
              </div>
              {renderLineChart()}
              <div className="mt-2 text-[10px] text-slate-500 text-center flex items-center justify-center gap-1">
                <Info size={10} />{" "}
                <span>向右滑動查看未來運勢，點擊節點查看詳情</span>
              </div>
            </section>

            <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3 text-sm font-bold text-slate-300">
                <AlertTriangle size={16} className="text-rose-500" />{" "}
                關鍵吉凶提醒 (未來60日)
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-[10px] text-slate-500 uppercase font-bold text-center">
                    ⚠️ 避險日{" "}
                  </div>
                  {extremeDays.bottom.map((d: any, i: number) => (
                    <div
                      key={i}
                      className="flex justify-between items-center text-xs bg-rose-950/30 p-2 rounded border border-rose-900/50 cursor-pointer hover:bg-rose-900/50 transition-colors"
                      onClick={() => setSelectedDay(d)}
                    >
                      <span className="text-slate-300">{d.dateStr}</span>
                      <span className="font-mono text-rose-400 font-bold">
                        {d.score}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="text-[10px] text-slate-500 uppercase font-bold text-center">
                    🚀 機遇日{" "}
                  </div>
                  {extremeDays.top.map((d: any, i: number) => (
                    <div
                      key={i}
                      className="flex justify-between items-center text-xs bg-amber-950/30 p-2 rounded border border-amber-900/50 cursor-pointer hover:bg-amber-900/50 transition-colors"
                      onClick={() => setSelectedDay(d)}
                    >
                      <span className="text-slate-300">{d.dateStr}</span>
                      <span className="font-mono text-amber-400 font-bold">
                        +{d.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3 text-sm font-bold text-slate-300">
                <BarChart3 size={16} className="text-indigo-500" /> 整體運勢分佈{" "}
              </div>
              <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-2xl">
                <DistributionChart
                  data={chartData}
                  mean={parseFloat(stats.mean)}
                  stdDev={parseFloat(stats.stdDev)}
                />
                <div className="mt-4 text-xs text-slate-400 leading-relaxed text-justify border-t border-slate-700/50 pt-3">
                  <strong className="text-white block mb-1">
                    統計解讀 (Skew: {stats.skewness})
                  </strong>
                  {Math.abs(stats.skewness) < 0.5
                    ? "分佈高度對稱，運勢穩定。大部分日子能量平穩。"
                    : stats.skewness > 0
                    ? "正偏態（右偏）。平常日子普通，但存在少數「極強運」爆發日。"
                    : "負偏態（左偏）。平常日子順暢，但需提防少數「極凶日」的衝擊。"}
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3 text-sm font-bold text-slate-300">
                <Sigma size={16} className="text-amber-500" /> 核心數據總覽
              </div>
              <div className="grid grid-cols-4 gap-2">
                <StatBox
                  label="平均運勢"
                  value={stats.mean > 0 ? `+${stats.mean}` : stats.mean}
                  color="text-white"
                />
                <StatBox
                  label="中間水準"
                  value={stats.median > 0 ? `+${stats.median}` : stats.median}
                  color="text-emerald-400"
                />
                <StatBox
                  label="波動程度"
                  value={stats.stdDev}
                  color="text-amber-400"
                />
                <StatBox
                  label="高低落差"
                  value={stats.max - stats.min}
                  color="text-indigo-400"
                />
              </div>
            </section>
          </div>
        )}
      </main>

      <DetailPanel data={selectedDay} onClose={() => setSelectedDay(null)} />

      {activeType && currentWisdom && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md p-5 flex flex-col justify-center animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveType(null);
              setCurrentWisdom(null);
            }
          }}
        >
          <WisdomCard
            type={activeType}
            data={currentWisdom}
            onClose={() => {
              setActiveType(null);
              setCurrentWisdom(null);
            }}
            onRefresh={handleRefreshWisdom}
          />
          <div className="mt-4 bg-slate-900 border border-slate-700 rounded-xl p-4 animate-in slide-in-from-bottom-4 shadow-lg">
            <div className="flex gap-2">
              <input
                className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 text-sm text-slate-300 focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="寫下當下情境..."
                value={journalNote}
                onChange={(e) => setJournalNote(e.target.value)}
              />
              <button
                onClick={handleSaveAndRelease}
                className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-2 rounded text-xs font-bold flex items-center gap-1 shadow-lg active:scale-95 transition-all"
              >
                <Lock size={12} /> 放下
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 0px; }
      `}</style>
    </div>
  );
}
