#include "../include/app.hpp"
#include <fstream>
#include <iostream>
int main(int argc, char* argv[]) {
    App app;
    if (argc > 2) { std::cerr << "Usage: app [commands.txt]\n"; return 1; }
    if (argc == 2) {
        std::ifstream file(argv[1]);
        if (!file) { std::cerr << "Cannot open input file\n"; return 1; }
        return app.run(file, std::cout, std::cerr);
    }
    return app.run(std::cin, std::cout, std::cerr);
}
