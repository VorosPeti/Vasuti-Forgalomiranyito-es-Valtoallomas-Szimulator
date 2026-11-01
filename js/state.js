export const LEVELS = {
  1: {
    name: 'Kitérő vágány jelzőkkel',
    difficulty: 'Könnyű',
    trains: 4,
    interval: 5.5,
    speed: 82
  },
  2: {
    name: 'Rendező-pályaudvar',
    difficulty: 'Közepes',
    trains: 5,
    interval: 4.2,
    speed: 91
  },
  3: {
    name: 'Fejpályaudvari csúcsforgalom',
    difficulty: 'Nehéz',
    trains: 6,
    interval: 3.1,
    speed: 99
  }
};

const clone = value => JSON.parse(JSON.stringify(value));

function makeTrack(id, points, from, to) {
  return {
    id,
    points,
    from,
    to,
    length: 0
  };
}

function baseNetwork(level) {
  const nodes = [];
  const edges = [];
  const switches = [];
  const signals = [];
  const platforms = [];

  const addNode = (id, x, y, type = 'junction') => {
    nodes.push({ id, x, y, type });
  };

  const addEdge = (id, points, from, to) => {
    const edge = makeTrack(id, points, from, to);

    for (let i = 1; i < points.length; i += 1) {
      edge.length += Math.hypot(
        points[i].x - points[i - 1].x,
        points[i].y - points[i - 1].y
      );
    }

    edges.push(edge);
  };

  if (level === 1) {
    addNode('entry', 80, 305, 'entry');
    addNode('sw1', 330, 305, 'switch');
    addNode('endRed', 1000, 185, 'platform');
    addNode('endBlue', 1000, 425, 'platform');

    addEdge(
      'in',
      [{ x: 80, y: 305 }, { x: 330, y: 305 }],
      'entry',
      'sw1'
    );

    addEdge(
      'up',
      [
        { x: 330, y: 305 },
        { x: 510, y: 185 },
        { x: 1000, y: 185 }
      ],
      'sw1',
      'endRed'
    );

    addEdge(
      'down',
      [
        { x: 330, y: 305 },
        { x: 510, y: 425 },
        { x: 1000, y: 425 }
      ],
      'sw1',
      'endBlue'
    );

    switches.push({
      id: 'sw1',
      options: ['up', 'down'],
      active: 0
    });

    signals.push(
      { id: 'sigUp', edge: 'up', at: 0.2, green: true },
      { id: 'sigDown', edge: 'down', at: 0.2, green: true }
    );

    platforms.push(
      { id: 'endRed', name: '1. Vágány', color: '#f04452' },
      { id: 'endBlue', name: '2. Vágány', color: '#3478ed' }
    );

  } else if (level === 2) {
    // Két bevezető vágány két külön váltóhoz érkezik.
    // A két belső összekötő ág a központi váltóhoz vezet;
    // a keresztezés nem csomópont.

    addNode('entryA', 55, 165, 'entry');
    addNode('entryB', 55, 445, 'entry');
    addNode('swA', 270, 165, 'switch');
    addNode('swB', 270, 445, 'switch');
    addNode('swC', 650, 305, 'switch');
    addNode('platRed', 1030, 125, 'platform');
    addNode('platBlue', 1030, 305, 'platform');
    addNode('platGreen', 1030, 485, 'platform');

    addEdge(
      'aIn',
      [{ x: 55, y: 165 }, { x: 270, y: 165 }],
      'entryA',
      'swA'
    );

    addEdge(
      'bIn',
      [{ x: 55, y: 445 }, { x: 270, y: 445 }],
      'entryB',
      'swB'
    );

    addEdge(
      'aRed',
      [
        { x: 270, y: 165 },
        { x: 560, y: 125 },
        { x: 1030, y: 125 }
      ],
      'swA',
      'platRed'
    );

    addEdge(
      'aJoin',
      [
        { x: 270, y: 165 },
        { x: 450, y: 235 },
        { x: 650, y: 305 }
      ],
      'swA',
      'swC'
    );

    addEdge(
      'bGreen',
      [
        { x: 270, y: 445 },
        { x: 560, y: 485 },
        { x: 1030, y: 485 }
      ],
      'swB',
      'platGreen'
    );

    addEdge(
      'bJoin',
      [
        { x: 270, y: 445 },
        { x: 450, y: 375 },
        { x: 650, y: 305 }
      ],
      'swB',
      'swC'
    );

    addEdge(
      'cBlue',
      [
        { x: 650, y: 305 },
        { x: 820, y: 305 },
        { x: 1030, y: 305 }
      ],
      'swC',
      'platBlue'
    );

    addEdge(
      'cRed',
      [
        { x: 650, y: 305 },
        { x: 820, y: 75 },
        { x: 1030, y: 125 }
      ],
      'swC',
      'platRed'
    );

    switches.push(
      { id: 'swA', options: ['aRed', 'aJoin'], active: 0 },
      { id: 'swB', options: ['bGreen', 'bJoin'], active: 0 },
      { id: 'swC', options: ['cBlue', 'cRed'], active: 0 }
    );

    signals.push(
      { id: 's2a', edge: 'aRed', at: 0.22, green: true },
      { id: 's2b', edge: 'bGreen', at: 0.22, green: true },
      { id: 's2c', edge: 'cBlue', at: 0.25, green: true },
      { id: 's2d', edge: 'cRed', at: 0.25, green: true }
    );

    platforms.push(
      { id: 'platRed', name: '1. Vágány', color: '#f04452' },
      { id: 'platBlue', name: '2. Vágány', color: '#3478ed' },
      { id: 'platGreen', name: '3. Vágány', color: '#29c78a' }
    );

  } else {
    // Két fővonal négy számozott peronra.
    // A csomópontok valódi végpontok: minden váltó kimenete
    // önálló, folytonos sínszakasz.

    addNode('entryA', 45, 145, 'entry');
    addNode('entryB', 45, 465, 'entry');
    addNode('swA', 235, 145, 'switch');
    addNode('swB', 235, 465, 'switch');
    addNode('swC', 600, 305, 'switch');
    addNode('swD', 825, 305, 'switch');
    addNode('p1', 1060, 95, 'platform');
    addNode('p2', 1060, 235, 'platform');
    addNode('p3', 1060, 375, 'platform');
    addNode('p4', 1060, 515, 'platform');

    addEdge(
      'aIn',
      [{ x: 45, y: 145 }, { x: 235, y: 145 }],
      'entryA',
      'swA'
    );

    addEdge(
      'bIn',
      [{ x: 45, y: 465 }, { x: 235, y: 465 }],
      'entryB',
      'swB'
    );

    addEdge(
      'aP1',
      [
        { x: 235, y: 145 },
        { x: 520, y: 95 },
        { x: 1060, y: 95 }
      ],
      'swA',
      'p1'
    );

    addEdge(
      'aJoin',
      [
        { x: 235, y: 145 },
        { x: 420, y: 220 },
        { x: 600, y: 305 }
      ],
      'swA',
      'swC'
    );

    addEdge(
      'bP4',
      [
        { x: 235, y: 465 },
        { x: 520, y: 515 },
        { x: 1060, y: 515 }
      ],
      'swB',
      'p4'
    );

    addEdge(
      'bJoin',
      [
        { x: 235, y: 465 },
        { x: 420, y: 390 },
        { x: 600, y: 305 }
      ],
      'swB',
      'swC'
    );

    addEdge(
      'cP2',
      [
        { x: 600, y: 305 },
        { x: 810, y: 235 },
        { x: 1060, y: 235 }
      ],
      'swC',
      'p2'
    );

    addEdge(
      'cToD',
      [{ x: 600, y: 305 }, { x: 825, y: 305 }],
      'swC',
      'swD'
    );

    addEdge(
      'dP3',
      [
        { x: 825, y: 305 },
        { x: 930, y: 375 },
        { x: 1060, y: 375 }
      ],
      'swD',
      'p3'
    );

    addEdge(
      'dP2',
      [
        { x: 825, y: 305 },
        { x: 930, y: 165 },
        { x: 1060, y: 235 }
      ],
      'swD',
      'p2'
    );

    addEdge(
      'dP1',
      [
        { x: 825, y: 305 },
        { x: 930, y: 95 },
        { x: 1060, y: 95 }
      ],
      'swD',
      'p1'
    );

    switches.push(
      { id: 'swA', options: ['aP1', 'aJoin'], active: 0 },
      { id: 'swB', options: ['bP4', 'bJoin'], active: 0 },
      { id: 'swC', options: ['cP2', 'cToD'], active: 0 },
      { id: 'swD', options: ['dP3', 'dP2', 'dP1'], active: 0 }
    );

    signals.push(
      { id: 's3a', edge: 'aP1', at: 0.2, green: true },
      { id: 's3b', edge: 'bP4', at: 0.2, green: true },
      { id: 's3c', edge: 'cP2', at: 0.2, green: true },
      { id: 's3d', edge: 'dP3', at: 0.2, green: true },
      { id: 's3e', edge: 'dP2', at: 0.2, green: true },
      { id: 's3f', edge: 'dP1', at: 0.2, green: true }
    );

    platforms.push(
      { id: 'p1', name: '1. Peron', color: '#f04452' },
      { id: 'p2', name: '2. Peron', color: '#3478ed' },
      { id: 'p3', name: '3. Peron', color: '#29c78a' },
      { id: 'p4', name: '4. Peron', color: '#f0a43a' }
    );
  }

  return {
    nodes,
    edges,
    switches,
    signals,
    platforms
  };
}

