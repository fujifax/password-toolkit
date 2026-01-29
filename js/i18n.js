// 翻訳辞書
const I18N_TRANSLATIONS = {
    ja: {
        pageTitle: 'パスワードジェネレーター',
        headingGenerate: 'パスワード生成',
        placeholderGenerate: '生成ボタンを押してください',
        btnGenerate: '生成',
        btnCopy: 'コピー',
        btnSave: '保存',
        labelLength: 'パスワードの長さ',
        optLowercase: '小文字 (a-z)',
        optUppercase: '大文字 (A-Z)',
        optDigits: '数字 (0-9)',
        optSymbols: '記号 (!#$%...)',
        optExcludeAmbiguous: '紛らわしい文字を除外',
        headingHistory: '保存したパスワード履歴',
        emptyHistory: '履歴がありません',
        btnExport: 'エクスポート',
        btnImport: 'インポート',
        btnClearAll: '全削除',
        storageInfo: 'データはブラウザのローカルストレージに保存されます',
        placeholderMemo: 'メモを入力...',
        strengthWeak: '弱い',
        strengthFair: 'やや弱い',
        strengthGood: '良好',
        strengthStrong: '強い',
        strengthDetails: '{length}文字 / エントロピー: {entropy}bit',
        toastSelectCharType: '少なくとも1つの文字種を選択してください',
        toastLengthTooShort: 'パスワードの長さが短すぎます',
        toastSaveFailed: '保存に失敗しました',
        toastDuplicatePassword: '同じパスワードが既に保存されています',
        toastSavedToHistory: '履歴に保存しました',
        toastDeleted: '削除しました',
        toastCopied: 'コピーしました',
        toastCopyFailed: 'コピーに失敗しました',
        toastGenerateFirst: 'パスワードを生成してください',
        toastExported: 'エクスポートしました',
        toastInvalidFile: '無効なファイル形式です',
        toastNoValidPasswords: '有効なパスワードが見つかりませんでした',
        toastImported: '{count}件インポートしました',
        toastFileReadFailed: 'ファイルの読み込みに失敗しました',
        toastHistoryCleared: '履歴を削除しました',
        confirmClearAll: 'すべての履歴を削除しますか？',
        confirmImportMerge: '現在{count}件の履歴があります。\n\nOK: 既存データに追加（マージ）\nキャンセル: 既存データを置き換え',
        themeToggleDark: 'ダークモードに切り替え',
        themeToggleLight: 'ライトモードに切り替え',
    },
    en: {
        pageTitle: 'Password Generator',
        headingGenerate: 'Generate Password',
        placeholderGenerate: 'Click Generate to create a password',
        btnGenerate: 'Generate',
        btnCopy: 'Copy',
        btnSave: 'Save',
        labelLength: 'Password Length',
        optLowercase: 'Lowercase (a-z)',
        optUppercase: 'Uppercase (A-Z)',
        optDigits: 'Digits (0-9)',
        optSymbols: 'Symbols (!#$%...)',
        optExcludeAmbiguous: 'Exclude ambiguous characters',
        headingHistory: 'Saved Password History',
        emptyHistory: 'No history yet',
        btnExport: 'Export',
        btnImport: 'Import',
        btnClearAll: 'Clear All',
        storageInfo: 'Data is stored in your browser\'s local storage',
        placeholderMemo: 'Add a note...',
        strengthWeak: 'Weak',
        strengthFair: 'Fair',
        strengthGood: 'Good',
        strengthStrong: 'Strong',
        strengthDetails: '{length} chars / Entropy: {entropy} bit',
        toastSelectCharType: 'Select at least one character type',
        toastLengthTooShort: 'Password length is too short',
        toastSaveFailed: 'Failed to save',
        toastDuplicatePassword: 'This password is already saved',
        toastSavedToHistory: 'Saved to history',
        toastDeleted: 'Deleted',
        toastCopied: 'Copied',
        toastCopyFailed: 'Failed to copy',
        toastGenerateFirst: 'Generate a password first',
        toastExported: 'Exported successfully',
        toastInvalidFile: 'Invalid file format',
        toastNoValidPasswords: 'No valid passwords found',
        toastImported: '{count} item(s) imported',
        toastFileReadFailed: 'Failed to read file',
        toastHistoryCleared: 'History cleared',
        confirmClearAll: 'Delete all history?',
        confirmImportMerge: 'You have {count} existing entries.\n\nOK: Merge with existing data\nCancel: Replace existing data',
        themeToggleDark: 'Switch to dark mode',
        themeToggleLight: 'Switch to light mode',
    }
};

// 定数
const I18N_STORAGE_KEY = 'passwordGenerator_lang';
const I18N_SUPPORTED_LANGS = ['ja', 'en'];
const I18N_DEFAULT_LANG = 'ja';

// i18n エンジン
const i18n = {
    _lang: I18N_DEFAULT_LANG,

    get lang() {
        return this._lang;
    },

    get locale() {
        const localeMap = { ja: 'ja-JP', en: 'en-US' };
        return localeMap[this._lang] || 'ja-JP';
    },

    detectLanguage() {
        const browserLangs = navigator.languages || [navigator.language];
        for (const browserLang of browserLangs) {
            const code = browserLang.toLowerCase();
            const match = I18N_SUPPORTED_LANGS.find(
                supported => code === supported || code.startsWith(supported + '-')
            );
            if (match) return match;
        }
        return I18N_DEFAULT_LANG;
    },

    init() {
        const saved = localStorage.getItem(I18N_STORAGE_KEY);
        if (saved && I18N_SUPPORTED_LANGS.includes(saved)) {
            this._lang = saved;
        } else {
            this._lang = this.detectLanguage();
        }
        this.applyToPage();
    },

    setLanguage(lang) {
        if (!I18N_SUPPORTED_LANGS.includes(lang)) return;
        this._lang = lang;
        localStorage.setItem(I18N_STORAGE_KEY, lang);
        this.applyToPage();
    },

    t(key, params) {
        const dict = I18N_TRANSLATIONS[this._lang] || I18N_TRANSLATIONS[I18N_DEFAULT_LANG];
        let text = dict[key];
        if (text === undefined) {
            text = (I18N_TRANSLATIONS[I18N_DEFAULT_LANG] || {})[key] || key;
        }
        if (params) {
            for (const [k, v] of Object.entries(params)) {
                text = text.replace(new RegExp('\\{' + k + '\\}', 'g'), v);
            }
        }
        return text;
    },

    applyToPage() {
        document.documentElement.lang = this._lang;
        document.title = this.t('pageTitle');

        document.querySelectorAll('[data-i18n]').forEach(el => {
            el.textContent = this.t(el.dataset.i18n);
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            el.placeholder = this.t(el.dataset.i18nPlaceholder);
        });

        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            el.title = this.t(el.dataset.i18nTitle);
        });

        document.querySelectorAll('[data-lang]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === this._lang);
        });
    }
};

i18n.init();
