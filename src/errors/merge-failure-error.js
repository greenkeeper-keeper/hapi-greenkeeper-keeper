export default class MergeFailureError extends Error {
  constructor (message) {
    super(`An attempt to merge this PR failed. ${message}`);
    this.name = 'MergeFailureError';
  }
}
