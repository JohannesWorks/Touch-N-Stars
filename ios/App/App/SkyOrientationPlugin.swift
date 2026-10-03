import Capacitor
import CoreMotion
import UIKit

@objc(SkyOrientationPlugin)
public class SkyOrientationPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SkyOrientationPlugin"
    public let jsName = "SkyOrientation"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getAvailability", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise)
    ]
    private let motion = CMMotionManager()
    private var backgroundObserver: NSObjectProtocol?

    @objc func getAvailability(_ call: CAPPluginCall) {
        call.resolve(["available": motion.isDeviceMotionAvailable &&
            CMMotionManager.availableAttitudeReferenceFrames().contains(.xMagneticNorthZVertical)])
    }

    public override func load() {
        backgroundObserver = NotificationCenter.default.addObserver(
            forName: UIApplication.willResignActiveNotification, object: nil, queue: .main
        ) { [weak self] _ in self?.motion.stopDeviceMotionUpdates() }
    }

    @objc func start(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.motion.stopDeviceMotionUpdates()
            guard self.motion.isDeviceMotionAvailable,
                  CMMotionManager.availableAttitudeReferenceFrames().contains(.xMagneticNorthZVertical) else {
                call.reject("A north-referenced motion sensor is unavailable", "UNAVAILABLE")
                return
            }
            let permission = CMMotionActivityManager.authorizationStatus()
            if permission == .denied || permission == .restricted {
                call.reject("Motion permission was denied", "PERMISSION_DENIED")
                return
            }
            // Started only by a compass tap/resume of an already enabled mode.
            self.motion.deviceMotionUpdateInterval = 1.0 / 50.0
            self.motion.startDeviceMotionUpdates(using: .xMagneticNorthZVertical, to: .main) { [weak self] data, error in
                guard let self = self else { return }
                if let error = error {
                    self.motion.stopDeviceMotionUpdates()
                    self.notifyListeners("sensorError", data: ["message": error.localizedDescription,
                        "code": CMMotionActivityManager.authorizationStatus() == .denied ? "PERMISSION_DENIED" : "SENSOR_ERROR"])
                    return
                }
                guard let data = data else { return }
                let r = data.attitude.rotationMatrix
                // Pass the reference->device DCM verbatim. The tested bridge
                // adapter transposes north/west/up into device->world ENU.
                let matrix = [r.m11, r.m12, r.m13, r.m21, r.m22, r.m23, r.m31, r.m32, r.m33]
                let orientation = self.bridge?.viewController?.view.window?.windowScene?.interfaceOrientation
                let angle: Int
                switch orientation {
                case .landscapeLeft: angle = 90
                case .landscapeRight: angle = 270
                case .portraitUpsideDown: angle = 180
                default: angle = 0
                }
                self.notifyListeners("orientation", data: ["matrix": matrix, "coordinateSystem": "core-motion", "reference": "magnetic",
                    "screenAngleDeg": angle,
                    "lowAccuracy": data.magneticField.accuracy == .uncalibrated || data.magneticField.accuracy == .low])
            }
            call.resolve()
        }
    }

    @objc func stop(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            self?.motion.stopDeviceMotionUpdates()
            call.resolve()
        }
    }

    deinit {
        motion.stopDeviceMotionUpdates()
        if let observer = backgroundObserver { NotificationCenter.default.removeObserver(observer) }
    }
}
