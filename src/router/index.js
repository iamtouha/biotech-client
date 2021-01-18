import Vue from "vue";
import VueRouter from "vue-router";
import { Cookies, Notify } from "quasar";
import { apollo } from "src/apollo/apollo-client-hooks";
import Employee from "src/apollo/queries/employee.gql";

import routes from "./routes";

Vue.use(VueRouter);

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default function({ store, ssrContext }) {
  const Router = new VueRouter({
    scrollBehavior: () => ({ x: 0, y: 0 }),
    routes,
    mode: process.env.VUE_ROUTER_MODE,
    base: process.env.VUE_ROUTER_BASE
  });

  async function fetchData() {
    try {
      const user = store.getters["user/user"];
      if (user) return user;
      const { data } = await apollo.query({
        query: Employee,
        fetchPolicy: "no-cache"
      });
      store.dispatch("user/getUserInfo", data.self);
      return data.self;
    } catch (error) {
      return error;
    }
  }
  Router.beforeEach((to, from, next) => {
    const token = Cookies.get("AUTH_TOKEN");
    const requiresAuth = to.meta?.auth;
    if (requiresAuth && token) {
      fetchData()
        .then(() => next())
        .catch(() => {
          Notify.create({ type: "negative", message: error.message });
          next({ name: "login" });
        });
    } else if (requiresAuth && !token) {
      next({ name: "login" });
    } else next();
  });
  return Router;
}
