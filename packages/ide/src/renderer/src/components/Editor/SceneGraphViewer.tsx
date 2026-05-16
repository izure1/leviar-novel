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

// ─── Sub-node style lookup table ─────────────────────────────

const SUB_STYLES: Record<string, { bg: string, border: string, text: string }> = {
  label:     { bg: '#064e3b', border: '#10b981', text: '#6ee7b7' },
  goto:      { bg: '#451a03', border: '#f59e0b', text: '#fcd34d' },
  next:      { bg: '#2e1065', border: '#8b5cf6', text: '#c4b5fd' },
  call:      { bg: '#431407', border: '#f97316', text: '#fdba74' },
  condition: { bg: '#422006', border: '#eab308', text: '#fde047' },
}

// ─── Edge style lookup table ─────────────────────────────────

const EXT_EDGE_STYLES: Record<string, { color: string, dash: string }> = {
  next: { color: '#8b5cf6', dash: 'none' },
  call: { color: '#f59e0b', dash: '5,5' },
  goto: { color: '#f59e0b', dash: '3,3' },
}

// ─── Custom Node: Scene ──────────────────────────────────────

function SceneNodeComponent({ data }: NodeProps) {
  return (
    <div className="group relative flex items-center min-w-[220px] px-4 py-3 bg-surface-800/90 backdrop-blur-md border border-surface-700/50 rounded-md shadow-lg transition-all duration-300 hover:shadow-primary-500/20 hover:border-primary-500/50 hover:-translate-y-0.5">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-md pointer-events-none" />
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-surface-800 !border-2 !border-primary-500 rounded-full !-ml-1.5"
      />
      
      <div className="flex items-center gap-3 relative z-10 w-full">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface-900/80 border border-surface-700/50 text-primary-400 shadow-inner shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-bold text-primary-500/80 uppercase tracking-wider mb-0.5">Scene</span>
          <span className="text-sm font-bold text-surface-100 font-mono truncate w-full" title={String(data.label || '')}>
            {String(data.label || '')}
          </span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-surface-800 !border-2 !border-primary-500 rounded-full !-mr-1.5"
      />
    </div>
  )
}

// ─── Custom Node: Sub (FlowItem) ─────────────────────────────

const SUB_ICONS: Record<string, string> = {
  label: '⌗',
  goto: '⇥',
  next: '→',
  call: '↗',
  condition: '◇',
}

