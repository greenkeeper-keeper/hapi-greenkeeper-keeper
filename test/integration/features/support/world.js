import any from '@travi/any';

export function World() {
  this.githubUser = any.word();
  this.githubToken = any.word();
  this.ref = 'baz';
  this.repo = 'test-repo';

  this.receiveWebhook = ({event, action, sender, comments}) => this.server.inject({
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
        comments_url: `https://api.github.com${comments}`,
        url: 'https://api.github.com/123',
        head: {
          sha: 'adlkfahfah',
          ref: this.ref,
          repo: {
            full_name: this.repo
          }
        }
      }
    }
  });

  this.getResponseStatus = () => this.serverResponse.statusCode;
}
