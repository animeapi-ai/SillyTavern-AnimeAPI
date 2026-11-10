/*
 * AnimeAPI Image Generation for SillyTavern
 * https://github.com/animeapi-ai/SillyTavern-AnimeAPI
 *
 * Generates an anime illustration from the current chat with AnimeAPI
 * (https://animeapi.ai) and inserts it into the chat. Uses only the stable
 * SillyTavern.getContext() API, so it has no imports from SillyTavern itself.
 */

const MODULE = 'animeapi';
const API_URL = 'https://animeapi.ai/api/generate';
const KEYS_URL = 'https://animeapi.ai/dashboard/api-keys';
const BILLING_URL = 'https://animeapi.ai/dashboard/billing';
const MAX_PROMPT = 1000;

const MODELS = {
    'anime': { price: 0.003, label: 'anime' },
    'ultra': { price: 0.01, label: 'ultra' },
    'ultra-max': { price: 0.02, label: 'ultra-max' },
};
const ORIENTATIONS = ['portrait', 'square', 'landscape'];

const defaultSettings = Object.freeze({
    api_key: '',
    model: 'anime',
    orientation: 'portrait',
    enhance: true,
    prefix: '',
    hide_from_ai: true,
    last_balance: null,
});

const STRINGS = {
    'en': {
        title: 'AnimeAPI Image Generation',
        key: 'API key',
        key_placeholder: 'ank_…',
        get_key: 'Get a key (3 free images, no card)',
        model: 'Model',
        orientation: 'Orientation',
        portrait: 'Portrait',
        square: 'Square',
        landscape: 'Landscape',
        per_image: 'per image',
        model_anime: 'anime: fast, best at characters',
        model_ultra: 'ultra: follows long sentences, renders text',
        model_ultra_max: 'ultra-max: ultra with finer detail',
        enhance: 'Rewrite my prompt into tags (recommended for the anime model)',
        hide_from_ai: 'Hide generated images from the AI\'s context',
        prefix: 'Always add',
        prefix_placeholder: 'e.g. your character\'s look: silver hair, red eyes, black coat',
        price: 'Price',
        balance: 'Balance',
        balance_unknown: 'shown after your first image',
        add_funds: 'Add funds',
        hint: 'Use the wand menu, the sparkle button in each message\'s ⋯ menu, or /anime last | char | your prompt.',
        menu_last: 'AnimeAPI: last message',
        menu_char: 'AnimeAPI: character',
        menu_free: 'AnimeAPI: custom prompt',
        mes_button: 'Illustrate this message with AnimeAPI',
        free_title: 'Describe the image',
        generating: 'Generating image…',
        done: 'Image added. Balance: ',
        no_key: 'Add your AnimeAPI key in Extensions → AnimeAPI Image Generation.',
        no_chat: 'Open a chat first.',
        no_text: 'There is nothing to illustrate yet.',
        no_char: 'No character is selected.',
        no_balance: 'Your AnimeAPI balance is empty.',
        bad_key: 'AnimeAPI did not accept this key.',
        check_key: 'Check your key',
        rejected: 'The image was rejected: ',
        busy: 'AnimeAPI is busy. Try again in a few seconds.',
        failed: 'Image generation failed: ',
        network: 'Could not reach AnimeAPI. Check your connection.',
        chat_changed: 'Chat changed, image discarded.',
        cmd_help: 'Generate an anime image with AnimeAPI and add it to the chat. Use <code>/anime last</code> for the last message, <code>/anime char</code> for the character description, or <code>/anime your prompt</code>. Returns the saved image path.',
    },
    'zh-cn': {
        title: 'AnimeAPI 图片生成',
        key: 'API 密钥',
        key_placeholder: 'ank_…',
        get_key: '获取密钥（免费 3 张，无需绑卡）',
        model: '模型',
        orientation: '画幅',
        portrait: '竖图',
        square: '方图',
        landscape: '横图',
        per_image: '每张',
        model_anime: 'anime：速度快，最擅长角色',
        model_ultra: 'ultra：理解长句，可渲染文字',
        model_ultra_max: 'ultra-max：细节更精致的 ultra',
        enhance: '自动把提示词改写为标签（anime 模型推荐）',
        hide_from_ai: '生成的图片不计入 AI 上下文',
        prefix: '固定附加',
        prefix_placeholder: '例如角色外貌：银发、红瞳、黑色外套',
        price: '价格',
        balance: '余额',
        balance_unknown: '生成第一张图后显示',
        add_funds: '充值',
        hint: '使用魔杖菜单、消息 ⋯ 菜单里的闪光按钮，或 /anime last | char | 你的提示词。',
        menu_last: 'AnimeAPI：最后一条消息',
        menu_char: 'AnimeAPI：角色',
        menu_free: 'AnimeAPI：自定义提示词',
        mes_button: '用 AnimeAPI 为这条消息配图',
        free_title: '描述你想要的图片',
        generating: '正在生成图片…',
        done: '图片已添加。余额：',
        no_key: '请先在 扩展 → AnimeAPI 图片生成 中填写 AnimeAPI 密钥。',
        no_chat: '请先打开一个聊天。',
        no_text: '还没有可以配图的内容。',
        no_char: '未选择角色。',
        no_balance: '你的 AnimeAPI 余额不足。',
        bad_key: 'AnimeAPI 未接受该密钥。',
        check_key: '检查密钥',
        rejected: '图片被拒绝：',
        busy: 'AnimeAPI 繁忙，请稍后重试。',
        failed: '图片生成失败：',
        network: '无法连接 AnimeAPI，请检查网络。',
        chat_changed: '聊天已切换，图片已丢弃。',
        cmd_help: '用 AnimeAPI 生成动漫图片并添加到聊天。<code>/anime last</code> 使用最后一条消息，<code>/anime char</code> 使用角色描述，或 <code>/anime 你的提示词</code>。返回保存的图片路径。',
    },
    'ja-jp': {
        title: 'AnimeAPI 画像生成',
        key: 'API キー',
        key_placeholder: 'ank_…',
        get_key: 'キーを取得（無料 3 枚、カード不要）',
        model: 'モデル',
        orientation: '向き',
        portrait: '縦長',
        square: '正方形',
        landscape: '横長',
        per_image: '1 枚あたり',
        model_anime: 'anime：高速、キャラクターが得意',
        model_ultra: 'ultra：長文に強く、文字も描ける',
        model_ultra_max: 'ultra-max：より精細な ultra',
        enhance: 'プロンプトをタグに自動変換（anime モデル推奨）',
        hide_from_ai: '生成画像を AI のコンテキストに含めない',
        prefix: '常に追加',
        prefix_placeholder: '例：キャラの外見（銀髪、赤い瞳、黒いコート）',
        price: '価格',
        balance: '残高',
        balance_unknown: '最初の画像の生成後に表示',
        add_funds: 'チャージ',
        hint: '杖メニュー、各メッセージの ⋯ メニューにあるキラキラボタン、または /anime last | char | プロンプト を使います。',
        menu_last: 'AnimeAPI：最後のメッセージ',
        menu_char: 'AnimeAPI：キャラクター',
        menu_free: 'AnimeAPI：自由入力',
        mes_button: 'このメッセージを AnimeAPI でイラスト化',
        free_title: '画像の内容を入力',
        generating: '画像を生成中…',
        done: '画像を追加しました。残高：',
        no_key: '拡張機能 → AnimeAPI 画像生成 で AnimeAPI キーを入力してください。',
        no_chat: '先にチャットを開いてください。',
        no_text: 'イラスト化する内容がまだありません。',
        no_char: 'キャラクターが選択されていません。',
        no_balance: 'AnimeAPI の残高がありません。',
        bad_key: 'AnimeAPI がこのキーを受け付けませんでした。',
        check_key: 'キーを確認',
        rejected: '画像が拒否されました：',
        busy: 'AnimeAPI が混雑しています。数秒後にもう一度お試しください。',
        failed: '画像生成に失敗しました：',
        network: 'AnimeAPI に接続できません。ネットワークを確認してください。',
        chat_changed: 'チャットが切り替わったため、画像を破棄しました。',
        cmd_help: 'AnimeAPI でアニメ画像を生成してチャットに追加します。<code>/anime last</code> は最後のメッセージ、<code>/anime char</code> はキャラクター説明、<code>/anime プロンプト</code> は自由入力。保存した画像のパスを返します。',
    },
};
STRINGS['zh-tw'] = STRINGS['zh-cn'];

