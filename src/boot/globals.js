import Vue from "vue";
import { Notify } from "quasar";

Vue.prototype.$showError = function(error) {
  let message;
  try {
    message = error.message;
  } catch (err) {
    console.log(err);
  } finally {
    console.log(error);
    Notify.create({ type: "negative", message });
  }
};
