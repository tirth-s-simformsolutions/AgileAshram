import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ENV } from '../constants';

export class EnvVariablesDto {
  @IsString()
  @IsIn(Object.values(ENV))
  NODE_ENV: string;

  @IsNumber()
  PORT: number;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsOptional()
  @IsString()
  SENTRY_DSN: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_TOKEN_EXPIRE: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_TOKEN_EXPIRE: string;

  @IsString()
  JWT_ACCESS_SECRET_KEY: string;

  @IsString()
  JWT_REFRESH_SECRET_KEY: string;

  @IsString()
  @IsNotEmpty()
  GOOGLE_GENAI_API_KEY: string;

  @IsString()
  @IsNotEmpty()
  GOOGLE_GENAI_MODEL: string;
  @IsString()
  @IsNotEmpty()
  CLOUDFLARE_R2_ACCOUNT_ID: string;

  @IsString()
  @IsNotEmpty()
  CLOUDFLARE_R2_ACCESS_KEY_ID: string;

  @IsString()
  @IsNotEmpty()
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: string;

  @IsString()
  @IsNotEmpty()
  CLOUDFLARE_R2_BUCKET_NAME: string;

  @IsString()
  @IsNotEmpty()
  CLOUDFLARE_R2_ENDPOINT: string;

  @IsString()
  @IsNotEmpty()
  CLOUDFLARE_R2_PUBLIC_URL: string;
}
