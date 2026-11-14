// Paper Lake: a night lake in cut paper on dark kraft.
// Every piece is a scissor-cut outline kept once in <defs> and laid four times:
// a far shadow, a near shadow, a pale lip up and left, then the paper itself.
// The middle of the sheet stays open water, so the words sit on calm paper.
// (The layered-paper technique follows Anthropic's theme-examples "Paper Garden", Apache-2.0.)

type Pt = [number, number]

const W = 1600
const H = 1000

const PAINT: Record<string, string> = {
  ground: '#111b1c',
  fleck: '#a9c2ba',
  shadow: '#000000',
  lip: '#f1ead6',
  pineFar: '#172928',
  pineMid: '#1f3935',
  pineNear: '#284c44',
  moon: '#ece3c4',
  moonDim: '#d9cea8',
  moonHalo: '#ece3c4',
  water0: '#103f3d',
  water1: '#13544f',
  water2: '#186d66',
  water3: '#1d887e',
  water4: '#22a093',
  padDark: '#2d6a3e',
  pad: '#3d8749',
  padLight: '#51a05a',
  frog: '#6c9a3b',
  frogLight: '#88b551',
  frogDark: '#3f6224',
  frogBack: '#5a8530',
  frogMask: '#33501d',
  frogEar: '#4d7128',
  frogLeg: '#5e8b34',
  belly: '#ddd5a9',
  toe: '#a6c56b',
  iris: '#d6a634',
  pupil: '#101310',
  glint: '#fffbea',
  petalDark: '#e392af',
  petal: '#f1bccd',
  petalPale: '#fbe2ea',
  gold: '#f0c64c',
  reed: '#3a6b44',
  reedLight: '#4b8253',
  cattail: '#6d4a2d',
  star: '#f6efd6',
}

// ---------- numbers ----------

function hash(a: number, b: number): number {
  let h = (Math.round(a * 7919) * 374761393 + Math.round(b * 104729) * 668265263) >>> 0
  h = ((h ^ (h >>> 13)) * 1274126177) >>> 0
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
const jit = (seed: number, i: number, spread: number): number => 1 + (hash(seed, i) - 0.5) * 2 * spread
const r1 = (n: number): number => Math.round(n * 10) / 10

function poly(points: Pt[]): string {
  return 'M' + points.map(p => `${Math.round(p[0])} ${Math.round(p[1])}`).join('L') + 'Z'
}

/** A smooth closed outline through the given points, cut into short straight snips like scissors. */
function cutClosed(points: Pt[], snips: number, seed: number, wobble = 0.8): string {
  const out: Pt[] = []
  const n = points.length
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n]!
    const p1 = points[i]!
    const p2 = points[(i + 1) % n]!
    const p3 = points[(i + 2) % n]!
    for (let k = 0; k < snips; k++) {
      const t = k / snips
      const t2 = t * t
      const t3 = t2 * t
      const x = 0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3)
      const y = 0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
      const w = (hash(seed + i, k) - 0.5) * wobble
      out.push([x + w, y - w])
    }
  }
  return polyFine(out)
}

/** Like poly, but keeps one decimal, for small pieces. */
function polyFine(points: Pt[]): string {
  return 'M' + points.map(p => `${r1(p[0])} ${r1(p[1])}`).join('L') + 'Z'
}

/** A hand-cut disc, a little out of round; `sy` squashes it. */
function disc(r: number, sides: number, seed: number, sy = 1, cx = 0, cy = 0): string {
  const pts: Pt[] = []
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2
    const rr = r * jit(seed, i, 0.04)
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * sy])
  }
  return polyFine(pts)
}

/** A thin tapering sliver along a list of spine points. */
function sliver(spine: Pt[], width: number, taper = true): string {
  const left: Pt[] = []
  const right: Pt[] = []
  spine.forEach((p, i) => {
    const q = spine[Math.min(i + 1, spine.length - 1)]!
    const o = spine[Math.max(i - 1, 0)]!
    const dx = q[0] - o[0]
    const dy = q[1] - o[1]
    const len = Math.hypot(dx, dy) || 1
    const t = i / (spine.length - 1)
    const w = (width / 2) * (taper ? 1 - 0.85 * t : 1)
    left.push([p[0] - (dy / len) * w, p[1] + (dx / len) * w])
    right.unshift([p[0] + (dy / len) * w, p[1] - (dx / len) * w])
  })
  return polyFine(left.concat(right))
}

// ---------- shapes ----------

