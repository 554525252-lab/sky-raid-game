const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

const ui = {
  score: document.getElementById('score'),
  lives: document.getElementById('lives'),
  wave: document.getElementById('wave'),
  weapon: document.getElementById('weapon'),
  statusChip: document.getElementById('statusChip'),
  effectChip: document.getElementById('effectChip'),
  bossPanel: document.getElementById('bossPanel'),
  bossName: document.getElementById('bossName'),
  bossValue: document.getElementById('bossValue'),
  bossFill: document.getElementById('bossFill'),
  overlay: document.getElementById('overlay'),
  panelTag: document.getElementById('panelTag'),
  panelTitle: document.getElementById('panelTitle'),
  panelText: document.getElementById('panelText'),
  startButton: document.getElementById('startButton'),
  audioButton: document.getElementById('audioButton'),
  touchPad: document.getElementById('touchPad'),
  touchKnob: document.getElementById('touchKnob'),
  fireButton: document.getElementById('fireButton')
};

const keys = new Set();
const touch = { x: 0, y: 0, fire: false, active: false };
const state = {
  running: false,
  gameOver: false,
  last: 0,
  score: 0,
  wave: 1,
  spawnTimer: 0,
  enemiesLeft: 8,
  flash: 0,
  shake: 0,
  stars: Array.from({ length: 90 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: Math.random() * 2 + 1, v: Math.random() * 120 + 50 })),
  player: null,
  bullets: [],
  enemyBullets: [],
  enemies: [],
  supplies: [],
  particles: [],
  boss: null,
  message: '准备起飞'
};

const supplyTypes = ['weapon', 'shield', 'rapid', 'repair'];
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let audioEnabled = true;

function rand(a, b) { return Math.random() * (b - a) + a; }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }

function beep(freq = 440, dur = 0.08, type = 'square', gain = 0.03) {
  if (!audioEnabled) return;
  const t = audioCtx.currentTime;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(audioCtx.destination);
  o.start(t); o.stop(t + dur);
}

function setStatus(a, b = '') {
  ui.statusChip.textContent = a;
  ui.effectChip.textContent = b || '常规火力';
}

function showOverlay(tag, title, text, buttonText) {
  ui.panelTag.textContent = tag;
  ui.panelTitle.textContent = title;
  ui.panelText.textContent = text;
  ui.startButton.textContent = buttonText;
  ui.overlay.classList.remove('hidden');
}

function hideOverlay() { ui.overlay.classList.add('hidden'); }

function resetPlayer() {
  state.player = {
    x: W / 2, y: H - 86, r: 16, speed: 280,
    lives: 3, fireGap: 0.22, fireCd: 0,
    weapon: 1, shield: 0, rapid: 0, invuln: 0
  };
}

function updateHUD() {
  const p = state.player;
  ui.score.textContent = state.score;
  ui.lives.textContent = p.lives;
  ui.wave.textContent = state.wave;
  ui.weapon.textContent = `Lv.${p.weapon}`;
  if (state.boss) {
    ui.bossPanel.classList.remove('hidden');
    ui.bossName.textContent = '风暴母舰';
    ui.bossValue.textContent = `${Math.max(0, Math.ceil(state.boss.hp))} / ${state.boss.maxHp}`;
    ui.bossFill.style.width = `${(state.boss.hp / state.boss.maxHp) * 100}%`;
  } else {
    ui.bossPanel.classList.add('hidden');
  }
}

function emit(x, y, n, color, speed = 120) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = Math.random() * speed;
    state.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.2, 0.6), max: 0.6, size: rand(1.5, 4), color });
  }
}

function spawnEnemy() {
  const t = Math.random();
  const type = t < 0.18 ? 'elite' : t < 0.42 ? 'fast' : 'normal';
  const cfg = {
    normal: { hp: 2, r: 14, vx: rand(-20, 20), vy: rand(110, 150), color: '#8f7cff', score: 80, fire: 1.6 },
    fast: { hp: 1, r: 12, vx: rand(-40, 40), vy: rand(170, 220), color: '#ff6f8e', score: 120, fire: 1.2 },
    elite: { hp: 5, r: 18, vx: rand(-25, 25), vy: rand(95, 125), color: '#ffc36a', score: 220, fire: 0.9 }
  }[type];
  state.enemies.push({ x: rand(30, W - 30), y: -30, type, ...cfg, wobble: rand(0, Math.PI * 2), fireCd: rand(0.4, cfg.fire) });
}

