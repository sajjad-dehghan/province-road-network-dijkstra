#include "../include/GPS.hpp"
#include <algorithm>
#include <functional>
#include <queue>
#include <stdexcept>
routing::Route routing::dijkstra(const Graph& graph, std::size_t start, std::size_t end) {
    if (start >= graph.size() || end >= graph.size()) throw std::invalid_argument("Unknown endpoint");
    for (const auto& edges : graph)
        for (const auto& edge : edges)
            if (edge.first >= graph.size() || edge.second < 0) throw std::invalid_argument("Invalid road");
    std::vector<Cost> distance(graph.size(), INF);
    std::vector<std::size_t> parent(graph.size(), graph.size());
    using Entry = std::pair<Cost, std::size_t>;
    std::priority_queue<Entry, std::vector<Entry>, std::greater<Entry>> pending;
    distance[start] = 0;
    pending.push({0, start});
    while (!pending.empty()) {
        const auto [cost, node] = pending.top();
        pending.pop();
        if (cost != distance[node]) continue;
        if (node == end) break;
        for (const auto& [next, weight] : graph[node]) {
            if (cost > INF - weight) continue; // no signed overflow
            const auto candidate = cost + weight;
            if (candidate < distance[next]) {
                distance[next] = candidate; parent[next] = node;
                pending.push({candidate, next});
            }
        }
    }
    if (distance[end] == INF) return {};
    Route result{true, distance[end], {}};
    for (auto node = end;; node = parent[node]) {
        result.path.push_back(node);
        if (node == start) break;
    }
    std::reverse(result.path.begin(), result.path.end());
    return result;
}
