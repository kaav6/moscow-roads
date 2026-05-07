import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';

const toArray = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') return undefined;
  if (Array.isArray(value)) return value.map(String);
  return String(value).split(',').filter(Boolean);
};

export class IncidentFilterDto {
  @IsOptional()
  @Transform(toArray)
  type?: string[];

  @IsOptional()
  @Transform(toArray)
  priority?: string[];

  @IsOptional()
  @Transform(toArray)
  status?: string[];

  @IsOptional()
  @IsString()
  districtCode?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  page?: number = 0;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  size?: number = 50;
}
