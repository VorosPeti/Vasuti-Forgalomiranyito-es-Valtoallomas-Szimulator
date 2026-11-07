import { LEVELS, createGame, saveSnapshot, restoreSnapshot } from './state.js';
import { renderGame, formatTime } from './render.js';

const $ = selector => document.querySelector(selector);

const screens = [
  '#home-screen',
  '#game-screen',
  '#rules-screen',
  '#leaderboard-screen'
];

let game = null;
let lastFrame = 0;
let animationId = 0;
let lastUiTime = 0;
let lastScheduleIndex = 0;

const STORAGE_SAVE = 'rail-dispatch-save-v1';
const STORAGE_BOARD = 'rail-dispatch-board-v1';

// Képernyők és üzenetek kezelése
function showScreen(selector) {
  screens.forEach(item => {
    $(item).classList.toggle('active', item === selector);
  });
}

function message(text) {
  $('#game-message').textContent = text;
}

// Pályaelemek keresése
function getEdge(id) {
  return game.edges.find(edge => edge.id === id);
}

function getNode(id) {
  return game.nodes.find(node => node.id === id);
}

function edgeStart(id) {
  return getEdge(id)?.from;
}

function edgeEnd(id) {
  return getEdge(id)?.to;
}

function outgoing(nodeId) {
  return game.edges.filter(edge => edge.from === nodeId);
}

// Pont meghatározása egy vágányszakaszon
function edgePoint(edge, distance) {
  let left = distance;

  for (let i = 1; i < edge.points.length; i += 1) {
    const a = edge.points[i - 1];
    const b = edge.points[i];
    const len = Math.hypot(b.x - a.x, b.y - a.y);

    if (left <= len) {
      const t = len ? left / len : 0;

      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t
      };
    }

    left -= len;
  }

  return edge.points[edge.points.length - 1];
}

// Eredményablak megjelenítése
function showModal(success, title, copy) {
  $('#modal-symbol').textContent = success ? '✓' : '!';
  $('#modal-symbol').style.color = success ? '#29c78a' : '#f04452';
  $('#modal-symbol').style.background = success ? '#1c453e' : '#4b2029';

  $('#modal-eyebrow').textContent = success
    ? 'MENET SIKERESEN LEZÁRVA'
    : 'FORGALMI ESEMÉNY';

  $('#modal-title').textContent = title;
  $('#modal-copy').textContent = copy;

  $('#modal-stats').innerHTML = `
    <div>
      <b>${formatTime(game.elapsed)}</b>
      <small>MENETIDŐ</small>
    </div>
    <div>
      <b>${game.arrived}/${game.schedules.length}</b>
      <small>CÉLBA ÉRT</small>
    </div>
    <div>
      <b>${game.errors}</b>
      <small>HIBA</small>
    </div>
    <div>
      <b>${formatTime(game.delays || 0)}</b>
      <small>KÉSÉS</small>
    </div>
  `;

  $('#result-modal').hidden = false;
}

// Játék lezárása
function endGame(success, reason) {
  if (game.over) return;

  game.over = true;
  game.paused = true;
  game.result = { success, reason };

  cancelAnimationFrame(animationId);

  if (success) {
    saveLeaderboard();
  }

  if (success) {
    showModal(
      true,
      'Kiváló diszpécseri munka!',
      `Minden szerelvény biztonságosan befutott. ${
        reason || 'A forgalom balesetmentesen lezárult.'
      }`
    );
  } else {
    showModal(
      false,
      game.crash ? 'ÜTKÖZÉS!' : 'Forgalmi hiba történt',
      reason
    );

    if (game.crash) {
      $('#modal-symbol').textContent = '💥';
    }
  }
}

