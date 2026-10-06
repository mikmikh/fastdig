import * as jutils from "../utils/utils.js";
import { BLOCK_TO_COLOR } from "./constants.js";
import { JGridView } from "./jgrid.js";

export function playAnimation(el, clsName = "jump-animation", duration = 200) {
  el.classList.add(clsName);
  setTimeout(() => {
    el.classList.remove(clsName);
  }, duration);
}

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
export class CHBuilder {
  static start() {
    return new CHBuilderHelper();
  }
}

export class RenderSystem {
  constructor() {
    this.gameEl = document.getElementById("game");

    this.size = null;
    this.grid = null;

    this.resize([1, 1]);
  }
  dispose() {
    this.grid?.dispose();
  }
  resize(size) {
    this.size = size;
    this.dispose();
    this.grid = new JGridView(this.gameEl, size);
  }
  render({ key2obj }) {
    const key2info = {};
    jutils.jrange(this.size[0]).forEach((ri) => {
      jutils.jrange(this.size[1]).forEach((ci) => {
        const pos = [ri, ci];
        const key = jutils.jpos2key(pos);
        const obj = key2obj[key];

        const bgColor = BLOCK_TO_COLOR[obj.name]; // === "SOIL" ? "brown" : "cyan";

        const cb = CHBuilder.start();
        if (obj?.pos) {
          cb.add(obj.pos, "tl");
        }
        if (obj?.name) {
          cb.add(obj?.name, "bl");
        }
        if (obj?.desc) {
          cb.add(obj.desc, "tr");
        }
        const innerHTML = cb.str();
        key2info[key] = {
          style: { bgColor },
          innerHTML: innerHTML,
        };
      });
    });

    this.grid.renderGrid(key2info);
  }
}
