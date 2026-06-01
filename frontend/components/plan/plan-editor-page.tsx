"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  ConnectionLineType,
  Handle,
  MarkerType,
  MiniMap,
  Panel,
  Position,
  ReactFlow,
  type EdgeChange,
  type NodeChange,
  type NodeProps,
} from "@xyflow/react"
import {
  Circle,
  Pencil,
  PenTool,
  Route,
  Save,
  Share2,
  Square,
  Triangle,
  Trash2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  useCreatePlanMutation,
  useDeletePlanMutation,
  usePlanQuery,
  usePlanShareCandidatesQuery,
  useUpdatePlanMutation,
  useUpdatePlanShareMutation,
} from "@/hooks/use-plan"
import type {
  PlanEditorDocument,
  PlanEditorNode,
  PlanEditorNodeData,
  PlanEditorNodeKind,
} from "@/lib/types/dashboard"

const editorSheetClassName =
  "w-full overflow-y-auto border-l-0 sm:!w-[24rem] sm:!max-w-[24rem]"

const shapeOptions: Array<{
  kind: PlanEditorNodeKind
  label: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  { kind: "rectangle", label: "Rectangle", icon: Square },
  { kind: "square", label: "Square", icon: Square },
  { kind: "circle", label: "Circle", icon: Circle },
  { kind: "triangle", label: "Triangle", icon: Triangle },
  { kind: "diamond", label: "Diamond", icon: Route },
  { kind: "pen", label: "Pen draw", icon: PenTool },
]

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function formatDate(value?: string) {
  if (!value) return "Not set"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "Not set"
  return parsed.toLocaleString()
}

function nodePath(kind: PlanEditorNodeKind, width: number, height: number) {
  const midX = width / 2
  const midY = height / 2

  if (kind === "triangle") {
    return `polygon(${midX}px 0px, ${width}px ${height}px, 0px ${height}px)`
  }

  if (kind === "diamond") {
    return `polygon(${midX}px 0px, ${width}px ${midY}px, ${midX}px ${height}px, 0px ${midY}px)`
  }

  return undefined
}

function freehandPath(points: number[], width: number, height: number) {
  if (!points.length) return ""
  const normalized = points.map((value, index) =>
    index % 2 === 0 ? (value / width) * 100 : (value / height) * 100
  )
  const parts: string[] = []
  for (let index = 0; index < normalized.length; index += 2) {
    parts.push(`${index === 0 ? "M" : "L"} ${normalized[index]} ${normalized[index + 1]}`)
  }
  return parts.join(" ")
}

function PlanShapeNode({ data, selected }: NodeProps<PlanEditorNode>) {
  const width = data.width || 160
  const height = data.height || 110
  const clipPath = nodePath(data.kind, width, height)

  return (
    <div
      className="relative rounded-[26px] shadow-[0_18px_35px_-24px_rgba(15,23,42,0.8)]"
      style={{
        width,
        height,
        border: `3px solid ${selected ? "#0ea5e9" : data.stroke}`,
        background: data.kind === "pen" ? "transparent" : data.fill,
        color: data.textColor,
        clipPath,
        borderRadius: data.kind === "circle" ? "999px" : clipPath ? 0 : 26,
      }}
    >
      <Handle type="target" position={Position.Top} className="!h-3 !w-3 !border-2 !border-slate-800 !bg-white" />
      <Handle type="source" position={Position.Bottom} className="!h-3 !w-3 !border-2 !border-slate-800 !bg-white" />
      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !border-2 !border-slate-800 !bg-white" />
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-2 !border-slate-800 !bg-white" />

      {data.kind === "pen" ? (
        <svg viewBox={`0 0 100 100`} className="absolute inset-0 h-full w-full overflow-visible">
          <path
            d={freehandPath(data.points ?? [6, 70, 25, 20, 48, 46, 70, 14, 92, 58], width, height)}
            fill="none"
            stroke={selected ? "#0ea5e9" : data.stroke}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}

      {selected && data.editable ? (
        <div className="absolute -top-3 right-2 z-20 flex gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              data.onEdit?.("")
            }}
            className="flex size-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm"
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              data.onDelete?.("")
            }}
            className="flex size-8 items-center justify-center rounded-full border border-red-200 bg-white text-red-600 shadow-sm"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ) : null}

      <div className="flex h-full items-center justify-center px-4 text-center text-sm font-semibold leading-5">
        <span className="line-clamp-4 break-words">{data.label || "Tap text"}</span>
      </div>
    </div>
  )
}

