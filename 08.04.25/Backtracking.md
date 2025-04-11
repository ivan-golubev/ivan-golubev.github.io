# Backtracking - a common pattern for Leetcode

One of the patterns commonly used to solve Leetcode tasks is called Backtracking.  
Let's take one of the problems marked as 'Hard' - [212 Word Search II](https://leetcode.com/problems/word-search-ii/description/).

*Given an m x n board of characters and a list of strings words, return all words on the board.*

In C++ this would result in the following interface:
```cpp
vector<string> findWords(vector<vector<char>>& board, vector<string>& words);
```
Here `board` is a two-dimensional grid filled with characters and we need to return all words that can be formed on this grid.

The direct solution is to try all possible combinations - for each cell in the board - start forming a word from the input list.
Keep matching each word horizontally and vertically until a mismatch is found.  
When this happens - we can return one step back and try other routes.  
Typically this is implemented via recursion, although an iterative approach is also possible.

Let's draft the overall approach.
```cpp
class Solution {
public:
	vector<string> findWords(vector<vector<char>>& board, vector<string>& words) {
// save the board pointer and the dimensions to avoid passing them over and over again when recursing
		this->board = &board;
        rows = board.size(), columns = board[0].size();
		vector<string> matchedWords;
        for (const string& word: words)
            for (int row=0; row < rows; ++row)
                for (int column=0; column < columns; ++column) {
					if (checkWord(row, column, word, 0))
						matchedWords.push_back(word);
                }
		return matchedWords;
	}
	
	// recursively check if the word can be found from the current location on the board
    bool checkWord(int row, int column, const string& word, int char_index);
private:
    int columns{}, rows{};
    vector<vector<char>>* board;
};
```

Here we just perform an exastive search of each word starting from each cell.  
`checkWord()` is our recursive function, which implements the backtracking approach.
```cpp
bool checkWord(int row, int column, const string& word, int char_index) {
	// ...
	vector<vector<char>>& board_ref = *board;
	if (board_ref[row][column] == word[char_index]) {
		// mark the cell as visited
		char old_value = board_ref[row][column];
		board_ref[row][column] = '_';
		
		bool above = checkWord(row-1, column, word, char_index+1);
		bool below = checkWord(row+1, column, word, char_index+1);
		bool right = checkWord(row, column+1, word, char_index+1);
		bool left = checkWord(row, column-1, word, char_index+1);

		board_ref[row][column] = old_value; // backtrack

		if (above || below || right || left)
			return true;
	}
	return false;
}
};
```
Here we compare the character at the current cell to the first character in the passed word.  
When it matches - we mark the cell as visited by writing an agreed-upon 'visited' value - in this case it is the '_' character.  
And we remember the previous value of this cell on the stack and recurse to all directions horizontally and vertically.

Upon returning from these recursive calls we restore the old value in the cell. This is the backtracking step.  
If any of those recursive calls yielded true - it means this word can be formed on the board and we can exit.

To finish this solution - let's write the conditional for the recursion tail - when the Depth First Search should stop.  
We should stop the search when the end of the search string is reached.
```cpp
bool checkWord(int row, int column, const string& word, int char_index) {		
	if (char_index == word.length()) // recursion tail
		return true;
	// ...
}
```

Additionally - let's make sure we don't go outside of the board boundaries when extending our search horizontally and vertically.
```cpp
bool checkWord(int row, int column, const string& word, int char_index) {		
	// ...
	// board edges
	if (row < 0 || column < 0 || row >= rows || column >= columns)
		return false;
	// ...
}
```

This search is pretty slow and you may notice that we keep searching the same word starting at all cells even if we have already found it.  
To avoid this - we can just jump to the next word using the good old `goto` statement.

Exiting a doubly nested loop is a rare use case where an uncoditional is still handy.  
In fact jumping to label within nested loops is even supported in the Java language.
```cpp
vector<string> findWords(/* ... */) {
	// ...
	for (const string& word: words) {
		for (int row=0; row < rows; ++row)
			for (int column=0; column < columns; ++column) {
					if (checkWord(row, column, word, 0)) {
						matchedWords.push_back(word);
						goto check_next_word; // don't need to check the rest of the board
					}
			}
		check_next_word:
	}
	return matchedWords;
}
```

