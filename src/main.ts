import "./styles.css";
import { Capacitor, CapacitorHttp } from "@capacitor/core";

type ExpectType = "json" | "text";
type Tone = "ok" | "warn" | "error";

interface RequestOptions {
  method?: "GET" | "POST";
  query?: Record<string, string | number | boolean | null | undefined>;
  form?: Record<string, string | number | boolean | null | undefined>;
  expect?: ExpectType;
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

interface ConnectionProfile {
  id: string;
  name: string;
  url: string;
}

const STORAGE_BASE_URL = "purewater.baseUrl";
const STORAGE_AUTO_REFRESH = "purewater.autoRefresh";
const STORAGE_PROFILES = "purewater.profiles";
const STATUS_POLL_MS = 5000;
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
const defaultProfiles: ConnectionProfile[] = [{ id: "hotspot", name: "设备热点", url: "http://192.168.4.1" }];

const appState = {
  baseUrl: localStorage.getItem(STORAGE_BASE_URL) ?? "http://192.168.4.1",
  autoRefresh: localStorage.getItem(STORAGE_AUTO_REFRESH) !== "0",
  profiles: loadProfiles(),
  filters: [] as FilterData[],
  activeFilterIndex: 0,
  wifiHasSavedPassword: false,
  savedWifiSsid: "",
  pollTimer: 0 as number | undefined,
};

const root = document.querySelector<HTMLDivElement>("#app");

if (!root) {
  throw new Error("App root not found");
}

root.innerHTML = `
  <div class="app-shell">
    <div class="ambient ambient-a"></div>
    <div class="ambient ambient-b"></div>

    <header class="topbar">
      <div>
        <p class="eyebrow">Pure Water Mobile</p>
        <h1 id="appPageTitle">设备总览</h1>
        <p class="page-copy" id="appPageSubtitle">打开就能看到设备状态、关键数据和最常用的控制入口。</p>
      </div>
      <div class="topbar-actions">
        <span class="runtime-pill" id="runtimeMode">${Capacitor.isNativePlatform() ? "原生容器" : "浏览器调试"}</span>
        <button id="syncBtn" class="glass-icon-button" type="button">刷新</button>
      </div>
    </header>

    <section class="status-banner" id="statusLine" data-tone="warn">正在等待首次同步。</section>

    <main class="app-main">
      <section class="panel active" id="panel-overview">
        <section class="hero-card">
          <div class="hero-card-head">
            <div>
              <div class="device-pill">
                <span class="device-pill-dot"></span>
                <span id="heroNet">等待连接</span>
              </div>
              <h2 id="overviewState">尚未连接到净水器</h2>
              <p class="hero-copy">首页做成真正的移动端仪表盘风格，不再是网页后台表单的展开版本。</p>
            </div>
            <button id="connectBtn" class="btn primary connect-button" type="button">连接并同步</button>
          </div>

          <div class="hero-grid">
            <article class="hero-metric">
              <span>当前时间</span>
              <strong id="overviewTime">--:--</strong>
            </article>
            <article class="hero-metric">
              <span>设备地址</span>
              <strong id="overviewAddress">--</strong>
            </article>
            <article class="hero-metric">
              <span>纯水判定</span>
              <strong id="overviewQuality">--</strong>
            </article>
            <article class="hero-metric">
              <span>信号强度</span>
              <strong id="overviewSignal">-- dBm</strong>
            </article>
          </div>
        </section>

        <section class="glass-card">
          <div class="section-head">
            <div>
              <h3>快捷控制</h3>
              <p>大按钮、低认知负担、单手点按舒服一点。</p>
            </div>
          </div>
          <div class="action-grid">
            <button class="action-card action-make" data-command="make" type="button">
              <strong>手动制水</strong>
              <span>立即开始制水</span>
            </button>
            <button class="action-card action-wash" data-command="wash" type="button">
              <strong>手动洗膜</strong>
              <span>执行冲洗动作</span>
            </button>
            <button class="action-card action-stop" data-command="stop" type="button">
              <strong>停止</strong>
              <span>停止当前流程</span>
            </button>
            <button class="action-card action-reset" data-command="reset" type="button">
              <strong>复位</strong>
              <span>重置设备状态</span>
            </button>
          </div>
        </section>

        <section class="glass-card">
          <div class="section-head">
            <div>
              <h3>实时指标</h3>
              <p>把关键数据压进手机节奏更顺手的两列卡片布局。</p>
            </div>
          </div>
          <div class="stats-grid">
            <article class="metric-card metric-featured">
              <span class="metric-label">运行状态</span>
              <strong id="metricState">--</strong>
            </article>
            <article class="metric-card metric-featured">
              <span class="metric-label">水位状态</span>
              <strong id="metricWater">--</strong>
            </article>
            <article class="metric-card">
              <span class="metric-label">纯水 TDS</span>
              <strong id="metricTds">-- ppm</strong>
            </article>
            <article class="metric-card">
              <span class="metric-label">原水 TDS</span>
              <strong id="metricRawTds">-- ppm</strong>
            </article>
            <article class="metric-card">
              <span class="metric-label">纯水温度</span>
              <strong id="metricTemp">-- °C</strong>
            </article>
            <article class="metric-card">
              <span class="metric-label">原水温度</span>
              <strong id="metricRawTemp">-- °C</strong>
            </article>
            <article class="metric-card">
              <span class="metric-label">网络</span>
              <strong id="metricNet">--</strong>
            </article>
            <article class="metric-card">
              <span class="metric-label">设备地址</span>
              <strong id="metricIp">--</strong>
            </article>
            <article class="metric-card">
              <span class="metric-label">当前时间</span>
              <strong id="metricTime">--:--</strong>
            </article>
            <article class="metric-card">
              <span class="metric-label">剩余时间</span>
              <strong id="metricRemain">--:--</strong>
            </article>
            <article class="metric-card">
              <span class="metric-label">纯水判定</span>
              <strong id="metricQuality">--</strong>
            </article>
            <article class="metric-card">
              <span class="metric-label">信号强度</span>
              <strong id="metricRssi">-- dBm</strong>
            </article>
          </div>
        </section>
      </section>

      <section class="panel" id="panel-filters">
        <section class="glass-card">
          <div class="section-head">
            <div>
              <h3>滤芯管理</h3>
              <p>做成更像耗材中心的样子，而不是设备后台里的一排输入框。</p>
            </div>
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
            <button id="filterTodayBtn" class="btn ghost" type="button">设为今天</button>
            <button id="saveFilterBtn" class="btn primary" type="button">保存当前滤芯</button>
            <button id="resetFilterBtn" class="btn secondary" type="button">重置当前滤芯</button>
            <button id="resetAllFiltersBtn" class="btn danger" type="button">重置全部滤芯</button>
          </div>
        </section>
      </section>

      <section class="panel" id="panel-settings">
        <section class="glass-card">
          <div class="section-head">
            <div>
              <h3>连接与地址</h3>
              <p>热点、局域网和 VPN 里的固定地址，统一放在真正的设置页里。</p>
            </div>
          </div>
          <div class="form-grid">
            <label class="field wide">
              <span>设备地址</span>
              <input id="baseUrl" type="text" placeholder="http://192.168.4.1" />
            </label>
            <label class="switch-row">
              <span>自动刷新状态</span>
              <input id="autoRefresh" type="checkbox" />
            </label>
          </div>
          <div class="button-row">
            <button id="saveProfileBtn" class="btn secondary" type="button">保存当前地址</button>
          </div>
          <label class="field">
            <span>快捷地址名称</span>
            <input id="profileName" type="text" placeholder="例如：家里内网 / 设备热点" />
          </label>
          <div class="quick-profile-list" id="quickProfileList"></div>
          <p class="hint" id="connectionHint">浏览器调试时如果设备没有开启 CORS，跨域请求可能失败；安装到手机后会优先使用原生 HTTP 通道。</p>
        </section>

        <section class="glass-card">
          <div class="section-head">
            <div>
              <h3>运行参数</h3>
              <p>保持全部控制能力，但交互改成更像 iPhone 设置页。</p>
            </div>
          </div>
          <div class="form-grid">
            <label class="field">
              <span>制水超时（分钟）</span>
              <input id="param-mk" type="number" min="5" max="240" step="5" />
            </label>
            <label class="field">
              <span>停止延时（秒）</span>
              <input id="param-dly" type="number" min="0" max="600" step="5" />
            </label>
            <label class="field">
              <span>洗膜时长（秒）</span>
              <input id="param-wsh" type="number" min="0" max="600" step="5" />
            </label>
            <label class="field">
              <span>屏幕休眠（分钟）</span>
              <input id="param-slp" type="number" min="0" max="120" step="5" />
            </label>
            <label class="field">
              <span>语音音量</span>
              <input id="param-vol" type="number" min="0" max="30" step="1" />
            </label>
            <label class="field">
              <span>TDS 报警阈值（ppm）</span>
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
            <button id="loadParamsBtn" class="btn ghost" type="button">读取参数</button>
            <button id="saveParamsBtn" class="btn primary" type="button">保存参数</button>
          </div>
        </section>

        <section class="glass-card">
          <div class="section-head">
            <div>
              <h3>WiFi 与时间</h3>
              <p>配网和校时收进一张卡，避免在多个页面之间来回找。</p>
            </div>
          </div>
          <div class="form-grid">
            <label class="field">
              <span>WiFi 名称</span>
              <input id="wifiSsid" type="text" placeholder="请输入路由器名称" />
            </label>
            <label class="field">
              <span>WiFi 密码</span>
              <input id="wifiPass" type="password" placeholder="请输入 WiFi 密码" />
            </label>
          </div>
          <div class="button-row">
            <button id="scanWifiBtn" class="btn ghost" type="button">扫描 WiFi</button>
            <button id="saveWifiBtn" class="btn primary" type="button">保存并重连</button>
          </div>
          <p class="status-line compact" id="wifiStatus">等待读取 WiFi 配置。</p>
          <div class="wifi-list" id="wifiList"></div>
          <div class="inline-divider"></div>
          <p class="status-line compact" id="timeState">等待读取时间状态。</p>
          <label class="field">
            <span>手动设置时间</span>
            <input id="manualTime" type="datetime-local" />
          </label>
          <div class="button-row">
            <button id="syncTimeBtn" class="btn ghost" type="button">网络校时</button>
            <button id="saveTimeBtn" class="btn primary" type="button">保存手动时间</button>
          </div>
        </section>

        <section class="glass-card">
          <div class="section-head">
            <div>
              <h3>语音与缓存</h3>
              <p>把云语音、TF 卡和缓存状态做成更像移动工具的组合模块。</p>
            </div>
          </div>
          <div class="form-grid">
            <label class="field">
              <span>App ID</span>
              <input id="ttsAppid" type="text" />
            </label>
            <label class="field">
              <span>Access Token</span>
              <input id="ttsToken" type="password" placeholder="留空表示保留已保存 Token" />
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
            <button id="saveTtsBtn" class="btn primary" type="button">保存语音配置</button>
            <button id="primeVoiceBtn" class="btn secondary" type="button">开始预缓存</button>
            <button id="clearVoiceBtn" class="btn danger" type="button">清空缓存</button>
            <button id="probeVoiceBtn" class="btn ghost" type="button">重新探测 TF 卡</button>
          </div>
          <p class="status-line compact" id="voiceStatus">等待读取语音状态。</p>
        </section>

        <section class="glass-card">
          <div class="section-head">
            <div>
              <h3>屏幕设置</h3>
              <p>保留设备调试能力，但按移动端编辑流程重新收纳。</p>
            </div>
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
              <span>启动时长（秒）</span>
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
            <button id="loadScreenBtn" class="btn ghost" type="button">读取屏幕参数</button>
            <button id="saveScreenBtn" class="btn primary" type="button">保存屏幕参数</button>
          </div>
        </section>
      </section>

      <section class="panel" id="panel-logs">
        <section class="glass-card">
          <div class="section-head">
            <div>
              <h3>运行日志</h3>
              <p>保留排障价值，但视觉上更像 App 内置工具页。</p>
            </div>
            <span class="runtime-pill" id="logMeta">日志 0 条</span>
          </div>
          <div class="button-row">
            <button id="refreshLogsBtn" class="btn ghost" type="button">刷新日志</button>
            <button id="clearLogsBtn" class="btn danger" type="button">清空日志</button>
          </div>
          <pre class="log-box" id="logText">暂无日志。</pre>
        </section>
      </section>
    </main>

    <nav class="bottom-nav" id="tabs">
      <button class="tab active" data-target="overview" data-title="设备总览" data-subtitle="查看状态、关键指标和常用控制。">
        <span>首页</span>
      </button>
      <button class="tab" data-target="filters" data-title="滤芯管理" data-subtitle="维护耗材寿命、日期和重置操作。">
        <span>滤芯</span>
      </button>
      <button class="tab" data-target="settings" data-title="设备设置" data-subtitle="连接、参数、WiFi、语音和屏幕配置。">
        <span>设置</span>
      </button>
      <button class="tab" data-target="logs" data-title="运行日志" data-subtitle="查看动作记录、网络状态和诊断信息。">
        <span>日志</span>
      </button>
    </nav>
  </div>
`;

renderScreenFields();
bindBaseState();
renderProfiles();
bindTabs();
bindActions();
syncAll().catch((error) => updateStatusLine(describeError(error), "error"));

function bindBaseState(): void {
  setFieldValue("baseUrl", appState.baseUrl);
  setCheckboxValue("autoRefresh", appState.autoRefresh);
}

function bindTabs(): void {
  document.querySelectorAll<HTMLButtonElement>(".tab").forEach((button) => {
    button.addEventListener("click", () => activateTab(button));
  });
}

function activateTab(button: HTMLButtonElement): void {
  document.querySelectorAll<HTMLButtonElement>(".tab").forEach((item) => item.classList.remove("active"));
  document.querySelectorAll<HTMLElement>(".panel").forEach((panel) => panel.classList.remove("active"));
  button.classList.add("active");
  document.getElementById(`panel-${button.dataset.target}`)?.classList.add("active");
  setText("appPageTitle", button.dataset.title || "净水器手机控制台");
  setText("appPageSubtitle", button.dataset.subtitle || "根据固件逻辑重写的手机端控制台。");
}

function bindActions(): void {
  getButton("connectBtn").addEventListener("click", () => {
    saveBaseUrl();
    syncAll().catch(handleError);
  });
  getButton("syncBtn").addEventListener("click", () => syncAll().catch(handleError));
  getButton("saveProfileBtn").addEventListener("click", saveCurrentProfile);
  getInput("baseUrl").addEventListener("change", saveBaseUrl);
  getInput("autoRefresh").addEventListener("change", () => {
    appState.autoRefresh = getCheckboxValue("autoRefresh");
    localStorage.setItem(STORAGE_AUTO_REFRESH, appState.autoRefresh ? "1" : "0");
    schedulePolling();
  });

  document.querySelectorAll<HTMLButtonElement>("[data-command]").forEach((button) => {
    button.addEventListener("click", async () => {
      const command = button.dataset.command;
      if (!command) return;
      try {
        await apiRequest("/api/cmd", { query: { c: command } });
        updateStatusLine(`已发送命令：${command}`, "ok");
        await loadStatus();
      } catch (error) {
        updateStatusLine(describeError(error), "error");
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

function saveBaseUrl(): void {
  appState.baseUrl = normalizeBaseUrl(getFieldValue("baseUrl"));
  setFieldValue("baseUrl", appState.baseUrl);
  localStorage.setItem(STORAGE_BASE_URL, appState.baseUrl);
}

function saveCurrentProfile(): void {
  saveBaseUrl();
  const name = getFieldValue("profileName").trim() || `快捷地址 ${appState.profiles.length + 1}`;
  const url = appState.baseUrl;
  const existing = appState.profiles.find((profile) => profile.url === url);

  if (existing) {
    existing.name = name;
  } else {
    appState.profiles.push({ id: `${Date.now()}`, name, url });
  }

  persistProfiles();
  renderProfiles();
  setFieldValue("profileName", "");
  updateStatusLine(`已保存快捷地址：${name}`, "ok");
}

function renderProfiles(): void {
  const host = getElement<HTMLDivElement>("quickProfileList");
  host.innerHTML = appState.profiles
    .map(
      (profile) => `
        <div class="profile-card ${profile.url === appState.baseUrl ? "active" : ""}">
          <button type="button" class="profile-main" data-profile-id="${escapeAttribute(profile.id)}">
            <span>${escapeHtml(profile.name)}</span>
            <strong>${escapeHtml(profile.url)}</strong>
          </button>
          <button type="button" class="profile-remove" data-remove-profile-id="${escapeAttribute(profile.id)}">删除</button>
        </div>
      `,
    )
    .join("");

  host.querySelectorAll<HTMLButtonElement>("[data-profile-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const profile = appState.profiles.find((item) => item.id === button.dataset.profileId);
      if (!profile) return;
      appState.baseUrl = profile.url;
      setFieldValue("baseUrl", profile.url);
      localStorage.setItem(STORAGE_BASE_URL, profile.url);
      renderProfiles();
      syncAll().catch(handleError);
    });
  });

  host.querySelectorAll<HTMLButtonElement>("[data-remove-profile-id]").forEach((button) => {
    button.addEventListener("click", () => {
      appState.profiles = appState.profiles.filter((profile) => profile.id !== button.dataset.removeProfileId);
      if (!appState.profiles.length) {
        appState.profiles = [...defaultProfiles];
      }
      persistProfiles();
      renderProfiles();
    });
  });
}

function persistProfiles(): void {
  localStorage.setItem(STORAGE_PROFILES, JSON.stringify(appState.profiles));
}

async function syncAll(): Promise<void> {
  saveBaseUrl();
  updateStatusLine("正在同步设备数据...", "warn");
  await loadStatus();
  await Promise.all([loadParams(), loadFilters(), loadWifi(), loadTime(), loadTts(), loadScreen(), loadLogs()]);
  updateStatusLine("设备数据同步完成。", "ok");
  schedulePolling();
}

function schedulePolling(): void {
  if (appState.pollTimer) {
    window.clearInterval(appState.pollTimer);
    appState.pollTimer = undefined;
  }
  if (!appState.autoRefresh) return;
  appState.pollTimer = window.setInterval(() => {
    loadStatus().catch(() => undefined);
  }, STATUS_POLL_MS);
}

async function loadStatus(): Promise<void> {
  const data = await apiRequest<StatusData>("/api/status");
  setText("metricState", data.state || "--");
  setText("metricNet", data.net || "--");
  setText("metricIp", data.ip || "--");
  setText("metricTime", data.time || "--:--");
  setText("metricTds", formatTdsValue(data.tdsPure ?? data.tds, data.tdsen !== false, data.tdsPureProbe));
  setText("metricRawTds", formatTdsValue(data.tdsRaw, data.tdsen !== false, data.tdsRawProbe));
  setText("metricTemp", formatTempValue(data.tempPure ?? data.temp, data.tempen !== false, data.tempPureProbe));
  setText("metricRawTemp", formatTempValue(data.tempRaw, data.tempen !== false, data.tempRawProbe));
  setText("metricWater", data.water || "--");
  setText("metricRemain", formatDuration(data.rem));
  setText("metricQuality", formatTdsQuality(data));
  setText("metricRssi", Number.isFinite(data.rssi) ? `${data.rssi} dBm` : "-- dBm");

  setText("heroNet", data.net || "设备在线");
  setText("overviewState", data.state || "设备在线");
  setText("overviewTime", data.time || "--:--");
  setText("overviewAddress", data.ip || appState.baseUrl || "--");
  setText("overviewQuality", formatTdsQuality(data));
  setText("overviewSignal", Number.isFinite(data.rssi) ? `${data.rssi} dBm` : "-- dBm");
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
  });
  updateStatusLine("参数已保存。", "ok");
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
  await apiRequest("/api/savefilter", { query: { id: index, date, life } });
  appState.filters[index] = { name, date, life };
  renderFilterCards();
  updateStatusLine(`滤芯 ${index + 1} 已保存。`, "ok");
}

async function resetCurrentFilter(): Promise<void> {
  await apiRequest("/api/resetfilter", { query: { id: appState.activeFilterIndex } });
  updateStatusLine(`滤芯 ${appState.activeFilterIndex + 1} 已重置。`, "ok");
  await loadFilters();
}

async function resetAllFilters(): Promise<void> {
  await apiRequest("/api/resetallfilters");
  updateStatusLine("全部滤芯已重置。", "ok");
  await loadFilters();
}

async function loadWifi(): Promise<void> {
  const data = await apiRequest<WifiData>("/api/wifi");
  appState.savedWifiSsid = data.ssid || "";
  appState.wifiHasSavedPassword = Boolean(data.hasPass);
  setFieldValue("wifiSsid", data.ssid || "");
  setFieldValue("wifiPass", "");
  getInput("wifiPass").placeholder = data.hasPass ? "已保存密码，留空表示保留" : "请输入 WiFi 密码";
  setStatusMessage("wifiStatus", "WiFi 配置已加载。", "ok");
}

async function scanWifi(): Promise<void> {
  setStatusMessage("wifiStatus", "正在扫描 WiFi，请稍候...", "warn");
  const host = getElement<HTMLDivElement>("wifiList");
  host.innerHTML = "";
  const data = await apiRequest<WifiScanResult>("/api/wifiscan");
  if (data.status === "scanning") {
    window.setTimeout(() => scanWifi().catch(handleError), 800);
    return;
  }
  if (data.status !== "done") {
    setStatusMessage("wifiStatus", "扫描失败。", "error");
    return;
  }
  const list = data.list || [];
  if (!list.length) {
    setStatusMessage("wifiStatus", "未扫描到可用 WiFi。", "warn");
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
      setStatusMessage("wifiStatus", `已选择 WiFi：${button.dataset.ssid || ""}`, "ok");
    });
  });
  setStatusMessage("wifiStatus", "扫描完成，点击列表可自动填充。", "ok");
}

