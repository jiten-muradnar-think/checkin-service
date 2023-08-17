import { Application } from 'express';
import { MicroframeworkLoader, MicroframeworkSettings } from 'microframework-w3tec';
import { createExpressServer } from 'routing-controllers';
import { CompressionMiddleware } from '../api/middlewares/CompressionMiddleware';
import { AuditLogMiddleware, HeaderValidationMiddleware, ErrorHandlerMiddleware } from 'thinkitive-util';
import { SecurityHstsMiddleware } from '../api/middlewares/SecurityHstsMiddleware';
import { SecurityMiddleware } from '../api/middlewares/SecurityMiddleware';
import { SecurityNoCacheMiddleware } from '../api/middlewares/SecurityNoCacheMiddleware';
import { RequestContextHandlerMiddleware } from 'thinkitive-util/dist/middlewares/RequestContextHandlerMiddleware';

import { env } from '../env';

export const expressLoader: MicroframeworkLoader = (settings: MicroframeworkSettings | undefined) => {
    if (settings) {
        /**
         * We create a new express server instance.
         * We could have also use useExpressServer here to attach controllers to an existing express instance.
         */
        const expressApp: Application = createExpressServer({
            cors: true,
            classTransformer: true,
            routePrefix: env.app.routePrefix,
            defaultErrorHandler: false,
            /**
             * We can add options about how routing-controllers should configure itself.
             * Here we specify what controllers should be registered in our express server.
             */
            controllers: env.app.dirs.controllers,
            middlewares: [
                HeaderValidationMiddleware,
                RequestContextHandlerMiddleware,
                CompressionMiddleware,
                SecurityMiddleware,
                SecurityNoCacheMiddleware,
                SecurityHstsMiddleware,
                ErrorHandlerMiddleware,
                AuditLogMiddleware,
            ],
            interceptors: env.app.dirs.interceptors,

            /**
             * Authorization features
             */
            // authorizationChecker: authorizationChecker(connection),
            // currentUserChecker: currentUserChecker(connection),
        });

        // Run application to listen on given port
        if (!env.isTest) {
            const server = expressApp.listen(env.app.port);
            settings.setData('express_server', server);
        }

        // Here we can set the data for other loaders
        settings.setData('express_app', expressApp);
    }
};
