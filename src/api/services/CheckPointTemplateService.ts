import { Container, Service } from 'typedi';
import { checkinTemplate, TriggerType } from '../models/checkinTemplate';
import { checkinTemplateRepository } from '../respositories/checkinTemplateRepository';
import { checkinTemplateEntity } from '../entities/checkinTemplateEntity';
import { map } from 'underscore';
import { checkinTemplateMapper } from '../mapper/checkinTemplateMapper';
import { HttpError } from 'routing-controllers';
import { checkinHandlerRequest } from '../controllers/requests/checkinHandlerRequest';
import { CheckpoinGetQueryRequest, checkinStatusUpdateRequest, UpdatePhysicianQueryRequest } from '../controllers/requests/checkinStatusUpdateRequest';
import uuid from 'uuid/v4';
import { checkinTemplateCreationResponse } from '../controllers/responses/checkinTemplateCreationResponse';
import { Builder } from 'builder-pattern';
import { Logger } from '../../decorators/Logger';
import { LoggerInterface } from '../../lib/logger/LoggerInterface';
import { CommonService } from './CommonService';
import { Job } from '../models/JobDetails';
import { JobScheduleServiceClient } from './JobScheduleService';
import { NotificationProcessService } from './NotificationProcessEvent';
import { WebAppIntegrationServiceClient } from './WebAppIntegrationServiceClient';
import { PartnerServiceClient } from './PartnerServiceClient';
import { ProviderServiceClient } from './ProviderServiceClient';
import { WebPhysicianDetail } from '../models/WebAppModels';
import { PartnerDetails } from '../models/PartnerDetailModels';
import { ProviderDetails } from '../models/ProviderDetailsModel';

@Service()
export class checkinTemplateService {

    constructor(
        @Logger(__filename) private logger: LoggerInterface,
        private commonService: CommonService,
        private notificationProcessService: NotificationProcessService,
        private checkinTemplateMapper: checkinTemplateMapper,
        private checkinTemplateRepo: checkinTemplateRepository,
        private jobScheduleServiceClient: JobScheduleServiceClient,
        private webAppIntegrationClient: WebAppIntegrationServiceClient,
        private partnerServiceClient: PartnerServiceClient,
        private providerServiceClient: ProviderServiceClient
    ) { }

    public async savecheckinTemplate(
        checkinTemplate: checkinTemplate,
        partnerId: string
    ): Promise<checkinTemplateCreationResponse> {
        this.logger.info(`Received checkin setting to save ${JSON.stringify(checkinTemplate)}`);
        const checkinTemplateEntity: checkinTemplateEntity = this.checkinTemplateMapper.checkinTemplateEntityMapper(checkinTemplate);
        checkinTemplateEntity.partnerId = partnerId.toString();
        const existingTemplate = await this.checkinTemplateRepo.getTemplate({
            name: checkinTemplate.name,
            partnerId: checkinTemplateEntity.partnerId,
        });
        checkinTemplateEntity.uuid = uuid();
        if (existingTemplate) {
            throw new HttpError(400, `checkin with name ${checkinTemplate.name} already exists`);
        }
        this.logger.info(`Saving checkin setting ${JSON.stringify(checkinTemplateEntity)}`);
        await this.checkinTemplateRepo.saveTemplate(checkinTemplateEntity);
        if (checkinTemplateEntity.reminderTimeSetting.type === 'PRE' || checkinTemplateEntity.reminderTimeSetting.type === 'POST'
            && checkinTemplateEntity.triggerType === 'TIME_BASED' && checkinTemplateEntity.enable) {
            this.jobScheduleServiceClient.scheduleJobs(Number(partnerId), checkinTemplateEntity.uuid);
        }
        return Builder(checkinTemplateCreationResponse).status('SUCCESS').uuid(checkinTemplateEntity.uuid).build();
    }

