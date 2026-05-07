import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CommentDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}

export class AssignResponderDto {
  @IsString()
  responderCode!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  eta?: string;
}
