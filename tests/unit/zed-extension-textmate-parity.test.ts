/**
 * TextMate Parity Tests for Tree-sitter Stata grammar
 *
 * Compares Tree-sitter rules/queries to the TextMate grammar in the Sight repo.
 */

import { describe, it, expect, beforeAll } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const ROOT_DIR = path.join(import.meta.dir, '../..');
const GRAMMAR_PATH = path.join(ROOT_DIR, 'grammar.js');
const HIGHLIGHTS_PATH = path.join(ROOT_DIR, 'queries/highlights.scm');
const TEXTMATE_URL = 'https://raw.githubusercontent.com/jbearak/sight/main/client/syntaxes/stata.tmLanguage.json';
const TEXTMATE_TMP_DIR = path.join(os.tmpdir(), 'tree-sitter-stata-tests');
const TEXTMATE_PATH = path.join(TEXTMATE_TMP_DIR, 'stata.tmLanguage.json');

let grammar_content: string;
let highlights_content: string;
let textmate_grammar: any | undefined;

async function ensure_textmate_grammar(): Promise<string | undefined> {
    fs.mkdirSync(TEXTMATE_TMP_DIR, { recursive: true });

    if (fs.existsSync(TEXTMATE_PATH)) {
        return fs.readFileSync(TEXTMATE_PATH, 'utf8');
    }

    try {
        const response = await fetch(TEXTMATE_URL, {
            headers: {
                'User-Agent': 'tree-sitter-stata-tests',
            },
        });

        if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText}`);
        }

        const textmate_content = await response.text();
        fs.writeFileSync(TEXTMATE_PATH, textmate_content);
        return textmate_content;
    } catch (error) {
        console.warn(`TextMate grammar unavailable: failed to download ${TEXTMATE_URL}: ${error}`);
        return undefined;
    }
}

beforeAll(async () => {
    grammar_content = fs.readFileSync(GRAMMAR_PATH, 'utf8');
    highlights_content = fs.readFileSync(HIGHLIGHTS_PATH, 'utf8');

    const textmate_content = await ensure_textmate_grammar();
    textmate_grammar = textmate_content ? JSON.parse(textmate_content) : undefined;
});

function require_textmate_grammar(): any | undefined {
    if (!textmate_grammar) {
        console.warn('Skipping TextMate-specific assertion because the Sight grammar could not be downloaded.');
        return undefined;
    }

    return textmate_grammar;
}

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
        if (!require_textmate_grammar()) {
            return;
        }

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
