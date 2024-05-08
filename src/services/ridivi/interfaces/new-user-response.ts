interface KycDocumentDetail {
    isDocumentSended: boolean | null;
    addedDate: string | null;
    fileName: string[] | null;
    isApproved: boolean | null;
    approvedDate: string | null;
    approvedByUserId: string | null;
    approvedByIP: string | null;
}

interface KycDocuments {
    myID: KycDocumentDetail;
    myHouse: KycDocumentDetail;
    myFunding: KycDocumentDetail;
    myFormalID: KycDocumentDetail;
    myTaxes: KycDocumentDetail;
}

interface RidiviAccount {
    name: string;
    cur: string;
    bal: number;
    iban: string;
}

export interface RidiviNewUserResponse {
    user: {
        _id: string;
        added: string;
        firstName: string;
        lastName: string;
        nationality: string;
        idType: string;
        gender: number;
        dateBirth: string;
        idNumber: string;
        idLocality: string;
        idExpDate: string;
        phone: string;
        email: string;
        regip: string;
        active: boolean;
        level: number;
        maxAccounts: number;
        kycDocuments: KycDocuments;
        client: string;
        forgotPass: string | null;
        forgotPassOn: string | null;
        fpIp: string | null;
        lastForgot: string | null;
        updatedContactByUserOn: string | null;
        lastestWebActivity: string | null;
        accounts: Array<RidiviAccount>;
    };
    error: boolean;
}