async function saveWifi(): Promise<void> {
  const ssid = getFieldValue("wifiSsid");
  const pass = getFieldValue("wifiPass");
  const keep = !pass && appState.wifiHasSavedPassword && ssid === appState.savedWifiSsid ? 1 : 0;
  await apiRequest("/api/savewifi", { method: "POST", form: { ssid, pass, keep } });
  setStatusMessage("wifiStatus", "WiFi 配置已提交，设备将尝试重连。", "ok");
  await loadWifi();
}

async function loadTime(): Promise<void> {
  const data = await apiRequest<TimeData>("/api/time");
  const stamp = data.valid ? `${data.date || "--"} ${data.time || "--"}` : "--";
  setStatusMessage("timeState", `当前时间：${stamp} | 来源：${data.source || "--"} | RTC：${data.rtc ? "已连接" : "未连接"}`, "ok");
  if (data.datetime) {
    setFieldValue("manualTime", data.datetime);
  }
}

async function syncTime(): Promise<void> {
  await apiRequest("/api/synctime");
  setStatusMessage("timeState", "网络校时请求已发送。", "warn");
  await loadTime();
}

async function saveTime(): Promise<void> {
  const raw = getFieldValue("manualTime");
  if (!raw) {
    setStatusMessage("timeState", "请先选择一个时间。", "warn");
    return;
  }
  const epoch = Math.floor(new Date(raw).getTime() / 1000);
  await apiRequest("/api/settime", { method: "POST", form: { epoch } });
  setStatusMessage("timeState", "手动时间已保存。", "ok");
  await loadTime();
}

