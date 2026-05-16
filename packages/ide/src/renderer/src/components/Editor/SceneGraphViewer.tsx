import React, { useEffect, useState, useMemo, useCallback } from 'react'
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
  Position
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import dagre from 'dagre'
import { useProjectStore } from '../../store/useProjectStore'

interface FileNode {
  name: string
  isDirectory: boolean
  path: string
  children?: FileNode[]
}

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  
  const isHorizontal = direction === 'LR'
  dagreGraph.setGraph({ rankdir: direction, ranksep: 100, nodesep: 50 })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 150, height: 40 })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    node.targetPosition = isHorizontal ? Position.Left : Position.Top
    node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom
    node.position = {
      x: nodeWithPosition.x - 75,
      y: nodeWithPosition.y - 20,
    }
  })

  return { nodes, edges }
}

export function SceneGraphViewer() {
  const { projectPath, setActiveFile, setIsGraphOpen } = useProjectStore()
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)

  const processFiles = useCallback(async () => {
    if (!projectPath) return
    setIsLoading(true)

    const scenesPath = `${projectPath}/scenes`
    let allFiles: { fullPath: string, relPath: string, name: string }[] = []

    try {
      const res = await window.api.fs.readDir(scenesPath, true)
      if (res.success && res.files) {
        const collectFiles = (nodes: FileNode[]) => {
          for (const node of nodes) {
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

      const initialNodes: Node[] = []
      const initialEdges: Edge[] = []
      // 1. Internal flow (label, goto) - order matters
      const internalRegex = /(label|goto)\s*[:(]\s*['"`]([^'"`]+)['"`]/g
      // 2. External connections (next, call) - string direct
      const externalRegex1 = /(next|call)\s*[:(]\s*['"`]([^'"`]+)['"`]/g
      // 3. External connections (next object scene property)
      const externalRegex2 = /next\s*:\s*\{\s*scene\s*:\s*['"`]([^'"`]+)['"`]/g

      for (const file of allFiles) {
        const fileId = file.name
        
        let content = ''
        const contentRes = await window.api.fs.readFile(file.fullPath)
        if (contentRes.success && contentRes.content) {
          content = contentRes.content
        }

        const externalConnections = new Map<string, string>() // target -> 'next' | 'call'
        const internalLabels = new Set<string>(['Start'])
        const internalEdgesData: { source: string, target: string, type: 'seq' | 'goto' }[] = []
        
        let currentLabel = 'Start'
        let match

        while ((match = internalRegex.exec(content)) !== null) {
          const type = match[1]
          const name = match[2]
          if (type === 'label') {
            internalLabels.add(name)
            internalEdgesData.push({ source: currentLabel, target: name, type: 'seq' })
            currentLabel = name
          } else if (type === 'goto') {
            internalEdgesData.push({ source: currentLabel, target: name, type: 'goto' })
          }
        }

        while ((match = externalRegex1.exec(content)) !== null) {
          const type = match[1]
          const target = match[2]
          if (!externalConnections.has(target) || type === 'call') {
            externalConnections.set(target, type)
          }
        }

        while ((match = externalRegex2.exec(content)) !== null) {
          const target = match[1]
          if (!externalConnections.has(target)) {
            externalConnections.set(target, 'next')
          }
        }

        initialNodes.push({
          id: fileId,
          data: { 
            label: fileId, 
            fullPath: file.fullPath,
            internalLabels: Array.from(internalLabels),
            internalEdgesData
          },
          position: { x: 0, y: 0 },
          style: {
            background: '#2d2d2d',
            color: '#e2e8f0',
            border: '1px solid #4a4a4a',
            borderRadius: '6px',
            padding: '10px',
            fontSize: '12px',
            minWidth: '150px',
            textAlign: 'center',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }
        })

        Array.from(externalConnections.entries()).forEach(([targetScene, type]) => {
          const isCall = type === 'call'
          const color = isCall ? '#f59e0b' : '#8b5cf6' // call은 주황색(amber), next는 보라색(purple)
          initialEdges.push({
            id: `e-${fileId}-${targetScene}-${type}`,
            source: fileId,
            target: targetScene,
            animated: true,
            style: { stroke: color, strokeWidth: 2, strokeDasharray: isCall ? '5,5' : 'none' },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: color,
            },
            label: isCall ? 'call' : undefined,
            labelStyle: { fill: color, fontSize: 10, fontWeight: 700 },
            labelBgStyle: { fill: '#1e1e1e', fillOpacity: 0.8 },
          })
        })
      }

      const existingNodeIds = new Set(initialNodes.map(n => n.id))
      initialEdges.forEach(edge => {
        if (!existingNodeIds.has(edge.target)) {
          existingNodeIds.add(edge.target)
          initialNodes.push({
            id: edge.target,
            data: { label: `${edge.target} (Missing)` },
            position: { x: 0, y: 0 },
            style: {
              background: '#451a1a',
              color: '#fca5a5',
              border: '1px dashed #ef4444',
              borderRadius: '6px',
              padding: '10px',
              fontSize: '12px',
              minWidth: '150px',
              textAlign: 'center'
            }
          })
        }
      })

      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, initialEdges, 'LR')
      setNodes(layoutedNodes)
      setEdges(layoutedEdges)

    } catch (e) {
      console.error('Failed to parse scenes for graph', e)
    } finally {
      setIsLoading(false)
    }
  }, [projectPath, setNodes, setEdges])

  useEffect(() => {
    processFiles()
  }, [processFiles])

  const onNodeClick = useCallback((_, node: Node) => {
    setSelectedNode(node)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

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
          className="flex items-center justify-center w-8 h-8 rounded-md bg-surface-800 text-surface-400 hover:bg-surface-700 hover:text-white transition-colors"
          title="닫기"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="flex-1 flex overflow-hidden relative">
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
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              fitView
              className="bg-surface-950"
              colorMode="dark"
            >
              <Background color="#333" gap={16} />
              <Controls className="bg-surface-800 border-surface-700 fill-surface-300" />
              <MiniMap 
                nodeColor={(node) => {
                  if (node.data?.label?.toString().includes('(Missing)')) return '#ef4444'
                  return selectedNode?.id === node.id ? '#10b981' : '#8b5cf6'
                }}
                maskColor="rgba(0, 0, 0, 0.7)"
                className="bg-surface-900 border border-surface-800"
              />
            </ReactFlow>
          )}
        </div>

        {/* Side Panel for Internal Flow */}
        {selectedNode && Boolean(selectedNode.data?.fullPath) && (
          <div className="w-80 bg-surface-900 border-l border-surface-800 flex flex-col shadow-2xl z-10 shrink-0 transform transition-transform animate-in slide-in-from-right-8 duration-300">
            <div className="p-4 border-b border-surface-800 shrink-0">
              <h3 className="font-bold text-lg text-surface-100 truncate" title={String(selectedNode.data.label || '')}>
                {String(selectedNode.data.label || '')}
              </h3>
              <p className="text-xs text-surface-500 mt-1 truncate" title={String(selectedNode.data.fullPath || '')}>
                {String(selectedNode.data.fullPath || '')}
              </p>
              
              <button
                onClick={() => {
                  setActiveFile(String(selectedNode.data.fullPath || ''))
                  setIsGraphOpen(false)
                }}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-500 text-white py-2 px-4 rounded-md font-medium transition-colors shadow-lg shadow-primary-900/20"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                에디터에서 열기
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <h4 className="text-xs font-semibold uppercase text-surface-400 tracking-wider mb-4">Internal Flow (label / goto)</h4>
              <InternalFlowRenderer 
                labels={selectedNode.data.internalLabels as string[]} 
                edges={selectedNode.data.internalEdgesData as { source: string, target: string, type: 'seq'|'goto' }[]} 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function InternalFlowRenderer({ labels, edges }: { labels: string[], edges: { source: string, target: string, type: 'seq'|'goto' }[] }) {
  if (!labels || labels.length === 0) {
    return <div className="text-sm text-surface-500 italic">No labels or gotos found.</div>
  }

  // A very simple vertical list representation of the internal flow
  // We will build a sequential UI showing the flows
  const renderFlow = () => {
    return labels.map((label, idx) => {
      // Find gotos from this label
      const outgoingGotos = edges.filter(e => e.source === label && e.type === 'goto')
      // Find sequential next from this label
      const nextSeq = edges.find(e => e.source === label && e.type === 'seq')

      return (
        <div key={`${label}-${idx}`} className="mb-4 relative">
          <div className="bg-surface-800 border border-surface-700 rounded-md p-3 shadow-sm relative z-10">
            <div className="flex items-center gap-2 text-primary-300 font-semibold text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>
              {label}
            </div>
            
            {outgoingGotos.length > 0 && (
              <div className="mt-2 pl-2 border-l-2 border-surface-700 space-y-1">
                {outgoingGotos.map((g, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-amber-400">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                    goto: <span className="font-mono bg-surface-900 px-1 rounded">{g.target}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {nextSeq && (
            <div className="flex justify-center my-1 relative z-0">
              <div className="w-px h-6 bg-surface-700 relative">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 border-b border-r border-surface-500 transform rotate-45"></div>
              </div>
            </div>
          )}
        </div>
      )
    })
  }

  return (
    <div className="flex flex-col">
      {renderFlow()}
      <div className="text-center text-xs text-surface-500 mt-2">End of Flow</div>
    </div>
  )
}
