import {ACCEPTED, NO_CONTENT, BAD_REQUEST, UNSUPPORTED_MEDIA_TYPE} from 'http-status-codes';
import boom from 'boom';
import openedByGreenkeeperBot from './greenkeeper';
import createActions from './github/actions';
import process from './process';

function isValidGreenkeeperUpdate({event, action, sender}) {
  return 'pull_request' === event && 'opened' === action && openedByGreenkeeperBot(sender.html_url);
}

function successfulStatusCouldBeForGreenkeeperPR(event, state, branches) {
  return 'status' === event && 'success' === state && 1 === branches.length && 'master' !== branches[0].name;
}

export default function (request, reply, settings) {
  const {action, sender, state, repository, branches} = request.payload;
  const event = request.headers['x-github-event'];

  if ('ping' === event) {
    if ('json' !== request.payload.hook.config.content_type) {
      // reply('please update your webhook configuration to send application/json').code(UNSUPPORTED_MEDIA_TYPE);

      return 'please update your webhook configuration to send application/json';
    }

    // reply('successfully configured the webhook for greenkeeper-keeper').code(NO_CONTENT);

    return 'successfully configured the webhook for greenkeeper-keeper';
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
        else if (1 < pullRequests.length) reply(boom.internal('too many PRs exist for this commit'));
        else if (openedByGreenkeeperBot(pullRequests[0].user.html_url)) {
          reply('ok').code(ACCEPTED);
          process(request, pullRequests[0], settings);
        } else reply('PR is not from greenkeeper').code(BAD_REQUEST);
      })
      .catch(e => reply(boom.internal('failed to fetch PRs', e)));
  }

  // reply('skipping').code(BAD_REQUEST);
  request.log(['PR', 'skipping']);

  return 'skipping';
}
