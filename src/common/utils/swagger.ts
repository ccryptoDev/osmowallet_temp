import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as basicAuth from 'express-basic-auth';

export const setupSwagger = (app: INestApplication) => {
    const SWAGGER_PATH = '/docs';
    const swaggerPassword = app.get(ConfigService).getOrThrow<string>('SWAGGER_PASSWORD');

    app.use(
        [SWAGGER_PATH, `${SWAGGER_PATH}-json`],
        basicAuth({
            challenge: true,
            users: {
                admin: swaggerPassword,
            },
        }),
    );

    const config = new DocumentBuilder()
        .setTitle('Osmo Wallet Documentation')
        .setDescription('The Osmo Wallet API description')
        .setVersion('1.0')
        .addTag('Osmo Wallet')
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(SWAGGER_PATH, app, document);
};
