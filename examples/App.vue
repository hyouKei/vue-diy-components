<template>
  <div id="app">
    <!-- <h3>Vue</h3> -->
    <div id="nav">
      <router-link to="/drawing-board">涂鸦画板</router-link>
      <router-link to="/calendar">万年历</router-link>
    </div>

    <router-view />
  </div>
</template>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  // text-align: center;
  color: #2c3e50;
}

#nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;
    margin-right: 12px;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
