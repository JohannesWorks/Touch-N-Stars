/** A one-finger drag stops tracking; an entire two-finger gesture keeps pinch zoom active. */
export function createSkyPanDetector(onPan) {
  const pointers = new Map();
  let pinch = false;
  return {
    down(event) {
      if (event.button !== undefined && event.button !== 0) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size > 1) pinch = true;
    },
    move(event) {
      const start = pointers.get(event.pointerId);
      if (!start || pinch || pointers.size !== 1) return;
      if (Math.hypot(event.clientX - start.x, event.clientY - start.y) >= 8) {
        pointers.clear();
        onPan();
      }
    },
    end(event) {
      pointers.delete(event.pointerId);
      if (!pointers.size) pinch = false;
    },
    reset() {
      pointers.clear();
      pinch = false;
    },
  };
}
