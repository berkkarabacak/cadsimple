import { useState } from 'react'
import { Minus, Plus, Wand2, ChevronDown, Code2 } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { useCad } from '@/lib/store'
import { applyParam } from '@/lib/rebuild'

export function ParamsCard() {
  const params = useCad((s) => s.params)
  const scad = useCad((s) => s.scad)
  const [advancedOpen, setAdvancedOpen] = useState(false)

  if (params.length === 0 || !scad) return null

  return (
    <div className="glass rounded-2xl p-4 shadow-xl shadow-black/30">
      <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        <Wand2 className="h-4 w-4 text-violet-300" /> Parameters
      </h3>
      <div className="space-y-2">
        {params.map((p) => (
          <div key={p.name} className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-xs capitalize text-slate-300" title={p.name}>
              {p.name.replace(/_/g, ' ')}
            </span>
            <div className="flex items-center rounded-lg border border-white/10 bg-white/5">
              <button
                aria-label={`Decrease ${p.name}`}
                onClick={() => applyParam(p.name, Math.round((p.value - p.step) * 1000) / 1000)}
                className="px-1.5 py-1 text-slate-400 hover:text-white"
              >
                <Minus className="h-3 w-3" />
              </button>
              <input
                type="number"
                value={p.value}
                step={p.step}
                onChange={(e) => {
                  const n = parseFloat(e.target.value)
                  if (!Number.isNaN(n)) applyParam(p.name, n)
                }}
                className="w-16 bg-transparent py-1 text-center text-xs text-slate-100 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                aria-label={`Increase ${p.name}`}
                onClick={() => applyParam(p.name, Math.round((p.value + p.step) * 1000) / 1000)}
                className="px-1.5 py-1 text-slate-400 hover:text-white"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen} className="mt-3">
        <CollapsibleTrigger className="flex w-full items-center gap-1.5 text-[11px] font-medium text-slate-500 transition-colors hover:text-slate-300">
          <Code2 className="h-3.5 w-3.5" />
          Advanced — model source
          <ChevronDown className={cn('ml-auto h-3.5 w-3.5 transition-transform', advancedOpen && 'rotate-180')} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <pre className="mt-2 max-h-44 overflow-auto rounded-lg border border-white/10 bg-black/40 p-3 text-[10px] leading-relaxed text-slate-400">
            {scad.source}
          </pre>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