function spawnBoss() {
  state.boss = { x: W / 2, y: 90, r: 48, hp: 80 + state.wave * 25, maxHp: 80 + state.wave * 25, dir: 1, fireCd: 0.8, patternCd: 2.4 };
  setStatus(`第 ${state.wave} 波 BOSS`, '全屏弹幕警告');
  beep(180, 0.25, 'sawtooth', 0.05);
}

function spawnSupply(x, y) {
  const kind = supplyTypes[(Math.random() * supplyTypes.length) | 0];
  state.supplies.push({ x, y, kind, vy: 110, r: 14 });
}

function firePlayer() {
  const p = state.player;
  if (p.fireCd > 0) return;
  p.fireCd = p.rapid > 0 ? 0.11 : p.fireGap;
  const shots = [];
  if (p.weapon === 1) shots.push({ x: p.x, y: p.y - 18, vx: 0, vy: -430, dmg: 1, r: 4 });
  if (p.weapon === 2) shots.push({ x: p.x - 8, y: p.y - 16, vx: -25, vy: -430, dmg: 1, r: 4 }, { x: p.x + 8, y: p.y - 16, vx: 25, vy: -430, dmg: 1, r: 4 });
  if (p.weapon >= 3) shots.push({ x: p.x, y: p.y - 20, vx: 0, vy: -460, dmg: 1, r: 4 }, { x: p.x - 12, y: p.y - 12, vx: -80, vy: -420, dmg: 1, r: 4 }, { x: p.x + 12, y: p.y - 12, vx: 80, vy: -420, dmg: 1, r: 4 });
  state.bullets.push(...shots);
  beep(520, 0.04, 'square', 0.018);
}

function fireEnemy(e) {
  const dx = state.player.x - e.x;
  const dy = state.player.y - e.y;
  const len = Math.hypot(dx, dy) || 1;
  state.enemyBullets.push({ x: e.x, y: e.y, vx: dx / len * 170, vy: dy / len * 170, r: 4 });
}

function fireBoss() {
  const b = state.boss;
  const angles = [-0.42, -0.18, 0, 0.18, 0.42];
  for (const a of angles) state.enemyBullets.push({ x: b.x, y: b.y + 8, vx: Math.sin(a) * 150, vy: Math.cos(a) * 210, r: 5 });
  beep(140, 0.09, 'sawtooth', 0.03);
}

function hitPlayer() {
  const p = state.player;
  if (p.invuln > 0) return;
  if (p.shield > 0) {
    p.shield = 0;
    p.invuln = 1;
    setStatus('护盾破裂', '短暂无敌');
    emit(p.x, p.y, 18, '#79f5ff', 160);
    beep(260, 0.08, 'triangle', 0.03);
    return;
  }
  p.lives -= 1;
  p.invuln = 1.6;
  state.flash = 0.35;
  state.shake = 10;
  emit(p.x, p.y, 24, '#ff8f99', 220);
  beep(120, 0.22, 'sawtooth', 0.05);
  if (p.lives <= 0) {
    state.running = false;
    state.gameOver = true;
    showOverlay('任务失败', '云霄突击结束', `最终得分 ${state.score}，到达第 ${state.wave} 波。`, '重新开始');
  }
}

function applySupply(kind) {
  const p = state.player;
  if (kind === 'weapon') p.weapon = Math.min(3, p.weapon + 1);
  if (kind === 'shield') p.shield = 1;
  if (kind === 'rapid') p.rapid = 8;
  if (kind === 'repair') p.lives = Math.min(5, p.lives + 1);
  const labels = { weapon: '火力升级', shield: '护盾上线', rapid: '急速射击', repair: '机体修复' };
  setStatus('获得补给', labels[kind]);
  emit(p.x, p.y, 18, '#fff0a6', 140);
  beep(640, 0.12, 'triangle', 0.03);
}