const ctx = () => SillyTavern.getContext();

function s(key) {
    let locale = 'en';
    try {
        locale = String(ctx().getCurrentLocale?.() || 'en').toLowerCase();
    } catch { /* older SillyTavern */ }
    return (STRINGS[locale] || STRINGS.en)[key] ?? STRINGS.en[key] ?? key;
}

function esc(text) {
    return String(text ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c]));
}

function getSettings() {
    const { extensionSettings } = ctx();
    if (!extensionSettings[MODULE]) {
        extensionSettings[MODULE] = structuredClone(defaultSettings);
    }
    for (const key of Object.keys(defaultSettings)) {
        if (!Object.hasOwn(extensionSettings[MODULE], key)) {
            extensionSettings[MODULE][key] = defaultSettings[key];
        }
    }
    if (!MODELS[extensionSettings[MODULE].model]) extensionSettings[MODULE].model = defaultSettings.model;
    if (!ORIENTATIONS.includes(extensionSettings[MODULE].orientation)) extensionSettings[MODULE].orientation = defaultSettings.orientation;
    return extensionSettings[MODULE];
}

function saveSettings() {
    ctx().saveSettingsDebounced();
}

function formatUsd(value, digits = 2) {
    return '$' + Number(value).toFixed(digits);
}

function formatPrice(model) {
    const price = MODELS[model]?.price ?? MODELS.anime.price;
    return '$' + String(price);
}

