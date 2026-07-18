import "./styles.css";
import { Capacitor, CapacitorHttp } from "@capacitor/core";

type ExpectType = "json" | "text";
type Tone = "ok" | "warn" | "error";

interface RequestOptions {
  method?: "GET" | "POST";
  query?: Record<string, string | number | boolean | null | undefined>;
  form?: Record<string, string | number | boolean | null | undefined>;
  expect?: ExpectType;
  allowEmpty?: boolean;
}

interface StatusData {
  state?: string;
  time?: string;
  date?: string;
  tds?: number;
  tdsPure?: number;
  tdsRaw?: number;
  temp?: number;
  tempPure?: number;
  tempRaw?: number;
  water?: string;
  rem?: number;
  tdsq?: string;
  ip?: string;
  net?: string;
  rssi?: number;
  tdsen?: boolean;
  tempen?: boolean;
  tdsPureProbe?: boolean;
  tdsRawProbe?: boolean;
  tempPureProbe?: boolean;
  tempRawProbe?: boolean;
}

interface ParamsData {
  mk?: number;
  dly?: number;
  wsh?: number;
  slp?: number;
  vol?: number;
  tdth?: number;
  voc?: boolean;
  buz?: boolean;
  tdsen?: boolean;
}

interface FilterData {
  name: string;
  date: string;
  life: number;
}

interface WifiData {
  ssid?: string;
  hasPass?: boolean;
}

interface TimeData {
  valid?: boolean;
  date?: string;
  time?: string;
  source?: string;
  rtc?: boolean;
  datetime?: string;
}

interface TtsData {
  appid?: string;
  hasToken?: boolean;
  voice?: string;
  total?: number;
  cache?: number;
  ready?: boolean;
  en?: boolean;
  flashReady?: boolean;
  flashTaskRunning?: boolean;
  flashQueued?: boolean;
  flashResultKnown?: boolean;
  flashLastOk?: boolean;
  cacheRunning?: boolean;
  cachePending?: boolean;
}

interface ScreenData {
  ltx?: number;
  lty?: number;
  rtx?: number;
  rty?: number;
  mx?: number;
  my?: number;
  lbx?: number;
  lby?: number;
  rbx?: number;
  rby?: number;
  cbx?: number;
  cby?: number;
  bt?: string;
  bs?: string;
  bd?: number;
  rot?: number;
}

interface LogsData {
  count?: number;
  freeHeap?: number;
  items?: string[];
}

interface WifiScanResult {
  status?: string;
  list?: Array<{ ssid: string; rssi: number; secure: string }>;
}

const PRIMARY_BASE_URL = "http://192.168.15.119";
const FALLBACK_BASE_URLS = [
  PRIMARY_BASE_URL,
  "http://ik.cccpc.cc:18080",
  "http://192.168.4.1",
];
const STATUS_POLL_MS = 5000;
const COMMAND_LABELS: Record<string, string> = {
  make: "手动制水",
  wash: "手动冲洗",
  stop: "停止运行",
  reset: "设备复位",
};
const FILTER_NAMES = ["1级 PP棉", "2级 颗粒炭", "3级 烧结炭", "4级 RO膜", "5级 后置炭"];
const SCREEN_COORD_FIELDS = [
  "ltx",
  "lty",
  "rtx",
  "rty",
  "mx",
  "my",
  "lbx",
  "lby",
  "rbx",
  "rby",
  "cbx",
  "cby",
] as const;
const SCREEN_FIELD_LABELS: Record<(typeof SCREEN_COORD_FIELDS)[number], string> = {
  ltx: "左上 X",
  lty: "左上 Y",
  rtx: "右上 X",
  rty: "右上 Y",
  mx: "主区 X",
  my: "主区 Y",
  lbx: "左下 X",
  lby: "左下 Y",
  rbx: "右下 X",
  rby: "右下 Y",
  cbx: "底中 X",
  cby: "底中 Y",
};

const appState = {
  filters: [] as FilterData[],
  activeFilterIndex: 0,
  wifiHasSavedPassword: false,
  savedWifiSsid: "",
  pollTimer: 0 as number | undefined,
  activeBaseUrl: "",
  hasLoadedStatus: false,
};

const root = document.querySelector<HTMLDivElement>("#app");

if (!root) {
  throw new Error("App root not found");
}

