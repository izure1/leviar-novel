// =============================================================
// AudioManager.ts — Novel 인스턴스 내 오디오 관리 클래스
// =============================================================

import type { IHookallSync } from 'hookall'
import type { AudioHook, AudioTrack, AudioPlayCmd, AudioPauseCmd, AudioStopCmd } from '../modules/audio'
import type { SceneContext } from './SceneContext'

// ─── 내부 타입 ───────────────────────────────────────────────

interface ManagedAudioElement extends HTMLAudioElement {
  __srcKey?: string
  __fadeId?: number
  __startSec?: number
  __endSec?: number
}

let _fadeCounter = 0

// ─── 볼륨 페이드 헬퍼 ────────────────────────────────────────

function fadeVolume(
  audio: ManagedAudioElement,
  targetVolume: number,
  duration: number,
  stopOnEnd: boolean = false
): Promise<void> {
  return new Promise<void>((resolve) => {
    _fadeCounter++
    const currentFadeId = _fadeCounter
    audio.__fadeId = currentFadeId

    const cleanup = () => {
      if (stopOnEnd) {
        audio.pause()
        audio.src = ''
      }
      resolve()
    }

    if (duration <= 0) {
      audio.volume = Math.max(0, Math.min(targetVolume, 1))
      if (audio.__fadeId === currentFadeId) audio.__fadeId = undefined
      cleanup()
      return
    }

    const startVolume = audio.volume
    const startTime = Date.now()

    const timer = setInterval(() => {
      if (audio.__fadeId !== currentFadeId) {
        clearInterval(timer)
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
      }
    }, 16)
  })
}

// =============================================================
// AudioManager
// =============================================================

export interface PlayOptions {
  src: string
  volume: number
  speed: number
  repeat: boolean
  startSec: number
  endSec: number
  duration: number
}

/**
 * Novel 인스턴스에 속하는 오디오 관리 클래스.
 * pool, fading, crossfade, timeupdate 이벤트, 훅 트리거를 담당합니다.
 * audio 모듈은 이 클래스에 위임하는 얇은 레이어로 동작합니다.
 */
export class AudioManager {
  /** name → 현재 재생 중인 HTMLAudioElement */
  private readonly _pool = new Map<string, ManagedAudioElement>()

  /**
   * 페이드아웃 중인 엘리먼트 보호 셋.
   * pool에서 제거되었지만 페이드아웃이 끝나기 전까지 강제 종료되지 않도록 보호합니다.
   */
  private readonly _fading = new Set<ManagedAudioElement>()

  private readonly _hooker: IHookallSync<AudioHook>
  private _ctxProvider: (() => { ctx: SceneContext; vars: Record<string, any> }) | null = null

  constructor(hooker: IHookallSync<AudioHook>) {
    this._hooker = hooker
  }

  /** Novel 인스턴스가 현재 활성 씬의 ctx/vars를 반환하는 함수를 주입합니다. */
  setCtxProvider(fn: () => { ctx: SceneContext; vars: Record<string, any> }): void {
    this._ctxProvider = fn
  }

  private _getCtxVars(): { ctx: SceneContext; vars: Record<string, any> } {
    if (!this._ctxProvider) {
      throw new Error('[fumika] Audio operations require an active scene. Call novel.start() first.')
    }
    return this._ctxProvider()
  }

  // ─── 재생 ───────────────────────────────────────────────────

  /**
   * 오디오를 재생합니다.
   * - 같은 name + 같은 src: 기존 재생 유지, 설정값만 업데이트
   * - 다른 src (또는 없음): 기존 크로스페이드 아웃 후 새 오디오 생성
   */
  play(
    name: string,
    url: string,
    opts: PlayOptions,
    currentSrc: string | undefined,
    playCmd: AudioPlayCmd<any>
  ): void {
    const { ctx, vars } = this._getCtxVars()
    const existing = this._pool.get(name)
    const existingSrc = existing ? currentSrc : undefined

    // ── 같은 name + 같은 src: 재생 유지, 설정값만 업데이트 ──
    if (existing && existingSrc === opts.src) {
      existing.playbackRate = opts.speed
      existing.loop = opts.repeat
      existing.__startSec = opts.startSec
      existing.__endSec = opts.endSec

      if (existing.paused) {
        existing.play().catch((e) => {
          console.warn(`[audio] 재생 재개 실패: "${opts.src}"`, e)
        })
      }

      fadeVolume(existing, opts.volume, opts.duration)
      this._hooker.trigger('audio:play', playCmd, (val) => val, ctx, vars)
      return
    }

    // ── 다른 src (또는 없음): 크로스페이드 아웃 후 새 생성 ──
    if (existing) {
      this._fading.add(existing)
      fadeVolume(existing, 0, opts.duration, true).then(() => {
        this._fading.delete(existing)
      })
    }

    const audio = new Audio(url) as ManagedAudioElement
    audio.__srcKey = opts.src
    audio.volume = opts.duration > 0 ? 0 : opts.volume
    audio.playbackRate = opts.speed
    audio.loop = opts.repeat
    audio.currentTime = opts.startSec
    audio.__startSec = opts.startSec
    audio.__endSec = opts.endSec

    this._attachEvents(audio, name)

    this._pool.set(name, audio)
    audio.play().catch((e) => {
      console.warn(`[audio] 재생 실패: "${opts.src}"`, e)
    })

    if (opts.duration > 0) {
      fadeVolume(audio, opts.volume, opts.duration)
    }

    this._hooker.trigger('audio:play', playCmd, (val) => val, ctx, vars)
  }

