export default class BranchDeletionFailureError extends Error {
  constructor(message) {
    super(`An attempt to delete this branch failed. ${message}`);
    this.name = 'BranchDeletionFailureError';
  }
}