The full code for this solution would be:
```cpp
class Solution {
public:
    vector<string> findWords(vector<vector<char>>& board, vector<string>& words) {
        this->board = &board;
        rows = board.size(), columns = board[0].size();
        vector<string> matchedWords;
        for (const string& word: words) {
            for (int row=0; row < rows; ++row)
                for (int column=0; column < columns; ++column) {
					if (checkWord(row, column, word, 0)) {
						matchedWords.push_back(word);
						goto check_next_word; // don't need to check the rest of the board
					}
                }
            check_next_word:
        }
        return matchedWords;
    }

    // recursively check if the word can be found from the current location on the board
    bool checkWord(int row, int column, const string& word, int char_index) {
        // recursion tail
        if (char_index == word.length())
            return true;
        // board edges
        if (row < 0 || column < 0 || row >= rows || column >= columns)
            return false;
        vector<vector<char>>& board_ref = *board;
        if (board_ref[row][column] == word[char_index]) {
            // mark the cell as visited
            char old_value = board_ref[row][column];
            board_ref[row][column] = '_';
            
            bool above = checkWord(row-1, column, word, char_index+1);
            bool below = checkWord(row+1, column, word, char_index+1);
            bool right = checkWord(row, column+1, word, char_index+1);
            bool left = checkWord(row, column-1, word, char_index+1);

            board_ref[row][column] = old_value; // backtrack

            if (above || below || right || left)
                return true;
        }
        return false;
    }

private:
    int columns{}, rows{};
    vector<vector<char>>* board;
};
```

It generally works and demonstrates backtracking, but unfortunately this solution will fail for some
extreme test cases - when the input word list is too large.  

If we think about it - this problem is not new - the input list of words forms a 'dictionary' and we are checking
whether we can form a valid word using the alphabet from the board.

To find a word in a dictionary is a pretty common task - for example when you type in a word in a Scrabble game
or search for a translation in the Longman dictionary of English - you are solving the same problem.

A very natural observation would be - words can start with the same prefixes and then branch in the middle of a word.  
In other words - the entire dictionary can be represented at a tree of characters.

In computer science this structure got the name Trie and it is a computationally efficient way of matching multiple words with the same prefix.

In C++ each character can be represented as a Node structure, which holds pointers to the next characters and has a flag indicating
whether the suffix reached so far is a valid word in itself.

The max number of nodes at each level is the size of the alphabet.
```cpp
constexpr int EnglishLowerCaseLetterCount = (int)'z' - (int)'a' + 1;

struct Node{
    std::array<Node*, EnglishLowerCaseLetterCount> children{};
    bool isWord{};
    ~Node() {
        for (Node* child : children)
            delete child;
    }
};

class Trie {
public:
    void Add(const string& word);
    bool Contains(const string& word);
    Node root;
};
```
It is important to use uniform initialization for the array of children to avoid uinitialized pointers. 
Ex. a `nullptr` at `root.children[0]` means there is no word starting with 'a' in the dictionary.  
Conversely valid nodes in `root.children[2]->children[0]->children[19]` mean there is a word 'cat' in the dictionary.

Adding a new word to the dictionary and checking if a word is in the dictionary - are very similar procedures:  
we keep jumping to the next node (next character) until the `isWord` flag is set / is tested.  
As a helper function - `toTrieIndex()` allows us to convert an input character into an index for an array of children.
```cpp
int toTrieIndex(char c) { 
	assert(c >= 'a' && c <= 'z');
	return (int)c - (int)'a'; 
}
	
class Trie {
public:
    void Add(const string& word) {
        Node* current = &root;
        for (char c: word) {
            int ix = toTrieIndex(c);
            if (!current->children[ix])
                current->children[ix] = new Node();
            current = current->children[ix];
        }
        current->isWord = true;
    }

    bool Contains(const string& word) {
        Node* current = &root;
        for (char c: word) {
            int ix = toTrieIndex(c);
            if (!current->children[ix])
                return false;
            current = current->children[ix];
        }
        return current->isWord;
    }
// ...
```

Now let's use this data structure to check what words can be formed starting at each cell on the input board.
```cpp
class Solution {
public:
    vector<string> findWords(vector<vector<char>>& board, vector<string>& words) {
// save the board pointer and the dimensions to avoid passing them over and over again when recursing
        this->board = &board;
        rows = board.size(), columns = board[0].size();

        for (const string& w: words)
            dictionary.Add(w); // build a dictionary

        for (int row=0; row < rows; ++row) {
            for (int column=0; column < columns; ++column) {
                Node* root = &dictionary.root;
				// recursively check what words can be form starting from the root
                checkDictionary(row, column, "", root);
            }
        }
		// to avoid passing matched words outside of a recursive tree - we use a set of words in the current class to store the results
        std::vector<string> result(matchedWords.begin(), matchedWords.end());
        return result;
    }
private:
    int columns{}, rows{};
    vector<vector<char>>* board;
    Trie dictionary;
    unordered_set<string> matchedWords;
```

