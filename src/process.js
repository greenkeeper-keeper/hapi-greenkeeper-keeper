import createActions from './github/actions';

export default function (
  request,
  {head, url, number},
  {github, deleteBranches = false, acceptAction}
) {
  const {ensureAcceptability, acceptPR, deleteBranch, postErrorComment} = createActions(github);

  return ensureAcceptability({repo: head.repo, sha: head.sha, url}, (...args) => request.log(...args))
    .then(() => acceptPR(head.repo, head.sha, number, acceptAction, (...args) => request.log(...args)))
    .then(() => deleteBranch(head, deleteBranches))
    .catch(err => {
      if ('pending' !== err.message) {
        request.log(['error', 'PR'], err);

        return postErrorComment(head.repo, number, err)
          .catch(e => request.log(`failed to log comment against the PR: ${e}`));
      }

      return Promise.resolve();
    });
}
