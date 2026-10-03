# Celestia Atlas sky pointing

## Use

Open Celestia Atlas in the native Android or iOS app and tap the existing compass.
Aim through the **back of the screen**, as if looking through a window. The compass
highlights when sensor readings arrive. Tap again or deliberately drag the map
to stop. Pinch zoom remains available and keeps the selected field of view.
The map keeps its horizon upright; it does not roll with the phone.

If hidden, enable **Show compass** in Atlas display settings. Hiding the compass
also stops tracking. Choosing a target, mount follow, or a simulated clock stops
tracking. Enabling it restores live UTC. Closing Atlas, locking the screen, or
backgrounding the app suspends sensors; returning resumes an enabled mode.
The mode starts disabled for each new view lifetime.

## Permissions and location

The configured N.I.N.A. observing site takes priority, including valid coordinates
at zero latitude or longitude. If absent/invalid, the existing mobile location
service requests a single foreground fix. A fallback fix is cached for the view
lifetime and does not overwrite the configured site. No background location is
requested. Site changes stop tracking so the next activation uses the new site.
Manual browsing is available while a profile loads, with a neutral 0°/0° observer;
this placeholder is never used as the fallback location for sky pointing.

Android rotation sensors need no runtime permission at the requested rate.
Hardware availability is checked before a fallback location request. When sensors
are missing, the compass reports **Sky pointing sensors are not available**.
iOS uses Core Motion with `NSMotionUsageDescription`; the OS handles any required
motion prompt after activation from the compass. A denial, unavailable hardware,
location failure, or missing readings shows a nonblocking message and leaves
manual navigation available. Browser sensor events are not used in this release.

## Accuracy and calibration

The compass bearing and pointing direction use geographic north. Native magnetic
north is corrected locally using the observing location, elevation, UTC date,
and the World Magnetic Model supplied by `geomagnetism` (Apache-2.0). The included
WMM2025 model expires in late 2029; an unsupported date fails instead of
extrapolating silently. Headings near magnetic poles are unavailable.

Magnetic cases, steel mounts, vehicles, speakers, power equipment, and nearby
magnets can cause several degrees of error. Move away and make a figure-eight
motion to calibrate the compass. Low native accuracy triggers a calibration hint.
The model cannot correct local magnetic interference. A remote observatory site
can also differ from the phone's actual location: configure the intended site.
This is a sky identification aid, not a substitute for plate solving or telescope
alignment. Horizon altitudes are geometric; atmospheric refraction is not applied.
Azimuth is undefined at the exact zenith/nadir, though the displayed sky direction
remains valid. No sensor/location history is saved or sent for this feature.

## Architecture and conventions

Touch-N-Stars remains a Vue 3 / Capacitor 8 host using the existing Atlas viewer.
`orientationSensorService.js` wraps the local `SkyOrientation` native plugin.
`skyOrientationController.js` owns start/stop, visibility, errors, smoothing, and
viewport updates. `skyOrientationLocation.js` reuses existing location handling.
`skyOrientationMath.js` is independent of Vue and the renderer.

| Boundary      | Convention                                                                                                            |
| ------------- | --------------------------------------------------------------------------------------------------------------------- |
| Android       | `TYPE_ROTATION_VECTOR`, fallback `TYPE_GEOMAGNETIC_ROTATION_VECTOR`; device-to-world matrix from `SensorManager`      |
| iOS           | `CMMotionManager`, `.xMagneticNorthZVertical`; reference-to-device matrix transposed and converted from north/west/up |
| Native bridge | Row-major device-to-world matrix; world east/north/up, device right/top/display-out                                   |
| Pointing      | Rearward screen normal, device −Z; screen rotation adjusts screen-up without changing the ray                         |
| Heading       | Azimuth north=0°, east=90°; altitude horizon=0°, zenith=90°                                                           |
| Declination   | East positive; rotate ENU by −declination around world up exactly once                                                |
| Viewer        | Public `horizontalToEquatorial(..., 'J2000')` → `setView` with existing FOV retained                                  |
| Time          | Existing synchronized server UTC with local fallback, refreshed for each applied update                               |

Sensors are requested at 50 Hz. Quaternion exponential SLERP uses an 85 ms time
constant, with viewport updates capped at 30 Hz, an angular threshold of 0.08°,
and a maximum idle interval of 250 ms. Five seconds without readings stops the
mode. Tuning constants are exported as `SKY_ORIENTATION_TUNING`. No sensor samples
enter the global application store or persisted view history. The secondary
camera overlay updates on its existing timer rather than every sensor reading.
Generation tokens ignore late callbacks; serialized lifecycle operations prevent
duplicate subscriptions during permission dialogs, rapid taps, and visibility changes.

Platform references: [Android rotation vectors](https://developer.android.com/develop/sensors-and-location/sensors/sensors_motion),
[SensorManager coordinate system](https://developer.android.com/reference/android/hardware/SensorManager),
[Core Motion attitude frames](https://developer.apple.com/documentation/coremotion/cmattitudereferenceframe),
[geomagnetism / WMM](https://github.com/naturalatlas/geomagnetism).

## Local builds

The feature is maintained on `acocalypso/Touch-N-Stars`, branch `develop`.
Native source changes require reinstalling a rebuilt binary, not just restarting
Vite or applying an OTA web update.

```sh
npm ci
npm run test:run
npm run lint
npm run typecheck
npm run build:native
npm run sync:native
npx cap open android
# macOS + Xcode is required for iOS:
npx cap open ios
```

Build and run from Android Studio or Xcode. Use a debug binary for local testing.
Do not uninstall an existing app just to replace it; that would erase local data.
For Android command-line builds, use the project-supported JDK/toolchain and
`android/gradlew.bat :app:assembleDebug` on Windows.

## Validation and remaining checks

After pulling `origin/develop` at `f574eaf7`, 595 tests, lint, typecheck,
formatting, and i18n validation passed. The native payload is 23.23 MiB,
within the existing 40 MiB limit, and Android/iOS packaged web assets pass
the boundary checks. Android `:app:assembleDebug` passed; the updated APK was
installed on the connected device without uninstalling or clearing app data.
The new build includes the preflight sensor-availability check.

Automated tests cover N/E/S/W, horizon, zenith/nadir, portrait and both landscapes,
declination sign, 360° interpolation, public astronomy conversion, retained zoom,
permission/location failures, timeout, stale callbacks, suspend/resume, listener
cleanup, configured-site priority, and pan/pinch separation.

Physical north/east/south/west and real-sky alignment are **not verified** yet.
The Android debug APK has been assembled and installed on the connected OnePlus
KB2003. Playwright checked native WebView compass activation/deactivation and
the mobile control bounds. This verifies runtime wiring, not outdoor alignment.
iOS compilation and physical testing require macOS/Xcode and an iOS device.
Native sensor and rendering rates are targets, not measured performance claims.
Translations are provided in English/German; other locales currently use English
text for this feature.

Before release, test both platforms outdoors:

1. Confirm normal manual navigation, enable the compass, and check permission prompts.
2. Aim N/E/S/W at the horizon, then upward; compare the Moon or a bright star.
3. Turn through 360° and tilt horizon → zenith; check smoothness and correct signs.
4. Repeat in portrait and both landscape orientations.
5. Pinch while tracking; confirm zoom is retained. Drag to stop, then re-enable/toggle off.
6. Background/foreground, lock/unlock, navigate away/back, and hide the compass.
7. Deny permissions or remove a site; confirm useful feedback and manual fallback.
8. Inspect native sensor subscriptions, frame pacing, CPU, and memory during repeated toggles.
