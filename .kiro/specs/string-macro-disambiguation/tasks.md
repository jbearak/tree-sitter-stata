# Implementation Plan: String-Macro Disambiguation

## Overview

This implementation plan focuses on verifying and testing the string-macro disambiguation in tree-sitter-stata. The grammar already has the core rules in place, so the primary work is adding comprehensive test coverage and documentation.

## Tasks

- [ ] 1. Verify grammar disambiguation logic
  - [ ] 1.1 Review and verify compound string rules in grammar.js
    - Confirm `'`"'` is used as a single 2-character token for compound string opener
    - Confirm `"'"` is used as a single 2-character token for compound string closer
    - Verify precedence ensures compound strings match before local macros
    - _Requirements: 1.1, 1.2_
  
  - [ ] 1.2 Review and verify local macro rules in grammar.js
    - Confirm local macro uses single backtick opener
    - Verify local macro content rules don't conflict with compound strings
    - _Requirements: 1.3_

- [ ] 2. Add disambiguation test cases to corpus
  - [ ] 2.1 Add test case for compound string vs local macro disambiguation
    - Test `"merp"'` parses as compound_string_depth_1
    - Test `merp'` parses as local_macro_depth_1
    - Test side-by-side comparison in same test block
    - _Requirements: 1.2, 1.3, 6.5_
  
  - [ ] 2.2 Add test case for local macro inside compound string
    - Test `"hello `name' world"'` structure
    - Verify compound_string_depth_1 contains local_macro_depth_1
    - _Requirements: 2.1, 2.2, 6.2_
  
  - [ ] 2.3 Add test case for multiple local macros inside compound string
    - Test `"`a' and `b'"'` with multiple embedded macros
    - Verify each macro is a separate local_macro node
    - _Requirements: 2.3_
  
  - [ ] 2.4 Add test case for global macros inside compound string
    - Test `"value is $var"'` with $name syntax
    - Test `"value is ${var}"'` with ${name} syntax
    - _Requirements: 3.1, 3.2, 3.3, 6.3_

- [ ] 3. Add nested compound string test cases
  - [ ] 3.1 Add test case for depth 1 containing depth 2
    - Test `"outer `"inner"' outer"'`
    - Verify compound_string_depth_1 contains compound_string_depth_2
    - _Requirements: 4.1, 4.2, 6.4_
  
  - [ ] 3.2 Add test case for triple nesting (depth 1 → 2 → 3)
    - Test three levels of nested compound strings
    - Verify correct depth assignment at each level
    - _Requirements: 4.4_
  
  - [ ] 3.3 Add test case for depth wrap-around (depth 6 → 1)
    - Test six levels of nesting to verify wrap-around
    - Verify depth 6 contains depth 1 for the innermost string
    - _Requirements: 4.3_

- [ ] 4. Add double string test cases
  - [ ] 4.1 Add test case for double string with global macro
    - Test `"hello $name"` structure
    - Verify double_string contains global_macro
    - _Requirements: 5.1, 5.2_
  
  - [ ] 4.2 Add test case for double string with escaped quotes
    - Test `"say ""hello"""` with escaped quotes
    - Verify escaped quotes are part of string content
    - _Requirements: 5.3_
  
  - [ ] 4.3 Add test case verifying local macro syntax in double string is literal
    - Test `"the value is `name'"` 
    - Verify NO local_macro node is produced (backtick is literal)
    - _Requirements: 5.4_

- [ ] 5. Checkpoint - Run corpus tests
  - Ensure all tests pass with `npx tree-sitter test`
  - Ask the user if questions arise

- [ ] 6. Implement property-based tests
  - [ ] 6.1 Write property test for compound string vs local macro disambiguation
    - **Property 1: Compound String vs Local Macro Disambiguation**
    - Generate inputs starting with backtick, verify correct node type based on next character
    - **Validates: Requirements 1.1, 1.3, 1.4**
  
  - [ ] 6.2 Write property test for local macros inside compound strings
    - **Property 2: Local Macros Inside Compound Strings**
    - Generate compound strings with embedded local macros, verify nested structure
    - **Validates: Requirements 2.1, 2.3**
  
  - [ ] 6.3 Write property test for global macros inside compound strings
    - **Property 3: Global Macros Inside Compound Strings**
    - Generate compound strings with $name and ${name} patterns, verify global_macro nodes
    - **Validates: Requirements 3.1, 3.2**
  
  - [ ] 6.4 Write property test for nested compound string depth tracking
    - **Property 4: Nested Compound String Depth Tracking**
    - Generate nested compound strings, verify depth assignments and wrap-around
    - **Validates: Requirements 4.1, 4.3, 4.4**
  
  - [ ] 6.5 Write property test for double string parsing
    - **Property 5: Double String Parsing with Embedded Content**
    - Generate double strings with global macros and escaped quotes
    - **Validates: Requirements 5.1, 5.2, 5.3**
  
  - [ ] 6.6 Write property test for local macro exclusion in double strings
    - **Property 6: Local Macros Not Parsed Inside Double Strings**
    - Generate double strings containing backtick-apostrophe patterns, verify no local_macro nodes
    - **Validates: Requirements 5.4**

- [ ] 7. Checkpoint - Run all tests
  - Run corpus tests: `npx tree-sitter test`
  - Run property tests: `npm test`
  - Ensure all tests pass, ask the user if questions arise

- [ ] 8. Verify highlight query compatibility
  - [ ] 8.1 Review highlights.scm for compound string captures
    - Verify all compound_string_depth_N nodes are captured
    - Verify captures use appropriate highlight groups
    - _Requirements: 7.1, 7.3_
  
  - [ ] 8.2 Review highlights.scm for local macro captures
    - Verify all local_macro_depth_N nodes are captured
    - Verify captures use appropriate highlight groups
    - _Requirements: 7.2, 7.3_
  
  - [ ] 8.3 Sync highlights.scm to zed extension if needed
    - Compare tree-sitter-stata/queries/highlights.scm with sight/zed-extension/languages/stata/highlights.scm
    - Update zed extension file if grammar changes require it
    - _Requirements: 7.4_

- [ ] 9. Create AGENTS.md documentation
  - [ ] 9.1 Document grammar update process
    - How to modify grammar.js
    - How to regenerate parser with `npx tree-sitter generate`
    - _Requirements: 8.1, 8.2_
  
  - [ ] 9.2 Document test execution
    - How to run corpus tests
    - How to run property-based tests
    - _Requirements: 8.3_
  
  - [ ] 9.3 Document zed extension update process
    - How to update grammar revision SHA in sight/zed-extension/extension.toml
    - Relationship between tree-sitter-stata and sight repositories
    - _Requirements: 8.4, 8.5_

- [ ] 10. Final checkpoint
  - Ensure all tests pass
  - Verify AGENTS.md is complete
  - Ask the user if questions arise

## Notes

- All tasks are required for comprehensive testing
- The grammar already implements the core disambiguation logic; this plan focuses on verification and testing
- Property tests use fast-check library (already installed)
- Each task references specific requirements for traceability