The main search is implemented here. Overall - it is the same extensive search with backtracing, but now we match multiple words
at the same time using the Trie data structure, which results in a faster overall search.

Here we sacrificed a bit of incapsulation and just exposed the root of the Trie (made it `public`), so that the search algorithm
can access the nodes directly.

```cpp
// recursively check if the word can be found from the current location on the board
bool checkDictionary(int row, int column, string prefix, Node* node) { // have to carry around the prefix, otherwise we don't know the word
	if (node->isWord)
		matchedWords.insert(prefix);
	// board edges
	if (row < 0 || column < 0 || row >= rows || column >= columns)
		return false;
	vector<vector<char>>& board_ref = *board;
	// check if the current character is in the Trie:
	char c = board_ref[row][column];
	if (board_ref[row][column] == '_')
		return false; // already visited
	int ix = toTrieIndex(c);
	Node* nextNode = node->children[ix];
	if (nextNode) {
		// mark the cell as visited
		char old_value = board_ref[row][column];
		board_ref[row][column] = '_';
		
		string new_prefix = prefix + old_value;
		
		bool foundUp = checkDictionary(row-1, column, new_prefix, nextNode);
		bool foundDown = checkDictionary(row+1, column, new_prefix, nextNode);
		bool foundRight = checkDictionary(row, column+1, new_prefix, nextNode);
		bool foundLeft = checkDictionary(row, column-1, new_prefix, nextNode);

		board_ref[row][column] = old_value; // backtrack

		if (foundUp || foundDown || foundRight || foundLeft)
			return true;
	}
	return false;
}
```

One important difference to the original solution is that we don't finish the search when the first word is found - we keep recursing until
the current character in the cell matches a `nullptr` node in the Trie.  
This is because a full word can be a prefix for another word in the dictionary.  

Additionally, we can apply the same optimization that we had in the original solution - remove the words we have already matched. 
However, because a Trie is a node-based data structure and we are passing a pointer to the current node through a stack of recursive
calls - we can't just delete a word from a dictionary at an arbitrary moment.  
This would result in accessing a freed memory and an Undefined Behavior.

To combat that - we need to remember the already found words and delete them after the search starting at the current cell
of the board is finished.  
In other words - the current recursive search has returned and there are no pointers to the 'about to be deleted' word in memory
anywhere on the program stack.

```cpp
class Solution {
private:
    unordered_set<string> toRemove;
	
	bool checkDictionary(/*...*/) {
		if (node->isWord) {
			// ...
			toRemove.insert(prefix);
		}
		//...
	}
public:
    vector<string> findWords(/*...*/) {
       // ...
        for (int row=0; row < rows; ++row) {
            for (int column=0; column < columns; ++column) {
                Node* root = &dictionary.root;
                checkDictionary(row, column, "", root);
                // just finished the search from the current cell
                // it is safe to remove words from the dictionary at this point
				for (const string& word: toRemove)
					dictionary.Remove(word);
				toRemove.clear();
            }
        }
        std::vector<string> result(matchedWords.begin(), matchedWords.end());
        return result;
    }
```

Now let's implement the word removal from the dictionary.  
A node in the Trie can be removed if all of the children are empty.

