import any from '@travi/any';

function buildWebhookPayload(event, {statusEventDetails, repoFullName, repoName, sha}) {
  if ('status' === event) {
    return {
      state: statusEventDetails.state,
      sha,
      repository: {
        full_name: repoFullName,
        name: repoName,
        owner: {
          login: statusEventDetails.repoOwner
        }
      },
      ...statusEventDetails.branches && {branches: statusEventDetails.branches.map(branch => ({name: branch}))}
    };
  }

  return {};
}

export function World() {
  this.githubToken = any.word();
  this.sha = any.word();
  this.ref = any.word();
  this.prNumber = any.integer();
  this.repoOwner = any.word();
  this.repoName = any.word();
  this.repoFullName = `${this.repoOwner}/${this.repoName}`;

  this.receiveWebhook = ({event, action, prDetails, statusEventDetails}) => this.server.inject({
    method: 'POST',
    url: '/payload',
    headers: {
      'X-GitHub-Event': event
    },
    payload: buildWebhookPayload(
      event,
      {
        action,
        prDetails,
        statusEventDetails,
        sha: this.sha,
        ref: this.ref,
        repoFullName: this.repoFullName,
        repoName: this.repoName,
        repoOwner: this.repoOwner
      }
    )
  });

  this.getResponseStatus = () => this.serverResponse.statusCode;
}
