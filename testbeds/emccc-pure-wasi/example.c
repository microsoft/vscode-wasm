#include <stdio.h>
#include <unistd.h>
#include <pthread.h>

void *thread_callback(void *arg)
{
    sleep(1);
    printf("Inside the thread: %d\n", *(int *)arg);
    return NULL;
}

int main()
{
    puts("Before the thread");

    pthread_t thread_id;
    int arg = 42;
    pthread_create(&thread_id, NULL, thread_callback, &arg);

    pthread_join(thread_id, NULL);

    puts("After the thread");

    return 0;
}