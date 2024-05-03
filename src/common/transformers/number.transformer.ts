interface ToNumberOptions {
    default: number;
    min: number;
    max: number;
}

export function toNumber(value: string, opts: ToNumberOptions = { default: 0, min: 0, max: 0 }): number {
    let newValue: number = Number.parseInt(value || String(opts.default), 10);
    if (newValue !== 0) {
        if (newValue < 0) {
            newValue = opts.min;
        }
        if (Number.isNaN(newValue)) {
            newValue = opts.default;
        }

        if (opts.min) {
            if (newValue < opts.min) {
                newValue = opts.min;
            }

            if (newValue > opts.max) {
                newValue = opts.max;
            }
        }
    }

    return newValue;
}