function pine(h: number, w: number, tiers: number, seed: number): string {
  const left: Pt[] = []
  const right: Pt[] = []
  const trunk = Math.max(4, w * 0.06)
  left.push([-trunk, 0])
  for (let i = 0; i < tiers; i++) {
    const t0 = 0.08 + (0.85 * i) / tiers
    const t1 = 0.08 + (0.85 * (i + 1)) / tiers
    const spread = (w / 2) * (1 - t0 * 0.9) * jit(seed, i, 0.12)
    const inner = spread * 0.38
    left.push([-spread, -h * t0], [-inner, -h * (t0 + (t1 - t0) * 0.35)])
    right.unshift([inner * jit(seed, i + 20, 0.1), -h * (t0 + (t1 - t0) * 0.3)], [spread * jit(seed, i + 9, 0.12), -h * t0])
  }
  left.push([0, -h])
  right.push([trunk, 0])
  return poly(left.concat(right))
}

function ridge(): string {
  const pts: Pt[] = [[-60, 640]]
  for (let i = 0; i <= 34; i++) {
    const x = -60 + (i / 34) * (W + 120)
    const y = 566 - 26 * Math.sin(i * 0.55) - 14 * Math.sin(i * 1.7 + 1) - hash(3, i) * 10
    pts.push([x, y])
  }
  pts.push([W + 60, 640])
  return poly(pts)
}

function waterBand(top: number, amp: number, seed: number): string {
  const pts: Pt[] = [[-80, H + 40]]
  for (let i = 0; i <= 44; i++) {
    const x = -80 + (i / 44) * (W + 160)
    const y = top + amp * Math.sin(i * 0.62 + seed) + (hash(seed, i) - 0.5) * amp * 0.5
    pts.push([x, y])
  }
  pts.push([W + 80, H + 40])
  return poly(pts)
}

/** A lily pad: a disc with a wedge cut out, squashed into perspective. */
function padPath(r: number, notch: number, seed: number, sy = 0.42): string {
  const pts: Pt[] = [[0, 0]]
  const sides = 34
  const gap = 0.32
  for (let i = 0; i <= sides; i++) {
    const a = notch + gap + (i / sides) * (Math.PI * 2 - gap * 2)
    const rr = r * jit(seed, i, 0.035)
    pts.push([Math.cos(a) * rr, Math.sin(a) * rr * sy])
  }
  return polyFine(pts)
}

/** The pad's top skin, a little smaller, with vein slits cut so the darker paper shows through. */
function padSkin(r: number, notch: number, seed: number, sy = 0.42): string {
  let d = padPath(r * 0.88, notch, seed + 1, sy)
  const veins = 9
  for (let i = 0; i < veins; i++) {
    const a = notch + 0.6 + (i / veins) * (Math.PI * 2 - 1.2)
    const a2 = a + 0.035
    const from = r * 0.16
    const to = r * 0.78 * jit(seed, i + 40, 0.08)
    d += polyFine([
      [Math.cos(a) * from, Math.sin(a) * from * sy],
      [Math.cos(a) * to, Math.sin(a) * to * sy],
      [Math.cos(a2) * to, Math.sin(a2) * to * sy],
      [Math.cos(a2 + 0.03) * from, Math.sin(a2 + 0.03) * from * sy],
    ])
  }
  return d
}

function petal(len: number, wid: number, seed: number): string {
  return cutClosed(
    [
      [0, 0],
      [-wid * 0.55, -len * 0.25],
      [-wid * 0.5, -len * 0.62],
      [0, -len],
      [wid * 0.5, -len * 0.62],
      [wid * 0.55, -len * 0.25],
    ],
    3,
    seed,
    0.4,
  )
}

function blade(len: number, wid: number, bend: number): string {
  const spine: Pt[] = []
  for (let i = 0; i <= 8; i++) {
    const t = i / 8
    spine.push([bend * len * t * t, -len * t])
  }
  return sliver(spine, wid)
}

function star4(r: number): string {
  const pts: Pt[] = []
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2
    const rr = i % 2 === 0 ? r : r * 0.32
    pts.push([Math.cos(a) * rr, Math.sin(a) * rr])
  }
  return polyFine(pts)
}

// ---------- the frog: many cut pieces, facing right, sitting, origin under the belly ----------

