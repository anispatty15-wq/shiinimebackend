export const LEVEL_THRESHOLDS: ReadonlyArray<{ level: number; exp: number }> = [
  { level: 1, exp: 0 },
  { level: 2, exp: 100 },
  { level: 3, exp: 250 },
  { level: 4, exp: 450 },
  { level: 5, exp: 700 }
];

export const levelForExp = (exp: number): number => {
  return LEVEL_THRESHOLDS.reduce((level, threshold) => exp >= threshold.exp ? threshold.level : level, 1);
};
