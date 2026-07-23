/**
 * 数据管家 (Data Manager) — SillyTavern 第三方 UI 扩展
 *
 * 在一个面板里批量管理：预设 / 世界书 / 角色卡 / 聊天记录 / 主题美化。
 * 功能：搜索筛选、多选批量删除、重命名、JSON 内容编辑、删除前自动备份、
 *       一键撤销，以及持久化的「删除历史」（存 IndexedDB，可随时下载/还原）。
 *
 * 面板用 SillyTavern 内置 Popup 系统承载，手机酒馆里能像原生弹窗一样全屏。
 * 所有读写走官方后端 API，不直接碰文件系统，云端/服务器部署同样可用。
 */

const EXT_NAME = '数据管家';

function ctx() {
    // eslint-disable-next-line no-undef
    return SillyTavern.getContext();
}

function headers() {
    try {
        const c = ctx();
        if (typeof c.getRequestHeaders === 'function') return c.getRequestHeaders();
    } catch { /* 忽略 */ }
    return { 'Content-Type': 'application/json' };
}

function multipartHeaders() {
    const h = { ...headers() };
    delete h['Content-Type'];
    delete h['content-type'];
    return h;
}

async function post(url, body) {
    const res = await fetch(url, { method: 'POST', headers: headers(), body: JSON.stringify(body ?? {}) });
    if (!res.ok) throw new Error(`${url} 返回 ${res.status}`);
    const text = await res.text();
    if (!text) return null;
    try { return JSON.parse(text); } catch { return text; }
}

function toast(msg, type = 'info') {
    try {
        // eslint-disable-next-line no-undef
        toastr[type](msg, EXT_NAME);
    } catch {
        console.log(`[${EXT_NAME}] ${msg}`);
    }
}

function downloadText(filename, text) {
    downloadBlob(filename, new Blob([text], { type: 'application/json' }));
}

function downloadBlob(filename, blob) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 8000);
}

function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = reject;
        r.readAsDataURL(blob);
    });
}

function dataURLToBlob(dataURL) {
    const [meta, b64] = String(dataURL).split(',');
    const mime = (meta.match(/:(.*?);/) || [])[1] || 'application/octet-stream';
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
}

function stamp() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function fmtTime(v) {
    const d = new Date(v);
    if (isNaN(d.getTime())) return '';
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/* ------------------------------------------------------------------ *
 *  IndexedDB —— 持久化删除历史（含完整备份内容）
 * ------------------------------------------------------------------ */

const DB_NAME = 'stdm_data_manager';
const DB_STORE = 'history';
const HISTORY_MAX = 60;

function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE, { keyPath: 'id' });
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function dbPut(rec) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, 'readwrite');
        tx.objectStore(DB_STORE).put(rec);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function dbGetAll() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, 'readonly');
        const r = tx.objectStore(DB_STORE).getAll();
        r.onsuccess = () => resolve(r.result || []);
        r.onerror = () => reject(r.error);
    });
}

async function dbDelete(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, 'readwrite');
        tx.objectStore(DB_STORE).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function dbClear() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, 'readwrite');
        tx.objectStore(DB_STORE).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function saveHistory(tab, entries) {
    const rec = {
        id: Date.now(),
        time: new Date().toISOString(),
        tab,
        label: adapters[tab].label,
        count: entries.length,
        names: entries.map(e => e.name),
        entries,
    };
    try {
        await dbPut(rec);
        const all = await dbGetAll();
        if (all.length > HISTORY_MAX) {
            all.sort((a, b) => a.id - b.id);
            for (const r of all.slice(0, all.length - HISTORY_MAX)) await dbDelete(r.id);
        }
    } catch (e) {
        console.warn('[数据管家] 写入历史失败', e);
    }
}

/* ------------------------------------------------------------------ *
 *  数据适配层
 * ------------------------------------------------------------------ */

const PRESET_KINDS = [
    { apiId: 'openai', label: '聊天补全预设 (OpenAI/Claude 等)', namesKey: 'openai_setting_names', dataKey: 'openai_settings' },
    { apiId: 'textgenerationwebui', label: '文本补全预设 (TextGen)', namesKey: 'textgenerationwebui_preset_names', dataKey: 'textgenerationwebui_presets' },
    { apiId: 'novel', label: 'NovelAI 预设', namesKey: 'novelai_setting_names', dataKey: 'novelai_settings' },
    { apiId: 'kobold', label: 'KoboldAI 预设', namesKey: 'koboldai_setting_names', dataKey: 'koboldai_settings' },
    { apiId: 'instruct', label: '指令模板 (Instruct)', objectsKey: 'instruct' },
    { apiId: 'context', label: '上下文模板 (Context)', objectsKey: 'context' },
    { apiId: 'sysprompt', label: '系统提示词 (SysPrompt)', objectsKey: 'sysprompt' },
    { apiId: 'reasoning', label: '推理格式 (Reasoning)', objectsKey: 'reasoning' },
];

