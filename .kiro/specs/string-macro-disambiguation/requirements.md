# Requirements Document

## Introduction

This document specifies the requirements for proper string type handling and disambiguation from local macros in the tree-sitter-stata grammar. Stata has two string types (double-quoted and compound strings) that share delimiter characters with local macros, requiring careful grammar design to parse correctly.

## Glossary

- **Grammar**: The tree-sitter-stata grammar definition in grammar.js that defines how Stata code is parsed into an AST
- **Double_String**: A Stata string delimited by double quotes (`"..."`)
- **Compound_String**: A Stata string delimited by backtick-quote opening (`` `" ``) and quote-apostrophe closing (`"'`)
- **Local_Macro**: A Stata macro reference delimited by backtick (`` ` ``) and apostrophe (`'`), e.g., `` `name' ``
- **Global_Macro**: A Stata macro reference using `$name` or `${name}` syntax
- **Depth_Encoding**: A grammar technique using numbered rules (depth_1 through depth_6) to track nesting levels
- **Parser**: The tree-sitter parser generated from the grammar that produces ASTs from Stata source code
- **AST**: Abstract Syntax Tree - the structured representation of parsed code

## Requirements

### Requirement 1: Compound String vs Local Macro Disambiguation

**User Story:** As a developer using the Stata grammar, I want compound strings to be correctly distinguished from local macros, so that `` `"text"' `` is parsed as a string and not as a macro containing `"text"`.

#### Acceptance Criteria

1. WHEN the Parser encounters the sequence `` `" ``, THE Grammar SHALL recognize it as a compound string opener, not as a backtick followed by a double quote
2. WHEN the Parser encounters `` `"text"' ``, THE Grammar SHALL produce a compound_string_depth_N node, not a local_macro_depth_N node
3. WHEN the Parser encounters `` `name' `` (without a double quote after the backtick), THE Grammar SHALL produce a local_macro_depth_N node
4. FOR ALL valid compound strings, parsing then printing the AST node type SHALL confirm it is a compound_string_depth_N (round-trip property)

### Requirement 2: Local Macro Inside Compound String

**User Story:** As a Stata developer, I want to embed local macro references inside compound strings, so that I can write `` `"hello `name' world"' `` and have both the string and the embedded macro parsed correctly.

#### Acceptance Criteria

1. WHEN a compound string contains a local macro reference, THE Grammar SHALL parse the outer construct as compound_string_depth_N and the inner construct as local_macro_depth_N
2. WHEN parsing `` `"hello `name' world"' ``, THE Grammar SHALL produce a compound_string_depth_1 containing a local_macro_depth_1 with identifier "name"
3. WHEN a compound string contains multiple local macros, THE Grammar SHALL parse each macro as a separate local_macro_depth_N node within the string

### Requirement 3: Global Macro Inside Compound String

**User Story:** As a Stata developer, I want to embed global macro references inside compound strings, so that I can write `` `"hello $name world"' `` and have both the string and the embedded macro parsed correctly.

#### Acceptance Criteria

1. WHEN a compound string contains a global macro reference using `$name` syntax, THE Grammar SHALL parse it as a global_macro node within the compound string
2. WHEN a compound string contains a global macro reference using `${name}` syntax, THE Grammar SHALL parse it as a global_macro node within the compound string
3. WHEN parsing `` `"value is $var"' ``, THE Grammar SHALL produce a compound_string_depth_1 containing a global_macro with identifier "var"

### Requirement 4: Nested Compound Strings

**User Story:** As a Stata developer, I want to nest compound strings inside other compound strings, so that I can write complex string expressions with proper depth tracking.

#### Acceptance Criteria

1. WHEN a compound string contains another compound string, THE Grammar SHALL parse the outer string as compound_string_depth_N and the inner string as compound_string_depth_(N+1)
2. WHEN parsing `` `"outer `"inner"' outer"' ``, THE Grammar SHALL produce compound_string_depth_1 containing compound_string_depth_2
3. WHEN nesting exceeds depth 6, THE Grammar SHALL wrap around to depth 1 (depth 6 contains depth 1)
4. FOR ALL nested compound string combinations up to depth 6, THE Grammar SHALL correctly track depth levels

### Requirement 5: Double String Handling

**User Story:** As a Stata developer, I want double-quoted strings to be parsed correctly and to support embedded global macros, so that I can write `"hello $name"` with proper macro expansion.

#### Acceptance Criteria

1. WHEN the Parser encounters `"text"`, THE Grammar SHALL produce a double_string node
2. WHEN a double string contains a global macro, THE Grammar SHALL parse it as a global_macro node within the double_string
3. WHEN a double string contains escaped quotes (`""`), THE Grammar SHALL include them as part of the string content
4. THE Grammar SHALL NOT allow local macros inside double strings (local macros require compound string syntax)

### Requirement 6: Test Corpus Coverage

**User Story:** As a grammar maintainer, I want comprehensive test cases for string and macro disambiguation, so that I can verify the grammar handles all edge cases correctly.

#### Acceptance Criteria

1. THE Test_Corpus SHALL include test cases for compound strings that could be confused with local macros
2. THE Test_Corpus SHALL include test cases for local macros inside compound strings
3. THE Test_Corpus SHALL include test cases for global macros inside both string types
4. THE Test_Corpus SHALL include test cases for nested compound strings at multiple depth levels
5. THE Test_Corpus SHALL include test cases demonstrating the difference between `` `name' `` (macro) and `` `"name"' `` (string)
6. WHEN all test cases are run, THE Grammar SHALL pass all disambiguation tests

### Requirement 7: Highlight Query Compatibility

**User Story:** As a Zed editor user, I want the highlight queries to work correctly with the grammar, so that strings and macros are visually distinguished in the editor.

#### Acceptance Criteria

1. THE Highlight_Queries in tree-sitter-stata/queries/highlights.scm SHALL correctly capture all compound_string_depth_N nodes
2. THE Highlight_Queries in tree-sitter-stata/queries/highlights.scm SHALL correctly capture all local_macro_depth_N nodes
3. THE Highlight_Queries SHALL distinguish between strings and macros for syntax highlighting purposes
4. WHEN the grammar is updated, THE Highlight_Queries SHALL remain compatible with the new node types

### Requirement 8: Documentation for Grammar Updates

**User Story:** As a contributor to the tree-sitter-stata project, I want documentation on how to update the grammar and propagate changes to the Zed extension, so that I can maintain the project correctly.

#### Acceptance Criteria

1. THE tree-sitter-stata repository SHALL contain an AGENTS.md file documenting the grammar update process
2. THE AGENTS.md file SHALL document how to regenerate the parser after grammar.js changes
3. THE AGENTS.md file SHALL document how to run the test corpus
4. THE AGENTS.md file SHALL document how to update the grammar revision SHA in sight/zed-extension/extension.toml
5. THE AGENTS.md file SHALL document the relationship between tree-sitter-stata and the sight Zed extension
