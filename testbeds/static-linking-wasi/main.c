#include <stdio.h>

int bar() {
	return 2;
}

int main() {
	int result = bar() + bar();
	printf("The result is %i\n", result);

	// char ch, file_name[25];
	// FILE * fp;

	// fp = fopen(file_name, "r");
	// while((ch = fgetc(fp)) != EOF)
    // 	printf("%c", ch);

	// fclose(fp);

	return 0;
}