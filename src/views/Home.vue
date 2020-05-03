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
            <span>{{ doc.title }}</span>
          </li>
        </ul>
      </div>
    </div>
    <div class="main">
      <div>
        <el-input v-model="title" placeholder="请输入标题" size="mini" :disabled="!editable"></el-input>
        <el-select v-model="docType" placeholder="请选择" size="mini" :disabled="true">
          <el-option
            v-for="type in types"
            :key="type.value"
            :label="type.label"
            :value="type.value"
          ></el-option>
        </el-select>
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
          <el-input
            class="input-new-tag"
            v-if="inputVisible"
            v-model="inputValue"
            ref="saveTagInput"
            size="small"
            @keyup.enter.native="handleInputConfirm"
            @blur="handleInputConfirm"
          ></el-input>
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
  </div>
</template>

<script>
// @ is an alias to /src
import { DataBase } from '../utils/sql-util'
import { exec } from 'child_process'
import global from '../utils/global'
import EditArea from '../components/EditArea'
import NewDoc from '../components/NewDoc'
import Init from '../components/Init'
import 'element-tiptap/lib/index.css'
import { remote } from 'electron'
import {
  // listDirectory,
  listTag,
  listDoc,
  deleteDirectory,
  deleteTag,
  deleteDoc,
  addDocTag
} from '../api/db'
import { findChildren } from '../utils/comm-func'
import dirOpt from '../api/dirOpt'
import docOpt from '../api/docOpt'

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
      title: '',
      editable: false,
      visible: false,
      docTags: [],
      docType: 'text',
      showDirectoryEdit: false,
      newDirectoryName: '',
      currentDirectoryId: 0,
      menucurrentDirectoryId: null,
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
      inputValue: ''
    }
  },
  components: {
    EditArea,
    NewDoc,
    Init
  },
  mounted() {},
  methods: {
    initData() {
      const that = this
      const dirList = dirOpt.listDir()
      this.directorys.splice(0, that.directorys.length)
      this.directorys.push({
        label: '文件夹',
        id: 'root',
        children: findChildren('root', dirList)
      })
      listTag()
        .then(rows => {
          that.tags.splice(0, that.tags.length)
          that.tags.push({
            label: '标签',
            id: 0,
            children: rows.map(row => {
              return { label: row.NAME, id: row.ID }
            })
          })
          return listDoc()
        })
        .then(obj => {
          obj.rows.forEach(row => {
            that.docs.splice(0, that.docs.length)
            that.docs.push({
              id: row.ID,
              title: row.TITLE,
              path: row.PATH
            })
          })
        })
        .catch(err => {
          console.log(err)
        })
    },
    treeNodeClick(nodeData) {
      this.currentDirectoryId = nodeData.id
      this.$refs.tagTree.setCurrentKey(null)
      const directoryId = nodeData.id
      this.docs.splice(0, this.docs.length)
      docOpt.listDoc(directoryId).list.forEach(row => {
        this.docs.push({
          id: row.id,
          title: row.title,
          path: row.path
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
            that.menucurrentDirectoryId = nodeData.id
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
              that.menucurrentDirectoryId = nodeData.id
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
                  deleteDirectory(nodeData.id)
                    .then(deleteIds => {
                      deleteIds.forEach(id => {
                        that.$refs.directoryTree.remove(id)
                      })
                      that.$message({
                        type: 'success',
                        message: '删除成功'
                      })
                    })
                    .catch(err => {
                      console.log(err)
                      that.$message({
                        type: 'error',
                        message: '删除失败'
                      })
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
                deleteTag(nodeData.id)
                  .then(tagId => {
                    that.$refs.tagTree.remove(tagId)
                    that.$message({
                      type: 'success',
                      message: '删除成功'
                    })
                  })
                  .catch(err => {
                    console.log(err)
                    that.$message({
                      type: 'error',
                      message: '删除失败'
                    })
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
          label: '删除文档',
          click: function() {
            that
              .$confirm('此操作将删除当前文档, 是否继续?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
              })
              .then(() => {
                deleteDoc(doc)
                  .then(() => {
                    that.docs.splice(
                      that.docs.findIndex(item => item.id === doc.id),
                      1
                    )
                    that.$message({
                      type: 'success',
                      message: '删除成功'
                    })
                  })
                  .catch(err => {
                    console.log(err)
                    that.$message({
                      type: 'error',
                      message: '删除失败'
                    })
                  })
              })
          }
        })
      )
      menu.popup(remote.getCurrentWindow())
    },
    submitDirectory() {
      if (this.isAddChild) {
        const lastId = dirOpt.insertDir(
          this.newDirectoryName,
          this.menucurrentDirectoryId
        )
        this.showDirectoryEdit = false
        this.$refs.directoryTree.append(
          { label: this.newDirectoryName, id: lastId },
          this.menucurrentDirectoryId
        )
      } else {
        dirOpt.updateDir(this.newDirectoryName, this.menucurrentDirectoryId)
        this.showDirectoryEdit = false
        this.$refs.directoryTree.getNode(
          this.menucurrentDirectoryId
        ).data.label = this.newDirectoryName
      }
    },
    tagTreeNodeClick(nodeData) {
      this.$refs.directoryTree.setCurrentKey(null)
      const that = this
      const tagId = nodeData.id
      const dataBase = new DataBase()
      dataBase
        .open()
        .then(() => {
          return dataBase.all(
            'SELECT a.* FROM KM_DOCUMENT a INNER JOIN KM_DOC_TAG b ON a.ID=b.DOC_ID WHERE b.TAG_ID=? ORDER BY a.CREATE_TIME DESC',
            [tagId]
          )
        })
        .then(rows => {
          that.docs.splice(0, that.docs.length)
          rows.forEach(row => {
            that.docs.push({
              id: row.ID,
              title: row.TITLE,
              path: row.PATH
            })
          })
        })
        .catch(err => {
          console.log(err)
        })
        .finally(() => {
          dataBase.close()
        })
    },
    submitTag() {
      const that = this
      const dataBase = new DataBase()
      dataBase
        .open()
        .then(() => {
          return dataBase.run(
            'UPDATE KM_TAG SET UPDATE_TIME=$updateTime,NAME=$name WHERE ID=$id',
            {
              $updateTime: Math.floor(Date.now() / 1000),
              $name: that.newTagName,
              $id: that.currentTagId
            }
          )
        })
        .then(() => {
          that.showTagEdit = false
          that.$refs.tagTree.getNode(that.currentTagId).data.label =
            that.newTagName
        })
        .catch(err => {
          console.log(err)
        })
        .finally(() => {
          dataBase.close()
        })
    },
    showDoc(docId) {
      this.currentDocId = docId
      // const that = this
      // const dataBase = new DataBase()
      const doc = docOpt.findDoc(docId)
      this.content = doc.content
      this.title = doc.title
      this.docType = doc.type
      this.docTags.splice(0, this.docTags.length)
      doc.tags.forEach(row => {
        this.docTags.push({
          id: row.id,
          name: row.name
        })
      })

      // dataBase
      //   .open()
      //   .then(() => {
      //     return dataBase.get(
      //       'select * from km_document where id=? order by id desc',
      //       [docId]
      //     )
      //   })
      //   .then(row => {
      //     that.content = row.CONTENT
      //     that.title = row.TITLE
      //     that.docType = row.TYPE
      //     // 获取文档的标签
      //     return dataBase.all(
      //       'select a.* from KM_TAG a INNER JOIN KM_DOC_TAG b ON a.ID=b.TAG_ID WHERE b.DOC_ID=? order by a.ID desc',
      //       [docId]
      //     )
      //   })
      //   .then(rows => {
      //     that.docTags.splice(0, that.docTags.length)
      //     rows.forEach(row => {
      //       that.docTags.push({
      //         id: row.ID,
      //         name: row.NAME
      //       })
      //     })
      //   })
      //   .catch(err => {
      //     console.log(err)
      //   })
      //   .finally(() => {
      //     dataBase.close()
      //   })
    },
    saveDoc() {
      if (!this.currentDocId) {
        this.editable = false
        return
      }
      if (this.editable) {
        const that = this
        const dataBase = new DataBase()
        dataBase
          .open()
          .then(() => {
            return dataBase.run(
              'update km_document set title=$title,content=$content,update_time=$updateTime where id=$id',
              {
                $title: this.title,
                $content: this.content,
                $updateTime: Math.floor(Date.now() / 1000),
                $id: this.currentDocId
              }
            )
          })
          .then(() => {
            // 同步更新列表
            const currentDoc = that.docs.find(
              doc => doc.id === that.currentDocId
            )
            if (currentDoc) {
              currentDoc.title = that.title
            }
          })
          .catch(err => {
            console.log(err)
          })
          .finally(() => {
            dataBase.close()
          })
      }
      this.editable = !this.editable
    },
    cancelEdit() {
      this.editable = false
    },
    deleteDocTag(tag) {
      const that = this
      const dataBase = new DataBase()
      dataBase
        .open()
        .then(() => {
          return dataBase.run(
            'DELETE FROM KM_DOC_TAG WHERE DOC_ID=? AND TAG_ID IN (SELECT ID FROM KM_TAG WHERE NAME=?)',
            [this.currentDocId, tag.name]
          )
        })
        .then(() => {
          that.docTags.splice(
            that.docTags.findIndex(item => item.name === tag.name),
            1
          )
        })
        .catch(err => {
          console.log(err)
        })
        .finally(() => {
          dataBase.close()
        })
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
        addDocTag(inputValue, this.currentDocId)
          .then(() => {
            that.docTags.push({ name: inputValue })
            return listTag()
          })
          .then(rows => {
            that.tags.splice(0, that.tags.length)
            that.tags.push({
              label: '标签',
              id: 0,
              children: rows.map(row => {
                return { label: row.NAME, id: row.ID }
              })
            })
          })
          .catch(err => {
            console.log(err)
          })
      }
      this.inputVisible = false
      this.inputValue = ''
    },
    openFile() {
      const dataBase = new DataBase()
      dataBase
        .open()
        .then(() => {
          return dataBase.get('SELECT PATH,TYPE FROM KM_DOCUMENT WHERE ID=?', [
            this.currentDocId
          ])
        })
        .then(row => {
          if (row.PATH) {
            let cmd = ''
            // 打开文件
            if (row.TYPE === 'md') {
              cmd = `D:\\Program\\Typora\\Typora.exe ${global.currentPath}\\attach\\${row.PATH}`
            } else if (row.TYPE === 'mm') {
              cmd = `"C:\\Program Files\\XMind\\XMind.exe" ${global.currentPath}\\attach\\${row.PATH}`
            } else if (row.TYPE === 'doc') {
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
        })
        .catch(err => {
          console.log(err)
        })
        .finally(() => {
          dataBase.close()
        })
    },
    refreshDocList(rows) {
      const that = this
      this.docs.splice(0, this.docs.length)
      rows.forEach(row => {
        that.docs.push({
          id: row.id,
          title: row.title,
          path: row.path
        })
      })
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
  height 100%
.left
  width 200px
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
  width 300px
  flex 0 0 300px
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
  .el-input
    width 200px
.main
  width 100%
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
  width 90px
  vertical-align bottom
  margin-bottom 5px
.el-popover>.el-select
  margin 5px 0
</style>