class AnimeApiError extends Error {
    /**
     * @param {string} message
     * @param {{status?: number, code?: string, retryable?: boolean}} [info]
     */
    constructor(message, info = {}) {
        super(message);
        this.name = 'AnimeApiError';
        this.status = info.status ?? 0;
        this.code = info.code ?? '';
        this.retryable = info.retryable ?? false;
    }
}

/**
 * Calls AnimeAPI. Retries once when the API says the same request can succeed.
 * @returns {Promise<{image_url: string, enhanced_prompt: string, balance_usd: number, generation_time_ms: number}>}
 */
async function callAnimeApi({ prompt, model, orientation }) {
    const settings = getSettings();
    const body = JSON.stringify({
        prompt,
        model,
        orientation,
        enhance: !!settings.enhance,
    });

    for (let attempt = 1; ; attempt++) {
        let response;
        try {
            response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${settings.api_key.trim()}`,
                    'Content-Type': 'application/json',
                },
                body,
            });
        } catch (error) {
            throw new AnimeApiError(s('network'), { code: 'NETWORK' });
        }

        let data = {};
        try {
            data = await response.json();
        } catch { /* non-JSON error body */ }

        if (response.ok && data.image_url) {
            return data;
        }

        const retryable = data.retryable === true || response.status === 500 || response.status === 503;
        if (retryable && attempt < 2) {
            const wait = Math.min(Number(response.headers.get('Retry-After')) || 3, 10);
            await new Promise(resolve => setTimeout(resolve, wait * 1000));
            continue;
        }

        const message = typeof data.error === 'string' ? data.error : (data.error?.message || `HTTP ${response.status}`);
        throw new AnimeApiError(message, { status: response.status, code: data.code || '', retryable });
    }
}

function showError(error) {
    const options = { escapeHtml: false, timeOut: 15000, extendedTimeOut: 15000 };
    const link = (url, text) => `<br><a href="${url}" target="_blank" rel="noopener" style="text-decoration: underline;">${esc(text)} ↗</a>`;
    const title = 'AnimeAPI';

    if (!(error instanceof AnimeApiError)) {
        console.error('[AnimeAPI]', error);
        toastr.error(esc(s('failed') + (error?.message || error)), title, options);
        return;
    }

    console.warn('[AnimeAPI]', error.status, error.code, error.message);
    if (error.status === 402 || error.code === 'INSUFFICIENT_BALANCE') {
        toastr.error(esc(s('no_balance')) + link(BILLING_URL, s('add_funds')), title, options);
    } else if (error.status === 401) {
        toastr.error(esc(s('bad_key')) + ' ' + esc(error.message) + link(KEYS_URL, s('check_key')), title, options);
    } else if (error.code === 'MODERATION_BLOCKED' || error.code === 'PROVIDER_REJECTED') {
        toastr.error(esc(s('rejected') + error.message), title, options);
    } else if (error.status === 503 || error.status === 429) {
        toastr.warning(esc(s('busy')), title, options);
    } else if (error.code === 'NETWORK') {
        toastr.error(esc(error.message), title, options);
    } else {
        toastr.error(esc(s('failed') + error.message), title, options);
    }
}

/** Turns chat text into something an image model can read. */
function cleanText(text) {
    let result = String(text ?? '');
    try {
        result = ctx().substituteParams(result);
    } catch { /* keep raw text */ }
    return result
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/<(think|thinking|reasoning)>[\s\S]*?<\/\1>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/[*_~`#>]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function buildPrompt(text) {
    const prefix = cleanText(getSettings().prefix);
    const room = prefix ? MAX_PROMPT - prefix.length - 2 : MAX_PROMPT;
    const main = cleanText(text).slice(0, Math.max(room, 0)).trim();
    return (prefix ? `${main}, ${prefix}` : main).slice(0, MAX_PROMPT);
}

function findLastMessage() {
    const { chat } = ctx();
    for (let i = chat.length - 1; i >= 0; i--) {
        const message = chat[i];
        if (!message || message.is_system) continue;
        if (cleanText(message.mes)) return message;
    }
    return null;
}

function getCharacterText() {
    const context = ctx();
    const character = context.characters?.[context.characterId];
    if (!character) return '';
    let description = character.description || character.data?.description || '';
    try {
        description = context.getCharacterCardFields?.()?.description || description;
    } catch { /* fall back to the raw card */ }
    return `${character.name}. ${description}`;
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1]);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
}

