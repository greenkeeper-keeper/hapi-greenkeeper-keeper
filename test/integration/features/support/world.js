import any from '@travi/any';

function buildWebhookPayload(
  event,
  {action, prDetails, statusEventDetails, ref, repoFullName, repoName, repoOwner, sha}
) {
  if ('pull_request' === event) {
    return {
      action,
      sha,
      sender: {
        html_url: prDetails.sender
      },
      number: prDetails.number,
      pull_request: {
        number: prDetails.number,
        comments_url: `https://api.github.com${prDetails.comments}`,
        url: 'https://api.github.com/123',
        head: {
          sha,
          ref,
          repo: {
            full_name: repoFullName,
            name: repoName,
            owner: {login: repoOwner}
          }
        }
      }
    };
  }

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
  this.sha = any.string();
  this.ref = any.word();
  this.prNumber = any.integer();
  this.repoOwner = any.word();
  this.repoName = 'test-repo';
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