async function loadTts(): Promise<void> {
  const data = await apiRequest<TtsData>("/api/tts");
  setFieldValue("ttsAppid", data.appid || "");
  setFieldValue("ttsToken", "");
  getInput("ttsToken").placeholder = data.hasToken ? "已保存 Token，留空表示保留" : "请输入 Token";
  setFieldValue("ttsVoice", data.voice || "zh_female_wanwanxiaohe_moon_bigtts");
  setText("voiceCacheRatio", `${data.cache || 0} / ${data.total || 0}`);
  setText(
    "voiceReadyState",
    data.ready === false ? "待配置" : (data.cache || 0) >= (data.total || 0) && (data.total || 0) > 0 ? "已完成" : "未完成",
  );
  setText(
    "voiceFlashState",
    data.flashReady ? "已挂载" : data.flashTaskRunning ? "挂载中" : data.flashQueued ? "已排队" : data.flashResultKnown ? "挂载失败" : "未检测",
  );
  setText("voiceEnabledState", data.en === false ? "已关闭" : "已启用");
  setStatusMessage("voiceStatus", "语音状态已读取。", "ok");
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
  });
  setStatusMessage("voiceStatus", "云语音配置已保存。", "ok");
  await loadTts();
}

async function primeVoiceCache(): Promise<void> {
  await apiRequest("/api/voicecache", { method: "POST", query: { c: "prime" } });
  setStatusMessage("voiceStatus", "语音缓存任务已排队。", "warn");
  await loadTts();
}

