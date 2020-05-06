<template>
  <el-dialog
    title="初始化中……"
    :visible.sync="show"
    width="30%"
    :show-close="false"
    :close-on-click-modal="false"
  >
    <el-progress type="circle" :percentage="percent"></el-progress>
  </el-dialog>
</template>

<script>
import { ipcRenderer } from 'electron'
import { initNew } from '../api/init'
import global from '../utils/global'

export default {
  data() {
    return {
      show: true,
      percent: 0
    }
  },
  mounted() {
    ipcRenderer.on('init', this.initHandle)
    if (global().currentPath) {
      this.initHandle()
    } else {
      this.show = false
    }
  },
  methods: {
    initHandle() {
      const that = this
      that.show = true
      initNew(per => {
        that.percent = per
        if (per === 100) {
          that.show = false
          that.$emit('init-finish')
        }
      })
    }
  }
}
</script>

<style lang="stylus"></style>
