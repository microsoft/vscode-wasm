#include <stdio.h>
#include <stdlib.h>

using namespace std;

int main() {
    FILE *fptr;
    fptr = fopen("/workspace/app.py", "r");
    fclose(fptr);
}