let settingsCache = null;
async function getSettings(force = false) {
    if (!settingsCache || force) settingsCache = await post('/api/settings/get', {});
    return settingsCache;
}

const adapters = {
    presets: {
        label: '预设',
        editable: true,
        renamable: true,
        async load() {
            const s = await getSettings(true);
            const items = [];
            for (const kind of PRESET_KINDS) {
                if (kind.objectsKey) {
                    const arr = Array.isArray(s?.[kind.objectsKey]) ? s[kind.objectsKey] : [];
                    for (const obj of arr) {
                        if (!obj?.name) continue;
                        items.push({ id: `${kind.apiId}::${obj.name}`, name: obj.name, group: kind.label, apiId: kind.apiId, inline: obj });
                    }
                } else {
                    const names = Array.isArray(s?.[kind.namesKey]) ? s[kind.namesKey] : [];
                    const datas = Array.isArray(s?.[kind.dataKey]) ? s[kind.dataKey] : [];
                    names.forEach((name, i) => {
                        let parsed = null;
                        try { parsed = JSON.parse(datas[i]); } catch { /* 忽略 */ }
                        items.push({ id: `${kind.apiId}::${name}`, name, group: kind.label, apiId: kind.apiId, inline: parsed });
                    });
                }
            }
            return items;
        },
        async read(item) { return item.inline ?? {}; },
        async write(item, data) { await post('/api/presets/save', { name: item.name, apiId: item.apiId, preset: data }); },
        async remove(item) { await post('/api/presets/delete', { name: item.name, apiId: item.apiId }); },
        async rename(item, newName) {
            const data = await this.read(item);
            await post('/api/presets/save', { name: newName, apiId: item.apiId, preset: data });
            await post('/api/presets/delete', { name: item.name, apiId: item.apiId });
        },
        async restore(backup) { await post('/api/presets/save', { name: backup.name, apiId: backup.apiId, preset: backup.data }); },
        backupOf(item, data) { return { name: item.name, apiId: item.apiId, data }; },
    },

    worlds: {
        label: '世界书',
        editable: true,
        renamable: true,
        async load() {
            const list = await post('/api/worldinfo/list', {});
            const arr = Array.isArray(list) ? list : [];
            return arr.map(w => ({
                id: w.file_id,
                name: w.file_id,
                group: '世界书 / 知识书',
                meta: w.name && w.name !== w.file_id ? `内部名: ${w.name}` : '',
            }));
        },
        async read(item) { return await post('/api/worldinfo/get', { name: item.name }); },
        async write(item, data) { await post('/api/worldinfo/edit', { name: item.name, data }); },
        async remove(item) { await post('/api/worldinfo/delete', { name: item.name }); },
        async rename(item, newName) {
            const data = await this.read(item);
            await post('/api/worldinfo/edit', { name: newName, data });
            await post('/api/worldinfo/delete', { name: item.name });
        },
        async restore(backup) { await post('/api/worldinfo/edit', { name: backup.name, data: backup.data }); },
        backupOf(item, data) { return { name: item.name, data }; },
    },

    characters: {
        label: '角色卡',
        editable: false,
        renamable: false,
        isCharacter: true,
        async load() {
            const all = await post('/api/characters/all', { shallow: true });
            const arr = Array.isArray(all) ? all : [];
            return arr.map(c => ({
                id: c.avatar,
                name: c.name || c.avatar,
                group: '角色卡',
                avatar: c.avatar,
                meta: c.create_date ? String(c.create_date).split('@')[0] : '',
                thumb: `/thumbnail?type=avatar&file=${encodeURIComponent(c.avatar)}`,
            }));
        },
        async fetchCardBlob(item) {
            const res = await fetch('/api/characters/export', {
                method: 'POST',
                headers: headers(),
                body: JSON.stringify({ format: 'png', avatar_url: item.avatar }),
            });
            if (!res.ok) throw new Error(`导出接口返回 ${res.status}`);
            return await res.blob();
        },
        async read(item) {
            const blob = await this.fetchCardBlob(item);
            return { png: await blobToDataURL(blob) };
        },
        async exportBlob(item) {
            const blob = await this.fetchCardBlob(item);
            return { blob, filename: item.avatar };
        },
        backupOf(item, data) { return { name: item.name, avatar: item.avatar, png: data.png }; },
        async restore(backup) {
            const blob = dataURLToBlob(backup.png);
            const fd = new FormData();
            fd.append('avatar', blob, backup.avatar || `${backup.name || 'character'}.png`);
            fd.append('file_type', 'png');
            const res = await fetch('/api/characters/import', { method: 'POST', headers: multipartHeaders(), body: fd });
            if (!res.ok) throw new Error(`导入返回 ${res.status}`);
        },
        async remove(item, opts = {}) {
            await post('/api/characters/delete', { avatar_url: item.avatar, delete_chats: !!opts.deleteChats });
        },
    },

    chats: {
        label: '聊天记录',
        editable: true,
        renamable: true,
        needsCharacter: true,
        async load(st) {
            if (!st.avatar) return [];
            const list = await post('/api/chats/search', { avatar_url: st.avatar });
            const arr = Array.isArray(list) ? list : [];
            return arr.map(c => ({
                id: `${st.avatar}::${c.file_name}`,
                name: c.file_name,
                group: `聊天记录 — ${st.charName}`,
                avatar: st.avatar,
                meta: `${c.message_count ?? '?'} 条 · ${c.file_size ?? ''}`,
            }));
        },
        async read(item) { return await post('/api/chats/get', { avatar_url: item.avatar, file_name: item.name }); },
        async write(item, data) { await post('/api/chats/save', { avatar_url: item.avatar, file_name: item.name, chat: data, force: true }); },
        async remove(item) { await post('/api/chats/delete', { avatar_url: item.avatar, chatfile: `${item.name}.jsonl` }); },
        async rename(item, newName) {
            await post('/api/chats/rename', { avatar_url: item.avatar, original_file: `${item.name}.jsonl`, renamed_file: `${newName}.jsonl` });
        },
        async restore(backup) { await post('/api/chats/save', { avatar_url: backup.avatar, file_name: backup.name, chat: backup.data, force: true }); },
        backupOf(item, data) { return { name: item.name, avatar: item.avatar, data }; },
    },

    themes: {
        label: '主题美化',
        editable: true,
        renamable: true,
        async load() {
            const s = await getSettings(true);
            const arr = Array.isArray(s?.themes) ? s.themes : [];
            return arr.map(t => ({
                id: t.name,
                name: t.name,
                group: '主题 / 美化方案',
                inline: t,
                meta: t.custom_css ? '含自定义 CSS' : '',
            }));
        },
        async read(item) { return item.inline ?? { name: item.name }; },
        async write(item, data) { await post('/api/themes/save', { ...data, name: item.name }); },
        async remove(item) { await post('/api/themes/delete', { name: item.name }); },
        async rename(item, newName) {
            const data = await this.read(item);
            await post('/api/themes/save', { ...data, name: newName });
            await post('/api/themes/delete', { name: item.name });
        },
        async restore(backup) { await post('/api/themes/save', { ...backup.data, name: backup.name }); },
        backupOf(item, data) { return { name: item.name, data }; },
    },
};

