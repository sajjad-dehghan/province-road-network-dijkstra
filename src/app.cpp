#include "../include/app.hpp"
#include <exception>
int App::run(std::istream& input, std::ostream& output, std::ostream& errors) {
    Map map; std::string line; std::size_t number = 0; bool failed = false;
    while (std::getline(input, line)) {
        ++number;
        try { map.execute(line, output); }
        catch (const std::exception& error) {
            errors << "Line " << number << ": " << error.what() << "\n"; failed = true;
        }
    }
    return failed ? 1 : 0;
}
