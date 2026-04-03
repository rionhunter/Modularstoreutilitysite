/**
 * Result of a successfully parsed transaction input.
 */
export interface ParsedTransaction {
  category: string;
  amount: number;
}

/**
 * Strict numeric pattern: one or more digits, followed by an optional decimal
 * portion (dot + one or more digits).  A leading digit is always required, so
 * ".5" is rejected — callers must use "0.5" instead.
 */
const STRICT_NUMERIC = /^\d+(\.\d+)?$/;

/**
 * Parses a quick-entry transaction string into a category and amount.
 *
 * Supported formats:
 *  - "cash150"    → { category: "cash", amount: 150 }
 *  - "150card"    → { category: "card", amount: 150 }
 *  - "150"        → { category: "general", amount: 150 }
 *  - "75.50eftpos"→ { category: "eftpos", amount: 75.50 }
 *
 * Rules:
 *  - Input must consist solely of letters, digits, and at most one decimal point.
 *    Any other characters (e.g. `!`, `@`, spaces within the token) cause rejection.
 *  - Input must contain exactly one numeric token and one alphabetic token.
 *  - Number-only input defaults to the "general" category.
 *  - Amount must be a positive finite number with at most one decimal separator.
 *    A leading digit is required (use "0.5" not ".5").
 *
 * @param input - Raw user input string
 * @returns Parsed transaction or null if the format is invalid
 */
export function parseTransactionInput(input: string): ParsedTransaction | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Reject any input that contains characters outside [a-zA-Z0-9.]
  // This ensures "cash150!" or "cash 150" are rejected rather than silently truncated.
  if (/[^a-zA-Z0-9.]/.test(trimmed)) return null;

  // Number-only input → default category
  if (STRICT_NUMERIC.test(trimmed)) {
    const amount = parseFloat(trimmed);
    if (!isNaN(amount) && amount > 0 && isFinite(amount)) {
      return { category: 'general', amount };
    }
    return null;
  }

  // At this point we know the input contains at least one letter.
  // Split into consecutive letter/number chunks.
  const chunks = trimmed.match(/[a-zA-Z]+|[\d.]+/g);
  if (!chunks || chunks.length === 0) return null;

  const numberChunks = chunks.filter(chunk => /^[\d.]+$/.test(chunk));
  const textChunks = chunks.filter(chunk => /^[a-zA-Z]+$/.test(chunk));

  // Must have exactly one numeric and one alphabetic token
  if (numberChunks.length !== 1 || textChunks.length !== 1) {
    return null;
  }

  // Validate the numeric token with the strict pattern (rejects multi-dot values)
  if (!STRICT_NUMERIC.test(numberChunks[0])) return null;

  const amount = parseFloat(numberChunks[0]);
  const category = textChunks[0].toLowerCase();

  if (isNaN(amount) || amount <= 0 || !isFinite(amount)) return null;

  return { category, amount };
}
