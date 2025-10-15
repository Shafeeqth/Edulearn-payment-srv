import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import Long from 'long';

function normalizeProto(obj: any): any {
  if (obj == null) return obj;
  if (Long.isLong(obj)) return obj.toNumber();
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key of Object.keys(obj)) {
      result[key] = normalizeProto(obj[key]);
    }
    return result;
  }
  return obj;
}

@Injectable()
export class GrpcValidationPipe implements PipeTransform {
  transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype) return value;

    // Normalize protobuf message → plain JS object
    const plain = normalizeProto(value);
    const instance = plainToInstance(metatype, plain);
    const errors = validateSync(instance, {
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });
    if (errors.length > 0) {
      const message = errors
        .map((e) => Object.values(e.constraints ?? {}).join(', '))
        .join('; ');
      throw new BadRequestException(`Validation failed: ${message}`);
    }
    return instance;
  }
}
