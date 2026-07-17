import UIKit
import SwiftUI
@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?
    private let store = DeviceStore()

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        let window = UIWindow(frame: UIScreen.main.bounds)
        window.rootViewController = UIHostingController(rootView: RootView(store: store))
        window.makeKeyAndVisible()
        self.window = window
        store.bootstrap()
        return true
    }
}

private enum RootTab: Hashable {
    case overview
    case filters
    case settings
    case logs
}

private enum BannerTone {
    case ok
    case warn
    case error

    var tint: Color {
        switch self {
        case .ok:
            return Color(red: 0.12, green: 0.66, blue: 0.49)
        case .warn:
            return Color(red: 0.95, green: 0.66, blue: 0.18)
        case .error:
            return Color(red: 0.92, green: 0.34, blue: 0.34)
        }
    }
}

private struct StatusPayload: Decodable {
    var state: String?
    var time: String?
    var tds: Int?
    var tdsPure: Int?
    var tdsRaw: Int?
    var temp: Double?
    var tempPure: Double?
    var tempRaw: Double?
    var water: String?
    var rem: Int?
    var tdsq: String?
    var ip: String?
    var net: String?
    var rssi: Int?
    var tdsen: Bool?
    var tempen: Bool?
    var tdsPureProbe: Bool?
    var tdsRawProbe: Bool?
    var tempPureProbe: Bool?
    var tempRawProbe: Bool?
}

private struct ParamsPayload: Decodable {
    var mk: Int?
    var dly: Int?
    var wsh: Int?
    var slp: Int?
    var vol: Int?
    var tdth: Int?
    var voc: Bool?
    var buz: Bool?
    var tdsen: Bool?
}

private struct RemoteFilterPayload: Decodable {
    var name: String?
    var date: String?
    var life: Int?
}

private struct FilterItem: Identifiable {
    let id: Int
    var name: String
    var date: String
    var life: Int
}

private struct WifiPayload: Decodable {
    var ssid: String?
    var hasPass: Bool?
}

private struct WifiScanPayload: Decodable {
    struct Network: Decodable, Identifiable {
        var id: String { ssid }
        var ssid: String
        var rssi: Int
        var secure: String
    }

    var status: String?
    var list: [Network]?
}

private struct TimePayload: Decodable {
    var valid: Bool?
    var date: String?
    var time: String?
    var datetime: String?
}

private struct TtsPayload: Decodable {
    var appid: String?
    var hasToken: Bool?
    var voice: String?
    var total: Int?
    var cache: Int?
    var ready: Bool?
    var en: Bool?
    var flashReady: Bool?
    var flashTaskRunning: Bool?
    var flashQueued: Bool?
    var flashResultKnown: Bool?
}

private struct ScreenPayload: Decodable {
    var ltx: Int?
    var lty: Int?
    var rtx: Int?
    var rty: Int?
    var mx: Int?
    var my: Int?
    var lbx: Int?
    var lby: Int?
    var rbx: Int?
    var rby: Int?
    var cbx: Int?
    var cby: Int?
    var bt: String?
    var bs: String?
    var bd: Int?
    var rot: Int?
}

private struct LogsPayload: Decodable {
    var count: Int?
    var freeHeap: Int?
    var items: [String]?
}

private enum ServiceEndpoint {
    static let primaryURL = URL(string: "http://ik.cccpc.cc:18081")!
    static let candidates = [primaryURL]
    static let accessMode = "默认接入"
}

@MainActor
private final class DeviceStore: ObservableObject {
    private let filterNames = ["1级 PP棉", "2级 颗粒炭", "3级 烧结炭", "4级 RO膜", "5级 后置炭"]
    private var timer: Timer?

    @Published var selectedTab: RootTab = .overview
    @Published var bannerText = "正在同步"
    @Published var bannerTone: BannerTone = .warn

    @Published var heroState = "连接中"
    @Published var overviewTime = "--:--"
    @Published var overviewAccess = ServiceEndpoint.accessMode
    @Published var overviewQuality = "--"
    @Published var overviewSignal = "-- dBm"

    @Published var metricState = "--"
    @Published var metricWater = "--"
    @Published var metricTds = "-- ppm"
    @Published var metricRawTds = "-- ppm"
    @Published var metricTemp = "-- °C"
    @Published var metricRawTemp = "-- °C"
    @Published var metricNet = "--"
    @Published var metricAccess = ServiceEndpoint.accessMode
    @Published var metricTime = "--:--"
    @Published var metricRemain = "--:--"
    @Published var metricQuality = "--"
    @Published var metricRssi = "-- dBm"

    @Published var filters: [FilterItem] = []
    @Published var activeFilterIndex = 0
    @Published var filterName = ""
    @Published var filterDate = ""
    @Published var filterLife = "6"

    @Published var mk = "60"
    @Published var dly = "30"
    @Published var wsh = "60"
    @Published var slp = "0"
    @Published var vol = "25"
    @Published var tdth = "100"
    @Published var voc = true
    @Published var buz = true
    @Published var tdsen = true

    @Published var wifiSsid = ""
    @Published var wifiPass = ""
    @Published var wifiNetworks: [WifiScanPayload.Network] = []
    @Published var wifiStatus = "--"
    private var wifiHasSavedPassword = false
    private var savedWifiSsid = ""

    @Published var timeStatus = "--"
    @Published var manualTime = ""

