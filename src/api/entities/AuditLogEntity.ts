import { Column, Entity, ObjectIdColumn } from 'typeorm';
@Entity('AuditLog')
export class AuditLogEntity {
    @ObjectIdColumn()
    public id: number;

    @Column({ name: 'PARTNER_ID' })
    public partnerId: number;

    @Column({ name: 'REQUEST_METHOD' })
    public requestMethod: string;

    @Column({ name: 'REQUEST_ENDPOINT' })
    public requestEndpoint: string;

    @Column({ name: 'REQUEST_UNIQUE_ID' })
    public requestUniqueId: string;

    @Column({ name: 'TOTAL_RESPONSE_TIME' })
    public totalResponseTime: number;

    @Column({ name: 'RESPONSE_STATUS_CODE' })
    public responseStatusCode: number;

    @Column({ name: 'REQUEST_BODY' })
    public requestBody: string;

    @Column({ name: 'RESPONSE_BODY' })
    public responseBody: string;

    @Column({ name: 'ERROR_MESSAGE' })
    public errorMessage: string;

    @Column({ name: 'UPDATED_AT' })
    public updatedAt: Date;

    @Column({ name: 'CREATED_AT' })
    public createdAt: Date;
}