root.innerHTML = `
  <div class="app-shell">
    <div class="ambient ambient-a"></div>
    <div class="ambient ambient-b"></div>

    <header class="topbar compact-topbar">
      <div class="brand-emblem" aria-hidden="true"></div>
      <div class="brand-block">
        <div class="brand-head">
          <p class="app-title">净水智控</p>
          <span class="runtime-pill pending-pill" id="heroNet">待连接</span>
        </div>
        <div class="brand-bottom">
          <h1 class="top-state" id="overviewState">待机</h1>
          <button id="syncBtn" class="glass-icon-button icon-only" type="button" aria-label="刷新">↻</button>
        </div>
      </div>
    </header>

    <section class="status-banner" id="statusLine" data-tone="warn">
      <strong class="status-text" id="statusText">正在同步</strong>
    </section>

    <main class="app-main">
      <section class="panel active" id="panel-overview">
        <section class="hero-card hero-panel">
          <div class="hero-topline">
            <span class="hero-chip" id="metricState">待机</span>
            <span class="hero-chip secondary" id="metricRssi">-- dBm</span>
          </div>

          <div class="hero-layout">
            <div class="hero-core">
              <p class="hero-kicker">纯水品质</p>
              <h2 class="hero-reading" id="metricTds">-- ppm</h2>
              <p class="hero-reading-sub" id="metricRawTds">原水 -- ppm</p>

              <div class="hero-mini-row">
                <article class="hero-mini-card">
                  <span>当前时间</span>
                  <strong id="overviewTime">--:--</strong>
                </article>
                <article class="hero-mini-card">
                  <span>纯水判定</span>
                  <strong id="overviewQuality">--</strong>
                </article>
              </div>
            </div>

            <div class="hero-side-stack">
              <article class="hero-side-card">
                <span>剩余时间</span>
                <strong id="heroRemain">--:--</strong>
              </article>
              <article class="hero-side-card accent">
                <span>水位状态</span>
                <strong id="overviewWater">--</strong>
              </article>
              <article class="hero-side-card">
                <span>连接方式</span>
                <strong id="overviewAccess">--</strong>
              </article>
            </div>
          </div>
        </section>

        <section class="glass-card control-panel">
          <div class="section-head">
            <div>
              <h3>快捷控制</h3>
              <p>常用操作</p>
            </div>
          </div>
          <div class="action-grid">
            <button class="action-card action-make" data-command="make" type="button">
              <span class="action-card-icon">▶</span>
              <strong>手动制水</strong>
              <span>开始</span>
            </button>
            <button class="action-card action-wash" data-command="wash" type="button">
              <span class="action-card-icon">⟳</span>
              <strong>手动冲洗</strong>
              <span>执行</span>
            </button>
            <button class="action-card action-stop" data-command="stop" type="button">
              <span class="action-card-icon">■</span>
              <strong>停止运行</strong>
              <span>结束</span>
            </button>
            <button class="action-card action-reset" data-command="reset" type="button">
              <span class="action-card-icon">↺</span>
              <strong>复位</strong>
              <span>重置</span>
            </button>
          </div>
        </section>

        <section class="glass-card detail-panel">
          <div class="section-head">
            <h3>运行细节</h3>
          </div>
          <div class="detail-grid">
            <article class="detail-card">
              <span class="metric-label">原水 TDS</span>
              <strong id="metricRawTdsCard">-- ppm</strong>
            </article>
            <article class="detail-card">
              <span class="metric-label">纯水温度</span>
              <strong id="metricTemp">-- °C</strong>
            </article>
            <article class="detail-card">
              <span class="metric-label">原水温度</span>
              <strong id="metricRawTemp">-- °C</strong>
            </article>
            <article class="detail-card detail-card-accent">
              <span class="metric-label">网络状态</span>
              <strong id="metricNet">--</strong>
            </article>
          </div>
        </section>
      </section>

      <section class="panel" id="panel-filters">
        <section class="glass-card">
          <div class="section-head">
            <h3>滤芯管理</h3>
            <p>更换周期与寿命状态</p>
          </div>
          <div class="filter-list" id="filterList"></div>
          <div class="form-grid">
            <label class="field">
              <span>滤芯名称</span>
              <input id="filterName" type="text" />
            </label>
            <label class="field">
              <span>安装日期</span>
              <input id="filterDate" type="date" />
            </label>
            <label class="field">
              <span>寿命（月）</span>
              <input id="filterLife" type="number" min="1" max="120" step="1" />
            </label>
          </div>
          <div class="button-row">
            <button id="filterTodayBtn" class="btn ghost" type="button">今天</button>
            <button id="saveFilterBtn" class="btn primary" type="button">保存</button>
            <button id="resetFilterBtn" class="btn secondary" type="button">重置当前</button>
            <button id="resetAllFiltersBtn" class="btn danger" type="button">全部重置</button>
          </div>
        </section>
      </section>

      <section class="panel" id="panel-settings">
        <section class="glass-card">
          <div class="section-head">
            <h3>运行参数</h3>
            <p>运行节奏与阈值设定</p>
          </div>
          <div class="form-grid">
            <label class="field">
              <span>制水超时</span>
              <input id="param-mk" type="number" min="5" max="240" step="5" />
            </label>
            <label class="field">
              <span>停止延时</span>
              <input id="param-dly" type="number" min="0" max="600" step="5" />
            </label>
            <label class="field">
              <span>冲洗时长</span>
              <input id="param-wsh" type="number" min="0" max="600" step="5" />
            </label>
            <label class="field">
              <span>屏幕休眠</span>
              <input id="param-slp" type="number" min="0" max="120" step="5" />
            </label>
            <label class="field">
              <span>语音音量</span>
              <input id="param-vol" type="number" min="0" max="30" step="1" />
            </label>
            <label class="field">
              <span>TDS 阈值</span>
              <input id="param-tdth" type="number" min="0" max="999" step="10" />
            </label>
            <label class="switch-row">
              <span>语音播报</span>
              <input id="param-voc" type="checkbox" />
            </label>
            <label class="switch-row">
              <span>蜂鸣器</span>
              <input id="param-buz" type="checkbox" />
            </label>
            <label class="switch-row">
              <span>TDS 模块</span>
              <input id="param-tdsen" type="checkbox" />
            </label>
          </div>
          <div class="button-row">
            <button id="loadParamsBtn" class="btn ghost" type="button">读取</button>
            <button id="saveParamsBtn" class="btn primary" type="button">保存</button>
          </div>
        </section>

        <section class="glass-card">
          <div class="section-head">
            <h3>WiFi</h3>
            <p>无线网络与扫描列表</p>
          </div>
          <div class="form-grid">
            <label class="field">
              <span>WiFi 名称</span>
              <input id="wifiSsid" type="text" placeholder="WiFi" />
            </label>
            <label class="field">
              <span>WiFi 密码</span>
              <input id="wifiPass" type="password" placeholder="密码" />
            </label>
          </div>
          <div class="button-row">
            <button id="scanWifiBtn" class="btn ghost" type="button">扫描</button>
            <button id="saveWifiBtn" class="btn primary" type="button">保存</button>
          </div>
          <p class="status-line compact" id="wifiStatus">--</p>
          <div class="wifi-list" id="wifiList"></div>
        </section>

        <section class="glass-card">
          <div class="section-head">
            <h3>时间</h3>
            <p>同步 NTP 或手动指定</p>
          </div>
          <p class="status-line compact" id="timeState">--</p>
          <label class="field">
            <span>手动时间</span>
            <input id="manualTime" type="datetime-local" />
          </label>
          <div class="button-row">
            <button id="syncTimeBtn" class="btn ghost" type="button">校时</button>
            <button id="saveTimeBtn" class="btn primary" type="button">保存</button>
          </div>
        </section>

        <section class="glass-card">
          <div class="section-head">
            <h3>语音</h3>
            <p>播报引擎与缓存状态</p>
          </div>
          <div class="form-grid">
            <label class="field">
              <span>App ID</span>
              <input id="ttsAppid" type="text" />
            </label>
            <label class="field">
              <span>Access Token</span>
              <input id="ttsToken" type="password" placeholder="Token" />
            </label>
            <label class="field wide">
              <span>Voice</span>
              <input id="ttsVoice" type="text" />
            </label>
          </div>
          <div class="stats-grid compact-grid">
            <article class="metric-card">
              <span class="metric-label">缓存进度</span>
              <strong id="voiceCacheRatio">0 / 0</strong>
            </article>
            <article class="metric-card">
              <span class="metric-label">语音状态</span>
              <strong id="voiceReadyState">--</strong>
            </article>
            <article class="metric-card">
              <span class="metric-label">TF 卡状态</span>
              <strong id="voiceFlashState">--</strong>
            </article>
            <article class="metric-card">
              <span class="metric-label">缓存启用</span>
              <strong id="voiceEnabledState">--</strong>
            </article>
          </div>
          <div class="button-row">
            <button id="saveTtsBtn" class="btn primary" type="button">保存</button>
            <button id="primeVoiceBtn" class="btn secondary" type="button">预缓存</button>
            <button id="clearVoiceBtn" class="btn danger" type="button">清空</button>
            <button id="probeVoiceBtn" class="btn ghost" type="button">探测 TF</button>
          </div>
          <p class="status-line compact" id="voiceStatus">--</p>
        </section>

        <section class="glass-card">
          <div class="section-head">
            <h3>屏幕</h3>
            <p>坐标与开机文案</p>
          </div>
          <div class="form-grid" id="screenFieldGrid"></div>
          <div class="form-grid">
            <label class="field wide">
              <span>启动标题</span>
              <input id="screenBt" type="text" />
            </label>
            <label class="field wide">
              <span>启动副标题</span>
              <input id="screenBs" type="text" />
            </label>
            <label class="field">
              <span>启动时长</span>
              <input id="screenBd" type="number" min="0" max="10" step="1" />
            </label>
            <label class="field">
              <span>旋转方向</span>
              <select id="screenRot">
                <option value="0">0 度</option>
                <option value="1">90 度</option>
                <option value="2">180 度</option>
                <option value="3">270 度</option>
              </select>
            </label>
          </div>
          <div class="button-row">
            <button id="loadScreenBtn" class="btn ghost" type="button">读取</button>
            <button id="saveScreenBtn" class="btn primary" type="button">保存</button>
          </div>
        </section>
      </section>

      <section class="panel" id="panel-logs">
        <section class="glass-card">
          <div class="section-head logs-head">
            <h3>运行日志</h3>
            <p>查看设备最近状态变化</p>
            <span class="runtime-pill" id="logMeta">日志 0 条</span>
          </div>
          <div class="button-row">
            <button id="refreshLogsBtn" class="btn ghost" type="button">刷新</button>
            <button id="clearLogsBtn" class="btn danger" type="button">清空</button>
          </div>
          <pre class="log-box" id="logText">暂无日志。</pre>
        </section>
      </section>
    </main>

    <nav class="bottom-nav" id="tabs">
      <button class="tab active" data-target="overview"><span>首页</span></button>
      <button class="tab" data-target="filters"><span>滤芯</span></button>
      <button class="tab" data-target="settings"><span>设置</span></button>
      <button class="tab" data-target="logs"><span>日志</span></button>
    </nav>
  </div>
`;

