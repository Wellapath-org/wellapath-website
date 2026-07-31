'use client'

/**
 * The coverage globe — three.js.
 *
 * ── What it is ─────────────────────────────────────────────────────────────
 * A slowly turning wireframe globe with the real facility coordinates plotted
 * on its surface as points, Nigeria oriented toward the viewer. The red points
 * are the emergency-capable share. It is the same dataset as the flat map on
 * /coverage, in the round: our own fieldwork, which is what makes it ours
 * rather than a stock 3D flourish.
 *
 * ── The honest cost ────────────────────────────────────────────────────────
 * three.js is ~84 KB gzipped minimum, and the renderer is most of it. That is
 * two thirds of this site's entire JavaScript budget for one graphic, which is
 * why everything below is a gate rather than a nicety:
 *
 *   - Loaded only behind a dynamic import, so it never enters First Load JS.
 *   - Only fetched when the section actually scrolls into view. A visitor who
 *     never reaches it never pays for it.
 *   - Skipped entirely on save-data, reduced-motion, and coarse pointers.
 *   - The flat SVG map is rendered underneath and is the real content; this
 *     replaces it only once it is ready.
 *   - Point count is 594, sampled at a fixed stride so each state keeps its
 *     true share. Geometry is a single BufferGeometry, drawn as one Points
 *     object — one draw call, not 594.
 *   - The render loop stops when the globe leaves the viewport.
 */
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import data from '@/content/artifacts/globe-points.json'

const R = 1

/** lat/lng in degrees to a point on a sphere of radius R. */
function toVec(lat: number, lng: number, radius = R) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  )
}

