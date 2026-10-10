#pragma once
#include "City.hpp"
#include "GPS.hpp"
#include "Province.hpp"
#include <map>
#include <ostream>
#include <string>
#include <vector>
class Map {
    std::vector<City> cities_;
    routing::Graph graph_;
    std::map<std::string, std::size_t> index_;
    std::map<std::string, Province> provinces_;
public:
    void addCity(const City& city);
    void addRoad(const std::string& from, const std::string& to, routing::Cost cost);
    routing::Route find(const std::string& from, const std::string& to, bool localOnly = false) const;
    bool execute(const std::string& line, std::ostream& out);
    const std::vector<City>& cities() const { return cities_; }
    const routing::Graph& graph() const { return graph_; }
};
