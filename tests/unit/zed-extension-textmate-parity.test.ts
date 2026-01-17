/**
 * TextMate Parity Tests for Tree-sitter Stata grammar
 *
 * Compares Tree-sitter rules/queries to the TextMate grammar in the Sight repo.
 */

import { describe, it, expect, beforeAll } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';

const ROOT_DIR = path.join(import.meta.dir, '../..');
const GRAMMAR_PATH = path.join(ROOT_DIR, 'grammar.js');
const HIGHLIGHTS_PATH = path.join(ROOT_DIR, 'queries/highlights.scm');
const TEXTMATE_PATH = path.join(ROOT_DIR, '../sight/client/syntaxes/stata.tmLanguage.json');

let grammar_content: string;
let highlights_content: string;
let textmate_grammar: any;

beforeAll(() => {
    grammar_content = fs.readFileSync(GRAMMAR_PATH, 'utf8');
    highlights_content = fs.readFileSync(HIGHLIGHTS_PATH, 'utf8');
    textmate_grammar = JSON.parse(fs.readFileSync(TEXTMATE_PATH, 'utf8'));
});

function textmate_has_scope(scope_name: string): boolean {
    const json_str = JSON.stringify(textmate_grammar);
    return json_str.includes(scope_name);
}

function treesitter_has_rule(rule_name: string): boolean {
    return grammar_content.includes(`${rule_name}:`);
}

function highlights_has_capture(node_type: string, capture: string): boolean {
    const pattern = new RegExp(`\(${node_type}[^)]*\)\\s*@${capture}`);
    return pattern.test(highlights_content);
}

describe('TextMate Parity - Keywords', () => {
    it('TextMate should have keyword.other.stata for in/using', () => {
        expect(textmate_has_scope('keyword.other.stata')).toBe(true);
    });

    it('highlights.scm should match in/using/do/run/include as keywords', () => {
        expect(highlights_content).toContain('((identifier) @keyword');
        expect(highlights_content).toContain('^(in|using|do|run|include)$');
    });
});

describe('TextMate Parity - Strings and Macros', () => {
    it('Tree-sitter should have double_string rule', () => {
        expect(treesitter_has_rule('double_string')).toBe(true);
    });

    it('highlights.scm should capture double_string as @string', () => {
        expect(highlights_content).toContain('(double_string) @string');
    });

    it('highlights.scm should capture global_macro as @variable', () => {
        expect(highlights_content).toContain('(global_macro) @variable');
    });
});