/** Downloads the generated image and stores it in SillyTavern's user images folder. */
async function saveImage(imageUrl, folder) {
    const download = await fetch(imageUrl);
    if (!download.ok) {
        throw new Error(`Image download failed (HTTP ${download.status})`);
    }
    const blob = await download.blob();
    const format = /png/i.test(blob.type) || /\.png(\?|$)/i.test(imageUrl) ? 'png' : (/jpe?g/i.test(blob.type) ? 'jpg' : 'webp');
    const context = ctx();
    const stamp = context.humanizedDateTime ? context.humanizedDateTime() : String(Date.now());
    const response = await fetch('/api/images/upload', {
        method: 'POST',
        headers: context.getRequestHeaders(),
        body: JSON.stringify({
            image: await blobToBase64(blob),
            format,
            ch_name: folder,
            filename: `animeapi_${stamp}`.replace(/\./g, '_'),
        }),
    });
    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'SillyTavern could not save the image');
    }
    return (await response.json()).path;
}

async function insertImageMessage(path, title) {
    const context = ctx();
    const settings = getSettings();
    const supportsMediaArray = typeof context.ensureMessageMediaIsArray === 'function';
    const extra = supportsMediaArray
        ? { media: [{ url: path, type: 'image', title, source: 'generated' }], media_display: 'gallery', media_index: 0, inline_image: false }
        : { image: path, title, inline_image: false };
    const message = {
        name: context.groupId ? 'AnimeAPI' : context.name2,
        is_user: false,
        is_system: !!settings.hide_from_ai,
        send_date: new Date().toISOString(),
        mes: '',
        extra,
    };
    const types = context.eventTypes || context.event_types;
    context.chat.push(message);
    const messageId = context.chat.length - 1;
    await context.eventSource.emit(types.MESSAGE_RECEIVED, messageId, 'extension');
    context.addOneMessage(message);
    await context.eventSource.emit(types.CHARACTER_MESSAGE_RENDERED, messageId, 'extension');
    await context.saveChat();
    if (typeof context.scrollOnMediaLoad === 'function') {
        setTimeout(() => context.scrollOnMediaLoad(), 300);
    }
}

