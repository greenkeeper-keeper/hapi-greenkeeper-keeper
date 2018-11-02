import {ACCEPTED, BAD_REQUEST, NO_CONTENT, UNSUPPORTED_MEDIA_TYPE} from 'http-status-codes';
import boom from 'boom';
import openedByGreenkeeperBot from './greenkeeper';
import createActions from './github/actions';
import process from './process';

function determineIfWebhookConfigIsCorrect(hook, responseToolkit) {
  if ('json' !== hook.config.content_type) {
    return responseToolkit
      .response('please update your webhook configuration to send application/json')
      .code(UNSUPPORTED_MEDIA_TYPE);
  }

  return responseToolkit.response('successfully configured the webhook for greenkeeper-keeper').code(NO_CONTENT);
}

function branchIsNotMaster(branchName, log) {
  if ('master' === branchName) {
    log(['PR'], `branch name \`${branchName}\` should not be \`master\``);
    return false;
  }

  return true;
}

function statusEventIsSuccessfulAndCouldBeForGreenkeeperPR(state, branches, log) {
  if ('success' !== state) {
    log(['PR'], `state was \`${state}\` instead of \`success\``);
    return false;
  }

  if (1 !== branches.length) {
    log(['PR'], `expected 1 branch, but found ${branches.length}`);
    return false;
  }

  return branchIsNotMaster(branches[0].name, log);
}

function checkRunEventIsSuccessfulAndCouldBeForGreenkeeperPR(checkRun, log) {
  const {status, conclusion, check_suite: checkSuite} = checkRun;
  const {head_branch: headBranch} = checkSuite;

  if ('completed' !== status) {
    log(['PR'], `check_run status was \`${status}\` instead of \`completed\``);
    return false;
  }

  if ('success' !== conclusion) {
    log(['PR'], `check_run conclusion was \`${conclusion}\` instead of \`success\``);
    return false;
  }

  return branchIsNotMaster(headBranch, log);
}

function successfulResultCouldBeForGreenkeeperPR(event, state, branches, checkRun, log) {
  switch (event) {
    case 'status':
      return statusEventIsSuccessfulAndCouldBeForGreenkeeperPR(state, branches, log);
    case 'check_run':
      return checkRunEventIsSuccessfulAndCouldBeForGreenkeeperPR(checkRun, log);
    default:
      log(['PR'], `event was \`${event}\` instead of \`status\` or \`check_run\``);
      return false;
  }
}

export default async function (request, responseToolkit, settings) {
  const {hook, state, repository, branches, sha, check_run: checkRun, sender} = request.payload;
  const event = request.headers['x-github-event'];
  function logger(...args) {
    request.log(...args);
  }

  if ('ping' === event) return determineIfWebhookConfigIsCorrect(hook, responseToolkit);

  if (successfulResultCouldBeForGreenkeeperPR(event, state, branches, checkRun, logger)) {
    const {getPullRequestsForCommit, getPullRequest} = createActions(settings.github);

    if ('status' === event) {
      return getPullRequestsForCommit({ref: sha})
        .then(async pullRequests => {
          if (!pullRequests.length) return responseToolkit.response('no PRs for this commit').code(BAD_REQUEST);

          if (1 < pullRequests.length) {
            throw boom.internal('too many PRs exist for this commit');
          }

          const senderUrl = pullRequests[0].user.html_url;
          if (openedByGreenkeeperBot(senderUrl)) {
            process(request, await getPullRequest(repository, pullRequests[0].number), settings);
            return responseToolkit.response('status event will be processed').code(ACCEPTED);
          }

          return responseToolkit.response(`PR is not from greenkeeper, but from ${senderUrl}`).code(BAD_REQUEST);
        })
        .catch(e => boom.internal('failed to fetch PRs', e));
    }

    if ('check_run' === event) {
      const {check_suite: {pull_requests: pullRequests}} = checkRun;

      if (!pullRequests.length) return responseToolkit.response('no PRs for this commit').code(BAD_REQUEST);
      if (1 < pullRequests.length) return responseToolkit.response(boom.internal('too many PRs exist for this commit'));

      const senderUrl = sender.html_url;
      if (!openedByGreenkeeperBot(senderUrl)) {
        return responseToolkit.response(`PR is not from greenkeeper, but from ${senderUrl}`).code(BAD_REQUEST);
      }

      let pullRequest;
      try {
        pullRequest = await getPullRequest(repository, pullRequests[0].number);
      } catch (err) {
        throw boom.internal('failed to fetch PRs', err);
      }

      process(request, pullRequest, settings);
      return responseToolkit.response('check_run event will be processed').code(ACCEPTED);
    }
  }

  request.log(['PR'], 'skipping');

  return responseToolkit.response('skipping').code(BAD_REQUEST);
}
