// #include <iostream>
// using namespace std;

#include <stdio.h>

int main()
{
	// cout << "Hello World\n";
	// string input;
	// cout << "Enter a string: ";
	// cin >> input;
	// cout << "You entered: " << input << endl;
	int c;
	while ((c = getchar()) != EOF) {
		printf("%c", c);
	}
	return 0;
}