async function clearVoiceCache(): Promise<void> {
  const result = await apiRequest<string>("/api/voicecache", { method: "POST", query: { c: "clear" }, expect: "text" });
  setStatusMessage("voiceStatus", result || "语音缓存已清空。", "ok");
  await loadTts();
}

async function probeVoiceFlash(): Promise<void> {
  await apiRequest("/api/voiceflash", { method: "POST", query: { c: "probe" } });
  setStatusMessage("voiceStatus", "TF 卡探测任务已排队。", "warn");
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
  });
  updateStatusLine("屏幕参数已保存。", "ok");
  await loadScreen();
}

async function loadLogs(): Promise<void> {
  const data = await apiRequest<LogsData>("/api/logs");
  const heap = data.freeHeap ? ` · Heap ${Math.round(data.freeHeap / 1024)} KB` : "";
  setText("logMeta", `日志 ${data.count || 0} 条${heap}`);
  setText("logText", (data.items || []).join("\n") || "暂无日志。");
}

async function clearLogs(): Promise<void> {
  await apiRequest("/api/clearlogs");
  updateStatusLine("日志已清空。", "ok");
  await loadLogs();
}

async function apiRequest<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const baseUrl = normalizeBaseUrl(appState.baseUrl || getFieldValue("baseUrl"));
  if (!baseUrl) {
    throw new Error("请先输入设备地址。");
  }

  const url = new URL(path, `${baseUrl}/`);
  Object.entries(options.query || {}).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    url.searchParams.set(key, String(value));
  });

  const method = options.method || "GET";
  const expect = options.expect || "json";
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
      responseType: expect === "text" ? "text" : "json",
      readTimeout: 12000,
      connectTimeout: 12000,
    });

    if (response.status >= 400) {
      throw new Error(`请求失败：HTTP ${response.status}`);
    }

    if (expect === "text") {
      return String(response.data ?? "") as T;
    }
    return (typeof response.data === "string" ? JSON.parse(response.data) : response.data) as T;
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

  if (expect === "text") {
    return (await response.text()) as T;
  }
  return (await response.json()) as T;
}

function loadProfiles(): ConnectionProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_PROFILES);
    if (!raw) return [...defaultProfiles];
    const parsed = JSON.parse(raw) as ConnectionProfile[];
    const cleaned = parsed
      .filter((item) => item && item.name && item.url)
      .map((item) => ({
        id: item.id || `${Date.now()}-${Math.random()}`,
        name: item.name,
        url: normalizeBaseUrl(item.url),
      }))
      .filter((item) => item.url);
    return cleaned.length ? cleaned : [...defaultProfiles];
  } catch {
    return [...defaultProfiles];
  }
}

function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  return withProtocol.replace(/\/+$/, "");
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

function updateStatusLine(message: string, tone: Tone = "ok"): void {
  setStatusMessage("statusLine", message, tone);
}

function setStatusMessage(id: string, message: string, tone: Tone): void {
  const element = getElement<HTMLElement>(id);
  element.textContent = message;
  element.dataset.tone = tone;
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
  return error instanceof Error ? error.message : "操作失败，请检查设备连接。";
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
