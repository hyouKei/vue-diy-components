import DrawingBoard from './drawboard'

/* DrawingBoard.install = Vue => {
  Vue.component(DrawingBoard.name, DrawingBoard)
} */

const components = [DrawingBoard]

const install = Vue => {
  components.map(component => {
    Vue.component(component.name, component)
  })
}

// export default DrawingBoard
export default {
  install,
  DrawingBoard
}
