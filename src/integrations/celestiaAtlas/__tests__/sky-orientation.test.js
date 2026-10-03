import test from 'node:test';
import assert from 'node:assert/strict';
import { equatorialToHorizontal } from '@acocalypso/celestia-atlas';
import {
  matrixToQuaternion,
  coreMotionToEnuMatrix,
  pointingDirection,
  slerp,
  trueNorthQuaternion,
} from '../skyOrientationMath.js';
import {
  createSkyOrientationController,
  observerDeclination,
} from '../skyOrientationController.js';
import { createSkyObserverResolver } from '../skyOrientationLocation.js';
import { createSkyPanDetector } from '../skyOrientationGesture.js';
import { createOrientationSensorService } from '../../../services/orientationSensorService.js';

const north = [1, 0, 0, 0, 0, -1, 0, 1, 0];
const site = { latitudeDeg: 52.52, longitudeDeg: 13.405, elevationM: 34 };
const utc = Date.UTC(2026, 9, 1, 20);
const near = (actual, expected, tolerance = 1e-7) =>
  assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);

test('ENU device rotations point N/E/S/W, horizon and zenith in every screen orientation', () => {
  const fixtures = [
    [north, 0, 0],
    [[0, 0, -1, -1, 0, 0, 0, 1, 0], 90, 0],
    [[-1, 0, 0, 0, 0, 1, 0, 1, 0], 180, 0],
    [[0, 0, 1, 1, 0, 0, 0, 1, 0], 270, 0],
    [[1, 0, 0, 0, -1, 0, 0, 0, -1], null, 90],
    [[1, 0, 0, 0, 1, 0, 0, 0, 1], null, -90],
  ];
  for (const [matrix, azimuth, altitude] of fixtures) {
    for (const screen of [0, 90, 180, 270]) {
      const direction = pointingDirection(matrixToQuaternion(matrix), screen);
      if (azimuth !== null) near(direction.azimuthDeg, azimuth);
      near(direction.altitudeDeg, altitude, 1e-5);
    }
  }
  assert.throws(() => matrixToQuaternion([1, 0, 0, 0, 1, 0, 0, 0, -1]));
  assert.throws(() => matrixToQuaternion(Array(9).fill(NaN)));
});

test('east-positive declination corrects magnetic north once, and SLERP crosses 360 by the short path', () => {
  const q = matrixToQuaternion(north);
  near(pointingDirection(trueNorthQuaternion(q, 7)).azimuthDeg, 7);
  near(pointingDirection(trueNorthQuaternion(q, 7, 'true')).azimuthDeg, 0);
  const a = trueNorthQuaternion(q, -1);
  const b = trueNorthQuaternion(q, 1);
  const middle = pointingDirection(slerp(a, b, 0.5)).azimuthDeg;
  assert.ok(middle < 0.001 || middle > 359.999);
  near(
    Math.abs(
      slerp(
        q,
        q.map((v) => -v),
        0.5
      )[3]
    ),
    Math.abs(q[3])
  );

  assert.ok(Number.isFinite(observerDeclination(site, utc)));
});

test('Core Motion reference-to-device DCM is transposed and changes NWU into ENU', () => {
  // Upright devices: screen +Y is up; rear normal points in each cardinal direction.
  const fixtures = [
    [[0, -1, 0, 0, 0, 1, -1, 0, 0], 0],
    [[-1, 0, 0, 0, 0, 1, 0, 1, 0], 90],
    [[0, 1, 0, 0, 0, 1, 1, 0, 0], 180],
    [[1, 0, 0, 0, 0, 1, 0, -1, 0], 270],
  ];
  for (const [dcm, azimuth] of fixtures) {
    const direction = pointingDirection(matrixToQuaternion(coreMotionToEnuMatrix(dcm)));
    near(direction.azimuthDeg, azimuth);
    near(direction.altitudeDeg, 0);
    near(direction.screenUp[2], 1);
  }
});

