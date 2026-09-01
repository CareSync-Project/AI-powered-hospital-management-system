export function developmentRouteNotice(_request, response, next) {
  response.setHeader('X-Phase2-Authentication', 'not-enforced-development-foundation');
  next();
}
