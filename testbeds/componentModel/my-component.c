#include "host.h"

void host_run() {
    host_string_t my_string;
    host_string_set(&my_string, "Hello, world!");

    host_print(&my_string);
}