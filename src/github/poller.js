import delay from 'delay';
import {hours} from 'milliseconds';
import {PendingTimeoutError} from '../errors';

export default function (options, log, timeout, callback) {
  if (timeout > hours(1)) {
    log(['error', 'PR', 'pending-timeout'], 'pending timeout exceeded, rejecting...');
    return Promise.reject(new PendingTimeoutError());
  }

  return delay(timeout).then(() => callback(options, log, timeout * 2));
}
