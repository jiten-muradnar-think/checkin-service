import { Column } from 'typeorm';
import { ReferralStatus } from '../models/checkinTemplate';

export class TimeBased {
    // tslint:disable-next-line:no-null-keyword
    @Column({ default: null, nullable: true })
    public appointmentEvent: string[];
}

export class ReferralBased {
    // tslint:disable-next-line:no-null-keyword
    @Column({ default: null, nullable: true })
    public referralType: string;

    // tslint:disable-next-line:no-null-keyword
    @Column({ default: null, nullable: true })
    public referralStatus: ReferralStatus;
}

export class ApiBased {
    // tslint:disable-next-line:no-null-keyword
    @Column({ default: null, nullable: true })
    public apiType: string;
}

export class FlagBased {
    // tslint:disable-next-line:no-null-keyword
    @Column({ default: null, nullable: true })
    public flagType: string;
}

export class DocumentBased {
    // tslint:disable-next-line:no-null-keyword
    @Column({ default: null, nullable: true })
    public documentType: string;
}

export class TriggerTypeSettingEntity {

    @Column(type => TimeBased)
    public timeBased: TimeBased;

    @Column(type => ReferralBased)
    public referralBased: ReferralBased;

    @Column(type => ApiBased)
    public apiBased: ApiBased;

    @Column(type => DocumentBased)
    public documentBased: DocumentBased;

    @Column(type => FlagBased)
    public flagBased: FlagBased;

}
