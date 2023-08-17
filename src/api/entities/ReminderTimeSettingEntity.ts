import { Column } from 'typeorm';
import { ReminderType, TimeUnit } from '../models/checkinTemplate';

export class ReminderTimeSettingEntity {

    @Column({ type: 'enum', enum: ReminderType })
    public type: ReminderType;

    @Column()
    public timeValue: string;

    @Column({ type: 'enum', enum: TimeUnit })
    public timeUnit: TimeUnit;

    @Column()
    public timeDifference: string;
}
