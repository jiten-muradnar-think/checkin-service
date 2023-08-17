import {IsString} from 'class-validator';

export class DataElements {
    @IsString()
    public name: string;
    @IsString()
    public value: string;
}
