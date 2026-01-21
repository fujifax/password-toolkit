/**
 * Password Generator テスト（Node.js用）
 * 実行: node test.js
 */

// crypto.getRandomValues のポリフィル
const crypto = require('crypto');
global.crypto = {
    getRandomValues: (arr) => {
        const bytes = crypto.randomBytes(arr.length * 4);
        for (let i = 0; i < arr.length; i++) {
            arr[i] = bytes.readUInt32LE(i * 4);
        }
        return arr;
    }
};

// テスト対象の関数
const AMBIGUOUS = new Set("0O1lI|`'\" ,.;:");
const SYMBOLS = "!#$%&()*+,-./:;<=>?@[]^_{|}~";

function secureRandom(max) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] % max;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = secureRandom(i + 1);
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function buildCharset(options) {
    const pools = [];
    let lower = 'abcdefghijklmnopqrstuvwxyz';
    let upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let digits = '0123456789';
    let symbols = SYMBOLS;

    if (options.excludeAmbiguous) {
        lower = [...lower].filter(c => !AMBIGUOUS.has(c)).join('');
        upper = [...upper].filter(c => !AMBIGUOUS.has(c)).join('');
        digits = [...digits].filter(c => !AMBIGUOUS.has(c)).join('');
        symbols = [...symbols].filter(c => !AMBIGUOUS.has(c)).join('');
    }

    if (options.useLower && lower) pools.push(lower);
    if (options.useUpper && upper) pools.push(upper);
    if (options.useDigits && digits) pools.push(digits);
    if (options.useSymbols && symbols) pools.push(symbols);

    return pools;
}

function generatePassword(length, pools) {
    if (pools.length === 0) return null;
    if (length < pools.length) return null;

    let chars = pools.map(pool => pool[secureRandom(pool.length)]);
    const allChars = pools.join('');
    for (let i = chars.length; i < length; i++) {
        chars.push(allChars[secureRandom(allChars.length)]);
    }
    shuffleArray(chars);
    return chars.join('');
}

function calculateStrength(password) {
    if (!password) {
        return { score: 0, level: 'none', label: '-', entropy: 0 };
    }

    let charsetSize = 0;
    if (/[a-z]/.test(password)) charsetSize += 26;
    if (/[A-Z]/.test(password)) charsetSize += 26;
    if (/[0-9]/.test(password)) charsetSize += 10;
    if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32;

    const entropy = password.length * Math.log2(charsetSize || 1);

    let score, level, label;
    if (entropy < 28) {
        score = 1; level = 'weak'; label = '弱い';
    } else if (entropy < 36) {
        score = 2; level = 'fair'; label = 'やや弱い';
    } else if (entropy < 60) {
        score = 3; level = 'good'; label = '良好';
    } else {
        score = 4; level = 'strong'; label = '強い';
    }

    return { score, level, label, entropy: Math.round(entropy) };
}

// テストフレームワーク
let passed = 0;
let failed = 0;
const results = [];

function test(name, fn) {
    try {
        fn();
        passed++;
        results.push({ name, pass: true });
        console.log(`  ✓ ${name}`);
    } catch (e) {
        failed++;
        results.push({ name, pass: false, error: e.message });
        console.log(`  ✗ ${name}`);
        console.log(`    Error: ${e.message}`);
    }
}

function expect(actual) {
    return {
        toBe(expected) {
            if (actual !== expected) {
                throw new Error(`Expected ${expected}, but got ${actual}`);
            }
        },
        toBeGreaterThan(expected) {
            if (!(actual > expected)) {
                throw new Error(`Expected ${actual} to be greater than ${expected}`);
            }
        },
        toBeGreaterThanOrEqual(expected) {
            if (!(actual >= expected)) {
                throw new Error(`Expected ${actual} to be >= ${expected}`);
            }
        },
        toBeLessThan(expected) {
            if (!(actual < expected)) {
                throw new Error(`Expected ${actual} to be less than ${expected}`);
            }
        },
        toBeNull() {
            if (actual !== null) {
                throw new Error(`Expected null, but got ${actual}`);
            }
        },
        toMatch(regex) {
            if (!regex.test(actual)) {
                throw new Error(`Expected "${actual}" to match ${regex}`);
            }
        },
        notToMatch(regex) {
            if (regex.test(actual)) {
                throw new Error(`Expected "${actual}" not to match ${regex}`);
            }
        }
    };
}

