import { Injectable } from '@nestjs/common';
import { Storage,Bucket, SaveOptions } from '@google-cloud/storage';

@Injectable()
export class GoogleCloudStorageService {
    private storage = new Storage({
        projectId: process.env.GCLOUD_PROJECT_ID,
        credentials: {
            client_email: process.env.GCLOUD_CLIENT_EMAIL,
            private_key: process.env.GCLOUD_PRIVATE_KEY.replace(/\\n/gm, "\n"),
        }
    });

    private bucketName = process.env.GCLOUD_STORAGE_BUCKET_NAME

    private getBucket(bucketName: string): Bucket {
        return this.storage.bucket(bucketName);
    }

    async saveFile(
        file: Express.Multer.File, 
        path: string, 
        bucketName: string = this.bucketName,
        isPublic: boolean = false
    ) {
        const bucket = this.getBucket(bucketName)
        const finalFile = bucket.file(path);
        const fileOptions: SaveOptions = {
            resumable: false,
            validation: false,
            contentType: file.mimetype,
            public: isPublic,
            metadata: {
                contentType: file.mimetype,
            },
        }
        await finalFile.save(file.buffer,fileOptions);
    }

    async getSignedUrl(fileName: string, expiry: number, bucketName: string = this.bucketName) : Promise<string> {
        const bucket = this.getBucket(bucketName)
        const file = bucket.file(fileName);
        const [url] = await file.getSignedUrl({
            action: 'read',
            expires: expiry, 
          });
        return url
    }

    getPublicUrl(bucketName: string, fileName: string) {
        return `https://${bucketName}.storage.googleapis.com/${fileName}`;
    }
    
}
