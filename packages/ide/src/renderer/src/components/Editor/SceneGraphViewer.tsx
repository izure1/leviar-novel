import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Edge,
  Node,
  MarkerType,
  Position,
  Handle,
  type NodeProps
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import dagre from 'dagre'
import { useProjectStore } from '../../store/useProjectStore'

// ─── Types ───────────────────────────────────────────────────

interface FileNode {
  name: string
  isDirectory: boolean
  path: string
  children?: FileNode[]
}

interface SceneConnection {
  type: 'next' | 'call'
  target: string
  conditional: boolean
}

type FlowItem =
  | { kind: 'label', name: string, line: number }
  | { kind: 'goto', target: string, line: number }
  | { kind: 'call', target: string, line: number }
  | { kind: 'next', target: string, line: number }
  | { kind: 'condition', id: number, ifBranch: FlowItem[], elseBranch: FlowItem[], line: number }

interface ParseResult {
  flowItems: FlowItem[]
  externalConnections: SceneConnection[]
}

interface HandleInfo {
  id: string
  type: 'source' | 'target'
  kind: 'label' | 'goto' | 'call' | 'next' | 'condition-if' | 'condition-else' | 'entry'
  label: string
  depth: number
  line?: number
}

interface RowItem {
  kind: FlowItem['kind']
  label: string
  handles: HandleInfo[]
  depth: number
  branchLabel?: string
  line?: number
}

// ─── Style lookup tables ─────────────────────────────────────

const SUB_STYLES: Record<string, { bg: string, border: string, text: string }> = {
  label:     { bg: '#064e3b', border: '#10b981', text: '#6ee7b7' },
  goto:      { bg: '#451a03', border: '#f59e0b', text: '#fcd34d' },
  next:      { bg: '#2e1065', border: '#8b5cf6', text: '#c4b5fd' },
  call:      { bg: '#431407', border: '#f97316', text: '#fdba74' },
  condition: { bg: '#422006', border: '#eab308', text: '#fde047' },
}

const EXT_EDGE_STYLES: Record<string, { color: string, dash: string }> = {
  next: { color: '#8b5cf6', dash: 'none' },
  call: { color: '#f59e0b', dash: '5,5' },
  goto: { color: '#f59e0b', dash: '3,3' },
}

// ─── Blueprint row constants ─────────────────────────────────

const ROW_STRIDE = 30  // 28px (h-7) + 2px (my-px margin top + bottom)
const HEADER_H = 44
const NODE_W = 320
const ROWS_PAD_TOP = 4 // py-1

const SUB_ICONS: Record<string, string> = {
  label: '⌗',
  goto: '⇥',
  next: '→',
  call: '↗',
  condition: '◇',
}

// ─── Custom Node: Scene Block (Blueprint) ────────────────────

