import { CustomDecorator, SetMetadata } from '@nestjs/common';
import { IS_PUBLIC } from '../../common/constants';

export const Public = (): CustomDecorator<string> => SetMetadata(IS_PUBLIC, true);
