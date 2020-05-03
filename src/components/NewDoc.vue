<template>
  <span>
    <el-popover placement="top" width="160" v-model="newDocVisible">
      <p>文档类型</p>
      <el-select v-model="newDocType" placeholder="请选择" size="mini">
        <el-option v-for="type in types" :key="type.value" :label="type.label" :value="type.value"></el-option>
      </el-select>
      <div style="text-align: right; margin: 0">
        <el-button size="mini" type="text" @click="newDocVisible = false">取消</el-button>
        <el-button type="primary" size="mini" @click="newDoc()">确定</el-button>
      </div>
      <el-button slot="reference" size="mini" icon="el-icon-document-add"></el-button>
    </el-popover>
    <el-dialog title="导入文档" :visible.sync="showUploader" width="100%">
      <el-upload
        action="empty"
        class="upload-demo"
        drag
        :accept="allowType"
        :auto-upload="false"
        :http-request="upload"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
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
  </span>
</template>

<script>
import { copyFile, createMDFile } from '../utils/file-util'
// import { newDoc as newDocument, listDoc } from '../api/db'
import docOpt from '../api/docOpt'
export default {
  props: {
    defaultDocType: {
      type: String,
      required: false
    },
    directoryId: {
      type: String,
      required: false
    }
  },
  data() {
    return {
      newDocType: this.defaultDocType,
      newDocVisible: false,
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
      ]
    }
  },
  methods: {
    newDoc() {
      let path = ''
      // 先新增个记录
      if (this.newDocType === 'md') {
        // 需要新增md文件
        path = createMDFile()
      } else if (this.newDocType === 'doc' || this.newDocType === 'mm') {
        // 需要导入文件
        this.showUploader = true
        this.newDocVisible = false
        return
      }
      docOpt.insertDoc({
        type: this.newDocType,
        directoryId: this.directoryId,
        path: path
      })
      const obj = docOpt.listDoc(this.directoryId)
      this.$emit('refresh-doc', obj.list)
      this.newDocVisible = false
      // newDocument({
      //   type: this.newDocType,
      //   directoryId: this.directoryId,
      //   path: path
      // })
      //   .then(() => listDoc(that.directoryId))
      //   .then(obj => {
      //     that.$emit('refresh-doc', obj.rows)
      //     that.newDocVisible = false
      //   })
      //   .catch(err => {
      //     console.log(err)
      //   })
    },
    upload(arg) {
      const path = copyFile(arg.file)
      docOpt.insertDoc({
        type: this.newDocType,
        directoryId: this.directoryId,
        path: path
      })
      const obj = docOpt.listDoc(this.directoryId)
      this.$emit('refresh-doc', obj.list)
      this.newDocVisible = false
      this.showUploader = false
      // newDocument({
      //   type: this.newDocType,
      //   directoryId: this.directoryId,
      //   path: path
      // })
      //   .then(() => listDoc(that.directoryId))
      //   .then(obj => {
      //     that.$emit('refresh-doc', obj.rows)
      //     that.newDocVisible = false
      //     that.showUploader = false
      //   })
      //   .catch(err => {
      //     console.log(err)
      //   })
    },
    submitUpload() {
      this.$refs.uploader.submit()
    }
  },
  computed: {
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

<style lang="stylus"></style>
