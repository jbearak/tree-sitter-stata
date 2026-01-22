# tree-sitter-stata

A [tree-sitter](https://tree-sitter.github.io/tree-sitter/) grammar for the Stata statistical programming language.

## Overview

This repository contains a tree-sitter grammar implementation for Stata, enabling:

- **Syntax highlighting** - Accurate highlighting for Stata code including commands, macros, strings, and comments
- **Code parsing** - Incremental parsing for real-time editor features
- **Editor integration** - Can be used with any editor that supports tree-sitter grammars

> **⚠️ Development Status:** This is an early-stage implementation. While functional, it requires substantial testing and code review. Contributions and feedback are welcome!

### Related Repositories

- [Zed-Stata](https://github.com/jbearak/zed-stata) - A Zed editor extension for Stata that uses this grammar
- [Sight](https://github.com/jbearak/sight) - A language server and VS Code extension for Stata

### Supported File Types

- `.do` - Stata do-files
- `.ado` - Stata ado-files (user-written commands)
- `.mata` - Mata source files

## Contributing

Contributions are welcome! See [DEVELOPMENT.md](DEVELOPMENT.md) for setup instructions.

### Reporting Issues

If you find a parsing issue or incorrect syntax highlighting:

1. Open an issue with a minimal Stata code example that demonstrates the problem
2. Include the expected vs actual behavior
3. Specify which editor/integration you're using

## License

Copyright © 2026 Jonathan Marc Bearak

[GPLv3](LICENSE) - This project is open source software. You can use, modify, and distribute it with attribution, but any derivative works must also be open source under GPLv3.