  // ─── 일시정지 ───────────────────────────────────────────────

  /**
   * 오디오를 일시정지합니다.
   * duration이 있으면 페이드아웃 후 정지하고 Promise가 resolve됩니다.
   */
  pause(name: string, trackVolume: number, pauseCmd: AudioPauseCmd, duration: number): Promise<void> {
    const { ctx, vars } = this._getCtxVars()
    const audio = this._pool.get(name)
    if (!audio) return Promise.resolve()

    if (duration > 0) {
      return fadeVolume(audio, 0, duration).then(() => {
        audio.pause()
        audio.volume = trackVolume
        this._hooker.trigger('audio:pause', pauseCmd, (val) => val, ctx, vars)
      })
    }

    audio.pause()
    audio.volume = trackVolume
    this._hooker.trigger('audio:pause', pauseCmd, (val) => val, ctx, vars)
    return Promise.resolve()
  }

  // ─── 정지 ───────────────────────────────────────────────────

  /**
   * 오디오를 정지하고 풀에서 제거합니다.
   * duration이 있으면 페이드아웃 후 정지합니다.
   */
  stop(name: string, stopCmd: AudioStopCmd, duration: number): Promise<void> {
    const { ctx, vars } = this._getCtxVars()
    const audio = this._pool.get(name)
    if (!audio) return Promise.resolve()

    this._pool.delete(name)

    if (duration > 0) {
      this._fading.add(audio)
      return fadeVolume(audio, 0, duration, true).then(() => {
        this._fading.delete(audio)
        this._hooker.trigger('audio:stop', stopCmd, (val) => val, ctx, vars)
      })
    }

    audio.pause()
    audio.currentTime = 0
    audio.src = ''
    this._hooker.trigger('audio:stop', stopCmd, (val) => val, ctx, vars)
    return Promise.resolve()
  }

  // ─── 전체 정지 ───────────────────────────────────────────────

  /** 재생 중인 모든 오디오를 페이드아웃 후 정지합니다. */
  stopAll(duration: number = 0): void {
    for (const [name, audio] of this._pool.entries()) {
      this._fading.add(audio)
      fadeVolume(audio, 0, duration, true).then(() => {
        this._fading.delete(audio)
      })
      this._pool.delete(name)
    }
  }

  // ─── 위치 동기화 ─────────────────────────────────────────────

  /**
   * 재생 중인 각 audio의 currentTime을 tracks[name].start에 직접 반영합니다.
   * Novel._callScene()이 storeSnapshot 캡처 직전에 호출합니다.
   */
  syncPositions(tracks: Record<string, AudioTrack>): void {
    for (const [name, audio] of this._pool.entries()) {
      const track = tracks[name]
      if (track && !audio.paused) {
        track.start = audio.currentTime
      }
    }
  }

  // ─── 상태 복원 ───────────────────────────────────────────────

