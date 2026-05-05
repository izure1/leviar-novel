// =============================================================
// audio.ts — 오디오 재생/일시정지/정지 모듈 (AudioManager 위임)
// =============================================================

import { define } from '../define/defineCmdUI'
import type { AudioKeysOf } from '../types/config'
import type { AudioManager } from '../core/AudioManager'

// ─── 타입 정의 ───────────────────────────────────────────────

/** play action에서만 사용할 수 있는 추가 속성 */
interface AudioPlayExtra<TConfig = any> {
  /** config.audios에서 등록한 오디오 키 (재생할 오디오 에셋) */
  src: AudioKeysOf<TConfig>
  /** 재생 속도입니다. 기본값: 1 */
  speed?: number
  /** 볼륨입니다. 0~1 사이 값. 기본값: 1 */
  volume?: number
  /** 반복 재생 여부입니다. 기본값: false */
  repeat?: boolean
  /** 재생을 시작할 시간(초)입니다. */
  start?: number
  /** 재생을 종료할 시간(초)입니다. */
  end?: number
}

/** play action 커맨드 */
export interface AudioPlayCmd<TConfig = any> extends AudioPlayExtra<TConfig> {
  /** 수행할 동작입니다. ('play': 재생) */
  action: 'play'
  /** 오디오의 식별자입니다. 같은 name의 오디오를 재생하면 크로스페이드됩니다. */
  name: string
  /**
   * 페이드인 지속 시간(ms)입니다.
   * - 이전 오디오가 있으면 duration만큼 페이드아웃 후 정지
   * - 새 오디오를 duration만큼 페이드인
   */
  duration?: number
}

/** pause action 커맨드 */
export interface AudioPauseCmd {
  /** 수행할 동작입니다. ('pause': 일시정지) */
  action: 'pause'
  /** 오디오의 식별자입니다. */
  name: string
  /** 페이드아웃 지속 시간(ms)입니다. */
  duration?: number
}

/** stop action 커맨드 */
export interface AudioStopCmd {
  /** 수행할 동작입니다. ('stop': 정지) */
  action: 'stop'
  /** 오디오의 식별자입니다. */
  name: string
  /** 페이드아웃 지속 시간(ms)입니다. */
  duration?: number
}

/** audio 커맨드 유니온 타입 */
export type AudioCmd<TConfig = any> = AudioPlayCmd<TConfig> | AudioPauseCmd | AudioStopCmd

// ─── AudioHook 타입 ──────────────────────────────────────────────

export interface AudioEventPayload {
  name: string
  src: string
}

export interface AudioHook {
  'audio:play': (cmd: AudioPlayCmd<any>) => AudioPlayCmd<any>
  'audio:pause': (cmd: AudioPauseCmd) => AudioPauseCmd
  'audio:stop': (cmd: AudioStopCmd) => AudioStopCmd
  'audio:end': (payload: AudioEventPayload) => AudioEventPayload
  'audio:repeat': (payload: AudioEventPayload) => AudioEventPayload
}

// ─── 스키마 ──────────────────────────────────────────────────

/** name별 오디오 재생 상태 스냅샷 */
export interface AudioTrack {
  /** config.audios 키 */
  src: string
  /** 현재 볼륨 (0~1) */
  volume: number
  /** 재생 속도 */
  speed: number
  /** 반복 여부 */
  repeat: boolean
  /** 재생 시작 위치(초) */
  start: number
  /** 재생 종료 위치(초) — 0이면 제한 없음 */
  end: number
  /** 일시정지 상태 여부 */
  paused: boolean
}

export interface AudioSchema {
  /** @internal name → AudioTrack 맵 */
  _tracks: Record<string, AudioTrack>
}

// ─── 모듈 정의 ───────────────────────────────────────────────

/**
 * 오디오 모듈.
 * - play: `config.audios`에 등록된 키로 오디오 재생
 * - pause: 일시정지
 * - stop: 정지 및 제거
 *
 * 실제 오디오 재생/관리는 Novel 인스턴스의 `AudioManager`에 위임합니다.
 */
const audioModule = define<AudioCmd<any>, AudioSchema, AudioHook>({ _tracks: {} })

