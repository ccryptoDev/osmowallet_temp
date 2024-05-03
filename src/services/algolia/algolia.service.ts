import { Injectable } from '@nestjs/common';
import algoliasearch, { SearchClient } from 'algoliasearch';
import { User } from 'src/entities/user.entity';

@Injectable()
export class AlgoliaService {
    private client: SearchClient;
    constructor() {
        this.client = algoliasearch(process.env.ALGOLIA_APP_ID ?? '', process.env.ALGOLIA_KEY ?? '');
    }

    async saveUser(user: User) {
        const index = this.client.initIndex('users');
        const userObject: Partial<User & { objectID: string; created_at_timestamp: number }> = {
            ...user,
            objectID: user.id,
            created_at_timestamp: new Date(user.createdAt).getTime(),
        };
        delete userObject.password;
        delete userObject.pin;
        delete userObject.profilePictureExpiry;
        delete userObject.profilePicturePath;
        const r = await index.saveObject(userObject);
        console.log(r);
    }
}