window.addEventListener("error", (event) => {
  renderFatalScreen(describeError(event.error ?? event.message));
});

window.addEventListener("unhandledrejection", (event) => {
  renderFatalScreen(describeError(event.reason));
});

try {
  renderScreenFields();
  initializeNetworkTargets();
  bindTabs();
  bindActions();
  bindGlassMotion();
  syncAll().catch((error) => updateStatusLine(describeError(error), "error"));
} catch (error) {
  renderFatalScreen(describeError(error));
}

function bindTabs(): void {
  document.querySelectorAll<HTMLButtonElement>(".tab").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll<HTMLButtonElement>(".tab").forEach((item) => item.classList.remove("active"));
      document.querySelectorAll<HTMLElement>(".panel").forEach((panel) => panel.classList.remove("active"));
      button.classList.add("active");
      document.getElementById(`panel-${button.dataset.target}`)?.classList.add("active");
    });
  });
}

function bindActions(): void {
  getButton("syncBtn").addEventListener("click", () => syncAll().catch(handleError));

  document.querySelectorAll<HTMLButtonElement>("[data-command]").forEach((button) => {
    button.addEventListener("click", async () => {
      const command = button.dataset.command;
      if (!command) return;
      try {
        const commandLabel = COMMAND_LABELS[command] || command;
        button.disabled = true;
        await apiRequest("/api/cmd", { query: { c: command }, allowEmpty: true });
        await refreshStatusAfterCommand();
      } catch (error) {
        updateStatusLine(describeError(error), "error");
      } finally {
        button.disabled = false;
      }
    });
  });

  getButton("loadParamsBtn").addEventListener("click", () => loadParams().catch(handleError));
  getButton("saveParamsBtn").addEventListener("click", () => saveParams().catch(handleError));
  getButton("filterTodayBtn").addEventListener("click", setFilterToday);
  getButton("saveFilterBtn").addEventListener("click", () => saveCurrentFilter().catch(handleError));
  getButton("resetFilterBtn").addEventListener("click", () => resetCurrentFilter().catch(handleError));
  getButton("resetAllFiltersBtn").addEventListener("click", () => resetAllFilters().catch(handleError));
  getButton("scanWifiBtn").addEventListener("click", () => scanWifi().catch(handleError));
  getButton("saveWifiBtn").addEventListener("click", () => saveWifi().catch(handleError));
  getButton("syncTimeBtn").addEventListener("click", () => syncTime().catch(handleError));
  getButton("saveTimeBtn").addEventListener("click", () => saveTime().catch(handleError));
  getButton("saveTtsBtn").addEventListener("click", () => saveTts().catch(handleError));
  getButton("primeVoiceBtn").addEventListener("click", () => primeVoiceCache().catch(handleError));
  getButton("clearVoiceBtn").addEventListener("click", () => clearVoiceCache().catch(handleError));
  getButton("probeVoiceBtn").addEventListener("click", () => probeVoiceFlash().catch(handleError));
  getButton("loadScreenBtn").addEventListener("click", () => loadScreen().catch(handleError));
  getButton("saveScreenBtn").addEventListener("click", () => saveScreen().catch(handleError));
  getButton("refreshLogsBtn").addEventListener("click", () => loadLogs().catch(handleError));
  getButton("clearLogsBtn").addEventListener("click", () => clearLogs().catch(handleError));
}

