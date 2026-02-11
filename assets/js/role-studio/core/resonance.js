export function buildResonanceFingerprint({ speed, depth, format, contextMode, score }) {
  return {
    speed,
    depth,
    format,
    contextMode,
    score,
    createdAt: new Date().toISOString(),
  };
}

export class DriftTracker {
  constructor({ threshold = 0.15, windowSize = 5, onDrift }) {
    this.threshold = threshold;
    this.windowSize = windowSize;
    this.history = [];
    this.onDrift = onDrift;
  }

  recordInteraction(score) {
    this.history.push({ timestamp: Date.now(), score });
    if (this.history.length > this.windowSize) this.history.shift();
    this.detectDrift();
  }

  detectDrift() {
    if (this.history.length < 3) return;
    const recentRows = this.history.slice(-3);
    const olderRows = this.history.slice(0, -3);
    const recent = recentRows.reduce((sum, row) => sum + row.score, 0) / recentRows.length;
    const older = olderRows.length
      ? olderRows.reduce((sum, row) => sum + row.score, 0) / olderRows.length
      : recent;
    const drift = older > 0 ? (older - recent) / older : 0;
    if (drift > this.threshold && this.onDrift) {
      this.onDrift(drift);
    }
  }
}

export function applyIntervention(current) {
  const nextDepth = current.depth === 'summary' ? 'deep' : 'summary';
  const nextFormat = current.format === 'numbers' ? 'story' : 'numbers';
  return {
    ...current,
    depth: nextDepth,
    format: nextFormat,
    contextMode: current.contextMode === 'strategic' ? 'operational' : 'strategic',
  };
}