const nodeTypes = {
  planShape: PlanShapeNode,
}

function makeNode(kind: PlanEditorNodeKind, index: number): PlanEditorNode {
  const width = kind === "square" ? 120 : kind === "circle" ? 126 : 170
  const height = kind === "square" ? 120 : kind === "circle" ? 126 : 112

  return {
    id: createId("node"),
    type: "planShape",
    position: {
      x: 80 + (index % 3) * 160,
      y: 80 + (index % 4) * 140,
    },
    data: {
      kind,
      label: "",
      width,
      height,
      fill: kind === "pen" ? "transparent" : "#eff6ff",
      stroke: "#0f172a",
      textColor: "#0f172a",
      points: kind === "pen" ? [8, 86, 28, 18, 48, 50, 70, 14, 93, 62] : [],
    },
  }
}

function normalizePlan(doc?: PlanEditorDocument | null): PlanEditorDocument | null {
  if (!doc) return null

  return {
    ...doc,
    nodes: (doc.nodes ?? []).map((node) => ({
      ...node,
      type: "planShape",
      data: {
        kind: node.data?.kind ?? "rectangle",
        label: node.data?.label ?? "",
        width: Number(node.data?.width ?? node.width ?? 170) || 170,
        height: Number(node.data?.height ?? node.height ?? 112) || 112,
        fill: String(node.data?.fill ?? "#eff6ff"),
        stroke: String(node.data?.stroke ?? "#0f172a"),
        textColor: String(node.data?.textColor ?? "#0f172a"),
        points: Array.isArray(node.data?.points) ? node.data.points.map(Number) : [],
      },
      style: {
        ...(node.style ?? {}),
        width: Number(node.data?.width ?? node.width ?? 170) || 170,
        height: Number(node.data?.height ?? node.height ?? 112) || 112,
      },
    })),
    edges: (doc.edges ?? []).map((edge) => ({
      ...edge,
      type: edge.type ?? "smoothstep",
      markerEnd: edge.markerEnd ?? { type: MarkerType.ArrowClosed, color: "#475569" },
      style: {
        stroke: "#475569",
        strokeWidth: 2.5,
        ...(edge.style ?? {}),
      },
    })),
    viewport: doc.viewport ?? { x: 0, y: 0, zoom: 1 },
  }
}

function getCanvasPoint(event: PointerEvent | React.PointerEvent<HTMLDivElement>, element: HTMLDivElement | null) {
  if (!element) return { x: 0, y: 0 }
  const rect = element.getBoundingClientRect()
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }
}

