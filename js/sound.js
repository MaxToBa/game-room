/**
 * sound.js — Web Audio API sound effects for GameRoom
 * Usage:
 *   <script src="../js/sound.js"></script>
 *   GameSound.play('move')     // single shot
 *   GameSound.mute(true/false) // toggle
 *   GameSound.addMuteButton()  // inject 🔊/🔇 button into page
 */
const GameSound = (() => {
  let ctx = null;
  let muted = localStorage.getItem('gamesound_muted') === 'true';

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // ── Primitive synthesizers ─────────────────────────────────────────────────
  function tone(freq, type, duration, vol = 0.3, startTime = 0) {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime + startTime);
    gain.gain.setValueAtTime(vol, c.currentTime + startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + startTime + duration);
    osc.start(c.currentTime + startTime);
    osc.stop(c.currentTime + startTime + duration + 0.01);
  }

  function noise(duration, vol = 0.15) {
    const c = getCtx();
    const bufferSize = c.sampleRate * duration;
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buffer;
    const gain = c.createGain();
    src.connect(gain);
    gain.connect(c.destination);
    gain.gain.setValueAtTime(vol, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    src.start();
    src.stop(c.currentTime + duration + 0.01);
  }

  // ── Sound definitions ──────────────────────────────────────────────────────
  const sounds = {
    // Board games
    move() {
      tone(400, 'sine', 0.07, 0.15);
    },
    click() {
      tone(600, 'triangle', 0.06, 0.12);
    },
    capture() {
      tone(220, 'sawtooth', 0.12, 0.2);
      tone(180, 'sawtooth', 0.12, 0.18, 0.05);
    },
    drop() {
      tone(300, 'sine', 0.05, 0.2);
      tone(200, 'sine', 0.08, 0.18, 0.04);
    },
    cardPlay() {
      tone(500, 'triangle', 0.08, 0.18);
      tone(650, 'triangle', 0.08, 0.14, 0.06);
    },
    merge() {
      tone(440, 'sine', 0.06, 0.2);
      tone(550, 'sine', 0.06, 0.18, 0.05);
      tone(660, 'sine', 0.06, 0.16, 0.1);
    },

    // Multiplayer
    join() {
      tone(440, 'sine', 0.1, 0.2);
      tone(550, 'sine', 0.1, 0.2, 0.12);
      tone(660, 'sine', 0.15, 0.2, 0.24);
    },
    chat() {
      tone(880, 'sine', 0.07, 0.1);
      tone(1100, 'sine', 0.06, 0.08, 0.08);
    },

    // Game end
    win() {
      const notes = [523, 659, 784, 1047];
      notes.forEach((f, i) => tone(f, 'sine', 0.2, 0.25, i * 0.12));
    },
    lose() {
      tone(300, 'sawtooth', 0.18, 0.2);
      tone(250, 'sawtooth', 0.18, 0.2, 0.2);
      tone(200, 'sawtooth', 0.25, 0.2, 0.4);
    },
    draw() {
      tone(440, 'sine', 0.1, 0.2);
      tone(440, 'sine', 0.1, 0.15, 0.15);
    },

    // Special
    hit() {
      noise(0.06, 0.2);
      tone(350, 'square', 0.08, 0.15, 0.02);
    },
    miss() {
      tone(200, 'sine', 0.15, 0.12);
    },
    sunk() {
      noise(0.15, 0.3);
      tone(150, 'sawtooth', 0.3, 0.25, 0.1);
    },
    skip() {
      tone(700, 'square', 0.06, 0.15);
      tone(500, 'square', 0.06, 0.12, 0.07);
    },
    draw2() {
      [400, 450, 500].forEach((f, i) => tone(f, 'sawtooth', 0.07, 0.2, i * 0.06));
    },
    wild() {
      [523, 622, 740, 880].forEach((f, i) => tone(f, 'triangle', 0.1, 0.2, i * 0.07));
    },
  };

  // ── Public API ─────────────────────────────────────────────────────────────
  function play(name) {
    if (muted) return;
    try {
      if (sounds[name]) sounds[name]();
    } catch (e) {
      // AudioContext may not be allowed before user gesture — fail silently
    }
  }

  function setMute(val) {
    muted = val;
    localStorage.setItem('gamesound_muted', val);
    // Update all mute buttons on page
    document.querySelectorAll('.sound-toggle-btn').forEach(btn => {
      btn.textContent = muted ? '🔇' : '🔊';
      btn.title = muted ? 'เปิดเสียง' : 'ปิดเสียง';
    });
  }

  function toggle() { setMute(!muted); }

  function isMuted() { return muted; }

  /**
   * Inject a floating mute button into the page.
   * Idempotent — won't add twice.
   */
  function addMuteButton() {
    if (document.getElementById('soundToggleBtn')) return;
    const btn = document.createElement('button');
    btn.id = 'soundToggleBtn';
    btn.className = 'sound-toggle-btn';
    btn.textContent = muted ? '🔇' : '🔊';
    btn.title = muted ? 'เปิดเสียง' : 'ปิดเสียง';
    btn.style.cssText = `
      position: fixed; bottom: 20px; right: 20px; z-index: 9999;
      background: rgba(18,18,26,0.9); border: 1px solid rgba(255,255,255,0.1);
      color: #f0ede8; font-size: 20px; width: 44px; height: 44px;
      border-radius: 50%; cursor: pointer; display: flex;
      align-items: center; justify-content: center;
      backdrop-filter: blur(8px); transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    `;
    btn.addEventListener('click', () => {
      // Resume AudioContext on first user gesture
      if (ctx && ctx.state === 'suspended') ctx.resume();
      toggle();
    });
    btn.addEventListener('mouseenter', () => btn.style.transform = 'scale(1.1)');
    btn.addEventListener('mouseleave', () => btn.style.transform = '');
    document.body.appendChild(btn);
  }

  return { play, mute: setMute, toggle, isMuted, addMuteButton };
})();
