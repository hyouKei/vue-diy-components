import DrawingBoard from './index.vue'

DrawingBoard.install = Vue => {
  Vue.component(DrawingBoard.name, DrawingBoard)
}

export default DrawingBoard
