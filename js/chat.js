/**
 * chat.js — Reusable realtime chat component for GameRoom
 *
 * Usage:
 *   const chat = new GameChat({
 *     roomId: 'AB3X9K',
 *     myName: 'MaxToBa',
 *     gameName: 'tictactoe' | 'gomoku' | 'battleship',
 *     container: '#chatContainer',   // CSS selector or HTMLElement
 *     onSend: null,                  // optional callback(text)
 *   })
 *   chat.mount()
 *   chat.addMessage({ sender: 'AI', text: 'ยิ้มๆ ไว้ก่อน!', type: 'ai' })
 *   chat.gameEvent('win', { winner: 'MaxToBa', loser: 'Bot' })
 *   chat.destroy()
 */

;(function (global) {
  'use strict'

  // AI commentary lines per event, per game
  const AI_LINES = {
    tictactoe: {
      win:   (d) => [`🏆 ${d.winner} ชนะแบบไม่มีข้อแม้!`, `🎉 ${d.winner} เก่งมาก!`, `GG ${d.winner}! ชนะสมศักดิ์ศรี`],
      draw:  ()  => ['🤝 เสมอกัน! ต่างฝ่ายต่างสู้จนหมดแรง', '🟰 เสมอ! สมน้ำสมเนื้อมาก'],
      move:  (d) => [`♟ ${d.player} วางหมาก`, `🤔 ${d.player} เลือกจุดนั้นเหรอ?`],
    },
    gomoku: {
      win:   (d) => [`🏆 ${d.winner} ต่อ 5 สำเร็จ!`, `💥 ${d.winner} จบเกมอย่างสวยงาม!`, `GG ${d.winner}!`],
      draw:  ()  => ['🤝 กระดานเต็มแล้ว — เสมอ!'],
      move:  (d) => [`🔵 ${d.player} วางหมาก`, `🧠 ${d.player} คิดดีมาก`],
    },
    battleship: {
      win:   (d) => [`🏆 ${d.winner} จมเรือทั้งหมด!`, `⚓ ${d.winner} ชนะสงครามทะเล!`, `GG ${d.winner}!`],
      hit:   (d) => [`🎯 ${d.player} ยิงโดน!`, `💥 โดนเต็มๆ!`],
      miss:  (d) => [`💨 ${d.player} ยิงพลาด`, `🌊 น้ำกระเซ็น!`],
      sunk:  (d) => [`🔥 ${d.player} จม ${d.ship}!`, `💀 ${d.ship} ลงทะเลแล้ว!`],
    },
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)]
  }

  function getAIComment(gameName, event, data) {
    const lines = AI_LINES[gameName]?.[event]
    if (!lines) return null
    return pick(typeof lines === 'function' ? lines(data) : lines)
  }

  // ---- CSS injected once ----
  const CSS = `
.gc-wrap {
  display: flex; flex-direction: column;
  background: #12121a; border: 1px solid rgba(255,255,255,0.07);
  border-radius: 16px; overflow: hidden; height: 280px;
  font-family: 'Noto Sans Thai', 'Syne', sans-serif;
}
.gc-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.07);
  font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 600;
  letter-spacing: 1px; text-transform: uppercase; color: #6b6880;
}
.gc-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #4fcf8e; animation: gcPulse 2s ease-in-out infinite; }
.gc-messages { flex: 1; overflow-y: auto; padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; }
.gc-messages::-webkit-scrollbar { width: 4px; }
.gc-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
.gc-msg { display: flex; align-items: flex-start; gap: 8px; animation: gcFadeIn 0.25s ease; }
.gc-msg-avatar { width: 22px; height: 22px; border-radius: 50%; background: #7c6af5; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #fff; flex-shrink: 0; overflow: hidden; }
.gc-msg-avatar img { width: 100%; height: 100%; object-fit: cover; }
.gc-msg-body { flex: 1; min-width: 0; }
.gc-msg-sender { font-size: 10px; font-weight: 700; color: #6b6880; margin-bottom: 2px; font-family: 'Syne', sans-serif; }
.gc-msg-text { font-size: 13px; color: #f0ede8; line-height: 1.4; word-break: break-word; }
.gc-msg.gc-ai .gc-msg-avatar { background: linear-gradient(135deg, #7c6af5, #4fcf8e); }
.gc-msg.gc-ai .gc-msg-sender { color: #7c6af5; }
.gc-msg.gc-ai .gc-msg-text { color: #c8c0f0; }
.gc-msg.gc-system { justify-content: center; }
.gc-msg.gc-system .gc-msg-text { font-size: 11px; color: #6b6880; text-align: center; font-style: italic; }
.gc-input-row { display: flex; gap: 8px; padding: 8px 10px; border-top: 1px solid rgba(255,255,255,0.07); }
.gc-input {
  flex: 1; background: #1a1a26; border: 1px solid rgba(255,255,255,0.07);
  border-radius: 999px; padding: 7px 14px; color: #f0ede8;
  font-family: inherit; font-size: 13px; outline: none;
  transition: border-color 0.2s;
}
.gc-input:focus { border-color: #7c6af5; }
.gc-input::placeholder { color: #6b6880; }
.gc-send-btn {
  background: #7c6af5; border: none; border-radius: 50%; width: 34px; height: 34px;
  color: #fff; font-size: 15px; cursor: pointer; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.2s;
}
.gc-send-btn:hover { background: #9d8fff; }
@keyframes gcPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
@keyframes gcFadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
`

  let cssInjected = false
  function injectCSS() {
    if (cssInjected) return
    cssInjected = true
    const style = document.createElement('style')
    style.textContent = CSS
    document.head.appendChild(style)
  }

  // ---- GameChat class ----
  class GameChat {
    constructor(opts = {}) {
      this.roomId = opts.roomId || 'lobby'
      this.myName = opts.myName || 'ผู้เล่น'
      this.myAvatar = opts.myAvatar || null
      this.gameName = opts.gameName || 'tictactoe'
      this.container = typeof opts.container === 'string'
        ? document.querySelector(opts.container)
        : opts.container
      this.onSend = opts.onSend || null
      this._channel = null
      this._wrap = null
      this._messagesEl = null
      this._inputEl = null
    }

    mount() {
      injectCSS()
      if (!this.container) return

      const wrap = document.createElement('div')
      wrap.className = 'gc-wrap'
      wrap.innerHTML = `
        <div class="gc-header">
          <span>💬 แชทในเกม</span>
          <div class="gc-status-dot" title="Realtime"></div>
        </div>
        <div class="gc-messages"></div>
        <div class="gc-input-row">
          <input class="gc-input" placeholder="พิมพ์ข้อความ..." maxlength="120">
          <button class="gc-send-btn">➤</button>
        </div>
      `
      this.container.appendChild(wrap)
      this._wrap = wrap
      this._messagesEl = wrap.querySelector('.gc-messages')
      this._inputEl = wrap.querySelector('.gc-input')

      const sendBtn = wrap.querySelector('.gc-send-btn')
      sendBtn.addEventListener('click', () => this._handleSend())
      this._inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this._handleSend() }
      })

      this._subscribeRealtime()
      this.addMessage({ sender: 'ระบบ', text: 'แชทพร้อมใช้งาน!', type: 'system' })
    }

    _subscribeRealtime() {
      // db is the global Supabase client from supabase.js
      if (typeof db === 'undefined') return
      this._channel = db.channel(`chat:${this.roomId}`)
        .on('broadcast', { event: 'chat' }, ({ payload }) => {
          if (payload.sender !== this.myName) {
            this.addMessage({ sender: payload.sender, text: payload.text, avatar: payload.avatar, type: 'peer' })
          }
        })
        .subscribe()
    }

    _handleSend() {
      const text = this._inputEl.value.trim()
      if (!text) return
      this._inputEl.value = ''
      // Show locally immediately
      this.addMessage({ sender: this.myName, text, avatar: this.myAvatar, type: 'me' })
      // Broadcast
      if (this._channel) {
        this._channel.send({
          type: 'broadcast', event: 'chat',
          payload: { sender: this.myName, text, avatar: this.myAvatar }
        })
      }
      if (this.onSend) this.onSend(text)
    }

    /**
     * Add a message to the chat panel.
     * @param {object} opts
     *   sender {string}
     *   text   {string}
     *   avatar {string|null}  URL
     *   type   {'me'|'peer'|'ai'|'system'}
     */
    addMessage({ sender, text, avatar = null, type = 'peer' }) {
      if (!this._messagesEl) return
      const msg = document.createElement('div')
      msg.className = `gc-msg gc-${type}`

      if (type === 'system') {
        msg.innerHTML = `<div class="gc-msg-text">${_esc(text)}</div>`
      } else {
        const initial = (sender || '?')[0].toUpperCase()
        const avatarHtml = avatar
          ? `<img src="${_esc(avatar)}" alt="${_esc(initial)}" onerror="this.parentElement.innerHTML='<span>${_esc(initial)}</span>'">`
          : `<span>${_esc(initial)}</span>`
        msg.innerHTML = `
          <div class="gc-msg-avatar">${avatarHtml}</div>
          <div class="gc-msg-body">
            <div class="gc-msg-sender">${_esc(sender)}</div>
            <div class="gc-msg-text">${_esc(text)}</div>
          </div>
        `
      }

      this._messagesEl.appendChild(msg)
      this._messagesEl.scrollTop = this._messagesEl.scrollHeight
    }

    /**
     * Trigger AI commentary for a game event.
     * @param {string} event  e.g. 'win', 'hit', 'miss', 'sunk', 'draw', 'move'
     * @param {object} data   event data e.g. { winner, player, ship }
     * @param {number} delay  ms before showing comment (default 600)
     */
    gameEvent(event, data = {}, delay = 600) {
      const comment = getAIComment(this.gameName, event, data)
      if (!comment) return
      setTimeout(() => {
        this.addMessage({ sender: 'AI 🤖', text: comment, type: 'ai' })
      }, delay)
    }

    destroy() {
      this._channel?.unsubscribe()
      this._wrap?.remove()
      this._channel = null
      this._wrap = null
    }
  }

  function _esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  global.GameChat = GameChat
})(window)
