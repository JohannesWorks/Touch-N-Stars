import { Capacitor, registerPlugin } from '@capacitor/core';
import { coreMotionToEnuMatrix } from '../integrations/celestiaAtlas/skyOrientationMath.js';

const SkyOrientation = registerPlugin('SkyOrientation');

/** Native north-referenced sensors only: relative browser Euler events are unsafe for sky pointing. */
export function createOrientationSensorService({
  plugin = SkyOrientation,
  native = () => Capacitor.isNativePlatform(),
} = {}) {
  let handles = [];
  return {
    get available() {
      return native();
    },
    async checkAvailability() {
      if (!native()) return false;
      try {
        return (await plugin.getAvailability()).available === true;
      } catch {
        return false;
      }
    },
    async start(onSample, onError) {
      if (!native())
        throw Object.assign(new Error('Native orientation sensors required'), {
          code: 'UNAVAILABLE',
        });
      try {
        handles.push(
          await plugin.addListener('orientation', (sample) => {
            try {
              onSample(
                sample.coordinateSystem === 'core-motion'
                  ? { ...sample, matrix: coreMotionToEnuMatrix(sample.matrix) }
                  : sample
              );
            } catch (error) {
              onError(error);
            }
          })
        );
        handles.push(await plugin.addListener('sensorError', onError));
        await plugin.start();
      } catch (error) {
        await this.stop();
        throw error;
      }
    },
    async stop() {
      const oldHandles = handles;
      handles = [];
      await Promise.allSettled(oldHandles.map((handle) => handle.remove()));
      if (native()) await plugin.stop();
    },
  };
}
