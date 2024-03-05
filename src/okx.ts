import { eventBus } from './eventBus'

const socketUrl = 'wss://wsaws.okx.com:8443/ws/v5/public'

/*
data	Array	Subscribed data
> instId	String	Instrument ID, e.g. BTC-USDT
> tradeId	String	The last trade ID in the trades aggregation
> px	String	Trade price
> sz	String	Trade size
> side	String	Trade direction buy sell
> ts	String	Filled time, Unix timestamp format in milliseconds, e.g. 1597026383085
> count	String	The count of trades aggregated
*/

type Message = {
  data: Array<{
    instId: string
    tradeId: string
    px: string
    sz: string
    side: 'buy' | 'sell'
    ts: string
    count: string
  }>
  arg: {
    channel: 'trades'
    instId: string
  }
}

const sub = {
  op: 'subscribe',
  args: [
    {
      channel: 'trades',
      instId: 'BTC-USDT',
    },
  ],
}

function connect() {
  const socket = new WebSocket(socketUrl)

  socket.onopen = () => {
    socket.send(JSON.stringify(sub))
  }

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data) as Message

    if (message.arg.channel === 'trades') {
      message.data.forEach((trade) => {
        eventBus.emit('trade', {
          exchange: 'okx',
          isBuy: trade.side === 'buy',
          price: parseFloat(trade.px),
          quantity: parseFloat(trade.sz),
          timestamp: +trade.ts,
        })
      })
    }
  }

  socket.onclose = () => {
    connect()
  }
}

connect()