function SceneBlockComponent({ data }: NodeProps) {
  const rows = (data.rows || []) as RowItem[]
  const handles = (data.handles || []) as HandleInfo[]
  const entryHandle = handles.find(h => h.kind === 'entry')
  const { setPendingLine, setActiveFile, setIsGraphOpen } = useProjectStore()

  return (
    <div
      className="group relative bg-surface-900/95 backdrop-blur-md border border-surface-700/60 rounded-lg shadow-xl transition-all duration-300 hover:shadow-primary-500/15 hover:border-primary-500/40"
      style={{ minWidth: NODE_W }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none" />

      {/* ── Header ── */}
      <div
        className="relative flex items-center gap-3 px-4 border-b border-surface-700/40 rounded-t-lg"
        style={{ height: HEADER_H, background: 'linear-gradient(135deg, rgba(139,92,246,0.08), transparent)' }}
      >
        {entryHandle && (
          <Handle
            type="target"
            position={Position.Left}
            id={entryHandle.id}
            className="!w-3 !h-3 !bg-surface-800 !border-2 !border-primary-500 rounded-full"
            style={{ top: HEADER_H / 2, left: -6 }}
          />
        )}
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-surface-800/80 border border-surface-700/50 text-primary-400 shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[9px] font-bold text-primary-500/70 uppercase tracking-wider">Scene</span>
          <span className="text-xs font-bold text-surface-100 font-mono truncate" title={String(data.label || '')}>
            {String(data.label || '')}
          </span>
        </div>
      </div>

      {/* ── Flow rows ── */}
      <div className="py-1">
        {rows.map((row, ri) => {
          const s = SUB_STYLES[row.kind] || SUB_STYLES.label
          const icon = SUB_ICONS[row.kind] || '•'

          return (
            <div
              key={ri}
              onDoubleClick={(e) => {
                e.stopPropagation()
                if (row.line !== undefined) setPendingLine(row.line)
                if (data.fullPath) {
                  setActiveFile(String(data.fullPath))
                  setIsGraphOpen(false)
                }
              }}
              className="relative flex items-center h-7 px-3 mx-1 my-px rounded cursor-pointer transition-colors hover:brightness-125"
              style={{
                paddingLeft: 12 + row.depth * 14,
                background: `${s.bg}40`,
              }}
            >
              {/* Row handles */}
              {row.handles.map((h) => (
                <Handle
                  key={h.id}
                  type={h.type}
                  position={h.type === 'target' ? Position.Left : Position.Right}
                  id={h.id}
                  className="!w-2 !h-2 !rounded-full !border-none"
                  style={{
                    background: s.border,
                    ...(h.type === 'target' ? { left: -4 } : { right: -4 }),
                    top: '50%',
                    transform: 'translateY(-50%)'
                  }}
                />
              ))}

              {/* Branch label (if/else) */}
              {row.branchLabel && (
                <span
                  className="text-[9px] font-bold uppercase tracking-wider mr-1.5 shrink-0"
                  style={{ color: row.branchLabel === 'if' ? '#10b981' : '#ef4444' }}
                >
                  {row.branchLabel}
                </span>
              )}

              {/* Icon */}
              <span
                className="flex items-center justify-center w-4 h-4 rounded-full shrink-0 mr-1.5"
                style={{ color: s.border, background: `${s.border}20`, fontSize: '10px' }}
              >
                {icon}
              </span>

              {/* Kind tag */}
              <span className="text-[9px] font-bold uppercase tracking-wider shrink-0 mr-2" style={{ color: s.text }}>
                {row.kind === 'condition' ? 'cond' : row.kind}
              </span>

              {/* Label */}
              {row.label && (
                <span
                  className="text-[11px] font-medium truncate flex-1 text-right font-mono"
                  style={{ color: '#cbd5e1' }}
                  title={row.label}
                >
                  {row.label}
                </span>
              )}
            </div>
          )
        })}
        {rows.length === 0 && (
          <div className="h-7 flex items-center justify-center text-[10px] text-surface-500 italic">
            (empty)
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Custom Node: Missing Scene ──────────────────────────────

function MissingNodeComponent({ data }: NodeProps) {
  return (
    <div className="group relative flex items-center min-w-[220px] px-4 py-3 bg-red-950/60 backdrop-blur-md border border-red-900/50 rounded-md shadow-lg transition-all duration-300 hover:shadow-red-500/20 hover:border-red-500/50 hover:-translate-y-0.5">
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-md pointer-events-none" />
      <Handle
        type="target"
        position={Position.Left}
        id={`${String(data.sceneId || data.label || '')}__entry`}
        className="!w-3 !h-3 !bg-surface-800 !border-2 !border-red-500 rounded-full !-ml-1.5"
      />

      <div className="flex items-center gap-3 relative z-10 w-full">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-950/80 border border-red-900/50 text-red-400 shadow-inner shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-bold text-red-400/80 uppercase tracking-wider mb-0.5">Missing Scene</span>
          <span className="text-sm font-bold text-red-200 font-mono truncate w-full" title={String(data.label || '').replace(' (Missing)', '')}>
            {String(data.label || '').replace(' (Missing)', '')}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── nodeTypes (defined outside component to prevent re-renders) ─

const nodeTypes = {
  'scene-block': SceneBlockComponent,
  missing: MissingNodeComponent,
}

// ─── dagre layout (dynamic node sizes) ───────────────────────

function getLayoutedElements(nodes: Node[], edges: Edge[], direction = 'LR') {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))

  const isHorizontal = direction === 'LR'
  g.setGraph({ rankdir: direction, ranksep: 120, nodesep: 40, edgesep: 30 })

  for (const node of nodes) {
    if (node.type === 'missing') {
      g.setNode(node.id, { width: 220, height: 65 })
    } else {
      const rowCount = Math.max(1, ((node.data?.rows as RowItem[])?.length ?? 0))
      const h = HEADER_H + ROWS_PAD_TOP * 2 + rowCount * ROW_STRIDE
      g.setNode(node.id, { width: NODE_W, height: h })
    }
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target)
  }

  dagre.layout(g)

  for (const node of nodes) {
    const pos = g.node(node.id)
    const w = node.type === 'missing' ? 220 : NODE_W
    const rowCount = Math.max(1, ((node.data?.rows as RowItem[])?.length ?? 0))
    const h = node.type === 'missing' ? 65 : HEADER_H + ROWS_PAD_TOP * 2 + rowCount * ROW_STRIDE
    node.targetPosition = isHorizontal ? Position.Left : Position.Top
    node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom
    node.position = {
      x: pos.x - w / 2,
      y: pos.y - h / 2,
    }
  }

  return { nodes, edges }
}

// ─── Bracket-depth-tracking scene parser ─────────────────────

function extractStringArg(content: string, start: number): { value: string, end: number } | null {
  let i = start
  while (i < content.length && /\s/.test(content[i])) i++
  const q = content[i]
  if (q !== "'" && q !== '"' && q !== '`') return null
  i++
  let val = ''
  while (i < content.length && content[i] !== q) {
    if (content[i] === '\\') { val += content[++i]; i++; continue }
    val += content[i++]
  }
  return { value: val, end: i }
}

function findMatchingBracket(content: string, pos: number, open: string, close: string): number {
  let depth = 1
  let i = pos + 1
  while (i < content.length && depth > 0) {
    const ch = content[i]
    if (ch === "'" || ch === '"' || ch === '`') {
      i++
      while (i < content.length && content[i] !== ch) {
        if (content[i] === '\\') i++
        i++
      }
    } else if (ch === open) {
      depth++
    } else if (ch === close) {
      depth--
    }
    i++
  }
  return i - 1
}

let _condUid = 0

function parseSceneContent(rawContent: string): ParseResult {
  // Strip comments but preserve length and newlines to keep line numbers accurate
  const content = rawContent.replace(/(["'`])(?:(?!\1)[^\\]|\\.)*\1|\/\/.*|\/\*[\s\S]*?\*\//g, (match) => {
    if (match.startsWith('//') || match.startsWith('/*')) {
      return match.replace(/[^\n]/g, ' ')
    }
    return match
  })

  const externalConnections: SceneConnection[] = []
  const seen = new Set<string>()
  _condUid = 0
  const optionFlowItems: FlowItem[] = []

  // Helper: character offset → 1-based line number
  function offsetToLine(offset: number): number {
    let line = 1
    for (let i = 0; i < offset && i < content.length; i++) {
      if (content[i] === '\n') line++
    }
    return line
  }

  // 1. defineScene option-level next
  const optNextMatch = content.match(/defineScene\s*\(\s*\{/)
  if (optNextMatch && optNextMatch.index != null) {
    const braceStart = content.indexOf('{', optNextMatch.index)
    const braceEnd = findMatchingBracket(content, braceStart, '{', '}')
    const optBlock = content.slice(braceStart, braceEnd + 1)
    const objNext = optBlock.match(/next\s*:\s*\{\s*scene\s*:\s*['"`]([^'"`]+)['"`]/)
    if (objNext && objNext.index != null) {
      const k = `next:${objNext[1]}`
      if (!seen.has(k)) {
        seen.add(k)
        externalConnections.push({ type: 'next', target: objNext[1], conditional: false })
        optionFlowItems.push({ kind: 'next', target: objNext[1], line: offsetToLine(braceStart + objNext.index) })
      }
    }
    const strNext = optBlock.match(/next\s*:\s*['"`]([^'"`]+)['"`]/)
    if (strNext && strNext.index != null) {
      const k = `next:${strNext[1]}`
      if (!seen.has(k)) {
        seen.add(k)
        externalConnections.push({ type: 'next', target: strNext[1], conditional: false })
        optionFlowItems.push({ kind: 'next', target: strNext[1], line: offsetToLine(braceStart + strNext.index) })
      }
    }
  }

  // 2. Find builder array
  const builderMatch = content.match(/\)\s*\(\s*\(\s*\{[^}]*\}\s*\)\s*=>\s*\[/)
  if (!builderMatch || builderMatch.index == null) {
    return { flowItems: optionFlowItems, externalConnections }
  }
  const arrayStart = content.indexOf('[', builderMatch.index + builderMatch[0].length - 1)
  const arrayEnd = findMatchingBracket(content, arrayStart, '[', ']')
  const body = content.slice(arrayStart, arrayEnd + 1)

  // 3. Recursive scan → FlowItem[]
  // textOffset = offset of `text` within the full `content`
  function scan(text: string, isConditional: boolean, textOffset: number): FlowItem[] {
    const items: FlowItem[] = []
    const tokenRegex = /\b(label|goto|next|call|condition)\s*\(|goto\s*:\s*['"`]([^'"`]+)['"`]/g
    let m: RegExpExecArray | null

    while ((m = tokenRegex.exec(text)) !== null) {
      const matchLine = offsetToLine(textOffset + m.index)
      if (m[2]) { items.push({ kind: 'goto', target: m[2], line: matchLine }); continue }
      const fnName = m[1]
      const afterName = m.index + m[0].length

      if (fnName === 'condition') {
        const parenStart = afterName - 1
        const parenEnd = findMatchingBracket(text, parenStart, '(', ')')
        const condBody = text.slice(afterName, parenEnd)
        const arrays: { text: string, offset: number }[] = []
        let sf = 0
        while (sf < condBody.length) {
          const bi = condBody.indexOf('[', sf)
          if (bi === -1) break
          const be = findMatchingBracket(condBody, bi, '[', ']')
          arrays.push({ text: condBody.slice(bi + 1, be), offset: textOffset + afterName + bi + 1 })
          sf = be + 1
        }
        const ifBranch = arrays[0] ? scan(arrays[0].text, true, arrays[0].offset) : []
        const elseBranch = arrays[1] ? scan(arrays[1].text, true, arrays[1].offset) : []
        items.push({ kind: 'condition', id: _condUid++, ifBranch, elseBranch, line: matchLine })
        tokenRegex.lastIndex = afterName + (parenEnd - afterName)
        continue
      }

      const arg = extractStringArg(text, afterName)
      if (!arg) continue
      switch (fnName) {
        case 'label': items.push({ kind: 'label', name: arg.value, line: matchLine }); break
        case 'goto': items.push({ kind: 'goto', target: arg.value, line: matchLine }); break
        case 'next': {
          items.push({ kind: 'next', target: arg.value, line: matchLine })
          const k = `next:${arg.value}:${isConditional}`
          if (!seen.has(k)) { seen.add(k); externalConnections.push({ type: 'next', target: arg.value, conditional: isConditional }) }
          break
        }
        case 'call': {
          items.push({ kind: 'call', target: arg.value, line: matchLine })
          const k = `call:${arg.value}:${isConditional}`
          if (!seen.has(k)) { seen.add(k); externalConnections.push({ type: 'call', target: arg.value, conditional: isConditional }) }
          break
        }
      }
    }
    return items
  }

  return { flowItems: [...scan(body, false, arrayStart), ...optionFlowItems], externalConnections }
}

// ─── FlowItem → handles + rows + edges builder ───────────────

function buildHandlesAndEdges(
  sceneId: string,
  items: FlowItem[],
  depth: number = 0,
  branchLabel?: string,
): { rows: RowItem[], handles: HandleInfo[], edges: Edge[] } {
  const rows: RowItem[] = []
  const handles: HandleInfo[] = []
  const edges: Edge[] = []

  // Track handle ID counters to avoid duplicates
  const idCounters = new Map<string, number>()
  function uniqueHandleId(base: string): string {
    const count = idCounters.get(base) ?? 0
    idCounters.set(base, count + 1)
    return count === 0 ? base : `${base}__${count}`
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const rowHandles: HandleInfo[] = []
    let rowLabel = ''

    switch (item.kind) {
      case 'label': {
        rowLabel = item.name
        const hId = uniqueHandleId(`${sceneId}__label__${item.name}`)
        const h: HandleInfo = { id: hId, type: 'target', kind: 'label', label: item.name, depth, line: item.line }
        rowHandles.push(h)
        handles.push(h)
        break
      }
      case 'goto': {
        rowLabel = item.target
        const hId = uniqueHandleId(`${sceneId}__goto__${item.target}`)
        const h: HandleInfo = { id: hId, type: 'source', kind: 'goto', label: item.target, depth, line: item.line }
        rowHandles.push(h)
        handles.push(h)
        break
      }
      case 'call': {
        rowLabel = item.target
        const hId = uniqueHandleId(`${sceneId}__call__${item.target}`)
        const h: HandleInfo = { id: hId, type: 'source', kind: 'call', label: item.target, depth, line: item.line }
        rowHandles.push(h)
        handles.push(h)
        // Edge: call → target scene entry
        const s = EXT_EDGE_STYLES.call
        edges.push({
          id: `e-${hId}`,
          source: sceneId,
          sourceHandle: hId,
          target: item.target,
          targetHandle: `${item.target}__entry`,
          animated: true,
          style: { stroke: s.color, strokeWidth: 2, strokeDasharray: s.dash },
          markerEnd: { type: MarkerType.ArrowClosed, color: s.color },
        })
        break
      }
      case 'next': {
        rowLabel = item.target
        const hId = uniqueHandleId(`${sceneId}__next__${item.target}`)
        const h: HandleInfo = { id: hId, type: 'source', kind: 'next', label: item.target, depth, line: item.line }
        rowHandles.push(h)
        handles.push(h)
        // Edge: next → target scene entry
        const s = EXT_EDGE_STYLES.next
        edges.push({
          id: `e-${hId}`,
          source: sceneId,
          sourceHandle: hId,
          target: item.target,
          targetHandle: `${item.target}__entry`,
          animated: true,
          style: { stroke: s.color, strokeWidth: 2, strokeDasharray: s.dash },
          markerEnd: { type: MarkerType.ArrowClosed, color: s.color },
        })
        break
      }
      case 'condition': {
        rowLabel = `#${item.id}`
        // condition header row (no handles on this row itself)
        rows.push({
          kind: 'condition',
          label: rowLabel,
          handles: [],
          depth,
          branchLabel: branchLabel,
          line: item.line,
        })

        // if branch
        if (item.ifBranch.length > 0) {
          const ifResult = buildHandlesAndEdges(sceneId, item.ifBranch, depth + 1, 'if')
          rows.push(...ifResult.rows)
          handles.push(...ifResult.handles)
          edges.push(...ifResult.edges)
        } else {
          // Empty if branch indicator
          const hId = uniqueHandleId(`${sceneId}__cond__${item.id}__if`)
          const h: HandleInfo = { id: hId, type: 'source', kind: 'condition-if', label: 'if (empty)', depth: depth + 1 }
          handles.push(h)
          rows.push({ kind: 'condition', label: '(empty)', handles: [h], depth: depth + 1, branchLabel: 'if' })
        }

        // else branch
        if (item.elseBranch.length > 0) {
          const elseResult = buildHandlesAndEdges(sceneId, item.elseBranch, depth + 1, 'else')
          rows.push(...elseResult.rows)
          handles.push(...elseResult.handles)
          edges.push(...elseResult.edges)
        } else {
          const hId = uniqueHandleId(`${sceneId}__cond__${item.id}__else`)
          const h: HandleInfo = { id: hId, type: 'source', kind: 'condition-else', label: 'else (empty)', depth: depth + 1 }
          handles.push(h)
          rows.push({ kind: 'condition', label: '(empty)', handles: [h], depth: depth + 1, branchLabel: 'else' })
        }

        continue // already pushed rows above
      }
    }

    rows.push({
      kind: item.kind,
      label: rowLabel,
      handles: rowHandles,
      depth,
      branchLabel: i === 0 ? branchLabel : undefined,
      line: item.line,
    })
  }

  return { rows, handles, edges }
}

// ─── Main Component ──────────────────────────────────────────

export function SceneGraphViewer() {
  const { projectPath, setActiveFile, setIsGraphOpen } = useProjectStore()
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [isLoading, setIsLoading] = useState(true)

  const processFiles = useCallback(async () => {
    if (!projectPath) return
    setIsLoading(true)

    const scenesPath = `${projectPath}/scenes`
    const allFiles: { fullPath: string, relPath: string, name: string }[] = []

    try {
      const res = await window.api.fs.readDir(scenesPath, true)
      if (res.success && res.files) {
        const collectFiles = (fileNodes: FileNode[]) => {
          for (const node of fileNodes) {
            if (node.isDirectory && node.children) {
              collectFiles(node.children)
            } else if (!node.isDirectory && node.name.endsWith('.ts')) {
              allFiles.push({
                fullPath: `${scenesPath}/${node.path}`,
                relPath: node.path,
                name: node.path.replace(/\\/g, '/').replace(/\.[^/.]+$/, '')
              })
            }
          }
        }
        collectFiles(res.files)
      }

      const allNodes: Node[] = []
      const allEdges: Edge[] = []

      for (const file of allFiles) {
        const fileId = file.name
        let content = ''
        const contentRes = await window.api.fs.readFile(file.fullPath)
        if (contentRes.success && contentRes.content) {
          content = contentRes.content
        }

        const parsed = parseSceneContent(content)

        // Build handles + rows from flow items
        const { rows, handles, edges: itemEdges } = buildHandlesAndEdges(fileId, parsed.flowItems)

        // Add entry handle
        const entryHandle: HandleInfo = {
          id: `${fileId}__entry`,
          type: 'target',
          kind: 'entry',
          label: fileId,
          depth: 0,
        }
        const allHandles = [entryHandle, ...handles]

        // Scene block node
        allNodes.push({
          id: fileId,
          type: 'scene-block',
          data: { label: fileId, fullPath: file.fullPath, rows, handles: allHandles },
          position: { x: 0, y: 0 },
        })

        allEdges.push(...itemEdges)
      }

      // Collect all known scene IDs
      const knownIds = new Set(allNodes.map(n => n.id))

      // Build goto → label edges (within same or cross scene)
      const labelHandleMap = new Map<string, { sceneId: string, handleId: string }>()
      for (const node of allNodes) {
        if (node.type !== 'scene-block') continue
        const hs = (node.data?.handles as HandleInfo[]) || []
        for (const h of hs) {
          if (h.kind === 'label') {
            labelHandleMap.set(`${node.id}:${h.label}`, { sceneId: node.id, handleId: h.id })
          }
        }
      }

      for (const node of allNodes) {
        if (node.type !== 'scene-block') continue
        const hs = (node.data?.handles as HandleInfo[]) || []
        for (const h of hs) {
          if (h.kind === 'goto') {
            // Try same scene first, then cross-scene
            const target = labelHandleMap.get(`${node.id}:${h.label}`)
            if (target) {
              const s = EXT_EDGE_STYLES.goto
              allEdges.push({
                id: `e-goto-${h.id}`,
                source: node.id,
                sourceHandle: h.id,
                target: target.sceneId,
                targetHandle: target.handleId,
                animated: true,
                style: { stroke: s.color, strokeWidth: 1.5, strokeDasharray: s.dash },
                markerEnd: { type: MarkerType.ArrowClosed, color: s.color },
              })
            }
          }
        }
      }

      // Add missing scene nodes for unresolved edge targets
      const edgeTargets = new Set(allEdges.map(e => e.target))
      for (const targetId of edgeTargets) {
        if (!knownIds.has(targetId)) {
          knownIds.add(targetId)
          allNodes.push({
            id: targetId,
            type: 'missing',
            data: { label: `${targetId} (Missing)`, sceneId: targetId },
            position: { x: 0, y: 0 },
          })
        }
      }

      // Layout
      const { nodes: laid, edges: laidE } = getLayoutedElements(allNodes, allEdges, 'LR')
      setNodes(laid)
      setEdges(laidE)
    } catch (e) {
      console.error('Failed to parse scenes for graph', e)
    } finally {
      setIsLoading(false)
    }
  }, [projectPath, setNodes, setEdges])

  useEffect(() => {
    processFiles()
  }, [processFiles])

  // Double-click node → open in editor
  const onNodeDoubleClick = useCallback((_: unknown, node: Node) => {
    const fullPath = node.data?.fullPath
    if (fullPath) {
      setActiveFile(String(fullPath))
      setIsGraphOpen(false)
    }
  }, [setActiveFile, setIsGraphOpen])

  const memoNodeTypes = useMemo(() => nodeTypes, [])

  return (
    <div className="absolute inset-0 bg-surface-950 flex flex-col z-40">
      <div className="h-14 border-b border-surface-800 bg-surface-900/90 backdrop-blur flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          <h2 className="font-semibold text-surface-200">Scene Connection Graph</h2>
        </div>
        <button
          onClick={() => setIsGraphOpen(false)}
          className="flex items-center justify-center w-8 h-8 rounded-sm bg-surface-800 text-surface-400 hover:bg-surface-700 hover:text-white transition-colors"
          title="닫기"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 relative">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-surface-400 text-sm">씬 파일을 분석하는 중...</p>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDoubleClick={onNodeDoubleClick}
            nodeTypes={memoNodeTypes}
            fitView
            className="bg-surface-950"
            colorMode="dark"
          >
            <Background color="#333" gap={16} />
            <Controls className="bg-surface-800 border-surface-700 fill-surface-300" />
            <MiniMap
              nodeColor={(node) => {
                if (node.type === 'missing') return '#ef4444'
                return '#8b5cf6'
              }}
              maskColor="rgba(0, 0, 0, 0.7)"
              className="bg-surface-900 border border-surface-800"
            />
          </ReactFlow>
        )}
      </div>
    </div>
  )
}
