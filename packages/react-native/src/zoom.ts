export const DEFAULT_MIN_SCALE = 0.3;
export const DEFAULT_MAX_SCALE = 2;
export const DEFAULT_ZOOM_STEP = 0.05;
export const DEFAULT_INITIAL_SCALE = 0.5;

export type BlueprintZoomDirection = 'in' | 'out';

export function validateBlueprintZoomRange(minScale: number, maxScale: number) {
  if (!Number.isFinite(minScale) || minScale <= 0) {
    throw new RangeError('Blueprint minScale must be a finite number greater than 0.');
  }

  if (!Number.isFinite(maxScale) || maxScale < minScale) {
    throw new RangeError(
      'Blueprint maxScale must be a finite number greater than or equal to minScale.',
    );
  }
}

export function clampBlueprintScale(
  scale: number,
  minScale = DEFAULT_MIN_SCALE,
  maxScale = DEFAULT_MAX_SCALE,
) {
  validateBlueprintZoomRange(minScale, maxScale);

  if (!Number.isFinite(scale)) {
    return minScale;
  }

  return Math.min(maxScale, Math.max(minScale, scale));
}

export function getNextBlueprintScale(
  currentScale: number,
  direction: BlueprintZoomDirection,
  options: {
    minScale?: number;
    maxScale?: number;
    step?: number;
  } = {},
) {
  const minScale = options.minScale ?? DEFAULT_MIN_SCALE;
  const maxScale = options.maxScale ?? DEFAULT_MAX_SCALE;
  const step = options.step ?? DEFAULT_ZOOM_STEP;

  if (!Number.isFinite(step) || step <= 0) {
    throw new RangeError('Blueprint zoom step must be a finite number greater than 0.');
  }

  const delta = direction === 'in' ? step : -step;
  const next = Number((currentScale + delta).toFixed(4));

  return clampBlueprintScale(next, minScale, maxScale);
}