export default function Globe3D() {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = host.current
    if (!el) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
    camera.position.set(0, 0, 3.4)

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
    el.appendChild(renderer.domElement)
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.display = 'block'

    // Everything rotates as one, so Nigeria can be aimed at the camera once.
    const world = new THREE.Group()
    scene.add(world)

    // ── A true graticule: parallels and meridians, not a wireframe mesh.
    //
    // An icosahedron in wireframe reads as a low-poly ball — a stock 3D asset.
    // Real latitude and longitude lines read as an instrument, which is the
    // register this brand wants.
    const grat: number[] = []
    const seg = 96
    for (let lat = -60; lat <= 60; lat += 20) {
      for (let i = 0; i < seg; i++) {
        const a = toVec(lat, (i / seg) * 360 - 180, R)
        const bb = toVec(lat, ((i + 1) / seg) * 360 - 180, R)
        grat.push(a.x, a.y, a.z, bb.x, bb.y, bb.z)
      }
    }
    for (let lng = -180; lng < 180; lng += 20) {
      for (let i = 0; i < seg / 2; i++) {
        const a = toVec((i / (seg / 2)) * 180 - 90, lng, R)
        const bb = toVec(((i + 1) / (seg / 2)) * 180 - 90, lng, R)
        grat.push(a.x, a.y, a.z, bb.x, bb.y, bb.z)
      }
    }
    const gg = new THREE.BufferGeometry()
    gg.setAttribute('position', new THREE.Float32BufferAttribute(grat, 3))
    world.add(
      new THREE.LineSegments(
        gg,
        new THREE.LineBasicMaterial({ color: 0x6b4eff, transparent: true, opacity: 0.22 }),
      ),
    )

    const fill = new THREE.Mesh(
      new THREE.SphereGeometry(R * 0.965, 48, 48),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.82 }),
    )
    world.add(fill)

    // ── The facilities, as two Points objects so each keeps its own colour.
    const pts = data.p as number[]
    const normal: number[] = []
    const emergency: number[] = []
    for (let i = 0; i < pts.length; i += 3) {
      const v = toVec(pts[i], pts[i + 1], R * 1.008)
      ;(pts[i + 2] === 1 ? emergency : normal).push(v.x, v.y, v.z)
    }

    const makePoints = (coords: number[], color: number, size: number, opacity: number) => {
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.Float32BufferAttribute(coords, 3))
      const m = new THREE.PointsMaterial({
        color,
        size,
        sizeAttenuation: true,
        transparent: true,
        opacity,
        depthWrite: false,
      })
      return new THREE.Points(g, m)
    }

    world.add(makePoints(normal, 0x6b4eff, 0.032, 0.92))
    world.add(makePoints(emergency, 0xc0281f, 0.05, 1))

    // ── A reticle over the covered region.
    //
    // Our three states span about 6 degrees of arc. On a globe drawn small
    // enough to still read AS a globe, that is a speck. Zooming in until the
    // dots are large enough destroys the silhouette and it stops looking like
    // a globe at all — so instead of enlarging the data, annotate it. Two thin
    // rings mark where the coverage is, which is also the honest message: a
    // small, precisely known area, not a whole continent.
    const here = toVec(9, 8, R * 1.015)
    const outward = here.clone().multiplyScalar(2)
    for (const [inner, outer, opacity] of [
      [0.1, 0.108, 0.75],
      [0.17, 0.174, 0.32],
    ] as const) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(inner, outer, 64),
        new THREE.MeshBasicMaterial({
          color: 0x4a2fd6,
          transparent: true,
          opacity,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      )
      ring.position.copy(here)
      ring.lookAt(outward)
      world.add(ring)
    }

    // Aim Nigeria (roughly 9°N, 8°E) straight at the camera.
    //
    // Composing this from Euler angles was wrong twice; a quaternion that maps
    // Nigeria's own unit vector onto +Z is exact and needs no reasoning about
    // rotation order.
    const base = new THREE.Quaternion().setFromUnitVectors(
      toVec(9, 8).normalize(),
      new THREE.Vector3(0, 0, 1),
    )
    world.quaternion.copy(base)

    // It rocks rather than spins. Every facility we hold sits in one small
    // region, so a full rotation would hide the entire dataset for most of the
    // cycle — an idle animation that deletes the content it exists to show.
    const yAxis = new THREE.Vector3(0, 1, 0)
    const xAxis = new THREE.Vector3(1, 0, 0)
    const qy = new THREE.Quaternion()
    const qx = new THREE.Quaternion()

    const size = () => {
      const w = el.clientWidth
      const h = el.clientHeight || w
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    size()

    let raf = 0
    let visible = true
    const targetSpin = { x: 0, y: 0 }
    const spin = { x: 0, y: 0 }

    const tick = () => {
      raf = 0
      if (!visible) return
      spin.x += (targetSpin.x - spin.x) * 0.035
      spin.y += (targetSpin.y - spin.y) * 0.035
      const t = performance.now() / 1000
      qy.setFromAxisAngle(yAxis, Math.sin(t * 0.16) * 0.30 + spin.x * 0.55)
      qx.setFromAxisAngle(xAxis, Math.sin(t * 0.11) * 0.07 + spin.y * 0.28)
      world.quaternion.copy(qy).multiply(qx).multiply(base)
      renderer.render(scene, camera)
      raf = requestAnimationFrame(tick)
    }

    const onMove = (e: PointerEvent) => {
      const b = el.getBoundingClientRect()
      targetSpin.x = (e.clientX - b.left) / b.width - 0.5
      targetSpin.y = (e.clientY - b.top) / b.height - 0.5
    }

    const io = new IntersectionObserver(
      ([en]) => {
        visible = en.isIntersecting
        if (visible && !raf) raf = requestAnimationFrame(tick)
      },
      { threshold: 0 },
    )
    io.observe(el)

    if (window.matchMedia('(pointer: fine)').matches) {
      window.addEventListener('pointermove', onMove, { passive: true })
    }
    window.addEventListener('resize', size)
    raf = requestAnimationFrame(tick)
    el.style.opacity = '1'

    return () => {
      io.disconnect()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('resize', size)
      if (raf) cancelAnimationFrame(raf)
      renderer.dispose()
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.Points) {
          o.geometry.dispose()
          ;(o.material as THREE.Material).dispose()
        }
      })
      el.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      ref={host}
      role="img"
      aria-label={`A slowly turning globe with ${data.total.toLocaleString('en-NG')} mapped health facilities plotted at their real coordinates, oriented on Nigeria. ${data.emergency} are flagged emergency-capable and shown in red.`}
      className="aspect-square w-full opacity-0 transition-opacity duration-700"
    />
  )
}
