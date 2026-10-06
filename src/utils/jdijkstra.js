import { JHeap } from "./jheap.js";

export function jdijkstra(starts, graph) {
  //   const vertices = new Set(Object.keys(graph));
  const dist = {};
  const prev = {};
  const visited = new Set();

  const heap = new JHeap((lhs, rhs) => {
    const ldist = dist[lhs] ?? 1e9;
    const rdist = dist[rhs] ?? 1e9;
    return ldist < rdist;
  });

  //   vertices.forEach((v) => {
  //     dist[v] = 1e5;
  //     prev[v] = null;
  //   });
  starts.forEach((v) => {
    dist[v] = 0;
    prev[v] = v;
    heap.push(v);
  });
  while (heap.length() > 0) {
    const v = heap.pop();

    if (visited.has(v)) {
      continue;
    }
    visited.add(v);
    // console.log("# v", v);
    const us = graph[v] ?? [];
    us.forEach(([u, w]) => {
      if (visited.has(u)) {
        return;
      }
      if (!(u in dist) || dist[v] + w < dist[u]) {
        // console.log("| u", u, w, dist[u]??'unk', '->', dist[v] + w);
        prev[u] = v;
        dist[u] = dist[v] + w;
        heap.remove(u);
        heap.push(u);
      } else {
        // console.log("| u", u, w, dist[u], 'X>', dist[v] + w);
      }
    });
  }
  return { dist, prev };
}
