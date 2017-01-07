import delay from 'delay';
import {hours} from 'milliseconds';

export default function (options, timeout, callback) {
  if (timeout > hours(1)) return Promise.reject();

  return delay(timeout).then(() => callback(options, timeout * 2));
}
