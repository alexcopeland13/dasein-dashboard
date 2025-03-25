
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

/**
 * Formats a percentage value with 2 decimal places
 */
export const formatPercentage = (value: number | null) => {
  if (value === null || value === undefined) return 'N/A';
  return `${value.toFixed(2)}%`;
};

/**
 * Formats a date as MMM YYYY
 */
export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

/**
 * Formats a date as YYYY-MM-DD
 */
export const formatDateISO = (dateString: string) => {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

/**
 * Returns a CSS class based on whether a value is positive or negative
 */
export const getValueColorClass = (value: number | null) => {
  if (value === null || value === undefined) return '';
  return value >= 0 ? 'text-green-500' : 'text-red-500';
};

/**
 * Format number with commas (1000 -> 1,000)
 */
export const formatNumber = (value: number) => {
  return new Intl.NumberFormat('en-US').format(value);
};
