import createActions from './github/actions';

export default function (request, {github, squash, deleteBranches = false, pollWhenPending}) {
  const {pull_request, number} = request.payload;
  const {ensureAcceptability, acceptPR, deleteBranch, postErrorComment} = createActions(github);

  return ensureAcceptability({
    repo: pull_request.head.repo,
    ref: pull_request.head.ref,
    url: pull_request.url,
    pollWhenPending
  }, message => request.log(message))
    .then(() => acceptPR(pull_request.url, pull_request.head.sha, number, squash, message => request.log(message)))
    .then(() => deleteBranch(pull_request.head, deleteBranches))
    .catch(err => {
      request.log(['error', 'PR'], err);

      return postErrorComment(pull_request.comments_url, err)
        .catch(e => request.log(`failed to log comment against the PR: ${e}`));
    });
}
