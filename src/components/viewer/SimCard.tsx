import { Play, RotateCw, MoveRight, Trash2, MousePointerClick } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCad, formatLength, type Part, type Vec3 } from '@/lib/store'

const AXES: { label: string; value: Vec3 }[] = [
  { label: 'X axis', value: [1, 0, 0] },
  { label: 'Y axis', value: [0, 1, 0] },
  { label: 'Z axis', value: [0, 0, 1] },
]

function axisKey(v: Vec3): string {
  if (v[0]) return 'x'
  if (v[1]) return 'y'
  return 'z'
}

export function SimCard({ part }: { part: Part }) {
  const unit = useCad((s) => s.unit)
  const setSim = useCad((s) => s.setSim)
  const setSimValue = useCad((s) => s.setSimValue)
  const simDraft = useCad((s) => s.simDraft)
  const setSimDraft = useCad((s) => s.setSimDraft)
  const setTool = useCad((s) => s.setTool)
  const tool = useCad((s) => s.tool)

  const sim = part.sim

  /* ---------- live movement slider ---------- */
  if (sim) {
    const isRotate = sim.type === 'rotate'
    const step = Math.max((sim.max - sim.min) / 200, 0.1)
    return (
      <div className="glass rounded-2xl p-4 shadow-xl shadow-black/30">
        <div className="mb-3 flex items-center gap-2">
          <Play className="h-4 w-4 text-pink-300" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Movement</h3>
          <button
            aria-label="Remove movement"
            onClick={() => setSim(part.id, null)}
            className="ml-auto rounded p-1 text-slate-500 transition-colors hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-xs text-slate-400">
            {isRotate ? 'Rotate around pivot' : 'Slide along direction'}
          </span>
          <span className="font-display text-sm font-semibold text-cyan-300">
            {isRotate ? `${Math.round(sim.value)}°` : formatLength(sim.value, unit, 1)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500">{isRotate ? `${sim.min}°` : formatLength(sim.min, unit, 0)}</span>
          <Slider
            value={[sim.value]}
            min={sim.min}
            max={sim.max}
            step={step}
            onValueChange={([v]) => setSimValue(part.id, v)}
            className="flex-1"
          />
          <span className="text-[11px] text-slate-500">{isRotate ? `${sim.max}°` : formatLength(sim.max, unit, 0)}</span>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
          Drag the slider to move the part. Colliding parts glow red.
        </p>
      </div>
    )
  }

  /* ---------- draft configuration ---------- */
  if (simDraft && simDraft.targetId === part.id) {
    const isRotate = simDraft.type === 'rotate'
    const ready = !isRotate || simDraft.pivot !== null
    return (
      <div className="glass rounded-2xl p-4 shadow-xl shadow-black/30">
        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          {isRotate ? <RotateCw className="h-4 w-4 text-pink-300" /> : <MoveRight className="h-4 w-4 text-pink-300" />}
          New movement
        </h3>

        <div className="space-y-3">
          {isRotate && (
            <button
              onClick={() => setTool('pickPivot')}
              className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs transition-all ${
                simDraft.pivot
                  ? 'border-pink-400/40 bg-pink-400/10 text-pink-200'
                  : tool === 'pickPivot'
                    ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-200'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <MousePointerClick className="h-4 w-4 shrink-0" />
              {simDraft.pivot
                ? 'Pivot point set — click again to move it'
                : tool === 'pickPivot'
                  ? 'Now click a point on the model…'
                  : 'Click to pick a pivot point on the model'}
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="w-20 text-[11px] font-medium uppercase tracking-wider text-slate-500">
              {isRotate ? 'Around' : 'Along'}
            </span>
            <Select
              value={axisKey(simDraft.axis)}
              onValueChange={(v) => setSimDraft({ ...simDraft, axis: AXES.find((a) => axisKey(a.value) === v)!.value })}
            >
              <SelectTrigger className="h-8 flex-1 border-white/10 bg-white/5 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass border-white/10 text-slate-200">
                {AXES.map((a) => (
                  <SelectItem key={a.label} value={axisKey(a.value)}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-20 text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Limits {isRotate ? '(°)' : '(mm)'}
            </span>
            <input
              type="number"
              value={simDraft.min}
              onChange={(e) => setSimDraft({ ...simDraft, min: parseFloat(e.target.value) || 0 })}
              className="h-8 w-full min-w-0 rounded-md border border-white/10 bg-white/5 px-2 text-right text-xs outline-none"
            />
            <span className="text-slate-600">–</span>
            <input
              type="number"
              value={simDraft.max}
              onChange={(e) => setSimDraft({ ...simDraft, max: parseFloat(e.target.value) || 0 })}
              className="h-8 w-full min-w-0 rounded-md border border-white/10 bg-white/5 px-2 text-right text-xs outline-none"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              disabled={!ready || simDraft.max <= simDraft.min}
              onClick={() => {
                setSim(part.id, {
                  type: simDraft.type,
                  pivot: simDraft.pivot ?? [0, 0, 0],
                  axis: simDraft.axis,
                  min: simDraft.min,
                  max: simDraft.max,
                  value: simDraft.min,
                })
                setSimDraft(null)
                setTool('orbit')
              }}
              className="flex-1 bg-pink-400 font-semibold text-slate-950 hover:bg-pink-300 disabled:opacity-40"
            >
              Create movement
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSimDraft(null)
                setTool('orbit')
              }}
              className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    )
  }

  /* ---------- add movement ---------- */
  return (
    <div className="glass rounded-2xl p-4 shadow-xl shadow-black/30">
      <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        <Play className="h-4 w-4 text-pink-300" /> Movement
      </h3>
      <p className="mb-3 text-[11px] leading-relaxed text-slate-500">
        Make this part move — great for doors, hinges, lids and folding parts.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            setSimDraft({ targetId: part.id, type: 'rotate', pivot: null, axis: [0, 1, 0], min: 0, max: 90 })
            setTool('pickPivot')
          }}
          className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2 py-3 text-xs text-slate-300 transition-all hover:border-pink-400/40 hover:bg-pink-400/10 hover:text-pink-200"
        >
          <RotateCw className="h-4 w-4" />
          Rotate around a point
        </button>
        <button
          onClick={() => setSimDraft({ targetId: part.id, type: 'slide', pivot: null, axis: [1, 0, 0], min: 0, max: 50 })}
          className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2 py-3 text-xs text-slate-300 transition-all hover:border-pink-400/40 hover:bg-pink-400/10 hover:text-pink-200"
        >
          <MoveRight className="h-4 w-4" />
          Slide along a direction
        </button>
      </div>
    </div>
  )
}
