import createActions from './github/actions';

export default function ({payload}, {github, squash, deleteBranches}) {
  const {pull_request, number} = payload;
  const {ensureAcceptability, acceptPR, deleteBranch, postErrorComment} = createActions(github);

  return ensureAcceptability({repo: pull_request.head.repo, ref: pull_request.head.ref})
    .then(() => acceptPR(pull_request.url, pull_request.head.sha, number, squash))
    .then(() => deleteBranch(pull_request.head, deleteBranches))
    .catch(err => postErrorComment(pull_request.comments_url, err)
      .catch(e => console.log(`failed to log comment against the PR: ${e}`)));
}
