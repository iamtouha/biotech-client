import Vue from "vue";
import moment from "moment";

Vue.prototype.$moment = moment;
Vue.prototype.$dt = function(date, locale) {
  return date
    ? moment(date)
        .locale(locale)
        .format("D MMMM, yyyy")
    : "";
};

export { moment };
