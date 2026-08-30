import { Eye, EyeOff, Boxes } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useCad } from '@/lib/store'

export function ScenePanel() {
  const parts = useCad((s) => s.parts)
  const selectedId = useCad((s) => s.selectedId)
  const select = useCad((s) => s.select)
  const toggleVisible = useCad((s) => s.toggleVisible)

  if (parts.length === 0) return null

  return (
    <div className="glass rounded-2xl p-3 shadow-xl shadow-black/30">
      <div className="mb-2 flex items-center gap-2 px-1">
        <Boxes className="h-4 w-4 text-cyan-300" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Objects</h3>
        <span className="ml-auto rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-slate-500">{parts.length}</span>
      </div>
      <ScrollArea className="max-h-40">
        <ul className="space-y-0.5 pr-2">
          {parts.map((p) => (
            <li
              key={p.id}
              onClick={() => select(p.id === selectedId ? null : p.id)}
              className={cn(
                'group flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors',
                p.id === selectedId ? 'bg-cyan-400/15 text-cyan-100' : 'text-slate-300 hover:bg-white/5',
              )}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: p.color }} />
              <span className="min-w-0 flex-1 truncate">{p.name}</span>
              <button
                aria-label={p.visible ? 'Hide' : 'Show'}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleVisible(p.id)
                }}
                className="shrink-0 rounded p-1 text-slate-500 opacity-0 transition-opacity hover:text-white group-hover:opacity-100"
              >
                {p.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              </button>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  )
}
