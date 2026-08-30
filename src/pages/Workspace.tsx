import { useCallback, useEffect, useRef, useState } from 'react'
import { UploadCloud, FileBox, Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useCad } from '@/lib/store'
import { importFiles, SUPPORTED_EXTENSIONS } from '@/lib/importers'
import { compileScad } from '@/lib/scad'
import { SAMPLES } from '@/lib/samples'
import { Viewport } from '@/components/viewer/Viewport'
import { Toolbar } from '@/components/viewer/Toolbar'
import { TopBar } from '@/components/viewer/TopBar'
import { RightPanel } from '@/components/viewer/RightPanel'

const ACCEPT = SUPPORTED_EXTENSIONS.map((e) => `.${e}`).join(',')

export default function Workspace() {
  const [dragging, setDragging] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const hasParts = useCad((s) => s.parts.length > 0)
  const loading = useCad((s) => s.loading)

  const openFileDialog = useCallback(() => fileInput.current?.click(), [])

  const handleFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return
    const { setLoading, setParts, commandCamera } = useCad.getState()
    setLoading(`Importing ${files.length} file${files.length > 1 ? 's' : ''}…`)
    try {
      const results = await importFiles(files)
      for (const r of results) {
        setParts(r.parts, { scadSource: r.scadSource, params: r.params, groupId: r.groupId })
      }
      commandCamera('fit')
      toast.success(
        results.reduce((n, r) => n + r.parts.length, 0) === 1
          ? 'Model loaded — drag to rotate'
          : `${results.reduce((n, r) => n + r.parts.length, 0)} objects loaded — drag to rotate`,
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not read that file')
    } finally {
      setLoading(null)
    }
  }, [])

  const loadSample = useCallback((id: string) => {
    const sample = SAMPLES.find((s) => s.id === id)
    if (!sample) return
    const { setParts, commandCamera, setLoading } = useCad.getState()
    setLoading('Building sample…')
    try {
      const groupId = `sample-${sample.id}`
      const { parts, params } = compileScad(sample.source, groupId)
      setParts(parts, { scadSource: sample.source, params, groupId })
      commandCamera('fit')
      toast.success('Sample loaded — try the parameter sliders on the right')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sample failed to build')
    } finally {
      setLoading(null)
    }
  }, [])

  /* window-level drag & drop */
  useEffect(() => {
    let depth = 0
    const onDragEnter = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return
      depth++
      setDragging(true)
    }
    const onDragLeave = () => {
      depth = Math.max(0, depth - 1)
      if (depth === 0) setDragging(false)
    }
    const onDragOver = (e: DragEvent) => e.preventDefault()
    const onDrop = (e: DragEvent) => {
      e.preventDefault()
      depth = 0
      setDragging(false)
      const files = [...(e.dataTransfer?.files ?? [])]
      void handleFiles(files)
    }
    window.addEventListener('dragenter', onDragEnter)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('dragover', onDragOver)
    window.addEventListener('drop', onDrop)
    return () => {
      window.removeEventListener('dragenter', onDragEnter)
      window.removeEventListener('dragleave', onDragLeave)
      window.removeEventListener('dragover', onDragOver)
      window.removeEventListener('drop', onDrop)
    }
  }, [handleFiles])

  /* keyboard shortcuts */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const s = useCad.getState()
        if (s.simDraft) s.setSimDraft(null)
        else if (s.tool !== 'orbit') s.setTool('orbit')
        else s.select(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0a0f16]">
      {/* 3D viewport fills everything */}
      <div className="absolute inset-0">
        <Viewport />
      </div>

      {/* overlay UI */}
      <div className="pointer-events-none absolute inset-0 flex flex-col gap-3 p-3 sm:p-4">
        <TopBar onOpenFile={openFileDialog} />
        <div className="flex min-h-0 flex-1 items-stretch gap-3">
          <Toolbar onOpenFile={openFileDialog} />
          <div className="flex-1" />
          <RightPanel />
        </div>
      </div>

      {/* empty state */}
      {!hasParts && !loading && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
          <div className="glass pointer-events-auto w-full max-w-md rounded-3xl p-8 text-center shadow-2xl shadow-black/50 animate-fade-up">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/20 to-indigo-500/20 ring-1 ring-cyan-400/30">
              <UploadCloud className="h-8 w-8 text-cyan-300" />
            </div>
            <h2 className="font-display text-xl font-semibold">Drop a 3D file to begin</h2>
            <p className="mt-1.5 text-sm text-slate-400">
              Your file never leaves your device — everything runs in the browser.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-1.5">
              {SUPPORTED_EXTENSIONS.map((e) => (
                <span key={e} className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  .{e}
                </span>
              ))}
            </div>
            <button
              onClick={openFileDialog}
              className="mt-6 w-full rounded-xl bg-cyan-400 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/25 transition-all hover:bg-cyan-300 hover:shadow-cyan-400/40"
            >
              Browse files
            </button>
            <div className="mt-5 border-t border-white/10 pt-4">
              <p className="mb-2.5 flex items-center justify-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                <Sparkles className="h-3 w-3" /> Or try a sample
              </p>
              <div className="grid grid-cols-2 gap-2">
                {SAMPLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => loadSample(s.id)}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left transition-all hover:border-cyan-400/40 hover:bg-cyan-400/10"
                  >
                    <FileBox className="h-4 w-4 shrink-0 text-cyan-300" />
                    <span>
                      <span className="block text-xs font-medium text-slate-200">{s.label}</span>
                      <span className="block text-[10px] text-slate-500">{s.description}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* drag overlay */}
      {dragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0a0f16]/80 backdrop-blur-sm">
          <div className="flex h-[86%] w-[92%] flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-cyan-400/60 bg-cyan-400/5">
            <UploadCloud className="h-14 w-14 text-cyan-300" />
            <p className="font-display text-2xl font-semibold text-cyan-200">Drop your 3D file</p>
            <p className="text-sm text-slate-400">STL · OBJ · GLB · GLTF · SCAD · ZIP</p>
          </div>
        </div>
      )}

      {/* loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#0a0f16]/60 backdrop-blur-sm">
          <div className="glass flex items-center gap-3 rounded-2xl px-6 py-4">
            <Loader2 className="h-5 w-5 animate-spin text-cyan-300" />
            <span className="text-sm text-slate-200">{loading}</span>
          </div>
        </div>
      )}

      <input
        ref={fileInput}
        type="file"
        multiple
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          void handleFiles([...(e.target.files ?? [])])
          e.target.value = ''
        }}
      />
    </div>
  )
}
