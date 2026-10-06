import * as jutils from "./utils/utils.js";
import { JGridView } from "./core/jgrid.js";

import { KeyboardControls, EventManager } from "./utils/keyboard.js";
import { JEvents } from "./utils/jevents.js";
import { NAME_TO_STYLE, NAME_TO_TEXT } from "./core/constants.js";
import { createFlowfield } from "./core/flowfield.js";

function playAnimation(el, clsName = "jump-animation", duration = 200) {
  el.classList.add(clsName);
  setTimeout(() => {
    el.classList.remove(clsName);
  }, duration);
}

const offsets = [
  [-1, 0], // ^
  [0, 1], // >
  [1, 0], // v
  [0, -1], // <
];

// function formatObj(obj) {
//   const parts = [`${NAME_TO_TEXT[obj.name]}`];
//   obj.hp && parts.push(`h${obj.hp}`);
//   obj.atk && parts.push(`a${obj.atk}`);
//   obj.tt !== undefined && parts.push(`tt${obj.tt}/${obj.ttl}`);
//   return parts.join(" ");
// }
// function formatObj2(obj) {
//   const name2text = {
//     player: "🧙‍♀️",
//     castle: "👑",
//     wall: "🛡️",
//     enemy: "👻",
//     spawner: "☠️",
//     rock: "🪨",
//     tree: "🌿",
//     bow: "🏹",
//   };
//   return name2text[obj.name] ?? "?";
// }
const name2text = {
  player: "🧙‍♀️",
  castle: "👑",
  wall: "🛡️",
  enemy: "👻",
  spawner: "☠️",
  rock: "🪨",
  tree: "🌿",
  bow: "🏹",
};
const dir2text = {
  "0_0": "x",
  "-1_0": "^",
  "0_1": ">",
  "1_0": "v",
  "0_-1": "<",
};

class CHBuilderHelper {
  constructor() {
    this.parts = [];
  }
  add(content, pos = "c") {
    const pos2cls = {
      c: "cell_center",
      tl: "cell_corner cell_tl",
      tr: "cell_corner cell_tr",
      bl: "cell_corner cell_bl",
      br: "cell_corner cell_br",
    };
    this.parts.push(`<div class="${pos2cls[pos]}">${content}</div>`);
    return this;
  }
  str() {
    return this.parts.join("");
  }
}
class CHBuilder {
  static start() {
    return new CHBuilderHelper();
  }
}
// function formatObjCorners(obj) {
//   const parts = [];
//   if (obj.hp !== undefined || NAME_TO_TEXT[obj.name]) {
//     parts.push(
//       `<div class="cell_corner cell_tl">💚${obj.hp ?? NAME_TO_TEXT[obj.name]}</div>`,
//     );
//   }
//   if (obj.atk !== undefined) {
//     parts.push(`<div class="cell_corner cell_tr">⚔️${obj.atk}</div>`);
//   }s
//   if (obj.tt !== undefined) {
//     parts.push(`<div class="cell_corner cell_br">⭐${obj.tt}/${obj.ttl}</div>`);
//   }
//   // if (obj.dir !== undefined) {
//   //   parts.push(`<div class="cell_corner cell_br">🧭${obj.tt}/${obj.ttl}</div>`);
//   // }
//   if (name2text[obj.name]) {
//     parts.push(`<span class="cell_center">${name2text[obj.name]}</span>`);
//   }
//   return parts.join("");
// }

const level_01 = {
  size: [4, 4],
  objects: [
    { pos: [1, 1], name: "castle" },

    { pos: [1, 2], name: "wall" },
    { pos: [2, 2], name: "wall" },

    { pos: [1, 0], name: "rock" },
    { pos: [2, 0], name: "tree" },

    { pos: [0, 1], name: "rock" },
    { pos: [0, 2], name: "rock" },

    { pos: [0, 0], name: "player" },
    { pos: [3, 3], name: "spawner" },
  ],
};

const config = {
  objects: {
    player: { hp: 5, atk: 1 },
    castle: { hp: 5, atk: 1, tt: 0, ttl: 3 },
    wall: { hp: 2 },
    enemy: { hp: 3, atk: 1 },
    spawner: { hp: 3, tt: -5, ttl: 3 },
    bow: { hp: 2, atk: 1, tt: 0, ttl: 2 },
    default: { hp: 1 },
  },
};

