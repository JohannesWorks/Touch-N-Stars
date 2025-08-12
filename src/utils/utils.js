export async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function degreesToHMS(deg) {
  const totalHours = deg / 15;
  const h = Math.floor(totalHours);
  const remainingHours = totalHours - h;
  const totalMinutes = remainingHours * 60;
  const m = Math.floor(totalMinutes);
  const remainingMinutes = totalMinutes - m;
  const s = remainingMinutes * 60;
  const hStr = String(h);
  const mStr = String(m).padStart(2, '0');
  const sStr = s.toFixed(1).padStart(4, '0');

  return `${hStr}:${mStr}:${sStr}`;
}

export function degreesToDMS(deg) {
  const sign = deg < 0 ? '-' : '+';
  deg = Math.abs(deg);
  const d = Math.floor(deg);
  const remainingDeg = deg - d;
  const totalMinutes = remainingDeg * 60;
  const m = Math.floor(totalMinutes);
  const remainingMinutes = totalMinutes - m;
  const s = remainingMinutes * 60;

  const dStr = String(d).padStart(2, '0');
  const mStr = String(m).padStart(2, '0');
  const sStr = s.toFixed(1).padStart(4, '0');

  return `${sign}${dStr}:${mStr}:${sStr}`;
}

export function hmsToDegrees(hmsString) {
  const parts = hmsString.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parseFloat(parts[2]);
  return hours * 15 + minutes * (15 / 60) + seconds * (15 / 3600);
}

export function dmsToDegrees(dmsString) {
  const sign = dmsString.startsWith('-') ? -1 : 1;
  const stripped = dmsString.replace('-', '');
  const parts = stripped.split(':');
  const degrees = parseFloat(parts[0]);
  const minutes = parseFloat(parts[1]);
  const seconds = parseFloat(parts[2]);

  return sign * (degrees + minutes / 60 + seconds / 3600);
}

export function parseAngleInput(input) {
  input = input.replace(',', '.').trim();
  if (input.includes(':')) {
    const parts = input.split(':').map(Number);
    if (parts.length === 3) {
      const [deg, min, sec] = parts;
      return Math.sign(deg) * (Math.abs(deg) + min / 60 + sec / 3600);
    }
  }
  const value = parseFloat(input);
  if (!isNaN(value)) {
    return value;
  }
  return null;
}

export function rad2deg(rad) {
  return rad * (180 / Math.PI);
}

export function utcToMJD(utcDate) {
  return utcDate.getTime() / 86400000 + 40587;
}

export function mjdToUTC(mjd) {
  return new Date((mjd - 40587) * 86400000);
}

// Funktion zum Formatieren der Uhrzeit
export function formatTime(timestamp) {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

// Julianisches Datum berechnen
export function getJulianDate() {
  const now = new Date();
  let year = now.getUTCFullYear();
  let month = now.getUTCMonth() + 1;
  const day = now.getUTCDate();
  const hour = now.getUTCHours();
  const minute = now.getUTCMinutes();
  const second = now.getUTCSeconds();

  if (month <= 2) {
    year -= 1;
    month += 12;
  }

  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  const JD =
    Math.floor(365.25 * (year + 4716)) +
    Math.floor(30.6001 * (month + 1)) +
    day +
    B -
    1524.5 +
    (hour + minute / 60 + second / 3600) / 24;

  return JD;
}

// Greenwich-Sternzeit (GST) berechnen
export function getGST() {
  const JD = getJulianDate();
  const S = JD - 2451545.0;
  const T = S / 36525.0;
  const GST = 280.46061837 + 360.98564736629 * S + T ** 2 * (0.000387933 - T / 38710000);
  return ((GST % 360) + 360) % 360; // In Grad, normalisiert auf 0-360°
}

// Lokale Sternzeit (LST) berechnen
export function getLST(longitude) {
  const GST = getGST();
  return (GST + longitude) % 360;
}

/**
 * Converts altitude and azimuth coordinates to right ascension (RA) and declination (Dec).
 *
 * @param {number} altitude - The altitude above the horizon in degrees.
 * @param {number} azimuth - The azimuth angle in degrees (0° = North, 90° = East).
 * @param {number} latitude - The observer's geographic latitude in degrees.
 * @param {number} longitude - The observer's geographic longitude in degrees.
 * @returns {{ra: number, dec: number}} An object containing the equatorial coordinates: right ascension (RA) and declination (Dec).
 * @throws {TypeError} If any of the parameters are not finite numbers.
 */
export function altAzToRaDec(altitude, azimuth, latitude, longitude) {
  const rad = Math.PI / 180; // Umrechnung Grad → Radiant
  const deg = 180 / Math.PI; // Umrechnung Radiant → Grad

  // Lokale Sternzeit berechnen
  const LST = getLST(longitude);

  // Umwandlung in Radianten
  const h = altitude * rad;
  const A = azimuth * rad;
  const phi = latitude * rad;

  // Deklination berechnen
  const sinDec = Math.sin(h) * Math.sin(phi) + Math.cos(h) * Math.cos(phi) * Math.cos(A);
  const dec = Math.asin(sinDec) * deg;

  // Stundenwinkel berechnen
  const y = -Math.sin(A) * Math.cos(h);
  const x = Math.cos(phi) * Math.sin(h) - Math.sin(phi) * Math.cos(h) * Math.cos(A);
  const HA = Math.atan2(y, x) * deg;

  // Rektaszension berechnen
  let ra = (LST - HA) % 360;
  if (ra < 0) ra += 360; // Normierung auf 0 - 360°

  return { ra, dec };
}
