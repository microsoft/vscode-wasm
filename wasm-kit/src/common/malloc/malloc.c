/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

#include <malloc.h>

extern void* malloc(size_t);
extern void free(void*);
extern void* aligned_alloc(size_t alignment, size_t bytes);