// Ranglista mentése
function saveLeaderboard() {
  try {
    const all = JSON.parse(
      localStorage.getItem(STORAGE_BOARD) || '{}'
    );

    const list = Array.isArray(all[game.level])
      ? all[game.level]
      : [];

    list.push({
      player: game.player,
      success: true,
      time: Math.floor(game.elapsed),
      errors: game.errors,
      delays: Math.floor(game.delays || 0),
      date: new Date().toLocaleDateString('hu-HU')
    });

    list.sort((a, b) =>
      (Number(a.errors) || 0) - (Number(b.errors) || 0) ||
      (Number(a.delays) || 0) - (Number(b.delays) || 0) ||
      (Number(a.time) || 0) - (Number(b.time) || 0)
    );

    all[game.level] = list.slice(0, 20);

    localStorage.setItem(STORAGE_BOARD, JSON.stringify(all));
  } catch (error) {
    console.error('Ranglista mentése sikertelen:', error);
  }
}

// Játék indítása
function startGame(level, player) {
  try {
    game = createGame(Number(level), player);
    lastScheduleIndex = 0;
    game.started = true;

    showScreen('#game-screen');

    $('#canvas-overlay').hidden = true;
    $('#pause-game').textContent = 'Ⅱ Szünet';
    $('#result-modal').hidden = true;

    message('A forgalomirányítás megkezdődött. Figyeld a jelzőket!');

    lastFrame = performance.now();
    lastUiTime = 0;

    cancelAnimationFrame(animationId);

    renderGame(game);
    animationId = requestAnimationFrame(loop);
  } catch (error) {
    console.error(error);
    $('#home-message').textContent = 'A játék indítása nem sikerült.';
  }
}

// Játék szüneteltetése
function pauseGame() {
  if (!game || game.over) return;

  game.paused = !game.paused;

  $('#canvas-overlay').hidden = !game.paused;

  $('#pause-game').textContent = game.paused
    ? '▶ Folytatás'
    : 'Ⅱ Szünet';

  if (!game.paused) {
    lastFrame = performance.now();
    animationId = requestAnimationFrame(loop);
  } else {
    cancelAnimationFrame(animationId);
  }
}

// Játék újraindítása
function resetGame() {
  if (!game) return;

  const { level, player } = game;
  startGame(level, player);
}

// Vonatok indítása a menetrend szerint
function spawnTrains() {
  while (
    lastScheduleIndex < game.schedules.length &&
    game.elapsed >= game.schedules[lastScheduleIndex].at
  ) {
    const schedule = game.schedules[lastScheduleIndex];

    const edge = game.edges.find(
      item => item.from === schedule.entry
    );

    if (!edge) {
      lastScheduleIndex += 1;
      game.spawned = lastScheduleIndex;
      game.errors += 1;

      message('HIBA: a vonat belépő vágány nélkül nem indítható.');
      continue;
    }

    game.trains.push({
      id: `train-${lastScheduleIndex}`,
      edge: edge.id,
      distance: 0,
      speed: LEVELS[game.level].speed *
        (.88 + ((lastScheduleIndex % 3) * .08)),
      color: schedule.color,
      target: schedule.target,
      route: [...schedule.route],
      routeIndex: 0,
      brake: false,
      waiting: false,
      waitingSignal: false,
      warning: false
    });

    lastScheduleIndex += 1;
    game.spawned = lastScheduleIndex;
  }
}

// Következő vágányszakasz meghatározása
function nextEdgeFor(train, nodeId) {
  const sw = game.switches.find(item => item.id === nodeId);

  if (sw) {
    const chosen = sw.options[sw.active];
    const edge = getEdge(chosen);

    return edge && edge.from === nodeId ? edge : null;
  }

  const desired = train.route[train.routeIndex + 1];

  if (!desired) return null;

  const edge = getEdge(desired);

  return edge && edge.from === nodeId ? edge : null;
}

