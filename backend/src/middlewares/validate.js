import { AppError } from '../utils/AppError.js';

export function validate(schema, target = 'body') {
  return function validateRequest(req, _res, next) {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      return next(new AppError('Request validation failed', 422, 'VALIDATION_ERROR'));
    }

    req[target] = result.data;
    return next();
  };
}
