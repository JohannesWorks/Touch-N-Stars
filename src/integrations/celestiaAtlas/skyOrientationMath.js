// Native bridge contract: row-major device-to-world matrix, world = east/north/up.
// Device axes: +X right, +Y natural top, +Z out of the display. Look through -Z.
const RAD = Math.PI / 180;

/** Core Motion reference-to-device DCM (north/west/up) -> device-to-world ENU. */
export function coreMotionToEnuMatrix(m) {
  if (!Array.isArray(m) || m.length !== 9 || !m.every(Number.isFinite))
    throw new TypeError('Invalid Core Motion matrix');
  return [-m[1], -m[4], -m[7], m[0], m[3], m[6], m[2], m[5], m[8]];
}
export function normalizeQuaternion(q) {
  if (!Array.isArray(q) || q.length !== 4 || !q.every(Number.isFinite))
    throw new TypeError('Invalid orientation quaternion');
  const length = Math.hypot(...q);
  if (length < 1e-8) throw new TypeError('Invalid orientation quaternion');
  return q.map((value) => value / length);
}
export function multiplyQuaternion(a, b) {
  const [x, y, z, w] = a;
  const [X, Y, Z, W] = b;
  return [
    w * X + x * W + y * Z - z * Y,
    w * Y - x * Z + y * W + z * X,
    w * Z + x * Y - y * X + z * W,
    w * W - x * X - y * Y - z * Z,
  ];
}
export function matrixToQuaternion(m) {
  if (!Array.isArray(m) || m.length !== 9 || !m.every(Number.isFinite))
    throw new TypeError('Invalid orientation matrix');
  // Reject corrupt/non-rotation samples rather than displaying an arbitrary sky.
  for (let row = 0; row < 3; row++) {
    if (Math.abs(Math.hypot(...m.slice(row * 3, row * 3 + 3)) - 1) > 0.02)
      throw new TypeError('Invalid orientation matrix');
    for (let other = 0; other < row; other++) {
      if (
        Math.abs(
          m[row * 3] * m[other * 3] +
            m[row * 3 + 1] * m[other * 3 + 1] +
            m[row * 3 + 2] * m[other * 3 + 2]
        ) > 0.02
      )
        throw new TypeError('Invalid orientation matrix');
    }
  }
  const det =
    m[0] * (m[4] * m[8] - m[5] * m[7]) -
    m[1] * (m[3] * m[8] - m[5] * m[6]) +
    m[2] * (m[3] * m[7] - m[4] * m[6]);
  if (Math.abs(det - 1) > 0.02) throw new TypeError('Invalid orientation matrix');
  const trace = m[0] + m[4] + m[8];
  let q;
  if (trace > 0) {
    const s = Math.sqrt(trace + 1) * 2;
    q = [(m[7] - m[5]) / s, (m[2] - m[6]) / s, (m[3] - m[1]) / s, s / 4];
  } else if (m[0] > m[4] && m[0] > m[8]) {
    const s = Math.sqrt(1 + m[0] - m[4] - m[8]) * 2;
    q = [s / 4, (m[1] + m[3]) / s, (m[2] + m[6]) / s, (m[7] - m[5]) / s];
  } else if (m[4] > m[8]) {
    const s = Math.sqrt(1 + m[4] - m[0] - m[8]) * 2;
    q = [(m[1] + m[3]) / s, s / 4, (m[5] + m[7]) / s, (m[2] - m[6]) / s];
  } else {
    const s = Math.sqrt(1 + m[8] - m[0] - m[4]) * 2;
    q = [(m[2] + m[6]) / s, (m[5] + m[7]) / s, s / 4, (m[3] - m[1]) / s];
  }
  return normalizeQuaternion(q);
}
export function slerp(a, b, fraction) {
  let dot = a.reduce((sum, value, i) => sum + value * b[i], 0);
  const target = dot < 0 ? b.map((value) => -value) : b;
  dot = Math.min(1, Math.abs(dot));
  if (dot > 0.9995)
    return normalizeQuaternion(a.map((value, i) => value + fraction * (target[i] - value)));
  const angle = Math.acos(dot);
  const left = Math.sin((1 - fraction) * angle) / Math.sin(angle);
  const right = Math.sin(fraction * angle) / Math.sin(angle);
  return a.map((value, i) => left * value + right * target[i]);
}
export function rotateVector(q, v) {
  const result = multiplyQuaternion(multiplyQuaternion(q, [...v, 0]), [-q[0], -q[1], -q[2], q[3]]);
  return result.slice(0, 3);
}
export function trueNorthQuaternion(q, declinationDeg, reference = 'magnetic') {
  if (reference === 'true') return q;
  if (reference !== 'magnetic' || !Number.isFinite(declinationDeg))
    throw new TypeError('Heading reference unavailable');
  const angle = (-declinationDeg * RAD) / 2;
  return multiplyQuaternion([0, 0, Math.sin(angle), Math.cos(angle)], q);
}
export function pointingDirection(q, screenAngleDeg = 0) {
  if (!Number.isFinite(screenAngleDeg)) throw new TypeError('Invalid screen orientation');
  // UI rotation changes screen-up, never the physical viewing ray through -Z.
  const angle = (-screenAngleDeg * RAD) / 2;
  const screen = multiplyQuaternion(q, [0, 0, Math.sin(angle), Math.cos(angle)]);
  const vector = rotateVector(screen, [0, 0, -1]);
  const [east, north, up] = vector;
  return {
    vector,
    screenUp: rotateVector(screen, [0, 1, 0]),
    azimuthDeg: (((Math.atan2(east, north) / RAD) % 360) + 360) % 360,
    altitudeDeg: Math.asin(Math.max(-1, Math.min(1, up))) / RAD,
  };
}
export function vectorSeparationDeg(a, b) {
  return (
    Math.acos(
      Math.max(
        -1,
        Math.min(
          1,
          a.reduce((sum, value, i) => sum + value * b[i], 0)
        )
      )
    ) / RAD
  );
}
