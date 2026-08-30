import { Ruler, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCad, formatLength } from '@/lib/store'

export function MeasureCard() {
  const tool = useCad((s) => s.tool)
  const a = useCad((s) => s.measureA)
  const b = useCad((s) => s.measureB)
  const unit = useCad((s) => s.unit)
  const clearMeasure = useCad((s) => s.clearMeasure)
  const setTool = useCad((s) => s.setTool)

  if (tool !== 'measure') return null

  const dist = a && b ? Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) : null

  return (
    <div className="glass rounded-2xl border-cyan-400/20 p-4 shadow-xl shadow-black/30">
      <div className="mb-2 flex items-center gap-2">
        <Ruler className="h-4 w-4 text-cyan-300" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Measure</h3>
        <button
          aria-label="Exit measure"
          onClick={() => {
            clearMeasure()
            setTool('orbit')
          }}
          className="ml-auto rounded p-1 text-slate-500 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="text-xs leading-relaxed text-slate-400">
        {!a && 'Click a first point on the model.'}
        {a && !b && 'Now click a second point.'}
        {a && b && 'Click anywhere to start a new measurement.'}
      </p>
      {dist !== null && (
        <div className="mt-2 rounded-xl bg-cyan-400/10 px-3 py-2 text-center">
          <span className="font-display text-lg font-semibold text-cyan-300">{formatLength(dist, unit)}</span>
        </div>
      )}
      {a && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearMeasure}
          className="mt-2 w-full border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
        >
          Clear
        </Button>
      )}
    </div>
  )
}
