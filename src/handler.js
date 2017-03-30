import {ACCEPTED, NO_CONTENT, BAD_REQUEST, UNSUPPORTED_MEDIA_TYPE} from 'http-status-codes';
import boom from 'boom';
import openedByGreenkeeperBot from './greenkeeper';
import createActions from './github/actions';
import process from './process';

function isValidGreenkeeperUpdate({event, action, sender}) {
  return event === 'pull_request' && action === 'opened' && openedByGreenkeeperBot(sender.html_url);
}

function successfulStatusCouldBeForGreenkeeperPR(event, state, branches) {
  return event === 'status' && state === 'success' && branches.length === 1 && branches[0].name !== 'master';
}

export default function (request, reply, settings) {
  const {action, sender, state, repository, branches} = request.payload;
  const event = request.headers['x-github-event'];

  if (event === 'ping') {
    if (request.payload.hook.config.content_type !== 'json') {
      reply('please update your webhook configuration to send application/json').code(UNSUPPORTED_MEDIA_TYPE);

      return Promise.resolve();
    }

    reply('successfully configured the webhook for greenkeeper-keeper').code(NO_CONTENT);

    return Promise.resolve();
  }

  if (isValidGreenkeeperUpdate({event, action, sender})) {
    reply('ok').code(ACCEPTED);

    return process(request, request.payload.pull_request, {...settings, pollWhenPending: true});
  }

  if (successfulStatusCouldBeForGreenkeeperPR(event, state, branches)) {
    const {getPullRequestsForCommit} = createActions(settings.github);

    return getPullRequestsForCommit({repo: repository, ref: branches[0].name})
      .then(pullRequests => {
        if (!pullRequests.length) reply('no PRs for this commit').code(BAD_REQUEST);
        else if (pullRequests.length > 1) reply(boom.internal('too many PRs exist for this commit'));
        else if (openedByGreenkeeperBot(pullRequests[0].user.html_url)) {
          reply('ok').code(ACCEPTED);
          process(request, pullRequests[0], settings);
        } else reply('PR is not from greenkeeper').code(BAD_REQUEST);
      })
      .catch(e => reply(boom.internal('failed to fetch PRs', e)));
  }

  reply('skipping').code(BAD_REQUEST);
  request.log(['PR', 'skipping']);

  return Promise.resolve();
}
