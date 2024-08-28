/**
 * Copied https://github.com/lambdageek/big-buffer-write.git
 */
#include <errno.h>
#include <stdlib.h>
#include <stdio.h>
#include <time.h>
#include <unistd.h>

char
random_char(void)
{
	/* ASCII space through ~ */
	int lo = 0x20, hi = 0x7E;
	return (char)(lo + (rand() % (hi-lo)));
}

static void
fill_buf(char *buf, int count)
{
	while (count-- > 1) {
		*buf++ = random_char();
	}
	*buf = '\n';
}

static
int
write_big_buffer (int count)
{
	char *buf = calloc(sizeof(char), count+1);
	fill_buf(buf, count);
	ssize_t to_write = count;
	char *ptr = buf;
	while (to_write > 0) {
		ssize_t written = write(STDOUT_FILENO, ptr, to_write);
		if (written < 0 && errno != EINTR) {
			perror ("write");
			return 1;
		} else if (written >= 0) {
			fprintf(stderr, "wrote %d bytes (%d remaining) to stdout\n", (int)written, (int)(to_write - written));
			to_write -= written;
			ptr+=written;
		}
	}
	free(buf);
	return 0;
}

int
main (int argc, char **argv)
{
	if (argc < 2) {
		fprintf (stderr, "usage: %s N\n", argv[0]);
		return 1;
	}
	int count = -1;
	if (sscanf (argv[1], "%d", &count) < 0) {
		perror ("sscanf");
		return 1;
	}
	if (count < 0) {
		fprintf (stderr, "count must be positive\n");
		return 1;
	}
	int seed = (int)time(0);
	fprintf(stderr, "seed %d\n", seed);
	srand(seed);
	if (write_big_buffer(count) != 0) {
		fprintf (stderr, "write_big_buffer failed\n");
		return 1;
	}
	/* now try to write something small after the big buffer */
	printf ("\nSUCCESS\n");
	return 0;
}

