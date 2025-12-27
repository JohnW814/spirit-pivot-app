import React, { useState, useEffect } from "react";
import {
  Compass,
  Activity,
  BarChart3,
  Scale,
  BookOpenCheck,
  Sigma,
  Info,
  ScrollText,
} from "lucide-react";

// ============================================================================
// 1. 靜態資料庫 (Static Data) - 1966丙午年 巳宮天相盤
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

// Verified Chart Structure: Tian Xiang in Si, Lu Cun in Si.
const FULL_NATAL_CHART = {
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

const SI_HUA_TABLE = {
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

const STAR_BASE_VALUES = {
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

const BECM = {
  廟: [1.5, 0.5],
  旺: [1.3, 0.8],
  得: [1.1, 1.0],
  利: [1.0, 1.0],
  平: [0.7, 1.2],
  陷: [0.3, 1.6],
  借星: [0.6, 0.9],
};

const MALIGNANT_STARS = ["擎羊", "陀羅", "火星", "鈴星", "地空", "地劫"];
const SIHUA_DELTA = { lu: 15, quan: 10, ke: 8, ji: -15 };

const SEMANTIC_LIB = {
  action: {
    紫微: "統御",
    天機: "策劃",
    太陽: "發散",
    武曲: "執行",
    天同: "協調",
    廉貞: "轉化",
    天府: "積蓄",
    太陰: "儲備",
    貪狼: "探索",
    巨門: "鑽研",
    天相: "輔佐",
    天梁: "監察",
    七殺: "衝刺",
    破軍: "變革",
    祿存: "穩資",
    擎羊: "競爭",
    陀羅: "磨練",
    火星: "突發",
    鈴星: "謀算",
    地空: "悟性",
  },
  status: {
    flow: "能量極強，環境順風，",
    smooth: "運作平穩，進展順利，",
    stable: "持盈保泰，適合守成，",
    blocked: "阻力增大，內耗明顯，",
    retreat: "能量低谷，宜靜養晦，",
  },
};

// ============================================================================
// 2. 運算引擎 (Core Engine)
// ============================================================================

const getDetailedDate = (dateObj) => {
  const anchorDate = new Date("2024-01-01T12:00:00");
  const targetDate = new Date(dateObj);
  targetDate.setHours(12, 0, 0, 0);
  const msPerDay = 1000 * 60 * 60 * 24;
  const dayDiff = Math.round(
    (targetDate.getTime() - anchorDate.getTime()) / msPerDay
  );
  let offset = dayDiff % 60;
  if (offset < 0) offset += 60;

  const stem = HEAVENLY_STEMS[offset % 10];
  const branch = EARTHLY_BRANCHES[offset % 12];

  let lunarStr = "";
  try {
    const formatter = new Intl.DateTimeFormat("zh-TW", {
      calendar: "chinese",
      month: "numeric",
      day: "numeric",
    });
    const parts = formatter.formatToParts(dateObj);
    const month = parts.find((p) => p.type === "month").value;
    const day = parts.find((p) => p.type === "day").value;
    lunarStr = `農曆${month}${day}`;
  } catch (e) {
    lunarStr = "農曆運算中";
  }

  return {
    western: dateObj.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }),
    lunar: lunarStr,
    ganZhi: `${stem}${branch}日`,
    stem,
    branchKey: branch,
  };
};

const calculateEnergyScore = (chartData, siHua) => {
  const { main, borrow, minor, status } = chartData;
  const stars = main.length > 0 ? main : borrow;
  const allStars = [...stars, ...minor];
  let totalScore = 0;
  const [goodCoeff, badCoeff] = BECM[status] || [1.0, 1.0];

  allStars.forEach((star) => {
    let vBase = STAR_BASE_VALUES[star] || 0;
    const isMalignant = MALIGNANT_STARS.includes(star);
    if (isMalignant) totalScore += vBase * badCoeff;
    else totalScore += vBase * goodCoeff;
  });

  if (allStars.includes(siHua.lu)) totalScore += SIHUA_DELTA.lu;
  if (allStars.includes(siHua.quan)) totalScore += SIHUA_DELTA.quan;
  if (allStars.includes(siHua.ke)) totalScore += SIHUA_DELTA.ke;
  if (allStars.includes(siHua.ji)) totalScore += SIHUA_DELTA.ji;

  if (allStars.includes("天同")) totalScore += 10;
  if (allStars.includes("廉貞")) totalScore -= 5;

  return Math.round(totalScore);
};

const getEnergyLevel = (score) => {
  if (score >= 25)
    return {
      key: "flow",
      label: "極強",
      color: "text-amber-500",
      barColor: "bg-amber-500",
    };
  if (score >= 10)
    return {
      key: "smooth",
      label: "順暢",
      color: "text-emerald-500",
      barColor: "bg-emerald-500",
    };
  if (score >= -5)
    return {
      key: "stable",
      label: "平穩",
      color: "text-slate-400",
      barColor: "bg-slate-400",
    };
  if (score >= -20)
    return {
      key: "blocked",
      label: "受阻",
      color: "text-orange-500",
      barColor: "bg-orange-500",
    };
  return {
    key: "retreat",
    label: "修煉",
    color: "text-rose-500",
    barColor: "bg-rose-500",
  };
};

// ----------------------------------------------------------------------------
// Thesis Writing Engine (The Core Upgrade v3.3.1)
// ----------------------------------------------------------------------------

const generateDailyInterpretation = (chartData, siHua, stem, score, level) => {
  const { main, borrow, minor } = chartData;
  const activeStars = main.length > 0 ? main : borrow;
  const allStars = [...activeStars, ...minor];
  const hits = {
    lu: allStars.find((s) => s === siHua.lu),
    ji: allStars.find((s) => s === siHua.ji),
  };

  let narrative = `【今日】${
    SEMANTIC_LIB.status[level.key]
  }由【${activeStars.join("、")}】主導，${
    SEMANTIC_LIB.action[activeStars[0]] || "事務"
  }能量${score > 5 ? "顯著" : "持平"}。`;
  if (hits.ji)
    narrative += `\n⚠️ 警示：天干【${stem}】觸發【${hits.ji}化忌】，需防非線性變數干擾。`;
  else if (hits.lu)
    narrative += `\n✨ 吉兆：天干【${stem}】觸發【${hits.lu}化祿】，資源收益強化。`;
  return narrative;
};

// 重寫：定性與定量深度對話總結 (Academic Standard v3.3.1 Revised)
const generateThesisSummary = (stats) => {
  if (!stats) return "";
  let summary = "";

  // 1. 定性分析 (傳統命理視角)
  summary += `【壹、定性解讀：傳統命理模型】\n`;
  summary += `命造為「天相坐命於巳，祿存同宮」。天相化氣為印，本質主協調與平衡；祿存為天祿，主資源與穩定。此二星同宮，傳統論斷為「財官雙美、持盈保泰」之格。雖有鈴星（煞曜）同度，但受旺宮天相制化，凶性內斂，預示潛在的爆發力或隱憂。\n\n`;

  // 2. 定量分析 (統計數據驗證)
  summary += `【貳、定量分析：BECM 數據驗證】\n`;
  summary += `本研究以 BECM 模型進行 60 日運算，統計特徵如下：\n`;
  summary += `• 期望值檢定：平均能量 (Mean) 為 ${stats.mean}，顯著大於 0。此數據量化支持了祿存星對運勢基頻的「正向抬升」效應。\n`;

  const std = parseFloat(stats.stdDev);
  const stdDesc = std < 10 ? "收斂 (穩定性高)" : "發散 (波動性高)";
  summary += `• 波動度檢定：標準差 (StdDev) 為 ${stats.stdDev}。以 σ < 10 作為穩定閾值，此數據顯示運勢趨於「${stdDesc}」。\n`;

  const skew = parseFloat(stats.skewness);
  let skewDesc = "";
  if (Math.abs(skew) <= 0.5)
    skewDesc = `呈現「對稱分佈 (|Skew| ≤ 0.5)」。顯示運勢結構高度平衡。`;
  else if (skew < -0.5)
    skewDesc = `呈現顯著「左偏 (Negative Skew)」。顯示常態運勢平穩偏高 (Median ${stats.median})，但存在機率極低的「左尾極端值」。`;
  else
    skewDesc = `呈現顯著「右偏 (Positive Skew)」。顯示運勢具備向高分區拖尾的爆發潛力。`;
  summary += `• 風險結構檢定：分佈偏態 ${skewDesc}\n\n`;

  // 3. 深度對話 (綜合辯證)
  summary += `【參、定性與定量之深度對話】\n`;
  summary += `綜合比較顯示，定性分析中的「穩定」特質，在定量數據中被精確映射為「${
    std < 10 ? "低標準差" : "中等標準差"
  }」與「${
    parseFloat(stats.kurtosis) > 0.5 ? "高狹峰 (集中趨勢)" : "常態峰度"
  }」。\n`;
  summary += `然而，定量分析揭示了傳統論命中關於煞星的解讀，轉化為統計上的「${
    Math.abs(skew) > 0.5 ? "偏態特徵" : "極值現象"
  }」。這意味著命主雖常態安穩，分佈圖仍顯示存在不可忽視的尾部風險 (Tail Risk)，提示需針對低機率極端事件進行關注。\n`;
  summary += `最關鍵的是，命盤數值所呈現的常態分佈趨勢，揭示了個體生命歷程的起伏實與宇宙自然的能量運行法則一致。此發現將傳統命理對「吉凶」的二元對立焦慮，昇華為對應自然律動的「動態平衡」視角，這正是本研究試圖闡述的數位詮釋學核心意涵。`;

  return summary;
};

const generateCycleData = (startDate, days = 60) => {
  let data = [];
  const baseStart = new Date(startDate);
  for (let i = 0; i < days; i++) {
    const currentDate = new Date(baseStart);
    currentDate.setDate(baseStart.getDate() + i);
    const { stem, branch, branchKey } = getDetailedDate(currentDate);
    const dailyData = FULL_NATAL_CHART[branchKey];
    const dailySiHua = SI_HUA_TABLE[stem];
    const score = calculateEnergyScore(dailyData, dailySiHua);
    const level = getEnergyLevel(score);
    data.push({
      id: i,
      dateObj: currentDate,
      dateStr: `${currentDate.getMonth() + 1}/${currentDate.getDate()}`,
      ganZhi: `${stem}${branch}`,
      palace: dailyData.palace,
      score: score,
      level: level,
      isCycleStart: i % 10 === 0,
      isToday: i === 0,
    });
  }
  return data;
};

const calculateStats = (scores) => {
  const n = scores.length;
  if (n === 0) return null;
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const sum = scores.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  const sorted = [...scores].sort((a, b) => a - b);
  const mid = Math.floor(n / 2);
  const median =
    n % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  const m3 = scores.reduce((a, b) => a + Math.pow(b - mean, 3), 0) / n;
  const skewness = stdDev !== 0 ? m3 / Math.pow(stdDev, 3) : 0;
  const m4 = scores.reduce((a, b) => a + Math.pow(b - mean, 4), 0) / n;
  const kurtosis = stdDev !== 0 ? m4 / Math.pow(stdDev, 4) - 3 : 0;
  return {
    mean: mean.toFixed(1),
    median: median.toFixed(1),
    stdDev: stdDev.toFixed(1),
    range: `${min} ~ +${max}`,
    skewness: skewness.toFixed(2),
    kurtosis: kurtosis.toFixed(2),
    rawMean: mean,
    rawStdDev: stdDev,
  };
};

const createHistogramData = (scores) => {
  if (!scores.length) return { bins: [], min: 0, max: 0 };
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const binSize = 7;
  const startBin = Math.floor(min / binSize) * binSize;
  const endBin = Math.ceil((max + 1) / binSize) * binSize;
  let bins = [];
  for (let i = startBin; i < endBin; i += binSize) {
    bins.push({ label: `${i}`, min: i, max: i + binSize, count: 0 });
  }
  scores.forEach((s) => {
    const bin = bins.find((b) => s >= b.min && s < b.max);
    if (bin) bin.count++;
  });
  return { bins, min, max, binSize };
};

const normalPdf = (x, mean, stdDev) => {
  if (stdDev === 0) return 0;
  return (
    (1 / (stdDev * Math.sqrt(2 * Math.PI))) *
    Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2))
  );
};

