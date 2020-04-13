<template>
  <div class="home">
    <div class="left">
      分类
      <div class="category">
        <el-tree :data="directorys"></el-tree>
      </div>标签
      <div class="tag"></div>
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
import sq3 from 'sqlite3'
// const sharedObject = require('electron').remote.getGlobal('sharedObject')
const ipcRenderer = require('electron').ipcRenderer
// const currentPath = sharedObject ? sharedObject.currentPath : null
const sqlite3 = sq3.verbose()

export default {
  name: 'Home',
  data() {
    return {
      directorys: []
    }
  },
  components: {},
  mounted() {
    ipcRenderer.on('open-db', (event, arg) => {
      if (arg) {
        var db
        const that = this
        db = new sqlite3.Database(arg + '\\info.db', function() {
          db.all('select * from km_directory', function(err, rows) {
            if (!err) {
              that.directorys = [
                {
                  label: '一级 1',
                  children: [
                    {
                      label: '二级 1-1',
                      children: [
                        {
                          label: '三级 1-1-1'
                        }
                      ]
                    }
                  ]
                },
                {
                  label: '一级 2',
                  children: [
                    {
                      label: '二级 2-1',
                      children: [
                        {
                          label: '三级 2-1-1'
                        }
                      ]
                    },
                    {
                      label: '二级 2-2',
                      children: [
                        {
                          label: '三级 2-2-1'
                        }
                      ]
                    }
                  ]
                },
                {
                  label: '一级 3',
                  children: [
                    {
                      label: '二级 3-1',
                      children: [
                        {
                          label: '三级 3-1-1'
                        }
                      ]
                    },
                    {
                      label: '二级 3-2',
                      children: [
                        {
                          label: '三级 3-2-1'
                        }
                      ]
                    }
                  ]
                }
              ]
              rows.forEach(row => {
                console.log(row)
              })
            } else {
              console.log(err)
            }
            db.close()
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
.left
  width 250px
  .category
    max-height 300px
    overflow auto
.middle
  width 300px
.main
  width 100%
</style>
