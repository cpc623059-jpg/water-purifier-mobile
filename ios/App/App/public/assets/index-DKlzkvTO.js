(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))a(n);new MutationObserver(n=>{for(const i of n)if(i.type==="childList")for(const r of i.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&a(r)}).observe(document,{childList:!0,subtree:!0});function s(n){const i={};return n.integrity&&(i.integrity=n.integrity),n.referrerPolicy&&(i.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?i.credentials="include":n.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function a(n){if(n.ep)return;n.ep=!0;const i=s(n);fetch(n.href,i)}})();var F;(function(e){e.Unimplemented="UNIMPLEMENTED",e.Unavailable="UNAVAILABLE"})(F||(F={}));class _ extends Error{constructor(t,s,a){super(t),this.message=t,this.code=s,this.data=a}}const Le=e=>{var t,s;return e?.androidBridge?"android":!((s=(t=e?.webkit)===null||t===void 0?void 0:t.messageHandlers)===null||s===void 0)&&s.bridge?"ios":"web"},Te=e=>{const t=e.CapacitorCustomPlatform||null,s=e.Capacitor||{},a=s.Plugins=s.Plugins||{},n=()=>t!==null?t.name:Le(e),i=()=>n()!=="web",r=m=>{const h=p.get(m);return!!(h?.platforms.has(n())||l(m))},l=m=>{var h;return(h=s.PluginHeaders)===null||h===void 0?void 0:h.find(I=>I.name===m)},o=m=>e.console.error(m),p=new Map,R=(m,h={})=>{const I=p.get(m);if(I)return console.warn(`Capacitor plugin "${m}" already registered. Cannot register plugins twice.`),I.proxy;const B=n(),$=l(m);let k;const ye=async()=>(!k&&B in h?k=typeof h[B]=="function"?k=await h[B]():k=h[B]:t!==null&&!k&&"web"in h&&(k=typeof h.web=="function"?k=await h.web():k=h.web),k),Se=(y,S)=>{var T,P;if($){const x=$?.methods.find(L=>S===L.name);if(x)return x.rtype==="promise"?L=>s.nativePromise(m,S.toString(),L):(L,W)=>s.nativeCallback(m,S.toString(),L,W);if(y)return(T=y[S])===null||T===void 0?void 0:T.bind(y)}else{if(y)return(P=y[S])===null||P===void 0?void 0:P.bind(y);throw new _(`"${m}" plugin is not implemented on ${B}`,F.Unimplemented)}},D=y=>{let S;const T=(...P)=>{const x=ye().then(L=>{const W=Se(L,y);if(W){const j=W(...P);return S=j?.remove,j}else throw new _(`"${m}.${y}()" is not implemented on ${B}`,F.Unimplemented)});return y==="addListener"&&(x.remove=async()=>S()),x};return T.toString=()=>`${y.toString()}() { [capacitor code] }`,Object.defineProperty(T,"name",{value:y,writable:!1,configurable:!1}),T},ne=D("addListener"),ie=D("removeListener"),Ee=(y,S)=>{const T=ne({eventName:y},S),P=async()=>{const L=await T;ie({eventName:y,callbackId:L},S)},x=new Promise(L=>T.then(()=>L({remove:P})));return x.remove=async()=>{console.warn("Using addListener() without 'await' is deprecated."),await P()},x},V=new Proxy({},{get(y,S){switch(S){case"$$typeof":return;case"toJSON":return()=>({});case"addListener":return $?Ee:ne;case"removeListener":return ie;default:return D(S)}}});return a[m]=V,p.set(m,{name:m,proxy:V,platforms:new Set([...Object.keys(h),...$?[B]:[]])}),V};return s.convertFileSrc||(s.convertFileSrc=m=>m),s.getPlatform=n,s.handleError=o,s.isNativePlatform=i,s.isPluginAvailable=r,s.registerPlugin=R,s.Exception=_,s.DEBUG=!!s.DEBUG,s.isLoggingEnabled=!!s.isLoggingEnabled,s},ke=e=>e.Capacitor=Te(e),U=ke(typeof globalThis<"u"?globalThis:typeof self<"u"?self:typeof window<"u"?window:typeof global<"u"?global:{}),pe=U.registerPlugin;class me{constructor(){this.listeners={},this.retainedEventArguments={},this.windowListeners={}}addListener(t,s){let a=!1;this.listeners[t]||(this.listeners[t]=[],a=!0),this.listeners[t].push(s);const i=this.windowListeners[t];i&&!i.registered&&this.addWindowListener(i),a&&this.sendRetainedArgumentsForEvent(t);const r=async()=>this.removeListener(t,s);return Promise.resolve({remove:r})}async removeAllListeners(){this.listeners={};for(const t in this.windowListeners)this.removeWindowListener(this.windowListeners[t]);this.windowListeners={}}notifyListeners(t,s,a){const n=this.listeners[t];if(!n){if(a){let i=this.retainedEventArguments[t];i||(i=[]),i.push(s),this.retainedEventArguments[t]=i}return}n.forEach(i=>i(s))}hasListeners(t){var s;return!!(!((s=this.listeners[t])===null||s===void 0)&&s.length)}registerWindowListener(t,s){this.windowListeners[s]={registered:!1,windowEventName:t,pluginEventName:s,handler:a=>{this.notifyListeners(s,a)}}}unimplemented(t="not implemented"){return new U.Exception(t,F.Unimplemented)}unavailable(t="not available"){return new U.Exception(t,F.Unavailable)}async removeListener(t,s){const a=this.listeners[t];if(!a)return;const n=a.indexOf(s);this.listeners[t].splice(n,1),this.listeners[t].length||this.removeWindowListener(this.windowListeners[t])}addWindowListener(t){window.addEventListener(t.windowEventName,t.handler),t.registered=!0}removeWindowListener(t){t&&(window.removeEventListener(t.windowEventName,t.handler),t.registered=!1)}sendRetainedArgumentsForEvent(t){const s=this.retainedEventArguments[t];s&&(delete this.retainedEventArguments[t],s.forEach(a=>{this.notifyListeners(t,a)}))}}const re=e=>encodeURIComponent(e).replace(/%(2[346B]|5E|60|7C)/g,decodeURIComponent).replace(/[()]/g,escape),ce=e=>e.replace(/(%[\dA-F]{2})+/gi,decodeURIComponent);class Pe extends me{async getCookies(){const t=document.cookie,s={};return t.split(";").forEach(a=>{if(a.length<=0)return;let[n,i]=a.replace(/=/,"CAP_COOKIE").split("CAP_COOKIE");n=ce(n).trim(),i=ce(i).trim(),s[n]=i}),s}async setCookie(t){try{const s=re(t.key),a=re(t.value),n=t.expires?`; expires=${t.expires.replace("expires=","")}`:"",i=(t.path||"/").replace("path=",""),r=t.url!=null&&t.url.length>0?`domain=${t.url}`:"";document.cookie=`${s}=${a||""}${n}; path=${i}; ${r};`}catch(s){return Promise.reject(s)}}async deleteCookie(t){try{document.cookie=`${t.key}=; Max-Age=0`}catch(s){return Promise.reject(s)}}async clearCookies(){try{const t=document.cookie.split(";")||[];for(const s of t)document.cookie=s.replace(/^ +/,"").replace(/=.*/,`=;expires=${new Date().toUTCString()};path=/`)}catch(t){return Promise.reject(t)}}async clearAllCookies(){try{await this.clearCookies()}catch(t){return Promise.reject(t)}}}pe("CapacitorCookies",{web:()=>new Pe});const xe=async e=>new Promise((t,s)=>{const a=new FileReader;a.onload=()=>{const n=a.result;t(n.indexOf(",")>=0?n.split(",")[1]:n)},a.onerror=n=>s(n),a.readAsDataURL(e)}),Be=(e={})=>{const t=Object.keys(e);return Object.keys(e).map(n=>n.toLocaleLowerCase()).reduce((n,i,r)=>(n[i]=e[t[r]],n),{})},$e=(e,t=!0)=>e?Object.entries(e).reduce((a,n)=>{const[i,r]=n;let l,o;return Array.isArray(r)?(o="",r.forEach(p=>{l=t?encodeURIComponent(p):p,o+=`${i}=${l}&`}),o.slice(0,-1)):(l=t?encodeURIComponent(r):r,o=`${i}=${l}`),`${a}&${o}`},"").substr(1):null,Fe=(e,t={})=>{const s=Object.assign({method:e.method||"GET",headers:e.headers},t),n=Be(e.headers)["content-type"]||"";if(typeof e.data=="string")s.body=e.data;else if(n.includes("application/x-www-form-urlencoded")){const i=new URLSearchParams;for(const[r,l]of Object.entries(e.data||{}))i.set(r,l);s.body=i.toString()}else if(n.includes("multipart/form-data")||e.data instanceof FormData){const i=new FormData;if(e.data instanceof FormData)e.data.forEach((l,o)=>{i.append(o,l)});else for(const l of Object.keys(e.data))i.append(l,e.data[l]);s.body=i;const r=new Headers(s.headers);r.delete("content-type"),s.headers=r}else(n.includes("application/json")||typeof e.data=="object")&&(s.body=JSON.stringify(e.data));return s};class Ce extends me{async request(t){const s=Fe(t,t.webFetchExtra),a=$e(t.params,t.shouldEncodeUrlParams),n=a?`${t.url}?${a}`:t.url,i=await fetch(n,s),r=i.headers.get("content-type")||"";let{responseType:l="text"}=i.ok?t:{};r.includes("application/json")&&(l="json");let o,p;switch(l){case"arraybuffer":case"blob":p=await i.blob(),o=await xe(p);break;case"json":o=await i.json();break;default:o=await i.text()}const R={};return i.headers.forEach((m,h)=>{R[h]=m}),{data:o,headers:R,status:i.status,url:i.url}}async get(t){return this.request(Object.assign(Object.assign({},t),{method:"GET"}))}async post(t){return this.request(Object.assign(Object.assign({},t),{method:"POST"}))}async put(t){return this.request(Object.assign(Object.assign({},t),{method:"PUT"}))}async patch(t){return this.request(Object.assign(Object.assign({},t),{method:"PATCH"}))}async delete(t){return this.request(Object.assign(Object.assign({},t),{method:"DELETE"}))}}const Ae=pe("CapacitorHttp",{web:()=>new Ce}),K="http://ik.cccpc.cc:18081",Oe=5e3,Re={make:"手动制水",wash:"手动冲洗",stop:"停止运行",reset:"设备复位"},q=["1级 PP棉","2级 颗粒炭","3级 烧结炭","4级 RO膜","5级 后置炭"],fe=["ltx","lty","rtx","rty","mx","my","lbx","lby","rbx","rby","cbx","cby"],Ie={ltx:"左上 X",lty:"左上 Y",rtx:"右上 X",rty:"右上 Y",mx:"主区 X",my:"主区 Y",lbx:"左下 X",lby:"左下 Y",rbx:"右下 X",rby:"右下 Y",cbx:"底中 X",cby:"底中 Y"},d={filters:[],activeFilterIndex:0,wifiHasSavedPassword:!1,savedWifiSsid:"",pollTimer:0},J=document.querySelector("#app");if(!J)throw new Error("App root not found");J.innerHTML=`
  <div class="app-shell">
    <div class="ambient ambient-a"></div>
    <div class="ambient ambient-b"></div>

    <header class="topbar compact-topbar">
      <div class="brand-block">
        <p class="app-title">净水智控</p>
        <h1 class="top-state" id="overviewState">待机</h1>
      </div>
      <div class="topbar-actions">
        <span class="runtime-pill online-pill" id="heroNet">在线</span>
        <button id="syncBtn" class="glass-icon-button icon-only" type="button" aria-label="刷新">↻</button>
      </div>
    </header>

    <section class="status-banner" id="statusLine" data-tone="warn">
      <strong class="status-text" id="statusText">正在同步</strong>
    </section>

    <main class="app-main">
      <section class="panel active" id="panel-overview">
        <section class="hero-card hero-panel">
          <div class="section-head hero-head">
            <div>
              <p class="hero-kicker">纯水品质</p>
              <h2 class="hero-reading" id="metricTds">-- ppm</h2>
              <p class="hero-reading-sub" id="metricRawTds">原水 -- ppm</p>
            </div>
            <div class="hero-signal-stack">
              <span class="runtime-pill hero-signal-chip" id="metricState">待机</span>
              <span class="runtime-pill hero-signal-chip secondary" id="metricRssi">-- dBm</span>
            </div>
          </div>

          <div class="hero-grid">
            <article class="hero-metric">
              <span>当前时间</span>
              <strong id="overviewTime">--:--</strong>
            </article>
            <article class="hero-metric">
              <span>剩余时间</span>
              <strong id="heroRemain">--:--</strong>
            </article>
            <article class="hero-metric">
              <span>纯水判定</span>
              <strong id="overviewQuality">--</strong>
            </article>
            <article class="hero-metric">
              <span>水位状态</span>
              <strong id="overviewWater">--</strong>
            </article>
          </div>

          <div class="hero-pill-row">
            <article class="hero-pill">
              <span>连接方式</span>
              <strong id="overviewAccess">--</strong>
            </article>
            <article class="hero-pill">
              <span>网络状态</span>
              <strong id="metricNet">--</strong>
            </article>
            <article class="hero-pill">
              <span>信号强度</span>
              <strong id="overviewSignal">-- dBm</strong>
            </article>
          </div>
        </section>

        <section class="glass-card">
          <div class="section-head">
            <h3>快捷控制</h3>
            <p>常用操作</p>
          </div>
          <div class="action-grid">
            <button class="action-card action-make" data-command="make" type="button">
              <strong>手动制水</strong>
              <span>开始</span>
            </button>
            <button class="action-card action-wash" data-command="wash" type="button">
              <strong>手动冲洗</strong>
              <span>执行</span>
            </button>
            <button class="action-card action-stop" data-command="stop" type="button">
              <strong>停止运行</strong>
              <span>结束</span>
            </button>
            <button class="action-card action-reset" data-command="reset" type="button">
              <strong>复位</strong>
              <span>重置</span>
            </button>
          </div>
        </section>

        <section class="glass-card">
          <div class="section-head">
            <h3>实时指标</h3>
            <p>核心状态一眼看清</p>
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
              <strong id="metricRawTdsCard">-- ppm</strong>
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
              <span class="metric-label">当前时间</span>
              <strong id="metricTime">--:--</strong>
            </article>
            <article class="metric-card">
              <span class="metric-label">接入方式</span>
              <strong id="metricAccess">--</strong>
            </article>
            <article class="metric-card">
              <span class="metric-label">剩余时间</span>
              <strong id="metricRemain">--:--</strong>
            </article>
            <article class="metric-card">
              <span class="metric-label">信号强度</span>
              <strong id="metricRssi">-- dBm</strong>
            </article>
            <article class="metric-card">
              <span class="metric-label">纯水判定</span>
              <strong id="metricQuality">--</strong>
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
`;window.addEventListener("error",e=>{ae(C(e.error??e.message))});window.addEventListener("unhandledrejection",e=>{ae(C(e.reason))});try{qe(),We(),je(),be().catch(e=>E(C(e),"error"))}catch(e){ae(C(e))}function We(){document.querySelectorAll(".tab").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active")),document.querySelectorAll(".panel").forEach(t=>t.classList.remove("active")),e.classList.add("active"),document.getElementById(`panel-${e.dataset.target}`)?.classList.add("active")})})}function je(){v("syncBtn").addEventListener("click",()=>be().catch(w)),document.querySelectorAll("[data-command]").forEach(e=>{e.addEventListener("click",async()=>{const t=e.dataset.command;if(t)try{const s=Re[t]||t;await u("/api/cmd",{query:{c:t},allowEmpty:!0}),E(`已发送 ${s}`,"ok"),await nt(280);try{await Q()}catch{E(`${s} 已发送，状态稍后刷新`,"warn")}}catch(s){E(C(s),"error")}})}),v("loadParamsBtn").addEventListener("click",()=>X().catch(w)),v("saveParamsBtn").addEventListener("click",()=>He().catch(w)),v("filterTodayBtn").addEventListener("click",Me),v("saveFilterBtn").addEventListener("click",()=>De().catch(w)),v("resetFilterBtn").addEventListener("click",()=>Ve().catch(w)),v("resetAllFiltersBtn").addEventListener("click",()=>_e().catch(w)),v("scanWifiBtn").addEventListener("click",()=>we().catch(w)),v("saveWifiBtn").addEventListener("click",()=>Ne().catch(w)),v("syncTimeBtn").addEventListener("click",()=>ze().catch(w)),v("saveTimeBtn").addEventListener("click",()=>Ge().catch(w)),v("saveTtsBtn").addEventListener("click",()=>Ke().catch(w)),v("primeVoiceBtn").addEventListener("click",()=>Je().catch(w)),v("clearVoiceBtn").addEventListener("click",()=>Qe().catch(w)),v("probeVoiceBtn").addEventListener("click",()=>Xe().catch(w)),v("loadScreenBtn").addEventListener("click",()=>te().catch(w)),v("saveScreenBtn").addEventListener("click",()=>Ye().catch(w)),v("refreshLogsBtn").addEventListener("click",()=>se().catch(w)),v("clearLogsBtn").addEventListener("click",()=>Ze().catch(w))}function qe(){const e=M("screenFieldGrid");e.innerHTML=fe.map(t=>`
      <label class="field">
        <span>${Ie[t]}</span>
        <input id="screen-${t}" type="number" min="0" max="128" step="1" />
      </label>
    `).join("")}async function be(){E("正在同步","warn"),await Q();const e=await Promise.allSettled([X(),Y(),ve(),ee(),O(),te(),se()]);Ue();const t=e.filter(s=>s.status==="rejected").length;if(t>0){E(`部分同步完成，${t} 项需要重试`,"warn");return}E("","ok")}function Ue(){d.pollTimer&&window.clearInterval(d.pollTimer),d.pollTimer=window.setInterval(()=>{Q().catch(()=>{})},Oe)}async function Q(){const e=await u("/api/status"),t=tt(e);et(e),c("metricState",e.state||"--"),c("metricNet",e.net||"--"),c("metricTime",e.time||"--:--"),c("metricTds",N(e.tdsPure??e.tds,e.tdsen!==!1,e.tdsPureProbe)),c("metricRawTds",`原水 ${N(e.tdsRaw,e.tdsen!==!1,e.tdsRawProbe)}`),c("metricRawTdsCard",N(e.tdsRaw,e.tdsen!==!1,e.tdsRawProbe)),c("metricTemp",oe(e.tempPure??e.temp,e.tempen!==!1,e.tempPureProbe)),c("metricRawTemp",oe(e.tempRaw,e.tempen!==!1,e.tempRawProbe)),c("metricWater",e.water||"--"),c("metricRemain",de(e.rem)),c("metricQuality",le(e)),c("metricAccess",t),c("metricRssi",Number.isFinite(e.rssi)?`${e.rssi} dBm`:"-- dBm"),c("overviewState",e.state||"待机"),c("heroNet",st(e)),c("overviewTime",e.time||"--:--"),c("overviewWater",e.water||"--"),c("overviewQuality",le(e)),c("overviewAccess",t),c("overviewSignal",Number.isFinite(e.rssi)?`${e.rssi} dBm`:"-- dBm"),c("heroRemain",de(e.rem))}async function X(){const e=await u("/api/getparams");f("param-mk",String(e.mk??60)),f("param-dly",String(e.dly??30)),f("param-wsh",String(e.wsh??60)),f("param-slp",String(e.slp??0)),f("param-vol",String(e.vol??25)),f("param-tdth",String(e.tdth??100)),z("param-voc",!!e.voc),z("param-buz",!!e.buz),z("param-tdsen",e.tdsen!==!1)}async function He(){await u("/api/save",{query:{mk:b("param-mk"),dly:b("param-dly"),wsh:b("param-wsh"),slp:b("param-slp"),vol:b("param-vol"),tdth:b("param-tdth"),voc:G("param-voc")?1:0,buz:G("param-buz")?1:0,tdsen:G("param-tdsen")?1:0},allowEmpty:!0}),E("参数已保存","ok"),await X()}async function Y(){const e=await u("/api/filters");for(d.filters=(e||[]).map((t,s)=>({name:t.name||q[s]||`滤芯 ${s+1}`,date:(t.date||"2026-01-01").slice(0,10),life:Number(t.life)||6}));d.filters.length<q.length;)d.filters.push({name:q[d.filters.length],date:"2026-01-01",life:6});d.activeFilterIndex>=d.filters.length&&(d.activeFilterIndex=0),Z(),he()}function Z(){const e=M("filterList");e.innerHTML=d.filters.map((t,s)=>`
        <button class="filter-card${s===d.activeFilterIndex?" active":""}" type="button" data-filter-index="${s}">
          <span>${A(t.name)}</span>
          <strong>${A(t.date)}</strong>
          <small>${t.life} 个月</small>
        </button>
      `).join(""),e.querySelectorAll("[data-filter-index]").forEach(t=>{t.addEventListener("click",()=>{d.activeFilterIndex=Number(t.dataset.filterIndex||0),Z(),he()})})}function he(){const e=d.filters[d.activeFilterIndex];e&&(f("filterName",e.name),f("filterDate",e.date),f("filterLife",String(e.life)))}function Me(){f("filterDate",new Date().toISOString().slice(0,10))}async function De(){const e=d.activeFilterIndex,t=b("filterName").trim()||q[e],s=b("filterDate"),a=Number(b("filterLife"))||6;await u("/api/savefilter",{query:{id:e,date:s,life:a},allowEmpty:!0}),d.filters[e]={name:t,date:s,life:a},Z(),E(`滤芯 ${e+1} 已保存`,"ok")}async function Ve(){await u("/api/resetfilter",{query:{id:d.activeFilterIndex},allowEmpty:!0}),E(`滤芯 ${d.activeFilterIndex+1} 已重置`,"ok"),await Y()}async function _e(){await u("/api/resetallfilters",{allowEmpty:!0}),E("全部滤芯已重置","ok"),await Y()}async function ve(){const e=await u("/api/wifi");d.savedWifiSsid=e.ssid||"",d.wifiHasSavedPassword=!!e.hasPass,f("wifiSsid",e.ssid||""),f("wifiPass",""),H("wifiPass").placeholder=e.hasPass?"留空保留原密码":"密码",g("wifiStatus","WiFi 已读取","ok")}async function we(){g("wifiStatus","扫描中","warn");const e=M("wifiList");e.innerHTML="";const t=await u("/api/wifiscan");if(t.status==="scanning"){window.setTimeout(()=>we().catch(w),800);return}if(t.status!=="done"){g("wifiStatus","扫描失败","error");return}const s=t.list||[];if(!s.length){g("wifiStatus","未找到 WiFi","warn");return}e.innerHTML=s.map(a=>`
        <button class="wifi-item" type="button" data-ssid="${ct(a.ssid)}">
          <span>${A(a.ssid)}</span>
          <small>${a.rssi} dBm · ${A(a.secure||"未知")}</small>
        </button>
      `).join(""),e.querySelectorAll("[data-ssid]").forEach(a=>{a.addEventListener("click",()=>{f("wifiSsid",a.dataset.ssid||""),g("wifiStatus",`已选择 ${a.dataset.ssid||""}`,"ok")})}),g("wifiStatus","扫描完成","ok")}async function Ne(){const e=b("wifiSsid"),t=b("wifiPass"),s=!t&&d.wifiHasSavedPassword&&e===d.savedWifiSsid?1:0;await u("/api/savewifi",{method:"POST",form:{ssid:e,pass:t,keep:s},allowEmpty:!0}),g("wifiStatus","WiFi 已保存","ok"),await ve()}async function ee(){const e=await u("/api/time"),t=e.valid?`${e.date||"--"} ${e.time||"--"}`:"--";g("timeState",t,"ok"),e.datetime&&f("manualTime",e.datetime)}async function ze(){await u("/api/synctime",{allowEmpty:!0}),g("timeState","已发送校时","warn"),await ee()}async function Ge(){const e=b("manualTime");if(!e){g("timeState","请选择时间","warn");return}const t=Math.floor(new Date(e).getTime()/1e3);await u("/api/settime",{method:"POST",form:{epoch:t},allowEmpty:!0}),g("timeState","时间已保存","ok"),await ee()}async function O(){const e=await u("/api/tts");f("ttsAppid",e.appid||""),f("ttsToken",""),H("ttsToken").placeholder=e.hasToken?"留空保留":"Token",f("ttsVoice",e.voice||"zh_female_wanwanxiaohe_moon_bigtts"),c("voiceCacheRatio",`${e.cache||0} / ${e.total||0}`),c("voiceReadyState",e.ready===!1?"待配置":(e.cache||0)>=(e.total||0)&&(e.total||0)>0?"已完成":"未完成"),c("voiceFlashState",e.flashReady?"已挂载":e.flashTaskRunning?"挂载中":e.flashQueued?"排队中":e.flashResultKnown?"失败":"未检测"),c("voiceEnabledState",e.en===!1?"关闭":"启用"),g("voiceStatus","语音已读取","ok")}async function Ke(){await u("/api/tts",{method:"POST",form:{en:1,appid:b("ttsAppid"),token:b("ttsToken"),voice:b("ttsVoice"),keep:b("ttsToken")?0:1},allowEmpty:!0}),g("voiceStatus","语音已保存","ok"),await O()}async function Je(){await u("/api/voicecache",{method:"POST",query:{c:"prime"},allowEmpty:!0}),g("voiceStatus","已开始缓存","warn"),await O()}async function Qe(){const e=await u("/api/voicecache",{method:"POST",query:{c:"clear"},expect:"text"});g("voiceStatus",e||"缓存已清空","ok"),await O()}async function Xe(){await u("/api/voiceflash",{method:"POST",query:{c:"probe"},allowEmpty:!0}),g("voiceStatus","已探测 TF","warn"),await O()}async function te(){const e=await u("/api/getscreen");fe.forEach(t=>f(`screen-${t}`,String(e[t]??0))),f("screenBt",e.bt||""),f("screenBs",e.bs||""),f("screenBd",String(e.bd??2)),it("screenRot",String(e.rot??0))}async function Ye(){await u("/api/savescreen",{query:{bt:b("screenBt"),bs:b("screenBs"),bd:b("screenBd"),rot:b("screenRot")},allowEmpty:!0}),E("屏幕参数已保存","ok"),await te()}async function se(){const e=await u("/api/logs"),t=e.freeHeap?` · ${Math.round(e.freeHeap/1024)}KB`:"";c("logMeta",`日志 ${e.count||0}${t}`),c("logText",(e.items||[]).join(`
`)||"暂无日志。")}async function Ze(){await u("/api/clearlogs",{allowEmpty:!0}),E("日志已清空","ok"),await se()}async function u(e,t={}){const s=new URL(e,`${K}/`);Object.entries(t.query||{}).forEach(([o,p])=>{p==null||p===""||s.searchParams.set(o,String(p))});const a=t.method||"GET",n=t.expect||"json",i=t.allowEmpty??!1,r=new URLSearchParams;if(Object.entries(t.form||{}).forEach(([o,p])=>{p!=null&&r.set(o,String(p))}),U.isNativePlatform()){const o=await Ae.request({url:s.toString(),method:a,headers:r.size?{"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"}:void 0,data:r.size?r.toString():void 0,responseType:"text",readTimeout:12e3,connectTimeout:12e3});if(o.status>=400)throw new Error(`请求失败：HTTP ${o.status}`);const p=typeof o.data=="string"?o.data:o.data==null?"":JSON.stringify(o.data);return n==="text"?p:ue(p,i)}const l=await fetch(s.toString(),{method:a,headers:r.size?{"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"}:void 0,body:a==="POST"?r.toString():void 0,cache:"no-store"});if(!l.ok)throw new Error(`请求失败：HTTP ${l.status}`);return n==="text"?await l.text():ue(await l.text(),i)}function N(e,t,s){return t?s?Number.isFinite(Number(e))?`${Number(e)} ppm`:"-- ppm":"未安装":"模块关闭"}function oe(e,t,s){return t?s?Number.isFinite(Number(e))?`${Number(e).toFixed(1)} °C`:"-- °C":"未安装":"模块关闭"}function le(e){return e.tdsen===!1?"已关闭":!e.tdsPureProbe&&!e.tdsRawProbe?"未安装":e.tdsq||"--"}function de(e){if(!Number.isFinite(e)||Number(e)<=0)return"--:--";const t=Number(e),s=Math.floor(t/3600),a=Math.floor(t%3600/60),n=t%60;return s>0?`${s}:${String(a).padStart(2,"0")}:${String(n).padStart(2,"0")}`:`${String(a).padStart(2,"0")}:${String(n).padStart(2,"0")}`}function et(e){return e.ip?.trim()||at()}function tt(e){const t=e.ip?.trim()||"";return t.startsWith("192.168.4.")?"设备热点":/^(10\\.|192\\.168\\.|172\\.(1[6-9]|2\\d|3[0-1])\\.)/.test(t)||e.net?.includes("WiFi")?"局域网":"远程入口"}function st(e){return e.net?.includes("离线")?"离线":e.net?.includes("在线")||e.ip?.trim()?"在线":"待连接"}function at(){try{return new URL(K).host}catch{return K}}function ue(e,t){const s=e.trim();if(!s){if(t)return;throw new Error("请求失败：空响应")}try{return JSON.parse(s)}catch{if(t&&/^(ok|success|done|queued)$/i.test(s))return;throw new Error(`接口返回了非 JSON 文本：${s.slice(0,80)}`)}}function nt(e){return new Promise(t=>window.setTimeout(t,e))}function E(e,t="ok"){g("statusLine",e,t)}function g(e,t,s){const a=M(e);if(a.dataset.tone=s,e==="statusLine"){c("statusText",t),a.hidden=!t;return}a.textContent=t}function c(e,t){const s=document.getElementById(e);s&&(s.textContent=t)}function f(e,t){ge(e).value=t}function it(e,t){rt(e).value=t}function z(e,t){H(e).checked=t}function b(e){return ge(e).value}function G(e){return H(e).checked}function ge(e){const t=document.getElementById(e);if(!t)throw new Error(`Field not found: ${e}`);return t}function H(e){const t=document.getElementById(e);if(!t)throw new Error(`Input not found: ${e}`);return t}function rt(e){const t=document.getElementById(e);if(!t)throw new Error(`Select not found: ${e}`);return t}function v(e){const t=document.getElementById(e);if(!t)throw new Error(`Button not found: ${e}`);return t}function M(e){const t=document.getElementById(e);if(!t)throw new Error(`Element not found: ${e}`);return t}function w(e){E(C(e),"error")}function C(e){return e instanceof Error?e.message:"操作失败"}function ae(e){J.innerHTML=`
    <div class="app-shell">
      <div class="ambient ambient-a"></div>
      <div class="ambient ambient-b"></div>
      <section class="hero-card" style="margin-top: 18vh;">
        <div class="section-head">
          <h3>净水智控</h3>
        </div>
        <div class="status-line" data-tone="error" style="margin-top: 18px;">
          ${A(e||"启动失败")}
        </div>
      </section>
    </div>
  `}function A(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function ct(e){return A(e).replaceAll("`","")}
