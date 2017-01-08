import {ACCEPTED, BAD_REQUEST} from 'http-status-codes';
import openedByGreenkeeperBot from './greenkeeper';
import process from './process';

function isValidGreenkeeperUpdate({event, action, sender}) {
  return event === 'pull_request' && action === 'opened' && openedByGreenkeeperBot(sender.html_url);
}

export function register (server, options, next) {
  server.route({
    method: 'POST',
    path: '/payload',
    handler(request, reply) {
      const {action, sender} = request.payload;

      if (isValidGreenkeeperUpdate({event: request.headers['x-github-event'], action, sender})) {
        reply('ok').code(ACCEPTED);

        request.log(['info', 'PR', 'validating'], request.payload.pull_request.url);
        return process(request, options);
      } else {
        reply('skipping').code(BAD_REQUEST);
        request.log(['PR', 'skipping'])
      }
    }
  });

  next();
}

register.attributes = {
  pkg: require('../package.json')
};
