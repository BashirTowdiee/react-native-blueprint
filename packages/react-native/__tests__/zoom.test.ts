import {
  clampBlueprintZoom,
  DEFAULT_BLUEPRINT_MAX_ZOOM,
  DEFAULT_BLUEPRINT_MIN_ZOOM,
} from '../src';

describe('clampBlueprintZoom', () => {
  it('keeps zoom within the default bounds', () => {
    expect(clampBlueprintZoom(0.1)).toBe(DEFAULT_BLUEPRINT_MIN_ZOOM);
    expect(clampBlueprintZoom(1)).toBe(1);
    expect(clampBlueprintZoom(3)).toBe(DEFAULT_BLUEPRINT_MAX_ZOOM);
  });

  it('normalises reversed custom bounds', () => {
    expect(clampBlueprintZoom(0.25, 2, 0.5)).toBe(0.5);
    expect(clampBlueprintZoom(3, 2, 0.5)).toBe(2);
  });

  it('falls back to the lower bound for non-finite values', () => {
    expect(clampBlueprintZoom(Number.NaN, 0.4, 1.6)).toBe(0.4);
  });
});
