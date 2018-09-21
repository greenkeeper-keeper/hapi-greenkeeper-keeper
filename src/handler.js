import {ACCEPTED, NO_CONTENT, BAD_REQUEST, UNSUPPORTED_MEDIA_TYPE} from 'http-status-codes';
import boom from 'boom';
import openedByGreenkeeperBot from './greenkeeper';
import createActions from './github/actions';
import process from './process';

function successfulStatusCouldBeForGreenkeeperPR(event, state, branches) {
  return 'status' === event && 'success' === state && 1 === branches.length && 'master' !== branches[0].name;
}

export default async function (request, responseToolkit, settings) {
  const {state, repository, branches, sha} = request.payload;
  const event = request.headers['x-github-event'];

  if ('ping' === event) {
    if ('json' !== request.payload.hook.config.content_type) {
      return responseToolkit
        .response('please update your webhook configuration to send application/json')
        .code(UNSUPPORTED_MEDIA_TYPE);
    }

    return responseToolkit.response('successfully configured the webhook for greenkeeper-keeper').code(NO_CONTENT);
  }

  if (successfulStatusCouldBeForGreenkeeperPR(event, state, branches)) {
    const {getPullRequestsForCommit, getPullRequest} = createActions(settings.github);

    return getPullRequestsForCommit({ref: sha})
      .then(async pullRequests => {
        if (!pullRequests.length) return responseToolkit.response('no PRs for this commit').code(BAD_REQUEST);

        if (1 < pullRequests.length) {
          return responseToolkit.response(boom.internal('too many PRs exist for this commit'));
        }

        if (openedByGreenkeeperBot(pullRequests[0].user.html_url)) {
          process(request, await getPullRequest(repository, pullRequests[0].number), settings);
          return responseToolkit.response('ok').code(ACCEPTED);
        }

        return responseToolkit.response('PR is not from greenkeeper').code(BAD_REQUEST);
      })
      .catch(e => boom.internal('failed to fetch PRs', e));
  }

  request.log(['PR', 'skipping']);

  return responseToolkit.response('skipping').code(BAD_REQUEST);
}
