#include <stdio.h>
#include <stdlib.h>
#include <unistd.h> //Header file for sleep(). man 3 sleep for details.
#include <pthread.h>

// A normal C function that is executed as a thread
// when its name is specified in pthread_create()
void *myThreadFun(void *vargp)
{
	sleep(1);
	printf("Printing GeeksQuiz from Thread \n");
	return NULL;
}

int main()
{

	printf("Testing malloc\n");
	void* ptr = malloc(131200);
	if (ptr == NULL) {
		printf("Malloc failed\n");
		exit(1);
	} else {
		printf("Malloc succeeded\n");
		free(ptr);
	}

	pthread_t thread_id;
	printf("Before Thread\n");
	int result = pthread_create(&thread_id, NULL, myThreadFun, NULL);
	printf("Thread created with result: %i\n", result);
	result = pthread_join(thread_id, NULL);
	printf("Thread joined with result: %i\n", result);
	printf("After Thread\n");
	exit(0);
}