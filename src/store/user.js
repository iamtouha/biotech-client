export default {
  namespaced: true,
  state: () => ({
    user: null,
    employee: null
  }),
  getters: {
    user: ({ user }) => user,
    employee: ({ employee }) => employee,
    em: ({ employee }) => employee
  },
  mutations: {
    SET_USER(state, payload) {
      state.user = payload;
    },
    SET_EMPLOYEE(state, payload) {
      state.employee = payload;
    },
    LOG_OUT(state) {
      state.user = null;
      state.employee = null;
    }
  },
  actions: {
    getUserInfo({ commit }, payload) {
      const { username, email, employee } = payload;
      commit("SET_USER", { username, email });
      commit("SET_EMPLOYEE", employee);
    }
  }
};
