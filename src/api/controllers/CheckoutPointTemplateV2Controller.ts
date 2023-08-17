
import {
    Body, Delete, Get, HeaderParam, HttpCode, JsonController, Patch, Post, Put, QueryParam,
    QueryParams,
    Res,
    UseAfter,
    UseBefore
} from 'routing-controllers';
import { checkinTemplate, TriggerType } from '../models/checkinTemplate';
import { checkinTemplateService } from '../services/checkinTemplateService';
import * as express from 'express';
import { ResponseSchema } from 'routing-controllers-openapi';
import { CheckpoinGetQueryRequest, checkinStatusUpdateRequest } from './requests/checkinStatusUpdateRequest';
import { AuthenticationMiddleware } from 'security-util';
import { AuditLogMiddleware, HeaderValidationMiddleware } from 'thinkitive-util';

@JsonController('/ext')
@UseBefore(AuthenticationMiddleware)
@UseAfter(AuditLogMiddleware)
@UseBefore(HeaderValidationMiddleware)
export class CheckoutPointTemplateV2Controller {

    constructor(
        private checkinTemplateService: checkinTemplateService
    ) { }

    @Post('/template')
    @HttpCode(201)
    public async createcheckin(
        @HeaderParam('x-partner-id', { required: true }) partnerId: string,
        @Body() request: checkinTemplate, @Res() response: express.Response): Promise<express.Response> {
        return response.status(201).json(await this.checkinTemplateService.savecheckinTemplate(request, partnerId));
    }

    @Put('/template')
    @HttpCode(202)
    public async updatecheckin(
        @HeaderParam('x-partner-id', { required: true }) partnerId: string,
        @Body() request: checkinTemplate,
        @Res() response: express.Response): Promise<express.Response> {
        await this.checkinTemplateService.updatecheckinTemplate(request, partnerId);
        return response.status(202).send();
    }

    @Get('/templates')
    @ResponseSchema(checkinTemplate, {
        isArray: true,
    })
    @HttpCode(200)
    public async getTemplates(
        @HeaderParam('x-partner-id', { required: true }) partnerId: string,
        @QueryParams() queryParams: CheckpoinGetQueryRequest,
        @Res() response: express.Response
    ): Promise<express.Response> {
        const templates = await this.checkinTemplateService.getcheckinTemplates(partnerId, queryParams);
        return response.status(200).json(templates);
    }

    @Patch('/template/status')
    @HttpCode(202)
    public async updatecheckinStatus(
        @HeaderParam('x-partner-id', { required: true }) partnerId: string,
        @Body() request: checkinStatusUpdateRequest, @Res() response: express.Response): Promise<express.Response> {
        await this.checkinTemplateService.updatecheckinStatus(request, partnerId);
        return response.status(202).send();
    }

    @Get('/template/triggerType')
    @HttpCode(200)
    public async getTemplateTriggerType(@Res() response: express.Response): Promise<express.Response> {
        return response.status(200).json(Object.values(TriggerType).filter(value => isNaN(Number(value)) === true));
    }

    @Delete('/template')
    @HttpCode(202)
    public async deletecheckinTemplate(
        @HeaderParam('x-partner-id', { required: true }) partnerId: string,
        @QueryParam('uuid', { required: true }) uuid: string, @Res() response: express.Response): Promise<express.Response> {
        await this.checkinTemplateService.deletecheckinTemplate(partnerId, uuid);
        return response.status(202).send();
    }

    @Get('/template')
    @HttpCode(200)
    public async getcheckinTemplate(
        @HeaderParam('x-partner-id', { required: true }) partnerId: string,
        @QueryParams() queryParams: CheckpoinGetQueryRequest): Promise<checkinTemplate> {
        return this.checkinTemplateService.getcheckinTemplate(partnerId, queryParams);
    }

}
