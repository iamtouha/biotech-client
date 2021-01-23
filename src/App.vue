<template>
  <div id="q-app">
    <router-view />
  </div>
</template>
<script>
export default {
  name: "App",
  data() {
    return {};
  }
};
</script>
<style>
.loadingScreen {
  background-color: var(--q-color-primary);
  position: fixed;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  z-index: 9;
}
</style>
