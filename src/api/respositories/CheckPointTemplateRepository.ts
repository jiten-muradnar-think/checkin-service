
import {Service} from 'typedi';
import {checkinTemplateEntity} from '../entities/checkinTemplateEntity';
import {DeleteWriteOpResultObject, getMongoManager, ObjectLiteral, UpdateWriteOpResult} from 'typeorm';

@Service()
export class checkinTemplateRepository {
    public async saveTemplate(entity: checkinTemplateEntity): Promise<checkinTemplateEntity> {
        return getMongoManager().save(checkinTemplateEntity, entity);
    }
    public async getTemplate(options: ObjectLiteral): Promise<checkinTemplateEntity> {
        return getMongoManager().findOne(checkinTemplateEntity, options);
    }
    public async getTemplates(options: ObjectLiteral): Promise<checkinTemplateEntity[]> {
        return getMongoManager().find(checkinTemplateEntity, options);
    }
    public async deleteTemplate(options: ObjectLiteral): Promise<DeleteWriteOpResultObject> {
        return getMongoManager().deleteOne(checkinTemplateEntity, options);
    }
    public async updateTemplates(options: ObjectLiteral, update: ObjectLiteral): Promise<UpdateWriteOpResult> {
        return getMongoManager().updateMany(checkinTemplateEntity, options, update);
    }
}
