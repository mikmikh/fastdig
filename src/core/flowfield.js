import * as jutils from "../utils/utils.js";
import { jdijkstra } from "../utils/jdijkstra.js";

const offsets = [
  [-1, 0], // ^
  [0, 1], // >
  [1, 0], // v
  [0, -1], // <
];

export function createFlowfield(size, key2obj) {
  const objects = Object.values(key2obj);
  const graph = {};
  jutils.jrange(size[0]).forEach((ri) => {
    jutils.jrange(size[1]).forEach((ci) => {
      const pos = [ri, ci];
      const key = jutils.jpos2key(pos);

      offsets.forEach((offset) => {
        const apos = jutils.addV(pos, offset);
        if (!jutils.checkInside(apos, [0, 0], size)) {
          return;
        }
        const akey = jutils.jpos2key(apos);
        let w = 1;
        if (key2obj[akey]) {
          const aobj = key2obj[akey];
          // console.log(aobj.name);
          if (aobj.name === "wall") {
            w = aobj.hp + 1;
          } else if(['spawner'].includes(aobj.name)) {
            w = 1e9;
          }
        }

        graph[key] ??= [];
        graph[key].push([akey, w]);
      });
    });
  });
  // console.log("graph", graph);
  const start = objects.find((obj) => obj.name === "castle").pos;
  const skey = jutils.jpos2key(start);
  const { dist, prev } = jdijkstra([skey], graph);
  const flowfield = {};
  Object.entries(prev).forEach(([key, pkey]) => {
    const pos = jutils.jkey2pos(key);
    const ppos = jutils.jkey2pos(pkey);
    const offset = jutils.subV(ppos, pos);
    flowfield[key] = offset;
  });
  return flowfield;
}