function frogShapes(): Array<[string, string]> {
  const body = cutClosed(
    [
      [-92, -8], [-106, -38], [-98, -72], [-76, -98], [-44, -110], [-8, -110], [26, -104], [52, -98],
      [76, -96], [100, -86], [118, -68], [124, -54], [118, -42], [104, -34], [84, -27], [56, -19], [26, -11], [-6, -5], [-46, -3], [-76, -4],
    ],
    3,
    11,
  )
  // The darker back over the lighter flank, as a real frog is shaded.
  const back = cutClosed(
    [[-96, -60], [-82, -92], [-46, -108], [-8, -108], [26, -102], [54, -96], [80, -94], [104, -82], [120, -64], [104, -66], [80, -74], [50, -76], [20, -80], [-14, -82], [-50, -76], [-80, -62]],
    3,
    15,
  )
  // A dark mask from the snout, through the eye, back over the eardrum.
  const mask = cutClosed([[122, -58], [104, -66], [80, -76], [56, -80], [40, -74], [44, -62], [62, -60], [86, -58], [106, -54]], 2, 16)
  let specks = ''
  for (let i = 0; i < 16; i++) {
    const sx = -90 + hash(i, 201) * 170
    const sy = -100 + hash(i, 202) * 48
    specks += disc(1.4 + hash(i, 203) * 1.4, 7, 60 + i, 1, sx, sy)
  }
  const belly = cutClosed(
    [[-38, -6], [4, -8], [44, -14], [82, -27], [104, -36], [108, -44], [88, -41], [58, -37], [18, -30], [-18, -23], [-44, -16]],
    3,
    12,
  )
  const fold = sliver([[-88, -84], [-62, -100], [-30, -107], [4, -106], [36, -97], [58, -88]], 6, false)
  const shin = cutClosed([[-4, -30], [-12, -12], [-60, -6], [-102, -2], [-112, -12], [-96, -22], [-50, -26]], 2, 13)
  const thigh = cutClosed([[-8, -24], [-24, -48], [-58, -62], [-96, -56], [-112, -34], [-98, -14], [-62, -8], [-26, -10]], 3, 14)
  const bands =
    sliver([[-40, -58], [-36, -36], [-32, -12]], 9) +
    sliver([[-64, -62], [-62, -38], [-58, -9]], 9) +
    sliver([[-88, -56], [-88, -34], [-84, -12]], 8)
  // The webbed hind foot lies forward along the pad, in front of the thigh: four long toes, webbing between.
  const foot = polyFine([
    [-104, -6], [-70, -9], [-34, -9], [-2, -16], [-20, -6], [10, -8], [-16, -2], [14, 1], [-16, 3], [4, 9], [-30, 5], [-70, 4], [-102, 3],
  ])
  const toes = disc(3.6, 9, 1, 1, -2, -16) + disc(3.6, 9, 2, 1, 10, -8) + disc(3.6, 9, 3, 1, 14, 1) + disc(3.4, 9, 4, 1, 4, 9)
  const spots =
    disc(9, 11, 5, 0.8, -58, -82) + disc(7, 10, 6, 0.85, -22, -94) + disc(6, 10, 7, 0.8, 12, -86) +
    disc(8, 11, 8, 0.75, -40, -64) + disc(5, 9, 9, 0.9, 30, -78)
  const arm = sliver([[60, -40], [56, -26], [62, -14], [72, -7], [78, -4]], 14, false)
  const fingers =
    sliver([[78, -5], [62, 1]], 4, false) + sliver([[78, -5], [72, 4]], 4, false) +
    sliver([[78, -5], [87, 4]], 4, false) + sliver([[78, -5], [97, 0]], 4, false)
  const fingerPads = disc(3.2, 9, 21, 1, 62, 1) + disc(3.2, 9, 22, 1, 72, 4) + disc(3.2, 9, 23, 1, 87, 4) + disc(3.2, 9, 24, 1, 97, 0)
  const mouth = sliver([[122, -50], [104, -46], [82, -48], [62, -54]], 2.6, false)
  return [
    ['fBody', body], ['fBack', back], ['fMask', mask], ['fSpecks', specks], ['fRing', disc(15.5, 16, 38, 1)], ['fBelly', belly], ['fFold', fold], ['fShin', shin], ['fThigh', thigh], ['fBands', bands],
    ['fFoot', foot], ['fToes', toes], ['fSpots', spots], ['fArm', arm], ['fFingers', fingers], ['fPads', fingerPads],
    ['fMouth', mouth],
    ['fEar', disc(10, 14, 31, 1)], ['fBulge', disc(20, 18, 32, 1)], ['fIris', disc(13.5, 16, 33, 1)],
    ['fPupil', disc(8.5, 12, 34, 0.5)], ['fGlint', disc(2.8, 8, 35, 1)], ['fLid', disc(15.5, 16, 36, 1)],
    ['fThroat', disc(16, 16, 37, 0.7)],
  ]
}

// ---------- laying paper ----------

/** One piece: shadows fall down and right on the sheet whatever the piece's own frame. */
function piece(id: string, fill: string, lift: number, frame = { dir: 1, s: 1 }, at = '', lip = true): string {
  const k = 1 / frame.s
  const fx = r1(lift * 1.8 * k * frame.dir)
  const fy = r1(lift * 2.3 * k)
  const nx = r1(lift * 0.8 * k * frame.dir)
  const ny = r1(lift * 1.05 * k)
  const lx = r1(-1.1 * k * frame.dir)
  const ly = r1(-1.1 * k)
  const use = (dx: number, dy: number, cls: string) =>
    `<use href="#${id}" transform="translate(${dx} ${dy})${at ? ' ' + at : ''}" class="${cls}"/>`
  const self = `<use href="#${id}"${at ? ` transform="${at}"` : ''} class="${fill}"/>`
  if (lift <= 0) return self
  return use(fx, fy, 'shadow far') + use(nx, ny, 'shadow near') + (lip ? use(lx, ly, 'lip edge') : '') + self
}

