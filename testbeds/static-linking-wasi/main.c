#include <stdio.h>

int foo();
int bar();

int main() {
	int result = foo() + bar();
	printf("The result is %i\n", result);
	return 0;
}