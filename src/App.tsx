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
} from "lucide-react";

// ============================================================================
// 1. 絕對精準命理核心 (Precision Engine v4)
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

// ★★★ 絕對錨點校正 (User Verified) ★★★
// 基準日：2025-12-20 12:00:00 = 癸亥日
const getPrecisionGanZhi = (dateObj) => {
  const anchorDate = new Date("2025-12-20T12:00:00");
  const targetDate = new Date(dateObj);
  // 設定目標時間為中午 12:00，確保跨日計算準確
  targetDate.setHours(12, 0, 0, 0);

  // 計算天數差 (使用 Math.round 避免時區導致的小數點誤差)
  const dayDiff = Math.round(
    (targetDate.getTime() - anchorDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // 基準日索引：癸(9), 亥(11)
  const baseStemIndex = 9;
  const baseBranchIndex = 11;

  // 推算目標日索引 (處理負數迴圈)
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

// 丙午人(天相在巳) 真實命盤結構
// main: 主星陣列，用於與四化比對
const NATAL_CHART = {
  子: { palace: "疾厄宮", stars: "太陽(陷)", main: ["太陽"] },
  丑: { palace: "財帛宮", stars: "天府(得)", main: ["天府"] },
  寅: { palace: "子女宮", stars: "天機(旺)·太陰(旺)", main: ["天機", "太陰"] },
  卯: { palace: "夫妻宮", stars: "紫微(旺)·貪狼(平)", main: ["紫微", "貪狼"] },
  辰: { palace: "兄弟宮", stars: "巨門(陷)", main: ["巨門"] },
  巳: { palace: "本命宮", stars: "天相(得)·祿存·鈴星", main: ["天相"] },
  午: { palace: "父母宮", stars: "天梁(廟)", main: ["天梁"] },
  未: { palace: "福德宮", stars: "廉貞(廟)·七殺(廟)", main: ["廉貞", "七殺"] },
  申: { palace: "田宅宮", stars: "空宮 (借機陰)", main: ["天機", "太陰"] },
  酉: { palace: "官祿宮", stars: "空宮 (借紫貪)", main: ["紫微", "貪狼"] },
  戌: { palace: "交友宮", stars: "天同(平)", main: ["天同"] },
  亥: { palace: "遷移宮", stars: "武曲(平)·破軍(平)", main: ["武曲", "破軍"] },
};

// 十天干四化表
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

// 產生內容：分離「上方顯示」與「下方解析」並處理顏色邏輯
const generateDailyContent = (stars, palace, siHua, stem, mainStars) => {
  // A. 上方顯示：僅摘要
  let displayStars = stars;
  let displaySiHua = "";
  let highlightColor = "text-emerald-500"; // 預設平穩色 (綠)
  let borderColor = "border-emerald-900/30";
  let bgOverlay = "bg-emerald-500/50";

  // 檢查主星是否化忌或化祿
  const isJi = mainStars.some((star) => star === siHua.ji);
  const isLu = mainStars.some((star) => star === siHua.lu);

  if (isJi) {
    displaySiHua = `${siHua.ji}化忌 ⚠️`;
    highlightColor = "text-rose-500"; // 警示色 (紅)
    borderColor = "border-rose-900/30";
    bgOverlay = "bg-rose-500/50";
  } else if (isLu) {
    displaySiHua = `${siHua.lu}化祿 ✨`;
    highlightColor = "text-amber-500"; // 吉祥色 (金)
    borderColor = "border-amber-900/30";
    bgOverlay = "bg-amber-500/50";
  } else {
    displaySiHua = "平穩";
  }

  // B. 下方解析：詳細心法
  let actionText = "";

  // 1. 星曜特質解析
  if (stars.includes("紫微"))
    actionText += "帝星降臨，氣勢強旺。適合掌握主導權，展現領袖魅力。";
  else if (stars.includes("貪狼"))
    actionText += "桃花人緣旺盛，靈感強烈。將對物質的渴望轉化為對智慧的追求。";
  else if (stars.includes("天機"))
    actionText += "機謀多變，思緒奔騰。今日適合規劃思考，但忌鑽牛角尖。";
  else if (stars.includes("太陽"))
    actionText += "貴氣發散，利於付出。需注意心力不過度消耗，保持溫暖。";
  else if (stars.includes("武曲"))
    actionText += "剛毅執行，財星高照。適合處理財務報表或執行困難任務。";
  else if (stars.includes("天同"))
    actionText += "福星高照，情緒流動。適合放鬆協調，享受生活，與人為善。";
  else if (stars.includes("廉貞"))
    actionText += "能量複雜強大。需將強大的精神力專注於工作，以免心生雜念。";
  else if (stars.includes("天府"))
    actionText += "庫藏充盈，氣度穩健。適合守成、盤點資源，不宜冒進。";
  else if (stars.includes("太陰"))
    actionText += "溫柔婉約，直覺敏銳。適合內觀、整理居家環境，與家人共處。";
  else if (stars.includes("巨門"))
    actionText += "口舌之星。今日言多必失，宜閉口修，觀察者效應：只說好話。";
  else if (stars.includes("天相"))
    actionText += "掌印輔佐，平衡協調。適合居中策劃，展現天河水之潤澤。";
  else if (stars.includes("天梁"))
    actionText += "老成持重，蔭庇他人。適合做善事、接觸宗教哲學，轉化孤獨感。";
  else if (stars.includes("七殺"))
    actionText += "獨當一面，大刀闊斧。適合突破現狀，但切忌衝動行事。";
  else if (stars.includes("破軍"))
    actionText += "破舊立新，變動劇烈。適合斷捨離，清理舊有模式。";

  // 2. 四化關鍵指引
  if (isJi) {
    actionText += `\n\n⚠️ 【趨吉避凶】\n今日天干【${stem}】引發【${siHua.ji}化忌】。能量在此處受阻，易有是非或誤解。建議「韜光養晦」，暫緩重大決定，回歸內在修持，以忍辱轉化業力。`;
  } else if (isLu) {
    actionText += `\n\n✨ 【乘勢而起】\n今日天干【${stem}】引發【${siHua.lu}化祿】。機遇良好，順勢而為，福氣自來。`;
  } else {
    actionText += `\n\n☯️ 【持盈保泰】\n今日能量平穩，依循主星特質行事，保持正念，活在當下。`;
  }

  return {
    displayStars,
    displaySiHua,
    highlightColor,
    borderColor,
    bgOverlay,
    actionText,
  };
};

// --- 2. 用戶原廠設定 ---
const USER_PROFILE = {
  year: "1966 丙午",
  zodiac: "火馬",
  element: "天河水",
  lunarBirth: "六月廿八",
  lifePalace: "巳宮 (蛇)",
  pattern: "天相坐命",
};

// --- 3. 格物般若智庫 ---
const WISDOM_LIBRARY = {
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
    {
      q: "對方頻率傷人，因您的我執與之共振。",
      s: "忍辱波羅蜜。真正的忍是不接球。",
      a: "發出微小祝福，調整頻率打破共振。",
    },
    {
      q: "相對論：速度快時間扭曲。憤怒時痛苦被拉長。",
      s: "一念三千。抽離當下，別陷在拉長的時間點。",
      a: "想像十年後回看此刻：還重要嗎？",
    },
    {
      q: "情緒具波粒二象性。不觀測為憤怒，它只是中性能量。",
      s: "色即是空。是命名賦予了它殺傷力。",
      a: "不貼標籤。只看著胸口能量流動。",
    },
    {
      q: "能量守恆：怒氣只能轉化。壓抑成內傷，發洩成業力。",
      s: "不生不滅。能量本純淨，被執著染污。",
      a: "快走或做家事，將攻擊動能轉為代謝。",
    },
    {
      q: "蝴蝶效應：此刻嗔念可能在未來引發風暴。",
      s: "諸惡莫作，自淨其意。為未來截斷連鎖。",
      a: "握拳三秒後放鬆。用生理煞車中斷慣性。",
    },
    {
      q: "憤怒是大腦慣性滑行。需外力施加才能停止。",
      s: "知幻即離。覺知是斬斷輪迴的劍。",
      a: "做個不符情境的動作（如看天花板），打破。",
    },
    {
      q: "看不見的怨氣（暗能量）比爭吵更具撕裂力。",
      s: "無我相。把受傷的我消融掉。",
      a: "寫下憤怒後撕碎紙。銷毀暗能量。",
    },
    {
      q: "情緒像多普勒效應警笛，站定不動，它終會遠去。",
      s: "如露亦如電。別追著聲音跑。",
      a: "想像站在路邊，目送憤怒車輛遠離。",
    },
    {
      q: "水沸騰需潛熱。用憤怒能量完成生命相變。",
      s: "煩惱即菩提。利用這股火，煉出金丹。",
      a: "利用能量去完成一件拖延的困難工作。",
    },
    {
      q: "觀察者效應：盯著錯誤看，就在塌陷錯誤實相。",
      s: "應無所住。別把心停在垃圾上。",
      a: "轉頭看樹。強制切換目標，讓實相崩解。",
    },
    {
      q: "別讓外境磁場感應出內心亂流。您是絕緣體。",
      s: "心如止水。保持內在平靜屬性。",
      a: "觀想自己是透明水晶，情緒光線穿透。",
    },
    {
      q: "憤怒源於我被壓縮太緊（強核力）。",
      s: "破除我執。無我，誰在受傷？",
      a: "想像自我擴大包容宇宙，小刺扎不到。",
    },
    {
      q: "攻擊是耗損動能；忍耐是積累勢能。",
      s: "退一步海闊天空。忍辱是積蓄高度。",
      a: "閉嘴三分鐘。將動能轉化為內在勢能。",
    },
    {
      q: "情緒有半衰期。給點時間，它會衰變為無害。",
      s: "諸行無常。沒情緒是永久的。",
      a: "看秒針走一圈，告訴自己：這也會過去。",
    },
    {
      q: "憤怒是破壞性干涉。發出讚美波形成建設性干涉。",
      s: "因緣和合。善念能改變場域。",
      a: "心中默念對方一個優點，中和負波。",
    },
    {
      q: "量子穿隧：別撞牆，意識可直接穿透憤怒之牆。",
      s: "觀自在。心無掛礙，牆本幻象。",
      a: "觀想自己像光，穿透困難到達彼岸。",
    },
    {
      q: "情緒是真空漲落的泡沫。別把泡沫當海洋。",
      s: "本來無一物。看著泡沫破滅。",
      a: "深呼吸，把注意力放在呼吸進出。",
    },
    {
      q: "成為超導體（零電阻），讓情緒流過不生熱。",
      s: "清淨心。無阻力，即無煩惱。",
      a: "放鬆身體每一個關節，讓能量通暢。",
    },
    {
      q: "光電效應：用智慧光子撞擊心靈，讓執著電子逃逸。",
      s: "智慧之光。覺知一亮，黑暗即消。",
      a: "讀一句有力量的經文或格言。",
    },
    {
      q: "憤怒極限是毀滅奇點。到達前立刻掉頭。",
      s: "回頭是岸。苦海無邊。",
      a: "轉身離開現場，物理移動帶動心理移動。",
    },
    {
      q: "重力透鏡：憤怒扭曲了真相。您看到的不是事實。",
      s: "歪曲見解。心平氣和才能見真章。",
      a: "告訴自己：我戴著有色眼鏡，先不判斷。",
    },
    {
      q: "背景輻射：嘈雜背後有永恆寂靜。傾聽那寂靜。",
      s: "寂滅為樂。心靈深處本自寧靜。",
      a: "尋找念頭間的空隙，休息一下。",
    },
    {
      q: "費米悖論：這場戲只有您一人在演。",
      s: "獨頭意識。別自導自演悲情劇。",
      a: "對鏡子做個鬼臉，嘲笑嚴肅的自己。",
    },
    {
      q: "慈悲是負熵，能重建秩序對抗混亂。",
      s: "慈悲喜捨。愛能消融一切。",
      a: "對自己微笑，原諒自己的情緒。",
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
    {
      q: "物質波：萬物皆波。是意識觀測賦予實體感。",
      s: "萬法唯識。價值是心賦予的。",
      a: "想像想要之物化為光霧消散。",
    },
    {
      q: "物質是真空擾動。抓取的只是虛空漣漪。",
      s: "妙有真空。欣賞漣漪，別想帶回家。",
      a: "深呼吸，感受無形之氣比金重要。",
    },
    {
      q: "慾望如吸積盤，越轉越快掉入虛無。",
      s: "貪嗔癡五蓋。蓋住智慧看不清。",
      a: "靜坐一分鐘，讓心靈吸積盤減速。",
    },
    {
      q: "得失是疊加態。心選匱乏才塌陷出匱乏。",
      s: "如夢幻泡影。得失醒來全無。",
      a: "選擇感恩觀測。列出三件美好事物。",
    },
    {
      q: "持有越多位能越高，跌落越痛。",
      s: "放下屠刀（貪執）。",
      a: "極簡思考：遠行只能帶三樣，帶什麼？",
    },
    {
      q: "熱力學第一定律：只進不出會過熱壞死。",
      s: "布施波羅蜜。布施是疏通心靈淤塞。",
      a: "給外送員微笑或感謝，微小布施。",
    },
    {
      q: "貪婪超過臨界質量會引發崩潰連鎖反應。",
      s: "知止不殆。知停比知進更智慧。",
      a: "設定足夠標準：這夠好了，停。",
    },
    {
      q: "多巴胺迴路騙您快樂，給的卻是空虛。",
      s: "受即是空。別做化學反應奴隸。",
      a: "看著衝動冷卻，別隨之起舞。",
    },
    {
      q: "費曼圖：獲得只是能量短暫交會。",
      s: "緣起性空。來去皆緣分。",
      a: "練習不擁有。賞花而不摘花。",
    },
    {
      q: "佔有即排他。獨占隔絕了宇宙豐盛。",
      s: "心包太虛。不佔有而享有，世界是您的。",
      a: "真心為別人的所得高興，打破心牆。",
    },
    {
      q: "讓財富如超流體流過，不黏著無阻力。",
      s: "應無所住。心不住錢，錢為您用。",
      a: "想像金錢如水流經雙手，滋潤萬物。",
    },
    {
      q: "財富如虛粒子生滅極快。別執著閃光。",
      s: "如露亦如電。看清無常不患得患失。",
      a: "關注價值而非價格。",
    },
    {
      q: "物質越多資訊熵越高，生活越混亂。",
      s: "度一切苦厄。簡化即降熵。",
      a: "刪除手機多餘資訊，體驗減負。",
    },
    {
      q: "與物質耦合太強被牽著走。調低參數。",
      s: "解脫知見。解脫是對什麼都不黏著。",
      a: "練習抽離：這只是暫時由我保管。",
    },
    {
      q: "暗物質（陰德）才是主宰命運的真財富。",
      s: "三輪體空。善事不留心，功德無量。",
      a: "做件沒人知的好事，感受內心充實。",
    },
    {
      q: "貪婪視界無法回頭。現在就轉身。",
      s: "回頭是岸。",
      a: "把購物車清空，或取消一個慾望清單。",
    },
    {
      q: "別在物質層爬梯。量子跳躍到精神軌道。",
      s: "頓悟。心境一轉，貧富立判。",
      a: "讀一段經文，享受精神的富足。",
    },
    {
      q: "貪念擾動時空製造阻力。布施撫平時空。",
      s: "心能轉境。善念能開路。",
      a: "捐出一筆小錢，感受障礙消除。",
    },
    {
      q: "外境誘惑是微擾。別影響核心哈密頓量。",
      s: "不動心。守住本心。",
      a: "觀想自己是座山，雲霧飄過不動。",
    },
    {
      q: "貪快導致視野變窄。慢下來看清全貌。",
      s: "欲速則不達。",
      a: "慢慢喝杯茶，品味過程。",
    },
    {
      q: "宇宙膨脹趨勢是散。順應天道學會放散。",
      s: "成住壞空。聚散有時。",
      a: "把不再用的東西送給需要的人。",
    },
    {
      q: "物質是粒子排列組合。您執著哪種排列？",
      s: "四大皆空。本質皆同。",
      a: "看透名牌包也是原子，與塑膠袋無異。",
    },
    {
      q: "貪婪源於對稱性破缺（分別）。回歸平等。",
      s: "平等性智。無高下之分。",
      a: "對貴重與廉價之物一視同仁。",
    },
    {
      q: "路徑積分：通往豐盛路徑無限。別執一條。",
      s: "條條大路通羅馬。",
      a: "放寬心，相信會有別的辦法。",
    },
    {
      q: "真空蘊含零點能量。向內求本自具足。",
      s: "自性圓滿。您就是發電機。",
      a: "感恩自己擁有的才華與健康。",
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
    {
      q: "困在三維迷宮。提升維度全貌一目了然。",
      s: "般若智慧。智慧是渡河舟。",
      a: "想像坐雲端往下看，煩惱多渺小？",
    },
    {
      q: "煩惱是雜訊，智慧是訊號。提高信噪比。",
      s: "清淨心。拂去塵埃鏡自明。",
      a: "閉眼聆聽細微聲音，暫停大腦雜訊。",
    },
    {
      q: "圖靈測試：腦中聲音是真我還是程式？",
      s: "是誰在念佛？反聞聞自性。",
      a: "對腦中聲音說：謝謝意見，但我作主。",
    },
    {
      q: "萬物一體，無獨立之我。界線是虛幻的。",
      s: "同體大悲。眾生苦即我苦。",
      a: "看路人想：他就是另一個我。",
    },
    {
      q: "選擇受害者視角才塌陷出苦。改視角改實相。",
      s: "唯心所現。心變世界變。",
      a: "問：這件事要教會我什麼？",
    },
    {
      q: "哥德爾定理：邏輯有極限。跳出邏輯用直覺。",
      s: "言語道斷。真理是悟出來的。",
      a: "放下「為什麼」，接受「是什麼」。",
    },
    {
      q: "放大到普朗克長度皆空隙。別在塵埃打轉。",
      s: "微塵眾。別對幻象太認真。",
      a: "抬頭看蒼穹，煩惱佔多少像素？",
    },
    {
      q: "鏡像神經元：評判別人其實是評判自己。",
      s: "自他不二。鏡中無別人。",
      a: "想批評時，先檢查自己有無同毛病。",
    },
    {
      q: "壓力致認知隧道窄化。放鬆看見全景。",
      s: "破迷開悟。退一步海闊天空。",
      a: "深呼吸三次，想像視野變寬。",
    },
    {
      q: "思緒背後有永恆寂靜背景。連結寂靜。",
      s: "寂滅為樂。快樂在內心寧靜。",
      a: "尋找念頭間空隙，休息一下。",
    },
    {
      q: "墨菲定律：越怕越出錯。轉向想要結果。",
      s: "心想事成。心畫出天堂地獄。",
      a: "想像順利完成畫面，感受喜悅。",
    },
    {
      q: "思維無限遞迴即輪迴。需中斷指令跳出。",
      s: "流轉生死。覺知斬斷輪迴。",
      a: "站起來走動，身體動作中斷大腦。",
    },
    {
      q: "費馬原理：光走最短路徑。智慧走最簡路。",
      s: "直心是道場。坦誠直率最省力。",
      a: "用最簡單直接方式處理。",
    },
    {
      q: "大腦壓縮真相致失真。展開細節重新審視。",
      s: "詳盡觀察。看事實本來面目。",
      a: "拿掉形容詞，只敘述事實。",
    },
    {
      q: "錨定效應鎖死第一印象。每一刻皆全新。",
      s: "無住生心。活在當下鮮活一刻。",
      a: "當作第一次發生，用新手眼光看。",
    },
    {
      q: "倖存者偏差：別只看失敗，忽略沈默數據。",
      s: "正見。客觀評估不被恐懼帶偏。",
      a: "尋找成功案例，增強信心。",
    },
    {
      q: "達克效應：無知者自信。承認不知是智慧。",
      s: "謙卑心。空杯才能裝水。",
      a: "告訴自己：我也許有盲點。",
    },
    {
      q: "別解析他人黑箱內心，控制自己輸入。",
      s: "反求諸己。",
      a: "做好自己該做的，結果交給天。",
    },
    {
      q: "貝葉斯更新：據新證據更新信念。別死守。",
      s: "日日新。不執著舊見。",
      a: "接納新資訊，修正原本看法。",
    },
    {
      q: "平行宇宙：選擇善念即進入天堂頻率宇宙。",
      s: "一念三千。",
      a: "當下做個善良選擇，切換宇宙軌道。",
    },
    {
      q: "神經可塑性：轉念即重接線路。升級硬體。",
      s: "修行改命。",
      a: "堅持正面思考，重塑大腦結構。",
    },
    {
      q: "最小作用量：順流而行，不逆勢對抗。",
      s: "隨順因緣。",
      a: "觀察局勢，順著風向調整帆。",
    },
    {
      q: "大爆炸源於奇點。煩惱源於一念無明。",
      s: "一念不生。",
      a: "回到念頭生起前的那一刻。",
    },
    {
      q: "量子擦除：當下觀測可改變過去業力。",
      s: "懺悔業障。",
      a: "真心懺悔，清洗過去路徑資訊。",
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
    {
      q: "鎖在慣性坐標系覺靜止。換位可能倒退。",
      s: "隨喜功德。欣賞別人優點。",
      a: "讚美一個您討厭的人的優點。",
    },
    {
      q: "別做互斥費米子，做共容玻色子。",
      s: "和光同塵。不露鋒芒。",
      a: "融入群體，做聆聽者。",
    },
    {
      q: "視差效應：對錯因角度不同。移步換位。",
      s: "偏見無明。瞎子摸象。",
      a: "站對方鞋子裡感受。",
    },
    {
      q: "暗物質支撐星系。幕後付出者是基石。",
      s: "厚德載物。學大地沈默。",
      a: "感謝幕後支持者。",
    },
    {
      q: "我慢重力大飛不出輪迴。放下身段飛翔。",
      s: "解脫束縛。放下架子即解鎖。",
      a: "做件有失身分的小事（如撿垃圾）。",
    },
    {
      q: "超新星爆發是死亡前兆。收斂光芒長存。",
      s: "光芒內斂。深藏若虛。",
      a: "做好事不留名。",
    },
    {
      q: "傲慢是駐波空轉。流動成行波傳播善意。",
      s: "固執是苦。像水適應容器。",
      a: "試著照別人建議做做看。",
    },
    {
      q: "打擊是阻尼，讓傲慢振幅停下。感謝逆境。",
      s: "調伏自心。逆境是老師。",
      a: "遇反對先說謝謝提醒。",
    },
    {
      q: "別做絕熱過程。熱交換平衡生命溫度。",
      s: "冷暖自知。感知別人冷暖。",
      a: "關心朋友近況不談自己。",
    },
    {
      q: "轉速快離心力大甩飛人。減速聚人。",
      s: "背道而馳。回歸中心連結。",
      a: "主動凝聚大家。",
    },
    {
      q: "鏡像對稱：討厭傲慢是照見自己傲慢。",
      s: "心鏡。外境是投射。",
      a: "反省自己是否也曾這樣？",
    },
    {
      q: "真空能量爆發毀宇宙。別讓小宇宙失控。",
      s: "四大假合。身是借的驕傲啥？",
      a: "觀想死後回歸大地。",
    },
    {
      q: "熱平衡是趨勢。順應流動回歸平衡。",
      s: "平常心。不高不低。",
      a: "對話中讓對方多說，平衡話語權。",
    },
    {
      q: "結構越高越不穩。地基（德）比樓（名）重。",
      s: "高處不勝寒。紮根泥土。",
      a: "補強基本功或修養。",
    },
    {
      q: "孤芳自賞稀釋糾纏。連結擴展生命網。",
      s: "廣結善緣。人緣即法緣。",
      a: "主動幫助陌生人。",
    },
    {
      q: "多體問題複雜難算。敬畏世界複雜性。",
      s: "因緣不可思議。",
      a: "放下掌控，尊重因緣。",
    },
    {
      q: "相干性：融入集體能量大。",
      s: "眾志成城。",
      a: "尋求合作，不單打獨鬥。",
    },
    {
      q: "拓撲缺陷：宇宙本有缺陷。包容不完美。",
      s: "圓融無礙。",
      a: "接納自己和他人的缺點。",
    },
    {
      q: "重力位移：高位時間慢。下來體會疾苦。",
      s: "同體大悲。",
      a: "去基層或前線看看。",
    },
    {
      q: "虛像：面子是放大虛像。戳破它。",
      s: "鏡花水月。",
      a: "自嘲一下，放下形象包袱。",
    },
    {
      q: "邊界條件：傲慢是自設邊界。打破合一。",
      s: "無緣大慈。",
      a: "跨出舒適圈，接觸不同的人。",
    },
    {
      q: "反物質：傲慢遇真相湮滅。勇敢面對。",
      s: "實事求是。",
      a: "面對真實的數據或反饋。",
    },
    {
      q: "混沌邊緣：中道最繁榮。不僵化放縱。",
      s: "中道智慧。",
      a: "保持彈性，不過度自信或自卑。",
    },
    { q: "重整化：消除無限大自我。", s: "無我。", a: "把我縮小，把世界放大。" },
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
    {
      q: "擔憂之事在概率雲邊緣。專注核心高機率。",
      s: "夢幻泡影。恐懼一戳就破。",
      a: "理性評估發生機率。",
    },
    {
      q: "海森堡顯微鏡：看未來當下模糊。回當下。",
      s: "觀照自心。力量在現在。",
      a: "極致專注眼前正在做的事。",
    },
    {
      q: "熱寂：煩惱終散。何必現在糾結？",
      s: "涅槃寂靜。一切會過去。",
      a: "想像百年後誰記得這煩惱？",
    },
    {
      q: "雜念退相干成死板現實。保留可能性。",
      s: "放下執著。世界變鮮活。",
      a: "對未知說Yes，放鬆控制。",
    },
    {
      q: "虛時間：時間幻覺。顧好當下即顧好永遠。",
      s: "三世一時。安住當下。",
      a: "五分鐘內只活當下不煩惱。",
    },
    {
      q: "多重宇宙：調頻到成功版本共振下載自信。",
      s: "隨緣不變。用不變應萬變。",
      a: "想像成功自己給您微笑。",
    },
    {
      q: "芝諾悖論：飛矢不動。專注切片焦慮停。",
      s: "制心一處。風暴吹不動。",
      a: "專注數呼吸一到十。",
    },
    {
      q: "隨機遊走：總體前進。信任過程。",
      s: "應無所住。繼續走通。",
      a: "說：這只是過程。繼續前進。",
    },
    {
      q: "恐懼轉洞察力。檢查風險做好準備。",
      s: "轉識成智。恐懼是警報。",
      a: "列出風險並寫下應對。",
    },
    {
      q: "不安來自潛意識暗流。看見即解脫。",
      s: "照見五蘊空。看清無力量。",
      a: "靜坐問恐懼：你想說什麼？",
    },
    {
      q: "膨脹中找宇宙常數。核心價值是不變錨點。",
      s: "如如不動。守住中心。",
      a: "寫下三個核心價值觀。",
    },
    {
      q: "費米能階：填滿低階才往上。做好小事。",
      s: "腳踏實地。行遠必自邇。",
      a: "整理桌子洗碗，找回掌控。",
    },
    {
      q: "重力助推：利用逆境加速甩向目標。",
      s: "順勢而為。借力使力。",
      a: "問：困難如何助我成長？",
    },
    {
      q: "時空是泡沫生滅。煩惱也是泡沫。",
      s: "生滅無常。很快過去。",
      a: "看雲想像煩惱飄散。",
    },
    {
      q: "非定域性：解方千里外感應來。保持開放。",
      s: "感應道交。發出訊號。",
      a: "向宇宙求助，留意徵兆。",
    },
    {
      q: "相空間：狀態無限。別困在恐懼角落。",
      s: "遊舞三昧。",
      a: "想像自己在跳舞，靈活移動。",
    },
    {
      q: "遍歷性：低谷是過程。高峰必來。",
      s: "否極泰來。",
      a: "耐心等待，蓄勢待發。",
    },
    {
      q: "弱測量：溫柔覺察恐懼，別驚擾它。",
      s: "慈悲觀照。",
      a: "輕輕看著恐懼，不批判。",
    },
    {
      q: "全同粒子：眾生煩惱皆同。非一人受苦。",
      s: "大悲心。",
      a: "發願代眾生受苦，苦即消。",
    },
    {
      q: "自組織臨界：崩塌為穩態。崩潰是重組。",
      s: "破立。",
      a: "接受混亂，信任新秩序。",
    },
    {
      q: "規範場論：混亂背後有對稱。宇宙善意。",
      s: "法界有序。",
      a: "信任宇宙的底層邏輯。",
    },
    {
      q: "真空衰變：舊狀態不穩讓它去。新態更穩。",
      s: "徹底放下。",
      a: "放手讓舊模式崩解。",
    },
    {
      q: "時間箭頭：不可逆。致力當下做功。",
      s: "活在當下。",
      a: "做一件現在能改變的小事。",
    },
  ],
};

// --- Components ---

const WisdomCard = ({ type, data, onClose, onRefresh }) => {
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

export default function SpiritPivotFinalRelease() {
  const [dailyInfo, setDailyInfo] = useState({
    ganZhi: "",
    palace: "",
    stars: "",
    actionText: "",
    displayStars: "",
    displaySiHua: "",
    luckyColor: "",
  });
  const [todayDate, setTodayDate] = useState({ western: "", lunar: "" });
  const [activeType, setActiveType] = useState(null);
  const [currentWisdom, setCurrentWisdom] = useState(null);
  const [lastWisdomIndex, setLastWisdomIndex] = useState({});
  const [journalNote, setJournalNote] = useState("");
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // 1. 初始化日期
    const now = new Date();
    const western = now.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
    });
    let lunar = "";
    try {
      // Change month: 'long' to month: 'numeric'
      const lunarDate = new Intl.DateTimeFormat("zh-TW-u-ca-chinese", {
        month: "numeric",
        day: "numeric",
      }).format(now);
      lunar = lunarDate.replace("月", "月 ").replace("日", "");
    } catch (e) {
      lunar = "農曆運算中";
    }
    setTodayDate({ western, lunar });

    // 2. 核心命理演算 (Precision Engine v4)
    const { stem, branch, branchKey } = getPrecisionGanZhi(now);

    const dailyData = NATAL_CHART[branchKey];
    const dailySiHua = SI_HUA_TABLE[stem];

    // 生成內容
    const { displayStars, displaySiHua, highlightColor, actionText } =
      generateDailyContent(
        dailyData.stars,
        dailyData.palace,
        dailySiHua,
        stem,
        dailyData.main
      );

    setDailyInfo({
      ganZhi: `${stem}${branch}日`,
      palace: dailyData.palace,
      stars: dailyData.stars,
      displayStars: displayStars,
      displaySiHua: displaySiHua,
      highlightColor: highlightColor,
      actionText: actionText,
    });

    // 3. Load Logs
    const savedLogs = localStorage.getItem("spiritPivotMasterLogs");
    if (savedLogs) setLogs(JSON.parse(savedLogs));
  }, []);

  const getRandomWisdom = (type) => {
    const pool = WISDOM_LIBRARY[type] || WISDOM_LIBRARY["doubt"];
    if (pool.length <= 1) return pool[0];
    let newIndex;
    const lastIndex = lastWisdomIndex[type];
    let attempts = 0;
    do {
      newIndex = Math.floor(Math.random() * pool.length);
      attempts++;
    } while (newIndex === lastIndex && attempts < 5);
    setLastWisdomIndex((prev) => ({ ...prev, [type]: newIndex }));
    return pool[newIndex];
  };

  const handleCapture = (type) => {
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
              : "bg-indigo-900"
          }`}
        ></div>
      </div>

      {/* Header */}
      <header className="px-6 pt-10 pb-6 z-10 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-md sticky top-0 flex justify-between items-start">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-100 to-amber-500 flex items-center gap-2">
            <Compass size={22} className="text-amber-500" />
            靈樞 · 覺行
          </h1>
          <div className="flex items-center gap-2 mt-2 text-[11px] font-mono text-slate-400 tracking-wide">
            <span className="text-slate-300">{todayDate.western}</span>
            <span className="text-slate-600">|</span>
            <span className="text-amber-500/80">農曆 {todayDate.lunar}</span>
          </div>
        </div>

        {/* Profile Button (Non-interactive) */}
        <div className="mt-1 flex flex-col items-end gap-1 group z-50 relative cursor-default">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-full px-3 py-1.5 shadow-lg relative z-20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-bold text-slate-300">丙午</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono tracking-tighter bg-slate-900/30 px-2 py-0.5 rounded border border-slate-800/50 flex items-center gap-1">
            {dailyInfo.ganZhi}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-5 z-10 custom-scrollbar pb-24">
        {/* Daily Fate - Top Section (Pure Info) */}
        <section className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={16} className="text-amber-500" />
            <h2 className="text-sm font-bold text-slate-300">今日導航</h2>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-5 relative overflow-hidden shadow-xl">
            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-slate-700/50 pb-3">
                <span className="text-xs font-bold text-indigo-400 bg-indigo-950/50 px-2 py-1 rounded border border-indigo-500/30">
                  {dailyInfo.palace}
                </span>
                <span
                  className={`text-xs font-mono font-bold ${dailyInfo.highlightColor}`}
                >
                  {dailyInfo.displaySiHua}
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white tracking-wide mb-1">
                  {dailyInfo.displayStars}
                </h3>
              </div>
            </div>
          </div>
        </section>

        {/* Action Guide - Bottom Section (Unity of Knowledge and Action) */}
        <section className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          <div
            className={`bg-slate-950/60 border rounded-2xl p-5 relative overflow-hidden ${
              dailyInfo.highlightColor.includes("rose")
                ? "border-rose-900/30"
                : dailyInfo.highlightColor.includes("amber")
                ? "border-amber-900/30"
                : "border-emerald-900/30"
            }`}
          >
            <div
              className={`absolute top-0 left-0 w-1 h-full ${
                dailyInfo.highlightColor.includes("rose")
                  ? "bg-rose-500/50"
                  : dailyInfo.highlightColor.includes("amber")
                  ? "bg-amber-500/50"
                  : "bg-emerald-500/50"
              }`}
            ></div>
            <div className="flex items-center gap-2 mb-3">
              <Activity
                size={16}
                className={
                  dailyInfo.highlightColor.includes("rose")
                    ? "text-rose-500"
                    : dailyInfo.highlightColor.includes("amber")
                    ? "text-amber-500"
                    : "text-emerald-500"
                }
              />
              <h2
                className={`text-sm font-bold ${
                  dailyInfo.highlightColor.includes("rose")
                    ? "text-rose-500"
                    : dailyInfo.highlightColor.includes("amber")
                    ? "text-amber-500"
                    : "text-emerald-500"
                }`}
              >
                知行合一
              </h2>
            </div>
            <p className="text-sm text-slate-300 leading-loose text-justify font-serif tracking-wide whitespace-pre-wrap">
              {dailyInfo.actionText}
            </p>
          </div>
        </section>

        {/* Instant Interceptor */}
        <section>
          <div className="flex items-center justify-between mb-4">
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
          <div className="mt-8 pt-4 border-t border-slate-800">
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
