export const VHVideoConfig = {
  autoplay: true,
  maxBuffer: 10000, // 1000 进制Kb， 10 * 1000 = 10M 点播用， 数字
  maxBufferTime: 60, // 秒为单位，点播用,数字
  rateList: [0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4], // 默认倍速播放系数
  lagThreshold: 4, // 卡顿临界值， 超过此数值，则记录为一次卡顿
  switchLineThreshold: 8, // 因为卡顿或者线路不可达，则切换线路的临界值
  plugin_watermark: '{"url":"http://www.vhall.com/public/static/images/index/new/logo.png","align":"tl","position":["20px","20px"],"size":["80px","35px"],"enable":true}', // align: tl | tr | bl | br, position 数组，长度为2，支持 px, vh, vw, 百分比, size: 数组，长度为2，对应宽，高，支持 px, vh, vw, 百分比，enable: 启用需要将其设置为true
};