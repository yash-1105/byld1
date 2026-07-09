export type Units = 'metric' | 'imperial';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'INR' | 'AED';
export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';

export interface Preferences {
  units: Units;
  currency: Currency;
  dateFormat: DateFormat;
}

export const DEFAULT_PREFERENCES: Preferences = {
  units: 'metric',
  currency: 'USD',
  dateFormat: 'MM/DD/YYYY',
};

export const PREFERENCES_STORAGE_KEY = 'byld.preferences.v1';

export const CURRENCY_LABELS: Record<Currency, string> = {
  USD: 'US Dollar ($)',
  EUR: 'Euro (€)',
  GBP: 'British Pound (£)',
  INR: 'Indian Rupee (₹)',
  AED: 'UAE Dirham (د.إ)',
};

const CURRENCY_LOCALE: Record<Currency, string> = {
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  INR: 'en-IN',
  AED: 'en-AE',
};

/**
 * Approximate exchange rates — units of the target currency per 1 USD.
 * All amounts in the app are stored/entered as USD, so display values are
 * converted from this base. Rates are static (no live FX feed).
 */
export const USD_RATES: Record<Currency, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83,
  AED: 3.67,
};

/** Convert a USD-base amount into the selected currency. */
export function convertFromUSD(amountUSD: number, currency: Currency): number {
  return (amountUSD || 0) * USD_RATES[currency];
}

/** Convert an amount entered in the selected currency back into the USD base. */
export function convertToUSD(amount: number, currency: Currency): number {
  return (amount || 0) / USD_RATES[currency];
}

/** Bare currency symbol for inline use in form labels/placeholders (e.g. inputs). */
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  AED: 'د.إ',
};

/** Full currency string, e.g. "$24,500" / "₹2,033,500" — converted from USD. */
export function formatCurrency(amount: number, currency: Currency): string {
  return new Intl.NumberFormat(CURRENCY_LOCALE[currency], {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(convertFromUSD(amount, currency));
}

// Locale used for compact notation: Indian locale gives lakh/crore (L/Cr) for INR;
// en-US gives K/M/B for everything else (avoids verbose forms like "5,4 Mio. €").
const COMPACT_LOCALE: Record<Currency, string> = {
  USD: 'en-US',
  EUR: 'en-US',
  GBP: 'en-US',
  INR: 'en-IN',
  AED: 'en-US',
};

/** Compact currency string, e.g. "$5.4M" / "₹49Cr" — converted from USD. */
export function formatCurrencyCompact(amount: number, currency: Currency): string {
  return new Intl.NumberFormat(COMPACT_LOCALE[currency], {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(convertFromUSD(amount, currency));
}

export function formatDate(date: Date | string | null | undefined, fmt: DateFormat): string {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'N/A';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  if (fmt === 'DD/MM/YYYY') return `${dd}/${mm}/${yyyy}`;
  if (fmt === 'YYYY-MM-DD') return `${yyyy}-${mm}-${dd}`;
  return `${mm}/${dd}/${yyyy}`;
}