    @Published var ttsAppid = ""
    @Published var ttsToken = ""
    @Published var ttsVoice = "zh_female_wanwanxiaohe_moon_bigtts"
    @Published var voiceCacheRatio = "0 / 0"
    @Published var voiceReadyState = "--"
    @Published var voiceFlashState = "--"
    @Published var voiceEnabledState = "--"
    @Published var voiceStatus = "--"

    @Published var screenLtx = "0"
    @Published var screenLty = "0"
    @Published var screenRtx = "0"
    @Published var screenRty = "0"
    @Published var screenMx = "0"
    @Published var screenMy = "0"
    @Published var screenLbx = "0"
    @Published var screenLby = "0"
    @Published var screenRbx = "0"
    @Published var screenRby = "0"
    @Published var screenCbx = "0"
    @Published var screenCby = "0"
    @Published var screenBt = ""
    @Published var screenBs = ""
    @Published var screenBd = "2"
    @Published var screenRot = 0

    @Published var logMeta = "日志 0"
    @Published var logs = "暂无日志。"

    func bootstrap() {
        Task { await syncAll() }

        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 5.0, repeats: true) { [weak self] _ in
            guard let self else { return }
            Task { await self.loadStatusSilently() }
        }
    }

    func syncAll() async {
        updateBanner("正在同步", tone: .warn)
        await loadStatusSilently()
        async let a = loadParams()
        async let b = loadFilters()
        async let c = loadWifi()
        async let d = loadTime()
        async let e = loadTts()
        async let f = loadScreen()
        async let g = loadLogs()
        _ = await (a, b, c, d, e, f, g)
        updateBanner("已同步", tone: .ok)
    }

    func sendCommand(_ command: String) async {
        do {
            try await sendRequest(path: "/api/cmd", method: "GET", query: ["c": command])
            updateBanner("已发送 \(command)", tone: .ok)
            await loadStatusSilently()
        } catch {
            updateBanner(readable(error), tone: .error)
        }
    }

    func saveParams() async {
        do {
            try await sendRequest(
                path: "/api/save",
                method: "GET",
                query: [
                    "mk": mk,
                    "dly": dly,
                    "wsh": wsh,
                    "slp": slp,
                    "vol": vol,
                    "tdth": tdth,
                    "voc": voc ? "1" : "0",
                    "buz": buz ? "1" : "0",
                    "tdsen": tdsen ? "1" : "0",
                ]
            )
            updateBanner("参数已保存", tone: .ok)
            await loadParams()
        } catch {
            updateBanner(readable(error), tone: .error)
        }
    }

    func selectFilter(_ index: Int) {
        activeFilterIndex = index
        guard filters.indices.contains(index) else { return }
        let item = filters[index]
        filterName = item.name
        filterDate = item.date
        filterLife = "\(item.life)"
    }

    func setFilterToday() {
        filterDate = isoDate(Date())
    }

    func saveFilter() async {
        let life = Int(filterLife) ?? 6
        do {
            try await sendRequest(
                path: "/api/savefilter",
                method: "GET",
                query: [
                    "id": "\(activeFilterIndex)",
                    "date": filterDate,
                    "life": "\(life)",
                ]
            )
            if filters.indices.contains(activeFilterIndex) {
                filters[activeFilterIndex].name = filterName
                filters[activeFilterIndex].date = filterDate
                filters[activeFilterIndex].life = life
            }
            updateBanner("滤芯已保存", tone: .ok)
        } catch {
            updateBanner(readable(error), tone: .error)
        }
    }

    func resetCurrentFilter() async {
        do {
            try await sendRequest(path: "/api/resetfilter", method: "GET", query: ["id": "\(activeFilterIndex)"])
            updateBanner("滤芯已重置", tone: .ok)
            await loadFilters()
        } catch {
            updateBanner(readable(error), tone: .error)
        }
    }

    func resetAllFilters() async {
        do {
            try await sendRequest(path: "/api/resetallfilters", method: "GET")
            updateBanner("全部滤芯已重置", tone: .ok)
            await loadFilters()
        } catch {
            updateBanner(readable(error), tone: .error)
        }
    }

    func scanWifi() async {
        wifiStatus = "扫描中"
        do {
            let payload: WifiScanPayload = try await request(path: "/api/wifiscan")
            if payload.status == "scanning" {
                try? await Task.sleep(nanoseconds: 800_000_000)
                await scanWifi()
                return
            }
            if payload.status != "done" {
                wifiStatus = "扫描失败"
                return
            }
            wifiNetworks = payload.list ?? []
            wifiStatus = wifiNetworks.isEmpty ? "未找到 WiFi" : "扫描完成"
        } catch {
            wifiStatus = "扫描失败"
        }
    }

    func chooseWifi(_ network: WifiScanPayload.Network) {
        wifiSsid = network.ssid
        wifiStatus = "已选择 \(network.ssid)"
    }

    func saveWifi() async {
        let keep = wifiPass.isEmpty && wifiHasSavedPassword && wifiSsid == savedWifiSsid
        do {
            try await sendRequest(
                path: "/api/savewifi",
                method: "POST",
                form: [
                    "ssid": wifiSsid,
                    "pass": wifiPass,
                    "keep": keep ? "1" : "0",
                ]
            )
            wifiStatus = "WiFi 已保存"
            await loadWifi()
        } catch {
            wifiStatus = "保存失败"
        }
    }

    func syncTime() async {
        do {
            try await sendRequest(path: "/api/synctime", method: "GET")
            timeStatus = "已发送校时"
            await loadTime()
        } catch {
            timeStatus = "校时失败"
        }
    }

    func saveTime() async {
        guard !manualTime.isEmpty else {
            timeStatus = "请选择时间"
            return
        }
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm"
        guard let date = formatter.date(from: manualTime) else {
            timeStatus = "时间格式错误"
            return
        }
        do {
            try await sendRequest(path: "/api/settime", method: "POST", form: ["epoch": "\(Int(date.timeIntervalSince1970))"])
            timeStatus = "时间已保存"
            await loadTime()
        } catch {
            timeStatus = "保存失败"
        }
    }

    func saveTts() async {
        do {
            try await sendRequest(
                path: "/api/tts",
                method: "POST",
                form: [
                    "en": "1",
                    "appid": ttsAppid,
                    "token": ttsToken,
                    "voice": ttsVoice,
                    "keep": ttsToken.isEmpty ? "1" : "0",
                ]
            )
            voiceStatus = "语音已保存"
            await loadTts()
        } catch {
            voiceStatus = "保存失败"
        }
    }

    func primeVoiceCache() async {
        do {
            try await sendRequest(path: "/api/voicecache", method: "POST", query: ["c": "prime"])
            voiceStatus = "已开始缓存"
            await loadTts()
        } catch {
            voiceStatus = "操作失败"
        }
    }

    func clearVoiceCache() async {
        do {
            let text = try await requestText(path: "/api/voicecache", method: "POST", query: ["c": "clear"])
            voiceStatus = text.isEmpty ? "缓存已清空" : text
            await loadTts()
        } catch {
            voiceStatus = "清空失败"
        }
    }

    func probeVoiceFlash() async {
        do {
            try await sendRequest(path: "/api/voiceflash", method: "POST", query: ["c": "probe"])
            voiceStatus = "已探测 TF"
            await loadTts()
        } catch {
            voiceStatus = "探测失败"
        }
    }

    func saveScreen() async {
        do {
            try await sendRequest(
                path: "/api/savescreen",
                method: "GET",
                query: [
                    "bt": screenBt,
                    "bs": screenBs,
                    "bd": screenBd,
                    "rot": "\(screenRot)",
                ]
            )
            updateBanner("屏幕参数已保存", tone: .ok)
            await loadScreen()
        } catch {
            updateBanner(readable(error), tone: .error)
        }
    }

    func clearLogs() async {
        do {
            try await sendRequest(path: "/api/clearlogs", method: "GET")
            updateBanner("日志已清空", tone: .ok)
            await loadLogs()
        } catch {
            updateBanner(readable(error), tone: .error)
        }
    }

    private func loadStatusSilently() async {
        do {
            let payload: StatusPayload = try await request(path: "/api/status")
            metricState = payload.state ?? "--"
            metricWater = payload.water ?? "--"
            metricTds = formatTds(payload.tdsPure ?? payload.tds, enabled: payload.tdsen != false, installed: payload.tdsPureProbe)
            metricRawTds = formatTds(payload.tdsRaw, enabled: payload.tdsen != false, installed: payload.tdsRawProbe)
            metricTemp = formatTemp(payload.tempPure ?? payload.temp, enabled: payload.tempen != false, installed: payload.tempPureProbe)
            metricRawTemp = formatTemp(payload.tempRaw, enabled: payload.tempen != false, installed: payload.tempRawProbe)
            metricNet = payload.net ?? "--"
            metricAccess = ServiceEndpoint.accessMode
            metricTime = payload.time ?? "--:--"
            metricRemain = formatDuration(payload.rem)
            metricQuality = formatQuality(payload)
            metricRssi = payload.rssi.map { "\($0) dBm" } ?? "-- dBm"

            heroState = payload.state ?? "在线"
            overviewTime = payload.time ?? "--:--"
            overviewAccess = ServiceEndpoint.accessMode
            overviewQuality = formatQuality(payload)
            overviewSignal = payload.rssi.map { "\($0) dBm" } ?? "-- dBm"
        } catch {
            updateBanner("设备离线", tone: .error)
        }
    }

    private func loadParams() async {
        do {
            let payload: ParamsPayload = try await request(path: "/api/getparams")
            mk = "\(payload.mk ?? 60)"
            dly = "\(payload.dly ?? 30)"
            wsh = "\(payload.wsh ?? 60)"
            slp = "\(payload.slp ?? 0)"
            vol = "\(payload.vol ?? 25)"
            tdth = "\(payload.tdth ?? 100)"
            voc = payload.voc ?? true
            buz = payload.buz ?? true
            tdsen = payload.tdsen ?? true
        } catch {}
    }

    private func loadFilters() async {
        do {
            let raw: [RemoteFilterPayload] = try await request(path: "/api/filters")
            var mapped: [FilterItem] = raw.enumerated().map { index, item in
                FilterItem(
                    id: index,
                    name: item.name?.isEmpty == false ? item.name! : filterNames[index],
                    date: String((item.date ?? "2026-01-01").prefix(10)),
                    life: item.life ?? 6
                )
            }
            while mapped.count < filterNames.count {
                mapped.append(FilterItem(id: mapped.count, name: filterNames[mapped.count], date: "2026-01-01", life: 6))
            }
            filters = mapped
            selectFilter(activeFilterIndex)
        } catch {}
    }

    private func loadWifi() async {
        do {
            let payload: WifiPayload = try await request(path: "/api/wifi")
            wifiSsid = payload.ssid ?? ""
            wifiPass = ""
            savedWifiSsid = payload.ssid ?? ""
            wifiHasSavedPassword = payload.hasPass ?? false
            wifiStatus = "WiFi 已读取"
        } catch {
            wifiStatus = "读取失败"
        }
    }

    private func loadTime() async {
        do {
            let payload: TimePayload = try await request(path: "/api/time")
            timeStatus = payload.valid == true ? "\(payload.date ?? "--") \(payload.time ?? "--")" : "--"
            if let datetime = payload.datetime {
                manualTime = datetime
            }
        } catch {
            timeStatus = "读取失败"
        }
    }

    private func loadTts() async {
        do {
            let payload: TtsPayload = try await request(path: "/api/tts")
            ttsAppid = payload.appid ?? ""
            ttsToken = ""
            ttsVoice = payload.voice ?? "zh_female_wanwanxiaohe_moon_bigtts"
            let cache = payload.cache ?? 0
            let total = payload.total ?? 0
            voiceCacheRatio = "\(cache) / \(total)"
            voiceReadyState = payload.ready == false ? "待配置" : (total > 0 && cache >= total ? "已完成" : "未完成")
            if payload.flashReady == true {
                voiceFlashState = "已挂载"
            } else if payload.flashTaskRunning == true {
                voiceFlashState = "挂载中"
            } else if payload.flashQueued == true {
                voiceFlashState = "排队中"
            } else if payload.flashResultKnown == true {
                voiceFlashState = "失败"
            } else {
                voiceFlashState = "未检测"
            }
            voiceEnabledState = payload.en == false ? "关闭" : "启用"
            voiceStatus = "语音已读取"
        } catch {
            voiceStatus = "读取失败"
        }
    }

    private func loadScreen() async {
        do {
            let payload: ScreenPayload = try await request(path: "/api/getscreen")
            screenLtx = "\(payload.ltx ?? 0)"
            screenLty = "\(payload.lty ?? 0)"
            screenRtx = "\(payload.rtx ?? 0)"
            screenRty = "\(payload.rty ?? 0)"
            screenMx = "\(payload.mx ?? 0)"
            screenMy = "\(payload.my ?? 0)"
            screenLbx = "\(payload.lbx ?? 0)"
            screenLby = "\(payload.lby ?? 0)"
            screenRbx = "\(payload.rbx ?? 0)"
            screenRby = "\(payload.rby ?? 0)"
            screenCbx = "\(payload.cbx ?? 0)"
            screenCby = "\(payload.cby ?? 0)"
            screenBt = payload.bt ?? ""
            screenBs = payload.bs ?? ""
            screenBd = "\(payload.bd ?? 2)"
            screenRot = payload.rot ?? 0
        } catch {}
    }

    private func loadLogs() async {
        do {
            let payload: LogsPayload = try await request(path: "/api/logs")
            let heap = payload.freeHeap.map { " · \($0 / 1024)KB" } ?? ""
            logMeta = "日志 \(payload.count ?? 0)\(heap)"
            logs = payload.items?.joined(separator: "\n") ?? "暂无日志。"
        } catch {
            logs = "读取失败"
        }
    }

    private func request<T: Decodable>(
        path: String,
        method: String = "GET",
        query: [String: String] = [:],
        form: [String: String] = [:]
    ) async throws -> T {
        let data = try await loadData(path: path, method: method, query: query, form: form)
        return try JSONDecoder().decode(T.self, from: data)
    }

    private func requestText(
        path: String,
        method: String = "GET",
        query: [String: String] = [:]
    ) async throws -> String {
        let data = try await loadData(path: path, method: method, query: query)
        return String(data: data, encoding: .utf8) ?? ""
    }

    private func sendRequest(
        path: String,
        method: String,
        query: [String: String] = [:],
        form: [String: String] = [:]
    ) async throws {
        struct Empty: Decodable {}
        let _: Empty = try await request(path: path, method: method, query: query, form: form)
    }

    private func loadData(
        path: String,
        method: String,
        query: [String: String] = [:],
        form: [String: String] = [:]
    ) async throws -> Data {
        var lastError: Error = URLError(.badURL)

        for baseURL in ServiceEndpoint.candidates {
            do {
                let request = try buildRequest(baseURL: baseURL, path: path, method: method, query: query, form: form)
                let (data, response) = try await URLSession.shared.data(for: request)
                guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
                    throw URLError(.badServerResponse)
                }
                return data
            } catch {
                lastError = error
            }
        }

        throw lastError
    }

    private func buildRequest(
        baseURL: URL,
        path: String,
        method: String,
        query: [String: String],
        form: [String: String]
    ) throws -> URLRequest {
        var components = URLComponents(
            url: baseURL.appendingPathComponent(path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))),
            resolvingAgainstBaseURL: false
        )!
        if !query.isEmpty {
            components.queryItems = query.map { URLQueryItem(name: $0.key, value: $0.value) }
        }
        guard let url = components.url else { throw URLError(.badURL) }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.timeoutInterval = 12
        if !form.isEmpty {
            request.setValue("application/x-www-form-urlencoded;charset=UTF-8", forHTTPHeaderField: "Content-Type")
            request.httpBody = form.map { key, value in
                "\(key)=\((value as NSString).addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? value)"
            }
            .joined(separator: "&")
            .data(using: .utf8)
        }
        return request
    }

    private func updateBanner(_ text: String, tone: BannerTone) {
        bannerText = text
        bannerTone = tone
    }

    private func formatDuration(_ value: Int?) -> String {
        guard let value, value > 0 else { return "--:--" }
        let hours = value / 3600
        let minutes = (value % 3600) / 60
        let seconds = value % 60
        if hours > 0 {
            return "\(hours):" + String(format: "%02d:%02d", minutes, seconds)
        }
        return String(format: "%02d:%02d", minutes, seconds)
    }

    private func formatTds(_ value: Int?, enabled: Bool, installed: Bool?) -> String {
        guard enabled else { return "模块关闭" }
        guard installed == true else { return "未安装" }
        guard let value else { return "-- ppm" }
        return "\(value) ppm"
    }

    private func formatTemp(_ value: Double?, enabled: Bool, installed: Bool?) -> String {
        guard enabled else { return "模块关闭" }
        guard installed == true else { return "未安装" }
        guard let value else { return "-- °C" }
        return String(format: "%.1f °C", value)
    }

    private func formatQuality(_ payload: StatusPayload) -> String {
        if payload.tdsen == false { return "已关闭" }
        if payload.tdsPureProbe != true && payload.tdsRawProbe != true { return "未安装" }
        return payload.tdsq ?? "--"
    }

    private func readable(_ error: Error) -> String {
        if let urlError = error as? URLError {
            switch urlError.code {
            case .notConnectedToInternet, .timedOut, .cannotConnectToHost, .networkConnectionLost:
                return "设备离线"
            default:
                return "请求失败"
            }
        }
        return "请求失败"
    }

    private func isoDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: date)
    }
}

