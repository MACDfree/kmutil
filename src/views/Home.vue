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
          ref="directoryTree"
          @node-click="treeNodeClick"
          height="100%"
          :highlight-current="true"
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
        <el-popover placement="top" width="160" v-model="newDocVisible">
          <p>文档类型</p>
          <el-select v-model="newDocType" placeholder="请选择" size="mini">
            <el-option
              v-for="type in types"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            ></el-option>
          </el-select>
          <div style="text-align: right; margin: 0">
            <el-button size="mini" type="text" @click="newDocVisible = false">取消</el-button>
            <el-button type="primary" size="mini" @click="newDoc()">确定</el-button>
          </div>
          <el-button slot="reference" size="mini" icon="el-icon-document-add"></el-button>
        </el-popover>
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
        <el-select v-model="docType" placeholder="请选择" size="mini" :disabled="true">
          <el-option
            v-for="type in types"
            :key="type.value"
            :label="type.label"
            :value="type.value"
          ></el-option>
        </el-select>
        <el-button size="mini" @click="saveDoc">{{ editable?'保存修改':'开始编辑' }}</el-button>
        <el-popover placement="top" width="300" v-model="visible">
          <el-tag
            :key="tag.id"
            v-for="tag in docTags"
            :closable="editable"
            :disable-transitions="false"
            @close="handleClose(tag)"
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
      <el-tiptap
        v-model="content"
        :extensions="extensions"
        :readonly="!editable"
        height="100%"
        :class="{readonly: !editable}"
      ></el-tiptap>
    </div>
    <el-dialog title="提示" :visible.sync="showUploader" width="100%" :before-close="handleClose">
      <el-upload
        action="abc"
        class="upload-demo"
        drag
        :accept="allowType"
        :auto-upload="false"
        :http-request="upload"
        ref="uploader"
      >
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">
          将文件拖到此处，或
          <em>点击上传</em>
        </div>
        <div class="el-upload__tip" slot="tip">只能上传{{ allowType }}文件，且不超过500kb</div>
      </el-upload>
      <span slot="footer" class="dialog-footer">
        <el-button @click="showUploader = false">取 消</el-button>
        <el-button type="primary" @click="submitUpload">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
