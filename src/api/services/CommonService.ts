import { Service } from 'typedi';
import { Logger } from '../../decorators/Logger';
import { LoggerInterface } from '../../lib/logger/LoggerInterface';
import { checkinHandlerRequest } from '../controllers/requests/checkinHandlerRequest';
import { checkinTemplateEntity } from '../entities/checkinTemplateEntity';
import moment from 'moment-timezone';
import { checkinTemplate, ReminderType, TimeUnit, TriggerType } from '../models/checkinTemplate';
@Service()
export class CommonService {
    constructor(@Logger(__filename) private logger: LoggerInterface) { }

    public async validatecheckin(request: checkinHandlerRequest, checkinTemplate: checkinTemplateEntity): Promise<boolean> {
        let result = false;
        if (!request.status || request.status === '') {
            request.status = 'BLANK';
        }
        result = checkinTemplate.smsTemplateSetting.enabled
            &&
            (checkinTemplate.validStatusCodes ?
                (checkinTemplate.validStatusCodes.length === 0 ? true :
                    (checkinTemplate.validStatusCodes.indexOf(request.status) !== -1 ?
                        (checkinTemplate.inclusionSetting && typeof checkinTemplate.inclusionSetting.validStatusCodes === 'boolean' ?
                            checkinTemplate.inclusionSetting.validStatusCodes : true) :
                        (checkinTemplate.inclusionSetting && typeof checkinTemplate.inclusionSetting.validStatusCodes === 'boolean' ?
                            !checkinTemplate.inclusionSetting.validStatusCodes : false))) : true)
            &&
            (checkinTemplate.physicians ?
                (checkinTemplate.physicians.length === 0 ? true :
                    (checkinTemplate.physicians.indexOf(Number(request.physicianId)) !== -1 ?
                        (checkinTemplate.inclusionSetting && typeof checkinTemplate.inclusionSetting.physicians === 'boolean' ?
                            checkinTemplate.inclusionSetting.physicians : true) :
                        (checkinTemplate.inclusionSetting && typeof checkinTemplate.inclusionSetting.physicians === 'boolean' ?
                            !checkinTemplate.inclusionSetting.physicians : false))) : true)
            &&
            (checkinTemplate.appointmentType ? (checkinTemplate.appointmentType.length === 0 ? true :
                ((checkinTemplate.appointmentType.toLocaleString().toLowerCase().split(',')
                    .indexOf(request.appointmentType !== null ? request.appointmentType.toLowerCase() : undefined) !== -1) ?
                    (checkinTemplate.inclusionSetting && typeof checkinTemplate.inclusionSetting.appointmentType === 'boolean' ?
                        checkinTemplate.inclusionSetting.appointmentType : true) :
                    (checkinTemplate.inclusionSetting && typeof checkinTemplate.inclusionSetting.appointmentType === 'boolean' ?
                        !checkinTemplate.inclusionSetting.appointmentType : false))) : true)
            &&
            (checkinTemplate.locations ?
                (checkinTemplate.locations.length === 0 ? true :
                    (checkinTemplate.locations.indexOf(Number(request.locationId)) !== -1 ?
                        (checkinTemplate.inclusionSetting && typeof checkinTemplate.inclusionSetting.locations === 'boolean' ?
                            checkinTemplate.inclusionSetting.locations : true) :
                        (checkinTemplate.inclusionSetting && typeof checkinTemplate.inclusionSetting.locations === 'boolean' ?
                            !checkinTemplate.inclusionSetting.locations : false))) : true)
            &&
            (request.appointmentStatus !== 'Cancelled')
            &&
            ((typeof request.registration === 'boolean' && typeof checkinTemplate.registration === 'boolean') ?
                (request.registration === checkinTemplate.registration ? true : false) : true);

        if (checkinTemplate.triggerType === TriggerType.TIME_BASED) {
            const type: ReminderType = checkinTemplate.reminderTimeSetting.type;
            const timeUnit = checkinTemplate.reminderTimeSetting.timeUnit;
            const timeValue = checkinTemplate.reminderTimeSetting.timeValue;
            this.logger.info(`${ checkinTemplate.uuid } | Got book checkin setting | ${checkinTemplate.reminderTimeSetting.timeDifference}`);
            const timeDifference = checkinTemplate.reminderTimeSetting.timeDifference;
            if (type === ReminderType.BOOK && timeDifference) {
                let bookTimeToTrigger: number;
                if (timeUnit === TimeUnit.DAY) {
                    bookTimeToTrigger = moment.duration(timeValue, 'days').asMilliseconds();
                } else if (timeUnit === TimeUnit.HOUR) {
                    bookTimeToTrigger = moment.duration(timeValue, 'hours').asMilliseconds();
                } else if (timeUnit === TimeUnit.MINUTE) {
                    bookTimeToTrigger = moment.duration(timeValue, 'minutes').asMilliseconds();
                }
                this.logger.info(`${ checkinTemplate.uuid } | Appointment time and currentTime |
                                    ${moment(request.appointmentStartTime)} ${moment(request.currentTime)}`);
                const difference = moment(request.appointmentStartTime).diff(moment(request.currentTime));
                this.logger.info(`${ checkinTemplate.uuid } | Book time difference between | ${bookTimeToTrigger} | ${difference}`);
                if (!(difference >= bookTimeToTrigger && timeDifference === 'M') && !(difference <= bookTimeToTrigger && timeDifference === 'L')) {
                    result = false;
                }
            }
        }

        if (checkinTemplate.triggerType === TriggerType.API_BASED) {
            const apiType = checkinTemplate.apiType;
            const apiBasedSettings = checkinTemplate.triggerTypeSetting &&
                                    checkinTemplate.triggerTypeSetting.apiBased &&
                                    checkinTemplate.triggerTypeSetting.apiBased.apiType;

            if (
                ((apiType && apiBasedSettings) && request.apiType !== apiBasedSettings) ||
                ((!apiType && apiBasedSettings) && request.apiType !== apiBasedSettings ) ||
                ( apiType && !apiBasedSettings && request.apiType !== apiType )
            ) {
                result = false;
            }
        }
        this.logger.info(`${ checkinTemplate.uuid } | condition result: ${result}`);
        return result;
    }
    public async isSettingsUpdated(oldcheckin: checkinTemplate, newcheckin: checkinTemplate): Promise<boolean> {
        this.logger.info(`compare checkins -- ${JSON.stringify(oldcheckin)} ${JSON.stringify(newcheckin)}`);
        let event = false;
        const isEqual = JSON.stringify(newcheckin) === JSON.stringify(oldcheckin);
        this.logger.info(`compare result -- ${JSON.stringify(isEqual)}`);
        if (
            (newcheckin.reminderTimeSetting.type === ReminderType.PRE ||
                newcheckin.reminderTimeSetting.type === ReminderType.POST) &&
            !isEqual &&
            newcheckin.triggerType === TriggerType.TIME_BASED &&
            newcheckin.enable
        ) {
            const eventKeys = [
                'enable',
                'triggerType',
                'validStatusCodes',
                'appointmentType',
                'physicians',
                'appointmentNotes',
                'reminderTimeSetting',
                'noResponseTemplateSetting',
                'inclusionSetting',
                'limit',
                'combinationLimitSetting',
                'triggerTypeSetting'
            ];
            for (const key of eventKeys) {
                const keyChecked = JSON.stringify(newcheckin[key]) !== JSON.stringify(oldcheckin[key]);
                if (keyChecked) {
                    this.logger.info(`Key updated ${JSON.stringify(newcheckin[key])} -- ${JSON.stringify(oldcheckin[key])}`);
                    event = true;
                    break;
                }
            }
            return event;
        }
        return event;
    }

}