private struct RootView: View {
    @ObservedObject var store: DeviceStore

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color(red: 0.93, green: 0.96, blue: 1.0),
                    Color(red: 0.87, green: 0.92, blue: 0.97),
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            Circle()
                .fill(Color.cyan.opacity(0.18))
                .frame(width: 260, height: 260)
                .blur(radius: 30)
                .offset(x: -120, y: -220)

            Circle()
                .fill(Color.blue.opacity(0.14))
                .frame(width: 220, height: 220)
                .blur(radius: 30)
                .offset(x: 140, y: -160)

            VStack(spacing: 14) {
                header
                banner

                TabView(selection: $store.selectedTab) {
                    OverviewView(store: store)
                        .tag(RootTab.overview)
                        .tabItem { Label("首页", systemImage: "house.fill") }

                    FilterView(store: store)
                        .tag(RootTab.filters)
                        .tabItem { Label("滤芯", systemImage: "drop.circle.fill") }

                    SettingsView(store: store)
                        .tag(RootTab.settings)
                        .tabItem { Label("设置", systemImage: "slider.horizontal.3") }

                    LogsView(store: store)
                        .tag(RootTab.logs)
                        .tabItem { Label("日志", systemImage: "text.alignleft") }
                }
                .tint(Color(red: 0.08, green: 0.42, blue: 0.95))
            }
            .padding(.horizontal, 14)
            .padding(.top, 10)
        }
    }

    private var header: some View {
        HStack(alignment: .center, spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text("净水智控")
                    .font(.caption)
                    .foregroundStyle(Color(red: 0.21, green: 0.42, blue: 0.68))
                Text(store.heroState)
                    .font(.system(size: 28, weight: .bold, design: .rounded))
                    .foregroundStyle(Color(red: 0.08, green: 0.13, blue: 0.22))
                    .lineLimit(1)
            }

            Spacer()

            Button {
                Task { await store.syncAll() }
            } label: {
                Image(systemName: "arrow.clockwise")
                    .font(.system(size: 16, weight: .bold))
                    .frame(width: 42, height: 42)
                    .background(.ultraThinMaterial, in: Circle())
            }
            .buttonStyle(.plain)
            .foregroundStyle(Color(red: 0.08, green: 0.13, blue: 0.22))
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 16)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 28, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 28, style: .continuous)
                .stroke(Color.white.opacity(0.35), lineWidth: 1)
        )
    }

    private var banner: some View {
        Text(store.bannerText)
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(store.bannerTone.tint)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(store.bannerTone.tint.opacity(0.09), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .stroke(Color.white.opacity(0.3), lineWidth: 1)
            )
    }
}

