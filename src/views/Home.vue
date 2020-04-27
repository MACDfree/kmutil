<template>
  <div class="home">
    <div class="left">
      <div class="category">
        <el-tree
          :indent="10"
          :data="directorys"
          :expand-on-click-node="false"
          :node-key="'id'"
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
      <el-tiptap
        v-model="content"
        :extensions="extensions"
        :readonly="!editable"
        height="100%"
        :class="{readonly: !editable}"
      ></el-tiptap>
    </div>
    <el-dialog title="导入文档" :visible.sync="showUploader" width="100%">
      <el-upload
        action="empty"
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
  </div>
</template>

<script>
// @ is an alias to /src
// import HelloWorld from '@/components/HelloWorld.vue'
// import sq3 from 'sqlite3'
import db from '../utils/sql-util'
import { createMDFile, copyFile, deleteFile } from '../utils/file-util'
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
import { remote } from 'electron'

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

function findChildIds(list, pid, deleteIds) {
  list.forEach(row => {
    if (row.PARENT === pid) {
      deleteIds.push(row.ID)
      findChildIds(list, row.ID, deleteIds)
    }
  })
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
      showDirectoryEdit: false,
      newDirectoryName: '',
      currentDirectoryId: null,
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
    db.all('select * from km_directory order by create_time', function(
      err,
      rows
    ) {
      if (!err) {
        that.directorys.push({
          label: '文件夹',
          id: 0,
          children: findChildren(0, rows)
        })
      } else {
        console.log(err)
      }
    })
      .all('select * from km_tag order by create_time desc', function(
        err,
        rows
      ) {
        if (!err) {
          that.tags.push({
            label: '标签',
            id: 0,
            children: rows.map(row => {
              return { label: row.NAME, id: row.ID }
            })
          })
        } else {
          console.log(err)
        }
      })
      .all('select * from km_document order by create_time desc', function(
        err,
        rows
      ) {
        if (!err) {
          rows.forEach(row => {
            that.docs.push({
              id: row.ID,
              title: row.TITLE,
              path: row.PATH
            })
          })
        } else {
          console.log(err)
        }
      })
  },
  methods: {
    treeNodeClick(nodeData) {
      this.$refs.tagTree.setCurrentKey(null)
      const that = this
      const directoryId = nodeData.id
      if (directoryId === 0) {
        db.all('select * from km_document order by create_time desc', function(
          err,
          rows
        ) {
          if (!err) {
            that.docs.splice(0, that.docs.length)
            rows.forEach(row => {
              that.docs.push({
                id: row.ID,
                title: row.TITLE,
                path: row.PATH
              })
            })
          } else {
            console.log(err)
          }
        })
      } else {
        db.all('select * from km_directory', function(err, rows) {
          if (!err) {
            const ids = [directoryId]
            findChildIds(rows, directoryId, ids)
            db.all(
              'select * from km_document where directory_id in (' +
                ids.map(_ => '?') +
                ') order by create_time desc',
              ids,
              function(err, rows) {
                if (!err) {
                  that.docs.splice(0, that.docs.length)
                  rows.forEach(row => {
                    that.docs.push({
                      id: row.ID,
                      title: row.TITLE,
                      path: row.PATH
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
        })
      }
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
            that.currentDirectoryId = nodeData.id
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
              that.currentDirectoryId = nodeData.id
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
                  db.all('select * from km_directory', function(err, rows) {
                    if (!err) {
                      const deleteIds = [nodeData.id]
                      findChildIds(rows, nodeData.id, deleteIds)
                      db.all(
                        'select * from km_document where directory_id in (' +
                          deleteIds.map(_ => '?') +
                          ')',
                        deleteIds,
                        function(err, rows) {
                          if (!err) {
                            // 查出所有要删除的文件夹id
                            db.serialize(function() {
                              db.run('BEGIN')
                              try {
                                // 删除关联的文档
                                db.run(
                                  'delete from km_document where directory_id in (' +
                                    deleteIds.map(_ => '?') +
                                    ')',
                                  deleteIds
                                )
                                // 删除当前节点及其子节点
                                db.run(
                                  'delete from km_directory where id in (' +
                                    deleteIds.map(_ => '?') +
                                    ')',
                                  deleteIds
                                )
                                // 删除实体文件
                                rows.forEach(row => {
                                  if (row.PATH) {
                                    deleteFile(row.PATH)
                                  }
                                })
                                deleteIds.forEach(id => {
                                  that.$refs.directoryTree.remove(id)
                                })
                                db.run('COMMIT')
                                that.$message({
                                  type: 'success',
                                  message: '删除成功'
                                })
                              } catch (err) {
                                console.log(err)
                                db.run('ROLLBACK')
                                that.$message({
                                  type: 'error',
                                  message: '删除失败'
                                })
                              }
                            })
                          } else {
                            console.log(err)
                            that.$message({
                              type: 'error',
                              message: '删除失败'
                            })
                          }
                        }
                      )
                    } else {
                      console.log(err)
                      that.$message({
                        type: 'error',
                        message: '删除失败'
                      })
                    }
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
                // 删除标签，需要同步删除关联表
                db.serialize(function() {
                  db.run('BEGIN')
                  try {
                    db.run('DELETE FROM KM_DOC_TAG WHERE TAG_ID=?', [
                      nodeData.id
                    ])
                    db.run('DELETE FROM KM_TAG WHERE ID=?', [nodeData.id])
                    that.$refs.tagTree.remove(nodeData.id)
                    db.run('COMMIT')
                    that.$message({
                      type: 'success',
                      message: '删除成功'
                    })
                  } catch (err) {
                    console.log(err)
                    db.run('ROLLBACK')
                    that.$message({
                      type: 'error',
                      message: '删除失败'
                    })
                  }
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
                db.serialize(function() {
                  db.run('BEGIN')
                  try {
                    db.run('delete from km_document where id=?', doc.id)
                    // 删除实体文件
                    if (doc.path) {
                      deleteFile(doc.path)
                    }
                    db.run('COMMIT')
                    that.docs.splice(
                      that.docs.findIndex(item => item.id === doc.id),
                      1
                    )
                    that.$message({
                      type: 'success',
                      message: '删除成功'
                    })
                  } catch (err) {
                    console.log(err)
                    db.run('ROLLBACK')
                    that.$message({
                      type: 'error',
                      message: '删除失败'
                    })
                  }
                })
              })
          }
        })
      )
      menu.popup(remote.getCurrentWindow())
    },
    submitDirectory() {
      const that = this
      if (this.isAddChild) {
        db.run(
          'INSERT INTO KM_DIRECTORY (CREATE_TIME,UPDATE_TIME,NAME,PARENT) VALUES ($createTime,$updateTime,$name,$parent)',
          {
            $createTime: Math.floor(Date.now() / 1000),
            $updateTime: Math.floor(Date.now() / 1000),
            $name: this.newDirectoryName,
            $parent: this.currentDirectoryId
          },
          function(err) {
            if (!err) {
              console.log(this)
              that.showDirectoryEdit = false
              that.$refs.directoryTree.append(
                { label: that.newDirectoryName, id: this.lastID },
                that.currentDirectoryId
              )
            } else {
              console.log(err)
            }
          }
        )
      } else {
        db.run(
          'UPDATE KM_DIRECTORY SET UPDATE_TIME=$updateTime,NAME=$name WHERE ID=$id',
          {
            $updateTime: Math.floor(Date.now() / 1000),
            $name: this.newDirectoryName,
            $id: this.currentDirectoryId
          },
          function(err) {
            if (!err) {
              that.showDirectoryEdit = false
              that.$refs.directoryTree.getNode(
                that.currentDirectoryId
              ).data.label = that.newDirectoryName
            } else {
              console.log(err)
            }
          }
        )
      }
    },
    tagTreeNodeClick(nodeData) {
      this.$refs.directoryTree.setCurrentKey(null)
      const that = this
      const tagId = nodeData.id
      db.all(
        'SELECT a.* FROM KM_DOCUMENT a INNER JOIN KM_DOC_TAG b ON a.ID=b.DOC_ID WHERE b.TAG_ID=? ORDER BY a.CREATE_TIME DESC',
        [tagId],
        function(err, rows) {
          if (!err) {
            that.docs.splice(0, that.docs.length)
            rows.forEach(row => {
              that.docs.push({
                id: row.ID,
                title: row.TITLE,
                path: row.PATH
              })
            })
          } else {
            console.log(err)
          }
        }
      )
    },
    submitTag() {
      const that = this
      db.run(
        'UPDATE KM_TAG SET UPDATE_TIME=$updateTime,NAME=$name WHERE ID=$id',
        {
          $updateTime: Math.floor(Date.now() / 1000),
          $name: this.newTagName,
          $id: this.currentTagId
        },
        function(err) {
          if (!err) {
            that.showTagEdit = false
            that.$refs.tagTree.getNode(that.currentTagId).data.label =
              that.newTagName
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
                      title: row.TITLE,
                      path: row.PATH
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
    deleteDocTag(tag) {
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
                  db.all(
                    'select * from km_tag order by create_time desc',
                    function(err, rows) {
                      if (!err) {
                        that.tags.push({
                          label: '标签',
                          id: 0,
                          children: rows.map(row => {
                            return { label: row.NAME, id: row.ID }
                          })
                        })
                      } else {
                        console.log(err)
                      }
                    }
                  )
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
                      title: row.TITLE,
                      path: row.PATH
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
