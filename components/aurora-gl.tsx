'use client'

/**
 * The hero aurora, on the GPU.
 *
 * ── Why a hand-written shader and not three.js ─────────────────────────────
 * three.js core is ~150 KB gzipped — larger than this site's entire JavaScript
 * budget, for an audience §9 says buys mobile data in bundles. It is also a 3D
 * scene graph: cameras, materials, lights, a renderer abstraction. None of that
 * is used by a full-screen gradient. This is the same output for roughly 2% of
 * the bytes: one quad, one fragment shader, no dependencies.
 *
 * ── What it does that CSS could not ────────────────────────────────────────
 * The CSS aurora was two stacked radial gradients on a keyframe. This is
 * domain-warped fractal noise evaluated per pixel, per frame, so the field
 * genuinely churns rather than sliding. The pointer bends the warp, so the
 * gradient reacts to the cursor instead of ignoring it. That is the difference
 * between "a gradient" and "a surface that is alive".
 *
 * ── Cost control, all of it load-bearing ───────────────────────────────────
 *  - Lazy: this module is only fetched behind a dynamic boundary, after paint.
 *  - The CSS aurora stays in the markup underneath and is what everyone sees
 *    first. If WebGL is unavailable, or the visitor prefers reduced motion, or
 *    the device reports save-data, this never mounts and nothing is lost.
 *  - DPR capped at 1.5. A mid-range Android does not need 3x pixels of blur.
 *  - The rAF loop stops entirely when the hero scrolls out of view, so it costs
 *    nothing while the visitor reads the rest of the page. This is the single
 *    most important line in the file for scroll smoothness.
 *  - Pointer is smoothed toward its target rather than read per event, so a
 *    fast cursor cannot queue work.
 */
import { useEffect, useRef } from 'react'

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`

/* A woven silk sweep.
 *
 * Structurally this follows the reference hero: one large flowing form entering
 * from the top-right and bleeding off both edges, with the left held clean for
 * the headline. The surface is where it diverges — the reference is painted
 * blur, this is built from two layered striation frequencies, so it reads as
 * woven rather than airbrushed. That is the same fine-line language used by the
 * ribbon in the dark section, which makes it ours rather than borrowed.
 *
 * The `veil` term at the end is not decoration: it is what keeps the headline
 * on near-white ground and its contrast intact. Re-measure if you touch it. */
const FRAG = `precision mediump float;
uniform vec2 r;uniform float t;uniform vec2 m;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
 return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*n(p);p*=2.03;a*=.5;}return v;}
void main(){
 vec2 uv=gl_FragCoord.xy/r;
 vec2 a=vec2(uv.x*(r.x/r.y),uv.y);
 float T=t*0.05;
 float w1=fbm(a*0.95+vec2(T*0.45,-T*0.3));
 float w2=fbm(a*0.62+vec2(-T*0.26,T*0.38)+w1*0.85);
 vec2 mm=(m-vec2(0.72,0.5))*0.26;
 vec2 p=a+vec2(w1,w2)*0.58+mm;
 float s=(p.x*0.86-p.y*1.16)*0.72+w2*0.34+0.16;

 // Fine striations, layered at two frequencies so the surface reads as woven
 // rather than combed. This is the part that stops it looking like a blur.
 float st1=sin(s*58.0+w1*4.0);
 float st2=sin(s*23.0-w2*3.0);
 float fine=smoothstep(-0.7,0.8,st1)*0.62+smoothstep(-0.6,0.9,st2)*0.38;

 float g=clamp(s,0.0,1.0);
 // Hue travels along the sweep: pale -> lilac -> violet -> indigo, with an
 // orchid bloom where the warp folds. Violet family throughout, so it never
 // collides with the triage palette.
 vec3 pale =vec3(0.98,0.96,1.00);
 vec3 lilac=vec3(0.80,0.70,1.00);
 vec3 core =vec3(0.46,0.29,1.00);
 vec3 deep =vec3(0.33,0.20,0.86);
 vec3 orchid=vec3(0.95,0.62,1.00);
 vec3 c=mix(pale,lilac,smoothstep(0.02,0.30,g));
 c=mix(c,core,smoothstep(0.24,0.58,g));
 c=mix(c,deep,smoothstep(0.58,1.02,g));
 c=mix(c,orchid,smoothstep(0.55,0.95,w1)*0.5);
 c=mix(c,lilac,smoothstep(0.62,0.98,w2)*0.30);
 c=mix(c*0.90,c*1.20,fine);c+=vec3(0.05,0.02,0.10)*smoothstep(0.25,0.75,g);

 float band=smoothstep(-0.05,0.30,s)*(1.0-smoothstep(0.92,1.45,s));
 float veil=smoothstep(0.28,0.78,uv.x*0.92+uv.y*0.20);
 gl_FragColor=vec4(c,clamp(band*veil,0.0,1.0));
}`

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null
  return s
}

export default function AuroraGL() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const gl = cv.getContext('webgl', {
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
      powerPreference: 'low-power',
    })
    if (!gl) return // No WebGL: the CSS aurora underneath is already correct.

    const vs = compile(gl, gl.VERTEX_SHADER, VERT)
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
    if (!vs || !fs) return

    const prog = gl.createProgram()!
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    const uR = gl.getUniformLocation(prog, 'r')
    const uT = gl.getUniformLocation(prog, 't')
    const uM = gl.getUniformLocation(prog, 'm')

    const target = { x: 0.72, y: 0.5 }
    const eased = { x: 0.72, y: 0.5 }
    let raf = 0
    let visible = true
    let start = performance.now()

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const w = Math.floor(cv.clientWidth * dpr)
      const h = Math.floor(cv.clientHeight * dpr)
      if (cv.width !== w || cv.height !== h) {
        cv.width = w
        cv.height = h
        gl.viewport(0, 0, w, h)
      }
      gl.uniform2f(uR, cv.width, cv.height)
    }

    const frame = (now: number) => {
      raf = 0
      if (!visible) return
      size()
      // Ease toward the pointer so the field lags slightly. Reads as fluid.
      eased.x += (target.x - eased.x) * 0.022
      eased.y += (target.y - eased.y) * 0.022
      gl.uniform1f(uT, (now - start) / 1000)
      gl.uniform2f(uM, eased.x, eased.y)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      raf = requestAnimationFrame(frame)
    }

    const onMove = (e: PointerEvent) => {
      const b = cv.getBoundingClientRect()
      target.x = (e.clientX - b.left) / b.width
      target.y = 1 - (e.clientY - b.top) / b.height
    }

    // Stop entirely when the hero is off-screen. Scrolling the rest of the
    // page must not pay for a shader nobody can see.
    const io = new IntersectionObserver(
      ([en]) => {
        visible = en.isIntersecting
        if (visible && !raf) {
          start = performance.now() - 1000
          raf = requestAnimationFrame(frame)
        }
      },
      { threshold: 0 },
    )
    io.observe(cv)

    if (window.matchMedia('(pointer: fine)').matches) {
      window.addEventListener('pointermove', onMove, { passive: true })
    }
    window.addEventListener('resize', size)
    cv.style.opacity = '1'
    raf = requestAnimationFrame(frame)

    return () => {
      io.disconnect()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('resize', size)
      if (raf) cancelAnimationFrame(raf)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-0 transition-opacity duration-700"
    />
  )
}
