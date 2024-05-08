/**
 * Formats a name by capitalizing the first letter of each word.
 * @param name - The name to be formatted.
 * @returns The formatted name.
 */
export function formatName(name: string) {
    return name
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
