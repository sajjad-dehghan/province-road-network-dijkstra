#include "../include/Map.hpp"
#include <algorithm>
#include <regex>
#include <stdexcept>
void Map::addCity(const City& city) {
    static const std::regex name(R"([A-Za-z_][A-Za-z0-9_-]*)");
    if (!std::regex_match(city.city_name, name) || !std::regex_match(city.province_name, name) ||
        city.id <= 0 || (city.type != "BG" && city.type != "NON_BG"))
        throw std::invalid_argument("Invalid city: use positive id, valid name and BG/NON_BG type");
    if (index_.count(city.key())) throw std::invalid_argument("Duplicate city");
    for (const auto& existing : cities_)
        if (existing.province_name == city.province_name && existing.id == city.id)
            throw std::invalid_argument("Duplicate city id in province");
    index_[city.key()] = cities_.size();
    cities_.push_back(city); graph_.emplace_back();
    auto& province = provinces_[city.province_name];
    province.name = city.province_name; province.cities.push_back(city.key());
}
void Map::addRoad(const std::string& from, const std::string& to, routing::Cost cost) {
    if (cost < 0 || cost >= routing::INF) throw std::invalid_argument("Road cost must be nonnegative and below INT64_MAX");
    if (!index_.count(from) || !index_.count(to)) throw std::invalid_argument("Unknown city in road");
    const auto a = index_.at(from), b = index_.at(to);
    if (a == b) throw std::invalid_argument("A road needs two different cities");
    if (cities_[a].province_name != cities_[b].province_name &&
        (cities_[a].type != "BG" || cities_[b].type != "BG"))
        throw std::invalid_argument("Cross-province roads require two BG cities");
    const auto set = [cost](auto& edges, std::size_t target) {
        auto it = std::find_if(edges.begin(), edges.end(), [target](const auto& edge) { return edge.first == target; });
        if (it == edges.end()) edges.push_back({target, cost}); else it->second = cost;
    };
    set(graph_[a], b); set(graph_[b], a);
}
routing::Route Map::find(const std::string& from, const std::string& to, bool localOnly) const {
    if (!index_.count(from) || !index_.count(to)) throw std::invalid_argument("Unknown route endpoint");
    if (!localOnly) return routing::dijkstra(graph_, index_.at(from), index_.at(to));
    const auto& province = cities_[index_.at(from)].province_name;
    if (province != cities_[index_.at(to)].province_name) throw std::invalid_argument("Local routes need one province");
    auto local = graph_;
    for (std::size_t i = 0; i < local.size(); ++i)
        local[i].erase(std::remove_if(local[i].begin(), local[i].end(), [&](const auto& edge) {
            return cities_[i].province_name != province || cities_[edge.first].province_name != province;
        }), local[i].end());
    return routing::dijkstra(local, index_.at(from), index_.at(to));
}
bool Map::execute(const std::string& line, std::ostream& out) {
    const auto first = line.find_first_not_of(" \t\r");
    if (first == std::string::npos || line.compare(first, 2, "//") == 0 || line.substr(first) == "-1") return false;
    std::smatch match;
    static const std::regex city(R"(^\s*CREATE\s*\(([A-Za-z_][A-Za-z0-9_-]*):\s*Node,\s*\{id:\s*'([0-9]+)',\s*Type:\s*'(BG|NON_BG)'\},\s*([A-Za-z_][A-Za-z0-9_-]*):\s*province\)\s*$)");
    static const std::regex road(R"(^\s*CREATE\s*\(([A-Za-z_][A-Za-z0-9_-]*)\.([A-Za-z_][A-Za-z0-9_-]*)\)\s*(?:-|–)\s*\[:ROAD\s*\{cost:([0-9]+)\}\]\s*(?:-|–)>\s*\(([A-Za-z_][A-Za-z0-9_-]*)\.([A-Za-z_][A-Za-z0-9_-]*)\)\s*$)");
    static const std::regex query(R"(^\s*(FIND|LOCAL)\s+([A-Za-z_][A-Za-z0-9_-]*\.[A-Za-z_][A-Za-z0-9_-]*)\s*->\s*([A-Za-z_][A-Za-z0-9_-]*\.[A-Za-z_][A-Za-z0-9_-]*)\s*$)");
    if (std::regex_match(line, match, city)) {
        addCity({match[4], match[1], match[3], std::stoi(match[2])});
    } else if (std::regex_match(line, match, road)) {
        addRoad(match[2].str() + "." + match[1].str(), match[5].str() + "." + match[4].str(), std::stoll(match[3]));
    } else if (std::regex_match(line, match, query)) {
        const auto route = find(match[2], match[3], match[1] == "LOCAL");
        if (!route.reachable) out << "No route from " << match[2] << " to " << match[3] << "\n";
        else {
            out << "Cost: " << route.cost << "\nPath: ";
            for (std::size_t i = 0; i < route.path.size(); ++i)
                out << (i ? " -> " : "") << cities_[route.path[i]].key();
            out << "\n";
        }
        return true;
    } else throw std::invalid_argument("Invalid command; expected CREATE, FIND or LOCAL");
    return false;
}
