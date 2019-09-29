export const PlayerEvent = {
  READY: 'ready',
  PLAY: 'play',
  PLAY_END: 'ended',
  REPLAY: 'replay',
  PAUSE: 'pause',
  // RESUME: 'resume',
  LOOP_CHANGED: 'loopchange',
  MUTED_CHANGED: 'mutedchange',
  PLAYBACKRATE_CHANGED: 'ratechange',
  SRC_CHANGED: 'srcchange',
  VOLUME_CHANGE: 'volumechange',
  CURRENT_TIME_CHANGED: 'setcurrenttime',
  SCHEDULER_COMPLETE: 'schedulercompleted',
  PLAYBACKRATE_LIST_CHANGED: 'playbackratelistchange',
  /** 清晰度变化 */
  DEFINITION_CHANGED: 'definitionchange',
  /** 清晰度列表变化 */
  DEFINITION_LIST_CHANGED: 'definitionlistchange',
  // SEEK_START: 'seek_start',
  SEEKED: 'seeked',
  BUFFER_EMPTY: 'buffer_empty',
  BUFFER_FULL: 'buffer_full',
  NO_SRC_FOUND: 'no_src_found',
  TS_NOT_FOUND: 'ts_not_found',
  M3U8_NOT_FOUND: 'm3u8_not_found',
  ATTACH_MEDIA: 'attach_media',
  DETACH_MEDIA: 'detach_media',
  TIMEUPDATE: 'timeupdate',
  WAITING: 'waiting',
  ERROR: 'error',
  LOADEDMETADATA: 'loadedmetadata',
  PROGRESS: 'progress',
  CHANGE_LINE: 'changeline',
  OVER: 'over'
  // LOADSTART: 'loadstart',
  // CANPLAYTHROUGH: 'canplaythrough'
}
