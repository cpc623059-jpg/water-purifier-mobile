import Foundation
import NetworkExtension
import OpenVPNAdapter

final class PacketTunnelProvider: NEPacketTunnelProvider {
    private lazy var vpnAdapter: OpenVPNAdapter = {
        let adapter = OpenVPNAdapter()
        adapter.delegate = self
        return adapter
    }()

    private let reachability = OpenVPNReachability()
    private var startHandler: ((Error?) -> Void)?
    private var stopHandler: (() -> Void)?

    override func startTunnel(options: [String: NSObject]?, completionHandler: @escaping (Error?) -> Void) {
        guard
            let tunnelProtocol = protocolConfiguration as? NETunnelProviderProtocol,
            let providerConfiguration = tunnelProtocol.providerConfiguration,
            let fileContent = providerConfiguration["ovpn"] as? Data
        else {
            completionHandler(NSError(domain: "VPNExtension", code: 1, userInfo: [NSLocalizedDescriptionKey: "VPN 配置缺失"]))
            return
        }

        startHandler = completionHandler

        let configuration = OpenVPNConfiguration()
        configuration.fileContent = fileContent
        configuration.tunPersist = true

        do {
            _ = try vpnAdapter.apply(configuration: configuration)
            let credentials = OpenVPNCredentials()
            credentials.username = providerConfiguration["username"] as? String
            credentials.password = providerConfiguration["password"] as? String
            try vpnAdapter.provide(credentials: credentials)

            reachability.startTracking { [weak self] status in
                guard let self else { return }
                if status != .notReachable, self.reasserting {
                    self.vpnAdapter.reconnect(afterTimeInterval: 0)
                }
            }

            vpnAdapter.connect(using: packetFlow)
        } catch {
            if reachability.isTracking {
                reachability.stopTracking()
            }
            startHandler = nil
            completionHandler(error)
        }
    }

    override func stopTunnel(with reason: NEProviderStopReason, completionHandler: @escaping () -> Void) {
        stopHandler = completionHandler
        if reachability.isTracking {
            reachability.stopTracking()
        }
        vpnAdapter.disconnect()
    }
}

extension PacketTunnelProvider: OpenVPNAdapterDelegate {
    func openVPNAdapter(
        _ openVPNAdapter: OpenVPNAdapter,
        configureTunnelWithNetworkSettings networkSettings: NEPacketTunnelNetworkSettings?,
        completionHandler: @escaping (Error?) -> Void
    ) {
        networkSettings?.dnsSettings?.matchDomains = [""]
        setTunnelNetworkSettings(networkSettings, completionHandler: completionHandler)
    }

    func openVPNAdapter(_ openVPNAdapter: OpenVPNAdapter, handleEvent event: OpenVPNAdapterEvent, message: String?) {
        switch event {
        case .connected:
            if reasserting {
                reasserting = false
            }
            startHandler?(nil)
            startHandler = nil

        case .disconnected:
            if reachability.isTracking {
                reachability.stopTracking()
            }

            if let startHandler {
                startHandler(NSError(domain: "VPNExtension", code: 2, userInfo: [NSLocalizedDescriptionKey: "VPN 连接中断"]))
                self.startHandler = nil
            } else {
                stopHandler?()
                stopHandler = nil
            }

        case .reconnecting:
            reasserting = true

        default:
            break
        }
    }

    func openVPNAdapter(_ openVPNAdapter: OpenVPNAdapter, handleError error: Error) {
        let isFatal = (error as NSError).userInfo[OpenVPNAdapterErrorFatalKey] as? Bool ?? true
        guard isFatal else { return }

        if reachability.isTracking {
            reachability.stopTracking()
        }

        if let startHandler {
            startHandler(error)
            self.startHandler = nil
        } else {
            cancelTunnelWithError(error)
        }
    }

    func openVPNAdapter(_ openVPNAdapter: OpenVPNAdapter, handleLogMessage logMessage: String) {
        NSLog("OpenVPN: %@", logMessage)
    }
}
