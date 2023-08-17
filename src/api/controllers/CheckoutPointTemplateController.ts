import { Body, Get, HeaderParam, HttpCode, JsonController, Post, Put, QueryParams, Res, UseAfter, UseBefore } from 'routing-controllers';
import { checkinTemplate } from '../models/checkinTemplate';
import { checkinTemplateService } from '../services/checkinTemplateService';
import * as express from 'express';
import { ResponseSchema } from 'routing-controllers-openapi';
import { checkinHandlerRequest } from './requests/checkinHandlerRequest';
import { CheckpoinGetQueryRequest, UpdatePhysicianQueryRequest } from './requests/checkinStatusUpdateRequest';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { AuditLogMiddleware, HeaderValidationMiddleware } from 'thinkitive-util';

@JsonController()
@UseAfter(AuditLogMiddleware)
@UseBefore(HeaderValidationMiddleware)
export class CheckoutPointTemplateController {

  constructor(
    @Logger(__filename) private logger: LoggerInterface,
    private checkinTemplateService: checkinTemplateService
  ) { }

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

  @Get('/template')
  @HttpCode(200)
  public async getcheckinTemplate(
    @HeaderParam('x-partner-id', { required: true }) partnerId: string,
    @QueryParams() queryParams: CheckpoinGetQueryRequest,
    @Res() response: express.Response
  ): Promise<express.Response> {
    return response.status(200).json(await this.checkinTemplateService.getcheckinTemplate(partnerId, queryParams));
  }

  @Post('/template/trigger-checkin')
  @HttpCode(202)
  public async triggercheckin(
    @HeaderParam('x-partner-id', { required: true }) partnerId: string,
    @Body() request: checkinHandlerRequest,
    @Res() response: express.Response
  ): Promise<express.Response> {
    this.logger.info(`received request body: ${JSON.stringify(request)}`);
    return response.status(202).json(await this.checkinTemplateService.processcheckin(partnerId, request));
  }

  @Post('/validate')
  @HttpCode(200)
  public async validate(
    @HeaderParam('x-partner-id', { required: true }) partnerId: string,
    @Body() request: checkinHandlerRequest,
    @Res() response: express.Response
  ): Promise<express.Response> {
    return response.status(200).json(await this.checkinTemplateService.processcheckin(partnerId, request));
  }

  @Get('/groups')
  @HttpCode(200)
  public async getCombinationGroups(
    @HeaderParam('x-partner-id', { required: true }) partnerId: string,
    @QueryParams() queryParams: CheckpoinGetQueryRequest,
    @Res() response: express.Response
  ): Promise<express.Response> {
    return response.status(200).json(await this.checkinTemplateService.getCombinationGroups(partnerId, queryParams));
  }

  @Put('/update-physician-setting')
  @HttpCode(200)
  public async updatePhysicianSetting(
    @QueryParams() queryParams: UpdatePhysicianQueryRequest,
    @Res() response: express.Response
  ): Promise<express.Response> {
    return response.status(200).json(await this.checkinTemplateService.updatePhysiciansSetting(queryParams));
  }

}
