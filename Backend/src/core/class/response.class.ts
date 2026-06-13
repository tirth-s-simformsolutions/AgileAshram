import { HttpStatus } from '@nestjs/common';
import { IResponse } from '../interfaces/response.interface';

export class ResponseResult<ResponseEntity> {
  public message?: string;
  public data?: ResponseEntity | ResponseEntity[];
  public statusCode?: HttpStatus;

  constructor(responseResults: IResponse<ResponseEntity>) {
    this.message = responseResults.message;
    this.data = responseResults.data;
    this.statusCode = responseResults.statusCode;
  }
}