/* ------------------------------------------------------------------ *
 *  状态
 * ------------------------------------------------------------------ */

/* 配色主题（不跟随酒馆，独立切换，记忆在本地） */
const THEMES = [
    { id: 'aurora', name: '星霜 Aurora' },
    { id: 'rose', name: '暗玫瑰 Rosé' },
    { id: 'teal', name: '深海 Teal' },
    { id: 'amber', name: '琥珀 Amber' },
];

function loadTheme() {
    try {
        const t = localStorage.getItem('stdm_theme');
        if (t && THEMES.some(x => x.id === t)) return t;
    } catch { /* 忽略 */ }
    return 'aurora';
}

const state = {
    tab: 'presets',
    items: [],
    filter: '',
    selected: new Set(),
    avatar: '',
    charName: '',
    characters: [],
    lastBatch: null,
    autoDownload: true,
    theme: loadTheme(),
};

let currentPopup = null;
let rootEl = null;

function $(sel) { return rootEl ? rootEl.querySelector(sel) : null; }

/** 切换配色主题：更新内容根 + 所有已打开的酒馆弹窗外层 */
function applyTheme(name) {
    state.theme = name;
    try { localStorage.setItem('stdm_theme', name); } catch { /* 忽略 */ }
    if (rootEl) rootEl.dataset.theme = name;
    document.querySelectorAll('.stdm-popup').forEach(el => { el.dataset.theme = name; });
}

/** 给一个 Popup 的外层加上标记类和当前主题，让 CSS 生效 */
function markPopup(popup) {
    try {
        const dlg = popup.dlg || popup.popup;
        if (dlg && dlg.classList) {
            dlg.classList.add('stdm-popup');
            dlg.dataset.theme = state.theme;
        }
    } catch { /* 忽略 */ }
}

/* ------------------------------------------------------------------ *
 *  构建面板内容
 * ------------------------------------------------------------------ */