private struct OverviewView: View {
    @ObservedObject var store: DeviceStore
    private let columns = [GridItem(.flexible()), GridItem(.flexible())]

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 16) {
                GlassSection {
                    VStack(spacing: 16) {
                        HStack {
                            VStack(alignment: .leading, spacing: 8) {
                                Text(store.metricTds)
                                    .font(.system(size: 34, weight: .bold, design: .rounded))
                                    .foregroundStyle(Color(red: 0.05, green: 0.34, blue: 0.92))
                                Text("纯水 TDS")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                            VStack(alignment: .trailing, spacing: 8) {
                                Text(store.metricWater)
                                    .font(.system(size: 26, weight: .bold, design: .rounded))
                                    .foregroundStyle(Color(red: 0.09, green: 0.62, blue: 0.48))
                                Text("水位状态")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            }
                        }

                        LazyVGrid(columns: columns, spacing: 14) {
                            HeroStat(title: "当前时间", value: store.overviewTime)
                            HeroStat(title: "接入方式", value: store.overviewAccess)
                            HeroStat(title: "纯水判定", value: store.overviewQuality)
                            HeroStat(title: "信号强度", value: store.overviewSignal)
                        }
                    }
                }

                GlassSection(header: "快捷控制") {
                    LazyVGrid(columns: columns, spacing: 14) {
                        CommandButton(title: "手动制水", subtitle: "开始", colors: [.blue, .cyan]) {
                            Task { await store.sendCommand("make") }
                        }
                        CommandButton(title: "手动洗膜", subtitle: "冲洗", colors: [.mint, .teal]) {
                            Task { await store.sendCommand("wash") }
                        }
                        CommandButton(title: "停止", subtitle: "结束", colors: [.pink, .red]) {
                            Task { await store.sendCommand("stop") }
                        }
                        CommandButton(title: "复位", subtitle: "重置", colors: [.orange, .yellow]) {
                            Task { await store.sendCommand("reset") }
                        }
                    }
                }

                GlassSection(header: "实时指标") {
                    LazyVGrid(columns: columns, spacing: 14) {
                        MetricCard(title: "运行状态", value: store.metricState, featured: true)
                        MetricCard(title: "纯水 TDS", value: store.metricTds, featured: true)
                        MetricCard(title: "原水 TDS", value: store.metricRawTds)
                        MetricCard(title: "纯水温度", value: store.metricTemp)
                        MetricCard(title: "原水温度", value: store.metricRawTemp)
                        MetricCard(title: "网络", value: store.metricNet)
                        MetricCard(title: "当前时间", value: store.metricTime)
                        MetricCard(title: "剩余时间", value: store.metricRemain)
                        MetricCard(title: "纯水判定", value: store.metricQuality)
                        MetricCard(title: "信号强度", value: store.metricRssi)
                        MetricCard(title: "接入方式", value: store.metricAccess)
                        MetricCard(title: "水位状态", value: store.metricWater)
                    }
                }
            }
            .padding(.bottom, 28)
        }
    }
}