```cpp
class Trie {
public:
	// ...
    void Remove(const string& word) { Remove(&root, word, 0); }    

private:
    bool Remove(Node* node, const string& word, int depth) {
        if (!node)
            return false; // word is not in the dictionary - cannot remove
        if (depth == word.length()) { // end of the word reached
            if (node->isWord) {
                node->isWord = false;
                // need to tell the function above the stack if this node can be deleted
                return std::all_of(node->children.begin(), node->children.end(),
                    [](Node* child) { return child == nullptr; }
                );
            } else
                return false;
        }
        int ix = toTrieIndex(word[depth]);
        Node* nextNode = node->children[ix];
        bool shouldRemoveNode = Remove(nextNode, word, depth+1);
        if (shouldRemoveNode) {
            delete node->children[ix];
            node->children[ix] = nullptr;
            return !node->isWord && std::all_of(node->children.begin(), node->children.end(),
                    [](Node* child) { return child == nullptr; }
            );
        }
        return false;
    }
};
```
The full solution for this problem, which passes all the test cases on Leetcode is as follows.
```cpp
constexpr int EnglishLowerCaseLetterCount = (int)'z' - (int)'a' + 1;

struct Node{
    std::array<Node*, EnglishLowerCaseLetterCount> children{};
    bool isWord{};
    ~Node() {
        for (Node* child : children)
            delete child;
    }
};

int toTrieIndex(char c) { 
    assert(c >= 'a' && c <= 'z');
    return (int)c - (int)'a'; 
}

class Trie {
public:
    void Add(const string& word) {
        Node* current = &root;
        for (char c: word) {
            int ix = toTrieIndex(c);
            if (!current->children[ix])
                current->children[ix] = new Node();
            current = current->children[ix];
        }
        current->isWord = true;
    }

    bool Contains(const string& word) {
        Node* current = &root;
        for (char c: word) {
            int ix = toTrieIndex(c);
            if (!current->children[ix])
                return false;
            current = current->children[ix];
        }
        return current->isWord;
    }

    void Remove(const string& word) {
        Remove(&root, word, 0);
    }

    Node root;

private:
    bool Remove(Node* node, const string& word, int depth) {
        if (!node)
            return false; // word is not in the dictionary - cannot remove
        if (depth == word.length()) { // end of the word reached
            if (node->isWord) {
                node->isWord = false;
                // need to tell the function above the stack if this node can be deleted
                return std::all_of(node->children.begin(), node->children.end(),
                    [](Node* child) { return child == nullptr; }
                );
            } else
                return false;
        }
        int ix = toTrieIndex(word[depth]);
        Node* nextNode = node->children[ix];
        bool shouldRemoveNode = Remove(nextNode, word, depth+1);
        if (shouldRemoveNode) {
            delete node->children[ix];
            node->children[ix] = nullptr;
            return !node->isWord && std::all_of(node->children.begin(), node->children.end(),
                    [](Node* child) { return child == nullptr; }
            );
        }
        return false;
    }
};

class Solution {
public:
    vector<string> findWords(vector<vector<char>>& board, vector<string>& words) {
        this->board = &board;
        rows = board.size(), columns = board[0].size();

        for (const string& w: words)
            dictionary.Add(w);


        for (int row=0; row < rows; ++row) {
            for (int column=0; column < columns; ++column) {
                Node* root = &dictionary.root;
                checkDictionary(row, column, "", root);
                // just finished the search from the current cell
                // it is safe to remove words from the dictionary at this point
				for (const string& word: toRemove)
					dictionary.Remove(word);
				toRemove.clear();
            }
        }
        std::vector<string> result(matchedWords.begin(), matchedWords.end());
        return result;
    }

private:
	// recursively check if the word can be found from the current location on the board
    bool checkDictionary(int row, int column, string prefix, Node* node) { // have to carry around the prefix, otherwise we don't know the word
        // recursion tail
        if (node->isWord) {
            matchedWords.insert(prefix);
            toRemove.insert(prefix);
        }
        // board edges
        if (row < 0 || column < 0 || row >= rows || column >= columns)
            return false;
        vector<vector<char>>& board_ref = *board;
        // check if the current character is in the Trie:
        char c = board_ref[row][column];
        if (board_ref[row][column] == '_')
            return false; // already visited
        int ix = toTrieIndex(c);
        Node* nextNode = node->children[ix];
        if (nextNode) {
            // mark the cell as visited
            char old_value = board_ref[row][column];
            board_ref[row][column] = '_';
            
            string new_prefix = prefix + old_value;
            
            bool foundUp = checkDictionary(row-1, column, new_prefix, nextNode);
            bool foundDown = checkDictionary(row+1, column, new_prefix, nextNode);
            bool foundRight = checkDictionary(row, column+1, new_prefix, nextNode);
            bool foundLeft = checkDictionary(row, column-1, new_prefix, nextNode);

            board_ref[row][column] = old_value; // backtrack

            if (foundUp || foundDown || foundRight || foundLeft)
                return true;
        }
        return false;
    }

    int columns{}, rows{};
    vector<vector<char>>* board;
    Trie dictionary;
    unordered_set<string> matchedWords;
    unordered_set<string> toRemove;
};
```

I am not sure how realistic is it to write this on a live code interview.  
Maybe a basic backtracking solution is reasonable, assuming your solved a similar problem before.  
A bonus point would be to say that you know a Trie data structure can speed up the search.