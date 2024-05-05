import { Injectable } from '@nestjs/common';
import { CloudTasksClient } from '@google-cloud/tasks';
import { ExternalTask } from './interfaces/externalTask.interface';
import * as Sentry from "@sentry/node";


@Injectable()
export class GoogleCloudTasksService {
    private clientTask: CloudTasksClient
    constructor(){
       this.clientTask = new CloudTasksClient({
        fallback: true,
        projectId: process.env.GCLOUD_PROJECT_ID,
        credentials: {
            client_email: process.env.GCLOUD_CLIENT_EMAIL,
            private_key: process.env.GCLOUD_PRIVATE_KEY.replace(/\\n/gm, "\n"), 
        }
       })
    }


    async createInternalTask(queue: string, body: any, url: string, retryCount = 0) {
        const maxRetries = 3;
        try {
            const queuePath = this.clientTask.queuePath(process.env.GCLOUD_PROJECT_ID,'us-central1',queue)
            const converted = Buffer.from(JSON.stringify(body)).toString('base64')
            await this.clientTask.createTask({
                parent: queuePath,
                task: {
                    httpRequest: {
                        url: url,
                        httpMethod: 'POST',
                        headers: {
                            Authorization: process.env.GCLOUD_FUNCTIONS_API_KEY,
                            'Content-Type': 'application/json'
                        },
                        body: converted
                    }
                }
            })
        } catch (error) {
            if (retryCount < maxRetries) {
                console.log(`Retry attempt ${retryCount + 1} for task creation...`);
                await this.createInternalTask(queue, body, url, retryCount + 1);
            } else {
                console.log('Max retries exceeded for task creation.');
                Sentry.captureException(error,{
                    extra: {
                        url,
                        queue,
                        body
                    }
                })
                throw error;
            }
        }
    }

    async createExternalTask(data: ExternalTask, retryCount = 0) {
        const maxRetries = 3;
        try {
            const queuePath = this.clientTask.queuePath(process.env.GCLOUD_PROJECT_ID,'us-central1',data.queue)
            let payload = data.body
            if (typeof data.body !== 'string') {
                payload = JSON.stringify(payload);
            }
            const converted = Buffer.from(payload).toString('base64')
            await this.clientTask.createTask({
                parent: queuePath,
                task: {
                    httpRequest: {
                        url: data.url,
                        httpMethod: 'POST',
                        headers: data.headers,
                        body: converted
                    },
                }
            });
        } catch (error) {
            if (retryCount < maxRetries) {
                console.log(`Retry attempt ${retryCount + 1} for external task creation...`);
                await this.createExternalTask(data, retryCount + 1);
            } else {
                console.log('Max retries exceeded for external task creation.');
                Sentry.captureException(error,{
                    extra: {
                        url: data.url,
                        queue: data.queue,
                        body: data.body
                    }
                })
                throw error;
            }
        }
    }
}
