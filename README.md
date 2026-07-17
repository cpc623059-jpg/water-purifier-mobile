# 净水器手机控制台

这个目录是根据当前 `ESP32/Arduino` 固件接口重新整理出来的手机端项目源码，不是直接把设备网页原样打包。它通过设备已有的 `/api/*` 接口完成控制和配置，适合后续转成 iOS App，再由你用自己的自签方式安装。

你的使用方式也适合这套结构：手机通过 OpenVPN 打通家庭局域网后，App 直接访问“家里净水器的内网 IP”即可，不需要上云。

## 已覆盖的固件能力

- 状态看板：`/api/status`
- 手动控制：`/api/cmd`
- 参数设置：`/api/getparams`、`/api/save`
- 滤芯管理：`/api/filters`、`/api/savefilter`、`/api/resetfilter`、`/api/resetallfilters`
- WiFi 配置：`/api/wifi`、`/api/wifiscan`、`/api/savewifi`
- 时间设置：`/api/time`、`/api/settime`、`/api/synctime`
- 云语音与缓存：`/api/tts`、`/api/voicecache`、`/api/voiceflash`
- 屏幕参数：`/api/getscreen`、`/api/savescreen`
- 日志：`/api/logs`、`/api/clearlogs`

## 本地开发

```bash
npm install
npm run dev
```

浏览器模式下，如果固件接口没有设置 CORS，跨域调用可能失败。这不影响后续打成 iOS App，因为项目已经优先接入了 Capacitor 的原生 HTTP。

## 生成 iOS 工程

```bash
npm install
npm run build
npm run cap:add:ios
npm run cap:sync
npm run cap:open:ios
```

然后在 macOS 的 Xcode 里继续处理签名、归档和导出。

当前仓库已经生成好 iOS 工程，路径是：

- [ios/App/App.xcworkspace](C:/Users/94564/Desktop/净水器ipa/water-purifier-mobile/ios/App/App.xcworkspace)
- [ios/App/App.xcodeproj](C:/Users/94564/Desktop/净水器ipa/water-purifier-mobile/ios/App/App.xcodeproj)

优先打开 `App.xcworkspace`。

## iOS 侧建议补充

由于设备通常是 `http://192.168.x.x` 或 `http://192.168.4.1`，在 Xcode 中建议补上以下能力，避免局域网访问被系统拦住：

1. 在 `Info.plist` 中添加 `NSLocalNetworkUsageDescription`。
2. 在 `Info.plist` 中添加 `NSAppTransportSecurity -> NSAllowsLocalNetworking = YES`。
3. 如果你的目标机型仍然拦截明文 HTTP，再按需要补充 ATS 例外。

上面这两项我已经预先写进当前工程的 [ios/App/App/Info.plist](C:/Users/94564/Desktop/净水器ipa/water-purifier-mobile/ios/App/App/Info.plist) 了。

## 目录说明

- `src/main.ts`：页面逻辑、设备接口请求、状态渲染
- `src/styles.css`：手机端界面样式
- `capacitor.config.ts`：Capacitor 配置

## 关于 OpenVPN 直接内嵌

可以做，但不是这套前端壳项目直接顺手加一下就能完成的事情。真正“App 内自己拨 OpenVPN”在 iOS 上通常要走 `NetworkExtension` 的 `Packet Tunnel Provider`，同时还要给主 App 和隧道扩展都配置对应 capability / provisioning profile。Apple 的 `NEPacketTunnelProvider` 文档明确要求网络扩展 entitlement，OpenVPNAdapter 的说明也要求单独的 Packet Tunnel Provider 扩展和双 target 的签名配置。

参考：

- [Apple: NEPacketTunnelProvider](https://developer.apple.com/documentation/networkextension/nepackettunnelprovider)
- [Apple: Network Extensions Entitlement](https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.networking.networkextension)
- [OpenVPNAdapter README](https://github.com/ss-abramchuk/openvpnadapter)

另外，你这份 `OpenVPN-Client.OVPN` 里还包含这些特征：

- 连接方式：`udp6`
- 服务端：`ovpn.cccpc.cc:1194`
- 鉴权：`auth-user-pass`
- 加密：`BF-CBC`
- 压缩：`comp-lzo`
- 证书：内嵌 `CA`

也就是说，就算后面我给你做原生 VPN 版，仍然还需要额外处理：

1. 用户名/密码存储与输入。
2. Packet Tunnel 扩展。
3. iOS NetworkExtension entitlement。
4. 兼容 `BF-CBC` / `comp-lzo` 的 OpenVPN 引擎测试。

## 说明

这份源码当前重点是“按固件逻辑把手机端独立写出来”。如果你后面要我继续往前推进，我可以下一步直接帮你补：

1. iOS 原生壳工程。
2. 屏幕参数可视化预览。
3. 更像正式上架 App 的导航和图标资源。

## 为什么现在还没直接交付 ipa

我已经在这台 Windows 机器上完成了：

1. 手机端源码编写。
2. Web 构建验证。
3. Capacitor iOS 工程生成。
4. iOS 局域网访问权限预配置。

但这台机器没有 Apple 的 iOS 编译工具链，实际检查结果是：

- 没有 `xcodebuild`
- 没有 CocoaPods

所以当前环境下我无法在本机直接产出可安装的 `.ipa`。要生成 `.ipa`，还需要在 macOS 上用 Xcode 打开工程并完成编译/签名/导出。

## 没有 Mac 时的可行方案

如果你没有 Mac，但手机上有自签工具，那么最实用的办法是：

1. 把这个项目上传到 GitHub。
2. 使用仓库自带的 GitHub Actions 工作流在 GitHub 的 macOS 机器上构建。
3. 下载产出的 `PureWater-Mobile-unsigned.ipa`。
4. 用手机上的自签工具重新签名并安装。

我已经把工作流写好了：

- [.github/workflows/build-ios-unsigned-ipa.yml](C:/Users/94564/Desktop/净水器ipa/water-purifier-mobile/.github/workflows/build-ios-unsigned-ipa.yml)

这个工作流会：

1. 安装 Node 依赖。
2. 构建前端资源。
3. 同步 Capacitor iOS 工程。
4. 在 GitHub 的 macOS Runner 上执行 `xcodebuild`。
5. 打包出一个未签名 `ipa` 作为 artifact 供你下载。

如果你要走这条路，最短操作就是：

```bash
git init
git add .
git commit -m "build ios ipa"
```

然后把 [water-purifier-mobile](C:/Users/94564/Desktop/净水器ipa/water-purifier-mobile) 整个目录推到 GitHub，新建仓库后在 `Actions` 里运行 `Build iOS Unsigned IPA`。

工作流完成后，你会在 GitHub Actions 的 artifact 里拿到：

- `PureWater-Mobile-unsigned.ipa`
- `PureWater-Mobile-xcarchive`