let busy = false;

/**
 * Generates one image and adds it to the chat.
 * @param {string} text Prompt source text
 * @param {{model?: string, orientation?: string, quiet?: boolean}} [options]
 * @returns {Promise<string>} Saved image path, or an empty string on failure
 */
async function generate(text, options = {}) {
    const context = ctx();
    const settings = getSettings();

    if (!settings.api_key.trim()) {
        toastr.warning(esc(s('no_key')) + `<br><a href="${KEYS_URL}" target="_blank" rel="noopener" style="text-decoration: underline;">${esc(s('get_key'))} ↗</a>`, 'AnimeAPI', { escapeHtml: false, timeOut: 12000 });
        return '';
    }
    const chatId = context.getCurrentChatId();
    if (!chatId && !options.quiet) {
        toastr.warning(s('no_chat'), 'AnimeAPI');
        return '';
    }
    const prompt = buildPrompt(text);
    if (!prompt) {
        toastr.warning(s('no_text'), 'AnimeAPI');
        return '';
    }
    if (busy) return '';

    const model = MODELS[options.model] ? options.model : settings.model;
    const orientation = ORIENTATIONS.includes(options.orientation) ? options.orientation : settings.orientation;

    busy = true;
    $('#animeapi_wand_container, .animeapi_mes_gen').addClass('animeapi_busy');
    const progress = toastr.info(`${s('generating')} (${model}, ${formatPrice(model)})`, 'AnimeAPI', { timeOut: 0, extendedTimeOut: 0 });
    try {
        const result = await callAnimeApi({ prompt, model, orientation });
        settings.last_balance = result.balance_usd;
        saveSettings();
        updateStatus();

        const character = context.characters?.[context.characterId];
        const folder = context.groupId ? '' : (character?.name || '');
        const path = await saveImage(result.image_url, folder);

        if (!options.quiet) {
            if (chatId !== ctx().getCurrentChatId()) {
                toastr.warning(s('chat_changed'), 'AnimeAPI');
                return path;
            }
            await insertImageMessage(path, result.enhanced_prompt || prompt);
        }
        toastr.success(s('done') + formatUsd(result.balance_usd, 3), 'AnimeAPI', { timeOut: 4000 });
        return path;
    } catch (error) {
        showError(error);
        return '';
    } finally {
        busy = false;
        toastr.clear(progress);
        $('#animeapi_wand_container, .animeapi_mes_gen').removeClass('animeapi_busy');
    }
}

async function generateFrom(mode, options = {}) {
    if (mode === 'last') {
        const message = findLastMessage();
        if (!message) {
            toastr.warning(s('no_text'), 'AnimeAPI');
            return '';
        }
        return generate(message.mes, options);
    }
    if (mode === 'char') {
        const text = getCharacterText();
        if (!text) {
            toastr.warning(s('no_char'), 'AnimeAPI');
            return '';
        }
        return generate(text, options);
    }
    if (mode === 'free') {
        const { Popup, POPUP_TYPE, callGenericPopup } = ctx();
        const input = callGenericPopup
            ? await callGenericPopup(s('free_title'), POPUP_TYPE.INPUT, '', { rows: 3 })
            : await Popup.show.input(s('free_title'), '');
        if (!input || typeof input !== 'string') return '';
        return generate(input, options);
    }
    return '';
}

