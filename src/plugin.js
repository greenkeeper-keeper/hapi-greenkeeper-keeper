import * as joi from 'joi';
import hoek from 'hoek';
import {ACCEPTED, BAD_REQUEST} from 'http-status-codes';
import openedByGreenkeeperBot from './greenkeeper';
import process from './process';

function validate(options) {
  const validated = joi.validate(options, joi.object({
    github: joi.object({token: joi.string().required()}).required(),
    squash: joi.boolean().required(),
    deleteBranches: joi.boolean()
  }).required());

  hoek.assert(!validated.error, validated.error);

  return validated.value;
}

function isValidGreenkeeperUpdate({event, action, sender}) {
  return event === 'pull_request' && action === 'opened' && openedByGreenkeeperBot(sender.html_url);
}

export function register(server, options, next) {
  const settings = validate(options);

  server.route({
    method: 'POST',
    path: '/payload',
    handler(request, reply) {
      const {action, sender} = request.payload;

      if (isValidGreenkeeperUpdate({event: request.headers['x-github-event'], action, sender})) {
        reply('ok').code(ACCEPTED);

        request.log(['info', 'PR', 'validating'], request.payload.pull_request.url);
        return process(request, settings);
      }

      reply('skipping').code(BAD_REQUEST);
      request.log(['PR', 'skipping']);

      return Promise.resolve();
    }
  });

  next();
}

register.attributes = {
  pkg: require('../package.json')
};
