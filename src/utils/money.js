// src/utils/money.js
export const CURRENCY = "BDT";   // Bangladeshi Taka
export const MINOR = 100;        // 1 BDT = 100 poisha

// Convert BDT -> poisha (minor units)
export const toMinor = (amountBDT) => Math.round(Number(amountBDT || 0) * MINOR);

// Convert poisha -> BDT (number)
export const fromMinor = (amountMinor) => Number(amountMinor || 0) / MINOR;

// Format poisha -> "৳ 1,234.56"
export const formatBDT = (amountMinor) => {
  const val = fromMinor(amountMinor);
  // Simple formatting; you can use Intl.NumberFormat if you prefer locales
  return `৳ ${val.toFixed(2)}`;
};