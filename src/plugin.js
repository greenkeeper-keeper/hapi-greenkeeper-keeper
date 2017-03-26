import * as joi from 'joi';
import hoek from 'hoek';
import validatePayloadAndProcess from './handler';

function validate(options) {
  const validated = joi.default.validate(options, joi.object({
    github: joi.object({token: joi.string().required()}).required(),
    squash: joi.boolean().required(),
    deleteBranches: joi.boolean()
  }).required());

  hoek.assert(!validated.error, validated.error);

  return validated.value;
}

export function register(server, options, next) {
  const settings = validate(options);

  server.route({
    method: 'POST',
    path: '/payload',
    handler(request, reply) {
      validatePayloadAndProcess(request, reply, settings);
    }
  });

  next();
}

register.attributes = {
  pkg: require('../package.json')
};
