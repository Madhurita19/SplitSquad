/**
 * Format a number dynamically based on the currency code.
 * @param {number} amount - The amount to format
 * @param {boolean} [showDecimal=false] - Whether to show 2 decimal places
 * @param {string} [currencyCode='INR'] - The ISO 4217 currency code
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, showDecimal = false, currencyCode = 'INR') => {
    const absAmount = Math.abs(amount);
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: showDecimal ? 2 : 0,
        maximumFractionDigits: showDecimal ? 2 : 0,
    }).format(absAmount);
};

/**
 * Format with sign prefix: +$1,950 or -€500
 */
export const formatSignedCurrency = (amount, showDecimal = false, currencyCode = 'INR') => {
    if (amount === 0) return formatCurrency(0, showDecimal, currencyCode);
    const sign = amount > 0 ? '+' : '-';
    // Remove the negative sign if Intl adds it natively, but since we format Math.abs, we handle sign manually
    const formatted = formatCurrency(Math.abs(amount), showDecimal, currencyCode);
    return `${sign}${formatted}`;
};