class RenderSystem {
  constructor(events) {
    this.events = events;

    // this.debugEl = document.getElementById("debug");
    // this.gameEl = document.getElementById("game");
    this.game2El = document.getElementById("game2");

    this.size = null;
    // this.debugGrid = null;
    // this.gameGrid = null;
    this.grid = null;

    this.resize([1, 1]);
  }

  dispose() {
    // this.debugGrid?.dispose();
    // this.gameGrid?.dispose();
    this.grid?.dispose();
  }
  resize(size) {
    this.size = size;
    this.dispose();
    // this.debugGrid = new JGridView(this.debugEl, size);
    // this.gameGrid = new JGridView(this.gameEl, size);
    this.grid = new JGridView(this.game2El, size);
  }
  render({ key2obj, flowfield, size }) {
    const dir2text = {
      "0_0": "x",
      "-1_0": "^",
      "0_1": ">",
      "1_0": "v",
      "0_-1": "<",
    };
    // console.log("handleRender");
    const key2info = {};
    const key2info2 = {};
    const key2info3 = {};
    Object.entries(flowfield).forEach(([key, dir]) => {
      const dkey = jutils.jpos2key(dir);

      key2info[key] = {
        style: NAME_TO_STYLE["default"],
        textContent: dir2text[dkey],
      };
    });

    Object.entries(flowfield).forEach(([key, dir]) => {
      const obj = key2obj[key];
      // const textContent = obj ? formatObj(obj) : "";
      const style = NAME_TO_STYLE[obj?.name] ?? NAME_TO_STYLE["default"];
      // key2info2[key] = {
      //   style,
      //   textContent,
      // };

      // const textContent2 = obj ? formatObj2(obj) : "";
      // const innerHTMLparts = [];

      // if (obj) {
      //   const cornerPart = formatObjCorners(obj);
      //   innerHTMLparts.push(cornerPart);
      // }

      const cb = CHBuilder.start();
      if (obj) {
        cb.add(`💚${obj.hp ?? NAME_TO_TEXT[obj.name]}`, "tl");
        obj.atk && cb.add(`⚔️${obj.atk}`, "tr");
        obj.tt && cb.add(`⭐${obj.tt}/${obj.ttl}`, "br");
        obj.atk && cb.add(`⚔️${obj.atk}`, "tr");
        obj.atk && cb.add(`⚔️${obj.atk}`, "tr");
        name2text[obj.name] && cb.add(name2text[obj.name], "c");
      }
      const dkey = jutils.jpos2key(dir);
      dkey && cb.add(`${dir2text[dkey]}`, "bl");
      const innerHTML = cb.str();
      key2info3[key] = {
        style: { ...style, bgUrl: "url(assets/trace.png)" },
        innerHTML,
      };
    });

    this.grid.renderGrid(key2info3);
  }
}

