import any from '@travi/any';

function buildWebhookPayload(event, {statusEventDetails, checkRunEventDetails, repoFullName, repoName, sha}) {
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

  if ('check_run' === event) {
    return {
      action: checkRunEventDetails.status,
      check_run: {
        status: checkRunEventDetails.status,
        conclusion: checkRunEventDetails.conclusion,
        check_suite: {
          head_sha: sha,
          head_branch: checkRunEventDetails.branch,
          pull_requests: checkRunEventDetails.prLink
            ? [{url: checkRunEventDetails.prLink, number: checkRunEventDetails.prNumber}]
            : []
        }
      },
      repository: {
        full_name: repoFullName,
        name: repoName,
        owner: {
          login: checkRunEventDetails.repoOwner
        }
      }
    };
  }

  return {};
}

export function World() {
  this.githubToken = any.word();
  this.sha = any.word();
  this.prNumber = any.integer();
  this.repoOwner = any.word();
  this.repoName = any.word();
  this.repoFullName = `${this.repoOwner}/${this.repoName}`;

  this.receiveWebhook = ({event, statusEventDetails, checkRunEventDetails}) => this.server.inject({
    method: 'POST',
    url: '/payload',
    headers: {
      'X-GitHub-Event': event
    },
    payload: buildWebhookPayload(
      event,
      {
        statusEventDetails,
        checkRunEventDetails,
        sha: this.sha,
        repoFullName: this.repoFullName,
        repoName: this.repoName
      }
    )
  });

  this.getResponseStatus = () => this.serverResponse.statusCode;
}