// @ is an alias to /src
// import HelloWorld from '@/components/HelloWorld.vue'
// import sq3 from 'sqlite3'
import db from '../utils/sql-util'
import { createMDFile, copyFile } from '../utils/file-util'
import { exec } from 'child_process'
import global from '../utils/global'
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
      currentDocId: null,
      title: '',
      editable: false,
      visible: false,
      newDocVisible: false,
      newDocType: 'text',
      docTags: [],
      docType: 'text',
      showUploader: false,
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
    const that = this
    db.all('select * from km_directory order by id desc', function(err, rows) {
      if (!err) {
        that.directorys.push({
          label: '全部',
          children: findChildren(0, rows)
        })
      } else {
        console.log(err)
      }
    })
      .all('select * from km_tag order by id desc', function(err, rows) {
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
      .all('select * from km_document order by id desc', function(err, rows) {
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
  },
  methods: {
    treeNodeClick(nodeData) {
      const that = this
      const directoryId = nodeData.id
      db.all(
        'select * from km_document where directory_id=? order by id desc',
        [directoryId],
        function(err, rows) {
          if (!err) {
            that.docs.splice(0, that.docs.length)
            rows.forEach(row => {
              that.docs.push({
                id: row.ID,
                title: row.TITLE
              })
            })
          } else {
            console.log(err)
          }
        }
      )
    },
    newDoc() {
      const that = this
      let path = ''
      // 先新增个记录
      if (this.newDocType === 'md') {
        // 需要新增md文件
        path = createMDFile()
      } else if (this.newDocType === 'doc' || this.newDocType === 'mm') {
        // 需要导入文件
        this.showUploader = true
        return
      }
      db.run(
        'insert into KM_DOCUMENT (create_time,update_time,title,content,type,directory_id,path) values ($createTime,$updateTime,$title,$content,$type,$directoryId,$path)',
        {
          $createTime: Math.floor(Date.now() / 1000),
          $updateTime: Math.floor(Date.now() / 1000),
          $title: '未命名',
          $content: '',
          $type: this.newDocType,
          $directoryId: this.$refs.directoryTree.getCurrentKey() || 0,
          $path: path
        },
        function(err) {
          if (!err) {
            // 再刷新表格
            const directoryId = that.$refs.directoryTree.getCurrentKey() || 0
            db.all(
              'select * from km_document where directory_id=? order by id desc',
              [directoryId],
              function(err, rows) {
                if (!err) {
                  that.docs.splice(0, that.docs.length)
                  rows.forEach(row => {
                    that.docs.push({
                      id: row.ID,
                      title: row.TITLE
                    })
                  })
                } else {
                  console.log(err)
                }
              }
            )
          } else {
            console.log(err)
          }
        }
      )
      this.newDocVisible = false
    },
    showDoc(docId) {
      this.currentDocId = docId
      const that = this
      db.get(
        'select * from km_document where id=? order by id desc',
        [docId],
        function(err, row) {
          if (!err && row) {
            that.content = row.CONTENT
            that.title = row.TITLE
            that.docType = row.TYPE
            // 获取文档的标签
            db.all(
              'select a.* from KM_TAG a INNER JOIN KM_DOC_TAG b ON a.ID=b.TAG_ID WHERE b.DOC_ID=? order by a.ID desc',
              [docId],
              function(err, rows) {
                that.docTags.splice(0, that.docTags.length)
                if (!err) {
                  rows.forEach(row => {
                    that.docTags.push({
                      id: row.ID,
                      name: row.NAME
                    })
                  })
                } else {
                  console.log(err)
                }
              }
            )
          } else {
            console.log(err)
          }
        }
      )
    },
    saveDoc() {
      if (!this.currentDocId) {
        this.editable = false
        return
      }
      if (this.editable) {
        const that = this
        db.run(
          'update km_document set title=$title,content=$content,update_time=$updateTime where id=$id',
          {
            $title: this.title,
            $content: this.content,
            $updateTime: Math.floor(Date.now() / 1000),
            $id: this.currentDocId
          },
          function(err) {
            if (!err) {
              // 同步更新列表
              const currentDoc = that.docs.find(
                doc => doc.id === that.currentDocId
              )
              if (currentDoc) {
                currentDoc.title = that.title
              }
            } else {
              console.log(err)
            }
          }
        )
      }
      this.editable = !this.editable
    },
    handleClose(tag) {
      const that = this
      db.run(
        'DELETE FROM KM_DOC_TAG WHERE DOC_ID=? AND TAG_ID IN (SELECT ID FROM KM_TAG WHERE NAME=?)',
        [this.currentDocId, tag.name],
        function(err) {
          if (!err) {
            that.docTags.splice(
              that.docTags.findIndex(item => item.name === tag.name),
              1
            )
          } else {
            console.log(err)
          }
        }
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
        db.get(
          'SELECT COUNT(*) a FROM KM_TAG WHERE NAME=?',
          [inputValue],
          function(err, row) {
            if (!err) {
              db.serialize(function() {
                db.run('BEGIN')
                try {
                  if (row.a === 0) {
                    db.run(
                      'INSERT INTO KM_TAG (CREATE_TIME,UPDATE_TIME,NAME) VALUES ($createTime,$updateTime,$name)',
                      {
                        $createTime: Math.floor(Date.now() / 1000),
                        $updateTime: Math.floor(Date.now() / 1000),
                        $name: inputValue
                      }
                    )
                  }
                  db.run(
                    'INSERT INTO KM_DOC_TAG (DOC_ID,TAG_ID) SELECT ' +
                      that.currentDocId +
                      ' DOC_ID, ID TAG_ID FROM KM_TAG WHERE NAME=?',
                    [inputValue]
                  )
                  that.docTags.push({ name: inputValue })
                  db.run('COMMIT')
                } catch (err2) {
                  console.log(err2)
                  db.run('ROLLBACK')
                }
              })
            } else {
              console.log(err)
            }
          }
        )
      }
      this.inputVisible = false
      this.inputValue = ''
    },
    openFile() {
      db.get(
        'SELECT PATH,TYPE FROM KM_DOCUMENT WHERE ID=?',
        [this.currentDocId],
        function(err, row) {
          if (!err) {
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
          } else {
            console.log(err)
          }
        }
      )
    },
    upload(arg) {
      const path = copyFile(arg.file)
      const that = this
      db.run(
        'insert into KM_DOCUMENT (create_time,update_time,title,content,type,directory_id,path) values ($createTime,$updateTime,$title,$content,$type,$directoryId,$path)',
        {
          $createTime: Math.floor(Date.now() / 1000),
          $updateTime: Math.floor(Date.now() / 1000),
          $title: '未命名',
          $content: '',
          $type: this.newDocType,
          $directoryId: this.$refs.directoryTree.getCurrentKey() || 0,
          $path: path
        },
        function(err) {
          if (!err) {
            // 再刷新表格
            const directoryId = that.$refs.directoryTree.getCurrentKey() || 0
            db.all(
              'select * from km_document where directory_id=? order by id desc',
              [directoryId],
              function(err, rows) {
                if (!err) {
                  that.docs.splice(0, that.docs.length)
                  rows.forEach(row => {
                    that.docs.push({
                      id: row.ID,
                      title: row.TITLE
                    })
                  })
                } else {
                  console.log(err)
                }
              }
            )
          } else {
            console.log(err)
          }
        }
      )
      this.newDocVisible = false
      this.showUploader = false
    },
    submitUpload() {
      this.$refs.uploader.submit()
    }
  },
  computed: {
    showOpenFile() {
      return this.docType !== 'text'
    },
    allowType() {
      switch (this.newDocType) {
        case 'doc':
          return '.doc,.docx'
        case 'mm':
          return '.xmind'
        default:
          return ''
      }
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
  flex 0 0 300px
  text-align left
  .list li
    text-align left
    cursor pointer
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
  .el-tiptap-editor__menu-bar, .el-tiptap-editor>.el-tiptap-editor__content, .el-tiptap-editor__footer
    border 0
  .el-tiptap-editor__menu-bar:before
    height 0
  .el-tiptap-editor>.el-tiptap-editor__content
    padding 10px
  .readonly .el-tiptap-editor__menu-bar
    display none
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