export function createGame(level, player) {
  const network = baseNetwork(level);

  const schedules = level === 1
    ? [
        {
          at: 0,
          entry: 'entry',
          color: '#f04452',
          target: 'endRed',
          route: ['in', 'up']
        },
        {
          at: 5.5,
          entry: 'entry',
          color: '#3478ed',
          target: 'endBlue',
          route: ['in', 'down']
        },
        {
          at: 12,
          entry: 'entry',
          color: '#f04452',
          target: 'endRed',
          route: ['in', 'up']
        },
        {
          at: 18.5,
          entry: 'entry',
          color: '#3478ed',
          target: 'endBlue',
          route: ['in', 'down']
        }
      ]
    : level === 2
      ? [
          {
            at: 0,
            entry: 'entryA',
            color: '#f04452',
            target: 'platRed',
            route: ['aIn', 'aRed']
          },
          {
            at: 4,
            entry: 'entryB',
            color: '#29c78a',
            target: 'platGreen',
            route: ['bIn', 'bGreen']
          },
          {
            at: 8,
            entry: 'entryA',
            color: '#3478ed',
            target: 'platBlue',
            route: ['aIn', 'aJoin', 'cBlue']
          },
          {
            at: 13,
            entry: 'entryB',
            color: '#f04452',
            target: 'platRed',
            route: ['bIn', 'bJoin', 'cRed']
          },
          {
            at: 18,
            entry: 'entryA',
            color: '#3478ed',
            target: 'platBlue',
            route: ['aIn', 'aJoin', 'cBlue']
          }
        ]
      : [
          {
            at: 0,
            entry: 'entryA',
            color: '#f04452',
            target: 'p1',
            route: ['aIn', 'aP1']
          },
          {
            at: 3,
            entry: 'entryB',
            color: '#f0a43a',
            target: 'p4',
            route: ['bIn', 'bP4']
          },
          {
            at: 6,
            entry: 'entryA',
            color: '#3478ed',
            target: 'p2',
            route: ['aIn', 'aJoin', 'cP2']
          },
          {
            at: 9,
            entry: 'entryB',
            color: '#29c78a',
            target: 'p3',
            route: ['bIn', 'bJoin', 'cToD', 'dP3']
          },
          {
            at: 13,
            entry: 'entryA',
            color: '#3478ed',
            target: 'p2',
            route: ['aIn', 'aJoin', 'cToD', 'dP2']
          },
          {
            at: 17,
            entry: 'entryB',
            color: '#f04452',
            target: 'p1',
            route: ['bIn', 'bJoin', 'cToD', 'dP1']
          }
        ];

  return {
    level,
    player,
    ...network,
    schedules,
    trains: [],
    elapsed: 0,
    arrived: 0,
    errors: 0,
    delays: 0,
    spawned: 0,
    paused: false,
    over: false,
    started: false,
    lastSpawn: -1,
    events: [],
    result: null,
    crash: null
  };
}

