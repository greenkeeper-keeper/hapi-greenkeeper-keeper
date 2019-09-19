import * as joi from '@hapi/joi';
import hoek from '@hapi/hoek';
import validatePayloadAndProcess from './handler';

function validate(options) {
  const schema = joi.object({
    github: joi.object({token: joi.string().required()}).required(),
    acceptAction: joi.string().valid('merge', 'squash', 'rebase').required()
  }).required();
  const validated = schema.validate(options);

  hoek.assert(!validated.error, validated.error);

  return validated.value;
}


export const plugin = {
  async register(server, options) {
    const settings = validate(options);

    server.route({
      method: 'POST',
      path: '/payload',
      handler(request, responseToolkit) {
        return validatePayloadAndProcess(request, responseToolkit, settings);
      }
    });
  },
  pkg: require('../package.json')
};