function bindGlassMotion(): void {
  const rootStyle = document.documentElement.style;
  const updateGlass = (): void => {
    const y = window.scrollY || 0;
    const x = Math.sin(y / 90) * 8;
    const drift = Math.min(y / 260, 1);
    rootStyle.setProperty("--glass-pan-x", `${x.toFixed(2)}px`);
    rootStyle.setProperty("--glass-pan-y", `${(y * 0.08).toFixed(2)}px`);
    rootStyle.setProperty("--glass-drift", drift.toFixed(3));
    rootStyle.setProperty("--glass-glow-x", `${50 + Math.sin(y / 140) * 10}%`);
    rootStyle.setProperty("--glass-glow-y", `${18 + Math.cos(y / 180) * 10}%`);
  };
  updateGlass();
  window.addEventListener("scroll", updateGlass, { passive: true });
}

function initializeNetworkTargets(): void {
  appState.activeBaseUrl = PRIMARY_BASE_URL;
  applyHeroNetState("待连接", "pending");
}

function renderScreenFields(): void {
  const host = getElement<HTMLDivElement>("screenFieldGrid");
  host.innerHTML = SCREEN_COORD_FIELDS.map(
    (field) => `
      <label class="field">
        <span>${SCREEN_FIELD_LABELS[field]}</span>
        <input id="screen-${field}" type="number" min="0" max="128" step="1" />
      </label>
    `,
  ).join("");
}

async function syncAll(): Promise<void> {
  updateStatusLine("", "ok");
  await loadStatus();
  const results = await Promise.allSettled([loadParams(), loadFilters(), loadWifi(), loadTime(), loadTts(), loadScreen(), loadLogs()]);
  schedulePolling();
  const failedCount = results.filter((result) => result.status === "rejected").length;
  if (failedCount > 0) {
    updateStatusLine(`部分数据未连通`, "warn");
    return;
  }
  updateStatusLine("", "ok");
}

async function refreshStatusAfterCommand(): Promise<void> {
  const delays = [240, 520, 880];
  for (const delay of delays) {
    await sleep(delay);
    try {
      await loadStatus();
      return;
    } catch {
      continue;
    }
  }
}

function schedulePolling(): void {
  if (appState.pollTimer) {
    window.clearInterval(appState.pollTimer);
  }
  appState.pollTimer = window.setInterval(() => {
    loadStatus().catch(() => undefined);
  }, STATUS_POLL_MS);
}

