export default {
  namespaced: true,
  state: () => ({
    message: "",
    toggled: false
  }),
  getters: {
    msg: ({ message }) => message,
    toggled: ({ toggled }) => toggled
  },
  mutations: {
    SHOW(state, payload) {
      state.message = payload;
      state.toggled = true;
    },
    HIDE(state) {
      state.message = "";
      state.toggled = false;
    }
  }
};
