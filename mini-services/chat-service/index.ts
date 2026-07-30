/**
 * chat-service — Socket.io chat & bet-feed mini-service for the crypto casino.
 *
 * Runs on port 3003 (hardcoded). Socket.io path is `/` (MANDATORY — Caddy
 * gateway requirement). Browsers connect via `io("/?XTransformPort=3003")`.
 *
 * Single-file service, organized into clearly delimited sections:
 *   1. Types
 *   2. Constants & in-memory state
 *   3. Utilities
 *   4. Bot personas & message pools
 *   5. HTTP + Socket.io server bootstrap
 *   6. /api/notify + /health handlers (server-to-server push)
 *   7. Socket connection handler (chat:join / message / typing / leave)
 *   8. Bot activity engine (messages, mega wins, rain)
 *   9. Graceful shutdown
 */

import { createServer, IncomingMessage, ServerResponse } from 'http'
import { Server, Socket } from 'socket.io'
import { randomUUID } from 'crypto'

// ============================================================================
// 1. TYPES (exported for the main Next.js app to consume via tsc path alias
//          or copy/paste — kept here in one place for simplicity)
// ============================================================================

export type Channel = 'chat:en' | 'chat:vip'
export type Role = 'user' | 'mod' | 'admin'

export interface ChatMessage {
  id: string
  username: string
  avatar: string
  role: Role
  text: string
  channel: Channel
  timestamp: string // ISO 8601
}

export interface BetFeedItem {
  id: string
  username: string
  avatar: string
  game: string
  bet: number
  multiplier: number
  payout: number
  asset: string
  timestamp: string // ISO 8601
}

export interface RainEvent {
  rainId: string
  amount: number
  asset: string
  participants: number
  expiresAt: string // ISO 8601
}

interface User {
  socketId: string
  username: string
  avatar: string
  isVip: boolean
  role: Role
}

// ============================================================================
// 2. CONSTANTS & IN-MEMORY STATE
// ============================================================================

const PORT = 3003
const MAX_HISTORY = 100

const CHANNELS = {
  MAIN: 'chat:en', // public, primary chat
  VIP: 'chat:vip', // VIP-only
  BETS: 'bets:feed', // live bet feed / big wins
} as const

const startedAt = Date.now()

/** socketId -> User */
const users = new Map<string, User>()

/** channel -> ring buffer (max MAX_HISTORY) */
const history = new Map<string, ChatMessage[]>([
  [CHANNELS.MAIN, []],
  [CHANNELS.VIP, []],
])

/** rolling bet feed (max MAX_HISTORY) — not strictly required, but useful
 *  if we later want a /api/bets/history endpoint. Kept for completeness. */
const betsFeed: BetFeedItem[] = []

// ============================================================================
// 3. UTILITIES
// ============================================================================

const genId = (): string => randomUUID()
const nowIso = (): string => new Date().toISOString()

/** Strip any HTML tags + collapse whitespace. Used to sanitize user input. */
function sanitizeText(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, '') // strip HTML tags
    .replace(/\s+/g, ' ') // collapse whitespace
    .trim()
}

function pushHistory(channel: string, msg: ChatMessage): void {
  const buf = history.get(channel) ?? []
  buf.push(msg)
  if (buf.length > MAX_HISTORY) buf.shift()
  history.set(channel, buf)
}

function getHistory(channel: string): ChatMessage[] {
  return history.get(channel) ?? []
}

/** Count sockets currently joined to the main chat room. */
function onlineCount(): number {
  const room = io.sockets.adapter.rooms.get(CHANNELS.MAIN)
  return room ? room.size : 0
}

function buildSystemMessage(text: string, channel: Channel = CHANNELS.MAIN): ChatMessage {
  return {
    id: genId(),
    username: 'System',
    avatar: '',
    role: 'admin',
    text,
    channel,
    timestamp: nowIso(),
  }
}

// ============================================================================
// 4. BOT PERSONAS & MESSAGE POOLS
// ============================================================================

