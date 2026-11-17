// Holmstead's animated logo: the H in embossed metal with a dot orbiting it (George, 2026-11-17: "There's the
// main image of the home suite in the website"). A web copy of the Holm repo's packages/shared/components/HolmLoader.tsx
// (style B), drawn into any <svg data-holm-loader viewBox="0 0 1024 1024">. Each lap the dot takes the next
// app's colour, and that colour reflects in the metal. Still frame with prefers-reduced-motion; the browser
// pauses requestAnimationFrame in background tabs, so a hidden page costs nothing.
(() => {
  const NS = 'http://www.w3.org/2000/svg'
  const CX = 512, CY = 545, RX = 400, RY = 120, TILT_DEG = -16, TILT = TILT_DEG * Math.PI / 180
  const LAP = 2.4, TAU = Math.PI * 2, STILL_T = LAP * 0.3
  const SEAM = 60   // half-width of the soft behind/in-front cross-fade, in ring units
  const H_D = 'M253 307H381V467L481 398L581 467V307H709V778H581V600L481 536L381 600V778H253Z'
  const METAL = [[0, '#BFE4FF'], [0.45, '#6CC0FF'], [1, '#3A8CCB']]
  const REFL_RINGS = [[220, 0.16], [150, 0.2], [90, 0.26], [45, 0.3]]
  const SHADOW_STEPS = [[44, 0.07], [28, 0.1], [14, 0.14]]
  // Waystead, Bubblestead, Broodstead, Healstead, Witstead, Gradestead (Holm packages/shared/brand-colors.json)
  const APP_COLOURS = ['#637F00', '#E88555', '#66549E', '#B6375F', '#DECC6B', '#2BB7A9']
  const ORBIT = '#1C4C7C', ORBIT_EDGE = '#050A10'
  const f = n => n.toFixed(1)
  const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16))
  const mix = (a, b, p) => 'rgb(' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * p)).join(',') + ')'
  let uid = 0

  function build(svg) {
    const id = 'hl' + (uid++)
    svg.textContent = ''   // drop the still-logo fallback the page ships for script-off visitors
    const el = (tag, attrs, parent) => {
      const e = document.createElementNS(NS, tag)
      for (const k in attrs) e.setAttribute(k, attrs[k])
      parent.appendChild(e)
      return e
    }
    const defs = el('defs', {}, svg)
    const seamMask = (mid, behind) => {
      const g = el('linearGradient', { id: mid + 'g', gradientUnits: 'userSpaceOnUse', x1: 0, y1: -SEAM, x2: 0, y2: SEAM }, defs)
      el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': behind ? 1 : 0 }, g)
      el('stop', { offset: 1, 'stop-color': '#fff', 'stop-opacity': behind ? 0 : 1 }, g)
      const m = el('mask', { id: mid, maskUnits: 'userSpaceOnUse', x: -600, y: -400, width: 1200, height: 800 }, defs)
      el('rect', { x: -600, y: -400, width: 1200, height: 800, fill: `url(#${mid}g)` }, m)
    }
    seamMask(id + 'b', true)
    seamMask(id + 'f', false)
    const orbitHalf = isFront => {
      const g = el('g', { transform: `translate(${CX},${CY}) rotate(${TILT_DEG})` }, svg)
      const inner = el('g', { mask: `url(#${id}${isFront ? 'f' : 'b'})`, opacity: isFront ? 1 : 0.7 }, g)
      el('ellipse', { rx: RX, ry: RY, fill: 'none', stroke: ORBIT, 'stroke-opacity': 0.35, 'stroke-width': 6 }, inner)
      const trailEdge = isFront ? el('path', { fill: 'none', stroke: ORBIT_EDGE, 'stroke-width': 34, 'stroke-linecap': 'round' }, inner) : null
      const trail = el('path', { fill: 'none', stroke: ORBIT, 'stroke-width': 22, 'stroke-linecap': 'round' }, inner)
      const dot = el('circle', { r: 52, fill: ORBIT, stroke: isFront ? ORBIT_EDGE : 'none', 'stroke-width': 10 }, inner)
      return { trail, trailEdge, dot }
    }
    const back = orbitHalf(false)
    const grad = el('linearGradient', { id: id + 'm', gradientUnits: 'userSpaceOnUse', x1: 0, y1: 307, x2: 0, y2: 778 }, defs)
    METAL.forEach(([o, c]) => el('stop', { offset: o, 'stop-color': c }, grad))
    const clip = el('clipPath', { id: id + 'h' }, defs)
    el('path', { d: H_D }, clip)
    el('path', { d: H_D, fill: `url(#${id}m)` }, svg)
    const inside = el('g', { 'clip-path': `url(#${id}h)` }, svg)
    const wash = el('path', { d: H_D, fill: APP_COLOURS[0], opacity: 0.3 }, inside)
    const glints = REFL_RINGS.map(([r, o]) => el('circle', { r, 'fill-opacity': o }, inside))
    el('path', { d: H_D, fill: 'none', stroke: '#ffffff', 'stroke-opacity': 0.7, 'stroke-width': 14, 'stroke-linejoin': 'miter', transform: 'translate(6 6)' }, inside)
    SHADOW_STEPS.forEach(([w, o]) => el('path', { d: H_D, fill: 'none', stroke: '#000000', 'stroke-opacity': o, 'stroke-width': w, 'stroke-linejoin': 'miter', transform: 'translate(-6 -6)' }, inside))
    const front = orbitHalf(true)
    return { halves: [back, front], wash, glints }
  }

  function render(L, t) {
    const theta = (t / LAP % 1) * TAU
    const span = TAU * (0.12 + 0.36 * (0.5 - 0.5 * Math.cos(t * Math.PI / LAP)))   // trail breathes 12%-48%
    const x1 = RX * Math.cos(theta - span), y1 = RY * Math.sin(theta - span)
    const x2 = RX * Math.cos(theta), y2 = RY * Math.sin(theta)
    const arc = `M${f(x1)} ${f(y1)}A${RX} ${RY} 0 0 1 ${f(x2)} ${f(y2)}`
    const lap = Math.floor(t / LAP), frac = t / LAP % 1
    const app = n => APP_COLOURS[((n % 6) + 6) % 6]   // safe for any lap, even a negative one
    const colour = mix(app(lap), app(lap + 1), Math.min(1, Math.max(0, (frac - 0.85) / 0.15)))
    const sx = CX + x2 * Math.cos(TILT) - y2 * Math.sin(TILT)
    const sy = CY + x2 * Math.sin(TILT) + y2 * Math.cos(TILT)
    for (const h of L.halves) {
      h.trail.setAttribute('d', arc)
      if (h.trailEdge) h.trailEdge.setAttribute('d', arc)
      h.dot.setAttribute('cx', f(x2))
      h.dot.setAttribute('cy', f(y2))
      h.dot.setAttribute('fill', colour)
    }
    L.wash.setAttribute('fill', colour)
    L.glints.forEach(c => { c.setAttribute('cx', f(sx)); c.setAttribute('cy', f(sy)); c.setAttribute('fill', colour) })
  }

  const loaders = [...document.querySelectorAll('svg[data-holm-loader]')].map(build)
  if (!loaders.length) return
  loaders.forEach(L => render(L, STILL_T))
  const still = window.matchMedia('(prefers-reduced-motion: reduce)')
  const t0 = performance.now()
  // The next frame is booked first, so one bad frame can never stop the animation. The first frame's
  // timestamp can be a little before t0, hence the clamp (that negative time froze every logo, 2026-11-17).
  const frame = now => {
    requestAnimationFrame(frame)
    if (!still.matches) loaders.forEach(L => render(L, Math.max(0, now - t0) / 1000))
  }
  requestAnimationFrame(frame)
})()
