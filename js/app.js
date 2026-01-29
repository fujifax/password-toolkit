// 定数
const AMBIGUOUS = new Set("0O1lI|`'\" ,.;:");
const SYMBOLS = "!#$%&()*+,-./:;<=>?@[]^_{|}~";
const STORAGE_KEY_HISTORY = 'passwordGenerator_history';
const STORAGE_KEY_SETTINGS = 'passwordGenerator_settings';
const MAX_HISTORY_ITEMS = 20;

// DOM要素
const passwordDisplay = document.getElementById('passwordDisplay');
const generateBtn = document.getElementById('generateBtn');
const copyBtn = document.getElementById('copyBtn');
const saveBtn = document.getElementById('saveBtn');
const lengthSlider = document.getElementById('lengthSlider');
const lengthValue = document.getElementById('lengthValue');
const useLower = document.getElementById('useLower');
const useUpper = document.getElementById('useUpper');
const useDigits = document.getElementById('useDigits');
const useSymbols = document.getElementById('useSymbols');
const excludeAmbiguous = document.getElementById('excludeAmbiguous');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');
const toast = document.getElementById('toast');
const strengthBar = document.getElementById('strengthBar');
const strengthLabel = document.getElementById('strengthLabel');
const strengthDetails = document.getElementById('strengthDetails');
const toggleHistoryBtn = document.getElementById('toggleHistoryBtn');
const historyButtons = document.querySelector('.history-buttons');
const themeToggleBtn = document.getElementById('themeToggleBtn');

let currentPassword = '';
let historyVisible = true;
let darkMode = false;

// ユーティリティ関数
function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

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

// パスワード生成
function buildCharset() {
    const pools = [];
    let lower = 'abcdefghijklmnopqrstuvwxyz';
    let upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let digits = '0123456789';
    let symbols = SYMBOLS;

    if (excludeAmbiguous.checked) {
        lower = [...lower].filter(c => !AMBIGUOUS.has(c)).join('');
        upper = [...upper].filter(c => !AMBIGUOUS.has(c)).join('');
        digits = [...digits].filter(c => !AMBIGUOUS.has(c)).join('');
        symbols = [...symbols].filter(c => !AMBIGUOUS.has(c)).join('');
    }

    if (useLower.checked && lower) pools.push(lower);
    if (useUpper.checked && upper) pools.push(upper);
    if (useDigits.checked && digits) pools.push(digits);
    if (useSymbols.checked && symbols) pools.push(symbols);

    return pools;
}

function generatePassword() {
    const pools = buildCharset();
    const length = parseInt(lengthSlider.value);

    if (pools.length === 0) {
        showToast(i18n.t('toastSelectCharType'));
        return null;
    }

    if (length < pools.length) {
        showToast(i18n.t('toastLengthTooShort'));
        return null;
    }

    // 各プールから最低1文字ずつ選択
    let chars = pools.map(pool => pool[secureRandom(pool.length)]);

    // 残りをランダムに埋める
    const allChars = pools.join('');
    for (let i = chars.length; i < length; i++) {
        chars.push(allChars[secureRandom(allChars.length)]);
    }

    // シャッフル
    shuffleArray(chars);
    return chars.join('');
}

// パスワード強度計算
function calculateStrength(password) {
    if (!password) {
        return { score: 0, level: 'none', label: '-', entropy: 0 };
    }

    let charsetSize = 0;
    if (/[a-z]/.test(password)) charsetSize += 26;
    if (/[A-Z]/.test(password)) charsetSize += 26;
    if (/[0-9]/.test(password)) charsetSize += 10;
    if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32;

    // エントロピー計算: log2(charsetSize^length)
    const entropy = password.length * Math.log2(charsetSize || 1);

    // スコア判定
    let score, level, label;
    if (entropy < 28) {
        score = 1;
        level = 'weak';
        label = 'strengthWeak';
    } else if (entropy < 36) {
        score = 2;
        level = 'fair';
        label = 'strengthFair';
    } else if (entropy < 60) {
        score = 3;
        level = 'good';
        label = 'strengthGood';
    } else {
        score = 4;
        level = 'strong';
        label = 'strengthStrong';
    }

    return { score, level, label, entropy: Math.round(entropy) };
}

function updateStrengthDisplay(password) {
    const strength = calculateStrength(password);

    // バーの更新
    strengthBar.className = 'strength-bar';
    if (strength.level !== 'none') {
        strengthBar.classList.add(strength.level);
    }

    // ラベルの更新
    strengthLabel.textContent = strength.label === '-' ? '-' : i18n.t(strength.label);
    strengthLabel.className = 'strength-label';
    if (strength.level !== 'none') {
        strengthLabel.classList.add(strength.level);
    }

    // 詳細情報
    if (password) {
        strengthDetails.textContent = i18n.t('strengthDetails', { length: password.length, entropy: strength.entropy });
    } else {
        strengthDetails.textContent = '';
    }
}

