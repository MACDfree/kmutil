<template>
  <div class="home">
    <div class="left">
      分类
      <div class="category">
        <el-tree
          :data="directorys"
          :expand-on-click-node="false"
          :node-key="'id'"
          :default-expand-all="true"
        ></el-tree>
      </div>标签
      <div class="tag">
        <div v-for="tag in tags" :key="tag.id">
          <el-tag :id="tag.id">{{tag.name}}</el-tag>
        </div>
      </div>
    </div>
    <div class="middle">
      <div class="search">
        <el-input
          size="mini"
          placeholder="请输入搜索内容"
          prefix-icon="el-icon-search"
          v-model="searchStr"
        ></el-input>
      </div>
      <div class="list">
        <ul>
          <li></li>
        </ul>
      </div>
    </div>
    <div class="main">主</div>
  </div>
</template>

<script>
// @ is an alias to /src
// import HelloWorld from '@/components/HelloWorld.vue'
import sq3 from 'sqlite3'
// const sharedObject = require('electron').remote.getGlobal('sharedObject')
const ipcRenderer = require('electron').ipcRenderer
// const currentPath = sharedObject ? sharedObject.currentPath : null
const sqlite3 = sq3.verbose()

function findChildren(parent, list) {
  const nodes = []
  list.forEach(row => {
    if (row.PARENT === parent) {
      nodes.push({
        label: row.NAME,
        id: row.ID,
        children: findChildren(row.ID, list)
      })
    }
  })
  return nodes
}

export default {
  name: 'Home',
  data() {
    return {
      directorys: [],
      tags: [],
      searchStr: ''
    }
  },
  components: {},
  mounted() {
    ipcRenderer.on('open-db', (event, arg) => {
      if (arg) {
        var db
        const that = this
        db = new sqlite3.Database(arg + '\\info.db', function() {
          db.all('select * from km_directory order by id desc', function(
            err,
            rows
          ) {
            if (!err) {
              that.directorys.push({
                label: '全部',
                children: findChildren(0, rows)
              })
            } else {
              console.log(err)
            }
          })
          db.all('select * from km_tag order by id desc', function(err, rows) {
            if (!err) {
              rows.forEach(row => {
                that.tags.push({
                  id: row.ID,
                  name: row.NAME
                })
              })
            } else {
              console.log(err)
            }
          })
        })
      }
    })
  }
}
</script>

<style lang="stylus">
.home
  display flex
  height 100%
.left
  width 250px
  .category
    max-height 300px
    overflow auto
  .tag
    max-height 300px
    overflow auto
    div
      margin 4px
    .el-tag
      cursor pointer
.middle
  width 300px
.main
  width 100%
</style>
