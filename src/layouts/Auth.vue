<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container class="bg-primary">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
const linksData = [];

export default {
  name: "AuthLayout",
  data() {
    return {
      leftDrawerOpen: false,
      essentialLinks: linksData
    };
  }
};
</script>