function resetGame() {
  state.running = true;
  state.gameOver = false;
  state.score = 0;
  state.wave = 1;
  state.spawnTimer = 0.5;
  state.enemiesLeft = 8;
  state.flash = 0;
  state.shake = 0;
  state.bullets = [];
  state.enemyBullets = [];
  state.enemies = [];
  state.supplies = [];
  state.particles = [];
  state.boss = null;
  resetPlayer();
  setStatus('准备起飞', '常规火力');
  hideOverlay();
  updateHUD();
}

function handleInput(dt) {
  const p = state.player;
  let mx = 0, my = 0;
  if (keys.has('arrowleft') || keys.has('a')) mx -= 1;
  if (keys.has('arrowright') || keys.has('d')) mx += 1;
  if (keys.has('arrowup') || keys.has('w')) my -= 1;
  if (keys.has('arrowdown') || keys.has('s')) my += 1;
  if (touch.active) { mx += touch.x; my += touch.y; }
  const len = Math.hypot(mx, my) || 1;
  p.x += (mx / len) * p.speed * dt * (mx || my ? 1 : 0);
  p.y += (my / len) * p.speed * dt * (mx || my ? 1 : 0);
  p.x = clamp(p.x, 20, W - 20);
  p.y = clamp(p.y, 30, H - 30);
  if (keys.has(' ') || keys.has('j') || touch.fire) firePlayer();
}

