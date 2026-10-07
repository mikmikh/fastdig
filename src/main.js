import * as jutils from "./utils/utils.js";

import { KeyboardControls, EventManager } from "./utils/keyboard.js";
import { JEvents } from "./utils/jevents.js";
import { Procedural } from "./core/procedural.js";
import { Blocks, Terrain } from "./core/terrain.js";
import { RenderSystem } from "./core/render.js";
import { ACTIONS, BLOCK_TO_AIR_COST, BLOCKS } from "./core/constants.js";

function checkHaveSolidAround(wpos, blocks) {
  const offs = [-1, 0, 1];
  for (const roff of offs) {
    for (const coff of offs) {
      const offset = [roff, coff];
      const pos = jutils.addV(wpos, offset);

      const block = blocks.at(pos);
      if (![BLOCKS.sky, BLOCKS.trace, BLOCKS.trace_active].includes(block)) {
        return true;
      }
    }
  }
  return false;
}

const initState = {
  size: [1, 1],
  state: "level",
  viewPos: [0, 0],
  playerPos: [0, 0],
  air: 100,
  airMax: 100,
  key2obj: {},
  items: {},
};
class Game {
  constructor(size = [4, 4], seed = 42) {
    this.state = { ...initState };
    this.events = new JEvents();
    this.keyboard = new KeyboardControls(new EventManager());
    this.keyboard.activate();

    this.procedural = new Procedural(seed);
    this.terrain = new Terrain(size, seed);
    this.blocks = new Blocks((pos) => this.terrain.getBlockAt(pos));
    this.renderSystem = new RenderSystem();

    this._initEvents();

    this.loadLevel({ size });
  }
  reload() {
    const size = this.state.size;
    this.loadLevel({ size });
  }
  dispose() {
    console.log("dispose");
    this.state = { ...initState };
    this.renderSystem.dispose();
  }
  loadLevel(level) {
    console.log("loadLevel");
    this.dispose();
    this.state = { ...this.state, ...level };
    this.state.state = "playing";
    this.renderSystem.resize(level.size);
    const ppos = this.terrain.getInitPlayerPos();
    this.state.playerPos = ppos;
    console.log("ppos", ppos);

    this.events.emit(ACTIONS.view_update);
    this.events.emit(ACTIONS.render);
  }
  _initEvents() {
    const key2offset = {
      w: [-1, 0], // ^
      d: [0, 1], // >
      s: [1, 0], // v
      a: [0, -1], // <
      " ": [0, 0], // .
    };

    Object.entries(key2offset).forEach(([key, offset]) => {
      this.keyboard.addOnKeydown(key, () => {
        this.events.emit(ACTIONS.key_press, key);
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
        this.events.emit(ACTIONS.key_press, key);
      });
    });

    this.events.on(ACTIONS.key_press, (key) => {
      if (this.state.state !== "playing") {
        return;
      }

      const offset = key2offset[key];
      if (!offset) {
        return;
      }

      // this.events.emit("player_act", offset);
      this.events.emit(ACTIONS.player_move, offset);
      this.events.emit(ACTIONS.render);
    });
    this.events.on(ACTIONS.view_update, () => this.handleViewUpdate());
    this.events.on(ACTIONS.player_move, (offset) =>
      this.handlePlayerMove(offset),
    );
    this.events.on(ACTIONS.render, () => this.handleRender());
    this.events.on(ACTIONS.blocks_fall, (...args) =>
      this.handleBlocksFall(...args),
    );
    this.events.on(ACTIONS.blocks_update, (...args) =>
      this.handleBlocksUpdate(...args),
    );
    this.events.on(ACTIONS.blocks_open, (...args) =>
      this.handleBlocksOpen(...args),
    );
    this.events.on(ACTIONS.blocks_take, (...args) =>
      this.handleBlocksTake(...args),
    );
    this.events.on(ACTIONS.player_respawn, (...args) =>
      this.handlePlayerRespawn(...args),
    );
    this.events.on(ACTIONS.item_take, (...args) =>
      this.handleItemTake(...args),
    );
  }
  _v2w(pos) {
    return pos.map((v, i) => v + this.state.viewPos[i]);
  }
  _w2v(pos) {
    return pos.map((v, i) => v - this.state.viewPos[i]);
  }
  handleViewUpdate() {
    const { size, playerPos } = this.state;
    const key2obj = {};
    const hsize = size.map((v) => Math.floor(0.5 * v));
    const pkey = jutils.jpos2key(playerPos);
    this.state.viewPos = jutils.subV(playerPos, hsize);
    jutils.jrange(size[0]).forEach((ri) => {
      jutils.jrange(size[1]).forEach((ci) => {
        const pos = [ri, ci];
        const key = jutils.jpos2key(pos);

        const wpos = this._v2w(pos);
        const wkey = jutils.jpos2key(wpos);
        if (wkey === pkey) {
          key2obj[key] = { name: BLOCKS.player, pos: wpos, desc: "player" };
          return;
        }

        const name = this.blocks.at(wpos);
        const info = { name, pos: wpos };
        if ([BLOCKS.box_art, BLOCKS.art].includes(name)) {
          const art = this.terrain.procedural.artefactAt(wpos);
          info.desc = art;
        } else if ([BLOCKS.box_bonus, BLOCKS.bonus].includes(name)) {
          const art = this.terrain.procedural.bonusAt(wpos);
          info.desc = art;
        } else if (name === BLOCKS.box_air) {
          info.desc = "+20 air";
        }
        key2obj[key] = info;
      });
    });
    this.state.key2obj = key2obj;
  }
  handleBlocksUpdate(pos, value) {
    this.blocks.set(pos, value);
  }
  handleBlocksOpen(pos) {
    const block = this.blocks.at(pos);
    if (block === BLOCKS.box_art) {
      this.events.emit(ACTIONS.blocks_update, pos, BLOCKS.art);
    } else if (block === BLOCKS.box_bonus) {
      this.events.emit(ACTIONS.blocks_update, pos, BLOCKS.bonus);
    }
  }
  handlePlayerMove(offset) {
    // console.log("player,offset", this.state.playerPos, offset);

    this._handleBlocksMove();
    this._handlePlayerMove(offset);

    this.events.emit(ACTIONS.view_update);
  }
  _handlePlayerMove(offset) {
    const pos = this.state.playerPos;
    const npos = jutils.addV(pos, offset);

    const canMove = checkHaveSolidAround(npos, this.blocks);

    const isBelow = this.terrain.getIsBelow(pos);
    if (isBelow) {
      // this.state.air -= 10;
    } else {
      // this.state.air = this.state.airMax;
    }

    if (!canMove) {
      return;
    }

    const block = this.blocks.at(npos);
    // console.log('block',pos, block);
    // console.log('[BLOCKS.box_art, BLOCKS.box_bonus].includes(block)', [BLOCKS.box_art, BLOCKS.box_bonus].includes(block));
    // open box
    if ([BLOCKS.box_art, BLOCKS.box_bonus].includes(block)) {
      this.events.emit(ACTIONS.blocks_open, npos);
      return;
    }
    if ([BLOCKS.art, BLOCKS.bonus].includes(block)) {
      this.events.emit(ACTIONS.item_take, npos);
    }
    if (![BLOCKS.sky].includes(block)) {
      this.events.emit(ACTIONS.blocks_update, pos, BLOCKS.trace);
    }
    this.events.emit(ACTIONS.blocks_take, npos);
  }
  _handleBlocksMove() {
    const { size } = this.state;
    jutils.jrange(size[0]).forEach((_ri) => {
      const ri = size[0] - _ri - 1; // bottom up
      jutils.jrange(size[1]).forEach((ci) => {
        const pos = [ri, ci];
        const wpos = this._v2w(pos);
        const name = this.blocks.at(wpos);
        if (name !== BLOCKS.stone) {
          return;
        }
        const wbpos = jutils.addV(wpos, [1, 0]);
        const bname = this.blocks.at(wbpos);
        if (bname !== BLOCKS.trace) {
          return;
        }
        this.events.emit(ACTIONS.blocks_fall, wpos, wbpos);
      });
    });
  }
  handleBlocksFall(wpos, wbpos) {
    this.__swapBlocks(wpos, wbpos);
  }
  handleBlocksTake(wpos) {
    const name = this.blocks.at(wpos);
    // console.log("handleBlocksTake", name);
    if (name in BLOCK_TO_AIR_COST) {
      this.state.air = Math.min(
        this.state.airMax,
        Math.max(0, this.state.air + BLOCK_TO_AIR_COST[name]),
      );
    }
    if (this.state.air <= 0) {
      this.events.emit(ACTIONS.player_respawn);
      return;
    }
    if (![BLOCKS.sky].includes(name)) {
      this.events.emit(ACTIONS.blocks_update, wpos, BLOCKS.trace_active);
    }
    this.state.playerPos = wpos;
  }
  handlePlayerRespawn() {
    // set to surface
    const npos = this.terrain.getSurfacePos(this.state.playerPos);
    console.log("handlePlayerRespawn npos", npos);
    this.state.playerPos = npos;
    this.state.air = this.state.airMax;
  }
  __swapBlocks(lpos, rpos) {
    const lblock = this.blocks.at(lpos);
    const rblock = this.blocks.at(rpos);
    this.events.emit(ACTIONS.blocks_update, lpos, rblock);
    this.events.emit(ACTIONS.blocks_update, rpos, lblock);
  }
  handleRender() {
    const { key2obj } = this.state;
    this.renderSystem.render({ key2obj });

    {
      // air
      const airEl = document.getElementById("air");
      const bar =
        this.state.air < 0
          ? ""
          : "|".repeat(Math.floor((10 * this.state.air) / this.state.airMax));
      const text = `${this.state.air}/${this.state.airMax}`;
      airEl.textContent = `${text} [${bar}]`;
    }
  }
  handleItemTake(pos) {
    const block = this.blocks.at(pos);
    let item = null;
    if ([BLOCKS.art].includes(block)) {
      item = this.terrain.procedural.artefactAt(pos);
    } else if ([BLOCKS.bonus].includes(block)) {
      item = this.terrain.procedural.bonusAt(pos);
    }
    if (!item || item === "empty") {
      return;
    }
    this.state.items[item] ??= 0;
    this.state.items[item]++;
    const itemsEl = document.getElementById("items");
    itemsEl.textContent = JSON.stringify(this.state.items);
  }
}

function main() {
  const size = [5, 5];
  const seed = 43;
  let game = new Game(size, seed);

  function startGame(seed = 42, size = [5, 5]) {
    game.dispose();
    game = new Game(size, seed);
  }

  const btnRestart = document.querySelector(".btn-restart");
  btnRestart.addEventListener("click", () => {
    const inputSeed = document.getElementById('input-seed');
    const inputSize = document.getElementById('input-size');
    const seed = Math.max(1, inputSeed.value);
    inputSeed.value = seed;
    const size = Math.min(17, Math.max(3, inputSize.value));
    inputSize.value = size;
    startGame(seed, [size, size]);
  });
}

main();
