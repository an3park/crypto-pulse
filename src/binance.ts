const socketUrl = 'wss://fstream.binance.com/ws/btcusdt@aggTrade'

type Message = {
  e: 'aggTrade' // event type
  E: number // event time
  a: number // aggregate trade ID
  s: string // symbol
  p: string // price
  q: string // quantity
  f: number // first trade ID
  l: number // last trade ID
  T: number // trade time
  m: boolean // is the buyer the market maker
}

const socket = new WebSocket(socketUrl)

const onBinanceMessage = (handler: (message: Message) => void) => {
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data) as Message
    if (message.e === 'aggTrade') {
      handler(message)
    }
  }
}

export { onBinanceMessage }
