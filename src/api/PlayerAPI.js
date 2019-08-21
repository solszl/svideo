/**
 *
 * Created Date: 2019-07-23, 15:07:09 (zhenliang.sun)
 * Last Modified: 2019-07-24, 15:17:36 (zhenliang.sun)
 * Email: zhenliang.sun@gmail.com
 *
 * Distributed under the MIT license. See LICENSE file for details.
 * Copyright (c) 2019 vhall
 */

/**
 *
 *
 * @export
 * @class PlayerAPI
 * @author zhenliang.sun
 */
export default class PlayerAPI {
  constructor(player) {
    this.player = player
  }

  play() {
    this.player.play()
  }

  pause() {
    this.player.pause()
  }

  getIsPaused() {
    return this.player.getIsPaused()
  }

  setAutoplay(v) {
    this.player.setAutoplay(v)
  }

  getAutoplay() {
    return this.player.getAutoplay()
  }

  getBuffered() {
    return this.player.getBuffered()
  }

  getCrossOrigin() {
    return this.player.getCrossOrigin()
  }

  setCrossOrigin(v) {
    this.player.setCrossOrigin(v)
  }

  getCurrentTime() {
    return this.player.getCurrentTime()
  }

  setCurrentTime(t) {
    this.player.setCurrentTime(t)
  }

  setDefaultMuted(v) {
    this.player.setDefaultMuted(v)
  }

  getDefaultMuted() {
    return this.player.getDefaultMuted()
  }

  getDuration() {
    return this.player.getDuration()
  }

  getEnded() {
    return this.player.getEnded()
  }

  setLoop(v) {
    this.player.setLoop(v)
  }

  getLoop() {
    return this.player.getLoop()
  }

  getMuted() {
    return this.player.getMuted()
  }

  setMuted(b) {
    this.player.setMuted(b)
  }

  getNetworkState() {
    return this.player.getNetworkState()
  }

  setPlaybackRate(v) {
    this.player.setPlaybackRate(v)
  }

  getPlaybackRate() {
    return this.player.getPlaybackRate()
  }

  getPlayed() {
    return this.player.getPlayed()
  }

  getPreload() {
    return this.player.getPreload()
  }

  setPreload(v) {
    this.player.setPreload(v)
  }

  getReadyState() {
    return this.player.getReadyState()
  }

  getSrc() {
    return this.player.getSrc()
  }

  setSrc(url) {
    this.player.setSrc(url)
  }

  getVolume() {
    return this.player.getVolume()
  }

  setVolume(v) {
    this.player.setVolume(v)
  }

  getControls() {
    return this.player.getControls()
  }

  setControls(val) {
    this.player.setControls(val)
  }

  setIsOver(val) {
    this.player.setIsOver(val)
  }

  getIsOver() {
    return this.player.getIsOver()
  }

  getSeeking() {
    return this.player.getSeeking()
  }

  getSeekable() {
    return this.player.getSeekable()
  }

  getIsLive() {
    return this.player.getIsLive()
  }

  getEstimateNetSpeed() {
    return this.player.getEstimateNetSpeed()
  }

  getRoot() {
    return this.player.getRoot()
  }

  getOwner() {
    return this.player.getOwner()
  }

  setStore(store) {
    this.player.setStore(store)
  }

  getStore() {
    return this.player.getStore()
  }

  emit2All(act, data) {
    this.getOwner() && this.getOwner().emit(act, data)
  }

  getDownloadSize() {
    return this.player.getDownloadSize()
  }

  getVideo() {
    return this.player.video
  }
}
