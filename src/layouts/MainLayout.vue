<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="print-hide" elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="leftDrawerOpen = !leftDrawerOpen"
        />
        <q-toolbar-title>
          {{ $t("biotechag") }}
          <!-- <q-circular-progress
            color="white"
            indeterminate
            size="18px"
          ></q-circular-progress> -->
        </q-toolbar-title>

        <q-btn @click="printPage" flat round dense icon="print" />
      </q-toolbar>
    </q-header>

    <q-drawer
      class="print-hide"
      :width="250"
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      content-class="bg-grey-1"
    >
      <q-item>
        <q-item-section class="text-center">
          <q-btn-toggle
            v-model="$i18n.locale"
            class="q-mx-auto"
            no-caps
            rounded
            unelevated
            toggle-color="primary"
            color="white"
            text-color="primary"
            :options="langs"
          />
        </q-item-section>
      </q-item>
      <q-item v-if="employee" to="/account">
        <q-item-section>
          <q-item-label class="text-h6">
            {{ employee.name }}
          </q-item-label>
          <q-item-label>
            {{ employee.post }}
          </q-item-label>
          <q-item-label>
            <q-icon size="18" name="call" /> {{ employee.phone }}
          </q-item-label>
          <q-item-label>
            <q-icon size="18" name="location_on" /> {{ employee.area }}
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-list class="q-mt-md" separator>
        <q-item
          exact
          exact-active-class="active-state"
          v-for="route in routes"
          :key="route.name"
          :to="route.path"
        >
          <q-item-section avatar>
            <q-avatar color="primary" text-color="white" :icon="route.icon" />
          </q-item-section>
          <q-item-section>
            {{ $t(route.name) }}
          </q-item-section>
        </q-item>
      </q-list>
      <q-btn
        @click="signOut"
        outline
        class="full-width q-mt-md"
        color="primary"
      >
        LOG OUT
      </q-btn>
    </q-drawer>

    <q-page-container>
      <div class="row print-only text-center">
        <div class="col-12 page-header">
          <logo></logo>
          <span>
            <h4
              style="text-align:center;"
              :class="[$i18n.locale === 'bn' ? 'text-h5' : 'text-h4']"
              class="q-mb-none q-mt-sm"
            >
              {{ $t("biotechag") }}
            </h4>
            <p class="subtitle-1 text-left">{{ $t("biotechaddress") }}</p>
          </span>
        </div>
      </div>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import Logo from "components/Logo";

const linksData = [
  { name: "home", path: "/", icon: "home" },
  { name: "products", path: "/products", icon: "grass" },
  { name: "invoices", path: "/invoices", icon: "receipt_long" },
  { name: "transactions", path: "/txns", icon: "request_quote" },
  { name: "dealers", path: "/dealers", icon: "store" }
];

export default {
  name: "MainLayout",
  components: { Logo },
  data() {
    return {
      leftDrawerOpen: false,
      routes: linksData,
      model: "",
      langs: [
        { label: "English", value: "en" },
        { label: "বাংলা", value: "bn" }
      ]
    };
  },

  computed: {
    employee() {
      return this.$store.getters["user/em"];
    },

    toggled: {
      get() {
        return this.$store.getters["alert/toggled"];
      },
      set(val) {
        this.$store.commit("alert/HIDE");
      }
    }
  },
  watch: {
    "$i18n.locale"(val) {
      localStorage.setItem("lang", val);
    }
  },

  methods: {
    printPage() {
      this.leftDrawerOpen = false;
      setTimeout(() => {
        window.print();
      }, 100);
    },
    signOut() {
      this.$q.cookies.remove("AUTH_TOKEN");
      this.$q.cookies.remove("USER_INFO");
      this.$store.commit("user/LOG_OUT");
      this.$router.push("/auth/login");
    }
  }
};
</script>
<style lang="scss">
.active-state {
  background-color: rgba($color: $primary, $alpha: 0.1);
}
.page-header {
  display: flex;
  align-content: center;
  justify-content: center;

  span {
    p {
      margin-bottom: 0;
    }
  }
}
</style>
