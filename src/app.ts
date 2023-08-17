import 'reflect-metadata';

import { bootstrapMicroframework } from 'microframework-w3tec';

import { banner } from './lib/banner';
import { Logger } from './lib/logger';
import { expressLoader } from './loaders/expressLoader';
import { iocLoader } from './loaders/iocLoader';
import { monitorLoader } from './loaders/monitorLoader';
import { swaggerLoader } from './loaders/swaggerLoader';
import { typeormLoader } from './loaders/typeormLoader';
import { winstonLoader } from './loaders/winstonLoader';
import { serviceConnectionLoader } from './loaders/serviceConnectionLoader';
import { sessionManagerLoader } from 'thinkitive-util';

/**
 * checkin service
 * ---------------------------------------
 */
const log = new Logger(__filename);

bootstrapMicroframework({
    /**
     * Loader is a place where you can configure all your modules during microframework
     * bootstrap process. All loaders are executed one by one in a sequential order.
     */
    loaders: [
        winstonLoader,
        iocLoader,
        typeormLoader,
        expressLoader,
        swaggerLoader,
        monitorLoader,
        serviceConnectionLoader,
        sessionManagerLoader,
    ],
})
    .then(() => banner(log))
    .catch(error => log.error('Application is crashed: ' + error));
