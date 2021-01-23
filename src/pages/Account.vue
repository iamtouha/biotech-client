<template>
  <q-page>
    <div class="container">
      <q-card>
        <q-card-section class="text-h5">
          Employee Info
        </q-card-section>
        <q-card-section>
          <q-form @submit="updateInfo">
            <q-input
              type="text"
              v-model="em.name"
              :rules="[rules.info]"
              label="Name"
            ></q-input>
            <q-input
              type="text"
              v-model="em.phone"
              :rules="[rules.phone]"
              label="Phone"
            ></q-input>
            <q-input
              type="text"
              v-model="em.area"
              :rules="[rules.info]"
              label="Area"
            ></q-input>
            <q-btn
              :disable="updateDisabled"
              type="submit"
              :loading="loading"
              class="q-px-lg q-mt-md"
              color="accent"
            >
              {{ $t("update") }}
            </q-btn>
          </q-form>
        </q-card-section>
      </q-card>
      <q-card class="q-mt-lg">
        <q-card-section class="text-h5">
          Update Password
        </q-card-section>
        <q-card-section>
          <q-form @submit="updatePassword">
            <q-input
              type="text"
              :rules="[rules.info]"
              v-model="oldPassword"
              label="Current Password"
            ></q-input>
            <q-input
              type="text"
              v-model="password"
              :rules="[rules.pass]"
              label="New Password"
            ></q-input>
            <q-input
              type="text"
              v-model="rePassword"
              :rules="[rules.rePass]"
              label="Type new password again"
            ></q-input>
            <q-btn
              type="submit"
              :loading="loading"
              class="q-px-lg q-mt-md"
              color="accent"
            >
              {{ $t("update") }}
            </q-btn>
            <q-btn
              flat
              :loading="loading"
              class="q-ml-md q-mt-md text-lowercase"
              @click="forgotPassword"
            >
              Forgot password?
            </q-btn>
          </q-form>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script>
import gql from "graphql-tag";
const updateInfo = gql`
  mutation UpdateEm($id: ID!, $data: editEmployeeInput!) {
    updateEmployee(input: { where: { id: $id }, data: $data }) {
      employee {
        id
        name
        post
        phone
        area
        am {
          id
          name
        }
        rsm {
          id
          name
        }
        md {
          id
          name
        }
      }
    }
  }
`;
export default {
  name: "Account",
  data() {
    return {
      loading: false,
      em: { name: "", phone: "", area: "" },
      password: "",
      rePassword: "",
      oldPassword: "",
      rules: {
        info: v => v.length >= 5 || this.$t("minimum-5-letter"),
        phone: v => v.length >= 11 || this.$t("minimum-11-letter"),
        pass: v => v.length >= 8 || "Minimum 8 characters required",
        rePass: v => v === this.password || "passwords Do not match"
      }
    };
  },
  computed: {
    employee() {
      return this.$store.getters["user/em"];
    },
    updateDisabled() {
      const { name, phone, area } = this.em;
      return (
        this.employee.name === name.trim() &&
        this.employee.area === area.trim() &&
        this.employee.phone === phone.trim()
      );
    }
  },

  created() {
    this.assigmEm(this.employee);
  },
  methods: {
    assigmEm(em) {
      const { name, area, phone } = em;
      this.em = { name, area, phone };
    },
    async updateInfo() {
      this.loading = true;
      try {
        const { name, phone, area } = this.em;
        const { data } = await this.$apollo.mutate({
          mutation: updateInfo,
          variables: {
            id: this.employee?.id,
            data: {
              name: name.trim(),
              phone: phone.trim(),
              area: area.trim()
            }
          }
        });
        this.$store.commit("user/SET_EMPLOYEE", data.updateEmployee.employee);
        this.$q.notify({
          type: "positive",
          message: "Info Updated"
        });
      } catch (error) {
        this.$showError(error);
      }
      this.loading = false;
    },
    async updatePassword() {
      try {
        const email = this.$store.getters["user/user"]?.email;
        await this.$http.post("/auth/local", {
          identifier: email,
          password: this.oldPassword
        });
      } catch (error) {
        this.$showError(error);
      }
    },
    forgotPassword() {
      this.$q.notify("Please contact your Admin to reset password");
    }
  }
};
</script>