// Vonat mozgatása
function advanceTrain(train, dt) {
  const edge = getEdge(train.edge);

  if (!edge) {
    derailTrain(train, 'A szerelvény érvénytelen vágányszakaszra került.');
    return true;
  }

  train.waiting = false;
  train.waitingSignal = false;

  const signal = game.signals.find(
    item => item.edge === edge.id && !item.green
  );

  const stopAt = signal ? edge.length * signal.at : null;

  if (stopAt !== null) {
    const stopDistance = Math.max(0, stopAt - 12);

    if (
      train.distance < stopDistance &&
      train.distance + train.speed * dt >= stopDistance
    ) {
      train.distance = stopDistance;
      train.waiting = true;
      train.waitingSignal = true;
      game.delays = (game.delays || 0) + dt;

      return true;
    }

    if (
      train.distance >= stopDistance &&
      train.distance <= stopAt
    ) {
      train.distance = stopDistance;
      train.waiting = true;
      train.waitingSignal = true;
      game.delays = (game.delays || 0) + dt;

      return true;
    }
  }

  if (train.brake) {
    game.delays = (game.delays || 0) + dt;
    return true;
  }

  train.distance += train.speed * dt;

  if (train.distance >= edge.length) {
    const nodeId = edge.to;

    const platform = game.platforms.find(
      item => item.id === nodeId
    );

    // Érkezés a célperonra
    if (platform) {
      if (nodeId === train.target) {
        game.arrived += 1;
        game.trains = game.trains.filter(item => item !== train);

        message(`A vonat szabályosan megérkezett: ${platform.name}.`);
      } else {
        game.errors += 1;
        game.trains = game.trains.filter(item => item !== train);

        message(
          `HIBA: a vonat rossz peronra érkezett (${platform.name}). A szimuláció folytatódik.`
        );
      }

      return true;
    }

    // Továbbhaladás a következő vágányra
    const next = nextEdgeFor(train, nodeId);

    if (!next) {
      derailTrain(
        train,
        `KISIKLÁS: ${nodeId} csomópontból nincs bekötött továbbhaladási útvonal.`
      );

      return true;
    }

    train.distance = Math.max(0, train.distance - edge.length);
    train.edge = next.id;

    const routeIndex = train.route.indexOf(next.id);

    if (routeIndex >= 0) {
      train.routeIndex = routeIndex;
    }
  }

  return true;
}

// Kisiklás kezelése
function derailTrain(train, reason) {
  game.errors += 1;
  game.trains = game.trains.filter(item => item !== train);

  message(
    `${reason} A vonat kiesett, a többi szerelvény tovább közlekedik.`
  );
}

// Vonat pozíciójának meghatározása
function trainPosition(train) {
  const edge = getEdge(train.edge);

  return edge ? edgePoint(edge, train.distance) : null;
}

// Ütközésveszély és ütközés ellenőrzése
function checkCollisions() {
  game.trains.forEach(train => {
    train.warning = false;
    train.warningLevel = 'yellow';
  });

  for (let i = 0; i < game.trains.length; i += 1) {
    for (let j = i + 1; j < game.trains.length; j += 1) {
      const a = game.trains[i];
      const b = game.trains[j];

      const pa = trainPosition(a);
      const pb = trainPosition(b);

      if (!pa || !pb) continue;

      const distance = Math.hypot(
        pa.x - pb.x,
        pa.y - pb.y
      );

      if (distance <= 75) {
        a.warning = true;
        b.warning = true;

        if (distance <= 38) {
          a.warningLevel = 'red';
          b.warningLevel = 'red';
        }
      }

      if (distance <= 22) {
        game.crash = {
          x: (pa.x + pb.x) / 2,
          y: (pa.y + pb.y) / 2,
          trainIds: [a.id, b.id]
        };

        a.crashed = true;
        b.crashed = true;

        endGame(
          false,
          'ÜTKÖZÉS! Két szerelvény elérte a kritikus biztonsági távolságot. A szimuláció leállt.'
        );

        return;
      }
    }
  }
}

