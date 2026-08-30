import { useCad } from '@/lib/store'
import { ScenePanel } from './ScenePanel'
import { PropertiesCard } from './PropertiesCard'
import { SimCard } from './SimCard'
import { ParamsCard } from './ParamsCard'
import { MeasureCard } from './MeasureCard'

export function RightPanel() {
  const hasParts = useCad((s) => s.parts.length > 0)
  const selected = useCad((s) => s.parts.find((p) => p.id === s.selectedId) ?? null)
  const tool = useCad((s) => s.tool)

  if (!hasParts) return null

  return (
    <aside className="pointer-events-auto flex w-[300px] max-w-[82vw] flex-col gap-3 overflow-y-auto pb-2">
      <ScenePanel />
      {selected && (
        <>
          <PropertiesCard part={selected} />
          <SimCard part={selected} />
        </>
      )}
      <ParamsCard />
      {(tool === 'measure' || tool === 'pickPivot') && <MeasureCard />}
    </aside>
  )
}
