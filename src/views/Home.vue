<template>
  <div class="home">
    <div class="left">
      <div class="category">
        <el-tree
          :indent="10"
          :data="directorys"
          :expand-on-click-node="false"
          node-key="id"
          :default-expand-all="true"
          ref="directoryTree"
          @node-click="treeNodeClick"
          @node-contextmenu="treeNodeMenu"
          height="100%"
          :highlight-current="true"
          icon-class="el-icon-arrow-right"
        >
          <span class="directory-tree-node" slot-scope="{ node }">
            <i class="el-icon-folder"></i>
            <span>{{ node.label }}</span>
          </span>
        </el-tree>
      </div>
      <div class="tag">
        <el-tree
          :indent="10"
          :data="tags"
          :expand-on-click-node="false"
          :node-key="'id'"
          :default-expand-all="true"
          ref="tagTree"
          @node-click="tagTreeNodeClick"
          @node-contextmenu="tagTreeNodeMenu"
          height="100%"
          :highlight-current="true"
          icon-class="el-icon-arrow-right"
        >
          <span class="tag-tree-node" slot-scope="{ node }">
            <i class="el-icon-collection-tag"></i>
            <span>{{ node.label }}</span>
          </span>
        </el-tree>
      </div>
    </div>
    <div class="middle">
      <div class="search">
        <el-input
          size="mini"
          placeholder="请输入搜索内容"
          prefix-icon="el-icon-search"
          v-model="searchStr"
          @keyup.enter.native="searchDoc"
        ></el-input>
        <NewDoc
          :default-doc-type="'text'"
          :directory-id="currentDirectoryId"
          @refresh-doc="refreshDocList"
        ></NewDoc>
      </div>
      <div class="list">
        <ul>
          <li
            v-for="doc in docs"
            :key="doc.id"
            @click="showDoc(doc.id)"
            :class="{active: doc.id===currentDocId}"
            @click.right="docMenu(doc)"
          >
            <div>
              <i :class="docIcon(doc.type)"></i>
              {{ doc.title }}
            </div>
            <div class="time">
              <span>A：{{ doc.createTime }}</span>
              <br />
              <span>M：{{ doc.updateTime }}</span>
            </div>
          </li>
        </ul>
      </div>
    </div>
    <div class="main">
      <div>
        <el-input v-model="title" placeholder="请输入标题" size="mini" :disabled="!editable"></el-input>
        <el-button size="mini" @click="saveDoc">{{ editable?'保存修改':'开始编辑' }}</el-button>
        <el-button size="mini" @click="cancelEdit" v-if="editable">取消编辑</el-button>
        <el-popover placement="top" width="300" v-model="visible">
          <el-tag
            :key="tag.id"
            v-for="tag in docTags"
            :closable="editable"
            :disable-transitions="false"
            @close="deleteDocTag(tag)"
          >{{tag.name}}</el-tag>
          <el-autocomplete
            class="input-new-tag"
            v-if="inputVisible"
            v-model="inputValue"
            ref="saveTagInput"
            size="small"
            @keyup.enter.native="handleInputConfirm"
            @blur="handleInputConfirmBlur"
            :fetch-suggestions="listTag"
          ></el-autocomplete>
          <el-button
            v-else
            class="button-new-tag"
            size="small"
            @click="showInput"
            :style="{display: editable?'inline-block':'none'}"
          >+ 新标签</el-button>
          <el-button slot="reference" size="mini">标签</el-button>
        </el-popover>
        <el-button size="mini" v-if="showOpenFile" @click="openFile">打开文件</el-button>
      </div>
      <EditArea v-model="content" :editable="editable"></EditArea>
    </div>
    <el-dialog title="修改文件夹名称" :visible.sync="showDirectoryEdit" width="30%">
      <el-input v-model="newDirectoryName" placeholder="请输入文件夹名称"></el-input>
      <span slot="footer" class="dialog-footer">
        <el-button @click="showDirectoryEdit = false;newDirectoryName=''">取 消</el-button>
        <el-button type="primary" @click="submitDirectory">确 定</el-button>
      </span>
    </el-dialog>
    <el-dialog title="修改标签名称" :visible.sync="showTagEdit" width="30%">
      <el-input v-model="newTagName" placeholder="请输入标签名称"></el-input>
      <span slot="footer" class="dialog-footer">
        <el-button @click="showTagEdit = false;newTagName=''">取 消</el-button>
        <el-button type="primary" @click="submitTag">确 定</el-button>
      </span>
    </el-dialog>
    <Init @init-finish="initData"></Init>
    <Setting></Setting>
    <MoveDoc :show.sync="moveDocShow" :doc="menuCurrentDoc" @after-move="afterMove"></MoveDoc>
  </div>
</template>