class Game {
  constructor() {
    this.state = {
      size: [4, 4],
      state: "level",
      objects: [],
      key2obj: {},
      flowfield: {},
    };
    this.events = new JEvents();
    this.keyboard = new KeyboardControls(new EventManager());
    this.keyboard.activate();

    this.renderSystem = new RenderSystem();

    this._initEvents();

    this.loadLevel({ size: [4, 4], objects: [] });
  }
  dispose() {
    console.log("dispose");
    this.state = {
      size: [4, 4],
      state: "level",
      objects: [],
      key2obj: {},
      flowfield: {},
    };
    this.renderSystem.dispose();
  }
  loadLevel(level) {
    console.log("loadLevel");
    this.dispose();
    this.state.size = level.size;
    this.state.objects = level.objects.map((obj) => {
      const objConf = config.objects[obj.name] ?? config.objects.default;
      return { ...objConf, ...obj };
    });
    this.state.state = "playing";
    this.renderSystem.resize(level.size);
  }
  _initEvents() {
    const key2offset = {
      w: [-1, 0], // ^
      d: [0, 1], // >
      s: [1, 0], // v
      a: [0, -1], // <
    };

    Object.entries(key2offset).forEach(([key, offset]) => {
      this.keyboard.addOnKeydown(key, () => {
        this.events.emit("keyboard_press", key);
      });
    });

    const button2key = {
      "btn-up": "w", // ^
      "btn-right": "d", // >
      "btn-down": "s", // v
      "btn-left": "a", // <
    };
    Object.entries(button2key).forEach(([cls, key]) => {
      document.querySelector(`.${cls}`).addEventListener("click", () => {
        this.events.emit("keyboard_press", key);
      });
    });

    this.events.on("keyboard_press", (key) => {
      if (this.state.state !== "playing") {
        return;
      }

      const offset = key2offset[key];
      if (!offset) {
        return;
      }

      this.events.emit("player_act", offset);
      this.events.emit("render");
    });
    this.events.on("player_act", (offset) => this.handleMove(offset));
    this.events.on("step", () => this.handleStep());
    this.events.on("render", () => this.handleRender());
    this.events.on("move_attack", (key, nkey) => {
      const cellEl = this.renderSystem.grid.getCellByKey(key);
      cellEl && playAnimation(cellEl);

      const ncellEl = this.renderSystem.grid.getCellByKey(nkey);
      ncellEl && playAnimation(ncellEl);
    });
  }
  handleMove(offset) {
    // console.log("handleMove", offset);
    const { objects } = this.state;
    const player = objects.find((obj) => obj.name === "player");
    player.move = offset;
    this.events.emit("step");
  }
  _updateKey2obj() {
    const { objects } = this.state;
    const key2obj = {};
    objects.forEach((obj) => {
      const key = jutils.jpos2key(obj.pos);
      key2obj[key] = obj;
    });
    this.state.key2obj = key2obj;
  }
  handleStep() {
    // console.log("handleStep");
    this._updateKey2obj();
    const { objects, size, key2obj } = this.state;

    const flowfield = createFlowfield(size, key2obj);
    this.state.flowfield = flowfield;
    // update objects
    const player = objects.find((obj) => obj.name === "player");
    const castle = objects.find((obj) => obj.name === "castle");
    const enemies = objects.filter((obj) => obj.name === "enemy");
    const spawners = objects.filter((obj) => obj.name === "spawner");
    const bows = objects.filter((obj) => obj.name === "bow");
    if (player.move) {
      this._handlePlayerMove(player);
      player.move = null;
    }
    enemies.forEach((enemy) => {
      this._handleEnemyMove(enemy);
    });
    spawners.forEach((spawner) => {
      this._handleSpawnerMove(spawner);
    });
    bows.forEach((bow) => {
      this._handleBowMove(bow);
    });
    this._handleCastleMove(castle);
    // remove destroyed obj
    const toDelete = new Set(
      objects.filter(
        (obj) => obj.hp !== undefined && obj.hp !== null && obj.hp <= 0,
      ),
    );
    this.state.objects = objects.filter((obj) => !toDelete.has(obj));
    toDelete.forEach((obj) => {
      if (obj.el) {
        this.gameAbsGrid.remove(obj.id);
      }
    });

    // check win/lose
    const winLose = this._checkWinLose();
    if (winLose) {
      alert(winLose);
      this.state.state = "finish";
    }
  }
  _tryMoveObj(pos, npos) {
    const { key2obj, objects, size } = this.state;
    const key = jutils.jpos2key(pos);
    const nkey = jutils.jpos2key(npos);
    const obj = key2obj[key];
    if (!obj) {
      return true;
    }
    const nobj = key2obj[nkey];
    if (!nobj) {
      obj.pos = npos;
      key2obj[nkey] = obj;
      key2obj[key] = null;
      return true;
    }

    // merge
    const mobj = this._tryMerge(obj, nobj);
    if (mobj) {
      obj.hp = -1;
      nobj.hp = -1;
      mobj.pos = npos;
      objects.push(mobj);
      key2obj[key] = null;
      key2obj[nkey] = mobj;
      return true;
    }

    // attack
    if (obj.name !== "enemy" || !["enemy", "spawner"].includes(nobj.name)) {
      this.events.emit("move_attack", key, nkey);
      nobj.hp ??= 0;
      nobj.hp -= 1;
      return false;
    }
  }
  _handlePlayerMove(player) {
    // console.log("_handlePlayerMove");
    const { key2obj, objects, size } = this.state;
    const { pos, move } = player;
    const npos = jutils.addV(pos, move);
    const nnpos = jutils.addV(npos, move);
    const nIn = jutils.checkInside(npos, [0, 0], size);
    const nnIn = jutils.checkInside(nnpos, [0, 0], size);
    if (!nIn || !nnIn) {
      return this._tryMoveObj(pos, npos);
    }
    if (nnIn) {
      const moved = this._tryMoveObj(npos, nnpos);
      if (!moved) {
        return;
      }
      return this._tryMoveObj(pos, npos);
    }
  }
  _tryMerge(lhs, rhs) {
    const names = [lhs.name, rhs.name];
    if (lhs.name === "rock" && rhs.name === "rock") {
      return { name: "wall", hp: 2 };
    }
    if (names.includes("rock") && names.includes("tree")) {
      return { name: "bow", hp: 2, atk: 1, tt: 0, ttl: 2 };
    }

    return null;
  }
  _handleEnemyMove(enemy) {
    const { key2obj, flowfield } = this.state;
    const { pos } = enemy;
    const key = jutils.jpos2key(pos);
    const move = flowfield[key];
    if (!move) {
      return false;
    }
    const npos = jutils.addV(pos, move);
    return this._tryMoveObj(pos, npos);
  }
  _handleSpawnerMove(spawner) {
    // bfs first pos
    const { size, objects, key2obj } = this.state;

    const { pos, hp, ttl, tt } = spawner;
    spawner.tt++;
    if (spawner.tt < spawner.ttl) {
      return;
    }
    spawner.tt = 0;
    spawner.hp--;
    const key = jutils.jpos2key(pos);
    // find free pos
    const availableOffsets = offsets.filter((off) => {
      return jutils.checkInside(jutils.addV(pos, off), [0, 0], size);
    });
    // console.log("availableOffsets", availableOffsets);
    const foff = availableOffsets.find((off) => {
      const npos = jutils.addV(pos, off);
      const nkey = jutils.jpos2key(npos);
      const nobj = key2obj[nkey];
      return !nobj;
    });
    const fpos = jutils.addV(pos, foff);
    // console.log("fpos", fpos);
    if (fpos) {
      const fkey = jutils.jpos2key(fpos);
      const enemy = { pos: fpos, name: "enemy", hp: 2 };
      objects.push(enemy);
      key2obj[fkey] = enemy;
      return;
    }
    // if no free pos, attack one
    const off = availableOffsets[0];
    const apos = jutils.addV(pos, off);
    const akey = jutils.jpos2key(apos);
    const nobj = key2obj[akey];
    nobj.hp ??= 0;
    nobj.hp = -1;
  }
  _handleCastleMove(castle) {
    const { key2obj } = this.state;
    castle.tt++;

    offsets.forEach((off) => {
      if (castle.tt < castle.ttl) {
        return;
      }
      const pos = jutils.addV(castle.pos, off);
      const key = jutils.jpos2key(pos);
      const obj = key2obj[key];
      if (obj?.name !== "enemy") {
        return;
      }
      obj.hp -= castle.atk;
      castle.tt = 0;
    });
  }
  _handleBowMove(bow) {
    const { key2obj } = this.state;
    bow.tt++;

    if (bow.tt < bow.ttl) {
      return;
    }

    const bkey = jutils.jpos2key(bow.pos);

    for (const off of offsets) {
      for (const range of [1, 2]) {
        const pos = jutils.addV(bow.pos, jutils.mulS(off, range));
        const key = jutils.jpos2key(pos);
        const obj = key2obj[key];
        if (obj?.name !== "enemy") {
          continue;
        }
        this.events.emit("move_attack", bkey, key);
        obj.hp -= bow.atk;
        bow.tt = 0;
        return;
      }
    }
  }
  _checkWinLose() {
    const { objects } = this.state;
    const player = objects.find((obj) => obj.name === "player");
    const castle = objects.find((obj) => obj.name === "castle");
    const enemies = objects.filter((obj) => obj.name === "enemy");
    const spawners = objects.filter((obj) => obj.name === "spawner");
    if (!player || !castle) {
      return "lose";
    }
    if (!enemies.length && !spawners.length) {
      return "win";
    }
    return null;
  }

  handleRender() {
    // console.log("handleRender");
    this._updateKey2obj();
    const { key2obj, flowfield, size } = this.state;
    this.renderSystem.render({ key2obj, flowfield, size });
  }
}

function main() {
  const game = new Game();
  game.loadLevel(level_01);

  game.events.emit("step");
  game.events.emit("render");

  const btnRestart = document.querySelector(".btn-restart");
  btnRestart.addEventListener("click", () => {
    game.loadLevel(level_01);

    game.events.emit("step");
    game.events.emit("render");
  });
}

main();

// TODO:
// create flow field from castle to all enemies using dijkstra algo
// consider walls, add weight to graphs
// win if no spawners and enemeis and castle alive
// lose if castle or player is destroyed
// move,merge,attack,be hit
// ideas:
// stone + stone -> wall
// axe + tree -> wood
// wood + wood -> house
// house + sword -> barracs (hp: 3)
// human + sword -> warrior
// stone + wood ->
