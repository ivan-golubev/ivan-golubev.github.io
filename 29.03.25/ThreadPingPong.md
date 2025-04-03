# Multithreaded ping pong in C++

Imagine you have a couple of threads and want to send messages between them in C++.  
How to do this without getting **race conditions** and **busy waits** ?  
Glad you asked !

Let's create a struct with a string payload and a counter to keep track of the message number.

```cpp
struct Message {
	int counter;
	std::string message;
};
```

We will need a queue to pass the messages and condition variable to
notify the other thread about an available message.  
A mutex has to be acquired in order to use the condition variable,
so let's define it too.  
Finally we would want to exit both threads gracefully, so let's create a stop source.

```cpp
int main() {
	std::mutex mtx;
	std::condition_variable cv;
	std::queue<Message> msg_queue;
	std::stop_source stop_src;
	//...
}
```

Both threads will run the same function, so let's declare it.
```cpp
void runPingPong(std::mutex& mtx, std::condition_variable& cv, std::queue<Message>& msg_queue, std::stop_source& stop_src) {
	// ...
}
```

In the main function we would create two threads and pass all the
arguments to this newly declared function by reference.
```cpp
int main() {
	// ...
	std::jthread t1(runPingPong, std::ref(mtx), std::ref(cv), std::ref(msg_queue), std::ref(stop_src));
	std::jthread t2(runPingPong, std::ref(mtx), std::ref(cv), std::ref(msg_queue), std::ref(stop_src));
	//...
}
```

`std::ref` is a helper function template, which generates an object of type `std::reference_wrapper`.  
`std::reference_wrapper` is used to pass objects by reference to the constructor of `std::thread` [\[1\]](#1).  
Note that by default the arguments to the thread function are moved or copied by value [\[2\]](#2).

Let's implement the body of the runPingPong function.  
We request a stop token from the `stop_source` to use it later
in order to request a thread exit.  
Thread id is fetched for logging purposes.  
Most importantly we use `unique_lock` to access the mutex.

```cpp
void runPingPong(/* ... */) {
	std::stop_token stop_tkn = stop_src.get_token();
	std::thread::id this_id = std::this_thread::get_id();
	std::unique_lock lck(mtx, std::defer_lock);
	//...
}
```

Destructor of the unique_lock will unlock the mutex if the scope of this function is exited naturally or via an exception.

A `unique_lock` is used instead of a `scoped_lock` because we will use
`lock/ unlock` methods in each iteration [\[3\]](#3).  
`scoped_lock` uses RAII style of acquiring the mutex in a constructor, which is not suitable for our use case.

When instantiating this lock, we specify `std::defer_lock`, which means the lock is no aquired upon construction.

Let's write the main loop for our threads.  
The code will run until the stop is requested by one of the threads.  
It is important that the mutex has to be acquired before this thread
waits on a condition variable.

```cpp
while (!stop_tkn.stop_requested()) 
{
	lck.lock();
	cv.wait(lck, [&msg_queue]{ return !msg_queue.empty(); }); // << mutex release and thread suspended here
	// ...
}
```

The condition variable atomically releases the mutex and suspends
the thread execution until the message queue is not empty [\[4\]](#4).  
Another thread can notify this thread, which would wake it up.  
Then the thread would atomically acquire the mutex and check the condition again.

When the call to `cv.wait()` returns - this means the message queue is not empty. It is also safe to access the shared memory because the mutex is acquired.

Let's print the message from the current thread, increment the message counter and pass it to another thread.  
`std::osyncstream(std::cout)` is needed to synchronize access to standard output from a multithreaded program.

Don't forget to manually release the lock and notify the other thread.

```cpp
while (!stop_tkn.stop_requested()) 
{
	// ...
	Message incoming_msg = msg_queue.front();
	msg_queue.pop();
	std::osyncstream(std::cout) << std::format("T[{}] received [c={}, t={}]", this_id, incoming_msg.counter, incoming_msg.message) << "\n";
	int counter = incoming_msg.counter + 1;
	if (counter <= 100)
	msg_queue.emplace(counter, std::format("Hello from T[{}]", this_id));
	else
		stop_src.request_stop(); // final message sent - close the communication channels
	lck.unlock();
	cv.notify_one();
	std::this_thread::sleep_for(10ms);
}
```

Keep running the threads until 100 messages are processed.  
Also added a 10 ms sleep to avoid a thread starvation.  
Access to the messages in the queue has to be fair.

To kick start the process we have to push the first message into the queue
before creating both threads:
```cpp
msg_queue.emplace(0, "first message");
{
	std::jthread t1(/*...*/);
	std::jthread t2(/*...*/);
}
std::osyncstream(std::cout) << "Finished execution\n";

```

If we run the program - we will see the following output.
```bash
T[10944] received [c=0, t=first message]
T[46168] received [c=1, t=Hello from T[10944]]
T[46168] received [c=2, t=Hello from T[46168]]
T[10944] received [c=3, t=Hello from T[46168]]
...
T[46168] received [c=99, t=Hello from T[10944]]
T[10944] received [c=100, t=Hello from T[46168]]
```

Wait a second - why we never see the "Finished execution" message and the program keeps running ?  
Turned out that one thread requested stop and the exited correctly.

The second thread was woken up on the condition variable, then checked that the queue is still empty and
went back to sleep !

Let's fix that.

```cpp
while (!stop_tkn.stop_requested())
{
	lck.lock();
	cv.wait(lck, [&msg_queue, &stop_tkn] { return !msg_queue.empty() || stop_tkn.stop_requested(); });

	if (stop_tkn.stop_requested())
		return;
	// ...
}
```

Now if we run the program we will get the expected behaviour - both threads finished execution and the main thread exits and the process terminates.

```bash
T[51192] received [c=0, t=first message]
T[41828] received [c=1, t=Hello from T[51192]]
T[41828] received [c=2, t=Hello from T[41828]]
...
T[51192] received [c=100, t=Hello from T[41828]]
Finished execution
```

All code for this topic is available on [Github](https://github.com/ivan-golubev/thread-ping-pong).  
Make sure when generating a ninja/clang project via cmake or a VS2022 project - that you have the latest
clang installed / latest VS2022 update.  
`std::format` was added in C++20 standard.

<a name="1">\[1\] [Reference Wrapper](https://en.cppreference.com/w/cpp/utility/functional/reference_wrapper)</a>

<a name="2">\[2\] [Thread](https://en.cppreference.com/w/cpp/thread/thread/thread)</a>

<a name="3">\[3\] [unique_lock](https://en.cppreference.com/w/cpp/thread/unique_lock)</a>

<a name="4">\[4\] [conditional_variable](https://en.cppreference.com/w/cpp/thread/condition_variable)</a>
