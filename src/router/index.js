import Vue from "vue";
import VueRouter from "vue-router";
import { Cookies, Notify } from "quasar";
import { apollo } from "src/apollo/apollo-client-hooks";
import Employee from "src/apollo/queries/employee.gql";

import routes from "./routes";

Vue.use(VueRouter);

let initialLoad = true;
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
      const { data } = await apollo.query({
        query: Employee,
        fetchPolicy: "network-first"
      });
      Cookies.set("USER_INFO", JSON.stringify(data.self), { expires: "15d" });

      store.dispatch("user/getUserInfo", data.self);
      console.log("Employee data loaded");
    } catch (error) {
      Notify.create({ type: "negative", message: error.message });
    }
  }
  Router.beforeEach((to, from, next) => {
    const token = Cookies.has("AUTH_TOKEN");
    if (token && initialLoad) {
      initialLoad = false;
      const userInfo = Cookies.get("USER_INFO");
      store.dispatch("user/getUserInfo", userInfo);
      fetchData();
    }
    const requiresAuth = to.meta?.auth;
    if (requiresAuth && token) {
      next();
    } else if (requiresAuth && !token) {
      next({ name: "login" });
    } else next();
  });
  return Router;
}
