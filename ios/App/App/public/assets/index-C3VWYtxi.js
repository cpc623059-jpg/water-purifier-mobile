(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const i of n)if(i.type==="childList")for(const r of i.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&s(r)}).observe(document,{childList:!0,subtree:!0});function a(n){const i={};return n.integrity&&(i.integrity=n.integrity),n.referrerPolicy&&(i.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?i.credentials="include":n.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function s(n){if(n.ep)return;n.ep=!0;const i=a(n);fetch(n.href,i)}})();var C;(function(e){e.Unimplemented="UNIMPLEMENTED",e.Unavailable="UNAVAILABLE"})(C||(C={}));class M extends Error{constructor(t,a,s){super(t),this.message=t,this.code=a,this.data=s}}const ge=e=>{var t,a;return e?.androidBridge?"android":!((a=(t=e?.webkit)===null||t===void 0?void 0:t.messageHandlers)===null||a===void 0)&&a.bridge?"ios":"web"},ye=e=>{const t=e.CapacitorCustomPlatform||null,a=e.Capacitor||{},s=a.Plugins=a.Plugins||{},n=()=>t!==null?t.name:ge(e),i=()=>n()!=="web",r=u=>{const b=m.get(u);return!!(b?.platforms.has(n())||c(u))},c=u=>{var b;return(b=a.PluginHeaders)===null||b===void 0?void 0:b.find(R=>R.name===u)},w=u=>e.console.error(u),m=new Map,g=(u,b={})=>{const R=m.get(u);if(R)return console.warn(`Capacitor plugin "${u}" already registered. Cannot register plugins twice.`),R.proxy;const $=n(),F=c(u);let P;const he=async()=>(!P&&$ in b?P=typeof b[$]=="function"?P=await b[$]():P=b[$]:t!==null&&!P&&"web"in b&&(P=typeof b.web=="function"?P=await b.web():P=b.web),P),ve=(S,E)=>{var k,x;if(F){const B=F?.methods.find(T=>E===T.name);if(B)return B.rtype==="promise"?T=>a.nativePromise(u,E.toString(),T):(T,I)=>a.nativeCallback(u,E.toString(),T,I);if(S)return(k=S[E])===null||k===void 0?void 0:k.bind(S)}else{if(S)return(x=S[E])===null||x===void 0?void 0:x.bind(S);throw new M(`"${u}" plugin is not implemented on ${$}`,C.Unimplemented)}},D=S=>{let E;const k=(...x)=>{const B=he().then(T=>{const I=ve(T,S);if(I){const W=I(...x);return E=W?.remove,W}else throw new M(`"${u}.${S}()" is not implemented on ${$}`,C.Unimplemented)});return S==="addListener"&&(B.remove=async()=>E()),B};return k.toString=()=>`${S.toString()}() { [capacitor code] }`,Object.defineProperty(k,"name",{value:S,writable:!1,configurable:!1}),k},ee=D("addListener"),te=D("removeListener"),we=(S,E)=>{const k=ee({eventName:S},E),x=async()=>{const T=await k;te({eventName:S,callbackId:T},E)},B=new Promise(T=>k.then(()=>T({remove:x})));return B.remove=async()=>{console.warn("Using addListener() without 'await' is deprecated."),await x()},B},V=new Proxy({},{get(S,E){switch(E){case"$$typeof":return;case"toJSON":return()=>({});case"addListener":return F?we:ee;case"removeListener":return te;default:return D(E)}}});return s[u]=V,m.set(u,{name:u,proxy:V,platforms:new Set([...Object.keys(b),...F?[$]:[]])}),V};return a.convertFileSrc||(a.convertFileSrc=u=>u),a.getPlatform=n,a.handleError=w,a.isNativePlatform=i,a.isPluginAvailable=r,a.registerPlugin=g,a.Exception=M,a.DEBUG=!!a.DEBUG,a.isLoggingEnabled=!!a.isLoggingEnabled,a},Se=e=>e.Capacitor=ye(e),j=Se(typeof globalThis<"u"?globalThis:typeof self<"u"?self:typeof window<"u"?window:typeof global<"u"?global:{}),ce=j.registerPlugin;class oe{constructor(){this.listeners={},this.retainedEventArguments={},this.windowListeners={}}addListener(t,a){let s=!1;this.listeners[t]||(this.listeners[t]=[],s=!0),this.listeners[t].push(a);const i=this.windowListeners[t];i&&!i.registered&&this.addWindowListener(i),s&&this.sendRetainedArgumentsForEvent(t);const r=async()=>this.removeListener(t,a);return Promise.resolve({remove:r})}async removeAllListeners(){this.listeners={};for(const t in this.windowListeners)this.removeWindowListener(this.windowListeners[t]);this.windowListeners={}}notifyListeners(t,a,s){const n=this.listeners[t];if(!n){if(s){let i=this.retainedEventArguments[t];i||(i=[]),i.push(a),this.retainedEventArguments[t]=i}return}n.forEach(i=>i(a))}hasListeners(t){var a;return!!(!((a=this.listeners[t])===null||a===void 0)&&a.length)}registerWindowListener(t,a){this.windowListeners[a]={registered:!1,windowEventName:t,pluginEventName:a,handler:s=>{this.notifyListeners(a,s)}}}unimplemented(t="not implemented"){return new j.Exception(t,C.Unimplemented)}unavailable(t="not available"){return new j.Exception(t,C.Unavailable)}async removeListener(t,a){const s=this.listeners[t];if(!s)return;const n=s.indexOf(a);this.listeners[t].splice(n,1),this.listeners[t].length||this.removeWindowListener(this.windowListeners[t])}addWindowListener(t){window.addEventListener(t.windowEventName,t.handler),t.registered=!0}removeWindowListener(t){t&&(window.removeEventListener(t.windowEventName,t.handler),t.registered=!1)}sendRetainedArgumentsForEvent(t){const a=this.retainedEventArguments[t];a&&(delete this.retainedEventArguments[t],a.forEach(s=>{this.notifyListeners(t,s)}))}}const ae=e=>encodeURIComponent(e).replace(/%(2[346B]|5E|60|7C)/g,decodeURIComponent).replace(/[()]/g,escape),se=e=>e.replace(/(%[\dA-F]{2})+/gi,decodeURIComponent);class Ee extends oe{async getCookies(){const t=document.cookie,a={};return t.split(";").forEach(s=>{if(s.length<=0)return;let[n,i]=s.replace(/=/,"CAP_COOKIE").split("CAP_COOKIE");n=se(n).trim(),i=se(i).trim(),a[n]=i}),a}async setCookie(t){try{const a=ae(t.key),s=ae(t.value),n=t.expires?`; expires=${t.expires.replace("expires=","")}`:"",i=(t.path||"/").replace("path=",""),r=t.url!=null&&t.url.length>0?`domain=${t.url}`:"";document.cookie=`${a}=${s||""}${n}; path=${i}; ${r};`}catch(a){return Promise.reject(a)}}async deleteCookie(t){try{document.cookie=`${t.key}=; Max-Age=0`}catch(a){return Promise.reject(a)}}async clearCookies(){try{const t=document.cookie.split(";")||[];for(const a of t)document.cookie=a.replace(/^ +/,"").replace(/=.*/,`=;expires=${new Date().toUTCString()};path=/`)}catch(t){return Promise.reject(t)}}async clearAllCookies(){try{await this.clearCookies()}catch(t){return Promise.reject(t)}}}ce("CapacitorCookies",{web:()=>new Ee});const Le=async e=>new Promise((t,a)=>{const s=new FileReader;s.onload=()=>{const n=s.result;t(n.indexOf(",")>=0?n.split(",")[1]:n)},s.onerror=n=>a(n),s.readAsDataURL(e)}),Te=(e={})=>{const t=Object.keys(e);return Object.keys(e).map(n=>n.toLocaleLowerCase()).reduce((n,i,r)=>(n[i]=e[t[r]],n),{})},ke=(e,t=!0)=>e?Object.entries(e).reduce((s,n)=>{const[i,r]=n;let c,w;return Array.isArray(r)?(w="",r.forEach(m=>{c=t?encodeURIComponent(m):m,w+=`${i}=${c}&`}),w.slice(0,-1)):(c=t?encodeURIComponent(r):r,w=`${i}=${c}`),`${s}&${w}`},"").substr(1):null,Pe=(e,t={})=>{const a=Object.assign({method:e.method||"GET",headers:e.headers},t),n=Te(e.headers)["content-type"]||"";if(typeof e.data=="string")a.body=e.data;else if(n.includes("application/x-www-form-urlencoded")){const i=new URLSearchParams;for(const[r,c]of Object.entries(e.data||{}))i.set(r,c);a.body=i.toString()}else if(n.includes("multipart/form-data")||e.data instanceof FormData){const i=new FormData;if(e.data instanceof FormData)e.data.forEach((c,w)=>{i.append(w,c)});else for(const c of Object.keys(e.data))i.append(c,e.data[c]);a.body=i;const r=new Headers(a.headers);r.delete("content-type"),a.headers=r}else(n.includes("application/json")||typeof e.data=="object")&&(a.body=JSON.stringify(e.data));return a};class xe extends oe{async request(t){const a=Pe(t,t.webFetchExtra),s=ke(t.params,t.shouldEncodeUrlParams),n=s?`${t.url}?${s}`:t.url,i=await fetch(n,a),r=i.headers.get("content-type")||"";let{responseType:c="text"}=i.ok?t:{};r.includes("application/json")&&(c="json");let w,m;switch(c){case"arraybuffer":case"blob":m=await i.blob(),w=await Le(m);break;case"json":w=await i.json();break;default:w=await i.text()}const g={};return i.headers.forEach((u,b)=>{g[b]=u}),{data:w,headers:g,status:i.status,url:i.url}}async get(t){return this.request(Object.assign(Object.assign({},t),{method:"GET"}))}async post(t){return this.request(Object.assign(Object.assign({},t),{method:"POST"}))}async put(t){return this.request(Object.assign(Object.assign({},t),{method:"PUT"}))}async patch(t){return this.request(Object.assign(Object.assign({},t),{method:"PATCH"}))}async delete(t){return this.request(Object.assign(Object.assign({},t),{method:"DELETE"}))}}const Be=ce("CapacitorHttp",{web:()=>new xe}),$e="http://ik.cccpc.cc:18081",Fe=5e3,q=["1级 PP棉","2级 颗粒炭","3级 烧结炭","4级 RO膜","5级 后置炭"],le=["ltx","lty","rtx","rty","mx","my","lbx","lby","rbx","rby","cbx","cby"],Ce={ltx:"左上 X",lty:"左上 Y",rtx:"右上 X",rty:"右上 Y",mx:"主区 X",my:"主区 Y",lbx:"左下 X",lby:"左下 Y",rbx:"右下 X",rby:"右下 Y",cbx:"底中 X",cby:"底中 Y"},l={filters:[],activeFilterIndex:0,wifiHasSavedPassword:!1,savedWifiSsid:"",pollTimer:0},de=document.querySelector("#app");if(!de)throw new Error("App root not found");de.innerHTML=`
  <div class="app-shell">
    <div class="ambient ambient-a"></div>
    <div class="ambient ambient-b"></div>

    <header class="topbar compact-topbar">
      <div class="brand-block">
        <h1 class="app-title">净水智控</h1>
        <p class="top-state" id="overviewState">连接中</p>
      </div>
      <div class="topbar-actions">
        <span class="runtime-pill" id="heroNet">--</span>
        <button id="syncBtn" class="glass-icon-button" type="button">刷新</button>
      </div>
    </header>

    <section class="status-banner" id="statusLine" data-tone="warn">正在同步</section>

    <main class="app-main">
      <section class="panel active" id="panel-overview">
        <section class="hero-card">
          <div class="hero-grid">
            <article class="hero-metric">
              <span>当前时间</span>
              <strong id="overviewTime">--:--</strong>
            </article>
            <article class="hero-metric">
              <span>水位状态</span>
              <strong id="overviewWater">--</strong>
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
            <h3>快捷控制</h3>
          </div>
          <div class="action-grid">
            <button class="action-card action-make" data-command="make" type="button">
              <strong>手动制水</strong>
              <span>开始</span>
            </button>
            <button class="action-card action-wash" data-command="wash" type="button">
              <strong>手动洗膜</strong>
              <span>冲洗</span>
            </button>
            <button class="action-card action-stop" data-command="stop" type="button">
              <strong>停止</strong>
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
            <h3>滤芯</h3>
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
              <span>洗膜时长</span>
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
            <h3>日志</h3>
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
`;Re();Ae();Oe();ue().catch(e=>L(Z(e),"error"));function Ae(){document.querySelectorAll(".tab").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active")),document.querySelectorAll(".panel").forEach(t=>t.classList.remove("active")),e.classList.add("active"),document.getElementById(`panel-${e.dataset.target}`)?.classList.add("active")})})}function Oe(){h("syncBtn").addEventListener("click",()=>ue().catch(v)),document.querySelectorAll("[data-command]").forEach(e=>{e.addEventListener("click",async()=>{const t=e.dataset.command;if(t)try{await d("/api/cmd",{query:{c:t},allowEmpty:!0}),L(`已发送：${t}`,"ok"),await z()}catch(a){L(Z(a),"error")}})}),h("loadParamsBtn").addEventListener("click",()=>K().catch(v)),h("saveParamsBtn").addEventListener("click",()=>We().catch(v)),h("filterTodayBtn").addEventListener("click",qe),h("saveFilterBtn").addEventListener("click",()=>je().catch(v)),h("resetFilterBtn").addEventListener("click",()=>Ue().catch(v)),h("resetAllFiltersBtn").addEventListener("click",()=>He().catch(v)),h("scanWifiBtn").addEventListener("click",()=>fe().catch(v)),h("saveWifiBtn").addEventListener("click",()=>De().catch(v)),h("syncTimeBtn").addEventListener("click",()=>Ve().catch(v)),h("saveTimeBtn").addEventListener("click",()=>Me().catch(v)),h("saveTtsBtn").addEventListener("click",()=>_e().catch(v)),h("primeVoiceBtn").addEventListener("click",()=>Ne().catch(v)),h("clearVoiceBtn").addEventListener("click",()=>ze().catch(v)),h("probeVoiceBtn").addEventListener("click",()=>Ke().catch(v)),h("loadScreenBtn").addEventListener("click",()=>Y().catch(v)),h("saveScreenBtn").addEventListener("click",()=>Ge().catch(v)),h("refreshLogsBtn").addEventListener("click",()=>J().catch(v)),h("clearLogsBtn").addEventListener("click",()=>Qe().catch(v))}function Re(){const e=H("screenFieldGrid");e.innerHTML=le.map(t=>`
      <label class="field">
        <span>${Ce[t]}</span>
        <input id="screen-${t}" type="number" min="0" max="128" step="1" />
      </label>
    `).join("")}async function ue(){L("正在同步","warn"),await z(),await Promise.allSettled([K(),G(),me(),X(),O(),Y(),J()]),Ie(),L("","ok")}function Ie(){l.pollTimer&&window.clearInterval(l.pollTimer),l.pollTimer=window.setInterval(()=>{z().catch(()=>{})},Fe)}async function z(){const e=await d("/api/status");o("metricState",e.state||"--"),o("metricNet",e.net||"--"),o("metricTime",e.time||"--:--"),o("metricTds",ne(e.tdsPure??e.tds,e.tdsen!==!1,e.tdsPureProbe)),o("metricRawTds",ne(e.tdsRaw,e.tdsen!==!1,e.tdsRawProbe)),o("metricTemp",ie(e.tempPure??e.temp,e.tempen!==!1,e.tempPureProbe)),o("metricRawTemp",ie(e.tempRaw,e.tempen!==!1,e.tempRawProbe)),o("metricWater",e.water||"--"),o("metricRemain",Xe(e.rem)),o("metricQuality",re(e)),o("metricRssi",Number.isFinite(e.rssi)?`${e.rssi} dBm`:"-- dBm"),o("overviewState",e.state||"在线"),o("heroNet",e.net||"在线"),o("overviewTime",e.time||"--:--"),o("overviewWater",e.water||"--"),o("overviewQuality",re(e)),o("overviewSignal",Number.isFinite(e.rssi)?`${e.rssi} dBm`:"-- dBm")}async function K(){const e=await d("/api/getparams");p("param-mk",String(e.mk??60)),p("param-dly",String(e.dly??30)),p("param-wsh",String(e.wsh??60)),p("param-slp",String(e.slp??0)),p("param-vol",String(e.vol??25)),p("param-tdth",String(e.tdth??100)),_("param-voc",!!e.voc),_("param-buz",!!e.buz),_("param-tdsen",e.tdsen!==!1)}async function We(){await d("/api/save",{query:{mk:f("param-mk"),dly:f("param-dly"),wsh:f("param-wsh"),slp:f("param-slp"),vol:f("param-vol"),tdth:f("param-tdth"),voc:N("param-voc")?1:0,buz:N("param-buz")?1:0,tdsen:N("param-tdsen")?1:0},allowEmpty:!0}),L("参数已保存","ok"),await K()}async function G(){const e=await d("/api/filters");for(l.filters=(e||[]).map((t,a)=>({name:t.name||q[a]||`滤芯 ${a+1}`,date:(t.date||"2026-01-01").slice(0,10),life:Number(t.life)||6}));l.filters.length<q.length;)l.filters.push({name:q[l.filters.length],date:"2026-01-01",life:6});l.activeFilterIndex>=l.filters.length&&(l.activeFilterIndex=0),Q(),pe()}function Q(){const e=H("filterList");e.innerHTML=l.filters.map((t,a)=>`
        <button class="filter-card${a===l.activeFilterIndex?" active":""}" type="button" data-filter-index="${a}">
          <span>${A(t.name)}</span>
          <strong>${A(t.date)}</strong>
          <small>${t.life} 个月</small>
        </button>
      `).join(""),e.querySelectorAll("[data-filter-index]").forEach(t=>{t.addEventListener("click",()=>{l.activeFilterIndex=Number(t.dataset.filterIndex||0),Q(),pe()})})}function pe(){const e=l.filters[l.activeFilterIndex];e&&(p("filterName",e.name),p("filterDate",e.date),p("filterLife",String(e.life)))}function qe(){p("filterDate",new Date().toISOString().slice(0,10))}async function je(){const e=l.activeFilterIndex,t=f("filterName").trim()||q[e],a=f("filterDate"),s=Number(f("filterLife"))||6;await d("/api/savefilter",{query:{id:e,date:a,life:s},allowEmpty:!0}),l.filters[e]={name:t,date:a,life:s},Q(),L(`滤芯 ${e+1} 已保存`,"ok")}async function Ue(){await d("/api/resetfilter",{query:{id:l.activeFilterIndex},allowEmpty:!0}),L(`滤芯 ${l.activeFilterIndex+1} 已重置`,"ok"),await G()}async function He(){await d("/api/resetallfilters",{allowEmpty:!0}),L("全部滤芯已重置","ok"),await G()}async function me(){const e=await d("/api/wifi");l.savedWifiSsid=e.ssid||"",l.wifiHasSavedPassword=!!e.hasPass,p("wifiSsid",e.ssid||""),p("wifiPass",""),U("wifiPass").placeholder=e.hasPass?"留空保留原密码":"密码",y("wifiStatus","WiFi 已读取","ok")}async function fe(){y("wifiStatus","扫描中","warn");const e=H("wifiList");e.innerHTML="";const t=await d("/api/wifiscan");if(t.status==="scanning"){window.setTimeout(()=>fe().catch(v),800);return}if(t.status!=="done"){y("wifiStatus","扫描失败","error");return}const a=t.list||[];if(!a.length){y("wifiStatus","未找到 WiFi","warn");return}e.innerHTML=a.map(s=>`
        <button class="wifi-item" type="button" data-ssid="${Ze(s.ssid)}">
          <span>${A(s.ssid)}</span>
          <small>${s.rssi} dBm · ${A(s.secure||"未知")}</small>
        </button>
      `).join(""),e.querySelectorAll("[data-ssid]").forEach(s=>{s.addEventListener("click",()=>{p("wifiSsid",s.dataset.ssid||""),y("wifiStatus",`已选择 ${s.dataset.ssid||""}`,"ok")})}),y("wifiStatus","扫描完成","ok")}async function De(){const e=f("wifiSsid"),t=f("wifiPass"),a=!t&&l.wifiHasSavedPassword&&e===l.savedWifiSsid?1:0;await d("/api/savewifi",{method:"POST",form:{ssid:e,pass:t,keep:a},allowEmpty:!0}),y("wifiStatus","WiFi 已保存","ok"),await me()}async function X(){const e=await d("/api/time"),t=e.valid?`${e.date||"--"} ${e.time||"--"}`:"--";y("timeState",t,"ok"),e.datetime&&p("manualTime",e.datetime)}async function Ve(){await d("/api/synctime",{allowEmpty:!0}),y("timeState","已发送校时","warn"),await X()}async function Me(){const e=f("manualTime");if(!e){y("timeState","请选择时间","warn");return}const t=Math.floor(new Date(e).getTime()/1e3);await d("/api/settime",{method:"POST",form:{epoch:t},allowEmpty:!0}),y("timeState","时间已保存","ok"),await X()}async function O(){const e=await d("/api/tts");p("ttsAppid",e.appid||""),p("ttsToken",""),U("ttsToken").placeholder=e.hasToken?"留空保留":"Token",p("ttsVoice",e.voice||"zh_female_wanwanxiaohe_moon_bigtts"),o("voiceCacheRatio",`${e.cache||0} / ${e.total||0}`),o("voiceReadyState",e.ready===!1?"待配置":(e.cache||0)>=(e.total||0)&&(e.total||0)>0?"已完成":"未完成"),o("voiceFlashState",e.flashReady?"已挂载":e.flashTaskRunning?"挂载中":e.flashQueued?"排队中":e.flashResultKnown?"失败":"未检测"),o("voiceEnabledState",e.en===!1?"关闭":"启用"),y("voiceStatus","语音已读取","ok")}async function _e(){await d("/api/tts",{method:"POST",form:{en:1,appid:f("ttsAppid"),token:f("ttsToken"),voice:f("ttsVoice"),keep:f("ttsToken")?0:1},allowEmpty:!0}),y("voiceStatus","语音已保存","ok"),await O()}async function Ne(){await d("/api/voicecache",{method:"POST",query:{c:"prime"},allowEmpty:!0}),y("voiceStatus","已开始缓存","warn"),await O()}async function ze(){const e=await d("/api/voicecache",{method:"POST",query:{c:"clear"},expect:"text"});y("voiceStatus",e||"缓存已清空","ok"),await O()}async function Ke(){await d("/api/voiceflash",{method:"POST",query:{c:"probe"},allowEmpty:!0}),y("voiceStatus","已探测 TF","warn"),await O()}async function Y(){const e=await d("/api/getscreen");le.forEach(t=>p(`screen-${t}`,String(e[t]??0))),p("screenBt",e.bt||""),p("screenBs",e.bs||""),p("screenBd",String(e.bd??2)),Ye("screenRot",String(e.rot??0))}async function Ge(){await d("/api/savescreen",{query:{bt:f("screenBt"),bs:f("screenBs"),bd:f("screenBd"),rot:f("screenRot")},allowEmpty:!0}),L("屏幕参数已保存","ok"),await Y()}async function J(){const e=await d("/api/logs"),t=e.freeHeap?` · ${Math.round(e.freeHeap/1024)}KB`:"";o("logMeta",`日志 ${e.count||0}${t}`),o("logText",(e.items||[]).join(`
`)||"暂无日志。")}async function Qe(){await d("/api/clearlogs",{allowEmpty:!0}),L("日志已清空","ok"),await J()}async function d(e,t={}){const a=new URL(e,`${$e}/`);Object.entries(t.query||{}).forEach(([m,g])=>{g==null||g===""||a.searchParams.set(m,String(g))});const s=t.method||"GET",n=t.expect||"json",i=t.allowEmpty??!1,r=new URLSearchParams;if(Object.entries(t.form||{}).forEach(([m,g])=>{g!=null&&r.set(m,String(g))}),j.isNativePlatform()){const m=await Be.request({url:a.toString(),method:s,headers:r.size?{"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"}:void 0,data:r.size?r.toString():void 0,responseType:"text",readTimeout:12e3,connectTimeout:12e3});if(m.status>=400)throw new Error(`请求失败：HTTP ${m.status}`);const g=typeof m.data=="string"?m.data:m.data==null?"":JSON.stringify(m.data);if(n==="text")return g;if(!g){if(i)return;throw new Error("请求失败：空响应")}return JSON.parse(g)}const c=await fetch(a.toString(),{method:s,headers:r.size?{"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"}:void 0,body:s==="POST"?r.toString():void 0,cache:"no-store"});if(!c.ok)throw new Error(`请求失败：HTTP ${c.status}`);if(n==="text")return await c.text();const w=await c.text();if(!w){if(i)return;throw new Error("请求失败：空响应")}return JSON.parse(w)}function ne(e,t,a){return t?a?Number.isFinite(Number(e))?`${Number(e)} ppm`:"-- ppm":"未安装":"模块关闭"}function ie(e,t,a){return t?a?Number.isFinite(Number(e))?`${Number(e).toFixed(1)} °C`:"-- °C":"未安装":"模块关闭"}function re(e){return e.tdsen===!1?"已关闭":!e.tdsPureProbe&&!e.tdsRawProbe?"未安装":e.tdsq||"--"}function Xe(e){if(!Number.isFinite(e)||Number(e)<=0)return"--:--";const t=Number(e),a=Math.floor(t/3600),s=Math.floor(t%3600/60),n=t%60;return a>0?`${a}:${String(s).padStart(2,"0")}:${String(n).padStart(2,"0")}`:`${String(s).padStart(2,"0")}:${String(n).padStart(2,"0")}`}function L(e,t="ok"){y("statusLine",e,t)}function y(e,t,a){const s=H(e);s.textContent=t,s.dataset.tone=a}function o(e,t){const a=document.getElementById(e);a&&(a.textContent=t)}function p(e,t){be(e).value=t}function Ye(e,t){Je(e).value=t}function _(e,t){U(e).checked=t}function f(e){return be(e).value}function N(e){return U(e).checked}function be(e){const t=document.getElementById(e);if(!t)throw new Error(`Field not found: ${e}`);return t}function U(e){const t=document.getElementById(e);if(!t)throw new Error(`Input not found: ${e}`);return t}function Je(e){const t=document.getElementById(e);if(!t)throw new Error(`Select not found: ${e}`);return t}function h(e){const t=document.getElementById(e);if(!t)throw new Error(`Button not found: ${e}`);return t}function H(e){const t=document.getElementById(e);if(!t)throw new Error(`Element not found: ${e}`);return t}function v(e){L(Z(e),"error")}function Z(e){return e instanceof Error?e.message:"操作失败"}function A(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function Ze(e){return A(e).replaceAll("`","")}