function buildContent() {
    const root = document.createElement('div');
    root.id = 'stdm_modal';
    root.className = 'stdm-root';
    root.dataset.theme = state.theme;
    root.innerHTML = `
        <div id="stdm_header">
            <span class="stdm_title">🗂️ ${EXT_NAME}</span>
            <select id="stdm_theme" class="stdm_theme_sel" title="配色主题"></select>
            <label class="stdm_flexrow">
                <input type="checkbox" id="stdm_autodl" checked> 删除时下载备份
            </label>
            <button class="stdm_btn" id="stdm_history">🕘 历史</button>
            <button class="stdm_btn" id="stdm_undo" disabled>↩ 撤销上次删除</button>
        </div>
        <div id="stdm_tabs"></div>
        <div id="stdm_toolbar">
            <select id="stdm_charpick" style="display:none;"></select>
            <input type="text" id="stdm_search" placeholder="搜索名称…">
            <button class="stdm_btn" id="stdm_selall">全选</button>
            <button class="stdm_btn" id="stdm_selnone">清空</button>
            <button class="stdm_btn" id="stdm_refresh">刷新</button>
            <span class="stdm_spacer"></span>
            <button class="stdm_btn stdm_danger" id="stdm_delete">删除选中 (0)</button>
        </div>
        <div id="stdm_list"></div>
        <div id="stdm_status"></div>`;

    rootEl = root;

    const tabsEl = root.querySelector('#stdm_tabs');
    for (const [key, ad] of Object.entries(adapters)) {
        const b = document.createElement('div');
        b.className = 'stdm_tab';
        b.dataset.tab = key;
        b.textContent = ad.label;
        b.addEventListener('click', () => switchTab(key));
        tabsEl.appendChild(b);
    }

    root.querySelector('#stdm_search').addEventListener('input', (e) => {
        state.filter = e.target.value.trim().toLowerCase();
        renderList();
    });
    root.querySelector('#stdm_selall').addEventListener('click', () => {
        visibleItems().forEach(i => state.selected.add(i.id));
        renderList();
    });
    root.querySelector('#stdm_selnone').addEventListener('click', () => {
        state.selected.clear();
        renderList();
    });
    root.querySelector('#stdm_refresh').addEventListener('click', () => reload());
    root.querySelector('#stdm_delete').addEventListener('click', deleteSelected);
    root.querySelector('#stdm_history').addEventListener('click', openHistory);
    root.querySelector('#stdm_undo').addEventListener('click', undoLast);
    root.querySelector('#stdm_autodl').addEventListener('change', (e) => { state.autoDownload = e.target.checked; });

    const themeSel = root.querySelector('#stdm_theme');
    for (const t of THEMES) {
        const o = document.createElement('option');
        o.value = t.id;
        o.textContent = t.name;
        themeSel.appendChild(o);
    }
    themeSel.value = state.theme;
    themeSel.addEventListener('change', (e) => applyTheme(e.target.value));
    root.querySelector('#stdm_charpick').addEventListener('change', (e) => {
        const opt = e.target.selectedOptions[0];
        state.avatar = e.target.value;
        state.charName = opt ? opt.textContent : '';
        reload();
    });

    return root;
}

function setStatus(msg) {
    const el = $('#stdm_status');
    if (el) el.textContent = msg;
}

function visibleItems() {
    if (!state.filter) return state.items;
    return state.items.filter(i =>
        i.name.toLowerCase().includes(state.filter) ||
        (i.group || '').toLowerCase().includes(state.filter));
}

function updateDeleteButton() {
    const btn = $('#stdm_delete');
    if (!btn) return;
    const n = state.selected.size;
    btn.textContent = `删除选中 (${n})`;
    btn.disabled = n === 0;
}

