# Object alignment in C++

When you think about how an object in C++ is represented in memory you have to be aware of alignment [\[1\]](#1).  
Structs and struct fields are aligned on memory word boundaries to make sure the memory access is efficient.  
For example reading a primitive data type like int64_t on a x86-64 architecture results in a single memory word access
when this object is aligned at 8 byte boundary.

If the object is not aligned properly - accessing such an object could result in unnecessary reading of multiple memory words.  
To make matters worse, when the second part of the object is in a separate page within a virtual memory system - a TLB miss or a page fault
may occur [\[2\]](#2).  
This would hurt the performance even more.

The alignment of a struct is the strictest (largest) alignment of any of its members
and compiler may add padding between members to ensure proper alignment.

Let us see how structs are represented in memory in C++ and their size and alignment using this helper function:
```cpp
template<typename T>;
void printTypeSizeAlign(const T&; value)
{
	std::cout <<; std::format("sizeof({}): {} bytes, align: {} bytes\n", typeid(value).name(), sizeof(value), alignof(T));
}
```

In a simple scenario we have the expected each field take 4 bytes and this is the alignment of the struct.
```cpp
struct TwoInts
{
	int first{};
	int second{};
};
TwoInts x;
printTypeSizeAlign(x);	
// sizeof(struct TwoInts): 8 bytes, align: 4 bytes
```

An empty struct takes the minimum addressable size in computer memory - a single byte.  
The size is also non zero because distinct instances of an empty struct should have distinct addresses [\[3\]](#3).

```cpp
struct Empty {};
Empty x;
printTypeSizeAlign(x);
//sizeof(struct Empty): 1 bytes, align: 1 bytes
```

A struct inheriting from an empty base [\[3\]](#3) have the empty base optimized away from the object layout in memory,
which results in expected 4 byte size/ alignment.
```cpp
struct ChildOfEmpty : public Empty
{
	int first{};
};
ChildOfEmpty x;
printTypeSizeAlign(x);
// sizeof(struct ChildOfEmpty): 4 bytes, align: 4 bytes
```

To make sure that the larger field (int second) is aligned on a 4 byte boundary a compiler
has to insert a 2 byte padding. This results in a larger size of the object than the sum of its members (6 bytes).
```cpp
struct ShortAndInt
{
	short first{};
	int second{};
};
ShortAndInt x;
printTypeSizeAlign(x);
// sizeof(struct ShortAndInt): 8 bytes, align: 4 bytes
```

This highlights the importance of order of the members and generally it is preferable to declare larger fields before
smaller fields to avoid wasting space on padding.
```cpp
struct IntAndTwoShorts
{
	int first{};
	short second{};
	short third{};
};
IntAndTwoShorts x;
printTypeSizeAlign(x);
// sizeof(struct IntAndTwoShorts): 8 bytes, align: 4 bytes
```

A stricter alignment (with larger alignment requirement) can be requested using alignas [\[4\]](#4).  
Note that it still has to be a power of two and cannot be smaller than the sum of the size of the elements.
```cpp
struct alignas(alignof(double)) StricterAlignmentStruct
{
	int first;
};
StricterAlignmentStruct x;
printTypeSizeAlign(x);
// sizeof(struct StricterAlignmentStruct): 8 bytes, align: 8 bytes
```

Let us also see the effect on the size and alignment when bit fields are used.

```cpp
struct TwoChars
{
	char first;
	char second;
};

struct BitFieldStruct
{
	char first : 4;
	char second : 4;
};
TwoChars x1;
printTypeSizeAlign(x1);
BitFieldStruct x2;
printTypeSizeAlign(x2);
// sizeof(struct TwoChars): 2 bytes, align: 1 bytes
// sizeof(struct BitFieldStruct): 1 bytes, align: 1 bytes
```

To finish this topic - to see what is the largest alignment for all scalar types on the current platform:
```cpp
std::cout << "Max scalar type alignment on this platform: " << alignof(std::max_align_t);
// Max scalar type alignment on this platform: 8
```

All code for this topic is available on [Github]("https://github.com/ivan-golubev/structsinmemory").

<a name="1">\[1\] [Cppreference - Alignment](https://en.cppreference.com/w/cpp/language/object#Alignment)</a>

<a name="2">\[2\] [Data structure alignment Wiki](https://en.wikipedia.org/wiki/Data_structure_alignment)</a>

<a name="3">\[3\] [Cppreference - Empty base optimization](https://en.cppreference.com/w/cpp/language/ebo)</a>

<a name="4">\[4\] [Cppreference - align as specifier](https://en.cppreference.com/w/cpp/language/alignas)</a>
