import Octokit from './octokit-factory-wrapper';
import {FailedCheckRunFoundError, FailedStatusFoundError, InvalidStatusFoundError, MergeFailureError} from '../errors';

function allStatusesAreSuccessful(statusesResponse, url, log) {
  const {state, statuses} = statusesResponse.data;

  switch (state) {
    case 'pending': {
      if (!statuses.length) {
        log(['info', 'PR', 'no commit statuses'], 'no commit statuses listed, continuing...');
        return true;
      }

      log(['info', 'PR', 'pending-status'], `commit status checks have not completed yet: ${url}`);
      throw new Error('pending');
    }
    case 'success': {
      log(['info', 'PR', 'passing-status'], 'statuses verified, continuing...');
      return true;
    }
    case 'failure': {
      log(['error', 'PR', 'failure status'], 'found failed status, rejecting...');
      throw new FailedStatusFoundError();
    }
    default:
      throw new InvalidStatusFoundError();
  }
}

function allCheckRunsAreSuccessful(checkRunsResponse, url, log) {
  const {total_count: totalCount, check_runs: checkRuns} = checkRunsResponse.data;

  if (!totalCount) {
    log(['info', 'PR', 'no check-runs'], 'no check_runs listed, continuing...');
    return true;
  }

  checkRuns.forEach(({status, conclusion}) => {
    if ('completed' !== status) {
      log(['info', 'PR', 'pending-check_runs'], `check_runs have not completed yet: ${url}`);
      throw new Error('pending');
    }

    if (['failure', 'cancelled', 'timed_out', 'action_required'].includes(conclusion)) {
      log(['error', 'PR', 'failure check_run'], 'found failed check_run, rejecting...');
      throw new FailedCheckRunFoundError();
    }
  });

  return true;
}

export default function (githubCredentials) {
  const {token} = githubCredentials;
  const octokit = new Octokit({auth: `token ${token}`});

  async function ensureAcceptability({repo, sha, url}, log) {
    log(['info', 'PR', 'validating'], url);
    const {name: repoName, owner: {login: repoOwner}} = repo;

    const [statusesResponse, checkRunsResponse] = await Promise.all([
      octokit.repos.getCombinedStatusForRef({owner: repoOwner, repo: repoName, ref: sha}),
      octokit.checks.listForRef({owner: repoOwner, repo: repoName, ref: sha})
    ]);

    return allStatusesAreSuccessful(statusesResponse, url, log)
      && allCheckRunsAreSuccessful(checkRunsResponse, url, log);
  }

  function acceptPR(repo, sha, prNumber, acceptAction, log) {
    return octokit.pulls.merge({
      owner: repo.owner.login,
      repo: repo.name,
      pull_number: prNumber,
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
      issue_number: prNumber,
      body: `:x: greenkeeper-keeper failed to merge the pull-request \n> ${error.message}`
    });
  }

  async function getPullRequestsForCommit({ref}) {
    const response = await octokit.search.issuesAndPullRequests({q: `${ref}+type:pr`});

    return response.data.items;
  }

  async function getPullRequest(repository, number) {
    const response = await octokit.pulls.get({
      owner: repository.owner.login,
      repo: repository.name,
      pull_number: number
    });

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