function frog(x: number, y: number, s: number, dir: 1 | -1, opts: { hop?: boolean; delay: number; puff?: boolean }): string {
  const fr = { dir, s }
  const d = opts.delay
  const eye = (cx: number, cy: number) =>
    `<g transform="translate(${cx} ${cy})">` +
    piece('fBulge', 'frogBack', 2.2, fr) + `<use href="#fRing" class="frogDark"/>` + piece('fIris', 'iris', 0.6, fr, '', false) +
    piece('fPupil', 'pupil', 0, fr) + `<use href="#fGlint" transform="translate(-4 -5)" class="glint"/>` +
    `<g transform="translate(0 -15)"><g class="lid" style="animation-delay:${d}s"><use href="#fLid" transform="translate(0 15)" class="frog"/></g></g>` +
    `</g>`
  const throat = opts.puff
    ? `<g transform="translate(90 -30)"><g class="puff" style="animation-delay:${d}s">${piece('fThroat', 'belly', 1.4, fr)}</g></g>`
    : ''
  const inner =
    `<g class="breathe" style="animation-delay:-${d}s">` +
    piece('fBody', 'frog', 4, fr) + piece('fBack', 'frogBack', 1, fr, '', false) + piece('fBelly', 'belly', 1.2, fr) +
    `<use href="#fSpots" class="frogDark"/>` + `<use href="#fSpecks" class="frogLight" opacity=".7"/>` + piece('fFold', 'frogLight', 0.8, fr) +
    piece('fMask', 'frogMask', 0.6, fr, '', false) +
    `<use href="#fEar" transform="translate(52 -66)" class="frogEar"/>` +
    piece('fShin', 'frogLeg', 2.4, fr) +
    piece('fThigh', 'frogLeg', 3.4, fr) + `<use href="#fBands" class="frogDark"/>` +
    piece('fFoot', 'frogLeg', 1.8, fr) + `<use href="#fToes" class="toe"/>` +
    throat +
    piece('fArm', 'frogLeg', 2.2, fr) + piece('fFingers', 'frogLeg', 1.2, fr) + `<use href="#fPads" class="toe"/>` +
    `<use href="#fMouth" class="frogDark"/>` +
    eye(80, -90) +
    `</g>`
  const flip = `translate(${x} ${y}) scale(${r1(s * dir * 100) / 100} ${r1(s * 100) / 100})`
  const body = opts.hop ? `<g class="hop" style="animation-delay:-${d}s">${inner}</g>` : inner
  return `<g transform="${flip}">${body}</g>`
}

function pad(x: number, y: number, r: number, seed: number, notch: number, extra = ''): string {
  const id = `pad${seed}`
  const skin = `skin${seed}`
  defsExtra.push([id, padPath(r, notch, seed)], [skin, padSkin(r, notch, seed)])
  const bob = `animation-duration:${r1(7 + hash(seed, 1) * 5)}s;animation-delay:-${r1(hash(seed, 2) * 9)}s`
  return (
    `<g transform="translate(${x} ${y})"><g class="bob" style="${bob}">` +
    piece(id, 'padDark', 3) + piece(skin, 'pad', 0.8, undefined, '', false) + extra +
    `</g></g>`
  )
}

const defsExtra: Array<[string, string]> = []

function bloom(x: number, y: number, s: number): string {
  let back = ''
  for (let i = 0; i < 7; i++) {
    const a = -78 + (156 * i) / 6
    back += piece('petalL', 'petalDark', 2, undefined, `rotate(${r1(a)})`)
  }
  let mid = ''
  for (let i = 0; i < 5; i++) {
    const a = -52 + (104 * i) / 4
    mid += piece('petalM', 'petal', 2, undefined, `rotate(${r1(a)})`)
  }
  let front = ''
  for (let i = 0; i < 3; i++) {
    const a = -24 + 24 * i
    front += piece('petalS', 'petalPale', 1.6, undefined, `rotate(${a})`)
  }
  const side = piece('petalL', 'petalDark', 2, undefined, 'rotate(-104)') + piece('petalL', 'petalDark', 2, undefined, 'rotate(104)')
  return (
    `<g transform="translate(${x} ${y}) scale(${s} ${r1(s * 0.78 * 100) / 100})">` +
    `<g class="openBack">${side}${back}</g>` +
    `<g class="open">${mid}</g>` +
    `<use href="#heart" class="gold"/>` +
    `<g class="open" style="animation-delay:-5s">${front}</g>` +
    `</g>`
  )
}

