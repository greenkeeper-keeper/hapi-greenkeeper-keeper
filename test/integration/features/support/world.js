export function World() {
  this.receiveWebhook = () => this.server.inject({
    method: 'POST',
    url: '/payload',
    payload: {
      action: 'opened',
      sender: {
        html_url: 'https://github.com/integration/greenkeeper'
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
