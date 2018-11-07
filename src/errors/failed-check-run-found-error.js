export default class FailedCheckRunFoundError extends Error {
  constructor(message = 'A failed check_run was found for this PR.') {
    super(message);
    this.message = message;
    this.name = 'FailedCheckRunFoundError';
  }
}
