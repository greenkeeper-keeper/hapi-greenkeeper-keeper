import highwire from 'highwire';

function configureHeaders(token) {
  return {headers: {Authorization: `token ${token}`}};
}

export default function ({token}) {
  return {
    post: (url, payload) => highwire.post(url, payload, configureHeaders(token))
  };
}