function harness(options = {}) {
  let time = 0;
  let callback;
  let errorCallback;
  let raf;
  let view = { center: { raDeg: 0, decDeg: 0, frame: 'J2000' }, fovDeg: 42 };
  const updates = [];
  const statuses = [];
  const sensor = {
    available: true,
    starts: 0,
    stops: 0,
    async start(sample, error) {
      this.starts++;
      callback = sample;
      errorCallback = error;
    },
    async stop() {
      this.stops++;
    },
    ...options.sensor,
  };
  const viewer = {
    getView: () => view,
    setObserver() {},
    setTimeRate() {},
    setTime() {},
    setView(next) {
      view = next;
      updates.push(next);
    },
  };
  const controller = createSkyOrientationController({
    sensor,
    getViewer: () => viewer,
    resolveObserver: async () => site,
    utcNow: () => utc,
    declination: () => 0,
    now: () => time,
    requestFrame(fn) {
      raf = fn;
      return 1;
    },
    cancelFrame() {
      raf = null;
    },
    onStatus: (state) => statuses.push(state),
    ...options.controller,
  });
  return {
    controller,
    sensor,
    viewer,
    updates,
    statuses,
    sample: (matrix = north) => callback({ matrix, reference: 'magnetic', screenAngleDeg: 0 }),
    error: (code) => errorCallback({ code }),
    get lateSample() {
      return callback;
    },
    frame(delta = 40) {
      time += delta;
      const next = raf;
      raf = null;
      next?.();
    },
    zoom(fovDeg) {
      view = { ...view, fovDeg };
    },
  };
}

test('tracking uses current observer/time and preserves pinch FOV across updates', async () => {
  const h = harness();
  await h.controller.toggle();
  h.sample();
  h.frame();
  assert.equal(h.controller.state, 'ACTIVE');
  let horizontal = equatorialToHorizontal(h.updates.at(-1).center, site, utc);
  near(horizontal.altitudeDeg, 0, 0.001);
  assert.ok(horizontal.azimuthDeg < 0.001 || horizontal.azimuthDeg > 359.999);
  h.zoom(12);
  h.frame(300);
  assert.equal(h.updates.at(-1).fovDeg, 12);
  const late = h.lateSample;
  await h.controller.setVisible(false);
  assert.equal(h.controller.state, 'SUSPENDED');
  late({ matrix: north });
  h.frame();
  const count = h.updates.length;
  assert.equal(h.updates.length, count);
  await h.controller.setVisible(true);
  assert.equal(h.sensor.starts, 2);
  h.sample();
  h.frame();
  await h.controller.disable();
  assert.equal(h.controller.state, 'DISABLED');
  await h.controller.destroy();
  assert.ok(h.sensor.stops >= 4);
});

test('permission denial, missing hardware/location and sample timeout stop cleanly', async () => {
  for (const code of ['PERMISSION_DENIED', 'LOCATION_REQUIRED', 'UNAVAILABLE']) {
    const h = harness({
      controller: {
        resolveObserver: async () => {
          throw Object.assign(new Error(code), { code });
        },
      },
    });
    await h.controller.toggle();
    assert.equal(h.controller.state, code === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'ERROR');
    assert.equal(h.statuses.at(-1).reason, code);
    assert.equal(h.sensor.starts, 0);
    await h.controller.destroy();
  }
  const h = harness();
  await h.controller.toggle();
  h.frame(5100);
  assert.equal(h.controller.state, 'UNAVAILABLE');
  await h.controller.destroy();
});

test('missing native sensors are checked before requesting observer location', async () => {
  let locationCalls = 0;
  const h = harness({
    sensor: {
      async checkAvailability() {
        return false;
      },
    },
    controller: {
      resolveObserver: async () => {
        locationCalls++;
        return site;
      },
    },
  });
  await h.controller.toggle();
  assert.equal(h.controller.state, 'UNAVAILABLE');
  assert.equal(locationCalls, 0);
  assert.equal(h.sensor.starts, 0);
  await h.controller.destroy();
});

test('native service availability never starts sensors and fails gracefully on old binaries', async () => {
  let calls = 0;
  const service = createOrientationSensorService({
    native: () => true,
    plugin: {
      async getAvailability() {
        calls++;
        return { available: false };
      },
    },
  });
  assert.equal(await service.checkAvailability(), false);
  assert.equal(calls, 1);
  const oldBinary = createOrientationSensorService({
    native: () => true,
    plugin: {
      async getAvailability() {
        throw new Error('unimplemented');
      },
    },
  });
  assert.equal(await oldBinary.checkAvailability(), false);
});