async function loadStatus(): Promise<void> {
  try {
    const data = await apiRequest<StatusData>("/api/status");
    const accessMode = formatAccessMode(data);
    appState.hasLoadedStatus = true;
    setText("metricState", data.state || "--");
    setText("metricNet", data.net || "--");
    setText("metricTime", data.time || "--:--");
    setText("metricTds", formatTdsValue(data.tdsPure ?? data.tds, data.tdsen !== false, data.tdsPureProbe));
    setText("metricRawTds", `原水 ${formatTdsValue(data.tdsRaw, data.tdsen !== false, data.tdsRawProbe)}`);
    setText("metricRawTdsCard", formatTdsValue(data.tdsRaw, data.tdsen !== false, data.tdsRawProbe));
    setText("metricTemp", formatTempValue(data.tempPure ?? data.temp, data.tempen !== false, data.tempPureProbe));
    setText("metricRawTemp", formatTempValue(data.tempRaw, data.tempen !== false, data.tempRawProbe));
    setText("metricWater", data.water || "--");
    setText("metricRemain", formatDuration(data.rem));
    setText("metricQuality", formatTdsQuality(data));
    setText("metricAccess", accessMode);
    setText("metricRssi", Number.isFinite(data.rssi) ? `${data.rssi} dBm` : "-- dBm");
    setText("overviewState", data.state || "待机");
    applyHeroNetState(formatOnlineLabel(data), data.net?.includes("离线") ? "offline" : "online");
    setText("overviewTime", data.time || "--:--");
    setText("overviewWater", data.water || "--");
    setText("overviewQuality", formatTdsQuality(data));
    setText("overviewAccess", accessMode);
    setText("overviewSignal", Number.isFinite(data.rssi) ? `${data.rssi} dBm` : "-- dBm");
    setText("heroRemain", formatDuration(data.rem));
  } catch (error) {
    applyHeroNetState("离线", "offline");
    setText("metricState", "离线");
    setText("metricNet", "--");
    setText("metricRssi", "-- dBm");
    if (!appState.hasLoadedStatus) {
      setText("overviewState", "未连接");
    }
    throw error;
  }
}

async function loadParams(): Promise<void> {
  const data = await apiRequest<ParamsData>("/api/getparams");
  setFieldValue("param-mk", String(data.mk ?? 60));
  setFieldValue("param-dly", String(data.dly ?? 30));
  setFieldValue("param-wsh", String(data.wsh ?? 60));
  setFieldValue("param-slp", String(data.slp ?? 0));
  setFieldValue("param-vol", String(data.vol ?? 25));
  setFieldValue("param-tdth", String(data.tdth ?? 100));
  setCheckboxValue("param-voc", Boolean(data.voc));
  setCheckboxValue("param-buz", Boolean(data.buz));
  setCheckboxValue("param-tdsen", data.tdsen !== false);
}

async function saveParams(): Promise<void> {
  await apiRequest("/api/save", {
    query: {
      mk: getFieldValue("param-mk"),
      dly: getFieldValue("param-dly"),
      wsh: getFieldValue("param-wsh"),
      slp: getFieldValue("param-slp"),
      vol: getFieldValue("param-vol"),
      tdth: getFieldValue("param-tdth"),
      voc: getCheckboxValue("param-voc") ? 1 : 0,
      buz: getCheckboxValue("param-buz") ? 1 : 0,
      tdsen: getCheckboxValue("param-tdsen") ? 1 : 0,
    },
    allowEmpty: true,
  });
  updateStatusLine("参数已保存", "ok");
  await loadParams();
}

async function loadFilters(): Promise<void> {
  const raw = await apiRequest<FilterData[]>("/api/filters");
  appState.filters = (raw || []).map((item, index) => ({
    name: item.name || FILTER_NAMES[index] || `滤芯 ${index + 1}`,
    date: (item.date || "2026-01-01").slice(0, 10),
    life: Number(item.life) || 6,
  }));
  while (appState.filters.length < FILTER_NAMES.length) {
    appState.filters.push({
      name: FILTER_NAMES[appState.filters.length],
      date: "2026-01-01",
      life: 6,
    });
  }
  if (appState.activeFilterIndex >= appState.filters.length) {
    appState.activeFilterIndex = 0;
  }
  renderFilterCards();
  fillActiveFilterEditor();
}

function renderFilterCards(): void {
  const host = getElement<HTMLDivElement>("filterList");
  host.innerHTML = appState.filters
    .map((filter, index) => {
      const active = index === appState.activeFilterIndex ? " active" : "";
      return `
        <button class="filter-card${active}" type="button" data-filter-index="${index}">
          <span>${escapeHtml(filter.name)}</span>
          <strong>${escapeHtml(filter.date)}</strong>
          <small>${filter.life} 个月</small>
        </button>
      `;
    })
    .join("");

  host.querySelectorAll<HTMLButtonElement>("[data-filter-index]").forEach((button) => {
    button.addEventListener("click", () => {
      appState.activeFilterIndex = Number(button.dataset.filterIndex || 0);
      renderFilterCards();
      fillActiveFilterEditor();
    });
  });
}

function fillActiveFilterEditor(): void {
  const current = appState.filters[appState.activeFilterIndex];
  if (!current) return;
  setFieldValue("filterName", current.name);
  setFieldValue("filterDate", current.date);
  setFieldValue("filterLife", String(current.life));
}

