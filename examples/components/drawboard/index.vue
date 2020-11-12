<template>
  <div
    class="drawingboard"
    :style="{ width: `${width}px`, height: `${height}px` }"
  >
    <!-- 画板 -->
    <div class="drawingboard-canvas-wrap">
      <canvas :ref="id" :id="id" :width="width" :height="height"></canvas>
    </div>

    <!-- 工具栏 -->
    <div class="control-layout">
      <div
        class="icon-drawingboard-tool"
        :class="{
          active: model === item.value,
          disabled: setDisabledClass(item, canvasObjs)
        }"
        v-for="item in controlls"
        v-show="item.display"
        :title="item.name"
        :key="item.value"
        @click="handleModel(item.value)"
      >
        <i :class="item.icon"></i>
        <!-- <span>{{ item.name }}</span> -->
      </div>
    </div>
  </div>
</template>

<script>
import '@/assets/icon/iconfont.css'

import { fabric } from 'fabric'

// 备份工具
const TOOLS = [
  {
    icon: 'iconfont icon-move',
    name: '拖拽',
    value: 'move',
    display: false
  },
  {
    icon: 'iconfont icon-rect',
    name: '矩形',
    value: 'rect',
    display: false
  },
  {
    icon: 'iconfont icon-ellipse',
    name: '椭圆',
    value: 'ellipse',
    display: false
  },
  // 有椭圆 正圆不是必要
  {
    icon: 'iconfont icon-circle',
    name: '圆圈',
    value: 'circle',
    display: false
  },
  /* {
    icon: 'iconfont icon-circle',
    name: '多边形',
    value: 'polygon',
    display: false
  }, */
  {
    icon: 'iconfont icon-draw',
    name: '画笔',
    value: 'draw',
    display: false
  },
  {
    icon: 'iconfont icon-text',
    name: '文本',
    value: 'text',
    display: false
  },
  {
    icon: 'iconfont icon-redo',
    name: '撤销',
    value: 'redo',
    display: false
  },
  {
    icon: 'iconfont icon-clear',
    name: '清空',
    value: 'clear',
    display: false
  },
  {
    icon: 'iconfont icon-save',
    name: '导出图片',
    value: 'save',
    display: false
  }
]
export default {
  name: 'DrawingBoard',
  props: {
    id: {
      type: String,
      default: 'drawCanvas'
    },

    width: {
      type: Number,
      default: 640
    },

    height: {
      type: Number,
      default: 400
    },

    // 工具栏 默认显示全部
    controlsLayout: {
      type: Array,
      default: () => {
        return []
      }
    },

    // 笔触颜色
    strokeColor: {
      type: String,
      default: '#e72528'
    },

    // 笔触粗细
    strokeWidth: {
      type: Number,
      default: 2
    },

    // 文本字号
    fontSize: {
      type: Number,
      default: 16
    },

    // 文本字体
    fontFamily: {
      type: String,
      default: ''
    },

    // 文本框宽度
    textWidth: {
      type: Number,
      default: 140
    },

    // 画板底色
    backgroundColor: {
      type: String,
      default: '#eee'
    },

    // 绘图板底图  base64
    fillSrc: {
      type: String,
      default: ''
    },

    // 最大放大倍数
    zoomMax: {
      type: Number,
      default: 3
    },

    // 输出图片格式 默认png 图片清晰 文件较大
    pictureSuffix: {
      type: String,
      default: 'png'
    }
  },
  data() {
    return {
      panning: false, // 是否拖动
      previousEvent: null, // IE：前一个鼠标移动事件
      zoom: 0,
      model: 'move', // 默认移动
      canvas: null,
      backImage: null, // 图片对象
      start: false, // 拖拽画图标记
      transImageURL: '', // 转出图片 base64
      transLayerURL: '', // 转出除图片外的绘制图层
      canvasObjs: null,
      polygonPoints: []
    }
  },

  computed: {
    // 工具栏根据默认配置属性取舍 (更改图标 或 名称)
    controlls() {
      let _tools = TOOLS.filter(item => {
        if (this.controlsLayout && this.controlsLayout.length) {
          return this.controlsLayout.some(control => {
            if (control.value === item.value) {
              if (control.icon) {
                item.icon = control.icon
              }
              if (control.label !== item.name) {
                item.name = control.label
              }
              return control
            }
          })
        } else {
          // 若被清空  默认使用备份工具组全部
          return TOOLS
        }
      })

      _tools.map(tool => {
        tool.display = true
      })
      return _tools
    }
  },

  watch: {
    canvasObjs(objs) {
      if (objs.length < 2) {
        this.isLastPath = true
      } else {
        this.isLastPath = false
      }
    },
    model(val) {
      // hasRotatingPoint设为false 旋转禁用
      if (val === 'draw') {
        this.canvas.isDrawingMode = true
        this.canvas.freeDrawingBrush.color = this.strokeColor // 设置自由绘画笔的颜色
        this.canvas.freeDrawingBrush.width = this.strokeWidth //自由绘笔触宽度

        this.panning = false
      } else {
        this.canvas.isDrawingMode = false
      }

      // 清空
      if (val === 'clear') {
        this.handleClearObjects()
      }
      // 保存圖片
      if (val === 'save') {
        this.handleSaveAs()
      }

      // 有文本框加入时 去除焦点 退出编辑模式
      if (this.textbox) {
        if (val !== 'text') {
          this.textbox.hasBorders = false
          this.canvas.renderAll()
          this.textbox.exitEditing()
          this.textbox = null
        } else {
          // TODO 文本可选二次编辑
        }
      }

      this.canvas.selectable = false
    }
  },

  mounted() {
    this.initCanvas()
  },

  methods: {
    initCanvas() {
      this.canvas = new fabric.Canvas(this.id, {
        isDrawingMode: false,
        selectable: false, // 不可选
        selection: true, // 选中元素不显示
        perPixelTargetFind: true, // 选中的时候以图形实际大小选择 而不是以边框来选择
        skipTargetFind: true, // 画板元素不可选中
        devicePixelRatio: true, // Retina 高清屏 屏幕支持
        uniScaleTransform: true, // 拉伸不固定比例 大小跟随鼠标
        backgroundColor: this.backgroundColor
      })

      // let center = this.canvas.getCenter() // 画布中心
      /* getPictureBase64(this.fillSrc, dataURL => {
        console.log(dataURL)
      }) */
      new fabric.Image.fromURL(this.fillSrc, img => {
        this.imageObjSize = {
          width: img.width,
          height: img.height
        }
        img.set({
          hasRotatingPoint: false, // 无旋转点
          hasControls: false // 无编辑框
        })

        // img._originalElement.crossOrigin = 'anonymous' // 跨域
        // img.scale(1).set({})
        this.canvas.selection = false
        this.canvas.add(img).setActiveObject(img)
        this.canvas.renderAll()
      })
      /* 绑定常用事件 */
      this._bindEvents(this.canvas)
    },

    // 点击操作模式
    handleModel(val) {
      this.model = val
      // 撤销反复点击
      if (this.model === 'redo') {
        this.handleRedo()
      }
    },

    // 保存图片 （保存类型指定？）
    handleSaveAs() {
      let transImage = this.getPrintPicture()
      // console.log(transImage)
      this.$emit('print', transImage)
    },

    // 点击撤销
    handleRedo() {
      let _objs = []
      this.canvas.forEachObject(el => {
        if (el.type !== 'image') {
          if (el.type === 'textbox' && el.text === '') {
            return false
          } else {
            _objs.push(el)
          }
        }
      })
      this.canvas.remove(_objs[_objs.length - 1])
      this.canvasObjs = this.canvas.getObjects()
      this.canvasObjs.forEach(el => {
        if (el.type === 'textbox' && el.text === '') {
          this.canvas.remove(el)
        }
      })
    },

    // 清空画布
    handleClearObjects() {
      this.canvas.forEachObject(el => {
        // 删除除图片以外的对象
        if (el.type === 'image') {
          return false
        } else {
          this.canvas.remove(el)
        }
      })
    },

    // 撤销禁用状态
    setDisabledClass(item, objects) {
      if (this.model === 'redo') {
        return item.value === 'redo' && this.isLastPath
      } else if (this.model === 'clear') {
        return item.value === 'redo'
      } else {
        return item.value === 'redo' && (!objects || objects.length < 2)
      }
    },

    /**
     * 父级获取当前绘制图片结果
     */
    getPrintPicture() {
      // 存放画板所有图层
      let cacheDom = document.createElement('canvas')
      cacheDom.id = `${this.id}_cache`

      // 存放绘图层（不包含图片层）
      let cacheDrawDom = document.createElement('canvas')
      cacheDrawDom.id = `${this.id}_cache_draw`

      let canvasImage = this._newFabricCanvas(`${this.id}_cache`)
      let drawCanvas = this._newFabricCanvas(`${this.id}_cache_draw`)

      canvasImage.clear() // 每次新建前清空画布

      // 创建新画布 渲染所有图层
      this.canvas.forEachObject(el => {
        canvasImage.add(el)
      })
      canvasImage.renderAll()

      const image = new Image()
      image.src = ''
      image.crossOrigin = 'anonymous'

      drawCanvas.clear()

      if (this.canvasObjs && this.canvasObjs.length) {
        this.canvasObjs.forEach(cel => {
          if (cel.type !== 'image') {
            drawCanvas.add(cel)
          }
        })
      } else {
        // 没有绘制痕迹
      }
      drawCanvas.renderAll()

      if (this.isLastPath) {
        drawCanvas.clear()
      }
      let localDrawURL =
        drawCanvas.toDataURL('image/' + this.pictureSuffix) || null

      try {
        // 指定導出圖片格式
        image.src = canvasImage.toDataURL('image/' + this.pictureSuffix)
      } catch (error) {
        image.src = ''
        console.error(error)
      }

      let drawPaths = drawCanvas.getObjects()
      if (!drawPaths.length) {
        this.isLastPath = true
      } else {
        this.isLastPath = false
      }

      // 没有任何痕迹
      if (!this.canvasObjs || !this.canvasObjs.length) {
        localDrawURL = ''
      }
      // console.log(localDrawURL)

      // 返回两张图片 originDrawURL: 画板编辑后的完整图片    localDrawURL: 当前笔触绘制图层（不含图片）
      return {
        originDrawURL: image.src,
        localDrawURL
      }
    },

    // 新建缓存画布
    _newFabricCanvas(id) {
      return new fabric.Canvas(id, {
        isDrawingMode: false,
        selectable: false, // 不可选
        selection: false, // 选中元素不显示
        perPixelTargetFind: true,
        skipTargetFind: true, // 画板元素不可选中
        devicePixelRatio: true, // Retina 高清屏 屏幕支持
        backgroundColor: '',
        width: this.imageObjSize.width, // 输出画布大小与实际图片大小一致
        height: this.imageObjSize.height // 输出画布大小与实际图片大小一致
      })
    },

    // 矩形绘制
    _makeRect(left, top, width, height) {
      let rectObj = new fabric.Rect({
        rx: 2,
        ry: 2,
        left: left,
        top: top,
        height: height,
        width: width,
        fill: '',
        stroke: this.strokeColor,
        strokeWidth: this.strokeWidth
      })
      rectObj.hasControls = rectObj.hasBorders = false

      return rectObj
    },

    // 圆圈 (正圆)
    _makeCircle(left, top, r) {
      let circleObj = new fabric.Circle({
        left: left,
        top: top,
        radius: r,
        fill: '',
        stroke: this.strokeColor,
        strokeWidth: this.strokeWidth,
        originX: 'center',
        originY: 'center'
      })
      circleObj.hasControls = circleObj.hasBorders = false
      return circleObj
    },

    // 画圆 （椭圆）
    _makeEllipse(left, top) {
      let ellipseObj = new fabric.Ellipse({
        left: left,
        top: top,
        stroke: this.strokeColor,
        strokeWidth: this.strokeWidth,
        fill: '',
        originX: 'center',
        originY: 'center',
        rx: Math.abs(left - this.endX),
        ry: Math.abs(top - this.endY)
      })
      ellipseObj.hasControls = ellipseObj.hasBorders = false
      return ellipseObj
    },

    // 多边形
    _makePolygon(left, top) {
      // this.polygonPoints = [
      //   { x: 200, y: 0 },
      //   {x: 250, y: 50},
      //   {x: 250, y: 100},
      //   {x: 150, y: 100},
      //   {x: 150, y: 50} ]
      let polygonObj = new fabric.Polygon(this.polygonPoints, {
        left: left,
        top: top,
        angle: 0,
        fill: '',
        stroke: this.strokeColor,
        strokeWidth: this.strokeWidth,
        cornerColor: this.strokeColor
      })
      // polygonObj.cornerStyle = 'circle'
      polygonObj.hasControls = polygonObj.hasBorders = false
      return polygonObj
    },

    // 添加文本框
    _makeTextbox(mouseFrom) {
      this.textbox = new fabric.Textbox('', {
        left: mouseFrom.x,
        top: mouseFrom.y,
        width: this.textWidth,
        fontSize: this.fontSize,
        fontFamily: this.fontFamily,
        borderColor: '',
        cursorWidth: 0.1, // 光标宽度
        stroke: '',
        // evented: true,
        fill: this.strokeColor,
        hasControls: false
      })
      this.textbox.hasControls = false
      this.canvas.add(this.textbox)
      this.canvas.setActiveObject(this.textbox)
      this.textbox.enterEditing()
      this.textbox.hiddenTextarea.focus()
    },

    _bindEvents(canvas) {
      canvas.on({
        'mouse:down': e => {
          this.panning = true
          canvas.selection = false

          if (this.model === 'text') {
            let mouse = canvas.getPointer(e.e)
            this._makeTextbox(mouse)
          }

          // 矩形
          if (this.model === 'rect') {
            this.started = true
            let mouse = canvas.getPointer(e.e)

            this.startX = mouse.x
            this.startY = mouse.y

            let square = this._makeRect(this.startX, this.startY, 1, 1)
            canvas.add(square)
            canvas.renderAll()
            canvas.setActiveObject(square)
          }

          // 多边形
          /* if (this.model === 'polygon') {
            this.started = true
            let mouse = canvas.getPointer(e.e)

            this.startX = mouse.x
            this.startY = mouse.y

            // let delt = new fabric.Point(mouse.x, mouse.y)
            this.polygonPoints.push({ x: mouse.x, y: mouse.y })

            let polygon = this._makePolygon(this.startX, this.startY)
            canvas.add(polygon)
            canvas.renderAll()
            canvas.setActiveObject(polygon)
          } */

          // 正圆
          if (this.model === 'circle') {
            this.started = true

            let mouse = canvas.getPointer(e.e)
            this.startX = mouse.x
            this.startY = mouse.y
            let circle = this._makeCircle(this.startX, this.startY, 0)
            canvas.add(circle)
            canvas.renderAll()
            canvas.setActiveObject(circle)
          }

          // 椭圆
          if (this.model === 'ellipse') {
            this.started = true
            let mouse = canvas.getPointer(e.e)
            this.startX = mouse.x
            this.startY = mouse.y
            let ellipse = this._makeEllipse(this.startX + 13, this.startY + 13)
            ellipse.set('rx', 0).set('ry', 0)
            canvas.add(ellipse)
            canvas.renderAll()
            canvas.setActiveObject(ellipse)
          }
        },

        'mouse:move': e => {
          // 画布位移
          if (
            this.panning &&
            e &&
            e.e &&
            (this.model === 'move' ||
              this.model === 'redo' ||
              this.model === 'clear' ||
              this.model === 'save')
          ) {
            let x = e.e.movementX
            let y = e.e.movementY

            // 兼容IE
            if (!x) {
              x = e.e.screenX - this.previousEvent.e.screenX
              y = e.e.screenY - this.previousEvent.e.screenY
            }
            let delta = new fabric.Point(x, y)
            canvas.relativePan(delta)
          }
          this.previousEvent = e

          ////////////////////////////////// 拖拽绘图 //////////////////////////////////
          // 矩形
          if (this.model === 'rect') {
            if (!this.started) {
              return false
            }
            let mouse = canvas.getPointer(e.e)

            let w = Math.abs(mouse.x - this.startX),
              h = Math.abs(mouse.y - this.startY),
              x = Math.min(mouse.x, this.startX),
              y = Math.min(mouse.y, this.startY)
            if (!w || !h) {
              return false
            }

            let square = canvas.getActiveObject()
            square
              .set('top', y)
              .set('left', x)
              .set('width', w)
              .set('height', h)
            canvas.renderAll()
          }

          /* if (this.model === 'polygon') {
            if (!this.started) {
              return false
            }
            let mouse = canvas.getPointer(e.e)

            let x = Math.min(mouse.x, this.startX),
              y = Math.min(mouse.y, this.startY)

            let polygon = canvas.getActiveObject()
            polygon.set('top', y).set('left', x)
            canvas.renderAll()
          } */

          // 正圆
          if (this.model === 'circle') {
            if (!this.started) {
              return false
            }
            let mouse = canvas.getPointer(e.e)
            let w = Math.abs(mouse.x - this.startX),
              h = Math.abs(mouse.y - this.startY)

            let c = Math.sqrt(w * w + h * h) // 半径

            if (!w || !h) {
              return false
            }

            let circle = canvas.getActiveObject()
            circle.set('radius', Math.abs(c))
            canvas.renderAll()
          }

          // 椭圆
          if (this.model === 'ellipse') {
            if (!this.started) {
              return false
            }
            let mouse = canvas.getPointer(e.e)
            let w = Math.abs(mouse.x - this.startX),
              h = Math.abs(mouse.y - this.startY)
            if (!w || !h) {
              return false
            }

            let ellipse = canvas.getActiveObject()
            ellipse.set('rx', w).set('ry', h)
            canvas.renderAll()
          }
        },

        'mouse:up': e => {
          this.panning = false
          canvas.selection = true
          if (this.model === 'rect') {
            if (!this.started) {
              return false
            }
            let mouse = canvas.getPointer(e.e)
            this.endX = mouse.x
            this.endY = mouse.y
            // let square = canvas.getActiveObject()
            // canvas.add(square)
            // canvas.renderAll()
            this.started = false
          }

          /* if (this.model === 'polygon') {
            if (!this.started) {
              return false
            }
            let mouse = canvas.getPointer(e.e)
            this.endX = mouse.x
            this.endY = mouse.y

            this.started = false
          } */

          if (this.model === 'circle') {
            if (!this.started) {
              return false
            }
            let mouse = canvas.getPointer(e.e)
            this.endX = mouse.x
            this.endY = mouse.y
            this.started = false
          }

          if (this.model === 'ellipse') {
            if (!this.started) {
              return false
            }
            let mouse = canvas.getPointer(e.e)
            this.endX = mouse.x
            this.endY = mouse.y
            this.started = false
          }

          this.canvasObjs = this.canvas ? this.canvas.getObjects() : null
        },

        // 鼠标滚轮事件 缩放
        'mouse:wheel': e => {
          this.zoom = (event.deltaY > 0 ? -0.1 : 0.1) + canvas.getZoom()
          this.zoom = Math.max(0.1, this.zoom) // 最小缩小至原比例的 0.1
          this.zoom = Math.min(this.zoomMax, this.zoom) // 最大放大倍数
          this.zoomPoint = new fabric.Point(e.pointer.x, e.pointer.y)
          canvas.zoomToPoint(this.zoomPoint, this.zoom)
        }
      })
    }
  }
}
</script>

