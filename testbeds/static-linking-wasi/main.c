#include <stdio.h>

int bar() {
	return 2;
}

int main() {
	int result = bar() + bar();
	printf("The result is %i\n", result);
	return 0;
}