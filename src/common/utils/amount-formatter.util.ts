/**
 * Formats the given amount as a string with two decimal places.
 *
 * @param amount - The amount to format.
 * @returns The formatted amount as a string.
 */
export function formatAmount(amount: number) {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