function setFilterToday(): void {
  setFieldValue("filterDate", new Date().toISOString().slice(0, 10));
}

async function saveCurrentFilter(): Promise<void> {
  const index = appState.activeFilterIndex;
  const name = getFieldValue("filterName").trim() || FILTER_NAMES[index];
  const date = getFieldValue("filterDate");
  const life = Number(getFieldValue("filterLife")) || 6;
  await apiRequest("/api/savefilter", { query: { id: index, date, life }, allowEmpty: true });
  appState.filters[index] = { name, date, life };
  renderFilterCards();
  updateStatusLine(`滤芯 ${index + 1} 已保存`, "ok");
}

async function resetCurrentFilter(): Promise<void> {
  await apiRequest("/api/resetfilter", { query: { id: appState.activeFilterIndex }, allowEmpty: true });
  updateStatusLine(`滤芯 ${appState.activeFilterIndex + 1} 已重置`, "ok");
  await loadFilters();
}

async function resetAllFilters(): Promise<void> {
  await apiRequest("/api/resetallfilters", { allowEmpty: true });
  updateStatusLine("全部滤芯已重置", "ok");
  await loadFilters();
}

async function loadWifi(): Promise<void> {
  const data = await apiRequest<WifiData>("/api/wifi");
  appState.savedWifiSsid = data.ssid || "";
  appState.wifiHasSavedPassword = Boolean(data.hasPass);
  setFieldValue("wifiSsid", data.ssid || "");
  setFieldValue("wifiPass", "");
  getInput("wifiPass").placeholder = data.hasPass ? "留空保留原密码" : "密码";
  setStatusMessage("wifiStatus", "WiFi 已读取", "ok");
}

async function scanWifi(): Promise<void> {
  setStatusMessage("wifiStatus", "扫描中", "warn");
  const host = getElement<HTMLDivElement>("wifiList");
  host.innerHTML = "";
  const data = await apiRequest<WifiScanResult>("/api/wifiscan");
  if (data.status === "scanning") {
    window.setTimeout(() => scanWifi().catch(handleError), 800);
    return;
  }
  if (data.status !== "done") {
    setStatusMessage("wifiStatus", "扫描失败", "error");
    return;
  }
  const list = data.list || [];
  if (!list.length) {
    setStatusMessage("wifiStatus", "未找到 WiFi", "warn");
    return;
  }
  host.innerHTML = list
    .map(
      (item) => `
        <button class="wifi-item" type="button" data-ssid="${escapeAttribute(item.ssid)}">
          <span>${escapeHtml(item.ssid)}</span>
          <small>${item.rssi} dBm · ${escapeHtml(item.secure || "未知")}</small>
        </button>
      `,
    )
    .join("");
  host.querySelectorAll<HTMLButtonElement>("[data-ssid]").forEach((button) => {
    button.addEventListener("click", () => {
      setFieldValue("wifiSsid", button.dataset.ssid || "");
      setStatusMessage("wifiStatus", `已选择 ${button.dataset.ssid || ""}`, "ok");
    });
  });
  setStatusMessage("wifiStatus", "扫描完成", "ok");
}

async function saveWifi(): Promise<void> {
  const ssid = getFieldValue("wifiSsid");
  const pass = getFieldValue("wifiPass");
  const keep = !pass && appState.wifiHasSavedPassword && ssid === appState.savedWifiSsid ? 1 : 0;
  await apiRequest("/api/savewifi", { method: "POST", form: { ssid, pass, keep }, allowEmpty: true });
  setStatusMessage("wifiStatus", "WiFi 已保存", "ok");
  await loadWifi();
}

async function loadTime(): Promise<void> {
  const data = await apiRequest<TimeData>("/api/time");
  const stamp = data.valid ? `${data.date || "--"} ${data.time || "--"}` : "--";
  setStatusMessage("timeState", stamp, "ok");
  if (data.datetime) {
    setFieldValue("manualTime", data.datetime);
  }
}

async function syncTime(): Promise<void> {
  await apiRequest("/api/synctime", { allowEmpty: true });
  setStatusMessage("timeState", "已发送校时", "warn");
  await loadTime();
}

async function saveTime(): Promise<void> {
  const raw = getFieldValue("manualTime");
  if (!raw) {
    setStatusMessage("timeState", "请选择时间", "warn");
    return;
  }
  const epoch = Math.floor(new Date(raw).getTime() / 1000);
  await apiRequest("/api/settime", { method: "POST", form: { epoch }, allowEmpty: true });
  setStatusMessage("timeState", "时间已保存", "ok");
  await loadTime();
}

async function loadTts(): Promise<void> {
  const data = await apiRequest<TtsData>("/api/tts");
  setFieldValue("ttsAppid", data.appid || "");
  setFieldValue("ttsToken", "");
  getInput("ttsToken").placeholder = data.hasToken ? "留空保留" : "Token";
  setFieldValue("ttsVoice", data.voice || "zh_female_wanwanxiaohe_moon_bigtts");
  setText("voiceCacheRatio", `${data.cache || 0} / ${data.total || 0}`);
  setText("voiceReadyState", data.ready === false ? "待配置" : (data.cache || 0) >= (data.total || 0) && (data.total || 0) > 0 ? "已完成" : "未完成");
  setText("voiceFlashState", data.flashReady ? "已挂载" : data.flashTaskRunning ? "挂载中" : data.flashQueued ? "排队中" : data.flashResultKnown ? "失败" : "未检测");
  setText("voiceEnabledState", data.en === false ? "关闭" : "启用");
  setStatusMessage("voiceStatus", "语音已读取", "ok");
}

