import { IGetResponse } from '../../../common/interfaces';
import { ITokenPayload } from './tokenPayload.interface';

export interface IDecodeTokenData {
  error: IGetResponse<unknown>;
  data: ITokenPayload;
}
