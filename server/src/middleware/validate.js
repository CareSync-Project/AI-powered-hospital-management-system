import { AppError } from './errorHandler.js';

export function validate(schemas) {
  return (request, _response, next) => {
    const errors = [];

    for (const [source, schema] of Object.entries(schemas)) {
      const result = schema.safeParse(request[source]);
      if (!result.success) {
        errors.push(...result.error.issues.map((issue) => ({
          source,
          path: issue.path.join('.'),
          message: issue.message,
        })));
      } else {
        if (source === 'query') request.validatedQuery = result.data;
        else request[source] = result.data;
      }
    }

    if (errors.length > 0) {
      return next(new AppError('Validation failed', 400, errors));
    }

    return next();
  };
}
