#pragma once
#include <cstdint>
#include <limits>
#include <utility>
#include <vector>
namespace routing {
using Cost = std::int64_t;
constexpr Cost INF = std::numeric_limits<Cost>::max();
using Graph = std::vector<std::vector<std::pair<std::size_t, Cost>>>;
struct Route { bool reachable = false; Cost cost = 0; std::vector<std::size_t> path; };
Route dijkstra(const Graph& graph, std::size_t start, std::size_t end);
}
