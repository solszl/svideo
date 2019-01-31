export const VHVideoConfig = {
  autoplay: true,
  maxBuffer: 10000, // 1000 进制Kb， 10 * 1000 = 10M 点播用， 数字
  maxBufferTime: 60, // 秒为单位，点播用,数字
  rateList: [0.75, 1, 1.25, 1.5, 2, 3, 4], // 默认倍速播放系数
};