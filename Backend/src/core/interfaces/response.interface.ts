import { HttpStatus } from '@nestjs/common';

export interface IResponse<ResponseEntity> {
  message?: string;
  data?: ResponseEntity | ResponseEntity[];
  statusCode?: HttpStatus;
}
