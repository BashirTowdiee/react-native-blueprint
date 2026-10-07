export const DEFAULT_BLUEPRINT_MIN_ZOOM = 0.3;
export const DEFAULT_BLUEPRINT_MAX_ZOOM = 2;
export const DEFAULT_BLUEPRINT_ZOOM_STEP = 0.05;

export function clampBlueprintZoom(
  value: number,
  min = DEFAULT_BLUEPRINT_MIN_ZOOM,
  max = DEFAULT_BLUEPRINT_MAX_ZOOM,
): number {
  const lower = Math.min(min, max);
  const upper = Math.max(min, max);

  if (!Number.isFinite(value)) {
    return lower;
  }

  return Math.min(Math.max(value, lower), upper);
}
