/*
 * Copyright (C) 2016 Bilibili. All Rights Reserved.
 *
 * @author zheng qian <xqq@xqq.im>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export const defaultConfig = {
  enableWorker: false,
  enableStashBuffer: true,
  stashInitialSize: undefined,

  isLive: false,

  lazyLoad: true,
  lazyLoadMaxDuration: 1 * 60, // 一次性缓冲多长时间
  lazyLoadRecoverDuration: 10,
  deferLoadAfterSourceOpen: false,

  // autoCleanupSourceBuffer: default as false, leave unspecified
  autoCleanupMaxBackwardDuration: 3 * 60,
  autoCleanupMinBackwardDuration: 2 * 60,

  statisticsInfoReportInterval: 600,

  fixAudioTimestampGap: true, // 是否进行静音帧的插入

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