test('viewport direction round trips through the Atlas public API for every cardinal and zenith', async () => {
  for (const [matrix, azimuth, altitude] of [
    [north, 0, 0],
    [[0, 0, -1, -1, 0, 0, 0, 1, 0], 90, 0],
    [[-1, 0, 0, 0, 0, 1, 0, 1, 0], 180, 0],
    [[0, 0, 1, 1, 0, 0, 0, 1, 0], 270, 0],
    [[1, 0, 0, 0, -1, 0, 0, 0, -1], null, 90],
  ]) {
    const h = harness();
    await h.controller.toggle();
    h.sample(matrix);
    h.frame();
    const direction = equatorialToHorizontal(h.updates.at(-1).center, site, utc);
    if (azimuth !== null) {
      const error = ((direction.azimuthDeg - azimuth + 540) % 360) - 180;
      near(error, 0, 0.001);
    }
    near(direction.altitudeDeg, altitude, 0.001);
    await h.controller.destroy();
  }
});

test('disable during location lookup cannot start sensors later', async () => {
  let resolve;
  const location = new Promise((done) => {
    resolve = done;
  });
  const h = harness({ controller: { resolveObserver: () => location } });
  const start = h.controller.toggle();
  await new Promise((done) => setImmediate(done));
  const stop = h.controller.disable();
  resolve(site);
  await Promise.all([start, stop]);
  assert.equal(h.sensor.starts, 0);
  assert.equal(h.controller.state, 'DISABLED');
});

test('configured observer wins without GPS; fallback is cached and errors are useful', async () => {
  let calls = 0;
  let settings = { Latitude: 52.52, Longitude: 13.405, Elevation: 34 };
  const resolve = createSkyObserverResolver(
    () => settings,
    async () => {
      calls++;
      return { coords: { latitude: 1, longitude: 2, altitude: 3 } };
    }
  );
  const configured = await resolve();
  near(configured.latitudeDeg, site.latitudeDeg);
  near(configured.longitudeDeg, site.longitudeDeg);
  near(configured.elevationM, site.elevationM);
  assert.equal(calls, 0);
  settings = null;
  assert.equal((await resolve()).latitudeDeg, 1);
  await resolve();
  assert.equal(calls, 1);
  await assert.rejects(
    createSkyObserverResolver(
      () => null,
      async () => {
        throw new Error('denied');
      }
    )(),
    { code: 'LOCATION_REQUIRED' }
  );
});

test('single pointer pan disables tracking but two pointer pinch does not', () => {
  let pans = 0;
  const detector = createSkyPanDetector(() => pans++);
  const event = (pointerId, clientX = 0) => ({ pointerId, clientX, clientY: 0, button: 0 });
  detector.down(event(1));
  detector.move(event(1, 3));
  assert.equal(pans, 0);
  detector.move(event(1, 10));
  assert.equal(pans, 1);
  detector.down(event(1));
  detector.down(event(2));
  detector.move(event(1, 50));
  detector.end(event(2));
  detector.move(event(1, 60));
  assert.equal(pans, 1);
  detector.end(event(1));
  detector.down(event(3));
  detector.move(event(3, 20));
  assert.equal(pans, 2);
});

test('native service removes both listeners after failed permission request', async () => {
  let removed = 0;
  let stopped = 0;
  const service = createOrientationSensorService({
    native: () => true,
    plugin: {
      async addListener() {
        return {
          async remove() {
            removed++;
          },
        };
      },
      async start() {
        throw Object.assign(new Error('denied'), { code: 'PERMISSION_DENIED' });
      },
      async stop() {
        stopped++;
      },
    },
  });
  await assert.rejects(
    service.start(
      () => {},
      () => {}
    ),
    { code: 'PERMISSION_DENIED' }
  );
  assert.equal(removed, 2);
  assert.equal(stopped, 1);
  await service.stop();
  assert.equal(removed, 2);
});
