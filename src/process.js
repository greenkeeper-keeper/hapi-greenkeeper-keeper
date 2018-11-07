import createActions from './github/actions';

export default function ({head, url, number}, {github, acceptAction}, log) {
  const {ensureAcceptability, acceptPR, postErrorComment} = createActions(github);

  return ensureAcceptability({repo: head.repo, sha: head.sha, url}, log)
    .then(() => acceptPR(head.repo, head.sha, number, acceptAction, log))
    .catch(err => {
      if ('pending' !== err.message) {
        log(['error', 'PR'], err);

        return postErrorComment(head.repo, number, err)
          .catch(e => log(`failed to log comment against the PR: ${e}`));
      }

      return Promise.resolve();
    });
}