function updateStatus() {
    const settings = getSettings();
    $('#animeapi_price').text(`${formatPrice(settings.model)} ${s('per_image')}`);
    $('#animeapi_balance').text(settings.last_balance === null || settings.last_balance === undefined
        ? s('balance_unknown')
        : formatUsd(settings.last_balance, 3));
}

function addSettingsPanel() {
    const settings = getSettings();
    const modelOptions = Object.keys(MODELS).map(id =>
        `<option value="${id}">${esc(s('model_' + id.replace('-', '_')))} · ${formatPrice(id)}</option>`).join('');
    const orientationOptions = ORIENTATIONS.map(id => `<option value="${id}">${esc(s(id))}</option>`).join('');
    const html = `
    <div id="animeapi_settings">
        <div class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>${esc(s('title'))}</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content">
                <div class="animeapi_row">
                    <label for="animeapi_key">${esc(s('key'))}</label>
                    <input id="animeapi_key" class="text_pole" type="password" autocomplete="off" placeholder="${esc(s('key_placeholder'))}">
                </div>
                <div class="animeapi_hint"><a href="${KEYS_URL}" target="_blank" rel="noopener">${esc(s('get_key'))} ↗</a></div>
                <div class="animeapi_row">
                    <label for="animeapi_model">${esc(s('model'))}</label>
                    <select id="animeapi_model">${modelOptions}</select>
                </div>
                <div class="animeapi_row">
                    <label for="animeapi_orientation">${esc(s('orientation'))}</label>
                    <select id="animeapi_orientation">${orientationOptions}</select>
                </div>
                <div class="animeapi_row">
                    <label for="animeapi_prefix">${esc(s('prefix'))}</label>
                    <input id="animeapi_prefix" class="text_pole" type="text" maxlength="300" placeholder="${esc(s('prefix_placeholder'))}">
                </div>
                <label class="checkbox_label" for="animeapi_enhance"><input id="animeapi_enhance" type="checkbox"><span>${esc(s('enhance'))}</span></label>
                <label class="checkbox_label" for="animeapi_hide"><input id="animeapi_hide" type="checkbox"><span>${esc(s('hide_from_ai'))}</span></label>
                <div class="animeapi_status">
                    <span>${esc(s('price'))}: <b id="animeapi_price"></b></span>
                    <span>${esc(s('balance'))}: <b id="animeapi_balance"></b></span>
                    <a href="${BILLING_URL}" target="_blank" rel="noopener">${esc(s('add_funds'))} ↗</a>
                </div>
                <div class="animeapi_hint">${esc(s('hint'))}</div>
            </div>
        </div>
    </div>`;
    const container = $('#extensions_settings2').length ? $('#extensions_settings2') : $('#extensions_settings');
    container.append(html);

    $('#animeapi_key').val(settings.api_key).on('input', function () {
        settings.api_key = String($(this).val()).trim();
        saveSettings();
    });
    $('#animeapi_model').val(settings.model).on('change', function () {
        settings.model = String($(this).val());
        saveSettings();
        updateStatus();
    });
    $('#animeapi_orientation').val(settings.orientation).on('change', function () {
        settings.orientation = String($(this).val());
        saveSettings();
    });
    $('#animeapi_prefix').val(settings.prefix).on('input', function () {
        settings.prefix = String($(this).val());
        saveSettings();
    });
    $('#animeapi_enhance').prop('checked', settings.enhance).on('change', function () {
        settings.enhance = !!$(this).prop('checked');
        saveSettings();
    });
    $('#animeapi_hide').prop('checked', settings.hide_from_ai).on('change', function () {
        settings.hide_from_ai = !!$(this).prop('checked');
        saveSettings();
    });
    updateStatus();
}

