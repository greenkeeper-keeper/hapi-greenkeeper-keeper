import highwire from 'highwire';

function configureHeaders(token) {
  return {headers: {Authorization: `token ${token}`}};
}

export default function ({token}) {
  return {
    get: url => highwire.get(url, configureHeaders(token)),
    post: (url, payload) => highwire.post(url, payload, configureHeaders(token)),
    put: (url, payload) => highwire.put(url, payload, configureHeaders(token)),
    del: url => highwire.del(url, configureHeaders(token))
  };
}
