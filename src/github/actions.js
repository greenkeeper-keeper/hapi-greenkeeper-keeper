import octokitFactory from './octokit-factory-wrapper';
import {FailedStatusFoundError, InvalidStatusFoundError, MergeFailureError} from '../errors';

function determineIfAllStatusesAreSuccessful(state, url, log) {
  switch (state) {
    case 'pending': {
      log(['info', 'PR', 'pending-status'], `commit status checks have not completed yet: ${url}`);
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
}

export default function (githubCredentials) {
  const octokit = octokitFactory();
  const {token} = githubCredentials;
  octokit.authenticate({type: 'token', token});

  async function ensureAcceptability({repo, sha, url}, log) {
    log(['info', 'PR', 'validating'], url);
    const {name: repoName, owner: {login: repoOwner}} = repo;

    const [statusesResponse] = await Promise.all([
      octokit.repos.getCombinedStatusForRef({owner: repoOwner, repo: repoName, ref: sha}),
      octokit.checks.listForRef({owner: repoOwner, repo: repoName, ref: sha})
    ]);
    const {state} = statusesResponse.data;

    return determineIfAllStatusesAreSuccessful(state, url, log);
  }

  function acceptPR(repo, sha, prNumber, acceptAction, log) {
    return octokit.pullRequests.merge({
      owner: repo.owner.login,
      repo: repo.name,
      number: prNumber,
      commit_title: `greenkeeper-keeper(pr: ${prNumber}): :white_check_mark:`,
      commit_message: `greenkeeper-keeper(pr: ${prNumber}): :white_check_mark:`,
      sha,
      merge_method: acceptAction
    }).then(result => {
      log(['info', 'PR', 'accepted'], {
        owner: repo.owner.login,
        repo: repo.name,
        number: prNumber
      });
      return result.data;
    }).catch(err => Promise.reject(new MergeFailureError(err)));
  }

  function postErrorComment(repo, prNumber, error) {
    return octokit.issues.createComment({
      owner: repo.owner.login,
      repo: repo.name,
      number: prNumber,
      body: `:x: greenkeeper-keeper failed to merge the pull-request \n> ${error.message}`
    });
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
    postErrorComment,
    getPullRequestsForCommit,
    getPullRequest
  };
}
