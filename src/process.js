import createActions from './github/actions';

export default function (request,
  {head, url, number, comments_url},
  {github, squash, deleteBranches = false, pollWhenPending}) {
  const {ensureAcceptability, acceptPR, deleteBranch, postErrorComment} = createActions(github);

  return ensureAcceptability({
    repo: head.repo,
    ref: head.ref,
    url,
    pollWhenPending
  }, message => request.log(message))
    .then(() => acceptPR(url, head.sha, number, squash, message => request.log(message)))
    .then(() => deleteBranch(head, deleteBranches))
    .catch(err => {
      if ('pending' !== err.message) {
        request.log(['error', 'PR'], err);

        return postErrorComment(comments_url, err)
          .catch(e => request.log(`failed to log comment against the PR: ${e}`));
      }

      return Promise.resolve();
    });
}