function SubNodeComponent({ data }: NodeProps) {
  const kind = String(data.kind || 'label')
  const s = SUB_STYLES[kind] || SUB_STYLES.label
  const icon = SUB_ICONS[kind] || '•'

  return (
    <div
      className="relative flex items-center min-w-[160px] h-8 px-3 rounded-full shadow-sm transition-all hover:brightness-110 hover:shadow-md"
      style={{
        background: `linear-gradient(135deg, ${s.bg}e6, ${s.bg}b3)`,
        border: `1px solid ${s.border}40`,
        backdropFilter: 'blur(4px)',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !rounded-full !border-none !-ml-1"
        style={{ background: s.border }}
      />
      
      <div className="flex items-center gap-2 w-full min-w-0">
        <span className="flex items-center justify-center w-5 h-5 rounded-full opacity-90 shrink-0" style={{ color: s.border, background: `${s.border}20`, fontSize: '11px' }}>
          {icon}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-90 shrink-0" style={{ color: s.text }}>
          {kind}
        </span>
        {String(data.label || '') && (
          <span className="text-xs font-medium truncate flex-1 text-right ml-1 opacity-90" style={{ color: '#e2e8f0' }} title={String(data.label || '')}>
            {String(data.label || '')}
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !rounded-full !border-none !-mr-1"
        style={{ background: s.border }}
      />
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
  scene: SceneNodeComponent,
  sub: SubNodeComponent,
  missing: MissingNodeComponent,
}

// ─── dagre layout ────────────────────────────────────────────

const NODE_SIZES: Record<string, { w: number, h: number }> = {
  scene: { w: 220, h: 65 },
  sub: { w: 160, h: 32 },
  missing: { w: 220, h: 65 },
}

function getLayoutedElements(nodes: Node[], edges: Edge[], direction = 'LR') {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))

  const isHorizontal = direction === 'LR'
  g.setGraph({ rankdir: direction, ranksep: 100, nodesep: 30, edgesep: 20 })

  for (const node of nodes) {
    const sz = NODE_SIZES[node.type || 'scene'] || NODE_SIZES.scene
    g.setNode(node.id, { width: sz.w, height: sz.h })
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target)
  }

  dagre.layout(g)

  for (const node of nodes) {
    const pos = g.node(node.id)
    const sz = NODE_SIZES[node.type || 'scene'] || NODE_SIZES.scene
    node.targetPosition = isHorizontal ? Position.Left : Position.Top
    node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom
    node.position = {
      x: pos.x - sz.w / 2,
      y: pos.y - sz.h / 2,
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

function parseSceneContent(content: string): ParseResult {
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

  return { flowItems: [...optionFlowItems, ...scan(body, false, arrayStart)], externalConnections }
}

// ─── FlowItem → sub-nodes + edges builder ────────────────────

function buildSubGraph(
  sceneId: string,
  fullPath: string,
  items: FlowItem[],
  parentId: string,
  prefix: string,
  branchMeta?: { color: string, label: string }
): { nodes: Node[], internalEdges: Edge[], externalEdges: Edge[] } {
  const nodes: Node[] = []
  const internalEdges: Edge[] = []
  const externalEdges: Edge[] = []

  // Flow-breaking kinds: these transfer control away, so next item is unreachable
  const BREAKS_FLOW = new Set(['goto', 'next'])

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const subId = `${sceneId}__${prefix}${i}`
    let subLabel = ''

    switch (item.kind) {
      case 'label': subLabel = item.name; break
      case 'goto': subLabel = item.target; break
      case 'next': subLabel = item.target; break
      case 'call': subLabel = item.target; break
      case 'condition': subLabel = `#${item.id}`; break
    }

    nodes.push({
      id: subId,
      type: 'sub',
      data: { kind: item.kind, label: subLabel, line: item.line, fullPath },
      position: { x: 0, y: 0 },
    })

    // ── Connection edges ──
    const isTopLevel = !branchMeta
    const isLabel = item.kind === 'label'

    if (isTopLevel && isLabel) {
      // Label at top-level: always solid edge from scene (ownership/derivation)
      internalEdges.push({
        id: `e-own-${parentId}-${subId}`,
        source: parentId,
        target: subId,
        style: { stroke: '#555', strokeWidth: 1.5 },
      })
      // Also add dashed fall-through from previous if it doesn't break flow
      if (i > 0 && !BREAKS_FLOW.has(items[i - 1].kind)) {
        const prevId = `${sceneId}__${prefix}${i - 1}`
        internalEdges.push({
          id: `e-flow-${prevId}-${subId}`,
          source: prevId,
          target: subId,
          animated: true,
          style: { stroke: '#555', strokeWidth: 1.5, strokeDasharray: '6,3' },
        })
      }
    } else if (i === 0) {
      // First item in scope (scene or condition branch)
      const edgeColor = branchMeta?.color || '#555'
      const isDashed = isTopLevel || !!branchMeta
      internalEdges.push({
        id: `e-entry-${parentId}-${subId}`,
        source: parentId,
        target: subId,
        animated: isDashed,
        style: { stroke: edgeColor, strokeWidth: 1.5, strokeDasharray: isDashed ? '6,3' : 'none' },
        ...(branchMeta ? {
          label: branchMeta.label,
          labelStyle: { fill: edgeColor, fontSize: 9, fontWeight: 700 },
          labelBgStyle: { fill: '#1e1e1e', fillOpacity: 0.8 },
        } : {}),
      })
    } else {
      // Sequential chain: dashed flow edge from previous (if not broken)
      if (!BREAKS_FLOW.has(items[i - 1].kind)) {
        const prevId = `${sceneId}__${prefix}${i - 1}`
        internalEdges.push({
          id: `e-flow-${prevId}-${subId}`,
          source: prevId,
          target: subId,
          animated: true,
          style: { stroke: '#555', strokeWidth: 1.5, strokeDasharray: '6,3' },
        })
      }
    }

    // ── External edges: next/call → target scene ──
    if (item.kind === 'next' || item.kind === 'call') {
      const s = EXT_EDGE_STYLES[item.kind]
      externalEdges.push({
        id: `e-ext-${subId}-${(item as { target: string }).target}`,
        source: subId,
        target: (item as { target: string }).target,
        animated: true,
        style: { stroke: s.color, strokeWidth: 2, strokeDasharray: s.dash },
        markerEnd: { type: MarkerType.ArrowClosed, color: s.color },
      })
    }

    // ── Recurse condition branches ──
    if (item.kind === 'condition') {
      const ifResult = buildSubGraph(
        sceneId, fullPath, item.ifBranch, subId,
        `${prefix}c${item.id}t_`,
        { color: '#10b981', label: 'if' }
      )
      const elseResult = buildSubGraph(
        sceneId, fullPath, item.elseBranch, subId,
        `${prefix}c${item.id}f_`,
        { color: '#ef4444', label: 'else' }
      )
      nodes.push(...ifResult.nodes, ...elseResult.nodes)
      internalEdges.push(...ifResult.internalEdges, ...elseResult.internalEdges)
      externalEdges.push(...ifResult.externalEdges, ...elseResult.externalEdges)
    }
  }

  return { nodes, internalEdges, externalEdges }
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

      const sceneNodes: Node[] = []
      const subNodes: Node[] = []
      const internalEdges: Edge[] = []
      const externalEdges: Edge[] = []

      for (const file of allFiles) {
        const fileId = file.name
        let content = ''
        const contentRes = await window.api.fs.readFile(file.fullPath)
        if (contentRes.success && contentRes.content) {
          content = contentRes.content
        }

        const parsed = parseSceneContent(content)

        // Scene node
        sceneNodes.push({
          id: fileId,
          type: 'scene',
          data: { label: fileId, fullPath: file.fullPath },
          position: { x: 0, y: 0 },
        })

        // Build sub-nodes from flow items
        const sub = buildSubGraph(fileId, file.fullPath, parsed.flowItems, fileId, '')
        subNodes.push(...sub.nodes)
        internalEdges.push(...sub.internalEdges)
        externalEdges.push(...sub.externalEdges)
      }

      // Collect all known scene IDs
      const knownIds = new Set(sceneNodes.map(n => n.id))

      // Add missing scene nodes referenced by external edges
      for (const edge of externalEdges) {
        if (!knownIds.has(edge.target)) {
          knownIds.add(edge.target)
          sceneNodes.push({
            id: edge.target,
            type: 'missing',
            data: { label: `${edge.target} (Missing)` },
            position: { x: 0, y: 0 },
          })
        }
      }

      // Connect goto sub-nodes → label sub-nodes (within same scene)
      const labelMap = new Map<string, string>()
      for (const n of subNodes) {
        if (n.data?.kind === 'label') labelMap.set(`${n.id.split('__')[0]}:${String(n.data.label)}`, n.id)
      }
      for (const n of subNodes) {
        if (n.data?.kind === 'goto') {
          const targetLabelId = labelMap.get(`${n.id.split('__')[0]}:${String(n.data.label)}`)
          if (targetLabelId) {
            const s = EXT_EDGE_STYLES.goto
            internalEdges.push({
              id: `e-goto-${n.id}-${targetLabelId}`,
              source: n.id,
              target: targetLabelId,
              animated: true,
              style: { stroke: s.color, strokeWidth: 1.5, strokeDasharray: s.dash },
              markerEnd: { type: MarkerType.ArrowClosed, color: s.color },
            })
          }
        }
      }

      // Layout all nodes together
      const allNodes = [...sceneNodes, ...subNodes]
      const allEdges = [...internalEdges, ...externalEdges]
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

  // Double-click node → open in editor at specific line
  const { setPendingLine } = useProjectStore()
  const onNodeDoubleClick = useCallback((_: unknown, node: Node) => {
    const fullPath = node.data?.fullPath
    if (fullPath) {
      const line = node.data?.line as number | undefined
      if (line) setPendingLine(line)
      setActiveFile(String(fullPath))
      setIsGraphOpen(false)
    }
  }, [setActiveFile, setIsGraphOpen, setPendingLine])

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
                if (node.type === 'sub') {
                  const kind = String(node.data?.kind || '')
                  return SUB_STYLES[kind]?.border || '#555'
                }
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