private struct FilterView: View {
    @ObservedObject var store: DeviceStore
    private let columns = [GridItem(.flexible()), GridItem(.flexible())]

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 16) {
                GlassSection {
                    LazyVGrid(columns: columns, spacing: 14) {
                        ForEach(store.filters) { item in
                            Button {
                                store.selectFilter(item.id)
                            } label: {
                                VStack(alignment: .leading, spacing: 8) {
                                    Text(item.name)
                                        .font(.headline)
                                    Text(item.date)
                                        .font(.subheadline)
                                        .foregroundStyle(.secondary)
                                    Text("\(item.life) 个月")
                                        .font(.caption.weight(.semibold))
                                        .foregroundStyle(Color.blue)
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding(16)
                                .background(
                                    RoundedRectangle(cornerRadius: 22, style: .continuous)
                                        .fill(store.activeFilterIndex == item.id ? Color.blue.opacity(0.14) : Color.white.opacity(0.22))
                                )
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }

                GlassSection {
                    VStack(spacing: 12) {
                        GlassField(title: "滤芯名称", text: $store.filterName)
                        GlassField(title: "安装日期", text: $store.filterDate)
                        GlassField(title: "寿命（月）", text: $store.filterLife, keyboard: .numberPad)
                    }
                }

                GlassSection {
                    VStack(spacing: 12) {
                        ActionRowButton(title: "今天", style: .ghost) { store.setFilterToday() }
                        ActionRowButton(title: "保存", style: .primary) { Task { await store.saveFilter() } }
                        ActionRowButton(title: "重置当前", style: .secondary) { Task { await store.resetCurrentFilter() } }
                        ActionRowButton(title: "全部重置", style: .danger) { Task { await store.resetAllFilters() } }
                    }
                }
            }
            .padding(.bottom, 28)
        }
    }
}

private struct SettingsView: View {
    @ObservedObject var store: DeviceStore
    private let columns = [GridItem(.flexible()), GridItem(.flexible())]

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 16) {
                GlassSection(header: "运行参数") {
                    VStack(spacing: 12) {
                        LazyVGrid(columns: columns, spacing: 12) {
                            GlassField(title: "制水超时", text: $store.mk, keyboard: .numberPad)
                            GlassField(title: "停止延时", text: $store.dly, keyboard: .numberPad)
                            GlassField(title: "洗膜时长", text: $store.wsh, keyboard: .numberPad)
                            GlassField(title: "屏幕休眠", text: $store.slp, keyboard: .numberPad)
                            GlassField(title: "语音音量", text: $store.vol, keyboard: .numberPad)
                            GlassField(title: "TDS 阈值", text: $store.tdth, keyboard: .numberPad)
                        }
                        ToggleRow(title: "语音播报", isOn: $store.voc)
                        ToggleRow(title: "蜂鸣器", isOn: $store.buz)
                        ToggleRow(title: "TDS 模块", isOn: $store.tdsen)
                        ActionRowButton(title: "读取", style: .ghost) { Task { await store.syncAll() } }
                        ActionRowButton(title: "保存", style: .primary) { Task { await store.saveParams() } }
                    }
                }

                GlassSection(header: "WiFi") {
                    VStack(spacing: 12) {
                        GlassField(title: "WiFi 名称", text: $store.wifiSsid)
                        GlassSecureField(title: "WiFi 密码", text: $store.wifiPass)
                        StatusChip(text: store.wifiStatus)
                        if !store.wifiNetworks.isEmpty {
                            LazyVGrid(columns: columns, spacing: 12) {
                                ForEach(store.wifiNetworks) { network in
                                    Button {
                                        store.chooseWifi(network)
                                    } label: {
                                        VStack(alignment: .leading, spacing: 8) {
                                            Text(network.ssid)
                                                .font(.headline)
                                            Text("\(network.rssi) dBm · \(network.secure)")
                                                .font(.caption)
                                                .foregroundStyle(.secondary)
                                        }
                                        .frame(maxWidth: .infinity, alignment: .leading)
                                        .padding(14)
                                        .background(Color.white.opacity(0.22), in: RoundedRectangle(cornerRadius: 20, style: .continuous))
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }
                        ActionRowButton(title: "扫描", style: .ghost) { Task { await store.scanWifi() } }
                        ActionRowButton(title: "保存", style: .primary) { Task { await store.saveWifi() } }
                    }
                }

                GlassSection(header: "时间") {
                    VStack(spacing: 12) {
                        StatusChip(text: store.timeStatus)
                        GlassField(title: "手动时间", text: $store.manualTime)
                        ActionRowButton(title: "校时", style: .ghost) { Task { await store.syncTime() } }
                        ActionRowButton(title: "保存", style: .primary) { Task { await store.saveTime() } }
                    }
                }

                GlassSection(header: "语音") {
                    VStack(spacing: 12) {
                        GlassField(title: "App ID", text: $store.ttsAppid)
                        GlassSecureField(title: "Access Token", text: $store.ttsToken)
                        GlassField(title: "Voice", text: $store.ttsVoice)
                        LazyVGrid(columns: columns, spacing: 12) {
                            MetricCard(title: "缓存进度", value: store.voiceCacheRatio)
                            MetricCard(title: "语音状态", value: store.voiceReadyState)
                            MetricCard(title: "TF 卡状态", value: store.voiceFlashState)
                            MetricCard(title: "缓存启用", value: store.voiceEnabledState)
                        }
                        StatusChip(text: store.voiceStatus)
                        ActionRowButton(title: "保存", style: .primary) { Task { await store.saveTts() } }
                        ActionRowButton(title: "预缓存", style: .secondary) { Task { await store.primeVoiceCache() } }
                        ActionRowButton(title: "清空", style: .danger) { Task { await store.clearVoiceCache() } }
                        ActionRowButton(title: "探测 TF", style: .ghost) { Task { await store.probeVoiceFlash() } }
                    }
                }

                GlassSection(header: "屏幕") {
                    VStack(spacing: 12) {
                        LazyVGrid(columns: columns, spacing: 12) {
                            GlassField(title: "左上 X", text: $store.screenLtx, keyboard: .numberPad)
                            GlassField(title: "左上 Y", text: $store.screenLty, keyboard: .numberPad)
                            GlassField(title: "右上 X", text: $store.screenRtx, keyboard: .numberPad)
                            GlassField(title: "右上 Y", text: $store.screenRty, keyboard: .numberPad)
                            GlassField(title: "主区 X", text: $store.screenMx, keyboard: .numberPad)
                            GlassField(title: "主区 Y", text: $store.screenMy, keyboard: .numberPad)
                            GlassField(title: "左下 X", text: $store.screenLbx, keyboard: .numberPad)
                            GlassField(title: "左下 Y", text: $store.screenLby, keyboard: .numberPad)
                            GlassField(title: "右下 X", text: $store.screenRbx, keyboard: .numberPad)
                            GlassField(title: "右下 Y", text: $store.screenRby, keyboard: .numberPad)
                            GlassField(title: "底中 X", text: $store.screenCbx, keyboard: .numberPad)
                            GlassField(title: "底中 Y", text: $store.screenCby, keyboard: .numberPad)
                        }
                        GlassField(title: "启动标题", text: $store.screenBt)
                        GlassField(title: "启动副标题", text: $store.screenBs)
                        GlassField(title: "启动时长", text: $store.screenBd, keyboard: .numberPad)
                        Picker("旋转方向", selection: $store.screenRot) {
                            Text("0 度").tag(0)
                            Text("90 度").tag(1)
                            Text("180 度").tag(2)
                            Text("270 度").tag(3)
                        }
                        .pickerStyle(.segmented)
                        ActionRowButton(title: "读取", style: .ghost) { Task { await store.syncAll() } }
                        ActionRowButton(title: "保存", style: .primary) { Task { await store.saveScreen() } }
                    }
                }
            }
            .padding(.bottom, 28)
        }
    }
}

private struct LogsView: View {
    @ObservedObject var store: DeviceStore

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 16) {
                GlassSection {
                    HStack {
                        Text(store.logMeta)
                            .font(.subheadline.weight(.semibold))
                        Spacer()
                    }
                    .padding(.bottom, 8)

                    VStack(spacing: 12) {
                        ActionRowButton(title: "刷新", style: .ghost) { Task { await store.syncAll() } }
                        ActionRowButton(title: "清空", style: .danger) { Task { await store.clearLogs() } }
                    }

                    ScrollView(.horizontal, showsIndicators: false) {
                        Text(store.logs)
                            .font(.system(size: 13, weight: .regular, design: .monospaced))
                            .foregroundStyle(Color.white.opacity(0.92))
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(16)
                            .background(Color.black.opacity(0.78), in: RoundedRectangle(cornerRadius: 24, style: .continuous))
                    }
                    .frame(minHeight: 340)
                }
            }
            .padding(.bottom, 28)
        }
    }
}

