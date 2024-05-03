import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as Sentry from '@sentry/node';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import * as cors from 'cors';
import { json } from 'express';
import { AppModule } from './app.module';
import { setupSwagger } from './common/utils/swagger';

async function bootstrap() {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.ENV,
        integrations: [new Sentry.Integrations.Http({ tracing: true })],
        tracesSampleRate: 1.0,
    });

    const app = await NestFactory.create(AppModule);

    setupSwagger(app);

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
        }),
    );
    app.use(
        json({
            verify: (req, _, buf) => {
                req['rawBody'] = buf.toString();
            },
        }),
    );
    app.use(json({ limit: '50mb' }));
    app.use(compression());
    app.use(cors());
    app.use(cookieParser());
    await app.listen(8080);
}
bootstrap();
