import Vue from "vue";
import axios from "axios";

const baseURL = process.env.DEV
  ? "http://localhost:1337"
  : "https://biotechav.herokuapp.com";

Vue.prototype.$http = axios.create({ baseURL });
export { axios };
