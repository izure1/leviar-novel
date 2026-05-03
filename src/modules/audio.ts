// =============================================================
// audio.ts — 오디오 재생/일시정지/정지 모듈 (크로스페이드 지원)
// =============================================================

import { define } from '../define/defineCmdUI'
import type { AudioKeysOf } from '../types/config'

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
interface AudioPlayCmd<TConfig = any> extends AudioPlayExtra<TConfig> {
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
interface AudioPauseCmd {
  /** 수행할 동작입니다. ('pause': 일시정지) */
  action: 'pause'
  /** 오디오의 식별자입니다. */
  name: string
  /** 페이드아웃 지속 시간(ms)입니다. 이 시간에 걸쳐 볼륨이 0으로 줄어든 뒤 일시정지됩니다. */
  duration?: number
}

/** stop action 커맨드 */
interface AudioStopCmd {
  /** 수행할 동작입니다. ('stop': 정지) */
  action: 'stop'
  /** 오디오의 식별자입니다. */
  name: string
  /** 페이드아웃 지속 시간(ms)입니다. 이 시간에 걸쳐 볼륨이 0으로 줄어든 뒤 정지됩니다. */
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

// ─── 볼륨 페이드 헬퍼 ────────────────────────────────────────

interface NovelAudioElement extends HTMLAudioElement {
  __srcKey?: string
  __fadeId?: number
  __startSec?: number
  __endSec?: number
}

let fadeCounter = 0

/**
 * NovelAudioElement의 볼륨을 duration(ms)에 걸쳐 targetVolume까지 선형 보간합니다.
 * @returns 페이드 완료 시 resolve되는 Promise
 */
function fadeVolume(
  audio: NovelAudioElement,
  targetVolume: number,
  duration: number,
  stopOnEnd: boolean = false
): Promise<void> {
  return new Promise<void>((resolve) => {
    fadeCounter++
    const currentFadeId = fadeCounter
    audio.__fadeId = currentFadeId

    const cleanup = () => {
      if (stopOnEnd) {
        audio.pause()
        audio.src = ''
      }
      fading.delete(audio)
    }

    if (duration <= 0) {
      audio.volume = Math.max(0, Math.min(targetVolume, 1))
      if (audio.__fadeId === currentFadeId) audio.__fadeId = undefined
      cleanup()
      resolve()
      return
    }

    const startVolume = audio.volume
    const startTime = Date.now()

    const timer = setInterval(() => {
      if (audio.__fadeId !== currentFadeId) {
        // 다른 fadeVolume 호출에 의해 취소됨 — fading에서 제거
        clearInterval(timer)
        fading.delete(audio)
        return
      }

      const elapsed = Date.now() - startTime
      const t = Math.min(elapsed / duration, 1)
      audio.volume = Math.max(0, Math.min(startVolume + (targetVolume - startVolume) * t, 1))

      if (t >= 1) {
        clearInterval(timer)
        audio.volume = Math.max(0, Math.min(targetVolume, 1))
        if (audio.__fadeId === currentFadeId) audio.__fadeId = undefined
        cleanup()
        resolve()
      }
    }, 16)
  })
}

// ─── 모듈 정의 ───────────────────────────────────────────────

/** name → 현재 재생 중인 HTMLAudioElement */
const pool = new Map<string, NovelAudioElement>()

/**
 * 현재 페이드아웃 중인 오디오 엘리먼트 집합.
 * pool에서 이미 제거되었지만, 페이드아웃이 완료될 때까지
 * defineView의 cleanup 로직이 즉시 종료시키지 않도록 보호합니다.
 */
const fading = new Set<NovelAudioElement>()

/**
 * define() 내부 data 싱글톤 참조 — syncAudioPositions()에서 직접 변이에 사용.
 * defineView 최초 호출 시 주입됩니다.
 */
let _dataRef: AudioSchema | null = null

/**
 * 오디오 모듈.
 * - play: `config.audios`에 등록된 키로 오디오 재생
 * - pause: 일시정지
 * - stop: 정지 및 제거
 */
const audioModule = define<AudioCmd<any>, AudioSchema, AudioHook>({ _tracks: {} })

audioModule.defineView((ctx, data, setState) => {
  _dataRef = data as AudioSchema  // 싱글톤 참조 캡처
  const audioMap = (ctx.renderer.config as any).audios as Record<string, string> | undefined

  // 1. 삭제된 트랙 정리 (페이드아웃 중인 audio는 건드리지 않음)
  for (const [name, audio] of pool.entries()) {
    if (!data._tracks[name]) {
      if (fading.has(audio)) continue

      // 스키마에서 사라진 오디오(씬 전환 등)는 즉시 종료하지 않고 페이드아웃 처리
      fading.add(audio)
      fadeVolume(audio, 0, 1000, true).catch(() => { })

      pool.delete(name)
    }
  }

  // 2. 세이브 데이터로 트랙 복원 및 동기화
  for (const [name, track] of Object.entries(data._tracks)) {
    const url = audioMap?.[track.src]
    if (!url) continue

    let audio = pool.get(name)
    if (!audio) {
      audio = new Audio(url) as NovelAudioElement
      audio.__srcKey = track.src
      audio.volume = track.volume
      audio.playbackRate = track.speed
      audio.loop = track.repeat
      audio.currentTime = track.start
      pool.set(name, audio)

      if (!track.paused) {
        audio.play().catch(e => console.warn(`[audio] 복원 재생 실패:`, e))
      }
    } else if (audio.__srcKey !== track.src) {
      audio.pause()
      audio.src = url
      audio.__srcKey = track.src
      audio.volume = track.volume
      audio.playbackRate = track.speed
      audio.loop = track.repeat
      audio.currentTime = track.start

      if (!track.paused) {
        audio.play().catch(e => console.warn(`[audio] 재생 실패:`, e))
      }
    } else {
      if (audio.__fadeId === undefined) {
        audio.volume = track.volume
      }
      audio.playbackRate = track.speed
      audio.loop = track.repeat

      if (track.paused) {
        audio.pause()
      } else if (audio.paused) {
        audio.play().catch(e => console.warn(`[audio] 재생 재개 실패:`, e))
      }
    }
  }

  return {
    show: () => { },
    hide: () => { },
    onUpdate: (_ctx, _state, _setState) => { },
  }
})

audioModule.defineCommand(function* (cmd, ctx, state, setState) {
  // config.audios는 ctx.renderer.config에서 런타임에 조회
  const audioMap = (ctx.renderer.config as any).audios as Record<string, string> | undefined

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

    const existing = pool.get(playCmd.name)
    const existingSrc = existing ? state._tracks[playCmd.name]?.src : undefined

    // ── 같은 name + 같은 src: 기존 재생 유지, 설정값만 업데이트 ──
    if (existing && existingSrc === (playCmd.src as string)) {
      existing.playbackRate = speed
      existing.loop = repeat
      existing.__startSec = startSec
      existing.__endSec = endSec

      // 일시정지 상태였다면 다시 재생 시작
      if (existing.paused) {
        existing.play().catch((e) => {
          console.warn(`[audio] 재생 재개 실패: "${String(playCmd.src)}"`, e)
        })
      }

      // volume은 duration에 걸쳐 부드럽게 변경
      fadeVolume(existing, targetVolume, duration)
      audioModule.hooker.trigger('audio:play', playCmd, (val) => val)

      const newTracks = { ...state._tracks }
      newTracks[playCmd.name] = {
        ...newTracks[playCmd.name],
        volume: targetVolume,
        speed,
        repeat,
        paused: false,
      }
      setState({ _tracks: newTracks })

      return true
    }

    // ── 다른 src (또는 없음): 기존 크로스페이드 아웃 후 새 오디오 생성 ──
    if (existing) {
      const old = existing
      // fading 셋에 등록하여 defineView cleanup이 즉시 종료하지 않도록 보호
      fading.add(old)
      // stopOnEnd 플래그를 true로 전달하여 페이드 완료 후 안전하게 정리
      fadeVolume(old, 0, duration, true)
    }

    // 새 오디오 생성 (start/end는 새 재생에만 적용)
    const audio = new Audio(url) as NovelAudioElement
    audio.__srcKey = playCmd.src as string
    audio.volume = duration > 0 ? 0 : targetVolume
    audio.playbackRate = speed
    audio.loop = repeat
    audio.currentTime = startSec

    audio.__startSec = startSec
    audio.__endSec = endSec

    let lastTime = startSec
    audio.addEventListener('timeupdate', () => {
      const currentRepeat = audio.loop
      const currentEndSec = audio.__endSec ?? 0
      const currentStartSec = audio.__startSec ?? 0

      // 자연 루프 감지 (loop=true 이고 endSec이 없을 때 시간이 과거로 돌아가면 루프)
      if (currentRepeat && currentEndSec === 0) {
        if (audio.currentTime < lastTime - 0.5) {
          audioModule.hooker.trigger('audio:repeat', { name: playCmd.name, src: audio.__srcKey! }, (val) => val)
        }
      }
      lastTime = audio.currentTime

      // 구간 반복/종료 감지
      if (currentEndSec > 0 && audio.currentTime >= currentEndSec) {
        audio.pause()
        audio.currentTime = currentStartSec
        if (currentRepeat) {
          audioModule.hooker.trigger('audio:repeat', { name: playCmd.name, src: audio.__srcKey! }, (val) => val)
          audio.play().catch(() => {})
        } else {
          audioModule.hooker.trigger('audio:end', { name: playCmd.name, src: audio.__srcKey! }, (val) => val)
        }
      }
    })

    audio.addEventListener('ended', () => {
      const currentRepeat = audio.loop
      const currentEndSec = audio.__endSec ?? 0
      if (!currentRepeat && currentEndSec === 0) {
        audioModule.hooker.trigger('audio:end', { name: playCmd.name, src: audio.__srcKey! }, (val) => val)
      }
    })

    pool.set(playCmd.name, audio)
    audio.play().catch((e) => {
      console.warn(`[audio] 재생 실패: "${String(playCmd.src)}"`, e)
    })

    // 페이드인 (fire-and-forget, 씬은 즉시 진행)
    if (duration > 0) {
      fadeVolume(audio, targetVolume, duration)
    }
    audioModule.hooker.trigger('audio:play', playCmd, (val) => val)

    // 상태 저장
    const newPlayTracks = { ...state._tracks }
    newPlayTracks[playCmd.name] = {
      src: playCmd.src as string,
      volume: targetVolume,
      speed,
      repeat,
      start: startSec,
      end: endSec,
      paused: false,
    }
    setState({ _tracks: newPlayTracks })

    return true
  }

  // ─── pause ──────────────────────────────────────────────
  if (cmd.action === 'pause') {
    const pauseCmd = cmd as AudioPauseCmd
    const audio = pool.get(pauseCmd.name)
    if (!audio) return true

    const duration = pauseCmd.duration ?? 0

    if (duration > 0) {
      fadeVolume(audio, 0, duration).then(() => {
        audio.pause()
        // 볼륨 복원 (다음 resume을 위해)
        const track = state._tracks[pauseCmd.name]
        if (track) audio.volume = track.volume

        const newPauseTracks = { ...state._tracks }
        if (newPauseTracks[pauseCmd.name]) {
          newPauseTracks[pauseCmd.name] = { ...newPauseTracks[pauseCmd.name], paused: true }
        }
        setState({ _tracks: newPauseTracks })

        audioModule.hooker.trigger('audio:pause', pauseCmd, (val) => val)
        ctx.callbacks.advance()
      })

      yield false
    } else {
      audio.pause()
      const track = state._tracks[pauseCmd.name]
      if (track) audio.volume = track.volume

      const newPauseTracks = { ...state._tracks }
      if (newPauseTracks[pauseCmd.name]) {
        newPauseTracks[pauseCmd.name] = { ...newPauseTracks[pauseCmd.name], paused: true }
      }
      setState({ _tracks: newPauseTracks })

      audioModule.hooker.trigger('audio:pause', pauseCmd, (val) => val)
    }

    return true
  }

  // ─── stop ───────────────────────────────────────────────
  if (cmd.action === 'stop') {
    const stopCmd = cmd as AudioStopCmd
    const audio = pool.get(stopCmd.name)
    if (!audio) return true

    const duration = stopCmd.duration ?? 0

    if (duration > 0) {
      fadeVolume(audio, 0, duration).then(() => {
        audio.pause()
        audio.currentTime = 0
        audio.src = ''
        pool.delete(stopCmd.name)

        const newStopTracks = { ...state._tracks }
        delete newStopTracks[stopCmd.name]
        setState({ _tracks: newStopTracks })

        audioModule.hooker.trigger('audio:stop', stopCmd, (val) => val)
        ctx.callbacks.advance()
      })

      yield false
    } else {
      audio.pause()
      audio.currentTime = 0
      audio.src = ''
      pool.delete(stopCmd.name)

      const newStopTracks = { ...state._tracks }
      delete newStopTracks[stopCmd.name]
      setState({ _tracks: newStopTracks })

      audioModule.hooker.trigger('audio:stop', stopCmd, (val) => val)
    }

    return true
  }

  return true
})

export default audioModule

/**
 * pool에서 재생 중인 각 audio의 currentTime을 data._tracks[name].start에 직접 반영합니다.
 * _data._tracks와 _stateStore['audio']._tracks는 동일 참조이므로
 * 직접 변이만으로 다음 스냅샷에 반영됩니다.
 * Novel._callScene()이 storeSnapshot 캡처 직전에 호출합니다.
 */
export function syncAudioPositions(): void {
  if (!_dataRef) return
  for (const [name, audio] of pool.entries()) {
    const track = _dataRef._tracks[name]
    if (track && !audio.paused) {
      track.start = audio.currentTime
    }
  }
}
