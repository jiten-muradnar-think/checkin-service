
import { Builder } from 'builder-pattern';
import { Logger } from '../../decorators/Logger';
import { LoggerInterface } from '../../lib/logger/LoggerInterface';
import {Service} from 'typedi';
import {checkinTemplateEntity} from '../entities/checkinTemplateEntity';
import {checkinTemplate} from '../models/checkinTemplate';

@Service()
export class checkinTemplateMapper {

    constructor(
        @Logger(__filename) private logger: LoggerInterface
    ) { }

    public toDTO(entity: checkinTemplateEntity): checkinTemplate {
        const template: any = Object.assign({} as checkinTemplate, entity);
        if (template.hasOwnProperty('id')) {
            delete template.id;
        }
        if (template.hasOwnProperty('partnerId')) {
            delete template.partnerId;
        }
        return template;
    }

    public checkinTemplateEntityMapper(checkinTemplate: checkinTemplate): checkinTemplateEntity {
        try {
            const checkinTemplateEntity = Builder(checkinTemplateEntity)
            .uuid(checkinTemplate.uuid)
            .name(checkinTemplate.name)
            .enable(checkinTemplate.enable)
            .apiType(checkinTemplate.apiType)
            .triggerType(checkinTemplate.triggerType)
            .validStatusCodes(checkinTemplate.validStatusCodes)
            .invalidStatusCodes(checkinTemplate.invalidStatusCodes)
            .appointmentType(checkinTemplate.appointmentType)
            .physicians(checkinTemplate.physicians)
            .locations(checkinTemplate.locations)
            .limit(checkinTemplate.limit)
            .registration(checkinTemplate.registration)
            .combinationLimitSetting(checkinTemplate.combinationLimitSetting)
            .inclusionSetting(checkinTemplate.inclusionSetting)
            .reminderTimeSetting(checkinTemplate.reminderTimeSetting)
            .smsTemplateSetting(checkinTemplate.smsTemplateSetting)
            .emailTemplateSetting(checkinTemplate.emailTemplateSetting)
            .phoneTemplateSetting(checkinTemplate.phoneTemplateSetting)
            .noResponseTemplateSetting(checkinTemplate.noResponseTemplateSetting)
            .triggerTypeSetting(checkinTemplate.triggerTypeSetting)
            .appointmentNotes(checkinTemplate.appointmentNotes)
            .build();
            return checkinTemplateEntity;
        } catch (error) {
            this.logger.error(`Failed to build checkinTemplateEntity ${(error as Error).message}`);
            // tslint:disable-next-line: no-null-keyword
            return null;
        }
    }
}
