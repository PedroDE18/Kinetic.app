/**
 * Locale-aware numeric input parsing for Kinetic's typed data fields.
 *
 * Plain `parseFloat` has three failure modes this util fixes:
 *  1. It silently coerces empty/garbage input to NaN (and callers `|| 0.1` it
 *     away), so malformed data is silently logged.
 *  2. It cannot distinguish Brazilian decimal commas (`"1,5"`) from decimal
 *     dots or thousands groups (`"1.000,5"`).
 *  3. It happily accepts `Infinity`, negatives, and absurd magnitudes.
 *
 * The parser always reports WHY it rejected input, and callers keep the user's
 * raw string in state so a failed validation never erases what they typed.
 *
 * Disambiguation rule (documented + unit tested): when both `.` and `,` appear,
 * the LAST one is the decimal separator and the other is a thousands group.
 * When only one separator type appears, multiple repeating 3-digit groups are
 * treated as thousands ("1,000" → 1000), and a single group is treated as a
 * decimal fraction ("1,5" → 1.5) — the common case for serving counts and the
 * distinction a fitness logger actually types.
 */

export type NumericParseError =
  | 'empty'
  | 'not_numeric'
  | 'unsafe'
  | 'integer_required'
  | 'below_minimum'
  | 'above_maximum';

export interface NumericParseOptions {
  /** Smallest accepted value (defaults to 0 — zero counts as valid unless min set). */
  min?: number;
  /** Largest accepted value (defaults to Number.MAX_SAFE_INTEGER). */
  max?: number;
  /** Require a whole number (used for reps and ml quantities). */
  integer?: boolean;
}

export interface NumericParseResult {
  /** The parsed value when valid. */
  value?: number;
  error?: NumericParseError;
}

const EMPTY_ERROR_MSG = 'Enter a number.';
const ERR_MESSAGES: Record<NumericParseError, string> = {
  empty: EMPTY_ERROR_MSG,
  not_numeric: 'Use numbers only (e.g. 1.5 or 1,5).',
  unsafe: 'That value is too extreme to be real.',
  integer_required: 'Whole numbers only.',
  below_minimum: '',
  above_maximum: '',
};

function localizedMessage(error: NumericParseError, min: number, max: number): string {
  if (error === 'below_minimum') return `Minimum value is ${trimNum(min)}.`;
  if (error === 'above_maximum') return `Maximum value is ${trimNum(max)}.`;
  return ERR_MESSAGES[error];
}

function trimNum(n: number): string {
  return String(Math.round(n * 100) / 100);
}

/**
 * Parse a human-typed numeric string with decimal-comma support and strict
 * rejection of malformed input. Never throws, never returns NaN.
 */
export function parseNumericInput(raw: string, options: NumericParseOptions = {}): NumericParseResult {
  const { min = 0, max = Number.MAX_SAFE_INTEGER, integer = false } = options;

  const trimmed = (raw ?? '').trim();
  if (!trimmed) return { error: 'empty' };

  // Unicode digit/separator normalization: strip NBSP-style thousands gaps and
  // map look-alike minus signs and non-ASCII digit systems to ASCII digits.
  const normalizedChars = trimmed
    .replace(/[\u00A0\u202F\u2009]/g, '') // NBSP / thin-space thousands gaps
    .replace(/[\u2212\uFE63\uFF0D]/g, '-') // minus look-alikes → ASCII hyphen
    .replace(/[\uFF0B]/g, '+') // fullwidth plus
    .replace(/[\u0660-\u0669]/g, (ch) => String(ch.charCodeAt(0) - 0x0660)) // Arabic-Indic
    .replace(/[\u0966-\u096F]/g, (ch) => String(ch.charCodeAt(0) - 0x0966)); // Devanagari
  const cleanedWhitespace = normalizedChars.replace(/\s+/g, '');

  const hasDot = cleanedWhitespace.includes('.');
  const hasComma = cleanedWhitespace.includes(',');

  let candidate = cleanedWhitespace;
  if (hasDot && hasComma) {
    // Mixed separators: the LAST one is the decimal separator.
    const lastDot = cleanedWhitespace.lastIndexOf('.');
    const lastComma = cleanedWhitespace.lastIndexOf(',');
    if (lastDot > lastComma) {
      candidate = cleanedWhitespace.replace(/,/g, '');
    } else {
      candidate = cleanedWhitespace.replace(/\./g, '').replace(',', '.');
    }
  } else if (hasDot || hasComma) {
    const sep = hasComma ? ',' : '.';
    const groups = cleanedWhitespace.split(sep);
    if (groups.length === 2) {
      const trailingLen = groups[1].length;
      if (trailingLen >= 1 && trailingLen <= 2) {
        // "1,5" / "0.75" — short fraction, clearly decimal.
        candidate = groups[0] + '.' + groups[1];
      } else if (trailingLen === 3) {
        // "2,500" kcal vs "1.125" servings — context decides. Prefer whichever
        // interpretation lands inside the caller's plausible range; when both
        // fit, 3-digit grouping wins (display groups beat rare 3-decimal
        // quantities). Tests pin this behavior.
        const asDecimal = Number(groups[0] + '.' + groups[1]);
        const asThousands = Number(groups.join(''));
        const decimalFits =
          Number.isFinite(asDecimal) && asDecimal >= min && asDecimal <= max;
        const thousandsFits =
          Number.isFinite(asThousands) && asThousands >= min && asThousands <= max;
        if (decimalFits && !thousandsFits) candidate = groups[0] + '.' + groups[1];
        else if (thousandsFits) candidate = groups.join('');
        else candidate = groups[0] + '.' + groups[1];
      } else {
        // 4+ digit trailing group is garbage either way: "1,2500".
        return { error: 'not_numeric' };
      }
    } else {
      // 3+ groups must be a clean thousands chain: "1,250,600".
      const validChain =
        groups[0].length >= 1 &&
        groups[0].length <= 3 &&
        groups.slice(1).every((g) => g.length === 3);
      if (!validChain) return { error: 'not_numeric' };
      candidate = groups.join('');
    }
  }

  // Reject anything that isn't a plain (optionally signed) decimal number.
  if (!/^[+-]?\d*\.?\d+$/.test(candidate) || candidate === '.' || candidate === '') {
    return { error: 'not_numeric' };
  }

  const value = Number(candidate);
  if (!Number.isFinite(value)) return { error: 'unsafe' };
  if (integer && !Number.isInteger(value)) return { error: 'integer_required' };
  if (value < min) return { error: 'below_minimum' };
  if (value > max) return { error: 'above_maximum' };

  return { value };
}

/**
 * Convenience wrapper that returns the human-readable validation message
 * (already localized wording), or undefined when the value is valid.
 */
export function numericInputError(raw: string, options: NumericParseOptions = {}): string | undefined {
  const { error } = parseNumericInput(raw, options);
  if (!error) return undefined;
  const { min = 0, max = Number.MAX_SAFE_INTEGER } = options;
  return localizedMessage(error, min, max);
}
