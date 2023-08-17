import { Container, Service } from 'typedi';
import express from 'express';
import { HttpError } from 'routing-controllers';
import { AuditLogEntity } from '../entities/AuditLogEntity';
import { AuditLogRepository } from '../respositories/AuditLogRepository';
import { Builder } from 'builder-pattern';
import moment from 'moment';
import {Moment} from 'moment';

@Service()
export class AuditLogger {
    constructor(
        private auditLogRepository: AuditLogRepository
    ) { }

    public async log(req: express.Request, res: express.Response, error?: HttpError): Promise<any> {
        const startTime: Moment = moment(req.get('start-time'));
        const responseTime  = moment().utc().diff(startTime, 'millisecond');

        const auditLog: AuditLogEntity = Builder(AuditLogEntity)
            .partnerId(Number(req.headers['x-partner-id']))
            .requestMethod(req.method)
            .requestEndpoint(req.path)
            .requestUniqueId(String(req.headers['x-unique-id']))
            .totalResponseTime(responseTime)
            .responseStatusCode(error ? error.httpCode : res.statusCode)
            .requestBody(req.body)
            .errorMessage(error ? error.message : '')
            .createdAt(moment().utc().toDate())
            .updatedAt(moment().utc().toDate())
            .build();
        return this.auditLogRepository.save(auditLog);
    }
}

export const auditLogger = Container.get(AuditLogger);
