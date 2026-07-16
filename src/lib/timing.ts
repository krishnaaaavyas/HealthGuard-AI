export const startMeasure = (name: string) => {
  if (import.meta.env.DEV) {
    performance.mark(`${name}-start`);
  }
};

export const endMeasure = (name: string) => {
  if (import.meta.env.DEV) {
    const startMark = `${name}-start`;
    const endMark = `${name}-end`;
    performance.mark(endMark);
    try {
      performance.measure(name, startMark, endMark);
      const entries = performance.getEntriesByName(name);
      const measure = entries[entries.length - 1];
      if (measure) {
        console.log(`[Timer] ${name} took ${measure.duration.toFixed(2)}ms`);
      }
    } catch (e) {
      // Ignored if marks are missing or performance isn't fully supported
    } finally {
      // Clean up marks
      try {
        performance.clearMarks(startMark);
        performance.clearMarks(endMark);
        performance.clearMeasures(name);
      } catch (_) {
        // Ignored
      }
    }
  }
};