// Fő játékhurok
function loop(now) {
  if (!game || game.paused || game.over) return;

  const dt = Math.min((now - lastFrame) / 1000, .05);

  lastFrame = now;
  game.elapsed += dt;

  spawnTrains();

  const current = [...game.trains];

  for (const train of current) {
    if (!advanceTrain(train, dt)) break;
  }

  if (!game.over) {
    checkCollisions();
  }

  if (game.elapsed - lastUiTime > .08 || game.over) {
    renderGame(game);
    lastUiTime = game.elapsed;
  }

  if (
    !game.over &&
    lastScheduleIndex === game.schedules.length &&
    game.trains.length === 0
  ) {
    if (game.errors === 0) {
      endGame(true, 'Minden vonat elérte a megfelelő peront.');
    } else {
      endGame(
        false,
        `A menet véget ért. Helyes érkezés: ${game.arrived}, összes hiba (téves peron/kisiklás): ${game.errors}.`
      );
    }

    renderGame(game);
    return;
  }

  if (!game.over) {
    animationId = requestAnimationFrame(loop);
  }
}

// Egérpozíció meghatározása a vásznon
function canvasPosition(event) {
  const canvas = $('#rail-canvas');
  const rect = canvas.getBoundingClientRect();

  return {
    x: (event.clientX - rect.left) * canvas.width / rect.width,
    y: (event.clientY - rect.top) * canvas.height / rect.height
  };
}

// Váltók és jelzők kezelése kattintással
function onCanvasClick(event) {
  if (!game || game.paused || game.over) return;

  const p = canvasPosition(event);

  const sw = game.switches.find(item => {
    const node = getNode(item.id);

    return node &&
      Math.hypot(node.x - p.x, node.y - p.y) < 25;
  });

  if (sw) {
    sw.active = (sw.active + 1) % sw.options.length;

    message(
      `Váltó átállítva: ${sw.id} · ${sw.options[sw.active]} irány.`
    );

    renderGame(game);
    return;
  }

  const signal = game.signals.find(item => {
    const edge = getEdge(item.edge);

    if (!edge) return false;

    const point = edgePoint(edge, edge.length * item.at);

    return Math.hypot(point.x - p.x, point.y - p.y) < 22;
  });

  if (signal) {
    signal.green = !signal.green;

    message(
      `Jelző: ${signal.green ? 'SZABAD – zöld' : 'TILOS – piros'}.`
    );

    renderGame(game);
    return;
  }
}

// Vészfék kezelése jobb kattintással
function onCanvasContext(event) {
  event.preventDefault();

  if (!game || game.paused || game.over) return;

  const p = canvasPosition(event);

  let nearest = null;
  let distance = Infinity;

  game.trains.forEach(train => {
    const edge = getEdge(train.edge);

    if (!edge) return;

    const pos = edgePoint(edge, train.distance);
    const d = Math.hypot(pos.x - p.x, pos.y - p.y);

    if (d < 24 && d < distance) {
      nearest = train;
      distance = d;
    }
  });

  if (nearest) {
    nearest.brake = !nearest.brake;

    message(
      nearest.brake
        ? 'Vészfék aktiválva.'
        : 'Vészfék feloldva.'
    );

    renderGame(game);
  }
}

// Játékállás mentése
function saveGame() {
  if (!game) {
    $('#home-message').textContent = 'Nincs menthető játékállás.';
    return;
  }

  try {
    localStorage.setItem(
      STORAGE_SAVE,
      JSON.stringify(saveSnapshot(game))
    );

    message('Játékállás sikeresen elmentve a böngészőben.');
  } catch (error) {
    message('A mentés nem sikerült: a böngésző tárhelye nem elérhető.');
    console.error(error);
  }
}

