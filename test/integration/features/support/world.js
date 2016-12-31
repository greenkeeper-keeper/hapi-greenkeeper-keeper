export function World() {
  this.receiveWebhook = ({event, action, sender}) => this.server.inject({
    method: 'POST',
    url: '/payload',
    headers: {
      'X-GitHub-Event': event
    },
    payload: {
      action,
      sender: {
        html_url: sender
      },
      pull_request: {
        statuses_url: 'https://api.github.com/foo',
        url: 'https://api.github.com/123',
        head: {
          sha: 'adlkfahfah',
          ref: 'baz',
          repo: {
            full_name: 'test-repo'
          }
        }
      }
    }
  });

  this.getResponseStatus = () => this.serverResponse.statusCode;
}
