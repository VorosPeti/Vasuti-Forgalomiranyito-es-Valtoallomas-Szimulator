const $ = selector => document.querySelector(selector);

const colors = {
  rail: '#53647b',
  railInner: '#263449',
  red: '#f04452',
  blue: '#3478ed',
  green: '#29c78a',
  yellow: '#f7c948',
  cyan: '#36c9f4',
  white: '#eaf1fc'
};

// Vágánypont meghatározása
function pointAt(edge, distance) {
  let remaining = Math.max(0, distance);

  for (let i = 1; i < edge.points.length; i += 1) {
    const a = edge.points[i - 1];
    const b = edge.points[i];

    const length = Math.hypot(
      b.x - a.x,
      b.y - a.y
    );

    if (remaining <= length) {
      const t = length ? remaining / length : 0;

      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        angle: Math.atan2(b.y - a.y, b.x - a.x)
      };
    }

    remaining -= length;
  }

  const last = edge.points[edge.points.length - 1];

  return {
    x: last.x,
    y: last.y,
    angle: 0
  };
}

// Robbanás kirajzolása
function drawExplosion(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = '#ffb02e';
  ctx.strokeStyle = '#ff4d4d';
  ctx.lineWidth = 3;

  ctx.beginPath();

  for (let i = 0; i < 16; i += 1) {
    const angle = (Math.PI * 2 * i) / 16;
    const radius = i % 2 === 0 ? 25 : 13;

    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;

    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }

  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px Manrope';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('!', 0, 0);

  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = colors.red;
  ctx.font = 'bold 12px Manrope';
  ctx.fillText('ÜTKÖZÉS', 0, 42);

  ctx.restore();
}

