# Development Guide

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or later)
- [tree-sitter CLI](https://github.com/tree-sitter/tree-sitter/blob/master/cli/README.md)
- [Rust](https://www.rust-lang.org/) (for Rust bindings)

Install the tree-sitter CLI:

```bash
npm install -g tree-sitter-cli
```

## Setup

```bash
npm install
```

## Generate Parser

After modifying `grammar.js`, regenerate the parser:

```bash
npm run generate
# or
tree-sitter generate
```

## Build

Build the Node.js bindings:

```bash
npm run build
```

Build the Rust bindings:

```bash
cargo build
```

## Test

Run the tree-sitter test suite:

```bash
npm test
# or
tree-sitter test
```

Run Rust tests:

```bash
cargo test
```

## Parse Example Files

Parse a Stata file to see the syntax tree:

```bash
tree-sitter parse test/test.do
```

## Project Structure

```
tree-sitter-stata/
├── grammar.js          # Grammar definition
├── package.json        # npm package configuration
├── Cargo.toml          # Rust package configuration
├── tree-sitter.json    # Tree-sitter metadata
├── bindings/
│   └── rust/
│       ├── lib.rs      # Rust language bindings
│       └── build.rs    # Rust build script
├── queries/
│   └── highlights.scm  # Syntax highlighting queries
├── src/
│   ├── grammar.json    # Generated grammar JSON
│   ├── node-types.json # Generated node types
│   ├── parser.c        # Generated parser
│   ├── scanner.c       # External scanner for line-start detection
│   └── tree_sitter/    # Tree-sitter header files
└── test/               # Test Stata files
```

## Grammar Development Tips

- The grammar is defined in `grammar.js` using tree-sitter's JavaScript DSL
- The external scanner (`src/scanner.c`) handles line-start detection for Stata's line-oriented syntax
- Test your changes with real Stata code files to ensure correct parsing
- Use `tree-sitter parse <file>` to inspect the syntax tree

## Contributing Code

1. **Fork** the repository
2. **Create a branch** for your feature or fix:
   ```bash
   git checkout -b feature/my-improvement
   ```
3. **Make your changes** to `grammar.js` or other files
4. **Regenerate the parser**:
   ```bash
   npm run generate
   ```
5. **Add tests** for new grammar rules in the `test/` directory
6. **Run tests** to ensure everything passes:
   ```bash
   npm test
   cargo test
   ```
7. **Commit** your changes with a descriptive message
8. **Push** to your fork and open a **Pull Request**
