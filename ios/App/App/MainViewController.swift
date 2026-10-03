import Capacitor

@objc(MainViewController)
class MainViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginInstance(WifiSignalPlugin())
        bridge?.registerPluginInstance(SkyOrientationPlugin())
    }
}