private struct GlassSection<Content: View>: View {
    var header: String?
    @ViewBuilder var content: Content

    init(header: String? = nil, @ViewBuilder content: () -> Content) {
        self.header = header
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            if let header {
                Text(header)
                    .font(.headline)
                    .foregroundStyle(Color(red: 0.08, green: 0.13, blue: 0.22))
            }
            content
        }
        .padding(20)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 28, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 28, style: .continuous)
                .stroke(Color.white.opacity(0.34), lineWidth: 1)
        )
    }
}

private struct HeroStat: View {
    let title: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.headline.weight(.bold))
                .foregroundStyle(Color(red: 0.08, green: 0.13, blue: 0.22))
                .minimumScaleFactor(0.8)
                .lineLimit(2)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(18)
        .background(Color.white.opacity(0.24), in: RoundedRectangle(cornerRadius: 24, style: .continuous))
    }
}

private struct MetricCard: View {
    let title: String
    let value: String
    var featured: Bool = false

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title)
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.headline.weight(.bold))
                .foregroundStyle(Color(red: 0.08, green: 0.13, blue: 0.22))
                .minimumScaleFactor(0.8)
                .lineLimit(2)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(18)
        .background(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .fill(featured ? Color.blue.opacity(0.14) : Color.white.opacity(0.22))
        )
    }
}

