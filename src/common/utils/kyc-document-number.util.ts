/**
 * Retrieves the KYC document number from the given metamapKycVerification object.
 * @param metamapKycVerification - The metamapKycVerification object containing KYC verification data.
 * @returns The KYC document number, or null if not found.
 */
export function getKycDocumentNumber(metamapKycVerification: any) {
    const documentFields = metamapKycVerification.documents[0].fields;
    let documentNumber = Object.keys(documentFields).find((key) => key === 'documentNumber')
        ? documentFields['documentNumber'].value
        : null;
    documentNumber = documentNumber.replace(/[-. ]/g, '');
    return documentNumber;
}