    public async updatecheckinTemplate(checkinTemplate: checkinTemplate, partnerId: string): Promise<void> {
        try {
        this.logger.info(`Updating checkin template ${checkinTemplate.uuid} for partner ${partnerId}`);
        this.logger.info(`Received checkin setting to update ${JSON.stringify(checkinTemplate)}`);
        const checkinTemplateEntity: checkinTemplateEntity = this.checkinTemplateMapper.checkinTemplateEntityMapper(checkinTemplate);
        checkinTemplateEntity.partnerId = partnerId.toString();
        const existingTemplate = await this.checkinTemplateRepo.getTemplate({
            uuid: checkinTemplate.uuid,
            partnerId: checkinTemplateEntity.partnerId,
        });

        if (!existingTemplate) {
            throw new HttpError(400, `checkin with name ${checkinTemplate.name} is not exists`);
        }
        this.logger.info(`Existing checkin template ${JSON.stringify(existingTemplate)}`);
        checkinTemplateEntity.id = existingTemplate.id;
        checkinTemplateEntity.uuid = existingTemplate.uuid;

            this.logger.info(`Combination Limit | ${JSON.stringify(checkinTemplate)}`);

            const combinationLimitStatus = await this.combinationLimitCheck(checkinTemplate);
            this.logger.info(`Combination Limit Status | ${JSON.stringify(combinationLimitStatus)}`);
            if (combinationLimitStatus) {
                checkinTemplateEntity.limit = false;
                this.logger.info(`Combined checkins are | ${JSON.stringify(checkinTemplate.combinationLimitSetting)}`);
                const options = { uuid: { $in: [...checkinTemplate.combinationLimitSetting.combinedcheckins] } };
                const updateQuery = {
                    $set: {
                        'limit': false,
                        'combinationLimitSetting.combinationLimit': checkinTemplate.combinationLimitSetting.combinationLimit,
                        'combinationLimitSetting.combinationGroupId': checkinTemplate.combinationLimitSetting.combinationGroupId,
                        'combinationLimitSetting.combinationGroupName': checkinTemplate.combinationLimitSetting.combinationGroupName,
                    }
                };
                this.logger.info(`Query Options | ${JSON.stringify(options)} | ${JSON.stringify(updateQuery)}`);
                await this.checkinTemplateRepo.updateTemplates(options, updateQuery);
                delete checkinTemplate.combinationLimitSetting.combinedcheckins;
            }
        this.logger.info(`Updating checkin setting ${JSON.stringify(checkinTemplateEntity)}`);
            await this.checkinTemplateRepo.saveTemplate(checkinTemplateEntity);
            const createdcheckin = await this.checkinTemplateRepo.getTemplate({ uuid: checkinTemplateEntity.uuid });
            const check = await this.commonService.isSettingsUpdated(this.checkinTemplateMapper.toDTO(existingTemplate),
                this.checkinTemplateMapper.toDTO(createdcheckin));
            this.logger.info(`event trigger check - ${check}`);
            if (check) {
                this.jobScheduleServiceClient.scheduleJobs(Number(partnerId), checkinTemplateEntity.uuid);
                this.logger.info(`event send`);
            }
        } catch (error) {
            this.logger.warn(`Error while Updating template | ${(error as Error).message}`);
        }
    }

    public async combinationLimitCheck(checkinTemplate: checkinTemplate): Promise<boolean> {
        return (
            checkinTemplate.combinationLimitSetting &&
            checkinTemplate.combinationLimitSetting.combinationGroupId &&
            checkinTemplate.combinationLimitSetting.combinationGroupId !== 'null' &&
            checkinTemplate.combinationLimitSetting.combinedcheckins &&
            checkinTemplate.combinationLimitSetting.combinedcheckins.length > 0
        );
    }

    public async getcheckinTemplates(pid: string, queryParams: CheckpoinGetQueryRequest): Promise<checkinTemplate[]> {
        const checkinTemplates: checkinTemplateEntity[] = await this.checkinTemplateRepo.getTemplates({
            partnerId: pid.toString(),
            ...queryParams,
        });
        return map(checkinTemplates, templateEntity => {
            return this.checkinTemplateMapper.toDTO(templateEntity);
        });
    }

