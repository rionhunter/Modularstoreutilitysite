/**
 * Cash denominations supported by the cash calculator.
 * Ordered from largest to smallest for greedy breakdown.
 */
export const DENOMINATIONS = [100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05];

/**
 * Calculates the optimal denomination breakdown to compose the given float amount.
 * Attempts to include at least one of each denomination where possible (for change-making),
 * then fills the remainder greedily with the largest denominations.
 *
 * @param float - The target float amount (must be > 0)
 * @returns A record mapping denomination → count, or null if exact change cannot be made
 */
export function calculateFloatBreakdown(float: number): Record<number, number> | null {
  if (float <= 0) return null;

  const result: Record<number, number> = {};
  let remaining = float;

  // Step 1: Try to include at least 1 of each denomination (smallest-first)
  // This ensures the float contains adequate change for all denominations.
  const reversedDenoms = [...DENOMINATIONS].reverse();
  for (const denom of reversedDenoms) {
    if (remaining >= denom) {
      result[denom] = 1;
      remaining = Math.round((remaining - denom) * 100) / 100;
    }
  }

  // Step 2: Fill remaining amount with larger denominations (greedy)
  for (const denom of DENOMINATIONS) {
    if (remaining >= denom) {
      const count = Math.floor(remaining / denom);
      result[denom] = (result[denom] || 0) + count;
      remaining = Math.round((remaining - denom * count) * 100) / 100;
    }
  }

  // If exact change cannot be made, return null
  if (remaining > 0.001) {
    return null;
  }

  return result;
}

/**
 * Calculates the total cash value from a denomination count map.
 *
 * @param entries - Map of denomination → count
 * @returns The total monetary value
 */
export function calculateCashTotal(entries: Record<number, number>): number {
  return DENOMINATIONS.reduce(
    (sum, denom) => sum + denom * (entries[denom] || 0),
    0
  );
}