function reeds(x: number, y: number, flip: 1 | -1, seed: number): string {
  let out = ''
  const items: Array<[string, number, string, number]> = [
    ['bladeA', -8, 'reed', 13],
    ['bladeB', 14, 'reedLight', 17],
    ['bladeC', -24, 'reed', 11],
  ]
  items.forEach(([id, turn, fill, secs], i) => {
    out += `<g class="sway" style="animation-duration:${secs}s;animation-delay:-${r1(hash(seed, i) * secs)}s">${piece(id, fill, 4, undefined, `rotate(${turn * flip})`)}</g>`
  })
  const tail = (dx: number, h: number, i: number) =>
    `<g class="sway" style="animation-duration:${19 + i * 4}s;animation-delay:-${r1(hash(seed, i + 9) * 19)}s">` +
    piece('stalk', 'reed', 3, undefined, `translate(${dx * flip} 0) scale(1 ${r1(h)})`) +
    piece('cattail', 'cattail', 3, undefined, `translate(${dx * flip} ${r1(-330 * h)})`) +
    `</g>`
  out += tail(18, 1, 1) + tail(-16, 0.82, 2)
  return `<g transform="translate(${x} ${y})">${out}</g>`
}

// ---------- the sheet ----------

function fleckPattern(): string {
  let d = ''
  for (let i = 0; i < 30; i++) {
    const x = Math.round(hash(i, 1) * 168)
    const y = Math.round(hash(i, 2) * 206)
    const a = hash(i, 3) * Math.PI
    const reach = 2 + hash(i, 4) * 3
    d += `M${x} ${y}l${r1(Math.cos(a) * reach)} ${r1(Math.sin(a) * reach)}l1 1z`
  }
  return `<pattern id="flecks" width="173" height="211" patternUnits="userSpaceOnUse"><path class="fleck" opacity="0.08" d="${d}"/></pattern>`
}

function stars(): string {
  let out = ''
  for (let i = 0; i < 34; i++) {
    const x = Math.round(hash(i, 61) * W)
    const y = Math.round(hash(i, 62) * 380 * (0.35 + hash(i, 63) * 0.65))
    const s = r1(0.5 + hash(i, 64) * 0.9)
    out += `<g transform="translate(${x} ${y}) scale(${s})"><g class="twinkle" style="animation-duration:${r1(3 + hash(i, 65) * 5)}s;animation-delay:-${r1(hash(i, 66) * 6)}s"><use href="#star" class="star"/></g></g>`
  }
  return out
}

function moon(): string {
  return (
    `<g transform="translate(1415 150)">` +
    `<g class="halo"><use href="#haloOuter" class="moonHalo"/></g>` +
    `<g class="halo" style="animation-delay:-4s"><use href="#haloInner" class="moonHalo"/></g>` +
    piece('moonDisc', 'moon', 5) + `<use href="#moonMare" class="moonDim"/>` +
    `</g>`
  )
}

function forest(): string {
  let far = ''
  for (let x = -30, i = 0; x < W + 40; i++) {
    const h = 120 + hash(i, 71) * 90
    far += piece(h > 165 ? 'pineB' : 'pineC', 'pineFar', 2, undefined, `translate(${Math.round(x)} 590) scale(${r1(h / 200)})`, false)
    x += 26 + hash(i, 72) * 30
  }
  let mid = ''
  const midXs = [20, 70, 125, 175, 240, 300, 360, 410, 1190, 1245, 1300, 1350, 1410, 1470, 1525, 1580]
  midXs.forEach((x, i) => {
    const h = 230 + hash(i, 73) * 120
    mid += piece('pineB', 'pineMid', 3, undefined, `translate(${x} 600) scale(${r1(h / 300)})`)
  })
  let near = ''
  const nearXs: Array<[number, number]> = [[-10, 520], [80, 430], [170, 470], [1360, 420], [1470, 500], [1570, 560]]
  nearXs.forEach(([x, h], i) => {
    near +=
      `<g class="sway" style="transform-origin:${x}px 615px;animation-duration:${r1(30 + hash(i, 74) * 20)}s;animation-delay:-${r1(hash(i, 75) * 20)}s">` +
      piece('pineA', 'pineNear', 5, undefined, `translate(${x} 615) scale(${r1(h / 420)})`) +
      `</g>`
  })
  return `<g>${piece('ridge', 'pineFar', 2)}</g><g>${far}</g><g>${mid}</g><g>${near}</g>`
}

function water(): string {
  const bands: Array<[string, string, number]> = [
    ['band0', 'water0', 3],
    ['band1', 'water1', 3],
    ['band2', 'water2', 4],
    ['band3', 'water3', 4],
    ['band4', 'water4', 5],
  ]
  return bands
    .map(([id, fill, lift], i) => `<g class="drift" style="animation-duration:${26 + i * 7}s;animation-delay:-${i * 5}s">${piece(id, fill, lift)}</g>`)
    .join('')
}

