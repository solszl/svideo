// 元数据类型， 解析metaData用
export const MetaTypes = {
  NUMBER: 0,
  BOOLEAN: 1,
  STRING: 2,
  OBJECT: 3,
  MIX_ARRAY: 8,
  OBJECT_END: 9,
  STRICT_ARRAY: 10,
  DATE: 11,
  LONE_STRING: 12
};


// 声音比特率枚举， 解析声音tag用
export const soundRateTypes = [
  5500,
  11000,
  22000,
  4400
];

// 声音采样率， 解析声音用，当解析aac数据时， packetType!=1 的时候，需要根据采样率重新构建aac数据
export const samplingFrequencyTypes = [
  96000, 88200,
  64000, 48000,
  44100, 32000,
  24000, 22050,
  16000, 12000,
  11025, 8000
];