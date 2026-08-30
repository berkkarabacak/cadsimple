import * as THREE from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import JSZip from 'jszip'
import { uid, type Part, type ScadParam } from './store'
import { partColor } from './palette'
import { compileScad } from './scad'

export const SUPPORTED_EXTENSIONS = ['stl', 'obj', 'glb', 'gltf', 'scad', 'zip']

export interface ImportResult {
  parts: Part[]
  scadSource?: string
  params?: ScadParam[]
  groupId: string
}

function ext(name: string): string {
  const m = /\.([^.]+)$/.exec(name.toLowerCase())
  return m ? m[1] : ''
}

function baseName(path: string): string {
  const n = path.split('/').pop() ?? path
  return n.replace(/\.[^.]+$/, '')
}

function mkPart(geometry: THREE.BufferGeometry, name: string, groupId: string, format: string, index: number): Part {
  if (!geometry.getAttribute('normal')) geometry.computeVertexNormals()
  return {
    id: uid(),
    name,
    geometry,
    color: partColor(index),
    visible: true,
    opacity: 1,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    groupId,
    format,
    sim: null,
  }
}

/* ---------------- individual format loaders ---------------- */

function importStl(buffer: ArrayBuffer, name: string, groupId: string): Part[] {
  const geometry = new STLLoader().parse(buffer)
  return [mkPart(geometry, baseName(name), groupId, 'stl', 0)]
}

function importObj(text: string, name: string, groupId: string): Part[] {
  const group = new OBJLoader().parse(text)
  const parts: Part[] = []
  let i = 0
  group.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh
      const g = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld)
      parts.push(mkPart(g, mesh.name || `${baseName(name)} ${i + 1}`, groupId, 'obj', i))
      i++
    }
  })
  if (parts.length === 0) throw new Error('No geometry found in OBJ file')
  return parts
}

async function importGltf(buffer: ArrayBuffer, name: string, groupId: string): Promise<Part[]> {
  const loader = new GLTFLoader()
  const gltf = await loader.parseAsync(buffer, '')
  const parts: Part[] = []
  let i = 0
  gltf.scene.updateMatrixWorld(true)
  gltf.scene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh
      const g = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld)
      const mat = mesh.material as THREE.MeshStandardMaterial
      const part = mkPart(g, mesh.name || `${baseName(name)} ${i + 1}`, groupId, 'gltf', i)
      if (mat?.color && !mat.color.equals(new THREE.Color(1, 1, 1))) {
        part.color = `#${mat.color.getHexString()}`
      }
      parts.push(part)
      i++
    }
  })
  if (parts.length === 0) throw new Error('No geometry found in GLTF file')
  return parts
}

async function importZip(buffer: ArrayBuffer, _name: string, groupId: string): Promise<Part[]> {
  const zip = await JSZip.loadAsync(buffer)
  const perFile: { name: string; parts: Part[] }[] = []
  let colorIndex = 0
  let firstError: string | null = null
  const seenExts = new Set<string>()

  const push = (name: string, loaded: Part[]) => {
    for (const p of loaded) p.color = p.format === 'scad' ? p.color : partColor(colorIndex++)
    perFile.push({ name, parts: loaded })
  }

  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir || path.startsWith('__MACOSX')) continue
    const e = ext(path)
    if (e) seenExts.add(e)
    try {
      if (e === 'stl') {
        push(path, importStl(await entry.async('arraybuffer'), path, groupId))
      } else if (e === 'obj') {
        push(path, importObj(await entry.async('string'), path, groupId))
      } else if (e === 'glb' || e === 'gltf') {
        push(path, await importGltf(await entry.async('arraybuffer'), path, groupId))
      } else if (e === 'scad') {
        const { parts } = compileScad(await entry.async('string'), groupId)
        perFile.push({ name: path, parts })
      }
    } catch (err) {
      if (!firstError) firstError = `${path.split('/').pop()}: ${err instanceof Error ? err.message : 'could not be read'}`
    }
  }

  if (perFile.length === 0) {
    if (firstError) throw new Error(`Could not build the models in this ZIP — ${firstError}`)
    const found = [...seenExts].filter((e) => !['txt', 'md', 'json'].includes(e))
    throw new Error(
      found.length > 0
        ? `This ZIP contains ${found.map((e) => `.${e.toUpperCase()}`).join(', ')} files, which aren't supported yet. STEP and IGES are on the roadmap.`
        : 'No supported 3D files found inside the ZIP archive',
    )
  }

  // multiple models in one archive → lay them out side by side and name them clearly
  if (perFile.length > 1) {
    const box = new THREE.Box3()
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    let cursor = 0
    for (const file of perFile) {
      box.makeEmpty()
      for (const p of file.parts) {
        p.geometry.computeBoundingBox()
        if (p.geometry.boundingBox) box.union(p.geometry.boundingBox)
      }
      box.getSize(size)
      box.getCenter(center)
      const shift = cursor - center.x + size.x / 2
      for (const p of file.parts) {
        p.position = [shift, 0, 0]
        p.name = `${baseName(file.name)} · ${p.name}`
      }
      cursor += size.x * 1.15
    }
    // re-centre the whole row on the origin
    const mid = cursor / 2
    for (const file of perFile) {
      for (const p of file.parts) p.position = [p.position[0] - mid, p.position[1], p.position[2]]
    }
  }

  return perFile.flatMap((f) => f.parts)
}

/* ---------------- public entry point ---------------- */

export async function importFile(file: File): Promise<ImportResult> {
  const groupId = uid()
  const e = ext(file.name)
  switch (e) {
    case 'stl':
      return { parts: importStl(await file.arrayBuffer(), file.name, groupId), groupId }
    case 'obj':
      return { parts: importObj(await file.text(), file.name, groupId), groupId }
    case 'glb':
    case 'gltf':
      return { parts: await importGltf(await file.arrayBuffer(), file.name, groupId), groupId }
    case 'scad': {
      const source = await file.text()
      const { parts, params } = compileScad(source, groupId)
      return { parts, scadSource: source, params, groupId }
    }
    case 'zip':
      return { parts: await importZip(await file.arrayBuffer(), file.name, groupId), groupId }
    default:
      throw new Error(`".${e}" is not supported yet. STEP and IGES are on the roadmap.`)
  }
}

export async function importFiles(files: File[]): Promise<ImportResult[]> {
  const results: ImportResult[] = []
  const errors: string[] = []
  for (const file of files) {
    try {
      results.push(await importFile(file))
    } catch (err) {
      errors.push(`${file.name}: ${err instanceof Error ? err.message : 'could not be read'}`)
    }
  }
  if (results.length === 0 && errors.length > 0) throw new Error(errors.join('\n'))
  return results
}
