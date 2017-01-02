import clientFactory from './request-methods';

export default function (githubCredentials) {
  const {put} = clientFactory(githubCredentials);

  return {
    acceptPR: (url, sha, prNumber, squash = false) => put(`${url}/merge`, {
      sha,
      commit_title: `greenkeeper-keeper(pr: ${prNumber}): :white_check_mark:`,
      commit_message: `greenkeeper-keeper(pr: ${prNumber}): :white_check_mark:`,
      squash
    })
  }
}