<script>
// @ is an alias to /src
import { exec } from 'child_process'
import global from '../utils/global'
import EditArea from '../components/EditArea'
import NewDoc from '../components/NewDoc'
import Init from '../components/Init'
import Setting from '../components/Setting'
import MoveDoc from '../components/MoveDoc'
import { remote } from 'electron'
import { findChildren } from '../utils/comm-func'
import dirOpt from '../api/dirOpt'
import docOpt from '../api/docOpt'
import tagOpt from '../api/tagOpt'
import moment from 'moment'
import Store from 'electron-store'
const store = new Store()

export default {
  name: 'Home',
  data() {
    return {
      directorys: [],
      tags: [],
      docs: [],
      searchStr: '',
      content: '',
      currentDocId: null,
      menuCurrentDoc: {},
      title: '',
      editable: false,
      visible: false,
      docTags: [],
      docType: 'text',
      docPath: '',
      showDirectoryEdit: false,
      newDirectoryName: '',
      currentDirectoryId: 'root',
      menuCurrentDirectoryId: null,
      isAddChild: false,
      currentTagId: null,
      showTagEdit: false,
      newTagName: '',
      types: [
        {
          value: 'md',
          label: 'Markdown'
        },
        {
          value: 'mm',
          label: '脑图'
        },
        {
          value: 'doc',
          label: 'Word'
        },
        {
          value: 'text',
          label: '文本'
        }
      ],
      inputVisible: false,
      inputValue: '',
      moveDocShow: false
    }
  },
  components: {
    EditArea,
    NewDoc,
    Init,
    Setting,
    MoveDoc
  },
  mounted() {},
  methods: {
    initData() {
      const dirList = dirOpt.listDir()
      this.directorys.splice(0, this.directorys.length)
      this.directorys.push({
        label: '文件夹',
        id: 'root',
        children: findChildren('root', dirList)
      })

      const tagList = tagOpt.listTag()
      this.tags.splice(0, this.tags.length)
      this.tags.push({
        label: '标签',
        id: 0,
        children: tagList.map(row => {
          return { label: row.name, id: row.id }
        })
      })

      this.docs.splice(0, this.docs.length)
      docOpt.listDoc().list.forEach(row => {
        this.docs.push({
          id: row.id,
          title: row.title,
          path: row.path,
          type: row.type,
          directoryId: row.directoryId,
          createTime: moment(row.createTime).format('YYYY-MM-DD HH:mm:ss'),
          updateTime: moment(row.updateTime).format('YYYY-MM-DD HH:mm:ss')
        })
      })
    },
    treeNodeClick(nodeData) {
      this.currentDirectoryId = nodeData.id
      this.$refs.tagTree.setCurrentKey(null)
      this.docs.splice(0, this.docs.length)
      docOpt.listDoc(this.currentDirectoryId).list.forEach(row => {
        this.docs.push({
          id: row.id,
          title: row.title,
          path: row.path,
          type: row.type,
          directoryId: row.directoryId,
          createTime: moment(row.createTime).format('YYYY-MM-DD HH:mm:ss'),
          updateTime: moment(row.updateTime).format('YYYY-MM-DD HH:mm:ss')
        })
      })
    },
    treeNodeMenu(event, nodeData) {
      const Menu = remote.Menu
      const MenuItem = remote.MenuItem
      const menu = new Menu()
      const that = this
      menu.append(
        new MenuItem({
          label: '新增子文件夹',
          click: function() {
            that.menuCurrentDirectoryId = nodeData.id
            that.newDirectoryName = ''
            that.isAddChild = true
            that.showDirectoryEdit = true
          }
        })
      )
      if (nodeData.id !== 0) {
        menu.append(
          new MenuItem({
            label: '修改文件夹',
            click: function() {
              that.menuCurrentDirectoryId = nodeData.id
              that.newDirectoryName = nodeData.label
              that.isAddChild = false
              that.showDirectoryEdit = true
            }
          })
        )
        // 根节点不允许删除
        menu.append(
          new MenuItem({
            label: '删除文件夹',
            click: function() {
              that
                .$confirm(
                  '此操作将同时删除当前文件夹下所有文档, 是否继续?',
                  '提示',
                  {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                  }
                )
                .then(() => {
                  const deleteIds = dirOpt.deleteDir(nodeData.id)
                  deleteIds.forEach(id => {
                    that.$refs.directoryTree.remove(id)
                  })
                  that.$message({
                    type: 'success',
                    message: '删除成功'
                  })
                })
            }
          })
        )
      }
      menu.popup(remote.getCurrentWindow())
    },
    tagTreeNodeMenu(event, nodeData) {
      if (nodeData.id === 0) {
        return
      }

      const Menu = remote.Menu
      const MenuItem = remote.MenuItem
      const menu = new Menu()
      const that = this
      menu.append(
        new MenuItem({
          label: '修改标签',
          click: function() {
            that.currentTagId = nodeData.id
            that.newTagName = nodeData.label
            that.showTagEdit = true
          }
        })
      )
      menu.append(
        new MenuItem({
          label: '删除标签',
          click: function() {
            that
              .$confirm('此操作将删除当前标签, 是否继续?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
              })
              .then(() => {
                tagOpt.deleteTag(nodeData.id)
                that.$refs.tagTree.remove(nodeData.id)
                that.$message({
                  type: 'success',
                  message: '删除成功'
                })
              })
          }
        })
      )
      menu.popup(remote.getCurrentWindow())
    },
    docMenu(doc) {
      const Menu = remote.Menu
      const MenuItem = remote.MenuItem
      const menu = new Menu()
      const that = this
      menu.append(
        new MenuItem({
          label: '移动文档',
          click: function() {
            that.menuCurrentDoc = { id: doc.id, directoryId: doc.directoryId }
            that.moveDocShow = true
          }
        })
      )
      menu.append(
        new MenuItem({
          label: '删除文档',
          click: function() {
            that
              .$confirm('此操作将删除当前文档, 是否继续?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
              })
              .then(() => {
                docOpt.deleteDoc([doc.id])
                that.docs.splice(
                  that.docs.findIndex(item => item.id === doc.id),
                  1
                )
                that.$message({
                  type: 'success',
                  message: '删除成功'
                })
              })
          }
        })
      )
      menu.popup(remote.getCurrentWindow())
    },
    afterMove() {
      // 文档移动后需要刷新中间的文档列表
      this.docs.splice(0, this.docs.length)
      docOpt.listDoc(this.currentDirectoryId).list.forEach(row => {
        this.docs.push({
          id: row.id,
          title: row.title,
          path: row.path,
          type: row.type,
          directoryId: row.directoryId,
          createTime: moment(row.createTime).format('YYYY-MM-DD HH:mm:ss'),
          updateTime: moment(row.updateTime).format('YYYY-MM-DD HH:mm:ss')
        })
      })
    },
    submitDirectory() {
      if (this.isAddChild) {
        const lastId = dirOpt.insertDir(
          this.newDirectoryName,
          this.menuCurrentDirectoryId
        )
        this.showDirectoryEdit = false
        this.$refs.directoryTree.append(
          { label: this.newDirectoryName, id: lastId },
          this.menuCurrentDirectoryId
        )
      } else {
        dirOpt.updateDir(this.newDirectoryName, this.menuCurrentDirectoryId)
        this.showDirectoryEdit = false
        this.$refs.directoryTree.getNode(
          this.menuCurrentDirectoryId
        ).data.label = this.newDirectoryName
      }
    },
    tagTreeNodeClick(nodeData) {
      this.$refs.directoryTree.setCurrentKey(null)
      const tagId = nodeData.id
      this.docs.splice(0, this.docs.length)
      docOpt.listDocByTagId(tagId).forEach(row => {
        this.docs.push({
          id: row.id,
          title: row.title,
          path: row.path,
          type: row.type,
          directoryId: row.directoryId,
          createTime: moment(row.createTime).format('YYYY-MM-DD HH:mm:ss'),
          updateTime: moment(row.updateTime).format('YYYY-MM-DD HH:mm:ss')
        })
      })
    },
    submitTag() {
      tagOpt.updateTag(this.currentTagId, this.newTagName)
      this.showTagEdit = false
      this.$refs.tagTree.getNode(this.currentTagId).data.label = this.newTagName
    },
    showDoc(docId) {
      this.currentDocId = docId
      const doc = docOpt.findDoc(docId)
      this.content = doc.content
      this.title = doc.title
      this.docType = doc.type
      this.docPath = doc.path
      this.docTags.splice(0, this.docTags.length)
      tagOpt.listDocTag(docId).forEach(row => {
        this.docTags.push({
          id: row.id,
          name: row.name
        })
      })
    },
    saveDoc() {
      if (!this.currentDocId) {
        this.editable = false
        return
      }
      if (this.editable) {
        docOpt.updateDoc(this.currentDocId, this.title, this.content)
        // 同步更新列表
        const currentDoc = this.docs.find(doc => doc.id === this.currentDocId)
        if (currentDoc) {
          currentDoc.title = this.title
        }
      }
      this.editable = !this.editable
    },
    cancelEdit() {
      this.editable = false
    },
    deleteDocTag(tag) {
      tagOpt.deleteDocTag(tag.name, this.currentDocId)
      this.docTags.splice(
        this.docTags.findIndex(item => item.name === tag.name),
        1
      )
    },
    listTag(queryString, cb) {
      console.log(queryString)
      const tags = tagOpt.searchTag(queryString)
      console.log(tags.map(tag => tag.name))
      cb(
        tags.map(tag => {
          return { value: tag.name }
        })
      )
    },
    showInput() {
      this.inputVisible = true
      this.$nextTick(_ => {
        this.$refs.saveTagInput.$refs.input.focus()
      })
    },
    handleInputConfirm(event) {
      const inputValue = this.inputValue
      if (inputValue) {
        // 校验标签是否重复
        if (this.docTags.findIndex(item => item.name === inputValue) > -1) {
          this.$message({
            message: `标签 ${inputValue} 已存在`,
            type: 'warning'
          })
          return
        }
        const that = this
        // 判断标签是否存在
        tagOpt.insertDocTag(inputValue, this.currentDocId)
        this.docTags.push({ name: inputValue })
        const tagList = tagOpt.listTag()
        this.tags.splice(0, that.tags.length)
        this.tags.push({
          label: '标签',
          id: 'root',
          children: tagList.map(row => {
            return { label: row.name, id: row.id }
          })
        })
      }
      this.inputVisible = false
      this.inputValue = ''
    },
    handleInputConfirmBlur(event) {
      setTimeout(this.handleInputConfirm, 500)
    },
    openFile() {
      if (this.docPath) {
        let cmd = ''
        const filePath = `${global().currentPath}\\attach\\${this.docPath}`
        // 打开文件
        if (this.docType === 'md') {
          const s = store.get('markdown')
          if (!s) {
            this.$message({
              message: '请先设置Markdown程序路径',
              type: 'warning'
            })
            return
          }
          // eslint-disable-next-line no-template-curly-in-string
          cmd = s.replace('${filePath}', filePath)
        } else if (this.docType === 'mm') {
          const s = store.get('mindmap')
          if (!s) {
            this.$message({
              message: '请先设置脑图程序路径',
              type: 'warning'
            })
            return
          }
          // eslint-disable-next-line no-template-curly-in-string
          cmd = s.replace('${filePath}', filePath)
        } else if (this.docType === 'doc') {
          // TODO
        }
        if (cmd) {
          exec(cmd, function(err, stdout, stderr) {
            if (err) {
              console.log(err)
            }
          })
        }
      }
    },
    refreshDocList(rows) {
      const that = this
      this.docs.splice(0, this.docs.length)
      rows.forEach(row => {
        that.docs.push({
          id: row.id,
          title: row.title,
          path: row.path,
          type: row.type,
          directoryId: row.directoryId,
          createTime: moment(row.createTime).format('YYYY-MM-DD HH:mm:ss'),
          updateTime: moment(row.updateTime).format('YYYY-MM-DD HH:mm:ss')
        })
      })
    },
    searchDoc() {
      const dirId = this.currentDirectoryId
      const str = '.*' + this.searchStr + '.*'
      const reg = new RegExp(str)
      this.docs.splice(0, this.docs.length)
      docOpt
        .listDoc(dirId)
        .list.filter(function(doc) {
          return reg.test(doc.title) || reg.test(doc.content)
        })
        .forEach(row => {
          this.docs.push({
            id: row.id,
            title: row.title,
            path: row.path,
            type: row.type,
            directoryId: row.directoryId,
            createTime: moment(row.createTime).format('YYYY-MM-DD HH:mm:ss'),
            updateTime: moment(row.updateTime).format('YYYY-MM-DD HH:mm:ss')
          })
        })
    },
    docIcon(type) {
      switch (type) {
        case 'md':
          return 'iconfont el-icon-custom-markdown-line'
        case 'mm':
          return 'iconfont el-icon-custom-icons-mind_map'
        case 'doc':
          return 'iconfont el-icon-custom-word'
        default:
          return 'el-icon-document'
      }
    }
  },
  computed: {
    showOpenFile() {
      return this.docType !== 'text'
    }
  }
}
</script>

<style lang="stylus">
.home
  display flex
  min-height 100vh
  min-width 980px
.left
  flex 0 0 200px
  .category
    overflow auto
    .directory-tree-node>span
      padding-left 5px
  .tag
    overflow auto
  .el-tree-node
    margin 2px
.middle
  flex 0 0 246px
  text-align left
  .list li
    text-align left
    cursor pointer
    display block
    padding 7px 12px
    &:hover
      background-color #F5F7FA
    &.active
      background-color #f0f7ff
    .time
      font-size 11px
      padding-left 2px
      font-family Consolas, 'Courier New', Courier, FreeMono, monospace
  .el-input
    width 200px
.main
  flex 1 1 auto
  display flex
  flex-direction column
  align-items flex-start
  .el-input
    width 200px
  .el-select>.el-input
    width 110px
  .el-button+.el-button
    margin-left 0
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
  width 120px
  vertical-align bottom
  margin-bottom 5px
.el-popover>.el-select
  margin 5px 0
</style>
