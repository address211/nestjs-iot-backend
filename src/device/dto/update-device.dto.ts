import { IsIn, IsOptional, IsString, Length } from 'class-validator';

export class UpdateDeviceDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(4, 64)
  serialNumber?: string;

  @IsOptional()
  @IsString()
  @IsIn(['online', 'offline', 'maintenance'])
  status?: string;

  @IsOptional()
  @IsString()
  @Length(1, 32)
  firmwareVersion?: string;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  location?: string;
}
