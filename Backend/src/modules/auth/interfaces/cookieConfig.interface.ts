export interface ICookieConfig {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
}

export interface IUserValidationResult {
  userId: string;
  name: string;
}