// テスト実行
console.log('\n========================================');
console.log('  Password Generator テスト');
console.log('========================================\n');

console.log('【パスワード生成】');

test('指定した長さのパスワードが生成される', () => {
    const pools = buildCharset({ useLower: true, useUpper: true, useDigits: true, useSymbols: true });
    const password = generatePassword(16, pools);
    expect(password.length).toBe(16);
});

test('長さ8のパスワードが正しく生成される', () => {
    const pools = buildCharset({ useLower: true, useUpper: true, useDigits: true, useSymbols: true });
    const password = generatePassword(8, pools);
    expect(password.length).toBe(8);
});

test('長さ64のパスワードが正しく生成される', () => {
    const pools = buildCharset({ useLower: true, useUpper: true, useDigits: true, useSymbols: true });
    const password = generatePassword(64, pools);
    expect(password.length).toBe(64);
});

test('小文字のみのパスワードが生成できる', () => {
    const pools = buildCharset({ useLower: true, useUpper: false, useDigits: false, useSymbols: false });
    const password = generatePassword(10, pools);
    expect(password).toMatch(/^[a-z]+$/);
});

test('大文字のみのパスワードが生成できる', () => {
    const pools = buildCharset({ useLower: false, useUpper: true, useDigits: false, useSymbols: false });
    const password = generatePassword(10, pools);
    expect(password).toMatch(/^[A-Z]+$/);
});

test('数字のみのパスワードが生成できる', () => {
    const pools = buildCharset({ useLower: false, useUpper: false, useDigits: true, useSymbols: false });
    const password = generatePassword(10, pools);
    expect(password).toMatch(/^[0-9]+$/);
});

test('記号のみのパスワードが生成できる', () => {
    const pools = buildCharset({ useLower: false, useUpper: false, useDigits: false, useSymbols: true });
    const password = generatePassword(10, pools);
    expect(password).toMatch(/^[^a-zA-Z0-9]+$/);
});

test('全文字種を含むパスワードが生成できる', () => {
    const pools = buildCharset({ useLower: true, useUpper: true, useDigits: true, useSymbols: true });
    let hasAll = false;
    for (let i = 0; i < 10; i++) {
        const password = generatePassword(20, pools);
        if (/[a-z]/.test(password) && /[A-Z]/.test(password) &&
            /[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password)) {
            hasAll = true;
            break;
        }
    }
    expect(hasAll).toBe(true);
});

