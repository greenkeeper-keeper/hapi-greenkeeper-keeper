import {minutes} from 'milliseconds';
import octokitFactory from './octokit-factory-wrapper';
import clientFactory from './request-methods';
import poll from './poller';
import {
  BranchDeletionFailureError,
  FailedStatusFoundError,
  InvalidStatusFoundError,
  MergeFailureError
} from '../errors';

function determineMergeMethodFrom(acceptAction, squash) {
  if (acceptAction) return acceptAction;
  return squash ? 'squash' : 'merge';
}

export default function (githubCredentials) {
  const octokit = octokitFactory();
  const {token} = githubCredentials;
  octokit.authenticate({type: 'token', token});
  const {post, put, del} = clientFactory(githubCredentials);

  function ensureAcceptability({repo, sha, url, pollWhenPending}, log, timeout = minutes(1)) {
    log(['info', 'PR', 'validating'], url);

    return octokit.repos.getCombinedStatusForRef({owner: repo.owner.login, repo: repo.name, ref: sha})
      .then(response => response.data)
      .then(({state}) => {
        switch (state) {
          case 'pending': {
            if (pollWhenPending) {
              return poll({repo, sha, pollWhenPending}, log, timeout, ensureAcceptability).then(message => {
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

  function acceptPR(url, sha, prNumber, squash, acceptAction, log) {
    return put(`${url}/merge`, {
      sha,
      commit_title: `greenkeeper-keeper(pr: ${prNumber}): :white_check_mark:`,
      commit_message: `greenkeeper-keeper(pr: ${prNumber}): :white_check_mark:`,
      merge_method: determineMergeMethodFrom(acceptAction, squash)
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

  async function getPullRequestsForCommit({ref}) {
    const response = await octokit.search.issues({q: `${ref}+type:pr`});

    return response.data.items;
  }

  async function getPullRequest(repository, number) {
    const response = await octokit.pullRequests.get({owner: repository.owner.login, repo: repository.name, number});

    return response.data;
  }

  return {
    ensureAcceptability,
    acceptPR,
    deleteBranch,
    postErrorComment,
    getPullRequestsForCommit,
    getPullRequest
  };
}
