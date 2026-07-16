import { performance } from "perf_hooks";

export const startMeasure = (name: string) => {
  if (process.env.NODE_ENV !== "production") {
    performance.mark(`${name}-start`);
  }
};

export const endMeasure = (name: string) => {
  if (process.env.NODE_ENV !== "production") {
    const startMark = `${name}-start`;
    const endMark = `${name}-end`;
    performance.mark(endMark);
    try {
      performance.measure(name, startMark, endMark);
      const entries = performance.getEntriesByName(name);
      const entry = entries[entries.length - 1];
      if (entry) {
        console.log(`[Timer] ${name} took ${entry.duration.toFixed(2)}ms`);
      }
    } catch (e) {
      // Ignored
    } finally {
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