async function saveTts(): Promise<void> {
  await apiRequest("/api/tts", {
    method: "POST",
    form: {
      en: 1,
      appid: getFieldValue("ttsAppid"),
      token: getFieldValue("ttsToken"),
      voice: getFieldValue("ttsVoice"),
      keep: getFieldValue("ttsToken") ? 0 : 1,
    },
    allowEmpty: true,
  });
  setStatusMessage("voiceStatus", "语音已保存", "ok");
  await loadTts();
}

async function primeVoiceCache(): Promise<void> {
  await apiRequest("/api/voicecache", { method: "POST", query: { c: "prime" }, allowEmpty: true });
  setStatusMessage("voiceStatus", "已开始缓存", "warn");
  await loadTts();
}

async function clearVoiceCache(): Promise<void> {
  const result = await apiRequest<string>("/api/voicecache", { method: "POST", query: { c: "clear" }, expect: "text" });
  setStatusMessage("voiceStatus", result || "缓存已清空", "ok");
  await loadTts();
}

async function probeVoiceFlash(): Promise<void> {
  await apiRequest("/api/voiceflash", { method: "POST", query: { c: "probe" }, allowEmpty: true });
  setStatusMessage("voiceStatus", "已探测 TF", "warn");
  await loadTts();
}

async function loadScreen(): Promise<void> {
  const data = await apiRequest<ScreenData>("/api/getscreen");
  SCREEN_COORD_FIELDS.forEach((field) => setFieldValue(`screen-${field}`, String(data[field] ?? 0)));
  setFieldValue("screenBt", data.bt || "");
  setFieldValue("screenBs", data.bs || "");
  setFieldValue("screenBd", String(data.bd ?? 2));
  setSelectValue("screenRot", String(data.rot ?? 0));
}

async function saveScreen(): Promise<void> {
  await apiRequest("/api/savescreen", {
    query: {
      bt: getFieldValue("screenBt"),
      bs: getFieldValue("screenBs"),
      bd: getFieldValue("screenBd"),
      rot: getFieldValue("screenRot"),
    },
    allowEmpty: true,
  });
  updateStatusLine("屏幕参数已保存", "ok");
  await loadScreen();
}

async function loadLogs(): Promise<void> {
  const data = await apiRequest<LogsData>("/api/logs");
  const heap = data.freeHeap ? ` · ${Math.round(data.freeHeap / 1024)}KB` : "";
  setText("logMeta", `日志 ${data.count || 0}${heap}`);
  setText("logText", (data.items || []).join("\n") || "暂无日志。");
}

async function clearLogs(): Promise<void> {
  await apiRequest("/api/clearlogs", { allowEmpty: true });
  updateStatusLine("日志已清空", "ok");
  await loadLogs();
}

