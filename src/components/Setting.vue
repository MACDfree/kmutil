<template>
  <el-dialog title="设置" :visible.sync="show" :show-close="false" :close-on-click-modal="false">
    <el-form :model="setting" label-width="80px">
      <el-form-item label="Markdown">
        <el-input v-model="setting.markdown" autocomplete="off"></el-input>
      </el-form-item>
      <el-form-item label="脑图">
        <el-input v-model="setting.mindmap" autocomplete="off"></el-input>
      </el-form-item>
      <el-form-item label="Word">
        <el-input v-model="setting.word" autocomplete="off"></el-input>
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button @click="show = false">取 消</el-button>
      <el-button type="primary" @click="saveSetting">确 定</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { ipcRenderer } from 'electron'
import Store from 'electron-store'
const store = new Store()

export default {
  mounted() {
    ipcRenderer.on('setting', () => {
      this.setting.markdown = store.get('markdown')
      this.setting.mindmap = store.get('mindmap')
      this.setting.word = store.get('word')
      this.show = true
    })
  },
  data() {
    return {
      show: false,
      setting: {
        markdown: '',
        mindmap: '',
        word: ''
      }
    }
  },
  methods: {
    saveSetting() {
      if (this.setting.markdown) {
        store.set('markdown', this.setting.markdown)
      }
      if (this.setting.mindmap) {
        store.set('mindmap', this.setting.mindmap)
      }
      if (this.setting.word) {
        store.set('word', this.setting.word)
      }
      this.show = false
    }
  }
}
</script>

<style>
</style>
