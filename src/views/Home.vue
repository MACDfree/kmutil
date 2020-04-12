<template>
  <div class="home">
    <div class="left">
      <div class="category">分类</div>
      <div class="tag">标签</div>
    </div>
    <div class="middle">
      <div class="search">搜索</div>
      <div class="list">列表</div>
    </div>
    <div class="main">主</div>
  </div>
</template>

<script>
// @ is an alias to /src
// import HelloWorld from '@/components/HelloWorld.vue'

export default {
  name: 'Home',
  components: {}
}
</script>

<style lang="stylus">
.home
  display flex
.left
  width 100px
.middle
  width 150px
.main
  width 100%
</style>
