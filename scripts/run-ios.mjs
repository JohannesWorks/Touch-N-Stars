import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// native-run can miss physical devices that Apple's CoreDevice tools can see.
// Keep the Ionic build/sync pipeline and use Xcode's tools for device deployment.
const root = fileURLToPath(new URL('../', import.meta.url));

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed (${result.status ?? result.signal})`);
}

function main() {
  if (process.platform !== 'darwin') throw new Error('iOS device builds require macOS and Xcode.');
  const requestedDevice = process.argv[2];
  if (process.argv.length > 3) throw new Error('Usage: npm run ios:run -- [device UDID or name]');
  const scratch = mkdtempSync(join(tmpdir(), 'touch-n-stars-ios-'));
  let device;
  try {
    const devicesFile = join(scratch, 'devices.json');
    run('xcrun', ['devicectl', 'list', 'devices', '--json-output', devicesFile]);
    const devices = JSON.parse(readFileSync(devicesFile, 'utf8')).result.devices;
    const candidates = devices.filter((entry) => {
      if (entry.hardwareProperties.platform !== 'iOS') return false;
      if (requestedDevice) {
        return [
          entry.identifier,
          entry.hardwareProperties.udid,
          entry.deviceProperties.name,
        ].includes(requestedDevice);
      }
      // CoreDevice may close an idle tunnel while the paired phone remains available.
      return entry.connectionProperties.pairingState === 'paired';
    });
    if (candidates.length !== 1) {
      throw new Error(
        candidates.length === 0
          ? 'No matching iOS device found. Connect, unlock, and trust your iPhone, then retry.'
          : 'Multiple iOS devices connected. Pass a device UDID or name: npm run ios:run -- <device>'
      );
    }
    device = candidates[0];
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }

  console.log(`Building for ${device.deviceProperties.name}`);
  run(process.execPath, [
    resolve(root, 'node_modules/@ionic/cli/bin/ionic'),
    'capacitor',
    'build',
    'ios',
    '--no-open',
  ]);
  run(process.execPath, [
    resolve(root, 'scripts/verify-native-atlas-build.mjs'),
    'ios/App/App/public',
  ]);
  const derivedData = process.env.IOS_DERIVED_DATA_PATH
    ? resolve(root, process.env.IOS_DERIVED_DATA_PATH)
    : resolve(root, 'ios/DerivedData', device.hardwareProperties.udid);
  run('xcodebuild', [
    '-workspace',
    'ios/App/App.xcworkspace',
    '-scheme',
    'App',
    '-configuration',
    'Debug',
    '-destination',
    `id=${device.hardwareProperties.udid}`,
    '-derivedDataPath',
    derivedData,
    '-allowProvisioningUpdates',
    'build',
  ]);
  run('xcrun', [
    'devicectl',
    'device',
    'install',
    'app',
    '--device',
    device.identifier,
    join(derivedData, 'Build/Products/Debug-iphoneos/App.app'),
  ]);
  const { appId } = JSON.parse(readFileSync(resolve(root, 'capacitor.config.json'), 'utf8'));
  run('xcrun', ['devicectl', 'device', 'process', 'launch', '--device', device.identifier, appId]);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