function update(dt) {
  const p = state.player;
  p.fireCd = Math.max(0, p.fireCd - dt);
  p.invuln = Math.max(0, p.invuln - dt);
  if (p.rapid > 0) p.rapid = Math.max(0, p.rapid - dt);
  state.flash = Math.max(0, state.flash - dt);
  state.shake = Math.max(0, state.shake - dt * 25);

  for (const s of state.stars) {
    s.y += s.v * dt;
    if (s.y > H) { s.y = -4; s.x = Math.random() * W; }
  }

  handleInput(dt);

  if (!state.boss) {
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0 && state.enemiesLeft > 0) {
      spawnEnemy();
      state.enemiesLeft -= 1;
      state.spawnTimer = Math.max(0.3, 1.0 - state.wave * 0.04);
    }
    if (state.enemiesLeft <= 0 && state.enemies.length === 0) {
      if (state.wave % 3 === 0) spawnBoss();
      else {
        state.wave += 1;
        state.enemiesLeft = 8 + state.wave * 3;
        setStatus(`进入第 ${state.wave} 波`, '敌军增援');
      }
    }
  }

  for (const e of state.enemies) {
    e.wobble += dt * 2.2;
    e.x += Math.sin(e.wobble) * 28 * dt + e.vx * dt;
    e.y += e.vy * dt;
    e.fireCd -= dt;
    if (e.fireCd <= 0) {
      fireEnemy(e);
      e.fireCd = e.fire;
    }
  }

  if (state.boss) {
    const b = state.boss;
    b.x += b.dir * 90 * dt;
    if (b.x < 70 || b.x > W - 70) b.dir *= -1;
    b.fireCd -= dt;
    b.patternCd -= dt;
    if (b.fireCd <= 0) { fireBoss(); b.fireCd = 1.0; }
    if (b.patternCd <= 0) {
      for (let i = 0; i < 12; i++) {
        const a = Math.PI * 2 * i / 12;
        state.enemyBullets.push({ x: b.x, y: b.y, vx: Math.cos(a) * 130, vy: Math.sin(a) * 130, r: 5 });
      }
      b.patternCd = 3;
    }
  }

  for (const b of state.bullets) { b.x += b.vx * dt; b.y += b.vy * dt; }
  for (const b of state.enemyBullets) { b.x += b.vx * dt; b.y += b.vy * dt; }
  for (const s of state.supplies) s.y += s.vy * dt;
  for (const p of state.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }

  for (let i = state.bullets.length - 1; i >= 0; i--) {
    const b = state.bullets[i];
    let used = false;
    for (let j = state.enemies.length - 1; j >= 0; j--) {
      const e = state.enemies[j];
      if (dist(b.x, b.y, e.x, e.y) < b.r + e.r) {
        e.hp -= b.dmg; state.bullets.splice(i, 1); used = true; emit(b.x, b.y, 4, '#9befff', 90);
        if (e.hp <= 0) {
          state.score += e.score; emit(e.x, e.y, 14, e.color, 180); state.enemies.splice(j, 1);
          if (Math.random() < 0.22) spawnSupply(e.x, e.y);
          beep(360, 0.06, 'square', 0.02);
        }
        break;
      }
    }
    if (!used && state.boss && dist(b.x, b.y, state.boss.x, state.boss.y) < b.r + state.boss.r) {
      state.boss.hp -= b.dmg; state.bullets.splice(i, 1); emit(b.x, b.y, 4, '#ffd39f', 90);
      if (state.boss.hp <= 0) {
        state.score += 1500 + state.wave * 200;
        emit(state.boss.x, state.boss.y, 40, '#ff8ea3', 250);
        state.flash = 0.5; state.shake = 16; state.boss = null;
        state.wave += 1; state.enemiesLeft = 10 + state.wave * 3;
        setStatus('BOSS 击破', `进入第 ${state.wave} 波`);
        if (Math.random() < 0.9) spawnSupply(W / 2, 140);
        beep(540, 0.28, 'triangle', 0.05);
      }
    }
  }

  for (let i = state.enemyBullets.length - 1; i >= 0; i--) {
    const b = state.enemyBullets[i];
    if (dist(b.x, b.y, p.x, p.y) < b.r + p.r) { state.enemyBullets.splice(i, 1); hitPlayer(); }
  }

  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i];
    if (dist(e.x, e.y, p.x, p.y) < e.r + p.r) { state.enemies.splice(i, 1); hitPlayer(); emit(e.x, e.y, 12, '#ff9d95', 180); }
    else if (e.y > H + 40) state.enemies.splice(i, 1);
  }

  if (state.boss && dist(state.boss.x, state.boss.y, p.x, p.y) < state.boss.r + p.r) hitPlayer();

  for (let i = state.supplies.length - 1; i >= 0; i--) {
    const s = state.supplies[i];
    if (dist(s.x, s.y, p.x, p.y) < s.r + p.r) { applySupply(s.kind); state.supplies.splice(i, 1); }
    else if (s.y > H + 30) state.supplies.splice(i, 1);
  }

  state.bullets = state.bullets.filter(b => b.y > -20 && b.y < H + 20 && b.x > -20 && b.x < W + 20);
  state.enemyBullets = state.enemyBullets.filter(b => b.y > -20 && b.y < H + 20 && b.x > -20 && b.x < W + 20);
  state.particles = state.particles.filter(p => p.life > 0);
  updateHUD();
}

function drawShip(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#e7f7ff';
  ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(16, 18); ctx.lineTo(0, 8); ctx.lineTo(-16, 18); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#63ebff';
  ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(8, 10); ctx.lineTo(0, 5); ctx.lineTo(-8, 10); ctx.closePath(); ctx.fill();
  ctx.fillStyle = `rgba(255,170,90,${0.55 + Math.sin(performance.now() / 70) * 0.12})`;
  ctx.beginPath(); ctx.moveTo(-5, 12); ctx.lineTo(0, 28 + Math.random() * 4); ctx.lineTo(5, 12); ctx.fill();
  ctx.restore();
}

