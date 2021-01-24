<template>
  <q-page class="flex flex-center q-pa-md">
    <q-card style="width:100%; max-width:500px;">
      <q-card-section>
        <h5 class="text-h5 q-my-sm">Log In</h5>
        <q-input
          v-model="input.identifier"
          clearable
          autofocus
          label="Email or username"
        />
        <q-input
          tabindex="0"
          v-model="input.password"
          clearable
          :type="isPwd ? 'text' : 'password'"
          label="Password"
        >
          <template v-slot:append>
            <q-icon
              tabindex="1"
              :name="isPwd ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="isPwd = !isPwd"
            />
          </template>
        </q-input>
      </q-card-section>
      <q-card-actions>
        <q-btn
          @click="login"
          :loading="loading"
          class="q-px-lg q-py-xs bg-accent text-dark"
        >
          {{ $t("login") }}
        </q-btn>
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script>
import gql from "graphql-tag";
import Login from "src/apollo/mutations/login.gql";
import Employee from "src/apollo/queries/employee.gql";

export default {
  name: "Login",
  data: () => ({
    input: { identifier: "", password: "" },
    isPwd: false,
    loading: false
  }),
  created() {
    const user = this.$store.getters["user/user"];
    if (user) {
      this.$router.push("/");
    }
  },
  methods: {
    login: async function() {
      this.loading = true;
      try {
        // log in
        const mutation = this.$apollo.mutate({
          mutation: Login,
          fetchPolicy: "no-cache",
          variables: {
            input: this.input
          }
        });
        const resp = await mutation;
        const token = resp.data.login?.jwt;
        this.$q.cookies.set("AUTH_TOKEN", token, { expires: "15d" });

        // fetch and save userInfo
        const { data } = await this.$apollo.query({
          query: Employee,
          fetchPolicy: "no-cache"
        });
        this.$store.dispatch("user/getUserInfo", data.self);
        const userData = JSON.stringify(data.self);
        this.$q.cookies.set("USER_INFO", userData, { expires: "15d" });

        this.$q.notify({ message: "Log in successful", type: "positive" });
        this.$router.push("/");
      } catch (error) {
        this.$showError(error);
      }
      this.loading = false;
    }
  }
};
</script>
