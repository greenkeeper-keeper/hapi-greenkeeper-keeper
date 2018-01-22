import * as joi from 'joi';
import hoek from 'hoek';
import validatePayloadAndProcess from './handler';

function validate(options) {
  const validated = joi.validate(options, joi.object({
    github: joi.object({token: joi.string().required()}).required(),
    squash: joi.boolean(),
    acceptAction: joi.string().valid('merge', 'squash', 'rebase'),
    deleteBranches: joi.boolean()
  }).xor('squash', 'acceptAction').required());

  hoek.assert(!validated.error, validated.error);

  return validated.value;
}


exports.plugin = {
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