private struct CommandButton: View {
    let title: String
    let subtitle: String
    let colors: [Color]
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 10) {
                Text(title)
                    .font(.headline.weight(.bold))
                Text(subtitle)
                    .font(.subheadline)
                    .opacity(0.92)
            }
            .foregroundStyle(Color.white)
            .frame(maxWidth: .infinity, minHeight: 116, alignment: .leading)
            .padding(18)
            .background(
                LinearGradient(colors: colors, startPoint: .topLeading, endPoint: .bottomTrailing),
                in: RoundedRectangle(cornerRadius: 26, style: .continuous)
            )
        }
        .buttonStyle(.plain)
    }
}

private struct GlassField: View {
    let title: String
    @Binding var text: String
    var keyboard: UIKeyboardType = .default

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(Color(red: 0.18, green: 0.30, blue: 0.46))
            TextField(title, text: $text)
                .keyboardType(keyboard)
                .textFieldStyle(GlassTextFieldStyle())
        }
    }
}

private struct GlassSecureField: View {
    let title: String
    @Binding var text: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(Color(red: 0.18, green: 0.30, blue: 0.46))
            SecureField(title, text: $text)
                .textFieldStyle(GlassTextFieldStyle())
        }
    }
}

private struct ToggleRow: View {
    let title: String
    @Binding var isOn: Bool