// Korábbi játékállás betöltése
function loadGame() {
  try {
    const raw = localStorage.getItem(STORAGE_SAVE);

    if (!raw) {
      $('#home-message').textContent = 'Nem található korábbi mentés.';
      return;
    }

    game = restoreSnapshot(JSON.parse(raw));

    lastScheduleIndex = game.spawned;

    while (
      lastScheduleIndex < game.schedules.length &&
      game.schedules[lastScheduleIndex].at <= game.elapsed
    ) {
      lastScheduleIndex += 1;
    }

    game.paused = false;
    game.over = false;

    showScreen('#game-screen');

    $('#canvas-overlay').hidden = true;
    $('#pause-game').textContent = 'Ⅱ Szünet';

    lastFrame = performance.now();

    renderGame(game);
    animationId = requestAnimationFrame(loop);
  } catch (error) {
    $('#home-message').textContent =
      error.message || 'A mentés betöltése nem sikerült.';

    console.error(error);
  }
}

// Ranglista megjelenítése
function renderLeaderboard() {
  const level = Number($('#board-level').value);

  let all = {};

  try {
    all = JSON.parse(
      localStorage.getItem(STORAGE_BOARD) || '{}'
    );
  } catch (error) {
    console.error(error);
  }

  const list = Array.isArray(all[level])
    ? [...all[level]].sort((a, b) =>
        (Number(a.time) || 0) - (Number(b.time) || 0) ||
        (Number(a.delays) || 0) - (Number(b.delays) || 0) ||
        (Number(a.errors) || 0) - (Number(b.errors) || 0)
      )
    : [];

  const target = $('#leaderboard-content');

  if (!list.length) {
    target.innerHTML = `
      <div class="empty-board">
        Még nincs rögzített eredmény ezen a pályán.<br>
        Teljesíts egy menetet, hogy felkerülj a listára!
      </div>
    `;

    return;
  }

  target.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>DISZPÉCSER</th>
          <th>HIBÁK</th>
          <th>KÉSÉS</th>
          <th>MENETIDŐ</th>
          <th>DÁTUM</th>
        </tr>
      </thead>
      <tbody>
        ${list.map((item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(item.player)}</td>
            <td>${Number(item.errors) || 0}</td>
            <td>${formatTime(Number(item.delays) || 0)}</td>
            <td>${formatTime(item.time)}</td>
            <td>${escapeHtml(item.date)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// HTML-karakterek biztonságos kezelése
function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char])
  );
}

// Eseménykezelők
$('#start-game').addEventListener('click', () => {
  const name = $('#player-name').value.trim();

  if (!name) {
    $('#home-message').textContent =
      'A játék indításához kötelező megadni a játékos nevét.';

    $('#player-name').focus();
    return;
  }

  startGame($('#level-select').value, name);
});

$('#load-home').addEventListener('click', loadGame);
$('#pause-game').addEventListener('click', pauseGame);
$('#resume-overlay').addEventListener('click', pauseGame);
$('#reset-game').addEventListener('click', resetGame);
$('#save-game').addEventListener('click', saveGame);

$('#menu-game').addEventListener('click', () => {
  showScreen('#home-screen');
  cancelAnimationFrame(animationId);
});

$('#rail-canvas').addEventListener('click', onCanvasClick);
$('#rail-canvas').addEventListener('contextmenu', onCanvasContext);

$('#open-rules').addEventListener('click', () => {
  showScreen('#rules-screen');
});

$('#help-top').addEventListener('click', () => {
  showScreen('#rules-screen');
});

$('#open-leaderboard').addEventListener('click', () => {
  renderLeaderboard();
  showScreen('#leaderboard-screen');
});

$('#board-level').addEventListener('change', renderLeaderboard);

document.querySelectorAll('[data-back]').forEach(button => {
  button.addEventListener('click', () => {
    showScreen('#home-screen');
  });
});

$('#modal-retry').addEventListener('click', () => {
  if (game) startGame(game.level, game.player);
});

$('#modal-home').addEventListener('click', () => {
  $('#result-modal').hidden = true;
  showScreen('#home-screen');
});

window.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !$('#result-modal').hidden) return;

  if (
    event.key === ' ' &&
    game &&
    $('#game-screen').classList.contains('active')
  ) {
    event.preventDefault();
    pauseGame();
  }
});