

export function getKycDocumentNumber(metamapKycVerification: any) {
    const documentFields = metamapKycVerification.documents[0].fields
    let documentNumber = Object.keys(documentFields).find(key => key === 'documentNumber') ? documentFields['documentNumber'].value : null;
    documentNumber = documentNumber.replace(/[-. ]/g, "");
    return documentNumber
}