function ripples(): string {
  let out = ''
  for (let i = 0; i < 30; i++) {
    const side = hash(i, 81)
    // Mostly at the sides, a few faint ones in the open middle.
    const x = side < 0.4 ? hash(i, 82) * 420 : side < 0.8 ? 1180 + hash(i, 82) * 420 : 450 + hash(i, 82) * 700
    const y = 620 + hash(i, 83) * 360
    const depth = (y - 600) / 400
    const rx = r1(14 + depth * 40)
    const dim = side >= 0.8 ? ' style="opacity:.45"' : ''
    const dur = r1(2.4 + hash(i, 84) * 1.6)
    const del = r1(hash(i, 85) * 5)
    out +=
      `<g transform="translate(${Math.round(x)} ${Math.round(y)})"${dim}>` +
      `<g class="ripple" style="animation-duration:${dur}s;animation-delay:-${del}s">` +
      `<ellipse rx="${rx}" ry="${r1(rx * 0.3)}" transform="translate(1.5 2)" class="ringShadow"/>` +
      `<ellipse rx="${rx}" ry="${r1(rx * 0.3)}" class="ring"/></g>` +
      `<g class="ripple" style="animation-duration:${dur}s;animation-delay:-${r1(del - 0.4)}s">` +
      `<ellipse rx="${r1(rx * 0.6)}" ry="${r1(rx * 0.18)}" class="ring"/></g>` +
      `</g>`
  }
  return out
}

function rain(): string {
  let out = ''
  for (let i = 0; i < 70; i++) {
    const x = Math.round(-100 + hash(i, 91) * (W + 300))
    const len = r1(12 + hash(i, 92) * 14)
    out += `<line class="drop" x1="${x}" y1="-30" x2="${r1(x - len * 0.22)}" y2="${r1(-30 + len)}" style="animation-duration:${r1(0.8 + hash(i, 93) * 0.6)}s;animation-delay:-${r1(hash(i, 94) * 1.4)}s"/>`
  }
  return `<g class="shower"><g class="rain">${out}</g></g>`
}

function fireflies(): string {
  let out = ''
  for (let i = 0; i < 12; i++) {
    const left = i % 2 === 0
    const x = Math.round(left ? 20 + hash(i, 101) * 400 : 1200 + hash(i, 101) * 380)
    const y = Math.round(380 + hash(i, 102) * 260)
    out += `<g transform="translate(${x} ${y})"><circle class="fly" r="${r1(1.6 + hash(i, 103) * 1.4)}" style="animation-duration:${r1(6 + hash(i, 104) * 6)}s;animation-delay:-${r1(hash(i, 105) * 10)}s"/></g>`
  }
  return `<g filter="url(#glow)">${out}</g>`
}

function fallingStars(): string {
  const falls: Array<[number, number, number, number, number]> = [
    // start x, start y, land x, land y, delay
    [1150, 40, 1290, 690, 4],
    [180, 20, 330, 760, 16],
    [1560, 90, 1460, 640, 28],
  ]
  let out = ''
  falls.forEach(([sx, sy, ex, ey, delay], i) => {
    const dx = sx - ex
    const dy = sy - ey
    const len = Math.hypot(dx, dy)
    const ux = dx / len
    const uy = dy / len
    const px = -uy
    const py = ux
    const tail = polyFine([
      [px * 2.6, py * 2.6],
      [ux * 170 + px * 0.4, uy * 170 + py * 0.4],
      [ux * 170 - px * 0.4, uy * 170 - py * 0.4],
      [-px * 2.6, -py * 2.6],
    ])
    defsExtra.push([`tail${i}`, tail])
    const depth = (ey - 600) / 400
    const rx = r1(34 + depth * 56)
    const vars = (a: string) => `style="--sx:${r1(dx)}px;--sy:${r1(dy)}px;animation-delay:${a}s"`
    let drops = ''
    for (let k = 0; k < 6; k++) {
      const ddx = r1((k - 2.5) * 9 * jit(i, k, 0.3))
      const ddy = r1(-(18 + hash(i, k + 7) * 22))
      drops += `<g class="droplet" style="--dx:${ddx}px;--dy:${ddy}px;animation-delay:${delay}s"><use href="#drop" class="star"/></g>`
    }
    out +=
      `<g transform="translate(${ex} ${ey})">` +
      `<g class="fall" ${vars(String(delay))}><use href="#tail${i}" class="star" opacity="0.75"/><g filter="url(#glow)"><use href="#star" transform="scale(1.4)" class="star"/></g></g>` +
      `<g class="splash" style="animation-delay:${delay}s"><ellipse rx="${rx}" ry="${r1(rx * 0.3)}" class="ringBright"/></g>` +
      `<g class="splash" style="animation-delay:${r1(delay + 0.45)}s"><ellipse rx="${r1(rx * 0.65)}" ry="${r1(rx * 0.2)}" class="ringBright"/></g>` +
      `<g class="flash" style="animation-delay:${delay}s"><circle r="16" class="gold" filter="url(#glow)" opacity="0.8"/></g>` +
      drops +
      `</g>`
  })
  return out
}

