export default class InvalidStatusFoundError extends Error {
  constructor(message = 'An invalid status was found for this PR.') {
    super(message);
    this.message = message;
    this.name = 'InvalidStatusFoundError';
  }
}
