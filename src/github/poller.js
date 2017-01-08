import delay from 'delay';
import {hours} from 'milliseconds';
import {PendingTimeoutError} from '../errors';

export default function (options, timeout, callback) {
  if (timeout > hours(1)) return Promise.reject(new PendingTimeoutError());

  return delay(timeout).then(() => callback(options, timeout * 2));
}
