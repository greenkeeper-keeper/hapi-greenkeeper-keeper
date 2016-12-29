export function World() {
  this.receiveWebhook = () => this.server.inject({
    method: 'POST',
    url: '/payload',
    payload: {}
  });

  this.getResponseStatus = () => this.serverResponse.statusCode;
}