    var body: some View {
        Toggle(isOn: $isOn) {
            Text(title)
                .font(.subheadline.weight(.semibold))
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .background(Color.white.opacity(0.22), in: RoundedRectangle(cornerRadius: 20, style: .continuous))
    }
}

private enum RowButtonStyle {
    case primary
    case secondary
    case ghost
    case danger

    var foreground: Color {
        switch self {
        case .ghost:
            return Color(red: 0.08, green: 0.13, blue: 0.22)
        default:
            return .white
        }
    }

    var background: LinearGradient {
        switch self {
        case .primary:
            return LinearGradient(colors: [Color(red: 0.29, green: 0.66, blue: 1.0), Color(red: 0.05, green: 0.43, blue: 0.99)], startPoint: .topLeading, endPoint: .bottomTrailing)
        case .secondary:
            return LinearGradient(colors: [Color(red: 0.26, green: 0.82, blue: 0.67), Color(red: 0.10, green: 0.63, blue: 0.50)], startPoint: .topLeading, endPoint: .bottomTrailing)
        case .danger:
            return LinearGradient(colors: [Color(red: 1.0, green: 0.56, blue: 0.56), Color(red: 0.91, green: 0.35, blue: 0.35)], startPoint: .topLeading, endPoint: .bottomTrailing)
        case .ghost:
            return LinearGradient(colors: [Color.white.opacity(0.34), Color.white.opacity(0.24)], startPoint: .topLeading, endPoint: .bottomTrailing)
        }
    }
}

private struct ActionRowButton: View {
    let title: String
    let style: RowButtonStyle
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.headline.weight(.semibold))
                .foregroundStyle(style.foreground)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(style.background, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
        }
        .buttonStyle(.plain)
    }
}

private struct StatusChip: View {
    let text: String

    var body: some View {
        Text(text)
            .font(.subheadline.weight(.semibold))
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .background(Color.white.opacity(0.22), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
    }
}

private struct GlassTextFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .padding(.horizontal, 16)
            .padding(.vertical, 15)
            .background(Color.white.opacity(0.26), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .stroke(Color.white.opacity(0.26), lineWidth: 1)
            )
    }
}
