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
          height="100%"
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
          <li v-for="doc in docs" :key="doc.id" @click="showDoc(doc.id)">{{ doc.title }}</li>
        </ul>
      </div>
    </div>
    <div class="main">
      <div>
        <el-input v-model="title" placeholder="请输入标题" size="mini" :disabled="!editable"></el-input>
        <el-button slot="append" size="mini" @click="saveDoc">{{ editable?'保存修改':'开始编辑' }}</el-button>
        <el-popover placement="top" width="300" v-model="visible">
          <el-tag
            :key="tag"
            v-for="tag in docTags"
            closable
            :disable-transitions="false"
            @close="handleClose(tag)"
          >{{tag}}</el-tag>
          <el-input
            class="input-new-tag"
            v-if="inputVisible"
            v-model="inputValue"
            ref="saveTagInput"
            size="small"
            @keyup.enter.native="handleInputConfirm"
            @blur="handleInputConfirm"
          ></el-input>
          <el-button v-else class="button-new-tag" size="small" @click="showInput">+ 新标签</el-button>
          <el-button slot="reference" size="mini">标签</el-button>
        </el-popover>
      </div>
      <el-tiptap v-model="content" :extensions="extensions" :readonly="!editable" height="100%"></el-tiptap>
    </div>
  </div>
</template>

<script>
// @ is an alias to /src
// import HelloWorld from '@/components/HelloWorld.vue'
import sq3 from 'sqlite3'
import {
  ElementTiptap, // 需要的 extensions
  Doc,
  Text,
  Paragraph,
  Heading,
  Bold,
  Underline,
  Italic,
  Strike,
  ListItem,
  BulletList,
  OrderedList,
  TodoItem,
  TodoList,
  Table,
  TableHeader,
  TableCell,
  TableRow,
  FormatClear,
  History
} from 'element-tiptap'
// import element-tiptap 样式
import 'element-tiptap/lib/index.css'
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
      docs: [],
      searchStr: '',
      content: '',
      title: '',
      editable: false,
      visible: false,
      docTags: ['1', '2'],
      inputVisible: false,
      inputValue: '',
      extensions: [
        new Doc(),
        new Text(),
        new Paragraph(),
        new Heading({ level: 3 }),
        new Bold(), // 在气泡菜单中渲染菜单按钮 { bubble: true }
        new Underline(),
        new Italic(),
        new Strike(),
        new ListItem(),
        new BulletList(),
        new OrderedList(),
        new TodoItem(),
        new TodoList(),
        new Table(),
        new TableHeader(),
        new TableCell(),
        new TableRow(),
        new FormatClear(),
        new History()
      ]
    }
  },
  components: {
    'el-tiptap': ElementTiptap
  },
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
          db.all('select * from km_document order by id desc', function(
            err,
            rows
          ) {
            if (!err) {
              rows.forEach(row => {
                that.docs.push({
                  id: row.ID,
                  title: row.TITLE
                })
              })
            } else {
              console.log(err)
            }
          })
        })
      }
    })
  },
  methods: {
    showDoc(docId) {
      console.log(docId)
    },
    saveDoc() {
      this.editable = !this.editable
      document.getElementsByClassName(
        'el-tiptap-editor__menu-bar'
      )[0].style.display = this.editable ? 'flex' : 'none'
    },
    handleClose(tag) {
      this.docTags.splice(this.docTags.indexOf(tag), 1)
    },
    showInput() {
      this.inputVisible = true
      this.$nextTick(_ => {
        this.$refs.saveTagInput.$refs.input.focus()
      })
    },
    handleInputConfirm() {
      const inputValue = this.inputValue
      if (inputValue) {
        this.docTags.push(inputValue)
      }
      this.inputVisible = false
      this.inputValue = ''
    }
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
  .list li
    text-align left
    cursor pointer
.main
  width 100%
  display flex
  flex-direction column
  align-items flex-start
  .el-input
    width 200px
.el-tiptap-editor__menu-bar, .el-tiptap-editor>.el-tiptap-editor__content, .el-tiptap-editor__footer
  border 0
.el-tiptap-editor__menu-bar:before
  height 0
.el-tiptap-editor>.el-tiptap-editor__content
  padding 10px
.el-tag
  margin-right 5px
  margin-bottom 5px
.button-new-tag
  height 32px
  line-height 30px
  padding-top 0
  padding-bottom 0
  margin-bottom 5px
.input-new-tag
  width 90px
  vertical-align bottom
  margin-bottom 5px
</style>
