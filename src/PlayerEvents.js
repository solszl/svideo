export const PlayerEvent = {
  READY: 'ready',
  PLAY: 'play',
  PLAY_END: 'ended',
  REPLAY: 'replay',
  PAUSE: 'pause',
  RESUME: 'resume',
  LOOP_CHANGED: 'loop_changed',
  MUTED_CHANGED: 'muted_changed',
  PLAYBACKRATE_CHANGED: 'ratechange',
  SRC_CHANGED: 'src_changed',
  VOLUME_CHANGE: 'volumechange',
  CURRENT_TIME_CHANGED: 'current_time_changed',
  SEEK_START: 'seek_start',
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
  PROGRESS: 'progress'
};