    public async updatecheckinStatus(request: checkinStatusUpdateRequest, partnerId: string): Promise<void> {
        this.logger.info(`got request to update checkin status for partner id ${partnerId} ${JSON.stringify(request)}`);
        const checkinTemplate: checkinTemplateEntity = await this.checkinTemplateRepo.getTemplate({
            name: request.templateName,
            partnerId: partnerId.toString(),
            triggerType: request.triggerType,
        });
        if (!checkinTemplate) {
            throw new HttpError(400, `No template found with name ${request.templateName} `);
        }
        checkinTemplate.enable = !request.isActive ? false : request.isActive;
        await this.checkinTemplateRepo.saveTemplate(checkinTemplate);
    }

    public async deletecheckinTemplate(partnerId: string, id: string): Promise<any> {
        try {
            const checkinTemplate: checkinTemplateEntity = await this.checkinTemplateRepo.getTemplate({
                uuid: id,
                partnerId: partnerId.toString(),
            });
            if (!checkinTemplate) {
                throw new Error(`No template found with uuid ${id} `);
            }
            const deleteTemplate = this.checkinTemplateRepo.deleteTemplate({
                partnerId: partnerId.toString(),
                uuid: id,
            });
            this.jobScheduleServiceClient.deleteScheduledJobs(Number(partnerId), checkinTemplate.uuid);
            return deleteTemplate;
        } catch (ex) {
            throw new HttpError(400, (ex as Error).message);
        }
    }

    public async getcheckinTemplate(partnerId: string, queryParams: CheckpoinGetQueryRequest): Promise<checkinTemplate> {
        const template: checkinTemplateEntity = await this.checkinTemplateRepo.getTemplate({
            partnerId: partnerId.toString(), ...queryParams,
        });
        if (!template) {
            throw new HttpError(400, `No checkin found`);
        }
        return this.checkinTemplateMapper.toDTO(template);
    }

