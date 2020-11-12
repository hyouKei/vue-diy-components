import DrawingBoard from './src/main.vue'

DrawingBoard.install = Vue => {
  Vue.component(DrawingBoard.name, DrawingBoard)
}

export default DrawingBoard
