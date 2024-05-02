/**
 * Formats a date to Spanish (Spain) locale with options.
 * @returns {string} Formatted date string.
 */
export function formatDateToSpanish(date: Date): string {
    return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}