<style lang="scss">
.drawingboard {
  position: relative;
  .drawingboard-canvas-wrap {
    height: inherit;
  }
}

.control-layout {
  position: absolute;
  width: 100%;
  bottom: 0;
  left: 0;
  padding: 4px 0;
  text-align: center;
  background: rgba(0, 0, 0, 0.3);
}
.icon-drawingboard-tool {
  display: inline-block;
  padding: 3px 6px;
  border-radius: 2px;
  margin: 0 2px;
  cursor: pointer;
  color: #fff;

  &:hover {
    background-color: #e5e5e5;
  }
  &.active {
    color: #e72528;
  }

  &.disabled {
    pointer-events: none;
    cursor: not-allowed;
    i,
    span {
      color: #e5e5e5;
    }
    &:hover {
      cursor: not-allowed;
      background: none;
    }
  }

  i {
    font-size: 20px;
    vertical-align: middle;
  }

  span {
    font-size: 14px;
    margin-left: 4px;
  }
  .icon-move:before {
    content: '\e8f4';
  }
  .icon-draw:before {
    content: '\e602';
  }
  .icon-rect:before {
    content: '\e620';
  }
  .icon-text:before {
    content: '\e639';
  }
  .icon-circle:before {
    content: '\e626';
  }
  .icon-ellipse:before {
    content: '\e677';
  }
  .icon-redo:before {
    content: '\e601';
  }
  .icon-remove:before {
    content: '\e880';
  }
  .icon-clear:before {
    content: '\e946';
  }
  .icon-save:before {
    // font-size: 20px;
    content: '\e603';
  }
}
</style>
