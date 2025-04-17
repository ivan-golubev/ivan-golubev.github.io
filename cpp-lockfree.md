# Using atomics for lock free programming in C++

A simple way to avoid **race conditions** and **Undefined Behavior (UB)** when accessing shared memory for read-writes from multiple threads
is to use mutexes.

However this is not the only way. An alternative is to use the properties of atomic instructions provided by your computer architecture.

In this post I will cover the important aspects of lock-free programming.  
A very good source I have used to summarize the theory on this topic is **C++ Concurrency in Action** [\[1\]](#1).

All data in a C++ program is made up of objects - a region of storage, which could hold scalar values such as chars, ints or composite structures such as `mystruct*`.

```cpp
int scalar;
struct mystruct {
  int x;
  int y: 16;
  int z: 16;
};
```
Usually each object will occupy at least one memory location. Variables of fundamental types such as `int` and `char` occupy exactly one memory location.
In this example variables `y` and `z` are adjacent bitfields and will share the same `integer` location and the total size of the struct will be 64 bytes.

This part is crucial for multithreaded apps in C++: everything hinges on those memory locations.
There cannot be race conditions when two threads access separate memory locations.  
Moreover, even if the same memory location is accessed read-only from multiple threads - no synchronization or protection is needed.  

When at least one of the threads is modifying the data - there is a potential for a race condition.  
To avoid this - an enforced ordering between accesses in the two threads is needed.  

One way to enforce ordering is to use mutexes. Another - atomic operations either on the same or other memory locations.  
Every object in a C++ program has a modification order composed of all the writes to that object from all threads, starting with the object's initialization.

For non-atomic types a programmer is responsible for making certain that there's sufficient synchronization to ensure threads agree on the modification order of each variable.  
If different threads see distinct sequences of values for a single variable, you have a **data race** and **UB**.

`std::atomic<>` class template defines atomic types for scalar types on the current platform. On most popular platforms it's expected that the atomic variants of all the built-in types are lock-free, but it isn't guaranteed.  
Use `std::atomic<T>::is_always_lock_free` to check if the current platform provides the necessary instructions.

The operations on the atomic types are `load()`, `store()`, `compare_exchange_strong()`, `compare_exchange_weak()`.  
Each of this operations has an optional memory-ordering argument.

For store operations: `memory_order_relaxed`, `memory_order_release`, `memory_order_seq_cst`.

For load operations: `memory_order_seq_cst`, `memory_order_acquire`, `memory_order_seq_cst`.

For read-modify-write operations: `memory_order_relaxed`, `memory_order_acquire`, `memory_order_release`, `memory_order_acq_rel`, `memory_order_seq_cst`.

Compare-exchange operation is the cornerstone of programming with atomic types. The are two flavours: `std::atomic<T>::compare_exchange_strong` and `std::atomic<T>::compare_exchange_weak`.  
It compares the value of an atomic variable with a supplied expected value and stores the supplied desired value if they are equal  [\[2\]](#2).  
If the values aren't equal, the expected value is updated with the value of the atomic variable.  
When store was performed the compare_exchange function returns `true`.

The `weak` version might not succeed even if the expected value was seen. This spurios failure can happen on machines lacking a single compare-and-exchange instruction.  
The compare-exchange functions can take two memory ordering parameters: success - the memory synchronization ordering for the read-modify-write operation if the comparison succeeds;
failure - the memory sync ordering for the load operation if the comparison fails.

Suppose you have two threads, one of which is populating a data structure to be read by the second.  
To avoid race conditions an atomic flag is used. For this to work there must be an enforced ordering.  
It comes from the operations on `std::atomic<bool>` - they provide the necessary ordering via the memory model relations: `happens-before` and `synchronizes-with`.

When you have an enforced ordering the write of the data `happens-before` the read of the data.  
The main idea is this: a suitably tagged atomic write operation on a variable `x`, `synchronizes-with` a suitably tagged atomic read operation on `x`.  
As for this tagging - there are three models:  
1. sequentially consistent  
2. acquire-release ordering  
3. relaxed ordering

Sequential consistency is the most straightforward and intuitive ordering, but also the most expensive because it requires global synchronization between all threads.  
On a multiprocessor system this may require extensive and time consuming communication between processors.

To avoid this cost you have to use non-sequentially consistent memory orderings where there is no longer a single global order of events.  
It is not just that the compiler can reoder the instructions. Even if the threads are running the same bit of code, they can disagree on the order of events, because
the different CPU caches and internal buffers can hold different values for the same memory.

The opposite of the sequentially consistent model is the relaxed ordering where no synchronization is happening. Relaxed atomic operations must be used in combination with atomic operations that feature stronger ordering semantics in order to be useful for inter-thread synchronization.

One way to achieve additional synchronization without the overhead of full-blown sequential consistency is to use `acquire-release` ordering.

Under this ordering model, atomic loads are `acquire` operations, atomic store are `release` operations, and atomic read-modify-write operations
are either `acquire`, `release` or both (`memory_order_acq_rel`). When this model is used,  a `release` operation `synchronizes-with` an `acquire` operation that reads the value written.

As an example, let us implement a Stack datastructure, which is thread-safe, but does not rely on a mutex (i.e. is lock-free) and does not use the sequential memory ordering when.

We will have a `Node` struct, which will be used to chain nodes.  
The top of the stack is an atomic variable.
```cpp
struct Node {
	int data;
	Node* next{nullptr};
};

class Stack {
private:
	std::atomic<Node*> top{nullptr};
public:
	bool empty();
	void push(int value);
	int pop();	
};
```
Let's implement the methods of the stack.  
First we check if it is empty.
```cpp
bool Stack::empty()
{
	Node* node = top.load(std::memory_order::acquire);
	return node == nullptr;
}
```
Then to add new values into the stack - we create a new Node and try to atomically swap it with the current top of the stack.
```cpp
void Stack::push(int value)
{
	Node* node = new Node{ value };
	node->next = top.load(std::memory_order::relaxed);
	while (!top.compare_exchange_weak(node->next, node, std::memory_order::release, std::memory_order::relaxed))
		;
}
```
This has to happen in a loop because the swap will not succeed when the expected value (the first argument) of the top is not the same as what we have assigned to
the new Node->next variable. When this fails - the instruction overwrites the node->next variable and tries again.

Finally the method returns when the top of the stack is correctly updated. Note that the `memory_order_release` is used to make this operation
visible to other threads. `std::memory_order::release` is enough because we only need to publish a new `top` node to other threads.

Now to the `pop` operation. Here we have to get the current top of the stack and set the top of the stack to the next node.  
This can be done in a thread-safe way using `compare_exchange_weak` on the atomic `top` variable with the help of the `std::memory_order::acq_rel`.

```cpp
int Stack::pop()
{
	Node* node = top.load(std::memory_order::acquire);
	while (!top.compare_exchange_weak(node, node->next, std::memory_order::acq_rel, std::memory_order::relaxed))
		;
	int data = node->data;
	delete node;
	return data;
}
```
We use `acq_rel` because `acquire` is needed to safely read `node->next` and `release` to ensure the `top` update is visible to other threads.

Please note that calling `pop()` on an empty stack is **UB** just as in the stack data structure in STL: you have to check the precondition with `Stack::empty()` method.

Let's add a couple of functions to push and pop values into/from this stack.  
The first function will periodically (every 100 milliseconds) push values into the stack until a stop is requested.  
The second function will periodically pop values from the stack and when a stop is requested - it will pop all remaining values from the stack.
```cpp
void push_values(Stack& stack, std::stop_source& stop_src)
{
	int value = 0;
	std::stop_token stop_tkn = stop_src.get_token();
	while (!stop_tkn.stop_requested())
	{
		stack.push(++value);
		std::osyncstream(std::cout) << std::format("<- pushed {}\n", value);
		std::this_thread::sleep_for(100ms);
	}
}

void pop_values(Stack& stack, std::stop_source& stop_src)
{
	std::stop_token stop_tkn = stop_src.get_token();
	// if stop is requested - keep popping until the stack is empty
	while (!stop_tkn.stop_requested() || stop_tkn.stop_requested() && !stack.empty())
	{
		if (!stack.empty())
			std::osyncstream(std::cout) << std::format("  -> popped {}\n", stack.pop());
		std::this_thread::sleep_for(100ms);
	}
}
```
Let us start two threads that will push new values and one thread to pop values from the stack.
```cpp
int main()
{
	Stack stack;
	std::stop_source stop_src;
	{
		std::jthread t1(push_values, std::ref(stack), std::ref(stop_src));
		std::jthread t2(push_values, std::ref(stack), std::ref(stop_src));
		std::jthread t3(pop_values, std::ref(stack), std::ref(stop_src));
		std::this_thread::sleep_for(1s);
		stop_src.request_stop();
	}
	assert(stack.empty());
	return 0;
}
```
After one second we request a stop. The expected behavior - threads `t1` and `t2` will stop adding new values.  
Then thread `t3` will keep popping the values until the stack is empty.

Let's run the code and see the console output:
```bash
<- pushed 1
<- pushed 1
  -> popped 2
<- pushed 2
<- pushed 2
<- pushed 3
  -> popped 3
<- pushed 3
<- pushed 4
  -> popped 4
<- pushed 4
<- pushed 5
<- pushed 5
  -> popped 5
<- pushed 6
<- pushed 6
  -> popped 6
<- pushed 7
  -> popped 7
<- pushed 7
<- pushed 8
  -> popped 8
<- pushed 8
<- pushed 9
  -> popped 9
<- pushed 9
<- pushed 10
<- pushed 10
  -> popped 10
  -> popped 10
  -> popped 9
  -> popped 8
  -> popped 7
  -> popped 6
  -> popped 5
  -> popped 4
  -> popped 3
  -> popped 2
  -> popped 1
  -> popped 1

lockfree.exe (process 27392) exited with code 0 (0x0).
```
The main thread joins on all worker threads upon exit from the scope where `std::jthreads` are created.  
Once all worker threads exit - we can assert that the stack is empty.

However one has to be careful with such asserts - here we add values at double the rate (threads `t1` and `t2`) at which we remove them (thread `t3`).

If there were only one thread to push values and different sleep timings were used we could get a situation when the thread running the `pop_values()` function was the first
to receive the stop request and the stack was empty at that point. As a result this thread exits.  
At the same time the thread running the `push_values()` function was in the body of the while loop pushing a new value.
It will only check the stop signal at the next iteration.  
As a result - the last value will not be popped and the assert will trigger in the main thread.

As we can see in this example - we created a thread-safe stack without relying on mutexes (i.e. it is lock free) and sequentially consistent memory order.  

All code for this topic is available on [Github](https://github.com/ivan-golubev/cpp-lock-free-stack).

<a name="1">\[1\] [C++ Concurrency in Action, Second Edition. Anthony Williams. 2019](https://www.manning.com/books/c-plus-plus-concurrency-in-action-second-edition)</a>

<a name="2">\[2\] [cppreference - Compare Exchange](https://en.cppreference.com/w/cpp/atomic/atomic/compare_exchange)</a>

