
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export enum TriggerType {
    API_BASED = 'API_BASED',
    TIME_BASED = 'TIME_BASED',
    FLAG_BASED = 'FLAG_BASED',
    REFERRAL_BASED = 'REFERRAL_BASED',
    DOCUMENT_BASED = 'DOCUMENT_BASED',
}

export enum ReferralStatus {
    INCOMPLETE = 'INCOMPLETE',
    RECEIVED = 'RECEIVED',
    IN_BOOKING = 'IN_BOOKING',
    AUTH_REVIEW_1 = 'AUTH_REVIEW_1',
    AUTH_REVIEW_2 = 'AUTH_REVIEW_2',
    REFERRAL_BOOKED = 'REFERRAL_BOOKED',
    APPOINTMENT_COMPLETED = 'APPOINTMENT_COMPLETED',
    REPORT_SENT = 'REPORT_SENT',
    IN_BILLING = 'IN_BILLING',
}

export enum ReminderType {
    PRE = 'PRE',
    BOOK = 'BOOK',
    POST = 'POST',
}

export enum TimeUnit {
    HOUR = 'HOUR',
    DAY = 'DAY',
    MINUTE = 'MINUTE',
}

export class InclusionSetting {

    @IsBoolean()
    public physicians: boolean;

    @IsBoolean()
    public appointmentType: boolean;

    @IsBoolean()
    public validStatusCodes: boolean;

    @IsBoolean()
    public locations: boolean;

    @IsBoolean()
    public appointmentNotes: boolean;
}

export class NotificationChannelSettings {
    @IsBoolean()
    public enabled: boolean;
    @IsString()
    public templateName: string;
    @IsString()
    public templateId: string;
}

export class ReminderTimeSetting {
    @IsEnum(ReminderType)
    public type: ReminderType;
    @IsString()
    public timeValue: string;
    @IsEnum(TimeUnit)
    public timeUnit: TimeUnit;
    @IsString()
    public timeDifference: string;
}

export class NoResponseTemplateSetting {
    @IsBoolean()
    public enabled: boolean;
    @IsString()
    public timeValue: string;
    @IsEnum(TimeUnit)
    public timeUnit: TimeUnit;
    @IsString()
    public emrStatus: string;
    @IsString()
    public appointmentStatus: string;
    @IsString()
    public templateName: string;
    @IsString()
    public templateId: string;
}

export class TimeBased {
    @IsArray()
    @IsString({ each: true })
    public appointmentEvent: string[];
}

export class ReferralBased {

    @IsOptional()
    @IsString()
    public referralType: string;

    @IsEnum(ReferralStatus)
    public referralStatus: ReferralStatus;
}

export class ApiBased {
    @IsString()
    public apiType: string;
}

export class FlagBased {
    @IsString()
    public flagType: string;
}

export class DocumentBased {
    @IsString()
    public documentType: string;
}

export class TriggerTypeSetting {

    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => TimeBased)
    public timeBased: TimeBased;

    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => ReferralBased)
    public referralBased: ReferralBased;

    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => ApiBased)
    public apiBased: ApiBased;

    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => DocumentBased)
    public documentBased: DocumentBased;

    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => FlagBased)
    public flagBased: FlagBased;

}

export class CombinationLimitSetting {
    @IsNumber()
    @IsOptional()
    public combinationLimit: number;

    @IsArray()
    @IsOptional()
    public combinedcheckins: string[];

    @IsString()
    @IsOptional()
    public combinationGroupId: string;

    @IsString()
    @IsOptional()
    public combinationGroupName: string;
}

export class checkinTemplate {
    @IsString()
    @IsNotEmpty({ message: `checkin name should not be empty` })
    public name: string;

    @IsString()
    @IsOptional()
    public uuid: string;

    @IsEnum(TriggerType)
    @IsNotEmpty()
    @IsNotEmpty({ message: `checkin trigger type should not be empty` })
    public triggerType: TriggerType;

    @IsBoolean()
    @IsNotEmpty({ message: `checkin enable flag should not be empty` })
    public enable: boolean;

    @IsString({
        each: true,
    })
    public validStatusCodes: string[];

    @IsString({
        each: true,
    })
    public appointmentType: string[];

    @IsArray()
    @IsOptional()
    public physicians: number[];

    @IsArray()
    @IsOptional()
    public locations: number[];

    @IsBoolean()
    @IsOptional()
    public limit: boolean;

    @ValidateNested()
    @IsOptional()
    public combinationLimitSetting: CombinationLimitSetting;

    @IsBoolean()
    @IsOptional()
    public registration: boolean;

    @IsString()
    @IsOptional()
    public apiType: string;

    @IsString()
    @IsOptional()
    public appointmentNotes: string;

    @IsString({
        each: true,
    })
    public invalidStatusCodes: string[];

    @ValidateNested()
    @IsOptional()
    public inclusionSetting: InclusionSetting;

    @ValidateNested()
    @IsOptional()
    public reminderTimeSetting: ReminderTimeSetting;

    @ValidateNested()
    @IsOptional()
    public noResponseTemplateSetting: NoResponseTemplateSetting;
    @ValidateNested()
    public smsTemplateSetting: NotificationChannelSettings;
    @ValidateNested()
    public emailTemplateSetting: NotificationChannelSettings;
    @ValidateNested()
    public phoneTemplateSetting: NotificationChannelSettings;
    @ValidateNested({ each: true })
    @Type(() => TriggerTypeSetting)
    public triggerTypeSetting: TriggerTypeSetting;
}
