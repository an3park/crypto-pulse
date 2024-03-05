import './style.css'
import './stats'
import * as dat from 'dat.gui'
import { eventBus } from './eventBus'
import './binance'
import './bybit'
// import './okx'

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
  b: boolean // is buy
  q: number // quantity
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
  volumeLimit: 10,
}

const settings: typeof initialSettings =
  JSON.parse(localStorage.getItem('gui_meta') || 'null') || initialSettings

settings.volumeLimit ??= 10

window.onbeforeunload = () => {
  localStorage.setItem('gui_meta', JSON.stringify(settings))
}

const DATA: DT[][] = [[], [], []]

const SCALE_Y = 4

const pp = (p: number) => -(p - DATA[1][0]?.p || 0) * SCALE_Y + SCREEN_WIDTH / 2
const pt = (t: number) => (t - startTime) / 100

let offsetX = 0
let offsetY = 0

const cx = (x: number) => x + offsetX
const cy = (y: number) => y + offsetY

let dragging = false
canvas.addEventListener('mousedown', () => (dragging = true))
window.addEventListener('mouseleave', () => (dragging = false))
window.addEventListener('mouseup', () => (dragging = false))
window.addEventListener('mousemove', (e) => {
  if (!dragging) return
  offsetX += e.movementX
  if (!settings.autoMode) {
    offsetY += e.movementY
  }
})

const gui = new dat.GUI()

gui.add(settings, 'autoMode').onChange((v) => (settings.autoMode = v))
gui.add(settings, 'volumeLimit', 0, 30).onChange((v) => (settings.volumeLimit = v))

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
  const mainIndex = 1
  if (!DATA[mainIndex].length) {
    return requestAnimationFrame(render)
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  let buyes = 0
  let sells = 0
  for (let i = 0; i < DATA[mainIndex].length; i++) {
    if (DATA[mainIndex][i].q > settings.volumeLimit) {
      if (DATA[mainIndex][i].b) {
        buyes += DATA[mainIndex][i].q
      } else {
        sells += DATA[mainIndex][i].q
      }
    }
  }

  ctx.fillStyle = 'white'
  ctx.font = '20px Arial'
  ctx.fillText(`b ${~~buyes} s ${~~sells}`, 100, 100)

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

eventBus.on('trade', (trade) => {
  if (trade.exchange === 'binance') {
    DATA[0].push({
      p: trade.price,
      t: trade.timestamp,
      b: trade.isBuy,
      q: trade.quantity,
    })
  } else if (trade.exchange === 'bybit') {
    DATA[1].push({
      p: trade.price,
      t: trade.timestamp,
      b: trade.isBuy,
      q: trade.quantity,
    })
  } else if (trade.exchange === 'okx') {
    DATA[2].push({
      p: trade.price,
      t: trade.timestamp,
      b: trade.isBuy,
      q: trade.quantity,
    })
  }
})