// Játék kirajzolása
export function renderGame(game) {
  const canvas = $('#rail-canvas');

  if (!canvas || !game) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Háttér törlése és kirajzolása
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = '#080d16';
  ctx.fillRect(0, 0, width, height);

  // Háttérrács
  ctx.save();

  ctx.strokeStyle = '#121c2a';
  ctx.lineWidth = 1;

  for (let x = 0; x < width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = 0; y < height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.restore();

  // Vágányok kirajzolása
  game.edges.forEach(edge => {
    ctx.save();

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    edge.points.forEach((p, i) => {
      if (i) {
        ctx.lineTo(p.x, p.y);
      } else {
        ctx.moveTo(p.x, p.y);
      }
    });

    // Külső sínréteg
    ctx.strokeStyle = colors.railInner;
    ctx.lineWidth = 13;
    ctx.stroke();

    // Belső sínréteg
    ctx.strokeStyle = colors.rail;
    ctx.lineWidth = 7;
    ctx.stroke();

    // Sín középvonala
    ctx.strokeStyle = '#8b9bb0';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Talpfák
    for (let t = 0; t < edge.length; t += 27) {
      const p = pointAt(edge, t);

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      ctx.strokeStyle = '#3b4b60';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(-5, -8);
      ctx.lineTo(-5, 8);
      ctx.stroke();

      ctx.restore();
    }

    ctx.restore();
  });

  // Peronok kirajzolása
  game.platforms.forEach(platform => {
    const node = game.nodes.find(n => n.id === platform.id);

    if (!node) return;

    ctx.fillStyle = platform.color;
    ctx.fillRect(node.x - 7, node.y - 31, 24, 62);

    ctx.fillStyle = '#dce7f7';
    ctx.font = 'bold 13px Manrope';
    ctx.fillText(platform.name, node.x + 27, node.y + 5);
  });

  // Belépőpontok feliratai
  game.nodes
    .filter(n => n.type === 'entry')
    .forEach(node => {
      ctx.fillStyle = '#a7b8ce';
      ctx.font = '12px Manrope';
      ctx.fillText('Belépő →', node.x - 70, node.y + 4);
    });

  // Váltók kirajzolása
  game.switches.forEach(sw => {
    const node = game.nodes.find(n => n.id === sw.id);

    if (!node) return;

    const edge = game.edges.find(
      e => e.id === sw.options[sw.active]
    );

    const p = edge
      ? pointAt(edge, Math.min(34, edge.length * .2))
      : null;

    ctx.save();

    ctx.fillStyle = '#071321';
    ctx.strokeStyle = colors.cyan;
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.arc(node.x, node.y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (p) {
      ctx.strokeStyle = colors.yellow;
      ctx.lineWidth = 4;

      ctx.beginPath();
      ctx.moveTo(node.x, node.y);
      ctx.lineTo(
        node.x + (p.x - node.x) * .55,
        node.y + (p.y - node.y) * .55
      );
      ctx.stroke();
    }

    ctx.restore();
  });

  // Jelzők kirajzolása
  game.signals.forEach(signal => {
    const edge = game.edges.find(
      e => e.id === signal.edge
    );

    if (!edge) return;

    const p = pointAt(edge, edge.length * signal.at);

    ctx.save();

    ctx.fillStyle = '#101a29';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;

    ctx.fillRect(p.x - 10, p.y - 17, 20, 34);
    ctx.strokeRect(p.x - 10, p.y - 17, 20, 34);

    // Felső fényjelzés
    ctx.fillStyle = signal.green ? '#243b36' : '#4b2029';

    ctx.beginPath();
    ctx.arc(p.x, p.y - 7, 5.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = signal.green ? colors.green : colors.red;

    ctx.beginPath();
    ctx.arc(p.x, p.y - 7, 4.2, 0, Math.PI * 2);
    ctx.fill();

    // Alsó fényjelzés
    ctx.fillStyle = signal.green ? '#385448' : '#63313a';

    ctx.beginPath();
    ctx.arc(p.x, p.y + 8, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  });

  // Pulzáló animáció időértéke
  const pulse = 0.5 + 0.5 * Math.sin((game.elapsed || 0) * 7);

  // Vonatok kirajzolása
  game.trains.forEach(train => {
    const edge = game.edges.find(
      e => e.id === train.edge
    );

    if (!edge) return;

    const p = pointAt(edge, train.distance);

    // Ütközésveszély jelzése
    if (train.warning) {
      ctx.save();

      ctx.strokeStyle = train.warningLevel === 'red'
        ? `rgba(240,68,82,${.65 + .3 * pulse})`
        : `rgba(247,201,72,${.55 + .35 * pulse})`;

      ctx.lineWidth = 3;
      ctx.setLineDash([7, 5]);

      ctx.beginPath();
      ctx.arc(p.x, p.y, 29 + 4 * pulse, 0, Math.PI * 2);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.restore();
    }

    // Vonat teste
    ctx.save();

    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);

    if (train.brake) {
      ctx.shadowColor = colors.yellow;
      ctx.shadowBlur = 18;
    }

    if (train.waitingSignal) {
      ctx.shadowColor = colors.red;
      ctx.shadowBlur = 18;
    }

    ctx.fillStyle = train.color;

    ctx.strokeStyle = train.waitingSignal
      ? colors.red
      : '#f4f7fc';

    ctx.lineWidth = train.waitingSignal ? 4 : 2;

    ctx.beginPath();
    ctx.roundRect(-14, -9, 28, 18, 5);
    ctx.fill();
    ctx.stroke();

    // Ablakok
    ctx.fillStyle = '#111b2b';
    ctx.fillRect(-8, -6, 7, 5);
    ctx.fillRect(2, -6, 7, 5);

    // Fényszórók
    ctx.fillStyle = '#fff';
    ctx.fillRect(-12, 7, 5, 2);
    ctx.fillRect(7, 7, 5, 2);

    ctx.restore();

    // Vészfék felirat
    if (train.brake) {
      ctx.fillStyle = colors.yellow;
      ctx.font = 'bold 12px Manrope';
      ctx.fillText('FÉK', p.x - 13, p.y - 18);
    }

    // Piros jelzőnél várakozó vonat
    if (train.waitingSignal) {
      ctx.save();

      ctx.fillStyle = colors.red;
      ctx.font = 'bold 12px Manrope';
      ctx.textAlign = 'center';

      ctx.fillText('TILOS', p.x, p.y - 25);

      ctx.restore();
    }
  });

  // Ütközés megjelenítése
  if (game.crash) {
    drawExplosion(ctx, game.crash.x, game.crash.y);
  }

  // Pálya címe
  ctx.fillStyle = '#61738d';
  ctx.font = '11px DM Mono';

  ctx.fillText(
    'NAGY CSOMÓPONTI PÁLYAUDVAR / FORGALMI KÖRZET',
    20,
    28
  );

  // Felső információs sáv frissítése
  $('#hud-level').textContent = `
    ${game.level}. szint · ${
      game.level === 1
        ? 'Könnyű'
        : game.level === 2
          ? 'Közepes'
          : game.level === 3
            ? 'Nehéz'
            : 'Nehéz · 8 vonat'
    }
  `;

  $('#hud-player').textContent = game.player;
  $('#hud-time').textContent = formatTime(game.elapsed);

  $('#hud-arrived').textContent =
    `${game.arrived} / ${game.schedules.length}`;

  $('#hud-errors').textContent =
    `${game.errors} / ${formatTime(game.delays || 0)}`;
}

// Idő formázása perc:másodperc alakra
export function formatTime(seconds) {
  const value = Math.max(0, Math.floor(seconds));

  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${
    String(value % 60).padStart(2, '0')
  }`;
}