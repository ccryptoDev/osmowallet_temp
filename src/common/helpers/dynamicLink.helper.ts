import axios from 'axios';

export class DynamicLinkHelper {
    static async generateDynamicLink(userId: string, transactionId: string, isOsmo: boolean = false) {
        const link = `https://osmowallet.page.link/signUp?inviterTransactionId=${transactionId}&userId=${userId}&isOsmo=${isOsmo}`;
        const data = {
            dynamicLinkInfo: {
                domainUriPrefix: 'https://osmowallet.page.link',
                link: link,
                androidInfo: {
                    androidPackageName: 'com.osmo.smt',
                },
                iosInfo: {
                    iosBundleId: 'com.osmowallet.app',
                },
            },
        };
        const config = {
            headers: { accept: 'application/json', 'Content-Type': 'application/json' },
            url: 'v1/shortLinks?key=' + process.env.GCLOUD_WEB_API_KEY,
            data: data,
            method: 'post',
            baseURL: 'https://firebasedynamiclinks.googleapis.com',
        };
        const response = await axios(config);
        const shortLink = response.data.shortLink;
        return shortLink;
    }
}
