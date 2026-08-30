import { Github, Box, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCad, type UnitName } from '@/lib/store'

export const GITHUB_URL = 'https://github.com/berkkarabacak/cadsimple'

export function TopBar({ onOpenFile }: { onOpenFile: () => void }) {
  const unit = useCad((s) => s.unit)
  const setUnit = useCad((s) => s.setUnit)

  return (
    <header className="glass pointer-events-auto flex h-14 items-center gap-3 rounded-2xl px-4 shadow-2xl shadow-black/40">
      <a href="#/" className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-indigo-500 shadow-lg shadow-cyan-500/25">
          <Box className="h-4.5 w-4.5 text-slate-950" strokeWidth={2.4} />
        </span>
        <span className="font-display text-[15px] font-semibold tracking-tight">CADsimple</span>
        <span className="hidden rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300 sm:inline">
          Free &amp; Open Source
        </span>
      </a>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden items-center gap-1.5 sm:flex">
          <span className="text-xs text-slate-500">Units</span>
          <Select value={unit} onValueChange={(v) => setUnit(v as UnitName)}>
            <SelectTrigger className="h-8 w-[86px] border-white/10 bg-white/5 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass border-white/10 text-slate-200">
              <SelectItem value="mm">mm</SelectItem>
              <SelectItem value="cm">cm</SelectItem>
              <SelectItem value="m">m</SelectItem>
              <SelectItem value="in">inches</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="text-slate-400 hover:bg-white/5 hover:text-white"
          onClick={() => window.open(GITHUB_URL, '_blank')}
        >
          <Github className="mr-1.5 h-4 w-4" />
          <span className="hidden sm:inline">GitHub</span>
        </Button>

        <Button
          size="sm"
          onClick={onOpenFile}
          className="bg-cyan-400 font-semibold text-slate-950 shadow-lg shadow-cyan-500/25 hover:bg-cyan-300"
        >
          <Upload className="mr-1.5 h-4 w-4" />
          Open model
        </Button>
      </div>
    </header>
  )
}