async function apiRequest<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const candidates = resolveBaseUrlCandidates();
  let lastError: unknown = null;
  for (const baseUrl of candidates) {
    try {
      const result = await requestWithBaseUrl<T>(baseUrl, path, options);
      appState.activeBaseUrl = baseUrl;
      return result;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("请求失败");
}

async function requestWithBaseUrl<T>(baseUrl: string, path: string, options: RequestOptions = {}): Promise<T> {
  const url = new URL(path, `${baseUrl}/`);
  Object.entries(options.query || {}).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    url.searchParams.set(key, String(value));
  });

  const method = options.method || "GET";
  const expect = options.expect || "json";
  const allowEmpty = options.allowEmpty ?? false;
  const body = new URLSearchParams();
  Object.entries(options.form || {}).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    body.set(key, String(value));
  });

  if (Capacitor.isNativePlatform()) {
    const response = await CapacitorHttp.request({
      url: url.toString(),
      method,
      headers: body.size ? { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" } : undefined,
      data: body.size ? body.toString() : undefined,
      responseType: "text",
      readTimeout: 1800,
      connectTimeout: 1800,
    });
    if (response.status >= 400) {
      throw new Error(`请求失败：HTTP ${response.status}`);
    }
    const raw = typeof response.data === "string" ? response.data : response.data == null ? "" : JSON.stringify(response.data);
    if (expect === "text") {
      return raw as T;
    }
    return parseJsonPayload<T>(raw, allowEmpty);
  }

  const response = await fetch(url.toString(), {
    method,
    headers: body.size ? { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" } : undefined,
    body: method === "POST" ? body.toString() : undefined,
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`请求失败：HTTP ${response.status}`);
  }
  const raw = await response.text();
  if (expect === "text") {
    return raw as T;
  }
  return parseJsonPayload<T>(raw, allowEmpty);
}

function formatTdsValue(value: number | undefined, enabled: boolean, probePresent: boolean | undefined): string {
  if (!enabled) return "模块关闭";
  if (!probePresent) return "未安装";
  return Number.isFinite(Number(value)) ? `${Number(value)} ppm` : "-- ppm";
}

function formatTempValue(value: number | undefined, enabled: boolean, probePresent: boolean | undefined): string {
  if (!enabled) return "模块关闭";
  if (!probePresent) return "未安装";
  return Number.isFinite(Number(value)) ? `${Number(value).toFixed(1)} °C` : "-- °C";
}

function formatTdsQuality(data: StatusData): string {
  if (data.tdsen === false) return "已关闭";
  if (!data.tdsPureProbe && !data.tdsRawProbe) return "未安装";
  return data.tdsq || "--";
}

function formatDuration(value: number | undefined): string {
  if (!Number.isFinite(value) || Number(value) <= 0) return "--:--";
  const total = Number(value);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatDeviceAddress(data: StatusData): string {
  return data.ip?.trim() || getConfiguredGatewayHost();
}

function formatAccessMode(data: StatusData): string {
  const ip = data.ip?.trim() || "";
  if (ip.startsWith("192.168.4.")) return "设备热点";
  if (/^(10\\.|192\\.168\\.|172\\.(1[6-9]|2\\d|3[0-1])\\.)/.test(ip)) return "局域网";
  if (data.net?.includes("WiFi")) return "局域网";
  return "远程入口";
}

function formatOnlineLabel(data: StatusData): string {
  if (data.net?.includes("离线")) return "离线";
  if (data.net?.includes("在线")) return "在线";
  return data.ip?.trim() ? "在线" : "待连接";
}

function formatClock(date: Date): string {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getConfiguredGatewayHost(): string {
  try {
    return new URL(appState.activeBaseUrl || FALLBACK_BASE_URLS[0]).host;
  } catch {
    return appState.activeBaseUrl || FALLBACK_BASE_URLS[0];
  }
}

function resolveBaseUrlCandidates(): string[] {
  const values = [appState.activeBaseUrl, PRIMARY_BASE_URL, ...FALLBACK_BASE_URLS]
    .map((value) => normalizeBaseUrl(value))
    .filter(Boolean);
  return Array.from(new Set(values));
}

function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const input = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  try {
    const url = new URL(input);
    url.pathname = "";
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

function applyHeroNetState(label: string, tone: "online" | "offline" | "pending"): void {
  const element = getElement<HTMLElement>("heroNet");
  element.textContent = label;
  element.classList.remove("online-pill", "offline-pill", "pending-pill");
  if (tone === "online") element.classList.add("online-pill");
  if (tone === "offline") element.classList.add("offline-pill");
  if (tone === "pending") element.classList.add("pending-pill");
}

function parseJsonPayload<T>(raw: string, allowEmpty: boolean): T {
  const trimmed = raw.trim();
  if (!trimmed) {
    if (allowEmpty) {
      return undefined as T;
    }
    throw new Error("请求失败：空响应");
  }

  try {
    return JSON.parse(trimmed) as T;
  } catch (error) {
    if (allowEmpty && /^(ok|success|done|queued)$/i.test(trimmed)) {
      return undefined as T;
    }
    throw new Error(`接口返回了非 JSON 文本：${trimmed.slice(0, 80)}`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function updateStatusLine(message: string, tone: Tone = "ok"): void {
  setStatusMessage("statusLine", message, tone);
}

function setStatusMessage(id: string, message: string, tone: Tone): void {
  const element = getElement<HTMLElement>(id);
  element.dataset.tone = tone;
  if (id === "statusLine") {
    const shouldShow = Boolean(message) && tone !== "ok";
    setText("statusText", shouldShow ? message : "");
    element.hidden = !shouldShow;
    return;
  }
  element.textContent = message;
}

function setText(id: string, value: string): void {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

function setFieldValue(id: string, value: string): void {
  getField(id).value = value;
}

function setSelectValue(id: string, value: string): void {
  getSelect(id).value = value;
}

function setCheckboxValue(id: string, value: boolean): void {
  getInput(id).checked = value;
}

function getFieldValue(id: string): string {
  return getField(id).value;
}

function getCheckboxValue(id: string): boolean {
  return getInput(id).checked;
}

function getField(id: string): HTMLInputElement | HTMLSelectElement {
  const element = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;
  if (!element) throw new Error(`Field not found: ${id}`);
  return element;
}

function getInput(id: string): HTMLInputElement {
  const element = document.getElementById(id) as HTMLInputElement | null;
  if (!element) throw new Error(`Input not found: ${id}`);
  return element;
}

function getSelect(id: string): HTMLSelectElement {
  const element = document.getElementById(id) as HTMLSelectElement | null;
  if (!element) throw new Error(`Select not found: ${id}`);
  return element;
}

function getButton(id: string): HTMLButtonElement {
  const element = document.getElementById(id) as HTMLButtonElement | null;
  if (!element) throw new Error(`Button not found: ${id}`);
  return element;
}

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id) as T | null;
  if (!element) throw new Error(`Element not found: ${id}`);
  return element;
}

function handleError(error: unknown): void {
  updateStatusLine(describeError(error), "error");
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : "操作失败";
}

function renderFatalScreen(message: string): void {
  root.innerHTML = `
    <div class="app-shell">
      <div class="ambient ambient-a"></div>
      <div class="ambient ambient-b"></div>
      <section class="hero-card" style="margin-top: 18vh;">
        <div class="section-head">
          <h3>净水智控</h3>
        </div>
        <div class="status-line" data-tone="error" style="margin-top: 18px;">
          ${escapeHtml(message || "启动失败")}
        </div>
      </section>
    </div>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll("`", "");
}
