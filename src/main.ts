import './style.css'
import './stats'
import { onBinanceMessage } from './binance'
import { onBybitMessage } from './bybit'
import { onOkxMessage } from './okx'
import * as dat from 'dat.gui'

const canvas = document.querySelector<HTMLCanvasElement>('#canvas1')!

let SCREEN_HEIGHT = window.innerHeight
let SCREEN_WIDTH = window.innerWidth

const setCanvasHeight = () => {
  SCREEN_HEIGHT = window.innerHeight
  SCREEN_WIDTH = window.innerWidth
  canvas.width = SCREEN_WIDTH
  canvas.height = SCREEN_HEIGHT
}

setCanvasHeight()

window.addEventListener('resize', setCanvasHeight)

const ctx = canvas.getContext('2d')!

let startTime = Date.now()

type DT = {
  p: number // price
  t: number // timestamp in ms
}

const meta = [
  { name: 'binance', color: '#ffe435' },
  { name: 'bybit', color: '#f76040' },
  { name: 'okx', color: '#4d1aac' },
]

const initialSettings = {
  autoMode: false,
  priceCorrection: {} as Record<string, number>,
  colors: {} as Record<string, string>,
}

const settings: typeof initialSettings =
  JSON.parse(localStorage.getItem('gui_meta') || 'null') || initialSettings

window.onbeforeunload = () => {
  localStorage.setItem('gui_meta', JSON.stringify(settings))
}

const DATA: DT[][] = [[], [], []]

const pp = (p: number) => -(p - DATA[0][0]?.p || 0) * MUTTIPLY_Y + SCREEN_WIDTH / 2
const pt = (t: number) => (t - startTime) / 300

let offsetX = 0
let offsetY = 0

const cx = (x: number) => x + offsetX
const cy = (y: number) => y + offsetY

let autoMode = false

let dragging = false
canvas.addEventListener('mousedown', () => (dragging = true))
window.addEventListener('mouseleave', () => (dragging = false))
window.addEventListener('mouseup', () => (dragging = false))
window.addEventListener('mousemove', (e) => {
  if (!dragging) return
  offsetX += e.movementX
  if (!autoMode) {
    offsetY += e.movementY
  }
})

const gui = new dat.GUI()

gui.add(settings, 'autoMode').onChange((v) => (autoMode = v))

const priceCorrGUI = gui.addFolder('price correction')
const colorsGUI = gui.addFolder('colors')

meta.forEach((m, i) => {
  settings.priceCorrection[m.name] = settings.priceCorrection[m.name] || 0
  settings.colors[m.name] = settings.colors[m.name] || meta[i].color

  priceCorrGUI
    .add(settings.priceCorrection, m.name, -300, 300)
    .onChange((v) => (settings.priceCorrection[m.name] = v))
    .name(m.name)

  colorsGUI
    .addColor(settings.colors, m.name)
    .name(m.name)
    .onChange((v) => (settings.colors[m.name] = v))
})

requestAnimationFrame(function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  for (let i = 0; i < DATA.length; i++) {
    const exchange = DATA[i]
    ctx.strokeStyle = settings.colors[meta[i].name] || '#fff'
    const priceCorr = settings.priceCorrection[meta[i].name] || 0
    if (exchange.length > 1) {
      let first = true
      for (let index = 0; index < exchange.length; index++) {
        const x = cx(pt(exchange[index].t))
        if (x < 0) continue
        const y = cy(pp(exchange[index].p) + priceCorr)
        if (first) {
          ctx.beginPath()
          ctx.moveTo(x, y)
          first = false
        }
        ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
  }

  requestAnimationFrame(render)
})

const MUTTIPLY_Y = 4

onBinanceMessage((message) => {
  DATA[0].push({
    p: parseFloat(message.p),
    t: message.T,
  })
})

onBybitMessage((message) => {
  DATA[1].push(
    ...message.data?.map((x) => ({
      p: parseFloat(x.p),
      t: x.T,
    }))
  )
})

onOkxMessage((message) => {
  DATA[2].push(
    ...message.data.map((x) => ({
      p: parseFloat(x.px),
      t: +x.ts,
    }))
  )
})
