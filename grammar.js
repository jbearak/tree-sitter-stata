/**
 * Tree-sitter grammar for Stata
 *
 * Simplified grammar focusing on core parsing needs.
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
    name: 'stata',

    // External tokens handled by scanner.c
    externals: $ => [
        $._line_start,          // Emitted at beginning of line when next char is *
    ],

    // Whitespace handling - spaces and tabs are extras, newlines are meaningful
    extras: $ => [
        /[ \t]+/,
    ],

    // Word token for keyword extraction
    word: $ => $.identifier,

    rules: {
        // Root rule - a file is a sequence of lines
        source_file: $ => repeat($._line),

        // A line is either a statement followed by newline, or just a newline
        _line: $ => choice(
            seq($._statement, $._newline),
            $._newline,
        ),

        _newline: _ => /\r?\n/,

        // Statements
        _statement: $ => choice(
            $.comment,
            $.program_definition,
            $.mata_block,
            $.macro_definition,
            $.file_command,
            $.command,
        ),

        // =========================================================================
        // COMMENTS
        // =========================================================================

        comment: $ => choice(
            $.line_comment,
            $.block_comment,
        ),

        // Line comments
        line_comment: $ => choice(
            // Standard line comments - tokenized to prevent // from being split.
            // prec(2) keeps `//` a comment even where a `file_path` (prec 1) is
            // valid, e.g. `use x.dta // note` — otherwise `//` matches the path
            // token and the comment is swallowed.
            token(prec(2, seq('//', /[^\r\n]*/))),
            // Continuation line comments
            token(prec(2, seq('///', /[^\r\n]*/))),
            // Star comments - only valid at line start (external scanner provides _line_start)
            seq($._line_start, '*', /[^\r\n]*/),
        ),

        // Block comments. Stata allows block comments to appear after code and
        // inside other block comments, so parse them recursively instead of as
        // a single flat token that stops at the first `*/`.
        block_comment: $ => seq(
            // prec(2) on the opener keeps `/*` a block comment even where a
            // `file_path` (prec 1) is valid, e.g. `save out.dta /* note */`.
            token(prec(2, '/*')),
            repeat(choice(
                $.block_comment,
                token(prec(-1, /[^*/]+/)),
                '*',
                '/',
            )),
            '*/',
        ),

        // =========================================================================
        // STRINGS
        // =========================================================================

        // Double strings with global macro expansion support
        double_string: $ => seq(
            '"',
            repeat(choice(
                /[^"$\\\r\n]+/,   // Regular content (excluding $)
                /\\./,            // Escape sequences
                '""',             // Escaped quote
                $.global_macro,   // Allow $name and ${name}
            )),
            '"',
        ),

        // Compound strings with depth encoding (1-6, wrap-around)
        compound_string_depth_1: $ => seq(
            '`"',
            repeat($._compound_content_1),
            "\"'",
        ),

        _compound_content_1: $ => choice(
            $.compound_string_depth_2,
            $.local_macro_depth_1,
            $.global_macro,
            $._compound_text,
        ),

        compound_string_depth_2: $ => seq(
            '`"',
            repeat($._compound_content_2),
            "\"'",
        ),

        _compound_content_2: $ => choice(
            $.compound_string_depth_3,
            $.local_macro_depth_1,
            $.global_macro,
            $._compound_text,
        ),

        compound_string_depth_3: $ => seq(
            '`"',
            repeat($._compound_content_3),
            "\"'",
        ),

        _compound_content_3: $ => choice(
            $.compound_string_depth_4,
            $.local_macro_depth_1,
            $.global_macro,
            $._compound_text,
        ),

        compound_string_depth_4: $ => seq(
            '`"',
            repeat($._compound_content_4),
            "\"'",
        ),

        _compound_content_4: $ => choice(
            $.compound_string_depth_5,
            $.local_macro_depth_1,
            $.global_macro,
            $._compound_text,
        ),

        compound_string_depth_5: $ => seq(
            '`"',
            repeat($._compound_content_5),
            "\"'",
        ),

        _compound_content_5: $ => choice(
            $.compound_string_depth_6,
            $.local_macro_depth_1,
            $.global_macro,
            $._compound_text,
        ),

        compound_string_depth_6: $ => seq(
            '`"',
            repeat($._compound_content_6),
            "\"'",
        ),

        // Wrap-around: depth 6 contains depth 1
        _compound_content_6: $ => choice(
            $.compound_string_depth_1,
            $.local_macro_depth_1,
            $.global_macro,
            $._compound_text,
        ),

        _compound_text: _ => token(prec(-1, /([^`"$\r\n]|"[^']|`')+/)),

        string: $ => choice(
            $.double_string,
            $.compound_string_depth_1,
        ),

        // =========================================================================
        // MACROS
        // =========================================================================

        // Local macros with depth encoding (1-6, wrap-around)
        // Also allows global macros inside local macros (e.g., `$global')
        local_macro_depth_1: $ => seq(
            '`',
            choice($.local_macro_depth_2, $.global_macro, $._macro_name),
            "'",
        ),

        local_macro_depth_2: $ => seq(
            '`',
            choice($.local_macro_depth_3, $.global_macro, $._macro_name),
            "'",
        ),

        local_macro_depth_3: $ => seq(
            '`',
            choice($.local_macro_depth_4, $.global_macro, $._macro_name),
            "'",
        ),

        local_macro_depth_4: $ => seq(
            '`',
            choice($.local_macro_depth_5, $.global_macro, $._macro_name),
            "'",
        ),

        local_macro_depth_5: $ => seq(
            '`',
            choice($.local_macro_depth_6, $.global_macro, $._macro_name),
            "'",
        ),

        local_macro_depth_6: $ => seq(
            '`',
            choice($.local_macro_depth_1, $.global_macro, $._macro_name),
            "'",
        ),

        _macro_name: $ => choice(
            $.identifier,
            /[0-9]+/,
        ),

        // Global macros
        global_macro: $ => choice(
            seq('$', $.identifier),
            seq('${', $.identifier, '}'),
        ),

        // =========================================================================
        // PROGRAM DEFINITIONS
        // =========================================================================

        program_definition: $ => seq(
            'program',
            optional('define'),
            field('name', $.identifier),
            repeat($._program_line),
            'end',
        ),

        _program_line: $ => choice(
            seq($._statement, $._newline),
            $._newline,
        ),

        // =========================================================================
        // MATA BLOCKS
        // =========================================================================

        // Mata blocks - supports all valid forms:
        // 1. mata\n...\nend (multiline)
        // 2. mata:\n...\nend (multiline with colon)
        // 3. mata { ... } (brace-delimited)
        // 4. mata: expr (inline with colon)
        // 5. mata expr (inline without colon)
        mata_block: $ => choice(
            // Brace-delimited: mata { ... }
            seq('mata', optional(':'), '{', repeat($._mata_brace_content), '}'),
            // Multiline: mata ... end
            seq('mata', optional(':'), $._newline, repeat($._mata_line), 'end'),
            // Inline: mata: expr or mata expr (on same line, no end required)
            seq('mata', optional(':'), $._mata_inline_content),
        ),
        
        _mata_line: $ => seq(/[^\n]*/, $._newline),
        _mata_inline_content: _ => token(prec(-1, /[^\n{]+/)),
        _mata_brace_content: _ => /[^{}]+/,

        // =========================================================================
        // MACRO DEFINITIONS
        // =========================================================================

        macro_definition: $ => choice(
            seq(choice('local', 'loc'), field('name', $.identifier), repeat($._argument)),
            seq(choice('global', 'gl'), field('name', $.identifier), repeat($._argument)),
            seq(choice('tempvar', 'tempname', 'tempfile'), repeat1(field('name', $.identifier))),
        ),

        // =========================================================================
        // COMMANDS
        // =========================================================================

        command: $ => seq(
            optional($.prefix),
            field('name', $.identifier),
            repeat($._argument),
        ),

        // File commands take a filename as a direct argument (e.g. `use x.dta`,
        // `do script.do`, `save out.dta`). These are split out from the generic
        // `command` rule so that the `file_path` token is only ever lexable in a
        // filename context. This keeps it out of regression-command argument
        // positions, where `i.year`/`c.weight` (textually identical to
        // stem.extension) must remain factor variables (issue #51).
        //
        // The command name uses contextual keyword extraction: the literals are
        // only treated as keywords at statement start, so a variable named e.g.
        // `use` in an argument position still tokenizes as a plain identifier.
        file_command: $ => seq(
            repeat($.prefix),
            field('name', alias($._file_command_name, $.identifier)),
            repeat($._file_argument),
        ),

        _file_command_name: _ => choice(
            // Dataset / script I/O
            'use', 'sysuse', 'webuse',
            'save', 'saveold',
            'do', 'run', 'include',
            'import', 'export',
            // Filesystem commands that take path arguments directly
            'cd', 'erase', 'rm', 'copy', 'mkdir', 'rmdir',
            'type', 'dir', 'ls', 'shell',
        ),

        _file_argument: $ => choice(
            $.file_path,
            $._argument,
        ),

        prefix: _ => choice(
            'by', 'bysort', 'bys',
            'quietly', 'qui',
            'noisily', 'noi',
            'capture', 'cap',
            'sortpreserve',
        ),

        _argument: $ => choice(
            $.string,
            $.local_macro_depth_1,
            $.global_macro,
            $.number,
            $.missing_value,
            $.builtin_variable,
            $.control_keyword,
            $.type_keyword,
            $.factor_variable,
            $.using_clause,
            $.identifier,
            $.operator,
            $.comment,
            token(prec(-1, /[^\s\r\n]+/))
        ),

        // A `using` clause introduces a filename in many commands that are not
        // dedicated file commands (e.g. `merge 1:1 id using other.dta`,
        // `append using a.dta b.dta`). `using` is a reserved word in Stata, so
        // treating it as a keyword here is safe. The trailing repeat is
        // `file_path`-only: since `file_path` is never a valid generic argument,
        // it cannot conflict with the parent command's argument list, which lets
        // multi-file forms parse without a GLR ambiguity.
        using_clause: $ => prec.right(seq(
            'using',
            choice($.file_path, $.string, $.identifier),
            repeat($.file_path),
        )),

        // A filename or path. Requires at least one path character (`.`, `/`, or
        // `\`) so it captures `merp.dta`, `data/x.dta`, and `C:\data\x.dta` while
        // never swallowing a bare varlist token. Higher precedence than
        // `missing_value` (/\.[a-z]?/) and `identifier` so the whole filename is
        // a single token. Stops at whitespace, commas, quotes, backticks, and
        // `$` so `, options`, quoted strings, and global macros in unquoted
        // paths (`use $dir/x.dta`) are handled separately. Comments win via
        // their higher precedence (prec 2).
        file_path: _ => token(prec(1, /[^\s,"'`$]*[./\\][^\s,"'`$]*/)),

        // Factor variables: i.var, c.var, o.var, b#.var, ibn.var, i(1/3).var, etc.
        // The operator (including its trailing '.') is a single token so the
        // lexer does not let `missing_value` (/\.[a-z]?/) swallow the first
        // character of the variable name.
        factor_variable: $ => seq(
            $.factor_operator,
            field('variable', $.identifier),
        ),

        factor_operator: _ => token(seq(
            choice(
                'i', 'c', 'o',
                // base operators: b, bn, b#, ib, ibn, ib#
                seq(optional('i'), 'b', optional(choice(/[0-9]+/, 'n'))),
            ),
            // optional numlist specification, e.g. i(1/3). or b(1 2 3).
            optional(seq('(', /[^)\r\n]+/, ')')),
            '.',
        )),

        // =========================================================================
        // ATOMS
        // =========================================================================

        // Control flow keywords (parsed as distinct nodes for highlighting)
        control_keyword: _ => choice(
            'if', 'else',                              // Conditional
            'foreach', 'forvalues', 'forv', 'while',  // Loop
            'continue', 'break',                       // Control
            'end',                                     // Block terminator
        ),

        // Type keywords
        type_keyword: _ => choice(
            'byte', 'int', 'long', 'float', 'double',  // Numeric types
            // String types str1-str2045 (using regex patterns)
            /str[1-9]/,
            /str[1-9][0-9]/,
            /str[1-9][0-9][0-9]/,
            /str1[0-9][0-9][0-9]/,
            /str20[0-3][0-9]/,
            /str204[0-5]/,
            'strL',                                     // Long string type
        ),

        number: _ => token(choice(
            /[0-9]+/,
            /[0-9]+\.[0-9]*/,
            /\.[0-9]+/,
            /[0-9]+(\.[0-9]*)?[eE][+-]?[0-9]+/,
        )),

        missing_value: _ => /\.[a-z]?/,

        builtin_variable: _ => choice(
            // Observation
            '_n', '_N',
            // Estimation
            '_b', '_coef', '_cons', '_rc', '_se',
            // Constants
            '_pi',
            // Display
            '_skip', '_dup', '_newline', '_column', '_continue', '_request', '_char',
        ),

        identifier: _ => /[A-Za-z_][A-Za-z0-9_]*/,

        operator: $ => choice(
            '+', '-', '*', '/', '^',
            '==', '!=', '~=', '<', '>', '<=', '>=',
            '&', '|', '!', '~',
            '=',
            '#',  // Interaction operator
            alias('[', $.lbracket),
            alias(']', $.rbracket),
            alias('(', $.lparen),
            alias(')', $.rparen),
        ),
    },
});
