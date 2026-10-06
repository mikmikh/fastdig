import { JHeap } from "./jheap.js";

export function jastar(start, finish, graph, u2heur) {
  const prev = {};
  const dist = {};
  const heur = {};
  const visited = new Set();

  const heap = new JHeap((lhs, rhs) => {
    const lv = heur[lhs] ?? 1e9;
    const rv = heur[rhs] ?? 1e9;
    return lv - rv;
  });
  heap.push(start);
  visited.add(start);
  while (heap.length() > 0) {
    const v = heap.pop();
    if (visited.has(v)) {
      continue;
    }
    visited.add(v);

    if (v === finish) {
      return { dist, prev };
    }
    const us = graph[v] ?? [];
    us.forEach(([u, w]) => {
      if (visited.has(u)) {
        return;
      }
      const d = dist[v] + w;
      const h = d + u2heur[u];
      if (!(u in heur) || d < dist[u]) {
        dist[u] = d;
        heur[u] = h;
        prev[u] = v;
        heap.remove(u);
        heap.push(u);
      }
    });
  }

  return null;
}
