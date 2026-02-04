# Cross-IDE WebAssembly Extension Standardization

## Overview

This document explores the potential for standardizing WebAssembly-based IDE extensions across different development environments. As WASM support matures in VS Code through this project, there's an opportunity to contribute to broader ecosystem interoperability.

## Background

The VS Code WASM project provides excellent support for running WebAssembly within VS Code extensions. However, extension authors currently face a challenge: extensions written for VS Code cannot run in other IDEs without significant modifications.

## Emerging Standards

The [WebAssembly IDE Extension Standard](https://github.com/zixiao-labs/WebAssembly-IDEs-Extension-standard) is an open specification that aims to address this challenge through:

- **WIT-based Interface Definitions**: Standardized contracts for IDE capabilities
- **Capability-based Security**: Fine-grained permission model
- **WASI Alignment**: Built on WASI 0.2+ and the Component Model
- **IDE Agnostic Design**: No assumptions about specific implementations

### Interface Categories

The standard defines interfaces across several categories:

| Category | Description | Examples |
|----------|-------------|----------|
| Core | Always available | lifecycle, logging, context |
| Editor | Text manipulation | text, selection, decorations |
| Workspace | File system access | filesystem, project |
| UI | User interface | notifications, commands, menus |
| Language | Language features | completion, diagnostics, hover |
| Network | Network access | fetch, websocket |

### Permission Model

Extensions declare required permissions in their manifest:

```json
{
  "permissions": [
    "workspace:read",
    "ui:notifications",
    "network:fetch:api.example.com"
  ]
}
```

## Comparison with Current Approach

| Aspect | vscode-wasm (current) | IDE Extension Standard |
|--------|----------------------|------------------------|
| Scope | VS Code specific | IDE-agnostic |
| Model | WASM within JS extension | Pure WASM extension |
| Permissions | Extension-level | Fine-grained capability |
| Interfaces | VS Code APIs | WIT-defined contracts |
| Target | Language servers focus | All extension types |

## Potential Integration Paths

### Option 1: Complementary Support
VS Code could support both native extensions and standard-compliant WASM extensions, allowing users to benefit from the broader ecosystem.

### Option 2: Interface Alignment
The existing WIT definitions in `wasm-component-model` could be aligned with standard interfaces where appropriate, enabling gradual adoption.

### Option 3: Shared Tooling
Common tooling like `wit2ts` could be extended to support standard interfaces, benefiting both approaches.

## Discussion Points

1. **Value Proposition**: Would cross-IDE portability benefit VS Code users and extension authors?
2. **Technical Feasibility**: How would standard-compliant extensions integrate with VS Code's extension host?
3. **Security Model**: How does the fine-grained permission model compare to VS Code's current approach?
4. **Migration Path**: Could existing WASM-based language servers be adapted to the standard?

## References

- [WebAssembly IDE Extension Standard](https://github.com/zixiao-labs/WebAssembly-IDEs-Extension-standard)
- [WASI](https://wasi.dev/)
- [WebAssembly Component Model](https://component-model.bytecodealliance.org/)
- [WIT Specification](https://component-model.bytecodealliance.org/design/wit.html)

## Next Steps

This document is intended to start a discussion. Feedback from the VS Code team and community is welcome on:

- Interest in cross-IDE standardization
- Technical concerns or opportunities
- Potential collaboration with standard authors