export function PlanEditorPage({
  roleTitle,
  roleBasePath,
  planId,
}: {
  roleTitle: string
  roleBasePath: string
  planId?: string
}) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const flowRef = useRef<any>(null)
  const drawRef = useRef<HTMLDivElement | null>(null)
  const existingPlan = usePlanQuery(planId)
  const [plan, setPlan] = useState<PlanEditorDocument | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [mobilePanel, setMobilePanel] = useState<"tools" | "inspector" | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [shareSearch, setShareSearch] = useState("")
  const [drawing, setDrawing] = useState(false)
  const [draftPoints, setDraftPoints] = useState<number[]>([])

  const shareCandidates = usePlanShareCandidatesQuery(shareSearch, shareOpen)
  const createPlan = useCreatePlanMutation()
  const updatePlan = useUpdatePlanMutation()
  const updateShare = useUpdatePlanShareMutation()
  const deletePlan = useDeletePlanMutation()

  useEffect(() => {
    if (planId) {
      if (existingPlan.data) {
        setPlan(normalizePlan(existingPlan.data))
      }
      return
    }

    setPlan({
      _id: "",
      title: "",
      description: "",
      organizationId: "",
      createdByUserId: "",
      createdByName: "",
      createdByRole: "worker",
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      sharedWith: [],
      isOwner: true,
      canEdit: true,
      myAccess: "edit",
    })
  }, [existingPlan.data, planId])

  const selectedNode = (plan?.nodes ?? []).find((node) => node.id === selectedNodeId) ?? null
  const canEdit = Boolean(plan && (!planId || plan.canEdit || plan.isOwner))

  const flowNodes = useMemo(
    () =>
      (plan?.nodes ?? []).map((node) => ({
        ...node,
        data: {
          ...node.data,
          editable: canEdit,
          onEdit: () => {
            setSelectedNodeId(node.id)
            setEditOpen(true)
          },
          onDelete: () => {
            setSelectedNodeId(node.id)
            setTimeout(() => removeNodeById(node.id), 0)
          },
        },
      })),
    [canEdit, plan?.nodes]
  )

  function updateNodeData(patch: Partial<PlanEditorNodeData>) {
    if (!plan || !selectedNodeId) return
    setPlan({
      ...plan,
      nodes: plan.nodes.map((node) =>
        node.id === selectedNodeId
          ? {
              ...node,
              data: { ...node.data, ...patch },
              style: {
                ...(node.style ?? {}),
                width: patch.width ?? node.data.width,
                height: patch.height ?? node.data.height,
              },
            }
          : node
      ),
    })
  }

  function addShape(kind: PlanEditorNodeKind) {
    if (!plan || !canEdit) return
    const nextNode = makeNode(kind, plan.nodes?.length ?? 0)
    const anchorNodeId = selectedNodeId ?? (plan.nodes ?? []).at(-1)?.id ?? null
    setPlan({
      ...plan,
      nodes: [...(plan.nodes ?? []), nextNode],
      edges: anchorNodeId
        ? [
            ...(plan.edges ?? []),
            {
              id: createId("edge"),
              source: anchorNodeId,
              target: nextNode.id,
              type: "smoothstep",
              markerEnd: { type: MarkerType.ArrowClosed, color: "#475569" },
              style: { stroke: "#475569", strokeWidth: 2.5 },
            },
          ]
        : plan.edges ?? [],
    })
    setSelectedNodeId(nextNode.id)
    setMobilePanel(null)
    if (kind !== "pen") {
      setEditOpen(true)
    }
  }

  function onNodesChange(changes: NodeChange<PlanEditorNode>[]) {
    if (!plan || !canEdit) return
    setPlan({
      ...plan,
      nodes: applyNodeChanges(changes, plan.nodes ?? []),
    })
  }

  function onEdgesChange(changes: EdgeChange[]) {
    if (!plan || !canEdit) return
    setPlan({
      ...plan,
      edges: applyEdgeChanges(changes, plan.edges ?? []),
    })
  }

  function removeNodeById(nodeId: string) {
    if (!plan) return
    setPlan({
      ...plan,
      nodes: (plan.nodes ?? []).filter((node) => node.id !== nodeId),
      edges: (plan.edges ?? []).filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
    })
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null)
      setEditOpen(false)
    }
  }

  function removeSelectedNode() {
    if (!selectedNodeId) return
    removeNodeById(selectedNodeId)
  }

  function addShare(userId: string, fullName: string, email: string, access: "view" | "edit") {
    if (!plan || (plan.sharedWith ?? []).some((item) => item.userId === userId)) return
    setPlan({
      ...plan,
      sharedWith: [...(plan.sharedWith ?? []), { userId, fullName, email, access }],
    })
  }

  function startPenDraw() {
    if (!canEdit) return
    setDraftPoints([])
    setDrawing(true)
    setMobilePanel(null)
  }

  function handleDrawPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!drawing) return
    const point = getCanvasPoint(event, drawRef.current)
    setDraftPoints([point.x, point.y])
  }

  function handleDrawPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!drawing || !draftPoints.length) return
    const point = getCanvasPoint(event, drawRef.current)
    setDraftPoints((current) => [...current, point.x, point.y])
  }

  function finishPenDraw() {
    if (!drawing || !plan) return

    if (draftPoints.length >= 6) {
      const rect = drawRef.current?.getBoundingClientRect()
      const xs = draftPoints.filter((_, index) => index % 2 === 0)
      const ys = draftPoints.filter((_, index) => index % 2 === 1)
      const minX = Math.min(...xs)
      const maxX = Math.max(...xs)
      const minY = Math.min(...ys)
      const maxY = Math.max(...ys)
      const width = Math.max(100, maxX - minX)
      const height = Math.max(80, maxY - minY)
      const points = draftPoints.map((value, index) => (index % 2 === 0 ? value - minX : value - minY))

      setPlan({
        ...plan,
        nodes: [
          ...(plan.nodes ?? []),
          {
            id: createId("node"),
            type: "planShape",
            position:
              rect && flowRef.current
                ? flowRef.current.screenToFlowPosition({
                    x: rect.left + minX,
                    y: rect.top + minY,
                  })
                : { x: minX, y: minY },
            data: {
              kind: "pen",
              label: "",
              width,
              height,
              fill: "transparent",
              stroke: "#0f172a",
              textColor: "#0f172a",
              points,
            },
            style: { width, height },
          },
        ],
      })
    }

    setDrawing(false)
    setDraftPoints([])
  }

  async function savePlan() {
    if (!plan || !plan.title.trim()) return

    const payload = {
      title: plan.title.trim(),
      description: plan.description?.trim() || undefined,
      nodes: plan.nodes,
      edges: plan.edges,
      viewport: plan.viewport,
    }

    if (!planId) {
      createPlan.mutate(payload, {
        onSuccess: (result) => {
          const nextId = result.data?.data?._id
          if (nextId) {
            router.replace(`${roleBasePath}/${nextId}`)
          }
        },
      })
      return
    }

    updatePlan.mutate({ id: planId, payload })
  }

  const topActions = (
    <div className="flex flex-wrap gap-2">
      {isMobile ? (
        <>
          <Button type="button" variant="outline" onClick={() => setMobilePanel("tools")}>
            Shapes
          </Button>
          <Button type="button" variant="outline" onClick={() => setMobilePanel("inspector")}>
            Inspector
          </Button>
        </>
      ) : null}
      {planId && plan?.isOwner ? (
        <Button type="button" variant="outline" onClick={() => setShareOpen(true)}>
          <Share2 className="mr-2 size-4" />
          Share
        </Button>
      ) : null}
      <Button type="button" disabled={!canEdit || !plan?.title.trim()} onClick={savePlan}>
        <Save className="mr-2 size-4" />
        {planId ? "Save" : "Create"}
      </Button>
    </div>
  )

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.07),_transparent_28%),linear-gradient(145deg,_#ffffff_0%,_#f8fafc_54%,_#eef2ff_100%)] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Link href={roleBasePath} className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
              Back to plan table
            </Link>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                {planId ? `${roleTitle} plan editor` : `Create ${roleTitle.toLowerCase()} plan`}
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-600">
                Dedicated page editor with React Flow connections. On phone, shape tools and inspector open in sheet.
              </p>
            </div>
          </div>
          {topActions}
        </div>
      </section>

      {plan ? (
        <div className="space-y-4">
          {!planId ? (
            <Card>
              <CardContent className="grid gap-4 p-4 md:grid-cols-2">
                <Field>
                  <FieldLabel>Title</FieldLabel>
                  <Input disabled={!canEdit} value={plan.title} onChange={(event) => setPlan({ ...plan, title: event.target.value ?? "" })} />
                </Field>
                <Field>
                  <FieldLabel>Description</FieldLabel>
                  <Input disabled={!canEdit} value={plan.description ?? ""} onChange={(event) => setPlan({ ...plan, description: event.target.value ?? "" })} />
                </Field>
              </CardContent>
            </Card>
          ) : null}

          <div ref={drawRef} className="relative h-[72vh] overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)]">
            {drawing ? (
              <div
                className="absolute inset-0 z-20 touch-none bg-sky-500/5"
                onPointerDown={handleDrawPointerDown}
                onPointerMove={handleDrawPointerMove}
                onPointerUp={finishPenDraw}
                onPointerLeave={finishPenDraw}
              >
                <div className="absolute left-4 top-4 rounded-full bg-slate-950 px-3 py-2 text-xs font-semibold text-white">
                  Draw shape, release to create
                </div>
                {draftPoints.length >= 4 ? (
                  <svg className="absolute inset-0 h-full w-full">
                    <polyline
                      points={draftPoints.reduce<string[]>((acc, value, index) => {
                        if (index % 2 === 0) {
                          acc.push(`${value},${draftPoints[index + 1]}`)
                        }
                        return acc
                      }, []).join(" ")}
                      fill="none"
                      stroke="#0ea5e9"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : null}
              </div>
            ) : null}

            <ReactFlow
                nodes={flowNodes}
                edges={plan.edges ?? []}
                nodeTypes={nodeTypes}
                fitView={!((plan.nodes ?? []).length)}
                defaultViewport={plan.viewport}
                nodesDraggable={canEdit}
                nodesConnectable={canEdit}
                elementsSelectable
                edgesFocusable
                connectionLineType={ConnectionLineType.SmoothStep}
                onInit={(instance) => {
                  flowRef.current = instance
                }}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={(connection) => {
                  if (!canEdit) return
                  setPlan({
                    ...plan,
                    edges: addEdge(
                      {
                        ...connection,
                        id: createId("edge"),
                        type: "smoothstep",
                        markerEnd: { type: MarkerType.ArrowClosed, color: "#475569" },
                        style: { stroke: "#475569", strokeWidth: 2.5 },
                      },
                      plan.edges ?? []
                    ),
                  })
                }}
                onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                onNodeDoubleClick={(_, node) => {
                  setSelectedNodeId(node.id)
                  setEditOpen(true)
                }}
                onPaneClick={() => setSelectedNodeId(null)}
                onMoveEnd={(_, viewport) => setPlan((current) => (current ? { ...current, viewport } : current))}
              >
                <Background variant={BackgroundVariant.Dots} gap={16} size={1.2} color="#cbd5e1" />
                <MiniMap pannable zoomable />
                <Panel position="top-left">
                  <div className="flex max-w-[78vw] flex-wrap gap-2 rounded-[1.5rem] border border-slate-200 bg-white/92 p-2 shadow-sm backdrop-blur">
                    {shapeOptions.map((item) => (
                      <Button
                        key={item.kind}
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!canEdit}
                        onClick={() => (item.kind === "pen" ? startPenDraw() : addShape(item.kind))}
                        className="rounded-xl"
                      >
                        <item.icon className="mr-1 size-4" />
                        {isMobile ? item.label.slice(0, 4) : item.label}
                      </Button>
                    ))}
                  </div>
                </Panel>
                <Panel position="top-right">
                  <div className="flex flex-wrap justify-end gap-2 rounded-[1.5rem] border border-slate-200 bg-white/92 p-2 shadow-sm backdrop-blur">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={!selectedNode || !canEdit}
                      onClick={() => setEditOpen(true)}
                      className="rounded-xl"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={!selectedNode || !canEdit}
                      onClick={removeSelectedNode}
                      className="rounded-xl text-red-600"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                    {planId && plan.isOwner ? (
                      <Button type="button" size="sm" variant="outline" onClick={() => setShareOpen(true)} className="rounded-xl">
                        <Share2 className="size-4" />
                      </Button>
                    ) : null}
                    <Button type="button" size="sm" disabled={!canEdit || !plan?.title.trim()} onClick={savePlan} className="rounded-xl">
                      <Save className="size-4" />
                    </Button>
                  </div>
                </Panel>
                <Panel position="bottom-left">
                  <div className="rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 text-xs font-medium text-slate-600 shadow-sm backdrop-blur">
                    {canEdit ? "Double click shape -> text modal. New shape auto-connects." : "View-only plan."}
                  </div>
                </Panel>
              </ReactFlow>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-sm text-slate-500">
            {existingPlan.isLoading ? "Loading plan..." : "Plan not found."}
          </CardContent>
        </Card>
      )}

      <Sheet open={mobilePanel === "tools"} onOpenChange={(open) => !open && setMobilePanel(null)}>
        <SheetContent side="bottom" className={editorSheetClassName}>
          <SheetHeader>
            <SheetTitle>Shape tools</SheetTitle>
            <SheetDescription>Add shape or start pen drawing.</SheetDescription>
          </SheetHeader>
          <div className="grid gap-2 px-4 pb-6">
            {shapeOptions.map((item) => (
              <Button
                key={item.kind}
                type="button"
                variant="outline"
                disabled={!canEdit}
                onClick={() => (item.kind === "pen" ? startPenDraw() : addShape(item.kind))}
              >
                <item.icon className="mr-2 size-4" />
                {item.label}
              </Button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={mobilePanel === "inspector"} onOpenChange={(open) => !open && setMobilePanel(null)}>
        <SheetContent side="bottom" className={editorSheetClassName}>
          <SheetHeader>
            <SheetTitle>Inspector</SheetTitle>
            <SheetDescription>Quick node actions.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4 pb-6">
            {selectedNode ? (
              <>
                <div className="flex gap-2">
                  <Button type="button" className="flex-1" disabled={!canEdit} onClick={() => setEditOpen(true)}>
                    <Pencil className="mr-2 size-4" />
                    Edit
                  </Button>
                  <Button type="button" variant="destructive" className="flex-1" disabled={!canEdit} onClick={removeSelectedNode}>
                    <Trash2 className="mr-2 size-4" />
                    Delete
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">Select node first.</p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit shape</DialogTitle>
            <DialogDescription>Double click shape or use pencil icon to edit text and style.</DialogDescription>
          </DialogHeader>
          {selectedNode ? (
            <div className="space-y-4">
              <Field>
                <FieldLabel>Text</FieldLabel>
                <Textarea
                  autoFocus
                  disabled={!canEdit}
                  value={selectedNode.data.label}
                  onChange={(event) => updateNodeData({ label: event.target.value ?? "" })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel>Width</FieldLabel>
                  <Input type="number" disabled={!canEdit} value={selectedNode.data.width} onChange={(event) => updateNodeData({ width: Number(event.target.value || "0") || 100 })} />
                </Field>
                <Field>
                  <FieldLabel>Height</FieldLabel>
                  <Input type="number" disabled={!canEdit} value={selectedNode.data.height} onChange={(event) => updateNodeData({ height: Number(event.target.value || "0") || 80 })} />
                </Field>
                <Field>
                  <FieldLabel>Fill</FieldLabel>
                  <Input type="color" disabled={!canEdit || selectedNode.data.kind === "pen"} value={selectedNode.data.fill} onChange={(event) => updateNodeData({ fill: event.target.value ?? "#eff6ff" })} />
                </Field>
                <Field>
                  <FieldLabel>Text color</FieldLabel>
                  <Input type="color" disabled={!canEdit} value={selectedNode.data.textColor} onChange={(event) => updateNodeData({ textColor: event.target.value ?? "#0f172a" })} />
                </Field>
              </div>
              <div className="flex gap-2">
                <Button type="button" className="flex-1" onClick={() => setEditOpen(false)}>
                  Done
                </Button>
                <Button type="button" variant="destructive" className="flex-1" disabled={!canEdit} onClick={removeSelectedNode}>
                  Delete
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Select shape first.</p>
          )}
        </DialogContent>
      </Dialog>

      <Sheet open={shareOpen} onOpenChange={setShareOpen}>
        <SheetContent side="right" className={editorSheetClassName}>
          <SheetHeader>
            <SheetTitle>Share plan</SheetTitle>
            <SheetDescription>Viewer can see. Editor can change plan.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4 pb-6">
            {plan ? (
              <>
                <Input value={shareSearch} onChange={(event) => setShareSearch(event.target.value ?? "")} placeholder="Search user name or email" />
                <div className="space-y-2 rounded-2xl border border-slate-200 p-3">
                  {(shareCandidates.data ?? []).map((user) => (
                    <div key={user.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-950">{user.fullName}</p>
                        <p className="truncate text-xs text-slate-500">{user.email} | {user.role}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => addShare(user.id, user.fullName, user.email, "view")}>
                          View
                        </Button>
                        <Button type="button" size="sm" onClick={() => addShare(user.id, user.fullName, user.email, "edit")}>
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  {(plan.sharedWith ?? []).map((item) => (
                    <div key={item.userId} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-950">{item.fullName ?? item.email ?? item.userId}</p>
                          <p className="truncate text-xs text-slate-500">{item.email ?? "No email"}</p>
                        </div>
                        <div className="flex gap-2">
                          <select
                            value={item.access}
                            onChange={(event) =>
                              setPlan({
                                ...plan,
                                sharedWith: (plan.sharedWith ?? []).map((entry) =>
                                  entry.userId === item.userId ? { ...entry, access: event.target.value as "view" | "edit" } : entry
                                ),
                              })
                            }
                            className="flex h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
                          >
                            <option value="view">view</option>
                            <option value="edit">edit</option>
                          </select>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              setPlan({
                                ...plan,
                                sharedWith: (plan.sharedWith ?? []).filter((entry) => entry.userId !== item.userId),
                              })
                            }
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  className="w-full"
                  disabled={!plan.isOwner || updateShare.isPending || !planId}
                  onClick={() =>
                    planId &&
                    updateShare.mutate(
                      {
                        id: planId,
                        sharedWith: plan.sharedWith ?? [],
                      },
                      {
                        onSuccess: () => setShareOpen(false),
                      }
                    )
                  }
                >
                  Save share access
                </Button>
              </>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
