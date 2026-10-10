#pragma once
#include <queue>
class Queue {
    std::queue<int> values_;
public:
    bool isEmpty() const { return values_.empty(); }
    void enqueue(int value) { values_.push(value); }
    void dequeue() { if (!values_.empty()) values_.pop(); }
    int front() const { return values_.empty() ? -1 : values_.front(); }
};

