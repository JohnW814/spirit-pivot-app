import React, { useState, useEffect } from "react";
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
  Microscope,
  Sparkles,
  AlertTriangle,
  Star,
  Calendar,
  Clock,
  Monitor,
  Shield,
  Crown,
  BookOpen,
  LineChart,
} from "lucide-react";

// ============================================================================
// 1. 絕對精準命理核心 (Precision Engine v6 - Scientific)
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

// ★ 萬年曆錨點：2025-12-20 = 癸亥日
const getPrecisionGanZhi = (dateObj: any) => {
  const anchorDate = new Date("2025-12-20T12:00:00");
  const targetDate = new Date(dateObj);
  targetDate.setHours(12, 0, 0, 0);

  const dayDiff = Math.round(
    (targetDate.getTime() - anchorDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const baseStemIndex = 9; // 癸
  const baseBranchIndex = 11; // 亥

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

// ============================================================================
// 2. 量化權重參數庫 (Quantification Database)
// ============================================================================

const STAR_BASE_VALUES: any = {
  // 主星
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
  // 吉星
  祿存: 5,
  左輔: 4,
  右弼: 4,
  天魁: 4,
  天鉞: 4,
  文昌: 3,
  文曲: 3,
  // 煞星 (負值)
  擎羊: -5,
  陀羅: -5,
  火星: -4,
  鈴星: -4,
  地空: -4,
  地劫: -4,
};

const ENV_COEFFICIENTS: any = {
  廟: 1.5,
  旺: 1.2,
  得: 1.1,
  利: 1.0,
  平: 0.6,
  陷: -0.5,
  借星: 0.4,
};

const SIHUA_DELTA = {
  lu: 15,
  quan: 10,
  ke: 8,
  ji: -15,
};

// ============================================================================
// 3. 命盤與四化資料
// ============================================================================

const FULL_NATAL_CHART: any = {
  子: { palace: "疾厄宮", main: ["太陽"], borrow: [], minor: [], status: "陷" },
  丑: {
    palace: "財帛宮",
    main: ["天府"],
    borrow: [],
    minor: ["地劫"],
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
    status: "旺",
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
    minor: ["文昌"],
    status: "借星",
  },
  酉: {
    palace: "官祿宮",
    main: [],
    borrow: ["紫微", "貪狼"],
    minor: ["左輔", "天鉞", "地空"],
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

// ============================================================================
// 4. 運算邏輯
// ============================================================================

const calculateEnergyScore = (chartData: any, siHua: any) => {
  const { main, borrow, minor, status } = chartData;
  const stars = main.length > 0 ? main : borrow;
  const allStars = [...stars, ...minor];

  let totalScore = 0;
  let coefficient = ENV_COEFFICIENTS[status] || 1.0;

  allStars.forEach((star: any) => {
    let vBase = STAR_BASE_VALUES[star] || 0;
    if (vBase < 0 && coefficient > 1) {
      totalScore += Math.abs(vBase) * coefficient * 0.8;
    } else if (vBase < 0 && coefficient < 0) {
      totalScore += vBase * Math.abs(coefficient) * 1.5;
    } else {
      totalScore += vBase * coefficient;
    }
  });

  if (allStars.includes(siHua.lu)) totalScore += SIHUA_DELTA.lu;
  if (allStars.includes(siHua.quan)) totalScore += SIHUA_DELTA.quan;
  if (allStars.includes(siHua.ke)) totalScore += SIHUA_DELTA.ke;
  if (allStars.includes(siHua.ji)) totalScore += SIHUA_DELTA.ji;

  return Math.round(totalScore);
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

// 內容生成
const generateDailyContent = (
  chartData: any,
  siHua: any,
  stem: string,
  score: number
) => {
  const { main, borrow, minor, palace, status } = chartData;
  const calcStars = main.length > 0 ? main : borrow;

  let displayStars = "";
  if (main.length > 0) {
    displayStars =
      main.join(" · ") + (minor.length > 0 ? " · " + minor.join("") : "");
  } else {
    displayStars =
      `(借)${borrow.join("·")}` +
      (minor.length > 0 ? " · " + minor.join("") : "");
  }

  const allStarsToCheck = [...calcStars, ...minor];
  const hits = {
    lu: allStarsToCheck.find((s: any) => s === siHua.lu),
    quan: allStarsToCheck.find((s: any) => s === siHua.quan),
    ke: allStarsToCheck.find((s: any) => s === siHua.ke),
    ji: allStarsToCheck.find((s: any) => s === siHua.ji),
  };

  let displaySiHua = [];
  if (hits.lu) displaySiHua.push(`${hits.lu}祿`);
  if (hits.quan) displaySiHua.push(`${hits.quan}權`);
  if (hits.ke) displaySiHua.push(`${hits.ke}科`);
  if (hits.ji) displaySiHua.push(`${hits.ji}忌`);
  let statusText = displaySiHua.length > 0 ? displaySiHua.join(" ") : "平穩";

  const energyLevel = getEnergyLevel(score);
  let highlightColor = energyLevel.color;
  let borderColor = energyLevel.barColor.replace("bg-", "border-") + "/30";
  let bgOverlay = energyLevel.barColor.replace("bg-", "bg-") + "/10";
  let statusBadgeBg = energyLevel.barColor.replace("bg-", "bg-") + "/20";
  let statusBadgeBorder =
    energyLevel.barColor.replace("bg-", "border-") + "/30";

  let summaryText = ""; // 總體能量定調
  let actionText = ""; // 星曜解析

  if (score < -15) {
    summaryText = `⚠️ 【潛龍勿用】 (能量指數 ${score})\n環境阻力較大。適合「被動」應對，不宜主動出擊。多做內在修持，少做外在決策。`;
  } else if (score > 20) {
    summaryText = `🚀 【飛龍在天】 (能量指數 ${score})\n氣場強旺。是執行重大計畫、談判或突破的最佳時機，請把握良機。`;
  } else if (score >= -5 && score <= 10) {
    summaryText = `☯️ 【持盈保泰】 (能量指數 ${score})\n能量平穩，依循主星特質行事，保持正念，活在當下。`;
  } else {
    summaryText = `🌊 【順勢而為】 (能量指數 ${score})\n能量流動正常，保持覺知，應對變化。`;
  }

  if (hits.ji) {
    summaryText += `\n\n⚠️ 注意：天干【${stem}】引發【${hits.ji}化忌】。`;
    if (minor.includes(hits.ji)) summaryText += "干擾來自細節或輔助層面。";
    else summaryText += "主架構受到衝擊，需謹慎應對。";
    if (minor.includes("地劫") || minor.includes("地空"))
      summaryText += " (逢空劫，得失心勿重，轉為精神學習為佳。)";
  } else if (hits.lu) {
    summaryText += `\n\n✨ 吉兆：天干【${stem}】引發【${hits.lu}化祿】。資源流動順暢，付出有回報。`;
  }

  calcStars.slice(0, 2).forEach((star: any) => {
    if (star === "紫微") actionText += "• 紫微：尊貴包容，適合領導統御。\n";
    if (star === "天府") actionText += "• 天府：穩健守成，適合盤點資源。\n";
    if (star === "太陽") actionText += "• 太陽：博愛付出，燃燒自己照亮他人。\n";
    if (star === "武曲") actionText += "• 武曲：剛毅執行，果斷處理財務。\n";
    if (star === "天同") actionText += "• 天同：協調享樂，保持赤子之心。\n";
    if (star === "廉貞") actionText += "• 廉貞：專注工作，轉化複雜能量。\n";
    if (star === "太陰") actionText += "• 太陰：溫柔內斂，直覺敏銳。\n";
    if (star === "貪狼") actionText += "• 貪狼：長袖善舞，學習慾望強烈。\n";
    if (star === "巨門") actionText += "• 巨門：觀察入微，謹言慎行。\n";
    if (star === "天相") actionText += "• 天相：居中協調，展現平衡之美。\n";
    if (star === "天梁") actionText += "• 天梁：蔭庇眾生，公正解決難題。\n";
    if (star === "七殺") actionText += "• 七殺：獨當一面，勇於突破現狀。\n";
    if (star === "破軍") actionText += "• 破軍：除舊佈新，勇敢變革。\n";
    if (star === "天機") actionText += "• 天機：機智規劃，避免鑽牛角尖。\n";
  });

  if (minor.includes("地空") || minor.includes("地劫"))
    actionText +=
      "• 空劫：靈感乍現，跳脫框架，但不利世俗財利，適合精神層面的感悟。\n";

  return {
    displayStars,
    statusText,
    highlightColor,
    borderColor,
    bgOverlay,
    summaryText,
    actionText,
    statusBadgeBg,
    statusBadgeBorder,
    score,
    energyLevel,
  };
};

// --- 3. 格物般若智庫 (維持原樣) ---
const WISDOM_LIBRARY: any = {
  anger: [
    {
      q: "憤怒是封閉系統的劇烈熵增，正無效耗散生命能量。",
      s: "《心經》：無無明，亦無無明盡。火是虛幻的，因我執是虛幻的。",
      a: "觀想打開心靈窗戶，讓熱氣流向虛空。",
    },
    {
      q: "根據牛頓第三定律，攻擊別人，震傷的一定是自己。",
      s: "一切有為法，如夢幻泡影。別對著影子揮拳。",
      a: "立刻停止施力，深呼吸感受反作用力消失。",
    },
    {
      q: "恨加深量子糾纏。切斷惡緣的唯一方法是停止觀測。",
      s: "照見五蘊皆空。你我皆空，本無連結。",
      a: "閉眼，觀想拔掉能量插頭，螢幕黑屏。",
    },
    {
      q: "憤怒是高頻破壞波。腦波處於Beta高頻，阻斷智慧連結。",
      s: "心無掛礙。生氣的點，是心中未解的結。",
      a: "刻意放慢語速呼吸，強制降頻。",
    },
    {
      q: "您正像黑體輻射源般發射破壞熱能，會灼傷身邊場域。",
      s: "凡所有相，皆是虛妄。別被表象熱度欺騙。",
      a: "想像自己是冰，吸入燥熱轉化為慈悲水。",
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
    {
      q: "能量守恆：總量不變，獲得只是能量轉移。",
      s: "不增不減。本自具足，何必外求？",
      a: "清理不需要物品，讓能量流動。",
    },
    {
      q: "渴望只是大腦巴甫洛夫制約，非真實需求。",
      s: "離一切相。看穿光影與化學反應。",
      a: "問自己：沒它我會死嗎？切斷連結。",
    },
    {
      q: "邊際效應遞減：擁有越多，快樂越少。",
      s: "知足常樂。快樂來自心，非物堆疊。",
      a: "對已擁有東西說謝謝，重溫快樂。",
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
    {
      q: "光速有限，所見皆過去影像。煩惱亦是投影。",
      s: "遠離顛倒夢想。過去心不可得。",
      a: "看眼前人事物，告訴自己：這是全新的。",
    },
    {
      q: "大腦濾波器過濾99%真相。所見即偏見。",
      s: "去妄存真。移除有色眼鏡。",
      a: "尋找反證：這件事其實有正面意義。",
    },
    {
      q: "量子芝諾效應：持續覺知可凍結妄念。",
      s: "制心一處。覺知一照，黑暗遁形。",
      a: "專注看著煩惱念頭，像看著蟲。",
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
    {
      q: "自我膨脹必塌縮成黑洞。縮小保持光亮。",
      s: "謙卑第一。滿招損謙受益。",
      a: "對服務員說謝謝，真心感謝。",
    },
    {
      q: "測不準原理：無法全知。承認侷限是智慧。",
      s: "非想非非想。保持敬畏未知。",
      a: "承認「我不知道」，瓦解傲慢。",
    },
    {
      q: "微波背景輻射：皆來自星塵。本同一體。",
      s: "眾生平等。禮敬內在神性。",
      a: "看路人想：我們是兄弟姐妹。",
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
    {
      q: "量子隧穿：信心足可穿透障礙之牆。",
      s: "無有恐怖。障礙是心設。",
      a: "觀想如光穿透困難達彼岸。",
    },
    {
      q: "混沌背後有秩序。一切發生皆有深意。",
      s: "因緣果報。安排是最好的。",
      a: "找出倒霉事的正面影響。",
    },
    {
      q: "焦慮是波擾動。潛入海底永遠平靜。",
      s: "如是滅度。回到內在覺知。",
      a: "深呼吸注意丹田穩定。",
    },
  ],
};

// --- Components ---

// ProfileDisplay: 靜態顯示 - 優化版
const ProfileDisplay = ({ ganZhi }: any) => (
  <div className="mt-1 flex flex-col items-end gap-1 select-none">
    <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-full px-3 py-1.5 shadow-lg relative z-20">
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
      <span className="text-xs font-bold text-slate-300">丙午</span>
    </div>
    {/* 移除前方圖示，純文字顯示 */}
    <div className="text-[10px] text-slate-500 font-mono tracking-tighter bg-slate-900/30 px-2 py-0.5 rounded border border-slate-800/50">
      {ganZhi}
    </div>
  </div>
);

// EnergyBar: 能量指數顯示元件 - 優化版 (加大字體，更換圖示)
const EnergyBar = ({ score, level }: any) => (
  <div className="flex items-center gap-3 w-full bg-slate-900/50 p-3 rounded-xl border border-slate-800/50 shadow-inner">
    <div className="flex-1">
      <div className="flex justify-between items-end mb-2">
        {/* 字體加大，圖示改為折線圖 (LineChart) */}
        <span className="text-sm text-slate-400 font-bold flex items-center gap-2">
          <LineChart size={16} className={level.color} /> 能量頻率
        </span>
        <span className={`text-lg font-bold font-mono ${level.color}`}>
          {score > 0 ? `+${score}` : score}
        </span>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${level.barColor}`}
          style={{ width: `${level.percent}%`, opacity: 0.9 }}
        ></div>
      </div>
    </div>
  </div>
);

const WisdomCard = ({ type, data, onClose, onRefresh }: any) => {
  const [isFading, setIsFading] = useState(false);

  const handleRefresh = () => {
    setIsFading(true);
    setTimeout(() => {
      onRefresh();
      setIsFading(false);
    }, 300);
  };

  return (
    <div className="animate-in fade-in zoom-in duration-300 bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh]">
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
              <Brain size={14} /> 格物洞見
            </h4>
            <p className="text-sm text-indigo-100 leading-loose tracking-wide text-justify font-serif">
              {data.q}
            </p>
          </div>
          <div className="bg-amber-950/40 p-4 rounded-xl border-l-2 border-amber-500 shadow-inner">
            <h4 className="text-xs font-bold text-amber-500 mb-2 flex items-center gap-2">
              <Heart size={14} /> 般若心語
            </h4>
            <p className="text-sm text-amber-100 leading-loose tracking-wide text-justify font-serif">
              {data.s}
            </p>
          </div>
          <div className="text-center pt-2 pb-2">
            <span className="inline-block px-4 py-2 bg-emerald-900/40 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/30 animate-pulse leading-relaxed tracking-wide">
              觀心指引：{data.a}
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

// --- Main App ---

export default function App() {
  const [dailyInfo, setDailyInfo] = useState({
    ganZhi: "",
    palace: "",
    stars: "",
    summaryText: "",
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
  const [logs, setLogs] = useState<any[]>([]);

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

    // 計算能量分數
    const score = calculateEnergyScore(dailyData, dailySiHua);

    const content = generateDailyContent(dailyData, dailySiHua, stem, score);

    setDailyInfo({
      ganZhi: `${stem}${branch}日`,
      palace: dailyData.palace,
      stars: content.displayStars,
      summaryText: content.summaryText,
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
      score: content.score,
      energyLevel: content.energyLevel,
    });

    const savedLogs = localStorage.getItem("spiritPivotMasterLogs");
    if (savedLogs) setLogs(JSON.parse(savedLogs));
  }, []);

  const getRandomWisdom = (type: any) => {
    const pool = WISDOM_LIBRARY[type] || WISDOM_LIBRARY["doubt"];
    if (pool.length <= 1) return pool[0];
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
    if (activeType) {
      setCurrentWisdom(getRandomWisdom(activeType));
    }
  };

  const handleSaveAndRelease = () => {
    const newLog = {
      id: Date.now(),
      date: new Date().toLocaleString("zh-TW", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      type: activeType,
      note: journalNote,
    };
    const updated = [newLog, ...logs];
    setLogs(updated);
    localStorage.setItem("spiritPivotMasterLogs", JSON.stringify(updated));
    setActiveType(null);
    setJournalNote("");
  };

  if (!dailyInfo.palace)
    return <div className="bg-slate-950 min-h-screen"></div>;

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 max-w-md mx-auto relative overflow-hidden flex flex-col selection:bg-amber-500/30">
      {/* Dynamic Background */}
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

      {/* Header */}
      <header className="px-6 pt-10 pb-6 z-10 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-md sticky top-0 flex justify-between items-start">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-100 to-amber-500 flex items-center gap-2">
            <Compass size={22} className="text-amber-500" />
            天樞 · 覺行
          </h1>
          <div className="flex items-center gap-2 mt-2 text-[11px] font-mono text-slate-400 tracking-wide">
            <span className="text-slate-300">{todayDate.western}</span>
            <span className="text-slate-600">|</span>
            <span className="text-amber-500/80">農曆 {todayDate.lunar}</span>
          </div>
        </div>

        {/* Profile Display */}
        <ProfileDisplay ganZhi={dailyInfo.ganZhi} />
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-5 z-10 custom-scrollbar pb-24">
        {/* Daily Fate - The Zen UI Block (Horizontal Compact) */}
        <section className="mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={16} className="text-amber-500" />
            <h2 className="text-sm font-bold text-slate-300">今日導航</h2>
          </div>

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

        {/* Energy Bar Section (Updated) */}
        <section className="mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-50">
          <EnergyBar score={dailyInfo.score} level={dailyInfo.energyLevel} />
        </section>

        {/* Action Guide - Zen Style (No Header, Spacing Reduced) */}
        <section className="mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          <div
            className={`bg-slate-950/60 border rounded-2xl p-6 relative overflow-hidden ${dailyInfo.borderColor}`}
          >
            <div
              className={`absolute top-0 left-0 w-1 h-full ${dailyInfo.bgOverlay.replace(
                "/50",
                ""
              )}`}
            ></div>
            {/* Summary Text */}
            <p className="text-sm text-slate-200 font-bold leading-relaxed mb-4 whitespace-pre-wrap border-b border-slate-800 pb-3">
              {dailyInfo.summaryText}
            </p>
            {/* Detail Action Text */}
            <p className="text-sm text-slate-400 leading-loose text-justify font-serif tracking-wide whitespace-pre-wrap">
              {dailyInfo.actionText}
            </p>
          </div>
        </section>

        {/* Instant Interceptor */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Infinity size={16} className="text-indigo-400" />
              <h2 className="text-sm font-bold text-slate-300">當下覺察</h2>
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
              <span className="text-xs text-slate-400">嗔 (火)</span>
            </button>
            <button
              onClick={() => handleCapture("greed")}
              className="group p-3 bg-slate-900 border border-slate-800 rounded-xl hover:border-blue-500 hover:bg-blue-950/30 transition-all active:scale-95 flex flex-col items-center"
            >
              <CloudRain
                size={20}
                className="text-slate-500 group-hover:text-blue-500 mb-2 transition-colors"
              />
              <span className="text-xs text-slate-400">貪 (水)</span>
            </button>
            <button
              onClick={() => handleCapture("ignorance")}
              className="group p-3 bg-slate-900 border border-slate-800 rounded-xl hover:border-purple-500 hover:bg-purple-950/30 transition-all active:scale-95 flex flex-col items-center"
            >
              <Wind
                size={20}
                className="text-slate-500 group-hover:text-purple-500 mb-2 transition-colors"
              />
              <span className="text-xs text-slate-400">癡 (風)</span>
            </button>
            <button
              onClick={() => handleCapture("pride")}
              className="col-span-1 group p-3 bg-slate-900 border border-slate-800 rounded-xl hover:border-amber-500 hover:bg-amber-950/30 transition-all active:scale-95 flex flex-col items-center"
            >
              <Mountain
                size={20}
                className="text-slate-500 group-hover:text-amber-500 mb-2 transition-colors"
              />
              <span className="text-xs text-slate-400">慢 (山)</span>
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

        {/* History */}
        {logs.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-800">
            <h4 className="text-[10px] uppercase tracking-widest text-slate-600 mb-3">
              Today's Practice
            </h4>
            <div className="space-y-2">
              {logs.slice(0, 3).map((log) => (
                <div
                  key={log.id}
                  className="text-xs flex justify-between text-slate-500 bg-slate-900/50 p-2 rounded"
                >
                  <span>
                    {log.type === "anger"
                      ? "轉化嗔火"
                      : log.type === "greed"
                      ? "轉化貪執"
                      : log.type === "ignorance"
                      ? "轉化愚癡"
                      : log.type === "pride"
                      ? "轉化我慢"
                      : "轉化疑懼"}
                  </span>
                  <span>{log.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Wisdom Modal */}
      {activeType && currentWisdom && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md p-5 flex flex-col justify-center animate-in fade-in"
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