    public async processcheckin(pid: string, request: checkinHandlerRequest): Promise<void> {
        this.logger.info(`${pid}| ${request.jobId} | Request Data | ${JSON.stringify(request)}`);
        this.logger.info(`${pid}| ${request.jobId} | ${request.uuid} | Got the request to process checkin message request`);

        let searchOptions: any;
        searchOptions = {
            partnerId: pid.toString(),
            triggerType: request.triggerType,
            enable: true,
        };
        if (request.uuid) {
            searchOptions[`uuid`] = request.uuid;
        }

        this.logger.info(`${pid}| ${request.jobId} | ${request.uuid} | ${request.appointmentEvent} | Got the request to process checkin message request`);
        switch (request.triggerType) {
            case TriggerType.TIME_BASED:
                if (['appointment_created', 'appointment_updated', 'appointment_deleted'].includes(request.appointmentEvent)) {
                    searchOptions = {
                        $and: [
                            { ...searchOptions },
                            {
                                $or: [
                                    { 'triggerTypeSetting.timeBased.appointmentEvent': { $size: 0 } },
                                    { 'triggerTypeSetting.timeBased.appointmentEvent': '' },
                                    // tslint:disable-next-line:no-null-keyword
                                    { 'triggerTypeSetting.timeBased.appointmentEvent': null },
                                    { 'triggerTypeSetting.timeBased.appointmentEvent': request.appointmentEvent.toUpperCase() },
                                ]
                            },
                        ]
                    };
                }
                break;
            case TriggerType.DOCUMENT_BASED:
                searchOptions['triggerTypeSetting'] = { documentBased: { documentType: request.documentType } };
                break;
            case TriggerType.FLAG_BASED:
                searchOptions['triggerTypeSetting'] = { flagBased: { flagType: request.flagType } };
                break;
            case TriggerType.REFERRAL_BASED:
                searchOptions['triggerTypeSetting'] = { referralBased: { referralType: request.referralType, referralStatus: request.referralStatus } };
                break;
            default:
                break;
        }
        const job: Job = new Job();
        job.jobStatus = 'checkin_REJECTED';
        this.logger.info(`${pid} | ${request.jobId} | ${request.uuid} | Search option for checkin | ${JSON.stringify(searchOptions)}`);
        this.logger.info(`${pid} | ${request.jobId} | ${request.uuid} | going to find checkin template for partner ${pid}, with trigger type
        | ${request.triggerType}`);
        const checkinTemplates: checkinTemplateEntity[] = await this.checkinTemplateRepo.getTemplates(searchOptions);
        this.logger.info(`${pid} | ${request.jobId} | ${request.uuid} | checkin template | ${checkinTemplates}`);
        if (!checkinTemplates || checkinTemplates.length === 0) {
            if (request.jobId && request.uuid) {
                await this.jobScheduleServiceClient.updateJobScheduleDetails(request.jobId, job);
            }
            this.logger.error(`Not found checkin template for partner id  ${pid} and for trigger type | ${request.triggerType.toString()}`);
            throw new HttpError(
                400,
                `Not found checkin template for partner id  ${pid} and for trigger type | ${request.triggerType.toString()}`
            );
        }
        const processToExecute = [];
        this.logger.info(`${pid} | ${request.jobId} | checkin Request | ${JSON.stringify(request)}`);
        checkinTemplates.forEach(async checkinTemplate => {
            this.logger.info(`${pid} | ${request.jobId} | ${checkinTemplate.uuid} | checkin template | ${JSON.stringify(checkinTemplate)}`);
            const validate: boolean = await this.commonService.validatecheckin(request, checkinTemplate);
            this.logger.debug(`${pid} | ${request.jobId} | ${checkinTemplate.uuid} | Validate template | ${validate}`);
            if ((validate && checkinTemplate.enable) || request.parentJobId) {
                processToExecute.push(
                    this.notificationProcessService.processNotificationEvent({
                        partnerId: pid, appointmentId: request.appointmentId, noResponseTemplateSetting: request.noResponseTemplateSetting,
                        smsTemplateId: checkinTemplate.smsTemplateSetting.enabled ? checkinTemplate.smsTemplateSetting.templateId : undefined,
                        emailTemplateId: checkinTemplate.emailTemplateSetting.enabled ? checkinTemplate.emailTemplateSetting.templateId : undefined,
                        patientId: request.patientId, jobId: request.jobId, parentJobId: request.parentJobId, patientPhone: request.patientPhone,
                        executionTime: request.executionTime,
                    }));
                job.jobStatus = 'checkin_PROCESSED';
                this.logger.info(`${pid} | ${request.jobId} | ${checkinTemplate.uuid} | processed SMScheckin with filter checked`);
            }
            if (request.jobId && request.uuid) {
                await this.jobScheduleServiceClient.updateJobScheduleDetails(request.jobId, job);
            }
        });
        await Promise.all(processToExecute);
    }

    public async getCombinationGroups(partnerId: string, queryParams: CheckpoinGetQueryRequest): Promise<string[]> {
        this.logger.info(`Options ${JSON.stringify(queryParams)}`);
        const template: checkinTemplateEntity[] = await this.checkinTemplateRepo.getTemplates({
            'partnerId': partnerId.toString(),
            'combinationLimitSetting.combinationGroupId': queryParams['combination-group-id'],
        });
        this.logger.info(`Group templates ${JSON.stringify(template)}`);
        const result = template.map(obj => obj.uuid);
        return result;
    }

