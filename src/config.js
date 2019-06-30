export const VHVideoConfig = {
  autoplay: true,
  maxBuffer: 10000, // 1000 进制Kb， 10 * 1000 = 10M 点播用， 数字
  maxBufferTime: 60, // 秒为单位，点播用,数字
  rateList: [0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4], // 默认倍速播放系数
  lagThreshold: 4, // 卡顿临界值， 超过此数值，则记录为一次卡顿
  switchLineThreshold: 8, // 因为卡顿或者线路不可达，则切换线路的临界值
  tokenExpireTime: 1000 * 60 * 60, // token 过期时间,默认1小时
  plugin_watermark:
    '{"url":"http://www.vhall.com/public/static/images/index/new/logo.png","align":"tl","position":["20px","20px"],"size":["80px","35px"],"enable":true}', // align: tl | tr | bl | br, position 数组，长度为2，支持 px, vh, vw, 百分比, size: 数组，长度为2，对应宽，高，支持 px, vh, vw, 百分比，enable: 启用需要将其设置为true
  plugin_barrage:
    '{"enable":true,"duration":5,"position":3,"fontsize":18,"alpha":0.8,"font":"Microsoft YaHei","color":"#FFF"}', // position: 0:top,距离上10%~~50%, 1：middle,30%~70%， 2：bottom,50%~90% 3:all,距离上下各10%, duration: 完成基准，基于这个时间进行下浮动,取值范围为：(Math.random() * duration / 3)>>>0
  plugin_marquee:
    '{"enable":true,"text":"版权所有，盗版必究","alpha":100,"size":20,"color":"#ff8d41","interval":20,"speed":6000,"position":1}' // enable: true 是否启用插件，text： 跑马灯文字， alpha： 透明度，100为完全显示， size: 字号， color: 字体颜色，仅支持rgb字符串，interval: 前一波完事后多久执行下一次弹幕， speed: 速度，分为，3000,6000,10000,对应的快，中，慢，  position:1,2,3,4 1:随机,2:上,3中,4:下
}
