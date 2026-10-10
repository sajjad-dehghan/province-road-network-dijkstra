CXX ?= g++
CXXFLAGS ?= -std=c++17 -Wall -Wextra -Wpedantic -O2
SOURCES := $(wildcard src/*.cpp)
HEADERS := $(wildcard include/*.hpp)
all: app
app: $(SOURCES) $(HEADERS)
	$(CXX) $(CXXFLAGS) -Iinclude $(SOURCES) -o $@
test: app tests/route-tests
	./tests/route-tests
	node --test tests/*.test.mjs
tests/route-tests: tests/route-tests.cpp src/Map.cpp src/GPS.cpp $(HEADERS)
	$(CXX) $(CXXFLAGS) -Iinclude tests/route-tests.cpp src/Map.cpp src/GPS.cpp -o $@
.PHONY: all test
