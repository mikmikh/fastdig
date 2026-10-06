import * as jutils from "../utils/utils.js";
import * as jrng from "../utils/rng.js";
import { BLOCKS } from "./constants.js";

const heightConfig = { name: "height", noise: { o: 4, p: 0.5, s: 0.5 } };
const resourceConfigs = [
  {
    name: BLOCKS.box_air,
    cond: { min: 0, max: 0.01 },
    noise: { off: [100, 0], o: 4, p: 0.5, s: 5 },
  },
  {
    name: BLOCKS.box_art,
    cond: { min: 0, max: 0.01 },
    noise: { off: [101, 0], o: 4, p: 0.5, s: 5 },
  },
  {
    name: BLOCKS.box_bonus,
    cond: { min: 0.01, max: 0.02 },
    noise: { off: [101, 0], o: 4, p: 0.5, s: 5 },
  },
  {
    name: BLOCKS.stone,
    cond: { min: -1, max: 0.1 },
    noise: { off: [0, 0], o: 4, p: 0.5, s: 0.015 },
  },
  {
    name: BLOCKS.sand,
    cond: { min: -1, max: 0.1 },
    noise: { off: [1, 0], o: 4, p: 0.5, s: 0.5 },
  },
  {
    name: BLOCKS.trace,
    cond: { min: -0.1, max: 0.1 },
    noise: { off: [2, 0], o: 4, p: 0.5, s: 0.5 },
  },
];
const DEFAULT_CONFIG = {
  height: heightConfig,
  resources: resourceConfigs,
};
export class Procedural {
  constructor(seed = 42, config = DEFAULT_CONFIG) {
    this.seed = seed;
    this.config = config;
    this.rng = new jrng.JRngMulberry32(seed);
    this.simplex = new jrng.JSimplexNoise(this.rng);
    this.rngExtra = new jrng.JRngMulberry32(seed);
  }
  heightAt(pos) {
    const { noise: conf } = this.config.height;
    const noise = this.simplex.noise2dFractal(
      [1, pos[1]],
      conf.o,
      conf.p,
      conf.s,
    );
    const h = noise;
    return h;
  }
  resourceAt(pos) {
    for (const conf of this.config.resources) {
      const opos = jutils.addV(pos, conf.noise.off);
      const noise = this.simplex.noise2dFractal(
        opos,
        conf.noise.o,
        conf.noise.p,
        conf.noise.s,
      );
      if (noise >= conf.cond.min && noise < conf.cond.max) {
        return conf.name;
      }
    }

    return null;
  }
  artefactAt(pos) {
    const spos = jutils.mulS(pos, 100).map((v) => Math.floor(v));
    const seed = (spos[0] << 16) | (spos[1] & 0xffff);
    this.rngExtra.seed = seed;
    const values = ["empty", "gem", "fossil", "ore"];
    const probs = values.map(() => 1 / values.length);
    const ridx = jrng.pickFromProbs(probs, this.rngExtra);
    return values[ridx];
  }

  bonusAt(pos) {
    const spos = jutils.mulS(pos, 100).map((v) => Math.floor(v));
    const seed = (spos[0] << 16) | (spos[1] & 0xffff);
    this.rngExtra.seed = seed;
    const values = ["empty", "score x2", "inf Air", "luck x2", "teleport"];
    const probs = values.map(() => 1 / values.length);
    const ridx = jrng.pickFromProbs(probs, this.rngExtra);
    return values[ridx];
  }
}
