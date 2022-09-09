#include <stdio.h>
#include <dlfcn.h>

int bar() {
	return 2;
}

int main() {
	void* handle = dlopen("module1.wasm", RTLD_NOW);
	int (*foo)() = dlsym(handle, "foo");
	int result = foo() + foo() + 10;
	printf("The result is %i\n", result);
	return 0;
}