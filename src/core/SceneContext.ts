import type { World } from 'leviar'
import type { Renderer } from './Renderer'
import type { SceneCallbacks } from './Scene'
import type { CustomCmdContext } from '../types/config'

/**
 * 커맨드 핸들러 실행 시 제공되는 씬(Scene)의 컨텍스트 정보
 */
export interface SceneContext<TVars = any, TLocalVars = any> extends CustomCmdContext<TVars, TLocalVars> {
  /** Leviar-novel 렌더러 인스턴스 (화면 렌더링 담당) */
  renderer: Renderer
  /** Novel 엔진 본체와의 통신을 위한 콜백 함수들 */
  callbacks: SceneCallbacks
  /** 현재 실행 중인 씬을 조작하기 위한 메서드 모음 */
  scene: {
    /** 텍스트 배열 사용 시 현재 출력 중인 텍스트의 내부 인덱스 반환 */
    getTextSubIndex: () => number
    /** 텍스트 내의 `{{변수}}` 템플릿 문법을 실제 변수 값으로 치환하여 반환하는 헬퍼 함수 */
    interpolateText: (text: string) => string
    /** 지정된 라벨(label) 위치로 실행 커서 점프 */
    jumpToLabel: (label: string) => void
    /** 현재 씬에 지정된 라벨이 존재하는지 여부 확인 */
    hasLabel: (label: string) => boolean
    /** 전역 변수와 현재 씬의 지역 변수가 병합된 객체 반환 */
    getVars: () => TVars & TLocalVars
    /** 전역 변수 설정 (모든 씬에서 유지됨) */
    setGlobalVar: (key: string, value: any) => void
    /** 지역 변수 설정 (현재 씬 안에서만 유지됨) */
    setLocalVar: (key: string, value: any) => void
    /** 지정된 이름의 새로운 씬으로 전환 (현재 씬 종료) */
    loadScene: (name: string) => void
    /** 현재 씬의 진행을 즉시 종료 */
    end: () => void
  }
}

/**
 * 커맨드 핸들러의 실행 결과 반환값
 * - `true`: 커맨드 즉시 완료, 대기 없이 다음 스텝 자동 진행
 * - `false` | `void`: 커맨드 실행 후 멈춤, 사용자 입력(클릭/엔터 등) 대기
 * - `'handled'`: 씬 이동 등으로 인해 엔진의 기본 실행 루프 즉시 중단
 */
export type CommandResult = boolean | 'handled' | void
