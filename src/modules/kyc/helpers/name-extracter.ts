import { RawKyc } from '../interfaces/raw-kyc';

export interface SplittedName {
    firstName: string;
    lastName: string;
}

export function getNameSplitted(rawKyc: RawKyc): SplittedName {
    let firstname = rawKyc.fields.find((field) => field.name === 'First name')?.value;
    let lastName = rawKyc.fields.find((field) => field.name === 'Surname')?.value;
    const fullName = rawKyc.fields.find((field) => field.name === 'Full name')?.value;

    if (!firstname || !lastName) {
        const names = fullName?.split(' ') as string[];
        if (names?.length >= 2) {
            firstname = names[0];
            lastName = names.slice(1).join(' ');
        }
    }
    return {
        firstName: firstname ?? '',
        lastName: lastName ?? '',
    };
}