// ローカルストレージ操作
function loadHistory() {
    try {
        const data = localStorage.getItem(STORAGE_KEY_HISTORY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

function saveHistory(history) {
    try {
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    } catch (e) {
        showToast(i18n.t('toastSaveFailed'));
    }
}

function loadSettings() {
    try {
        const data = localStorage.getItem(STORAGE_KEY_SETTINGS);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
}

function saveSettings() {
    const settings = {
        length: parseInt(lengthSlider.value),
        lower: useLower.checked,
        upper: useUpper.checked,
        digits: useDigits.checked,
        symbols: useSymbols.checked,
        exclude: excludeAmbiguous.checked,
        historyVisible: historyVisible,
        darkMode: darkMode
    };
    try {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
        // 設定保存失敗は無視
    }
}

// 履歴表示
function renderHistory() {
    const history = loadHistory();

    if (history.length === 0) {
        historyList.innerHTML = `<div class="empty-history">${i18n.t('emptyHistory')}</div>`;
        return;
    }

    historyList.innerHTML = history.map((item, index) => `
        <div class="history-item" data-index="${index}">
            <button class="delete-btn" onclick="deleteHistoryItem(${index})">×</button>
            <div class="history-password">${escapeHtml(item.pw)}</div>
            <div class="history-meta">
                <div class="history-memo">
                    <input type="text"
                           placeholder="${i18n.t('placeholderMemo')}"
                           value="${escapeHtml(item.memo || '')}"
                           onchange="updateMemo(${index}, this.value)">
                </div>
                <div class="history-actions">
                    <button class="btn btn-secondary btn-small" onclick="copyHistoryItem(${index})">${i18n.t('btnCopy')}</button>
                </div>
            </div>
            <div class="history-timestamp">
                ${formatDate(item.ts)}
            </div>
        </div>
    `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString(i18n.locale);
}

// 履歴操作
function addToHistory(password) {
    const history = loadHistory();

    // 重複チェック
    if (history.length > 0 && history[0].pw === password) {
        showToast(i18n.t('toastDuplicatePassword'));
        return false;
    }

    history.unshift({
        pw: password,
        memo: '',
        ts: new Date().toISOString()
    });

    // 最大件数制限
    while (history.length > MAX_HISTORY_ITEMS) {
        history.pop();
    }

    saveHistory(history);
    renderHistory();
    showToast(i18n.t('toastSavedToHistory'));
    return true;
}

function deleteHistoryItem(index) {
    const history = loadHistory();
    if (index >= 0 && index < history.length) {
        history.splice(index, 1);
        saveHistory(history);
        renderHistory();
        showToast(i18n.t('toastDeleted'));
    }
}

function updateMemo(index, memo) {
    const history = loadHistory();
    if (index >= 0 && index < history.length) {
        history[index].memo = memo;
        saveHistory(history);
    }
}

function copyHistoryItem(index) {
    const history = loadHistory();
    if (index >= 0 && index < history.length) {
        navigator.clipboard.writeText(history[index].pw)
            .then(() => showToast(i18n.t('toastCopied')))
            .catch(() => showToast(i18n.t('toastCopyFailed')));
    }
}

function clearHistory() {
    if (confirm(i18n.t('confirmClearAll'))) {
        saveHistory([]);
        renderHistory();
        showToast(i18n.t('toastHistoryCleared'));
    }
}

// エクスポート/インポート
function exportData() {
    const history = loadHistory();
    const settings = loadSettings();

    const exportObj = {
        version: 1,
        exportedAt: new Date().toISOString(),
        history: history,
        settings: settings
    };

    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `password-toolkit-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(i18n.t('toastExported'));
}

function importData(file) {
    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);

            // バリデーション
            if (!data.history || !Array.isArray(data.history)) {
                showToast(i18n.t('toastInvalidFile'));
                return;
            }

            // 履歴のバリデーション
            const validHistory = data.history.filter(item =>
                item && typeof item.pw === 'string' && item.pw.length > 0
            );

            if (validHistory.length === 0 && data.history.length > 0) {
                showToast(i18n.t('toastNoValidPasswords'));
                return;
            }

            // インポート方法を確認
            const currentHistory = loadHistory();
            let importMode = 'replace';

            if (currentHistory.length > 0) {
                const choice = confirm(i18n.t('confirmImportMerge', { count: currentHistory.length }));
                importMode = choice ? 'merge' : 'replace';
            }

            let newHistory;
            if (importMode === 'merge') {
                // マージ（重複除去）
                const existingPws = new Set(currentHistory.map(h => h.pw));
                const newItems = validHistory.filter(h => !existingPws.has(h.pw));
                newHistory = [...currentHistory, ...newItems];
            } else {
                newHistory = validHistory;
            }

            // 最大件数制限
            newHistory = newHistory.slice(0, MAX_HISTORY_ITEMS);

            saveHistory(newHistory);

            // 設定もインポート（存在する場合）
            if (data.settings) {
                localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(data.settings));
                // 設定を画面に反映
                const settings = data.settings;
                lengthSlider.value = settings.length || 16;
                lengthValue.textContent = lengthSlider.value;
                useLower.checked = settings.lower !== false;
                useUpper.checked = settings.upper !== false;
                useDigits.checked = settings.digits !== false;
                useSymbols.checked = settings.symbols !== false;
                excludeAmbiguous.checked = settings.exclude || false;
            }

            renderHistory();
            showToast(i18n.t('toastImported', { count: validHistory.length }));

        } catch (err) {
            showToast(i18n.t('toastFileReadFailed'));
            console.error('Import error:', err);
        }
    };

    reader.onerror = () => {
        showToast(i18n.t('toastFileReadFailed'));
    };

    reader.readAsText(file);
}

// イベントリスナー
generateBtn.addEventListener('click', () => {
    const password = generatePassword();
    if (password) {
        currentPassword = password;
        passwordDisplay.textContent = password;
        updateStrengthDisplay(password);
        saveSettings();
    }
});

copyBtn.addEventListener('click', () => {
    if (currentPassword) {
        navigator.clipboard.writeText(currentPassword)
            .then(() => showToast(i18n.t('toastCopied')))
            .catch(() => showToast(i18n.t('toastCopyFailed')));
    } else {
        showToast(i18n.t('toastGenerateFirst'));
    }
});

saveBtn.addEventListener('click', () => {
    if (currentPassword) {
        addToHistory(currentPassword);
    } else {
        showToast(i18n.t('toastGenerateFirst'));
    }
});

lengthSlider.addEventListener('input', () => {
    lengthValue.textContent = lengthSlider.value;
});

lengthSlider.addEventListener('change', saveSettings);
useLower.addEventListener('change', saveSettings);
useUpper.addEventListener('change', saveSettings);
useDigits.addEventListener('change', saveSettings);
useSymbols.addEventListener('change', saveSettings);
excludeAmbiguous.addEventListener('change', saveSettings);

clearHistoryBtn.addEventListener('click', clearHistory);

exportBtn.addEventListener('click', exportData);

importBtn.addEventListener('click', () => {
    importFile.click();
});

importFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        importData(file);
        importFile.value = ''; // リセット
    }
});

// 履歴表示/非表示切り替え
function toggleHistoryVisibility() {
    historyVisible = !historyVisible;
    historyList.classList.toggle('hidden', !historyVisible);
    historyButtons.classList.toggle('hidden', !historyVisible);
    toggleHistoryBtn.textContent = historyVisible ? '▲' : '▼';
    saveSettings();
}

toggleHistoryBtn.addEventListener('click', toggleHistoryVisibility);

// ダークモード切り替え
function applyTheme() {
    document.body.classList.toggle('dark-mode', darkMode);
    themeToggleBtn.textContent = darkMode ? '☀️' : '🌙';
    themeToggleBtn.title = darkMode ? i18n.t('themeToggleLight') : i18n.t('themeToggleDark');
}

function toggleDarkMode() {
    darkMode = !darkMode;
    applyTheme();
    saveSettings();
}

themeToggleBtn.addEventListener('click', toggleDarkMode);

// 言語切替
document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        i18n.setLanguage(btn.dataset.lang);
        onLanguageChange();
    });
});

function onLanguageChange() {
    if (!currentPassword) {
        passwordDisplay.textContent = i18n.t('placeholderGenerate');
    }
    if (currentPassword) {
        updateStrengthDisplay(currentPassword);
    }
    renderHistory();
    applyTheme();
}

// 初期化
function init() {
    // 設定の復元
    const settings = loadSettings();
    if (settings) {
        lengthSlider.value = settings.length || 16;
        lengthValue.textContent = lengthSlider.value;
        useLower.checked = settings.lower !== false;
        useUpper.checked = settings.upper !== false;
        useDigits.checked = settings.digits !== false;
        useSymbols.checked = settings.symbols !== false;
        excludeAmbiguous.checked = settings.exclude || false;

        // 履歴表示状態の復元
        historyVisible = settings.historyVisible !== false;
        historyList.classList.toggle('hidden', !historyVisible);
        historyButtons.classList.toggle('hidden', !historyVisible);
        toggleHistoryBtn.textContent = historyVisible ? '▲' : '▼';

        // ダークモード設定の復元
        darkMode = settings.darkMode || false;
        applyTheme();
    }

    // 翻訳済みプレースホルダーを設定
    passwordDisplay.textContent = i18n.t('placeholderGenerate');

    // 履歴の表示
    renderHistory();
}

init();
