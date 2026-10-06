import * as jutils from "../utils/utils.js";
import { BLOCKS } from "./constants.js";
import { Procedural } from "./procedural.js";

export class Terrain {
  constructor(size, seed) {
    this.size = size;
    this.procedural = new Procedural(seed);
    this.changes = {};
  }
  getSurfacePos(pos) {
    const h = this.procedural.heightAt([0, pos[1] / this.size[1]]);
    return [Math.floor((h + 0.5) * this.size[0]), pos[1]];
  }
  getInitPlayerPos() {
    const mpos = this.size.map((v) => Math.floor(0.5 * v));
    return this.getSurfacePos(mpos);
    const h = this.procedural.heightAt([0, 0.5]);
    const ppos = [Math.floor((h + 0.5) * this.size[0]), mpos[1]];
    return ppos;
  }
  getIsBelow(pos) {
    const rpos = pos.map((v, i) => v / this.size[i]);
    const rh = this.procedural.heightAt(rpos);
    const h = Math.floor((rh + 0.5) * this.size[0]);
    return pos[0] > h;
  }
  getBlockAt(pos) {
    const isBelow = this.getIsBelow(pos);
    if (!isBelow) {
      return BLOCKS.sky;
    }
    const rpos = pos.map((v, i) => v / this.size[i]);
    const resource = this.procedural.resourceAt(rpos);
    if (!resource) {
      return BLOCKS.soil;
    }
    return resource;
  }
}

export class Blocks {
  constructor(blockFn, keyFn = (pos) => jutils.jpos2key(pos)) {
    this.blockFn = blockFn;
    this.keyFn = keyFn;
    this.changes = {};
  }
  at(pos) {
    const key = this.keyFn(pos);
    if (key in this.changes && this.changes[key] !== undefined) {
      return this.changes[key];
    }

    return this.blockFn(pos);
  }
  set(pos, value) {
    const key = this.keyFn(pos);
    this.changes[key] = value;
  }
  remove(pos) {
    const key = this.keyFn(pos);
    delete this.changes[key];
  }
}