    public async updatePhysiciansSetting(queryParams: UpdatePhysicianQueryRequest): Promise<string[]> {
        try {
            const query = { ...queryParams };
            this.logger.info(`UpdatePhysicians | Query to get the checkins to update physicians | ${JSON.stringify(query)}`);

            const checkinTemplates: checkinTemplateEntity[] = await this.checkinTemplateRepo.getTemplates(query);
            this.logger.info(`UpdatePhysicians | checkins | ${JSON.stringify(checkinTemplates)}`);

            // get unique physicians from all the filtered checkins along with partner id
            const physicians = [];
            checkinTemplates.map(template => {
                if (template.physicians && template.physicians.length) {
                    template.physicians.map(physicianId => {
                        if (
                            physicianId &&
                            !physicians.find(
                                (item) => item.physicianId === physicianId && Number(item.partnerId) === Number(template.partnerId)
                            )
                        ) {
                            physicians.push({
                                physicianId,
                                partnerId: Number(template.partnerId),
                            });
                        }
                    });
                }
            });

            this.logger.info(`UpdatePhysicians | physicians | ${JSON.stringify(physicians)}`);
            if (!physicians.length) {
                return [];
            }

            // Array to map webPhysicianId and MxProviderId
            const physicianReplacer = [];
            await Promise.all(physicians.map(async (physicianDetails) => {
                this.logger.info(`UpdatePhysicians | partnerId | ${physicianDetails.partnerId} | webPhysicianId | ${physicianDetails.physicianId}`);
                try {
                    const webDetails: WebPhysicianDetail = await this.webAppIntegrationClient.getPhysician(
                        physicianDetails.partnerId, physicianDetails.physicianId);
                    const partnerDetails: PartnerDetails = await this.partnerServiceClient.getPartnerById(
                        physicianDetails.partnerId);
                    const providerDetails: ProviderDetails = await this.providerServiceClient.getProviderDetail(
                        physicianDetails.partnerId, webDetails.emr_provider_id, partnerDetails.emrPathWay);

                    this.logger.info(`UpdatePhysicians | webPhysicianId | ${physicianDetails.physicianId} | providerId | ${providerDetails.id}`);
                    physicianReplacer.push({
                        webPhysicianId: physicianDetails.physicianId,
                        mxProviderId: providerDetails.id,
                    });
                } catch (error) {
                    this.logger.info(`UpdatePhysicians | failed to get provider details |
                        physician id | ${physicianDetails.physicianId} | ${(error as Error).message}`);
                }
            }));

            // update physicians in checkin template
            const result: string[] = [];
            await Promise.all(checkinTemplates.map(async (template) => {
                if (template.physicians && template.physicians.length) {
                    try {
                        const currentPhysicians = template.physicians;
                        const providers = [];

                        this.logger.info(`UpdatePhysicians | currentPhysicians | ${JSON.stringify(currentPhysicians)}`);
                        currentPhysicians.map((physicianId) => {
                            if (physicianId) {
                                providers.push(physicianReplacer.find(obj => Number(obj.webPhysicianId) === Number(physicianId)).mxProviderId);
                            }
                        });

                        this.logger.info(`UpdatePhysicians | updated providers | ${JSON.stringify(providers)}`);
                        template.physicians = providers;
                        await this.checkinTemplateRepo.saveTemplate(template);
                        result.push(template.uuid);
                    } catch (error) {
                        this.logger.info(`UpdatePhysicians | Failed to update checkin | ${(error as Error).message}`);
                    }
                }
            }));
            return result;
        } catch (error) {
            throw new HttpError(400, `Failed to update physicians ${(error as Error).message}`);
        }
    }
}

export const processcheckinRequest = data => {
    try {
        const checkinTemplateService = Container.get(checkinTemplateService);
        const requestData = JSON.parse(data) as any;
        checkinTemplateService
            .processcheckin(requestData.pid as string, requestData.details as checkinHandlerRequest)
            .catch(ex => console.error(`Exception while processing ${ex.message} `));
    } catch (ex) {
        console.error(`Exception while processing checkin request ${(ex as Error).message}`);
    }
};
