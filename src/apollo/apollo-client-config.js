export default function(/* { app, router, store, ssrContext, urlPath, redirect } */) {
  return {
    default: {
      cacheConfig: {},

      additionalConfig: {}
    },

    dev: {
      httpLinkConfig: {
        uri: process.env.GRAPHQL_URI || "http://localhost:1335/graphql"
      }
    },

    prod: {
      httpLinkConfig: {
        uri:
          process.env.GRAPHQL_URI || "https://biotechav.herokuapp.com/graphql"
      }
    },

    ssrOnServer: {
      additionalConfig: {
        ssrMode: true
      }
    },

    // the following gets merged to the config only when using ssr and on client
    ssrOnClient: {
      additionalConfig: {
        // https://apollo.vuejs.org/guide/ssr.html#create-apollo-client
        ssrForceFetchDelay: 100
      }
    }
  };
}