function addButtons() {
    // Wand (extensions) menu
    const wandHtml = `
    <div id="animeapi_wand_container" class="extension_container">
        <div id="animeapi_wand_last" class="list-group-item flex-container flexGap5" data-animeapi-mode="last">
            <div class="fa-solid fa-wand-magic-sparkles extensionsMenuExtensionButton"></div><span>${esc(s('menu_last'))}</span>
        </div>
        <div id="animeapi_wand_char" class="list-group-item flex-container flexGap5" data-animeapi-mode="char">
            <div class="fa-solid fa-user-astronaut extensionsMenuExtensionButton"></div><span>${esc(s('menu_char'))}</span>
        </div>
        <div id="animeapi_wand_free" class="list-group-item flex-container flexGap5" data-animeapi-mode="free">
            <div class="fa-solid fa-pen-nib extensionsMenuExtensionButton"></div><span>${esc(s('menu_free'))}</span>
        </div>
    </div>`;
    $('#extensionsMenu').append(wandHtml);
    $('#animeapi_wand_container').on('click', '[data-animeapi-mode]', function () {
        generateFrom(String($(this).data('animeapi-mode')));
    });

    // Per-message button, added to the template and to messages already on screen
    const mesButton = `<div title="${esc(s('mes_button'))}" class="mes_button animeapi_mes_gen fa-solid fa-wand-magic-sparkles"></div>`;
    $('#message_template .mes_buttons .extraMesButtons').prepend(mesButton);
    $('#chat .mes .mes_buttons .extraMesButtons').each(function () {
        if (!$(this).find('.animeapi_mes_gen').length) $(this).prepend(mesButton);
    });
    $(document).on('click', '.animeapi_mes_gen', function () {
        const messageId = Number($(this).closest('.mes').attr('mesid'));
        const message = ctx().chat[messageId];
        if (message) generate(message.mes);
    });
}

function addSlashCommand() {
    const { SlashCommandParser, SlashCommand, SlashCommandArgument, SlashCommandNamedArgument, ARGUMENT_TYPE } = ctx();
    if (!SlashCommandParser?.addCommandObject) return;

    const truthy = value => ['true', '1', 'on', 'yes'].includes(String(value).toLowerCase());
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'anime',
        aliases: ['animeapi'],
        returns: 'saved image path',
        helpString: s('cmd_help'),
        namedArgumentList: [
            SlashCommandNamedArgument.fromProps({
                name: 'model',
                description: 'anime ($0.003), ultra ($0.01) or ultra-max ($0.02)',
                typeList: [ARGUMENT_TYPE.STRING],
                enumList: Object.keys(MODELS),
            }),
            SlashCommandNamedArgument.fromProps({
                name: 'orientation',
                description: 'image shape',
                typeList: [ARGUMENT_TYPE.STRING],
                enumList: ORIENTATIONS,
            }),
            SlashCommandNamedArgument.fromProps({
                name: 'quiet',
                description: 'do not add the image to the chat, only return its path',
                typeList: [ARGUMENT_TYPE.BOOLEAN],
                defaultValue: 'false',
                enumList: ['true', 'false'],
            }),
        ],
        unnamedArgumentList: [
            SlashCommandArgument.fromProps({
                description: 'last, char, or a prompt',
                typeList: [ARGUMENT_TYPE.STRING],
                isRequired: false,
            }),
        ],
        callback: async (args, value) => {
            const options = { model: args.model, orientation: args.orientation, quiet: truthy(args.quiet) };
            const text = String(value ?? '').trim();
            if (!text || text.toLowerCase() === 'last') return generateFrom('last', options);
            if (text.toLowerCase() === 'char') return generateFrom('char', options);
            return generate(text, options);
        },
    }));
}

jQuery(() => {
    try {
        getSettings();
        addSettingsPanel();
        addButtons();
        addSlashCommand();
    } catch (error) {
        console.error('[AnimeAPI] failed to load', error);
    }
});
