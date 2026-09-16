# Sapp — Province Road Network Route Finder

A C++ data structures project that models provinces, cities, and roads as graphs and uses Dijkstra's algorithm to find minimum road costs within a province and between provinces.

![C++](https://img.shields.io/badge/language-C%2B%2B-00599C?logo=cplusplus&logoColor=white)
![Build](https://img.shields.io/badge/build-g%2B%2B%20%2B%20Makefile-lightgrey)

## How it works

The map has two levels:

- **Local graphs** — each `Province` stores its cities in an adjacency matrix (`local_matrix`).
- **Foreign graph** — cities of type `BG` (the nodes that connect provinces) are also placed in a shared matrix that holds the roads *between* provinces.

The program runs these steps:

1. **Build the map** — read the number of provinces (must be greater than 2) and the number of cities in each (must be greater than 4), then one `CREATE` node command per city. Duplicate city names are rejected.
2. **Add roads** — read `CREATE ... [:ROAD {cost:N}] ...` commands until `-1` is entered. A road between two cities of the same province goes into that province's local matrix; a road between provinces goes into the foreign matrix.
3. **Compute minimum costs** — run Dijkstra (`GPS::Dijkstra_local` and `GPS::Dijkstra_foreign`) from every node and replace the matrices with shortest-path costs, then print both matrices.
4. **Answer a query** — read a `FIND Province.City->Province.City` command. For a route between two provinces, the program prints the total cost: the local cost from the start city to its province's `BG` node, plus the `BG`-to-`BG` cost, plus the local cost to the destination.

## Command format

`input/input.txt` shows the command syntax with three provinces (Qom, Yazd, Tabriz):

```text
CREATE (A: Node, {id: '1', Type: 'NON_BG'}, Qom: province)
CREATE (B: Node, {id: '2', Type: 'BG'}, Qom: province)
...
CREATE (B.Qom) – [:ROAD {cost:7}] –> (N.Tabriz)
CREATE (E.Qom) – [:ROAD {cost:50}] –> (A.Qom)
...
FIND Qom.C->Tabriz.N
```

The program reads everything interactively from standard input. The sample file lists the
node, road, and query commands, but not the province/city counts or the `-1` terminator that
the program also asks for. It is a reference for the syntax, not a file you can pipe in unchanged.

## Classes

| Class | File | Role |
| --- | --- | --- |
| `App` | `include/app.hpp`, `src/app.cpp` | Runs the whole flow in its constructor (build map → roads → shortest paths → query) |
| `Map` | `include/Map.hpp`, `src/Map.cpp` | Parses commands, builds the local and foreign matrices, answers `FIND` queries |
| `Province` | `include/Province.hpp`, `src/Province.cpp` | Holds up to 10 cities and the province's local adjacency matrix |
| `City` | `include/City.hpp`, `src/City.cpp` | City name, id, type (`BG` / `NON_BG`), and province name |
| `GPS` | `include/GPS.hpp`, `src/GPS.cpp` | Dijkstra shortest paths over the local and foreign matrices |
| `Queue` | `include/Queue.hpp`, `src/Queue.cpp` | Linked-list queue (`enqueue`, `dequeue`, `front`, `isEmpty`) |

## Project structure

```
Sapp_DS_PRJ/
├── include/
│   ├── app.hpp
│   ├── City.hpp
│   ├── GPS.hpp
│   ├── Map.hpp
│   ├── Province.hpp
│   └── Queue.hpp
├── src/
│   ├── main.cpp
│   ├── app.cpp
│   ├── City.cpp
│   ├── GPS.cpp
│   ├── Map.cpp
│   ├── Province.cpp
│   └── Queue.cpp
├── input/
│   └── input.txt        # sample commands
├── .vscode/             # VS Code settings and a MinGW g++ build task
└── Makefile
```

## Building

The project uses `g++`. `Map.hpp` declares member functions with `auto` parameters, which
requires a compiler that accepts that GNU extension or C++20. Sources include
`<bits/stdc++.h>`, so the code targets GCC/MinGW.

The `Makefile` compiles and links everything into an executable named `app`:

```bash
make
```

The Makefile refers to `src/Main.cpp` and `src/App.cpp`, while the files are named
`main.cpp` and `app.cpp`. As written, it only works on a case-insensitive file system such as
Windows. The `-Isfml/include` flag points to a directory that is not part of the repository
and is not needed by the current code.

## Notes

- Sizes are fixed at compile time: up to 10 provinces and 10 cities per province (`SIZE_OF_PROVINCE`, `SIZE_OF_CITY`).
- `App::splashScreen()` prints an ASCII "Sapp" banner, but its call is commented out.
- Route output currently reports the total cost for routes between provinces. The same-province branch collects nodes in the queue but does not print a result.
