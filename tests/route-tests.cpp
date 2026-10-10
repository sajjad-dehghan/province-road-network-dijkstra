#include "Map.hpp"
#include <sstream>
#include <stdexcept>
#include <iostream>
void check(bool ok) { if (!ok) throw std::runtime_error("Regression failed"); }
template <typename F> void rejects(F action) {
    bool thrown = false;
    try { action(); } catch (const std::exception&) { thrown = true; }
    check(thrown);
}
int main() {
    Map map;
    map.addCity({"P", "A", "BG", 1}); map.addCity({"P", "B", "BG", 2});
    map.addCity({"P", "C", "NON_BG", 3}); map.addCity({"Q", "D", "BG", 1});
    map.addCity({"Q", "E", "BG", 2}); map.addCity({"R", "F", "NON_BG", 1});
    map.addRoad("P.A", "P.B", 100); map.addRoad("P.A", "P.C", 5);
    map.addRoad("P.C", "P.B", 5); map.addRoad("P.A", "Q.D", 1);
    map.addRoad("Q.D", "Q.E", 0); map.addRoad("Q.E", "P.B", 1);
    check(map.find("P.A", "P.B").cost == 2);
    check(map.find("P.A", "P.B", true).cost == 10);
    check(map.find("P.C", "Q.E").cost == 6);
    check(map.find("P.A", "P.A").path.size() == 1);
    check(!map.find("P.A", "R.F").reachable);
    auto before = map.graph(); map.find("P.C", "Q.E"); check(before == map.graph());
    map.addRoad("P.A", "Q.D", 3); check(map.find("P.A", "Q.D").cost == 3);
    rejects([&] { map.addRoad("P.C", "Q.D", 5); });
    rejects([&] { map.addRoad("P.A", "P.B", -1); });
    rejects([&] { map.find("missing", "P.B"); });
    rejects([&] { map.addCity({"P", "A", "BG", 5}); });
    rejects([&] { map.addCity({"P", "Z", "BG", 1}); });
    rejects([&] { map.find("P.A", "Q.E", true); });
    Map large;
    for (int i = 1; i <= 100; ++i) large.addCity({"Big", "N" + std::to_string(i), "BG", i});
    for (int i = 1; i < 100; ++i) large.addRoad("Big.N" + std::to_string(i), "Big.N" + std::to_string(i + 1), 1);
    check(large.find("Big.N1", "Big.N100").cost == 99);
    routing::Graph overflow(3); overflow[0].push_back({1, routing::INF - 2}); overflow[1].push_back({2, 10});
    check(!routing::dijkstra(overflow, 0, 2).reachable);
    std::ostringstream output; Map commands;
    commands.execute("CREATE (A: Node, {id: '1', Type: 'BG'}, P: province)", output);
    commands.execute("CREATE (B: Node, {id: '2', Type: 'BG'}, P: province)", output);
    commands.execute("CREATE (A.P) - [:ROAD {cost:0}] -> (B.P)", output);
    commands.execute("FIND P.A->P.B", output); check(output.str().find("Cost: 0") != std::string::npos);
    rejects([&] { commands.execute("CREATE nonsense", output); });
    std::cout << "C++ routing regression suite passed\n";
}
