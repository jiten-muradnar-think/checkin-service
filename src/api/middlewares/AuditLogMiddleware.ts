import {ExpressMiddlewareInterface, Middleware} from 'routing-controllers';
import {Logger} from '../../lib/logger';
import express from 'express';
import {env} from '../../env';
import {auditLogger} from '../services/AuditLogger';

@Middleware({ type: 'after' })
export class AuditLogMiddleware implements ExpressMiddlewareInterface {

    private log = new Logger(__dirname);

    public use(req: express.Request, res: express.Response, next: express.NextFunction): void {
        if  (!req.path.includes(env.swagger.route) && this.isValidMethod(req.method)) {
            this.log.info(`Starting audit logging  - ${req.path}`);
            auditLogger.log(req, res).then().catch();
        }

        next();
    }

    private isValidMethod(method: string): boolean {
        if ( env.log.auditableMethods.split(',').includes( method.toLowerCase() )) {
            return true;
        }
        return false;
    }

}
