import { Cookies } from "quasar";
import { createHttpLink } from "apollo-link-http";
import { setContext } from "apollo-link-context";
import { InMemoryCache } from "apollo-cache-inmemory";

export function apolloClientBeforeCreate({ apolloClientConfigObj }) {
  const httpLink = createHttpLink({
    uri: "http://localhost:1337/graphql"
  });

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
  apolloClientConfigObj.link = authLink.concat(httpLink);
}

let apollo = {};

export function apolloClientAfterCreate({ apolloClient }) {
  apollo = apolloClient;
}
export { apollo };
