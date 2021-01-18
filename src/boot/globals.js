import Vue from "vue";
import { Notify } from "quasar";

Vue.prototype.$showError = function(error) {
  console.log(error);
  Notify.create({ type: "negative", message: error.message });
};