test('紛らわしい文字を除外できる', () => {
    const pools = buildCharset({ useLower: true, useUpper: true, useDigits: true, useSymbols: true, excludeAmbiguous: true });
    for (let i = 0; i < 10; i++) {
        const password = generatePassword(30, pools);
        expect(password).notToMatch(/[0O1lI|`'" ,.;:]/);
    }
});

test('文字種が選択されていない場合はnullを返す', () => {
    const pools = buildCharset({ useLower: false, useUpper: false, useDigits: false, useSymbols: false });
    const password = generatePassword(10, pools);
    expect(password).toBeNull();
});

test('長さがプール数より短い場合はnullを返す', () => {
    const pools = buildCharset({ useLower: true, useUpper: true, useDigits: true, useSymbols: true });
    const password = generatePassword(2, pools);
    expect(password).toBeNull();
});

console.log('\n【パスワード強度】');

test('空パスワードの強度は"none"', () => {
    const strength = calculateStrength('');
    expect(strength.level).toBe('none');
});

test('短いパスワードは"weak"', () => {
    const strength = calculateStrength('abc');
    expect(strength.level).toBe('weak');
});

test('中程度のパスワードは"fair"または"good"', () => {
    const strength = calculateStrength('Abc123');
    expect(strength.score).toBeGreaterThanOrEqual(2);
});

test('長く複雑なパスワードは"strong"', () => {
    const strength = calculateStrength('Abc123!@#XyzQwe456');
    expect(strength.level).toBe('strong');
});

test('エントロピーが正しく計算される', () => {
    const strength = calculateStrength('aaaa');
    expect(strength.entropy).toBeGreaterThan(15);
    expect(strength.entropy).toBeLessThan(25);
});

test('文字種が増えるとエントロピーが上がる', () => {
    const lowerOnly = calculateStrength('abcdefgh');
    const mixed = calculateStrength('aBcD1234');
    expect(mixed.entropy).toBeGreaterThan(lowerOnly.entropy);
});

console.log('\n【エクスポート/インポート】');

// エクスポートデータ生成関数
function createExportData(history, settings) {
    return {
        version: 1,
        exportedAt: new Date().toISOString(),
        history: history,
        settings: settings
    };
}

// インポートバリデーション関数
function validateImportData(data) {
    if (!data.history || !Array.isArray(data.history)) {
        return { valid: false, error: '無効なファイル形式です' };
    }

    const validHistory = data.history.filter(item =>
        item && typeof item.pw === 'string' && item.pw.length > 0
    );

    return { valid: true, history: validHistory, settings: data.settings };
}

// マージ関数
function mergeHistory(currentHistory, newHistory, maxItems = 20) {
    const existingPws = new Set(currentHistory.map(h => h.pw));
    const newItems = newHistory.filter(h => !existingPws.has(h.pw));
    return [...currentHistory, ...newItems].slice(0, maxItems);
}

test('エクスポートデータが正しい形式で生成される', () => {
    const history = [{ pw: 'test123', memo: 'テスト', ts: '2026-01-01T00:00:00Z' }];
    const settings = { length: 16, lower: true, upper: true };
    const exportData = createExportData(history, settings);

    expect(exportData.version).toBe(1);
    expect(typeof exportData.exportedAt).toBe('string');
    expect(exportData.history.length).toBe(1);
    expect(exportData.history[0].pw).toBe('test123');
    expect(exportData.settings.length).toBe(16);
});

test('空の履歴でもエクスポートできる', () => {
    const exportData = createExportData([], null);
    expect(exportData.history.length).toBe(0);
});

test('有効なインポートデータを検証できる', () => {
    const data = {
        version: 1,
        history: [{ pw: 'password1', memo: '', ts: '2026-01-01T00:00:00Z' }],
        settings: { length: 20 }
    };
    const result = validateImportData(data);

    expect(result.valid).toBe(true);
    expect(result.history.length).toBe(1);
});

test('historyがないデータは無効', () => {
    const data = { version: 1, settings: {} };
    const result = validateImportData(data);

    expect(result.valid).toBe(false);
});

test('historyが配列でないデータは無効', () => {
    const data = { version: 1, history: 'invalid', settings: {} };
    const result = validateImportData(data);

    expect(result.valid).toBe(false);
});

test('空のパスワードはフィルタリングされる', () => {
    const data = {
        version: 1,
        history: [
            { pw: 'valid', memo: '', ts: '' },
            { pw: '', memo: '', ts: '' },
            { pw: 'also-valid', memo: '', ts: '' }
        ]
    };
    const result = validateImportData(data);

    expect(result.valid).toBe(true);
    expect(result.history.length).toBe(2);
});

test('履歴のマージが正しく動作する', () => {
    const current = [
        { pw: 'existing1', memo: '', ts: '' },
        { pw: 'existing2', memo: '', ts: '' }
    ];
    const newData = [
        { pw: 'existing1', memo: '', ts: '' },  // 重複
        { pw: 'new1', memo: '', ts: '' }
    ];

    const merged = mergeHistory(current, newData);

    expect(merged.length).toBe(3);  // existing1, existing2, new1
});

test('マージ時に最大件数が制限される', () => {
    const current = Array.from({ length: 15 }, (_, i) => ({ pw: `current${i}`, memo: '', ts: '' }));
    const newData = Array.from({ length: 10 }, (_, i) => ({ pw: `new${i}`, memo: '', ts: '' }));

    const merged = mergeHistory(current, newData, 20);

    expect(merged.length).toBe(20);  // 最大20件
});

test('重複するパスワードはマージされない', () => {
    const current = [{ pw: 'same', memo: 'old', ts: '' }];
    const newData = [{ pw: 'same', memo: 'new', ts: '' }];

    const merged = mergeHistory(current, newData);

    expect(merged.length).toBe(1);
    expect(merged[0].memo).toBe('old');  // 既存のデータが保持される
});

// 結果サマリー
console.log('\n========================================');
console.log(`  結果: ${passed}/${passed + failed} 成功`);
if (failed === 0) {
    console.log('  ✓ すべてのテストが成功しました');
} else {
    console.log(`  ✗ ${failed} 件のテストが失敗しました`);
}
console.log('========================================\n');

process.exit(failed > 0 ? 1 : 0);
