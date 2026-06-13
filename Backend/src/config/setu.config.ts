import { registerAs } from '@nestjs/config';

export default registerAs('setu', () => ({
  clientId: process.env.SETU_CLIENT_ID,
  clientSecret: process.env.SETU_CLIENT_SECRET,
  productInstanceId: process.env.SETU_PRODUCT_INSTANCE_ID,
  baseUrl: process.env.SETU_BASE_URL ?? 'https://dg-sandbox.setu.co',
  redirectUrl: process.env.SETU_REDIRECT_URL,
  mockMode: process.env.SETU_MOCK_MODE === 'true',
}));
