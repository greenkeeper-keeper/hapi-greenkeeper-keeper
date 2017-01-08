import {minutes} from 'milliseconds';
import clientFactory from './request-methods';
import poll from './poller';
import FailedStatusFoundError from '../failed-status-found-error';
import MergeFailureError from '../merge-failure-error';

export default function (githubCredentials) {
  const {get, post, put, del} = clientFactory(githubCredentials);

  return {
    ensureAcceptability({repo, ref}, timeout = minutes(1)) {
      return get(`https://api.github.com/repos/${repo.full_name}/commits/${ref}/status`)
        .then((response) => response.body)
        .then(({state}) => {
          if ('pending' === state) return poll({repo, ref}, timeout);
          if ('success' === state) return Promise.resolve('All commit statuses passed');
          if ('failure' === state) return Promise.reject(new FailedStatusFoundError());
        })
    },

    acceptPR: (url, sha, prNumber, squash = false) => put(`${url}/merge`, {
      sha,
      commit_title: `greenkeeper-keeper(pr: ${prNumber}): :white_check_mark:`,
      commit_message: `greenkeeper-keeper(pr: ${prNumber}): :white_check_mark:`,
      squash
    }).catch(err => Promise.reject(new MergeFailureError(err))),

    deleteBranch: ({repo, ref}, deleteBranches) => {
      if (deleteBranches) return del(`https://api.github.com/repos/${repo.full_name}/git/refs/heads/${ref}`);

      return Promise.resolve();
    },

    postErrorComment: (url, error) => post(url, {
      body: `:x: greenkeeper-keeper failed to merge the pull-request \n \`${error.message}\``
    })
  }
}
