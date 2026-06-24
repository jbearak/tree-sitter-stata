/**
 * External scanner for tree-sitter-stata
 *
 * This scanner handles line-start detection for star comments.
 * Stata treats `*` as a comment only when it's the first non-whitespace
 * character on a line.
 */

#include <tree_sitter/parser.h>

enum TokenType {
    LINE_START,
};

// The scanner is stateless: line-start detection is derived from the lexer
// column at scan time, so there is nothing to allocate or serialize.
void *tree_sitter_stata_external_scanner_create(void) {
    return NULL;
}

void tree_sitter_stata_external_scanner_destroy(void *payload) {
    (void)payload;
}

unsigned tree_sitter_stata_external_scanner_serialize(void *payload, char *buffer) {
    (void)payload;
    (void)buffer;
    return 0;
}

void tree_sitter_stata_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {
    (void)payload;
    (void)buffer;
    (void)length;
}

static void skip_whitespace(TSLexer *lexer) {
    while (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
        lexer->advance(lexer, true);
    }
}

bool tree_sitter_stata_external_scanner_scan(
    void *payload,
    TSLexer *lexer,
    const bool *valid_symbols
) {
    (void)payload;

    // Handle LINE_START token - only emit if `*` is the first non-whitespace
    // character on the line. We derive "line start" from the lexer column
    // rather than a stateful flag: tree-sitter consults the external scanner
    // at the beginning of each token, before leading whitespace is consumed,
    // so a genuine line start reports column 0. Relying on a mutable flag is
    // unreliable because tree-sitter does not persist scanner state changes
    // when scan() returns false, which previously let LINE_START fire mid-line
    // (e.g. the `*` in `2*3` or `sum pop*` was parsed as a star comment).
    if (valid_symbols[LINE_START] && lexer->get_column(lexer) == 0) {
        skip_whitespace(lexer);
        if (lexer->lookahead == '*') {
            lexer->result_symbol = LINE_START;
            return true;
        }
    }

    return false;
}
