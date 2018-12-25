export const defaultConfig = {
  enableWorker: false,
  enableStashBuffer: true,
  stashInitialSize: undefined,

  isLive: false,

  lazyLoad: true,
  lazyLoadMaxDuration: 3 * 60,
  lazyLoadRecoverDuration: 30,
  deferLoadAfterSourceOpen: true,

  // autoCleanupSourceBuffer: default as false, leave unspecified
  autoCleanupMaxBackwardDuration: 3 * 60,
  autoCleanupMinBackwardDuration: 2 * 60,

  statisticsInfoReportInterval: 600,

  fixAudioTimestampGap: true,

  accurateSeek: false,
  seekType: 'range', // [range, param, custom]
  seekParamStart: 'bstart',
  seekParamEnd: 'bend',
  rangeLoadZeroStart: false,
  customSeekHandler: undefined,
  reuseRedirectedURL: false,
  // referrerPolicy: leave as unspecified

  headers: undefined,
  customLoader: undefined
};

export function createDefaultConfig() {
  return Object.assign({}, defaultConfig);
}