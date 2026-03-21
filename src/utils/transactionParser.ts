/**
 * Result of a successfully parsed transaction input.
 */
export interface ParsedTransaction {
  category: string;
  amount: number;
}

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
 *  - Input must contain exactly one numeric token and one alphabetic token.
 *  - Number-only input defaults to the "general" category.
 *  - Amount must be a positive finite number.
 *
 * @param input - Raw user input string
 * @returns Parsed transaction or null if the format is invalid
 */
export function parseTransactionInput(input: string): ParsedTransaction | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Number-only input → default category
  const numericOnly = /^[\d.]+$/.test(trimmed);
  if (numericOnly) {
    const amount = parseFloat(trimmed);
    if (!isNaN(amount) && amount > 0 && isFinite(amount)) {
      return { category: 'general', amount };
    }
    return null;
  }

  // Split into consecutive letter/number chunks
  const chunks = trimmed.match(/[a-zA-Z]+|[\d.]+/g);
  if (!chunks || chunks.length === 0) return null;

  const numberChunks = chunks.filter(chunk => /^[\d.]+$/.test(chunk));
  const textChunks = chunks.filter(chunk => /^[a-zA-Z]+$/.test(chunk));

  // Must have exactly one numeric and one alphabetic token
  if (numberChunks.length !== 1 || textChunks.length !== 1) {
    return null;
  }

  const amount = parseFloat(numberChunks[0]);
  const category = textChunks[0].toLowerCase();

  if (isNaN(amount) || amount <= 0 || !isFinite(amount)) return null;

  return { category, amount };
}