function renderList() {
    const list = $('#stdm_list');
    if (!list) return;
    list.innerHTML = '';

    const items = visibleItems();
    if (!items.length) {
        list.innerHTML = '<div style="opacity:.6;padding:20px;text-align:center;">没有条目</div>';
        updateDeleteButton();
        return;
    }

    const ad = adapters[state.tab];
    let currentGroup = null;

    for (const item of items) {
        if (item.group !== currentGroup) {
            currentGroup = item.group;
            const g = document.createElement('div');
            g.className = 'stdm_group';
            g.textContent = currentGroup;
            list.appendChild(g);
        }

        const row = document.createElement('div');
        row.className = 'stdm_row';

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = state.selected.has(item.id);
        cb.addEventListener('change', () => {
            if (cb.checked) state.selected.add(item.id); else state.selected.delete(item.id);
            updateDeleteButton();
        });
        row.appendChild(cb);

        if (item.thumb) {
            const img = document.createElement('img');
            img.className = 'stdm_avatar';
            img.src = item.thumb;
            img.loading = 'lazy';
            img.onerror = () => img.remove();
            row.appendChild(img);
        }

        const name = document.createElement('div');
        name.className = 'stdm_name';
        name.textContent = item.name;
        name.title = item.name;
        row.appendChild(name);

        if (item.meta) {
            const meta = document.createElement('div');
            meta.className = 'stdm_meta';
            meta.textContent = item.meta;
            row.appendChild(meta);
        }

        const actions = document.createElement('div');
        actions.className = 'stdm_rowactions';

        if (ad.renamable) {
            const b = document.createElement('button');
            b.className = 'stdm_btn';
            b.textContent = '改名';
            b.addEventListener('click', () => renameItem(item));
            actions.appendChild(b);
        }
        if (ad.editable) {
            const b = document.createElement('button');
            b.className = 'stdm_btn';
            b.textContent = '编辑';
            b.addEventListener('click', () => editItem(item));
            actions.appendChild(b);
        }
        const dl = document.createElement('button');
        dl.className = 'stdm_btn';
        dl.textContent = '导出';
        dl.addEventListener('click', () => exportItem(item));
        actions.appendChild(dl);

        const del = document.createElement('button');
        del.className = 'stdm_btn stdm_danger';
        del.textContent = '删除';
        del.addEventListener('click', () => {
            state.selected.clear();
            state.selected.add(item.id);
            deleteSelected();
        });
        actions.appendChild(del);

        row.appendChild(actions);
        list.appendChild(row);
    }

    updateDeleteButton();
}

async function populateCharacterPicker() {
    const pick = $('#stdm_charpick');
    if (!pick) return;
    const all = await post('/api/characters/all', { shallow: true });
    state.characters = Array.isArray(all) ? all : [];
    pick.innerHTML = '';
    for (const c of state.characters) {
        const o = document.createElement('option');
        o.value = c.avatar;
        o.textContent = c.name || c.avatar;
        pick.appendChild(o);
    }
    if (!state.avatar && state.characters.length) {
        state.avatar = state.characters[0].avatar;
        state.charName = state.characters[0].name || state.avatar;
    }
    pick.value = state.avatar;
}

async function switchTab(key) {
    state.tab = key;
    state.selected.clear();
    if (rootEl) {
        rootEl.querySelectorAll('.stdm_tab').forEach(t => {
            t.classList.toggle('stdm_active', t.dataset.tab === key);
        });
    }
    const pick = $('#stdm_charpick');
    const needsChar = !!adapters[key].needsCharacter;
    if (pick) pick.style.display = needsChar ? '' : 'none';
    if (needsChar) {
        setStatus('正在读取角色列表…');
        await populateCharacterPicker();
    }
    await reload();
}

async function reload() {
    const ad = adapters[state.tab];
    setStatus('加载中…');
    try {
        state.items = await ad.load(state);
        state.selected.clear();
        renderList();
        setStatus(`共 ${state.items.length} 条`);
    } catch (err) {
        console.error(err);
        setStatus(`加载失败：${err.message}`);
        toast(`加载失败：${err.message}`, 'error');
    }
}

/* ---------------- 操作 ---------------- */

async function exportItem(item) {
    const ad = adapters[state.tab];
    try {
        if (typeof ad.exportBlob === 'function') {
            const { blob, filename } = await ad.exportBlob(item);
            downloadBlob(filename, blob);
        } else {
            const data = await ad.read(item);
            downloadText(`${item.name}.json`, JSON.stringify(data, null, 2));
        }
        toast(`已导出 ${item.name}`, 'success');
    } catch (err) {
        toast(`导出失败：${err.message}`, 'error');
    }
}

