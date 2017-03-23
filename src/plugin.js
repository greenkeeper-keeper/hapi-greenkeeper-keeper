import * as joi from 'joi';
import hoek from 'hoek';
import {ACCEPTED, NO_CONTENT, BAD_REQUEST} from 'http-status-codes';
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
      const {action, sender, state} = request.payload;
      const event = request.headers['x-github-event'];

      if (event === 'ping') {
        if (request.payload.hook.config.content_type !== 'json') {
          reply('please update your webhook configuration to send application/json').code(BAD_REQUEST);

          return Promise.resolve();
        }

        reply('successfully configured the webhook for greenkeeper-keeper').code(NO_CONTENT);

        return Promise.resolve();
      }

      if (isValidGreenkeeperUpdate({event, action, sender})) {
        reply('ok').code(ACCEPTED);

        return process(request, settings);
      }

      if (event === 'status' && state === 'success') {
        reply('ok').code(ACCEPTED);

        return Promise.resolve();
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
