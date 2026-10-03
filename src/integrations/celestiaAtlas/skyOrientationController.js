import { horizontalToEquatorial } from '@acocalypso/celestia-atlas';
import geomagnetism from 'geomagnetism';
import {
  matrixToQuaternion,
  pointingDirection,
  slerp,
  trueNorthQuaternion,
  vectorSeparationDeg,
} from './skyOrientationMath.js';

export const SKY_ORIENTATION_TUNING = Object.freeze({
  intervalMs: 1000 / 30,
  smoothingMs: 85,
  minimumAngleDeg: 0.08,
  maximumIdleMs: 250,
  sensorTimeoutMs: 5000,
});

export function observerDeclination(observer, utcMs) {
  const field = geomagnetism
    .model(new Date(utcMs), { allowOutOfBoundsModel: false })
    .point([observer.latitudeDeg, observer.longitudeDeg, observer.elevationM / 1000]);
  // Heading is ill-defined close to magnetic poles.
  if (!Number.isFinite(field.decl) || field.h < 2000)
    throw Object.assign(new Error('Heading unavailable'), { code: 'UNAVAILABLE' });
  return field.decl;
}

/** No Vue state or renderer: serializes sensor lifecycle and applies at most 30 camera updates/s. */
export function createSkyOrientationController({
  sensor,
  getViewer,
  resolveObserver,
  utcNow,
  onStatus = (status) => {
    void status;
  },
  onDirection = (direction) => {
    void direction;
  },
  declination = observerDeclination,
  now = () => performance.now(),
  requestFrame = (callback) => requestAnimationFrame(callback),
  cancelFrame = (id) => cancelAnimationFrame(id),
  tuning = SKY_ORIENTATION_TUNING,
}) {
  let status = 'DISABLED';
  let wanted = false;
  let visible = true;
  let disposed = false;
  let generation = 0;
  let queue = Promise.resolve();
  let frame = null;
  let observer = null;
  let correction = 0;
  let target = null;
  let filtered = null;
  let lastDirection = null;
  let screenAngle = 0;
  let sampleAt = 0;
  let filterAt = 0;
  let appliedAt = -Infinity;
  let lowAccuracy = false;

  function report(next, reason = '') {
    status = next;
    onStatus({ state: status, reason, lowAccuracy });
  }
  function stopFrame() {
    if (frame !== null) cancelFrame(frame);
    frame = null;
    target = filtered = lastDirection = null;
  }
  function fail(error) {
    wanted = false;
    generation++;
    stopFrame();
    report(error?.code === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'ERROR', error?.code || 'SENSOR_ERROR');
    enqueue(() => sensor.stop());
  }
  function enqueue(operation) {
    queue = queue.then(operation).catch((error) => {
      if (!disposed) {
        wanted = false;
        stopFrame();
        report('ERROR', error?.code || 'SENSOR_ERROR');
      }
    });
    return queue;
  }
  function tick() {
    frame = null;
    if (!wanted || !visible || disposed) return;
    const timestamp = now();
    if (timestamp - sampleAt > tuning.sensorTimeoutMs) {
      fail(Object.assign(new Error('No orientation readings'), { code: 'UNAVAILABLE' }));
      return;
    }
    if (target && timestamp - appliedAt >= tuning.intervalMs) {
      filtered = filtered
        ? slerp(filtered, target, 1 - Math.exp(-(timestamp - filterAt) / tuning.smoothingMs))
        : target;
      filterAt = timestamp;
      const direction = pointingDirection(filtered, screenAngle);
      if (
        !lastDirection ||
        vectorSeparationDeg(lastDirection, direction.vector) >= tuning.minimumAngleDeg ||
        timestamp - appliedAt >= tuning.maximumIdleMs
      ) {
        try {
          const viewer = getViewer();
          const utcMs = utcNow();
          const center = horizontalToEquatorial(direction, observer, utcMs, 'J2000');
          // Preserve the user's current pinch/wheel FOV on every sensor update.
          viewer.setTime(utcMs);
          viewer.setView({ ...viewer.getView(), center });
          lastDirection = direction.vector;
          appliedAt = timestamp;
          onDirection(direction);
        } catch (error) {
          fail(error);
          return;
        }
      }
    }
    frame = requestFrame(tick);
  }
  async function activate(token) {
    await sensor.stop();
    if (!wanted || !visible || disposed || token !== generation) return;
    try {
      if (sensor.available === false)
        throw Object.assign(new Error('Native sensors unavailable'), { code: 'UNAVAILABLE' });
      if (sensor.checkAvailability && !(await sensor.checkAvailability()))
        throw Object.assign(new Error('Orientation sensors unavailable'), { code: 'UNAVAILABLE' });
      if (!wanted || !visible || disposed || token !== generation) return;
      observer = await resolveObserver();
      if (!wanted || !visible || disposed || token !== generation) return;
      correction = declination(observer, utcNow());
      getViewer().setObserver(observer);
      getViewer().setTimeRate(1);
      sampleAt = filterAt = now();
      appliedAt = -Infinity;
      await sensor.start(
        (sample) => {
          if (token !== generation || !wanted || !visible || disposed) return;
          try {
            target = trueNorthQuaternion(
              matrixToQuaternion(sample.matrix),
              correction,
              sample.reference
            );
            screenAngle = Number.isFinite(sample.screenAngleDeg) ? sample.screenAngleDeg : 0;
            sampleAt = now();
            const nextLow = Boolean(sample.lowAccuracy);
            if (status !== 'ACTIVE' || nextLow !== lowAccuracy) {
              lowAccuracy = nextLow;
              report('ACTIVE');
            }
          } catch (error) {
            fail(error);
          }
        },
        (error) => {
          if (token === generation && wanted && visible && !disposed) fail(error);
        }
      );
      if (token !== generation || !wanted || !visible || disposed) {
        await sensor.stop();
        return;
      }
      frame = requestFrame(tick);
    } catch (error) {
      if (token === generation && !disposed) fail(error);
    }
  }
  return {
    get state() {
      return status;
    },
    toggle() {
      if (wanted) return this.disable();
      if (disposed) return queue;
      wanted = true;
      generation++;
      lowAccuracy = false;
      report(visible ? 'REQUESTING_PERMISSION' : 'SUSPENDED');
      const token = generation;
      return enqueue(() => activate(token));
    },
    disable() {
      wanted = false;
      generation++;
      stopFrame();
      report('DISABLED');
      return enqueue(() => sensor.stop());
    },
    setVisible(value) {
      if (visible === value || disposed) return queue;
      visible = value;
      generation++;
      stopFrame();
      if (!wanted) return enqueue(() => sensor.stop());
      report(visible ? 'REQUESTING_PERMISSION' : 'SUSPENDED');
      const token = generation;
      return enqueue(() => (value ? activate(token) : sensor.stop()));
    },
    async destroy() {
      disposed = true;
      wanted = false;
      generation++;
      stopFrame();
      await enqueue(() => sensor.stop());
    },
  };
}
