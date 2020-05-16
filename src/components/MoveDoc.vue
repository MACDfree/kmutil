<template>
  <el-dialog
    title="移动文档"
    :visible="show"
    @update:visible="$emit('update:show', $event)"
    :show-close="true"
    :close-on-click-modal="false"
    @open="refreshDirectoryTree"
    width="300px"
  >
    <el-tree
      :indent="10"
      :data="directorys"
      :expand-on-click-node="false"
      node-key="id"
      :default-expand-all="true"
      ref="directoryTree"
      height="100%"
      :highlight-current="true"
      icon-class="el-icon-arrow-right"
    >
      <span class="directory-tree-node-for-move" slot-scope="{ node,data }">
        <span>
          <i class="el-icon-folder"></i>
          <span>{{ node.label }}</span>
        </span>
        <span v-if="!data.disable">
          <el-button type="text" size="mini" @click="moveDoc(data.id)">移动至</el-button>
        </span>
      </span>
    </el-tree>
  </el-dialog>
</template>

<script>
import dirOpt from '../api/dirOpt'
import docOpt from '../api/docOpt'
import { findChildren } from '../utils/comm-func'
export default {
  props: {
    doc: {
      type: Object,
      required: false
    },
    show: {
      type: Boolean,
      required: true
    }
  },
  mounted() {},
  data() {
    return {
      directorys: []
    }
  },
  methods: {
    refreshDirectoryTree() {
      const dirList = dirOpt.listDir()
      this.directorys.splice(0, this.directorys.length)
      this.directorys.push({
        label: '文件夹',
        id: 'root',
        disable: true,
        children: findChildren('root', dirList, id => {
          return {
            disable: this.doc.directoryId === id
          }
        })
      })
    },
    moveDoc(newDirectoryId) {
      this
        .$confirm('此操作将移动当前文档, 是否继续?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        .then(() => {
          docOpt.moveDoc(this.doc.id, newDirectoryId)
          this.$emit('after-move')
        }).finally(() => {
          this.$emit('update:show', false)
        })
    }
  }
}
</script>

<style lang="stylus">
.directory-tree-node-for-move
  flex 1
  display flex
  align-items center
  justify-content space-between
  font-size 14px
  padding-right 8px
</style>
