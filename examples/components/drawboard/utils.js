/**
 * 图片url转本地base64  似乎还是跨域  服务端图片服务未运行跨域 依然不能转成功
 * @param {*} src
 * @param {*} callback
 * @param {*} outputFormat
 */
const getPictureBase64 = (src, callback, outputFormat) => {
  var xhr = new XMLHttpRequest()
  xhr.open('GET', src, true)

  xhr.responseType = 'arraybuffer'

  xhr.onload = () => {
    if (xhr.status == 200) {
      var uInt8Array = new Uint8Array(xhr.response)
      var i = uInt8Array.length
      var binaryString = new Array(i)
      while (i--) {
        binaryString[i] = String.fromCharCode(uInt8Array[i])
      }
      var data = binaryString.join('')
      var base64 = window.btoa(data)
      var dataUrl =
        'data:' + (outputFormat || 'image/png') + ';base64,' + base64
      callback.call(this, dataUrl)
    }
  }

  xhr.send()
}

export { getPictureBase64 }
