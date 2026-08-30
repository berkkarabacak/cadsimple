import { Eye, EyeOff, Focus, SlidersHorizontal } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { useCad, formatLength, type Part, type Vec3 } from '@/lib/store'
import { partSize } from '@/lib/geom'

function Vec3Inputs({
  label,
  value,
  step,
  onChange,
}: {
  label: string
  value: Vec3
  step: number
  onChange: (v: Vec3) => void
}) {
  return (
    <div>
      <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</div>
      <div className="grid grid-cols-3 gap-1.5">
        {(['X', 'Y', 'Z'] as const).map((axis, i) => (
          <label key={axis} className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-1.5 py-1">
            <span className="text-[10px] font-semibold text-slate-500">{axis}</span>
            <input
              type="number"
              step={step}
              value={Math.round(value[i] * 100) / 100}
              onChange={(e) => {
                const n = parseFloat(e.target.value)
                if (Number.isNaN(n)) return
                const next = [...value] as Vec3
                next[i] = n
                onChange(next)
              }}
              className="w-full min-w-0 bg-transparent text-right text-xs text-slate-200 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </label>
        ))}
      </div>
    </div>
  )
}

export function PropertiesCard({ part }: { part: Part }) {
  const unit = useCad((s) => s.unit)
  const toggleVisible = useCad((s) => s.toggleVisible)
  const setOpacity = useCad((s) => s.setOpacity)
  const isolatedId = useCad((s) => s.isolatedId)
  const isolate = useCad((s) => s.isolate)
  const setPartTransform = useCad((s) => s.setPartTransform)

  const size = partSize(part)
  const isolated = isolatedId === part.id

  return (
    <div className="glass rounded-2xl p-4 shadow-xl shadow-black/30">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-3 w-3 rounded-sm" style={{ background: part.color }} />
        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold">{part.name}</h3>
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-500">
          {part.format}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-slate-500">Size</div>
          <div className="grid grid-cols-3 gap-1.5 text-center">
            {(['W', 'H', 'D'] as const).map((axis, i) => (
              <div key={axis} className="rounded-lg border border-white/10 bg-white/5 px-1 py-1.5">
                <div className="text-[10px] font-semibold text-slate-500">{axis}</div>
                <div className="truncate text-xs text-slate-200">{formatLength(size[i], unit, 1)}</div>
              </div>
            ))}
          </div>
        </div>

        <Vec3Inputs
          label="Position (mm)"
          value={part.position}
          step={1}
          onChange={(v) => setPartTransform(part.id, { position: v })}
        />
        <Vec3Inputs
          label="Rotation (°)"
          value={part.rotation}
          step={5}
          onChange={(v) => setPartTransform(part.id, { rotation: v })}
        />

        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
              <SlidersHorizontal className="h-3 w-3" /> Transparency
            </span>
            <span className="text-[11px] text-slate-500">{Math.round((1 - part.opacity) * 100)}%</span>
          </div>
          <Slider
            value={[part.opacity]}
            min={0.05}
            max={1}
            step={0.05}
            onValueChange={([v]) => setOpacity(part.id, v)}
          />
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
            onClick={() => toggleVisible(part.id)}
          >
            {part.visible ? <EyeOff className="mr-1.5 h-3.5 w-3.5" /> : <Eye className="mr-1.5 h-3.5 w-3.5" />}
            {part.visible ? 'Hide' : 'Show'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
            onClick={() => isolate(isolated ? null : part.id)}
          >
            <Focus className="mr-1.5 h-3.5 w-3.5" />
            {isolated ? 'Show all' : 'Isolate'}
          </Button>
        </div>
      </div>
    </div>
  )
}
