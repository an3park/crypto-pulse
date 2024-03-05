const socketUrl = 'wss://stream.bybit.com/v5/public/linear'
import { eventBus } from './eventBus'

/* 
topic	string	Topic name
type	string	Data type. snapshot
ts	number	The timestamp (ms) that the system generates the data
data	array	Object. The element in the array is sort by matching time in ascending order
> T	number	The timestamp (ms) that the order is filled
> s	string	Symbol name
> S	string	Side of taker. Buy,Sell
> v	string	Trade size
> p	string	Trade price
> L	string	Direction of price change. Unique field for future
> i	string	Trade ID
> BT	boolean	Whether it is a block trade order or not
*/

type Message = {
  topic: string
  type: string
  ts: number
  data: Array<{
    T: number
    s: string
    S: 'Buy' | 'Sell'
    v: string
    p: string
    L: string
    i: string
    BT: boolean
  }>
}

const sub = {
  req_id: 'test',
  op: 'subscribe',
  args: ['publicTrade.BTCUSDT'],
}

function connect() {
  const socket = new WebSocket(socketUrl)

  socket.onopen = () => {
    socket.send(JSON.stringify(sub))
  }

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data) as Message

    if (message.topic === 'publicTrade.BTCUSDT') {
      message.data.forEach((trade) => {
        eventBus.emit('trade', {
          exchange: 'bybit',
          isBuy: trade.S === 'Buy',
          price: parseFloat(trade.p),
          quantity: parseFloat(trade.v),
          timestamp: trade.T,
        })
      })
    }
  }

  socket.onclose = () => {
    connect()
  }
}

connect()
