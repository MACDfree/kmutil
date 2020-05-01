import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    directoryId: 0,
    tagId: 0,
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
  },
  mutations: {
    changeDirectoryId(state, dirId) {
      state.directoryId = dirId
    }
  },
  actions: {
  },
  modules: {
  }
})
