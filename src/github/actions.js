import {minutes} from 'milliseconds';
import clientFactory from './request-methods';
import poll from './poller';
import {
  BranchDeletionFailureError,
  FailedStatusFoundError,
  InvalidStatusFoundError,
  MergeFailureError
} from '../errors';

export default function (githubCredentials) {
  const {get, post, put, del} = clientFactory(githubCredentials);

  function ensureAcceptability({repo, ref, url, pollWhenPending}, log, timeout = minutes(1)) {
    log(['info', 'PR', 'validating'], url);

    return get(`https://api.github.com/repos/${repo.full_name}/commits/${ref}/status`)
      .then(response => response.body)
      .then(({state}) => {
        switch (state) {
          case 'pending': {
            if (pollWhenPending) {
              return poll({repo, ref, pollWhenPending}, log, timeout, ensureAcceptability).then(message => {
                log(['info', 'PR', 'pending-status'], `retrying statuses for: ${url}`);
                return message;
              });
            }

            log(['info', 'PR', 'pending-status'], `not configured to poll: ${url}`);
            return Promise.reject(new Error('pending'));
          }
          case 'success':
            return Promise.resolve('All commit statuses passed')
              .then(message => {
                log(['info', 'PR', 'passing-status'], 'statuses verified, continuing...');
                return message;
              });
          case 'failure':
            return Promise.reject(new FailedStatusFoundError())
              .catch(err => {
                log(['error', 'PR', 'failure status'], 'found failed, rejecting...');
                return Promise.reject(err);
              });
          default:
            return Promise.reject(new InvalidStatusFoundError());
        }
      });
  }

  function acceptPR(url, sha, prNumber, squash, log) {
    return put(`${url}/merge`, {
      sha,
      commit_title: `greenkeeper-keeper(pr: ${prNumber}): :white_check_mark:`,
      commit_message: `greenkeeper-keeper(pr: ${prNumber}): :white_check_mark:`,
      merge_method: squash ? 'squash' : 'merge'
    }).then(result => {
      log(['info', 'PR', 'integrated'], url);
      return result;
    }).catch(err => Promise.reject(new MergeFailureError(err)));
  }

  function deleteBranch({repo, ref}, deleteBranches) {
    if (deleteBranches) {
      return del(`https://api.github.com/repos/${repo.full_name}/git/refs/heads/${ref}`)
        .catch(err => Promise.reject(new BranchDeletionFailureError(err)));
    }

    return Promise.resolve();
  }

  function postErrorComment(url, error) {
    return post(url, {body: `:x: greenkeeper-keeper failed to merge the pull-request \n> ${error.message}`});
  }

  function getPullRequestsForCommit({repo, ref}) {
    return get(`https://api.github.com/repos/${repo.full_name}/pulls?head=${repo.owner.login}:${ref}`)
      .then(response => response.body);
  }

  return {
    ensureAcceptability,
    acceptPR,
    deleteBranch,
    postErrorComment,
    getPullRequestsForCommit
  };
}
