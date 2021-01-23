import Vue from "vue";
import { Notify } from "quasar";

Vue.prototype.$showError = function(error) {
  let message;
  try {
    message =
      error.response?.data.message[0]?.messages[0]?.message ||
      error.graphQLErrors[0]?.message ||
      error.message;
  } catch (err) {
    console.log(err);
  } finally {
    Notify.create({ type: "negative", message });
  }
};
