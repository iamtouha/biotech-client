import Vue from "vue";
import Vuex from "vuex";

import user from "./user";
import alert from "./alert";

Vue.use(Vuex);

export default function(/* { ssrContext } */) {
  const Store = new Vuex.Store({
    state() {
      return {
        appLoading: false
      };
    },
    getters: {
      appLoading: ({ appLoading }) => appLoading
    },
    mutations: {
      APP_LOADING(state) {
        state.appLoading = true;
      },
      APP_LOADED(state) {
        state.appLoading = false;
      }
    },
    modules: {
      user,
      alert
    },
    strict: process.env.DEBUGGING
  });

  return Store;
}