// ---------- the whole scene ----------

function css(): string {
  const fills = Object.entries(PAINT).map(([k, v]) => `.${k}{fill:${v}}`).join('')
  return (
    fills +
    '.far{opacity:.22}.near{opacity:.38}.edge{opacity:.12}' +
    '.ring{fill:none;stroke:#9fe3d8;stroke-width:1.6}' +
    '.ringShadow{fill:none;stroke:#000;stroke-width:1.6;opacity:.35}' +
    '.ringBright{fill:none;stroke:#fff3c2;stroke-width:2}' +
    '.drop{stroke:#cfe9e4;stroke-width:1.1;stroke-linecap:round;opacity:.28}' +
    '.fly{fill:#ffef9e}' +
    '.twinkle{animation:twinkle 5s ease-in-out infinite}' +
    '@keyframes twinkle{0%,100%{opacity:.3}50%{opacity:1}}' +
    '.halo{animation:halo 9s ease-in-out infinite alternate}' +
    '@keyframes halo{from{opacity:.03}to{opacity:.07}}' +
    '.sway{animation:sway 20s ease-in-out infinite alternate}' +
    '@keyframes sway{from{transform:rotate(-2.2deg)}to{transform:rotate(2.6deg)}}' +
    '.drift{animation:drift 30s ease-in-out infinite alternate}' +
    '@keyframes drift{from{transform:translate(-14px,0)}to{transform:translate(14px,3px)}}' +
    '.bob{animation:bob 9s ease-in-out infinite alternate}' +
    '@keyframes bob{from{transform:translate(0,-1.5px) rotate(-.6deg)}to{transform:translate(0,2px) rotate(.7deg)}}' +
    '.ripple{animation:ripple 3s ease-out infinite;opacity:0}' +
    '@keyframes ripple{0%{transform:scale(.08);opacity:0}12%{opacity:.75}100%{transform:scale(1);opacity:0}}' +
    '.drop{animation:fallRain 1s linear infinite}' +
    '@keyframes fallRain{from{transform:translate(0,0)}to{transform:translate(-240px,1060px)}}' +
    '.shower{animation:shower 48s ease-in-out infinite}' +
    '@keyframes shower{0%,100%{opacity:.25}35%{opacity:1}60%{opacity:.9}80%{opacity:.15}}' +
    '.fly{animation:fly 8s ease-in-out infinite}' +
    '@keyframes fly{0%,100%{opacity:0;transform:translate(0,0)}30%{opacity:.95}55%{transform:translate(16px,-12px)}75%{opacity:.85}90%{opacity:0;transform:translate(-8px,-22px)}}' +
    '.breathe{animation:breathe 4.2s ease-in-out infinite;transform-origin:0 0}' +
    '@keyframes breathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.008,1.018)}}' +
    '.lid{transform:scaleY(0);animation:blink 6s infinite;transform-origin:0 0}' +
    '@keyframes blink{0%,93%,100%{transform:scaleY(0)}95.5%{transform:scaleY(1)}}' +
    '.puff{animation:puff 5s ease-in-out infinite;transform-origin:0 0}' +
    '@keyframes puff{0%,50%,100%{transform:scale(.3)}62%{transform:scale(1.1)}70%{transform:scale(.45)}80%{transform:scale(1.05)}90%{transform:scale(.3)}}' +
    '.hop{animation:hop 22s ease-in-out infinite;transform-origin:0 0}' +
    '@keyframes hop{0%,90%,100%{transform:translate(0,0) scale(1,1)}91.5%{transform:translate(0,0) scale(1.06,.92)}94%{transform:translate(0,-60px) scale(.96,1.05)}96.5%{transform:translate(0,0) scale(1.06,.92)}98%{transform:translate(0,0) scale(1,1)}}' +
    '.open{animation:open 16s ease-in-out infinite alternate}' +
    '@keyframes open{from{transform:scale(.94) rotate(-2deg)}to{transform:scale(1.04) rotate(2deg)}}' +
    '.openBack{animation:openBack 16s ease-in-out infinite alternate}' +
    '@keyframes openBack{from{transform:scale(.97)}to{transform:scale(1.03)}}' +
    '.fall{animation:fall 36s linear infinite;opacity:0}' +
    '@keyframes fall{0%{transform:translate(var(--sx),var(--sy));opacity:0}.4%{opacity:1}4%{transform:translate(0,0);opacity:1}4.3%{opacity:0}100%{transform:translate(0,0);opacity:0}}' +
    '.splash{animation:splash 36s ease-out infinite;opacity:0}' +
    '@keyframes splash{0%,4%{transform:scale(.05);opacity:0}4.4%{opacity:1}15%{transform:scale(1);opacity:0}100%{opacity:0}}' +
    '.flash{animation:flash 36s ease-out infinite;opacity:0}' +
    '@keyframes flash{0%,4%{transform:scale(.3);opacity:0}4.5%{transform:scale(1);opacity:1}9%{transform:scale(1.7);opacity:0}100%{opacity:0}}' +
    '.droplet{animation:droplet 36s ease-out infinite;opacity:0}' +
    '@keyframes droplet{0%,4%{transform:translate(0,0);opacity:0}4.3%{opacity:1}6.2%{transform:translate(var(--dx),var(--dy))}8.4%{transform:translate(calc(var(--dx)*1.7),2px);opacity:0}100%{opacity:0}}' +
    '@media (prefers-reduced-motion: reduce){*{animation:none!important}.fall,.splash,.flash,.droplet,.ripple{opacity:0}}'
  )
}

