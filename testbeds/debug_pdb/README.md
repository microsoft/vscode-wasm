# Debug_PDB Test bed

This is an extension that uses node to start `python -m pdb <test file>`. It then translates all [DAP](https://microsoft.github.io/debug-adapter-protocol/overview) messages into pdb commands in order to allow debugging in VS code.

For example, this message:

```json
{
  command: "setBreakpoints",
  arguments: {
    source: {
      name: "test_longoutput.py",
      path: "d:\\Source\\Testing\\Testing_Pyright\\test_longoutput.py",
    },
    lines: [
      3,
    ],
    breakpoints: [
      {
        line: 3,
      },
    ],
    sourceModified: false,
  },
  type: "request",
  seq: 3,
}
```

Gets translated into the pdb `b(reak)` command:

```
b d:\\Source\\Testing\\Testing_Pyright\\test_longoutput.py:3
```

# Left to do
- Removing breakpoints
- Exception handling (uncaught and caught)