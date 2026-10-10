#pragma once
#include <string>
struct City {
    std::string province_name, city_name, type;
    int id = 0;
    std::string key() const { return province_name + "." + city_name; }
};