export function lakeScene(): string {
  defsExtra.length = 0

  // Right side: the hero pad with a frog facing the words, a bloom beside it.
  const hero =
    pad(1385, 880, 150, 1, 4.4, frog(-10, 6, 1.0, -1, { hop: true, puff: true, delay: 0 })) +
    pad(1515, 930, 70, 2, 2.2, bloom(0, -4, 0.85))
  const rightPads = pad(1260, 705, 62, 3, 1.1, frog(0, 4, 0.48, -1, { delay: 3.5 })) + pad(1520, 730, 54, 4, 3.6) + pad(1210, 830, 40, 5, 5.2)
  // Left side, under the sidebar's glass: pads, a frog, reeds.
  const left =
    pad(200, 885, 135, 6, 5.6, frog(10, 6, 0.9, 1, { puff: true, delay: 7 })) +
    pad(70, 735, 58, 7, 0.4) +
    pad(380, 760, 46, 8, 2.9) +
    pad(355, 965, 60, 9, 1.8)
  // A few small pads far out in the open water.
  const far = pad(640, 655, 22, 10, 3.3) + pad(905, 640, 18, 11, 0.9) + pad(1030, 700, 26, 12, 4.8)

  const defsBase: Array<[string, string]> = [
    ['ridge', ridge()],
    ['pineA', pine(420, 170, 7, 1)],
    ['pineB', pine(300, 130, 6, 2)],
    ['pineC', pine(200, 96, 5, 3)],
    ['band0', waterBand(600, 6, 1)],
    ['band1', waterBand(648, 8, 2)],
    ['band2', waterBand(716, 10, 3)],
    ['band3', waterBand(802, 12, 4)],
    ['band4', waterBand(900, 14, 5)],
    ['moonDisc', disc(46, 30, 41)],
    ['moonMare', disc(13, 14, 42, 0.8, -12, -10) + disc(9, 12, 43, 0.9, 14, 8) + disc(6, 10, 44, 1, -6, 18)],
    ['haloInner', disc(78, 34, 45)],
    ['haloOuter', disc(124, 40, 46)],
    ['star', star4(5)],
    ['drop', disc(2.4, 8, 47)],
    ['petalL', petal(58, 22, 51)],
    ['petalM', petal(48, 20, 52)],
    ['petalS', petal(38, 18, 53)],
    ['heart', disc(13, 14, 54, 0.7, 0, -14)],
    ['bladeA', blade(300, 16, 0.18)],
    ['bladeB', blade(240, 14, -0.22)],
    ['bladeC', blade(200, 12, 0.3)],
    ['stalk', sliver([[0, 0], [2, -110], [3, -220], [3, -330]], 5, false)],
    ['cattail', cutClosed([[0, 8], [-8, -6], [-8, -46], [0, -60], [8, -46], [8, -6]], 2, 55, 0.4)],
    ...frogShapes(),
  ]

  const body =
    `<rect width="${W}" height="${H}" class="ground"/><rect width="${W}" height="${H}" fill="url(#flecks)"/>` +
    stars() +
    moon() +
    forest() +
    water() +
    `<g opacity=".8">${ripples()}</g>` +
    fireflies() +
    far +
    fallingStars() +
    rightPads +
    left +
    hero +
    reeds(1580, 1010, -1, 1) +
    reeds(30, 1015, 1, 2) +
    rain()

  const defs = defsBase.concat(defsExtra).map(([id, d]) => `<path id="${id}" d="${d}" fill-rule="evenodd"/>`).join('')
  const glow =
    '<filter id="glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">` +
    `<style>${css()}</style><defs>${defs}${fleckPattern()}${glow}</defs>` +
    body +
    `</svg>`
  )
}
