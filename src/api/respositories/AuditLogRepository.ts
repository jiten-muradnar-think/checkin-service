import {Service} from 'typedi';
import {getMongoManager} from 'typeorm';
import { AuditLogEntity } from '../entities/AuditLogEntity';

@Service()
export class AuditLogRepository {
    public async save(entity: AuditLogEntity): Promise<AuditLogEntity> {
        return getMongoManager().save(AuditLogEntity, entity);
    }
}