  /**
   * 세이브 데이터 또는 씬 상태로부터 오디오 풀을 재구성합니다.
   * defineView 또는 loadSave 후에 호출됩니다.
   *
   * @param tracks  - name → AudioTrack 스냅샷
   * @param audioMap - config.audios (key → url)
   */
  restoreFromTracks(
    tracks: Record<string, AudioTrack>,
    audioMap: Record<string, string>
  ): void {
    // 1. 사라진 트랙 정리 (페이드아웃 중인 audio는 건드리지 않음)
    for (const [name, audio] of this._pool.entries()) {
      if (!tracks[name]) {
        if (this._fading.has(audio)) continue
        this._fading.add(audio)
        fadeVolume(audio, 0, 1000, true).then(() => {
          this._fading.delete(audio)
        })
        this._pool.delete(name)
      }
    }

    // 2. 트랙 복원 및 동기화
    for (const [name, track] of Object.entries(tracks)) {
      const url = audioMap[track.src]
      if (!url) continue

      let audio = this._pool.get(name)
      if (!audio) {
        // 새로 생성
        audio = new Audio(url) as ManagedAudioElement
        audio.__srcKey = track.src
        audio.volume = track.volume
        audio.playbackRate = track.speed
        audio.loop = track.repeat
        audio.currentTime = track.start
        audio.__startSec = track.start
        audio.__endSec = track.end
        this._attachEvents(audio, name)
        this._pool.set(name, audio)

        if (!track.paused) {
          audio.play().catch((e) => console.warn(`[audio] 복원 재생 실패:`, e))
        }
      } else if (audio.__srcKey !== track.src) {
        // src 변경
        audio.pause()
        audio.src = url
        audio.__srcKey = track.src
        audio.volume = track.volume
        audio.playbackRate = track.speed
        audio.loop = track.repeat
        audio.currentTime = track.start
        audio.__startSec = track.start
        audio.__endSec = track.end
        this._attachEvents(audio, name)

        if (!track.paused) {
          audio.play().catch((e) => console.warn(`[audio] 재생 실패:`, e))
        }
      } else {
        // 동기화만
        if (audio.__fadeId === undefined) {
          audio.volume = track.volume
        }
        audio.playbackRate = track.speed
        audio.loop = track.repeat
        audio.__startSec = track.start
        audio.__endSec = track.end

        if (track.paused) {
          audio.pause()
        } else if (audio.paused) {
          audio.play().catch((e) => console.warn(`[audio] 재생 재개 실패:`, e))
        }
      }
    }
  }

  // ─── pool 조회 ───────────────────────────────────────────────

  /** 특정 name의 재생 중인 엘리먼트를 반환합니다. */
  getAudio(name: string): ManagedAudioElement | undefined {
    return this._pool.get(name)
  }

  /** 현재 pool에 있는 name → srcKey 맵을 반환합니다. */
  getSrcKeys(): Map<string, string | undefined> {
    const result = new Map<string, string | undefined>()
    for (const [name, audio] of this._pool.entries()) {
      result.set(name, audio.__srcKey)
    }
    return result
  }

  // ─── 내부 이벤트 바인딩 ──────────────────────────────────────

  private _attachEvents(audio: ManagedAudioElement, name: string): void {
    // 기존 리스너 제거 후 재등록 (src 변경 시 중복 방지)
    // cloneNode 대신 새 Audio()로 생성하므로 리스너 누적 없음 — play/stop 시 새 인스턴스 생성
    let lastTime = audio.__startSec ?? 0

    audio.addEventListener('timeupdate', () => {
      const currentRepeat = audio.loop
      const currentEndSec = audio.__endSec ?? 0
      const currentStartSec = audio.__startSec ?? 0

      // 자연 루프 감지 (loop=true이고 endSec 없을 때 시간이 과거로 돌아가면 루프)
      if (currentRepeat && currentEndSec === 0) {
        if (audio.currentTime < lastTime - 0.5) {
          const { ctx, vars } = this._getCtxVars()
          this._hooker.trigger(
            'audio:repeat',
            { name, src: audio.__srcKey! },
            (val) => val,
            ctx,
            vars
          )
        }
      }
      lastTime = audio.currentTime

      // 구간 반복/종료 감지
      if (currentEndSec > 0 && audio.currentTime >= currentEndSec) {
        audio.pause()
        audio.currentTime = currentStartSec
        if (currentRepeat) {
          const { ctx, vars } = this._getCtxVars()
          this._hooker.trigger(
            'audio:repeat',
            { name, src: audio.__srcKey! },
            (val) => val,
            ctx,
            vars
          )
          audio.play().catch(() => {})
        } else {
          const { ctx, vars } = this._getCtxVars()
          this._hooker.trigger(
            'audio:end',
            { name, src: audio.__srcKey! },
            (val) => val,
            ctx,
            vars
          )
        }
      }
    })

    audio.addEventListener('ended', () => {
      const currentRepeat = audio.loop
      const currentEndSec = audio.__endSec ?? 0
      if (!currentRepeat && currentEndSec === 0) {
        const { ctx, vars } = this._getCtxVars()
        this._hooker.trigger(
          'audio:end',
          { name, src: audio.__srcKey! },
          (val) => val,
          ctx,
          vars
        )
      }
    })
  }
}