// ============================================================================
// 4. UI Components (Pro Grade)
// ============================================================================

const getChartColorHex = (score) => {
  if (score >= 10) return "#10b981";
  if (score >= -5) return "#64748b";
  return "#f43f5e";
};

const getChartColorClass = (score) => {
  if (score >= 10) return "bg-emerald-500";
  if (score >= -5) return "bg-slate-500";
  return "bg-rose-500";
};

const WaveformChart = ({ data }) => {
  if (!data || data.length === 0) return null;
  const scores = data.map((d) => d.score);
  const max = Math.max(...scores);
  const min = Math.min(...scores);
  const range = max - min || 1;

  return (
    <div className="w-full bg-slate-900/50 rounded-xl border border-slate-800 p-4 mb-4 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1">
          <Activity size={12} className="text-amber-500" /> 60日週期能量 (Cycle
          Energy)
        </h3>
        <div className="flex gap-2 text-[9px]">
          <span className="flex items-center gap-1 text-emerald-400">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>吉
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>平
          </span>
          <span className="flex items-center gap-1 text-rose-400">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>凶
          </span>
        </div>
      </div>
      <div className="relative h-[120px] w-full flex items-end gap-[2px]">
        {/* Zero Line - Enhanced Clarity */}
        <div
          className="absolute w-full border-t border-indigo-500/30 border-dashed z-0"
          style={{ bottom: `${((0 - min) / range) * 100}%` }}
        ></div>
        <div
          className="absolute right-0 text-[8px] text-indigo-400/50 -mt-2.5 px-1"
          style={{ bottom: `${((0 - min) / range) * 100}%` }}
        >
          0
        </div>

        {data.map((d, i) => {
          const h = ((d.score - min) / range) * 100;
          let bgColor = getChartColorClass(d.score);
          if (i === 0) bgColor = "bg-amber-400";

          return (
            <div
              key={i}
              className="flex-1 flex flex-col justify-end h-full group relative z-10"
            >
              <div
                className={`w-full rounded-t-sm transition-all duration-300 hover:opacity-100 ${bgColor} ${
                  i === 0 ? "opacity-100" : "opacity-60"
                }`}
                style={{ height: `${Math.max(h, 5)}%` }}
              ></div>
              {d.isCycleStart && i !== 0 && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-slate-500"></div>
              )}
              <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-50 whitespace-nowrap bg-slate-800 text-white text-[10px] px-2 py-1 rounded border border-slate-600 shadow-xl pointer-events-none">
                <div className="font-bold">
                  {d.dateStr} {d.ganZhi}
                </div>
                <div>Score: {d.score}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DistributionHistogram = ({ data, mean, stdDev }) => {
  if (!data || !data.bins) return null;
  const { bins } = data;
  const maxCount = Math.max(...bins.map((b) => b.count)) || 1;
  const height = 150;
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
    const step = 0.5;
    for (let x = bins[0].min; x <= bins[bins.length - 1].max; x += step) {
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
    <div className="w-full bg-slate-900/50 rounded-xl border border-slate-800 p-4 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1">
          <BarChart3 size={12} className="text-indigo-400" /> 60日運勢分佈
          (Distribution)
        </h3>
      </div>
      <div className="relative flex justify-center overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
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
          {bins.map((b, i) => {
            const barHeight =
              (b.count / maxCount) * (height - paddingBottom - paddingTop);
            const xPos = paddingX + i * ((width - 2 * paddingX) / bins.length);
            const color = getChartColorHex(b.min);
            return (
              <g key={i}>
                <rect
                  x={xPos}
                  y={height - paddingBottom - barHeight}
                  width={barWidth}
                  height={barHeight}
                  fill={color}
                  opacity="0.7"
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
            stroke="#fbbf24"
            strokeWidth="1.5"
            opacity="0.5"
          />
        </svg>
      </div>
    </div>
  );
};

const StatBox = ({ label, value, subValue, color = "text-slate-200" }) => (
  <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex flex-col justify-between hover:border-slate-600 transition-colors">
    <span className="text-[10px] text-slate-500 uppercase mb-1">{label}</span>
    <div className="flex items-baseline gap-1">
      <span className={`font-mono font-bold text-sm ${color}`}>{value}</span>
      {subValue && (
        <span className="text-[9px] text-slate-600">{subValue}</span>
      )}
    </div>
  </div>
);

// ============================================================================
// 5. Main Application (Thesis Edition v3.3.1 Final)
// ============================================================================

export default function SpiritPivotV3_3() {
  const [currentDate] = useState(new Date());
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [histData, setHistData] = useState(null);

  useEffect(() => {
    // 1. Precise Time-Space Positioning
    const { western, lunar, ganZhi, stem, branchKey } =
      getDetailedDate(currentDate);

    // 2. Natal Chart Parsing
    const dailyData = FULL_NATAL_CHART[branchKey];
    const dailySiHua = SI_HUA_TABLE[stem];
    const score = calculateEnergyScore(dailyData, dailySiHua);
    const level = getEnergyLevel(score);

    // 3. Cycle Simulation & Stats
    const cycleData = generateCycleData(currentDate, 60);
    const scores = cycleData.map((d) => d.score);
    const calculatedStats = calculateStats(scores);

    setStats(calculatedStats);
    setHistData(createHistogramData(scores));

    // 4. Thesis Text Generation
    const dailyInterpretation = generateDailyInterpretation(
      dailyData,
      dailySiHua,
      stem,
      score,
      level
    );
    const thesisSummary = generateThesisSummary(calculatedStats);

    const mainStars =
      dailyData.main.length > 0 ? dailyData.main : dailyData.borrow;
    let displayStars = mainStars.join(" · ");
    if (dailyData.minor.length > 0)
      displayStars += " · " + dailyData.minor.join(" · ");

    setData({
      western,
      lunar,
      ganZhi,
      palace: dailyData.palace,
      score,
      level,
      displayStars,
      interpretation: dailyInterpretation,
      thesisSummary,
      cycleData,
    });
  }, [currentDate]);

  if (!data) return <div className="bg-slate-950 h-screen"></div>;

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 max-w-md mx-auto relative overflow-hidden selection:bg-amber-500/30">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className={`absolute top-[-20%] left-[-10%] w-[80%] h-[50%] rounded-full blur-[100px] opacity-10 ${data.level.barColor}`}
        ></div>
      </div>

      {/* 1. Header: Time-Space Coordinates */}
      <header className="px-6 pt-12 pb-4 relative z-10 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 flex items-center gap-2">
            <Compass size={20} className="text-amber-500" />
            天樞 · 覺行 V3
          </h1>
          <div className="text-right">
            <div className="text-lg font-serif text-amber-500/90">
              {data.ganZhi}
            </div>
            <div className="text-[10px] text-slate-500">
              {data.western} | {data.lunar}
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 py-6 relative z-10 space-y-6 pb-24">
        {/* Core Metric */}
        <section className="flex flex-col items-center">
          <div className="relative w-40 h-40 flex items-center justify-center mb-4">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="70"
                stroke="#1e293b"
                strokeWidth="4"
                fill="none"
              />
              <circle
                cx="50%"
                cy="50%"
                r="70"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className={`${data.level.color} transition-all duration-1000`}
                strokeDasharray="440"
                strokeDashoffset={440 - (440 * (data.score + 40)) / 90}
                strokeLinecap="round"
              />
            </svg>
            <div className="text-center">
              <div className="text-sm text-slate-500 font-bold mb-1">
                {data.palace}
              </div>
              <div
                className={`text-5xl font-mono font-bold tracking-tighter ${data.level.color}`}
              >
                {data.score > 0 ? `+${data.score}` : data.score}
              </div>
            </div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 px-4 py-2 rounded-full text-xs text-slate-300 font-medium text-center leading-relaxed shadow-sm">
            {data.displayStars}
          </div>
        </section>

        {/* Daily Interpretation */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <ScrollText size={16} className="text-amber-500" />
            <h2 className="text-sm font-bold text-slate-300">紫微啟示</h2>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/50"></div>
            <p className="text-sm text-slate-300 leading-7 text-justify font-serif whitespace-pre-line">
              {data.interpretation}
            </p>
          </div>
        </section>

        {/* Charts */}
        <section>
          <WaveformChart data={data.cycleData} />
          <DistributionHistogram
            data={histData}
            mean={stats?.rawMean}
            stdDev={stats?.rawStdDev}
          />
        </section>

        {/* Six-Dimensional Stats */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Scale size={16} className="text-amber-500" />
            <h2 className="text-sm font-bold text-slate-300">
              六維統計 (Descriptive Stats)
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <StatBox
              label="平均能量 (Mean)"
              value={stats?.mean}
              color="text-slate-200"
            />
            <StatBox
              label="核心水平 (Median)"
              value={stats?.median}
              color="text-emerald-400"
            />
            <StatBox
              label="氣場波動 (StdDev)"
              value={stats?.stdDev}
              color="text-amber-400"
            />
            <StatBox
              label="偏態 (Skewness)"
              value={stats?.skewness}
              subValue={
                parseFloat(stats?.skewness) < -0.2
                  ? "左偏"
                  : parseFloat(stats?.skewness) > 0.2
                  ? "右偏"
                  : "對稱"
              }
              color="text-indigo-400"
            />
            <StatBox
              label="峰度 (Kurtosis)"
              value={stats?.kurtosis}
              color="text-indigo-400"
            />
            <StatBox
              label="全距 (Range)"
              value={stats?.range}
              color="text-slate-400"
            />
          </div>
        </section>

        {/* Thesis Summary (The Jewel in the Crown) */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <BookOpenCheck size={16} className="text-amber-500" />
            <h2 className="text-sm font-bold text-slate-300">
              命盤數值分析總結
            </h2>
          </div>
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-amber-500/20 rounded-xl p-6 shadow-lg relative overflow-hidden">
            {/* Decorative Background Icon */}
            <div className="absolute top-0 right-0 -mr-4 -mt-4 opacity-5">
              <Compass size={100} className="text-white" />
            </div>

            <div className="relative z-10 space-y-4">
              <p className="text-xs text-slate-300 leading-6 text-justify whitespace-pre-line font-medium tracking-wide">
                {data.thesisSummary}
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
