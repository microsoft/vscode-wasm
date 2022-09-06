#include <stdio.h>

int func1();
int func2();

int main() {
	int result = func1() + func2();
	printf("The result is %i\n", result);
	return 0;
}