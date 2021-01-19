import { Cookies } from "quasar";
import { setContext } from "apollo-link-context";

export function apolloClientBeforeCreate({ apolloClientConfigObj }) {
  const authLink = setContext((_, { headers }) => {
    // get the authentication token from local storage if it exists
    const token = Cookies.get("AUTH_TOKEN");
    // return the headers to the context so httpLink can read them
    return {
      headers: {
        authorization: token ? `Bearer ${token}` : "",
        ...headers
      }
    };
  });
  const link = apolloClientConfigObj.link;
  apolloClientConfigObj.link = authLink.concat(link);
}

let apollo = {};

export function apolloClientAfterCreate({ apolloClient }) {
  apollo = apolloClient;
}
export { apollo };
