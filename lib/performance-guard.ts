export function isValidPerformanceMeasureRange(start: number, end: number) {
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return false;
  }

  if (start < 0 || end < 0) {
    return false;
  }

  if (end < start) {
    return false;
  }

  return true;
}

export function installPerformanceGuard() {
  if (typeof window === "undefined") {
    return;
  }

  const perf = window.performance;

  if (!perf || typeof perf.measure !== "function") {
    return;
  }

  const originalMeasure = perf.measure.bind(perf);

  Object.defineProperty(perf, "measure", {
    configurable: true,
    writable: true,
    value: (...args: Parameters<typeof originalMeasure>) => {
      const [name, startOrMeasureOptions, endMark] = args;

      try {
        if (typeof startOrMeasureOptions === "string") {
          const startEntry = perf.getEntriesByName(startOrMeasureOptions).at(-1);
          const endEntry = endMark ? perf.getEntriesByName(endMark).at(-1) : null;

          if (!startEntry || !endEntry) {
            return undefined;
          }

          if (!isValidPerformanceMeasureRange(startEntry.startTime, endEntry.startTime)) {
            return undefined;
          }
        }

        if (
          startOrMeasureOptions &&
          typeof startOrMeasureOptions === "object" &&
          "start" in startOrMeasureOptions &&
          "end" in startOrMeasureOptions
        ) {
          const startValue = Number(startOrMeasureOptions.start);
          const endValue = Number(startOrMeasureOptions.end);

          if (!isValidPerformanceMeasureRange(startValue, endValue)) {
            return undefined;
          }
        }

        return originalMeasure(name, startOrMeasureOptions as never, endMark as never);
      } catch {
        return undefined;
      }
    },
  });
}
