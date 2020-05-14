<template>
  <el-dialog
    title="移动文档"
    :visible.sync="show"
    :show-close="true"
    :close-on-click-modal="false"
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
        <span>
          <el-button type="text" size="mini" @click="() => append(data)">移动至</el-button>
        </span>
      </span>
    </el-tree>
  </el-dialog>
</template>

<script>
import dirOpt from '../api/dirOpt'
import { findChildren } from '../utils/comm-func'
export default {
  props: {
    docId: {
      type: String,
      required: true
    },
    show: {
      type: Boolean,
      required: true
    }
  },
  mounted() {
    const dirList = dirOpt.listDir()
    this.directorys.splice(0, this.directorys.length)
    this.directorys.push({
      label: '文件夹',
      id: 'root',
      children: findChildren('root', dirList)
    })
  },
  data() {
    return {
      directorys: []
    }
  },
  methods: {}
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