const BOT_USERNAMES = [
  'SatoshiNak', 'WhaleHunter', 'DiamondHands', 'LuckyChip',
  'MoonBoy', 'HODLking', 'GreenCandle', 'RugpullRon',
  'BetMaster99', 'CrashQueen', 'PlinkoPro', 'DiceRoller',
  'BTCbaron', 'ETHmaxi', 'LimboLegend', 'MineSweeperX',
  'TowerClimber', 'WheelSpinner', 'JackpotJoe', 'FOMOfever',
  'RektResistance', 'BullRunBetty', 'ShortSqueeze', 'GasFeeGoblin',
]

const BOT_PERSONAS: User[] = BOT_USERNAMES.map((username, i) => ({
  socketId: `bot-${i}`,
  username,
  avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`,
  // ~25% of bots are VIP, sprinkled across the list
  isVip: i % 4 === 0,
  role: 'user' as const,
}))

const BOT_MESSAGES: string[] = [
  'gg',
  "let's gooo",
  'wagmi',
  'ngmi',
  'this game is rigged lol',
  'just hit 100x on crash!',
  'anyone else down bad today?',
  'VIP rain when?',
  'tip me pls',
  'diamond hands baby',
  'sold the bottom again rip',
  'moon incoming',
  'house always wins smh',
  'nice win bro',
  'gl all',
  "who's buying the dip?",
  'BTC to 100k soon',
  'ETH gas too high rn',
  "i'm rekt",
  'all in on plinko',
  'crash game is my addiction',
  'first time playing, any tips?',
  'purple balls only 🟣',
  'just lost my whole stack fml',
  'rain when?',
  'deposit went through finally',
  "who's the whale in vip?",
  'this site fire 🔥',
  'provably fair is the way',
  'how does provably fair work?',
  'max bet on dice go brrr',
  '1.01x strat safe or nah?',
  'high roller vibes only',
  'just withdrew my winnings 🤑',
  'verification was instant',
  'the casino always wins',
  'rolling for the lambo',
  'back to 0 again',
  "what's the next big coin?",
  'staking > trading',
  'diamond hands till the end',
  'gm fellow gamblers',
]

const GAMES = ['Crash', 'Dice', 'Plinko', 'Mines', 'Limbo', 'Wheel', 'Keno', 'Tower']
const ASSETS = ['USDT', 'BTC', 'ETH', 'BNB', 'SOL']

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

// ============================================================================
// 5. HTTP + SOCKET.IO SERVER BOOTSTRAP
// ============================================================================

/**
 * Single Node `http.Server`. Socket.io attaches to it for upgrade handling,
 * while regular HTTP requests (GET /health, POST /api/notify) are handled by
 * `httpRouter` below. NO express — pure `http` module.
 *
 * IMPORTANT: because Socket.io is configured with `path: '/'` (MANDATORY for
 * the Caddy gateway), engine.io's own request listener would intercept EVERY
 * HTTP request and respond with `{"code":0,"message":"Transport unknown"}`
 * for our /health and /api/notify routes. To work around this, we let
 * socket.io attach its listener, then re-arrange the listeners so our router
 * runs FIRST. Our router handles /health and /api/notify explicitly and
 * delegates all other requests to engine.io's saved listener.
 */
const httpServer = createServer()

const io = new Server(httpServer, {
  // MANDATORY: Caddy requires path '/'. Do NOT change.
  path: '/',
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60_000,
  pingInterval: 25_000,
})

// Grab engine.io's request listener (the one socket.io just registered) and
// remove it; we'll re-add our own router that delegates to it for non-HTTP
// routes (i.e. socket.io polling / websocket handshake paths).
const engineListener = httpServer.listeners('request')[0]
httpServer.removeAllListeners('request')

/**
 * HTTP router. Handles /health + /api/notify and delegates everything else
 * to engine.io (socket.io's polling transport). Also handles CORS preflight.
 */
function httpRouter(req: IncomingMessage, res: ServerResponse): void {
  // CORS — service is called both by browsers (socket.io) and by the Next.js
  // server (s2s HTTP). Allow everything for simplicity.
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const url = (req.url || '/').split('?')[0]
  const method = req.method || 'GET'

  // ---- GET /health --------------------------------------------------------
  if (method === 'GET' && url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(
      JSON.stringify({
        ok: true,
        online: onlineCount(),
        uptime: Math.floor((Date.now() - startedAt) / 1000),
      }),
    )
    return
  }

  // ---- POST /api/notify ---------------------------------------------------
  if (method === 'POST' && url === '/api/notify') {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk.toString()
      // hard cap to avoid runaway memory
      if (body.length > 1_000_000) req.destroy()
    })
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}')
        const { event, payload } = parsed as { event: string; payload: any }
        handleNotify(event, payload)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true }))
      } catch (err: any) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: false, error: err?.message || 'invalid json' }))
      }
    })
    req.on('error', () => {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: false, error: 'request error' }))
    })
    return
  }

  // ---- delegate to engine.io (socket.io polling / handshake) -------------
  // For path '/', engine.io handles the actual socket.io traffic. We must
  // NOT 404 here — that would break browser socket.io connections.
  engineListener.call(httpServer, req, res)
}

httpServer.on('request', httpRouter)

// ============================================================================
// 6. /api/notify HANDLER (server-to-server push from Next.js app)
// ============================================================================

/**
 * Push real platform events into the chat. Called by the main Next.js app
 * (server-side) via POST http://localhost:3003/api/notify — NOT through
 * the Caddy gateway.
 */
function handleNotify(event: string, payload: any): void {
  switch (event) {
    case 'tip': {
      // { from, to, amount, asset, message }
      io.to(CHANNELS.MAIN).emit('tip:notification', payload)
      break
    }
    case 'win': {
      // { username, game, bet, multiplier, payout, asset }
      const item: BetFeedItem = {
        id: genId(),
        username: payload.username,
        avatar: payload.avatar ?? '',
        game: payload.game,
        bet: payload.bet,
        multiplier: payload.multiplier,
        payout: payload.payout,
        asset: payload.asset,
        timestamp: nowIso(),
      }
      betsFeed.push(item)
      if (betsFeed.length > MAX_HISTORY) betsFeed.shift()
      io.to(CHANNELS.BETS).emit('bets:new', item)
      break
    }
    case 'mega': {
      // broadcast to bets:feed AND a chat:en system message
      const item: BetFeedItem = {
        id: genId(),
        username: payload.username,
        avatar: payload.avatar ?? '',
        game: payload.game,
        bet: payload.bet,
        multiplier: payload.multiplier,
        payout: payload.payout,
        asset: payload.asset,
        timestamp: nowIso(),
      }
      betsFeed.push(item)
      if (betsFeed.length > MAX_HISTORY) betsFeed.shift()
      io.to(CHANNELS.BETS).emit('bets:new', item)

      const sys = buildSystemMessage(
        `🔥 ${payload.username} won ${payload.payout} ${payload.asset} on ${payload.game}!`,
      )
      pushHistory(CHANNELS.MAIN, sys)
      io.to(CHANNELS.MAIN).emit('chat:system', sys)
      break
    }
    case 'rain': {
      // { rainId, amount, asset, participants, expiresAt }
      io.to(CHANNELS.MAIN).emit('rain:start', payload)
      const sys = buildSystemMessage(
        `🌧️ Rain started! ${payload.amount} ${payload.asset} for ${payload.participants} users. Click to claim!`,
      )
      pushHistory(CHANNELS.MAIN, sys)
      io.to(CHANNELS.MAIN).emit('chat:system', sys)
      break
    }
    case 'system': {
      // { text }
      const sys = buildSystemMessage(payload.text)
      pushHistory(CHANNELS.MAIN, sys)
      io.to(CHANNELS.MAIN).emit('chat:system', sys)
      break
    }
    default:
      console.warn(`[notify] unknown event: ${event}`)
  }
}

// ============================================================================
// 7. SOCKET CONNECTION HANDLER
// ============================================================================

io.on('connection', (socket: Socket) => {
  console.log(`[socket] connected: ${socket.id}`)

  // Auto-join every socket to the live bet feed (visible to all, even guests)
  socket.join(CHANNELS.BETS)

  // -- chat:join ------------------------------------------------------------
  socket.on(
    'chat:join',
    (data: { username: string; avatar: string; isVip: boolean; role?: Role }) => {
      const { username, avatar, isVip = false, role = 'user' } = data || {}
      if (!username || typeof username !== 'string') return

      const user: User = {
        socketId: socket.id,
        username: username.slice(0, 32), // cap username length
        avatar: avatar || '',
        isVip: !!isVip,
        role,
      }
      users.set(socket.id, user)

      // Join rooms
      socket.join(CHANNELS.MAIN)
      if (user.isVip) socket.join(CHANNELS.VIP)

      // Reply with channel history (last 100 each)
      socket.emit('chat:history', {
        channel: CHANNELS.MAIN,
        messages: getHistory(CHANNELS.MAIN),
      })
      if (user.isVip) {
        socket.emit('chat:history', {
          channel: CHANNELS.VIP,
          messages: getHistory(CHANNELS.VIP),
        })
      }

      // Reply with current online count
      socket.emit('chat:online', { count: onlineCount() })

      // Broadcast join system message to everyone in main chat
      const sys = buildSystemMessage(`${username} joined`)
      pushHistory(CHANNELS.MAIN, sys)
      io.to(CHANNELS.MAIN).emit('chat:system', sys)

      console.log(`[join] ${username} (vip=${user.isVip}, role=${role}) — online=${onlineCount()}`)
    },
  )

  // -- chat:message ---------------------------------------------------------
  socket.on('chat:message', (data: { channel: Channel; text: string }) => {
    const user = users.get(socket.id)
    if (!user) return // must join first

    const channel = data?.channel
    if (channel !== CHANNELS.MAIN && channel !== CHANNELS.VIP) return
    // VIP-only enforcement
    if (channel === CHANNELS.VIP && !user.isVip) return

    const text = sanitizeText((data?.text ?? '').toString())
    if (text.length < 1 || text.length > 280) return

    const msg: ChatMessage = {
      id: genId(),
      username: user.username,
      avatar: user.avatar,
      role: user.role,
      text,
      channel,
      timestamp: nowIso(),
    }
    pushHistory(channel, msg)
    io.to(channel).emit('chat:message', msg)
  })

  // -- chat:typing ----------------------------------------------------------
  socket.on('chat:typing', (data: { channel: Channel }) => {
    const user = users.get(socket.id)
    if (!user) return
    const channel = data?.channel
    if (channel !== CHANNELS.MAIN && channel !== CHANNELS.VIP) return
    // broadcast to others in that channel (no debounce server-side)
    socket.to(channel).emit('chat:typing', { username: user.username, channel })
  })

  // -- chat:leave (explicit) ------------------------------------------------
  socket.on('chat:leave', () => {
    cleanupUser(socket)
  })

  // -- disconnect -----------------------------------------------------------
  socket.on('disconnect', (reason: string) => {
    cleanupUser(socket)
    console.log(`[socket] disconnected: ${socket.id} (${reason})`)
  })

  socket.on('error', (err: any) => {
    console.error(`[socket] error (${socket.id}):`, err)
  })
})

/** Remove a user from in-memory state, broadcast updated online count + leave system msg. */
function cleanupUser(socket: Socket): void {
  const user = users.get(socket.id)
  if (!user) return
  users.delete(socket.id)
  socket.leave(CHANNELS.MAIN)
  socket.leave(CHANNELS.VIP)

  // updated online count broadcast
  io.to(CHANNELS.MAIN).emit('chat:online', { count: onlineCount() })

  // system leave message
  const sys = buildSystemMessage(`${user.username} left`)
  pushHistory(CHANNELS.MAIN, sys)
  io.to(CHANNELS.MAIN).emit('chat:system', sys)
}

// ============================================================================
// 8. BOT ACTIVITY ENGINE
// ============================================================================

let botLogCounter = 0

/** Pick a random bot persona and post a chat message. ~15% goes to VIP. */
function postBotMessage(): void {
  const persona = randomItem(BOT_PERSONAS)
  const text = randomItem(BOT_MESSAGES)
  const channel: Channel = Math.random() < 0.15 ? CHANNELS.VIP : CHANNELS.MAIN

  // VIP-only enforcement: if persona isn't VIP, fall back to main channel
  const targetChannel: Channel = channel === CHANNELS.VIP && !persona.isVip ? CHANNELS.MAIN : channel

  const msg: ChatMessage = {
    id: genId(),
    username: persona.username,
    avatar: persona.avatar,
    role: persona.role,
    text,
    channel: targetChannel,
    timestamp: nowIso(),
  }
  pushHistory(targetChannel, msg)
  io.to(targetChannel).emit('chat:message', msg)

  // Throttle bot logging — log only ~1 in 5 to avoid spamming dev console.
  botLogCounter++
  if (botLogCounter % 5 === 0) {
    console.log(`[bot] ${persona.username} @ ${targetChannel}: ${text}`)
  }
}

function scheduleBotMessage(): void {
  const delay = randomInt(4_000, 9_000) // 4–9s
  setTimeout(() => {
    postBotMessage()
    scheduleBotMessage()
  }, delay)
}

/** Generate a fake "mega win" on the bet feed. If >= 100x, also broadcast a system msg. */
function postMegaWin(): void {
  const persona = randomItem(BOT_PERSONAS)
  const game = randomItem(GAMES)
  const multiplier = parseFloat(randomFloat(2, 5_000).toFixed(2))
  const bet = parseFloat(randomFloat(0.1, 100).toFixed(2))
  const payout = parseFloat((bet * multiplier).toFixed(2))
  const asset = randomItem(ASSETS)

  const item: BetFeedItem = {
    id: genId(),
    username: persona.username,
    avatar: persona.avatar,
    game,
    bet,
    multiplier,
    payout,
    asset,
    timestamp: nowIso(),
  }
  betsFeed.push(item)
  if (betsFeed.length > MAX_HISTORY) betsFeed.shift()
  io.to(CHANNELS.BETS).emit('bets:new', item)

  if (multiplier >= 100) {
    const sys = buildSystemMessage(
      `🔥 ${persona.username} won ${payout} ${asset} on ${game} (${multiplier}x)!`,
    )
    pushHistory(CHANNELS.MAIN, sys)
    io.to(CHANNELS.MAIN).emit('chat:system', sys)
    console.log(`[bot:mega] ${persona.username} won ${payout} ${asset} (${multiplier}x) on ${game}`)
  }
}

function scheduleMegaWin(): void {
  const delay = randomInt(25_000, 45_000) // 25–45s
  setTimeout(() => {
    postMegaWin()
    scheduleMegaWin()
  }, delay)
}

/** Emit a rain event to chat:en + a system message inviting users to claim. */
function startRain(): void {
  const amount = randomInt(50, 500)
  const asset = 'USDT'
  const participants = 10
  const rainId = genId()
  const expiresAt = new Date(Date.now() + 60_000).toISOString()

  const payload: RainEvent = { rainId, amount, asset, participants, expiresAt }
  io.to(CHANNELS.MAIN).emit('rain:start', payload)

  const sys = buildSystemMessage(
    `🌧️ Rain started! ${amount} ${asset} for ${participants} users. Click to claim!`,
  )
  pushHistory(CHANNELS.MAIN, sys)
  io.to(CHANNELS.MAIN).emit('chat:system', sys)

  console.log(`[bot:rain] rain ${rainId}: ${amount} ${asset} for ${participants} users`)
}

function scheduleRain(): void {
  const delay = randomInt(150_000, 210_000) // 180s ± 30s
  setTimeout(() => {
    startRain()
    scheduleRain()
  }, delay)
}

// ============================================================================
// 9. STARTUP & GRACEFUL SHUTDOWN
// ============================================================================

httpServer.listen(PORT, () => {
  console.log('==============================================')
  console.log(` chat-service listening on port ${PORT}`)
  console.log(` socket.io path: /`)
  console.log(` rooms: ${CHANNELS.MAIN}, ${CHANNELS.VIP}, ${CHANNELS.BETS}`)
  console.log(` health:  GET  http://localhost:${PORT}/health`)
  console.log(` notify:  POST http://localhost:${PORT}/api/notify`)
  console.log('==============================================')

  // Seed a few bot messages so chat looks alive immediately on first connect.
  for (let i = 0; i < 3; i++) postBotMessage()

  // Kick off background engines
  scheduleBotMessage()
  scheduleMegaWin()
  scheduleRain()
})

function shutdown(signal: string): void {
  console.log(`[chat-service] received ${signal}, shutting down...`)
  io.close(() => {
    httpServer.close(() => {
      console.log('[chat-service] closed')
      process.exit(0)
    })
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
