
/**
 * Formats a number as currency (USD)
 */
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Formats a number as millions (e.g. $1.23M)
 */
export const formatToMillion = (value: number) => {
  return `$${(value / 1000000).toFixed(2)}M`;
};
