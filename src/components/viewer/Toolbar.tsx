import {
  ZoomIn,
  ZoomOut,
  Rotate3d,
  Hand,
  Home,
  Scan,
  Box,
  Ruler,
  FolderOpen,
  Grid3x3,
  Check,
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useCad, type ToolMode, type ViewName } from '@/lib/store'

function ToolButton({
  icon: Icon,
  label,
  onClick,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick?: () => void
  active?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          aria-label={label}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-white/5 hover:text-slate-100',
            active && 'bg-cyan-400/15 text-cyan-300 hover:bg-cyan-400/20 hover:text-cyan-200',
          )}
        >
          <Icon className="h-[18px] w-[18px]" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="font-medium">
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

const VIEWS: { id: ViewName; label: string }[] = [
  { id: 'front', label: 'Front' },
  { id: 'back', label: 'Back' },
  { id: 'left', label: 'Left' },
  { id: 'right', label: 'Right' },
  { id: 'top', label: 'Top' },
  { id: 'bottom', label: 'Bottom' },
]

export function Toolbar({ onOpenFile }: { onOpenFile: () => void }) {
  const tool = useCad((s) => s.tool)
  const setTool = useCad((s) => s.setTool)
  const ortho = useCad((s) => s.ortho)
  const toggleOrtho = useCad((s) => s.toggleOrtho)
  const commandCamera = useCad((s) => s.commandCamera)
  const hasParts = useCad((s) => s.parts.length > 0)

  const modeTool = (t: ToolMode) => () => setTool(tool === t ? 'orbit' : t)

  return (
    <TooltipProvider delayDuration={250}>
      <div className="glass pointer-events-auto flex w-14 flex-col items-center gap-1 rounded-2xl py-3 shadow-2xl shadow-black/40">
        <ToolButton icon={FolderOpen} label="Open a 3D model" onClick={onOpenFile} />
        <div className="my-1 h-px w-8 bg-white/10" />

        <ToolButton icon={ZoomIn} label="Zoom in" onClick={() => commandCamera('zoomIn')} />
        <ToolButton icon={ZoomOut} label="Zoom out" onClick={() => commandCamera('zoomOut')} />
        <div className="my-1 h-px w-8 bg-white/10" />

        <ToolButton icon={Rotate3d} label="Rotate (drag)" onClick={modeTool('orbit')} active={tool === 'orbit'} />
        <ToolButton icon={Hand} label="Pan / move (drag)" onClick={modeTool('pan')} active={tool === 'pan'} />
        <ToolButton icon={Ruler} label="Measure — click two points" onClick={modeTool('measure')} active={tool === 'measure'} />
        <div className="my-1 h-px w-8 bg-white/10" />

        <ToolButton icon={Home} label="Reset view" onClick={() => commandCamera('reset')} />
        <ToolButton icon={Scan} label="Fit to screen" onClick={() => commandCamera('fit')} />
        <ToolButton icon={Box} label="3D view" onClick={() => commandCamera('view', 'iso')} />

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Standard views"
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-white/5 hover:text-slate-100"
                >
                  <Grid3x3 className="h-[18px] w-[18px]" />
                </button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              Standard views
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent side="right" align="start" className="glass border-white/10 text-slate-200">
            <DropdownMenuLabel className="text-xs text-slate-500">Snap camera to</DropdownMenuLabel>
            {VIEWS.map((v) => (
              <DropdownMenuItem
                key={v.id}
                disabled={!hasParts}
                onClick={() => commandCamera('view', v.id)}
                className="cursor-pointer focus:bg-white/10 focus:text-white"
              >
                {v.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem onClick={toggleOrtho} className="cursor-pointer focus:bg-white/10 focus:text-white">
              <Check className={cn('mr-2 h-4 w-4', ortho ? 'opacity-100' : 'opacity-0')} />
              Orthographic
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleOrtho} className="cursor-pointer focus:bg-white/10 focus:text-white">
              <Check className={cn('mr-2 h-4 w-4', !ortho ? 'opacity-100' : 'opacity-0')} />
              Perspective
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  )
}