async function renameItem(item) {
    const ad = adapters[state.tab];
    const newName = prompt(`把「${item.name}」改名为：`, item.name);
    if (!newName || newName === item.name) return;
    if (/[\\/:*?"<>|]/.test(newName)) {
        toast('名称不能包含 \\ / : * ? " < > | 这些字符', 'warning');
        return;
    }
    try {
        setStatus('改名中…');
        await ad.rename(item, newName);
        toast(`已改名为 ${newName}`, 'success');
        await reload();
    } catch (err) {
        toast(`改名失败：${err.message}`, 'error');
        setStatus(`改名失败：${err.message}`);
    }
}

async function editItem(item) {
    const ad = adapters[state.tab];
    const c = ctx();
    let data;
    try { data = await ad.read(item); }
    catch (err) { toast(`读取失败：${err.message}`, 'error'); return; }

    const box = document.createElement('div');
    box.className = 'stdm-root stdm-editor-wrap';
    const ta = document.createElement('textarea');
    ta.className = 'stdm_editor_text';
    ta.spellcheck = false;
    ta.value = JSON.stringify(data, null, 2);
    box.appendChild(ta);
    const hint = document.createElement('div');
    hint.className = 'stdm_editor_hint';
    hint.textContent = '直接编辑 JSON，保存前会校验格式；格式错误不会写入。';
    box.appendChild(hint);

    if (c.Popup && c.POPUP_TYPE) {
        const p = new c.Popup(box, c.POPUP_TYPE.CONFIRM, '', {
            okButton: '保存', cancelButton: '取消', wide: true, large: true, allowVerticalScrolling: false,
        });
        markPopup(p);
        const result = await p.show();
        const affirmative = c.POPUP_RESULT ? c.POPUP_RESULT.AFFIRMATIVE : 1;
        if (result !== affirmative) return;
        let parsed;
        try { parsed = JSON.parse(ta.value); }
        catch (e) { toast(`JSON 格式错误：${e.message}`, 'error'); return; }
        try { await ad.write(item, parsed); toast('已保存', 'success'); await reload(); }
        catch (err) { toast(`保存失败：${err.message}`, 'error'); }
        return;
    }

    const edited = prompt('编辑 JSON：', ta.value);
    if (edited == null) return;
    let parsed;
    try { parsed = JSON.parse(edited); }
    catch (e) { toast(`JSON 格式错误：${e.message}`, 'error'); return; }
    try { await ad.write(item, parsed); toast('已保存', 'success'); await reload(); }
    catch (err) { toast(`保存失败：${err.message}`, 'error'); }
}

/** 把一批备份打包成单个文件下载（避免浏览器多文件下载拦截） */
async function downloadArchive(tab, entries) {
    const label = adapters[tab] ? adapters[tab].label : tab;

    if (tab === 'characters') {
        const JSZipRef = (typeof window !== 'undefined' && window.JSZip) || ctx()?.JSZip || null;
        if (JSZipRef) {
            try {
                const zip = new JSZipRef();
                entries.forEach((e, i) => {
                    const fname = e.avatar || `${e.name || 'character'}_${i}.png`;
                    zip.file(fname, dataURLToBlob(e.png));
                });
                const blob = await zip.generateAsync({ type: 'blob' });
                downloadBlob(`备份_角色卡_${stamp()}.zip`, blob);
                return;
            } catch (err) {
                console.warn('[数据管家] zip 打包失败，改用 JSON 备份', err);
            }
        }
        downloadText(`备份_角色卡_${stamp()}.json`, JSON.stringify({ tab, time: new Date().toISOString(), entries }, null, 2));
        return;
    }

    downloadText(`备份_${label}_${stamp()}.json`, JSON.stringify({ tab, time: new Date().toISOString(), entries }, null, 2));
}

/** 还原一批备份 */
async function restoreEntries(tab, entries) {
    const ad = adapters[tab];
    if (!ad || typeof ad.restore !== 'function') {
        toast('该类型不支持自动还原，请手动导入备份文件', 'warning');
        return;
    }
    let ok = 0, fail = 0;
    for (const entry of entries) {
        try { await ad.restore(entry); ok++; } catch (e) { console.error(e); fail++; }
    }
    toast(`还原完成：成功 ${ok} 项${fail ? `，失败 ${fail} 项` : ''}`, fail ? 'warning' : 'success');
    if (state.tab === tab) await reload();
}

async function deleteSelected() {
    const ad = adapters[state.tab];
    const targets = state.items.filter(i => state.selected.has(i.id));
    if (!targets.length) return;

    const names = targets.slice(0, 8).map(t => `· ${t.name}`).join('\n');
    const more = targets.length > 8 ? `\n…以及另外 ${targets.length - 8} 项` : '';
    let deleteChats = false;

    if (ad.isCharacter) {
        const backupNote = state.autoDownload
            ? '删除前会把这些卡打包成一个备份文件下载到本地，并写入「历史」，可随时还原。'
            : '你已关闭「删除时下载备份」，不会保存备份文件；但仍会写入「历史」，之后可从历史里下载或还原。';
        if (!confirm(`确定删除 ${targets.length} 个角色卡？\n\n${names}${more}\n\n${backupNote}`)) return;
        deleteChats = confirm('同时删除这些角色的聊天记录吗？\n\n确定 = 一并删除；取消 = 保留聊天记录。');
    } else {
        if (!confirm(`确定删除 ${targets.length} 项？\n\n${names}${more}\n\n删除前会自动备份到「历史」，可随时下载或还原。`)) return;
    }

    const canBackup = typeof ad.read === 'function' && typeof ad.backupOf === 'function';
    const entries = [];
    let ok = 0, fail = 0, skipped = 0;

    for (let n = 0; n < targets.length; n++) {
        const item = targets[n];
        setStatus(`正在处理 ${n + 1}/${targets.length}：${item.name}`);
        try {
            if (canBackup) {
                let data;
                try {
                    data = await ad.read(item);
                } catch (e) {
                    console.error('备份失败，跳过删除', item.name, e);
                    skipped++;
                    toast(`「${item.name}」备份失败，已跳过删除`, 'warning');
                    continue;
                }
                entries.push(ad.backupOf(item, data));
            }
            await ad.remove(item, { deleteChats });
            ok++;
        } catch (err) {
            console.error(err);
            fail++;
            toast(`删除「${item.name}」失败：${err.message}`, 'error');
        }
    }

    if (entries.length) {
        state.lastBatch = { tab: state.tab, entries };
        const undo = $('#stdm_undo');
        if (undo) {
            undo.disabled = false;
            undo.textContent = `↩ 撤销上次删除 (${entries.length})`;
        }
        await saveHistory(state.tab, entries);
        if (state.autoDownload) {
            try { await downloadArchive(state.tab, entries); }
            catch (e) { console.warn('备份文件下载失败', e); toast('备份文件下载失败，但已存入历史，可从历史下载', 'warning'); }
        }
    }

    const parts = [`成功 ${ok} 项`];
    if (skipped) parts.push(`跳过 ${skipped} 项(备份失败)`);
    if (fail) parts.push(`失败 ${fail} 项`);
    const summary = parts.join('，');
    setStatus(`完成：${summary}`);
    toast(`删除完成：${summary}`, (fail || skipped) ? 'warning' : 'success');
    await reload();
}

async function undoLast() {
    if (!state.lastBatch) { toast('没有可撤销的删除', 'info'); return; }
    const { tab, entries } = state.lastBatch;
    if (!confirm(`还原 ${entries.length} 项到「${adapters[tab].label}」？`)) return;
    await restoreEntries(tab, entries);
    state.lastBatch = null;
    const undo = $('#stdm_undo');
    if (undo) { undo.disabled = true; undo.textContent = '↩ 撤销上次删除'; }
}

/* ------------------------------------------------------------------ *
 *  删除历史面板
 * ------------------------------------------------------------------ */

async function renderHistory(container) {
    const listEl = container.querySelector('.stdm-hist-list');
    if (!listEl) return;
    listEl.textContent = '加载中…';

    let all;
    try { all = await dbGetAll(); }
    catch (e) { listEl.textContent = '读取历史失败：' + e.message; return; }

    all.sort((a, b) => b.id - a.id);
    listEl.innerHTML = '';

    if (!all.length) {
        const empty = document.createElement('div');
        empty.className = 'stdm-empty';
        empty.textContent = '暂无删除历史';
        listEl.appendChild(empty);
        return;
    }

    for (const rec of all) {
        const row = document.createElement('div');
        row.className = 'stdm-hist-row';

        const info = document.createElement('div');
        info.className = 'stdm-hist-info';

        const top = document.createElement('div');
        top.className = 'stdm-hist-top';
        const badge = document.createElement('span');
        badge.className = 'stdm-badge';
        badge.textContent = rec.label;
        const count = document.createElement('span');
        count.className = 'stdm-hist-count';
        count.textContent = `${rec.count} 项`;
        const time = document.createElement('span');
        time.className = 'stdm-hist-time';
        time.textContent = fmtTime(rec.time || rec.id);
        top.append(badge, count, time);

        const nm = document.createElement('div');
        nm.className = 'stdm-hist-names';
        const namesArr = Array.isArray(rec.names) ? rec.names : [];
        nm.textContent = namesArr.slice(0, 5).join('、') + (namesArr.length > 5 ? ` …等 ${namesArr.length} 项` : '');
        nm.title = namesArr.join('\n');

        info.append(top, nm);
        row.appendChild(info);

        const acts = document.createElement('div');
        acts.className = 'stdm-hist-actions';

        const dl = document.createElement('button');
        dl.className = 'stdm_btn';
        dl.textContent = '下载备份';
        dl.addEventListener('click', async () => {
            try { await downloadArchive(rec.tab, rec.entries); toast('已下载备份', 'success'); }
            catch (e) { toast('下载失败：' + e.message, 'error'); }
        });

        const rs = document.createElement('button');
        rs.className = 'stdm_btn';
        rs.textContent = '还原';
        rs.addEventListener('click', async () => {
            if (!confirm(`把这 ${rec.count} 项还原到「${rec.label}」？`)) return;
            await restoreEntries(rec.tab, rec.entries);
        });

        const rm = document.createElement('button');
        rm.className = 'stdm_btn stdm_danger';
        rm.textContent = '删除记录';
        rm.addEventListener('click', async () => {
            if (!confirm('删除这条历史记录？其中的备份内容会一并移除，不可恢复。')) return;
            try { await dbDelete(rec.id); await renderHistory(container); }
            catch (e) { toast('删除失败：' + e.message, 'error'); }
        });

        acts.append(dl, rs, rm);
        row.appendChild(acts);
        listEl.appendChild(row);
    }
}

async function openHistory() {
    const c = ctx();
    const box = document.createElement('div');
    box.className = 'stdm-root stdm-history';

    const head = document.createElement('div');
    head.className = 'stdm-hist-head';
    const title = document.createElement('span');
    title.className = 'stdm-hist-title';
    title.textContent = '🕘 删除历史';
    const clear = document.createElement('button');
    clear.className = 'stdm_btn stdm_danger';
    clear.textContent = '清空全部';
    clear.addEventListener('click', async () => {
        if (!confirm('清空全部删除历史？所有备份内容将一并移除，不可恢复。')) return;
        try { await dbClear(); await renderHistory(box); toast('已清空历史', 'success'); }
        catch (e) { toast('清空失败：' + e.message, 'error'); }
    });
    head.append(title, clear);

    const list = document.createElement('div');
    list.className = 'stdm-hist-list';

    const foot = document.createElement('div');
    foot.className = 'stdm-hist-foot';
    foot.textContent = '历史与备份保存在本浏览器（IndexedDB），换设备或清理浏览器数据会丢失。';

    box.append(head, list, foot);

    if (c.Popup && c.POPUP_TYPE) {
        const p = new c.Popup(box, c.POPUP_TYPE.TEXT, '', {
            okButton: '关闭', wide: true, large: true, allowVerticalScrolling: false,
        });
        p.show();
        markPopup(p);
    } else {
        box.classList.add('stdm-fallback');
        box.dataset.theme = state.theme;
        document.body.appendChild(box);
    }

    await renderHistory(box);
}

/* ------------------------------------------------------------------ *
 *  打开主面板
 * ------------------------------------------------------------------ */

async function openModal() {
    const c = ctx();
    const content = buildContent();

    if (c.Popup && c.POPUP_TYPE) {
        currentPopup = new c.Popup(content, c.POPUP_TYPE.TEXT, '', {
            okButton: '关闭',
            wide: true,
            large: true,
            allowVerticalScrolling: false,
            onClose: () => { rootEl = null; currentPopup = null; },
        });
        currentPopup.show();
        markPopup(currentPopup);
        await switchTab(state.tab);
    } else {
        content.classList.add('stdm-fallback');
        content.dataset.theme = state.theme;
        document.body.appendChild(content);
        await switchTab(state.tab);
    }
}

/* ------------------------------------------------------------------ *
 *  挂载入口
 * ------------------------------------------------------------------ */

function mount() {
    const menu = document.getElementById('extensionsMenu');
    if (menu && !document.getElementById('stdm_menu_entry')) {
        const entry = document.createElement('div');
        entry.id = 'stdm_menu_entry';
        entry.className = 'list-group-item flex-container flexGap5 interactable';
        entry.tabIndex = 0;
        entry.innerHTML = '<div class="fa-solid fa-folder-tree extensionsMenuExtensionButton"></div><span>数据管家</span>';
        entry.addEventListener('click', openModal);
        menu.appendChild(entry);
    }

    const settings = document.getElementById('extensions_settings') || document.getElementById('extensions_settings2');
    if (settings && !document.getElementById('stdm_settings_block')) {
        const block = document.createElement('div');
        block.id = 'stdm_settings_block';
        block.className = 'inline-drawer';
        block.innerHTML = `
        <div class="inline-drawer-toggle inline-drawer-header">
            <b>🗂️ 数据管家</b>
            <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
        </div>
        <div class="inline-drawer-content">
            <p style="font-size:.85em;opacity:.8;">批量管理预设、世界书、角色卡、聊天记录和主题美化方案。删除前自动备份，可一键撤销或从历史还原。</p>
            <div class="menu_button menu_button_icon" id="stdm_open_btn">
                <i class="fa-solid fa-folder-tree"></i><span>打开数据管家</span>
            </div>
        </div>`;
        settings.appendChild(block);
        block.querySelector('#stdm_open_btn').addEventListener('click', openModal);
    }
}

function registerSlashCommand() {
    try {
        const c = ctx();
        const SlashCommand = c.SlashCommand;
        const parser = c.SlashCommandParser;
        if (!SlashCommand || !parser) return;
        parser.addCommandObject(SlashCommand.fromProps({
            name: 'datamanager',
            aliases: ['dm', '数据管家'],
            helpString: '打开数据管家面板',
            callback: () => { openModal(); return ''; },
        }));
    } catch (e) {
        console.debug('[数据管家] 斜杠命令注册跳过', e);
    }
}

(function init() {
    const start = () => {
        mount();
        registerSlashCommand();
        setTimeout(mount, 3000);
        console.log('[数据管家] 已加载');
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