function drawEnemy(e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.fillStyle = e.color;
  ctx.beginPath(); ctx.moveTo(0, 18); ctx.lineTo(18, -12); ctx.lineTo(0, -4); ctx.lineTo(-18, -12); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawBoss(b) {
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.fillStyle = '#ff6d8f';
  ctx.beginPath(); ctx.roundRect(-52, -26, 104, 52, 18); ctx.fill();
  ctx.fillStyle = '#ffbe6f'; ctx.fillRect(-18, -18, 36, 36);
  ctx.fillStyle = '#2a0f18'; ctx.fillRect(-8, -8, 16, 16);
  ctx.restore();
}

function draw() {
  ctx.save();
  ctx.translate(rand(-state.shake, state.shake), rand(-state.shake, state.shake));
  ctx.clearRect(-30, -30, W + 60, H + 60);

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#071124'); bg.addColorStop(1, '#03060f');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  for (const s of state.stars) {
    ctx.fillStyle = `rgba(255,255,255,${0.35 + s.s * 0.15})`;
    ctx.fillRect(s.x, s.y, s.s, s.s * 2.3);
  }

  for (const s of state.supplies) {
    const colors = { weapon: '#ffa95f', shield: '#71f7ff', rapid: '#ffeb74', repair: '#93ff9d' };
    ctx.fillStyle = colors[s.kind];
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(6,10,18,0.72)'; ctx.font = 'bold 12px Orbitron'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(s.kind[0].toUpperCase(), s.x, s.y + 1);
  }

  for (const b of state.bullets) { ctx.fillStyle = '#8af6ff'; ctx.fillRect(b.x - 2, b.y - 10, 4, 16); }
  for (const b of state.enemyBullets) { ctx.fillStyle = '#ff7e9b'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill(); }
  state.enemies.forEach(drawEnemy);
  if (state.boss) drawBoss(state.boss);

  const p = state.player;
  if (!state.gameOver) {
    if (p.invuln <= 0 || Math.floor(performance.now() / 80) % 2 === 0) drawShip(p.x, p.y);
    if (p.shield > 0) { ctx.strokeStyle = 'rgba(108,251,255,0.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 12, 0, Math.PI * 2); ctx.stroke(); }
  }

  for (const p of state.particles) {
    ctx.globalAlpha = p.life / p.max; ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  }

  if (state.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${state.flash * 0.28})`; ctx.fillRect(0, 0, W, H); }
  ctx.restore();
}

function loop(ts) {
  const dt = Math.min(0.033, (ts - (state.last || ts)) / 1000);
  state.last = ts;
  if (state.running) update(dt);
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (['arrowup','arrowdown','arrowleft','arrowright',' ','a','s','d','w','j','r'].includes(k)) e.preventDefault();
  keys.add(k); if (k === 'r') resetGame();
});
window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));

ui.startButton.addEventListener('click', async () => { try { await audioCtx.resume(); } catch {} if (!state.running) resetGame(); });
ui.audioButton.addEventListener('click', async () => { audioEnabled = !audioEnabled; if (audioEnabled) try { await audioCtx.resume(); } catch {} ui.audioButton.textContent = `声音：${audioEnabled ? '开' : '关'}`; });

(function bindTouchPad() {
  const pad = ui.touchPad, knob = ui.touchKnob, radius = 38;
  function move(clientX, clientY) {
    const rect = pad.getBoundingClientRect();
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    const dx = clientX - cx, dy = clientY - cy;
    const len = Math.hypot(dx, dy) || 1;
    const nx = clamp(dx / radius, -1, 1), ny = clamp(dy / radius, -1, 1);
    const scale = Math.min(radius, len);
    knob.style.transform = `translate(calc(-50% + ${(dx / len) * scale}px), calc(-50% + ${(dy / len) * scale}px))`;
    touch.x = nx; touch.y = ny;
  }
  function reset() { touch.x = 0; touch.y = 0; touch.active = false; knob.style.transform = 'translate(-50%, -50%)'; }
  pad.addEventListener('pointerdown', e => { touch.active = true; pad.setPointerCapture(e.pointerId); move(e.clientX, e.clientY); });
  pad.addEventListener('pointermove', e => { if (touch.active) move(e.clientX, e.clientY); });
  pad.addEventListener('pointerup', reset); pad.addEventListener('pointercancel', reset);
})();
['pointerdown','pointerup','pointercancel','pointerleave'].forEach(type => ui.fireButton.addEventListener(type, () => touch.fire = type === 'pointerdown'));

showOverlay('准备起飞', '按下开始进入战场', '击落敌机、接补给、迎击母舰。建议打开声音体验更完整。', '开始游戏');
resetPlayer();
updateHUD();
requestAnimationFrame(loop);
