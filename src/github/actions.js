import clientFactory from './request-methods';

export default function (githubCredentials) {
  const {put, del} = clientFactory(githubCredentials);

  return {
    acceptPR: (url, sha, prNumber, squash = false) => put(`${url}/merge`, {
      sha,
      commit_title: `greenkeeper-keeper(pr: ${prNumber}): :white_check_mark:`,
      commit_message: `greenkeeper-keeper(pr: ${prNumber}): :white_check_mark:`,
      squash
    }),

    deleteBranch: ({repo, ref}) => del(`https://api.github.com/repos/${repo.full_name}/git/refs/heads/${ref}`)
  }
}
