# Copied from https://github.com/lambdageek/big-buffer-write.git

.PHONY: all clean linux wasi run-wasi

all: linux wasi

CFLAGS=-Wall -Wextra -pedantic -std=c99 -O

DEST_LINUX=bin
DEST_WASI=dist

BIN_LINUX=$(DEST_LINUX)/program-linux
BIN_WASI=$(DEST_WASI)/program-wasi.wasm

SOURCES=program.c

linux: $(BIN_LINUX)
wasi: $(BIN_WASI)

$(DEST_LINUX):
	mkdir -p $(DEST_LINUX)

$(DEST_WASI):
	mkdir -p $(DEST_WASI)

$(BIN_LINUX): $(SOURCES) | $(DEST_LINUX)
	gcc $(CFLAGS) -o $@ $<

$(BIN_WASI): $(SOURCES) | $(DEST_WASI)
	@if [ "z$(WASI_SDK_PATH)" = z ]; then echo "please set WASI_SDK_PATH"; false ; fi
	$(WASI_SDK_PATH)/bin/clang $(CFLAGS) -o $@ $<

clean:
	-rm -f $(BIN_LINUX) $(BIN_WASI)

run-wasi:
	wasmtime run $(BIN_WASI) -- $(N)