export function saveSnapshot(game) {
  return {
    version: 1,
    level: game.level,
    player: game.player,
    elapsed: game.elapsed,
    arrived: game.arrived,
    errors: game.errors,
    delays: game.delays,
    spawned: game.spawned,
    switches: clone(game.switches),
    signals: clone(game.signals),
    trains: clone(game.trains),
    events: clone(game.events),
    started: game.started
  };
}

export function restoreSnapshot(data) {
  if (!data || !LEVELS[data.level] || !Array.isArray(data.trains)) {
    throw new Error('Érvénytelen vagy sérült mentés.');
  }

  const game = createGame(data.level, data.player || 'Diszpécser');

  Object.assign(game, {
    elapsed: Number(data.elapsed) || 0,
    arrived: Number(data.arrived) || 0,
    errors: Number(data.errors) || 0,
    delays: Number(data.delays) || 0,
    spawned: Number(data.spawned) || (
      data.trains.length +
      (Number(data.arrived) || 0) +
      (Number(data.errors) || 0)
    ),
    trains: clone(data.trains),
    started: true,
    events: Array.isArray(data.events) ? clone(data.events) : []
  });

  game.switches = game.switches.map(item => ({
    ...item,
    ...(data.switches || []).find(saved => saved.id === item.id)
  }));

  game.signals = game.signals.map(item => ({
    ...item,
    ...(data.signals || []).find(saved => saved.id === item.id)
  }));

  return game;
}