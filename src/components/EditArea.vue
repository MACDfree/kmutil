<template>
  <el-tiptap
    v-model="context"
    :extensions="extensions"
    :readonly="!editable"
    height="100%"
    :class="{readonly: !editable}"
  ></el-tiptap>
</template>

<script>
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

export default {
  props: {
    editable: {
      type: Boolean,
      required: true
    },
    value: {
      type: String,
      required: true
    }
  },
  data() {
    return {
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
  computed: {
    context: {
      get() {
        return this.value
      },
      set(v) {
        this.$emit('input', v)
      }
    }
  },
  components: {
    'el-tiptap': ElementTiptap
  }
}
</script>

<style lang="stylus">
.el-tiptap-editor__menu-bar, .el-tiptap-editor>.el-tiptap-editor__content, .el-tiptap-editor__footer
  border 0
.el-tiptap-editor__menu-bar:before
  height 0
.el-tiptap-editor>.el-tiptap-editor__content
  padding 10px
.readonly .el-tiptap-editor__menu-bar
  display none
</style>