audioModule.defineView((ctx, data) => {
  const audioMap = (ctx.renderer.config as any).audios as Record<string, string> | undefined
  const audioManager = (ctx.novel as any).audio as AudioManager | undefined

  if (audioManager && audioMap) {
    audioManager.restoreFromTracks(data._tracks, audioMap)
  }

  return {
    show: () => { },
    hide: () => { },
    onCleanup: () => { },
    onUpdate: (_ctx, state, _setState) => {
      // state 변경 시 AudioManager에 동기화
      if (!audioManager || !audioMap) return
      audioManager.restoreFromTracks(state._tracks, audioMap)
    },
  }
})

audioModule.defineCommand(function* (cmd, ctx, state, setState) {
  const audioMap = (ctx.renderer.config as any).audios as Record<string, string> | undefined
  const audioManager = (ctx.novel as any).audio as AudioManager | undefined

  // ─── play ───────────────────────────────────────────────
  if (cmd.action === 'play') {
    const playCmd = cmd as AudioPlayCmd<any>
    const url = audioMap?.[playCmd.src as string]
    if (!url) {
      console.warn(`[audio] 등록되지 않은 오디오 키: "${String(playCmd.src)}"`)
      return true
    }

    const targetVolume = playCmd.volume ?? 1
    const speed = playCmd.speed ?? 1
    const repeat = playCmd.repeat ?? false
    const startSec = playCmd.start ?? 0
    const endSec = playCmd.end ?? 0
    const duration = playCmd.duration ?? 0

    // 현재 재생 중인 src (AudioManager에서 조회)
    const currentSrc = audioManager?.getSrcKeys().get(playCmd.name)

    audioManager?.play(playCmd.name, url, {
      src: playCmd.src as string,
      volume: targetVolume,
      speed,
      repeat,
      startSec,
      endSec,
      duration,
    }, currentSrc, playCmd)

    // 상태 저장
    const newTracks = { ...state._tracks }
    const existing = newTracks[playCmd.name]
    if (existing && currentSrc === (playCmd.src as string)) {
      // 같은 src: 설정값만 업데이트
      newTracks[playCmd.name] = { ...existing, volume: targetVolume, speed, repeat, paused: false }
    } else {
      newTracks[playCmd.name] = {
        src: playCmd.src as string,
        volume: targetVolume,
        speed,
        repeat,
        start: startSec,
        end: endSec,
        paused: false,
      }
    }
    setState({ _tracks: newTracks })

    return true
  }

  // ─── pause ──────────────────────────────────────────────
  if (cmd.action === 'pause') {
    const pauseCmd = cmd as AudioPauseCmd
    const duration = pauseCmd.duration ?? 0
    const track = state._tracks[pauseCmd.name]
    const trackVolume = track?.volume ?? 1

    if (duration > 0) {
      audioManager?.pause(pauseCmd.name, trackVolume, pauseCmd, duration).then(() => {
        const newTracks = { ...state._tracks }
        if (newTracks[pauseCmd.name]) {
          newTracks[pauseCmd.name] = { ...newTracks[pauseCmd.name], paused: true }
        }
        setState({ _tracks: newTracks })
        ctx.callbacks.advance()
      })
      yield false
    } else {
      audioManager?.pause(pauseCmd.name, trackVolume, pauseCmd, 0)
      const newTracks = { ...state._tracks }
      if (newTracks[pauseCmd.name]) {
        newTracks[pauseCmd.name] = { ...newTracks[pauseCmd.name], paused: true }
      }
      setState({ _tracks: newTracks })
    }

    return true
  }

  // ─── stop ───────────────────────────────────────────────
  if (cmd.action === 'stop') {
    const stopCmd = cmd as AudioStopCmd
    const duration = stopCmd.duration ?? 0

    if (duration > 0) {
      audioManager?.stop(stopCmd.name, stopCmd, duration).then(() => {
        const newTracks = { ...state._tracks }
        delete newTracks[stopCmd.name]
        setState({ _tracks: newTracks })
        ctx.callbacks.advance()
      })
      yield false
    } else {
      audioManager?.stop(stopCmd.name, stopCmd, 0)
      const newTracks = { ...state._tracks }
      delete newTracks[stopCmd.name]
      setState({ _tracks: newTracks })
    }

    return true
  }

  return true
})

export default audioModule
