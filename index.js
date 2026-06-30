/*
 * 预设编辑器 (Preset Editor) for SillyTavern
 * 一个用于直观编辑 / 新建「聊天补全(Chat Completion)预设」中提示词条目的工具。
 *
 * 功能:
 *  1. 编辑器：列出当前预设的所有提示词条目，可拖动排序、启用/禁用、编辑、复制、删除、新建。
 *  2. 教程：解释提示词管理器里每个字段(名称/角色/位置/深度/禁止覆盖/占位符...)的含义和效果。
 *  3. 思维链预览：按 AI 实际读取的顺序，自上而下展示条目排列(含绝对深度注入的可视化)。
 *  4. 保存：应用到当前会话 + 尝试写回命名预设；另支持导出/导入 JSON。
 *
 * 说明:本扩展只编辑「提示词条目」部分。采样参数(温度/top_p 等)请在 SillyTavern 原生面板调整。
 */

import { eventSource, event_types } from "../../../../script.js";
import { getContext } from "../../../extensions.js";

const EXT_ID = "preset-editor";
const LABEL = "预设编辑器";

// ----- 运行时依赖(动态加载，失败也不会让扩展崩溃) -----
let _oai = null;            // oai_settings
let _promptManager = null;  // promptManager 实例
let _getPresetManager = null;
let _saveSettingsDebounced = null;
let _extSettings = {};

// 工作副本(编辑中的状态，未应用前不写回真实设置)
let state = {
    prompts: [],   // 提示词对象数组(深拷贝)
    order: [],     // 当前角色的排序 [{identifier, enabled}]
    search: "",
    expanded: new Set(),
};

// 角色显示
const ROLE_LABEL = { system: "系统", user: "用户", assistant: "AI" };
const ROLE_COLOR = { system: "#8b5cf6", user: "#3b82f6", assistant: "#10b981" };

// 已知占位符(marker)中文名,用于教程和预览友好显示
const MARKER_NAMES = {
    main: "主提示词",
    nsfw: "辅助提示词(NSFW)",
    jailbreak: "历史后指令(越狱/Post-History)",
    enhanceDefinitions: "增强定义",
    charDescription: "角色描述",
    charPersonality: "角色性格",
    scenario: "场景",
    personaDescription: "用户角色(persona)描述",
    dialogueExamples: "对话示例",
    chatHistory: "聊天记录",
    worldInfoBefore: "世界书(前置)",
    worldInfoAfter: "世界书(后置)",
};

// =====================================================================
// 依赖获取(尽量兼容多个版本)
// =====================================================================
async function loadDeps() {
    const ctx = safeCtx();

    // oai_settings
    try {
        const m = await import("../../../openai.js");
        _oai = m.oai_settings ?? _oai;
        _promptManager = m.promptManager ?? _promptManager;
    } catch (e) {
        console.warn(`[${EXT_ID}] 无法 import openai.js，改用 context 回退`, e);
    }
    if (!_oai) _oai = ctx?.chatCompletionSettings ?? window.oai_settings ?? null;
    if (!_promptManager) _promptManager = ctx?.promptManager ?? window.promptManager ?? null;

    // preset manager
    if (typeof ctx?.getPresetManager === "function") {
        _getPresetManager = ctx.getPresetManager;
    } else {
        try {
            const pm = await import("../../../preset-manager.js");
            _getPresetManager = pm.getPresetManager ?? null;
        } catch (e) {
            console.warn(`[${EXT_ID}] 无法 import preset-manager.js`, e);
        }
    }

    _saveSettingsDebounced = ctx?.saveSettingsDebounced ?? window.saveSettingsDebounced ?? (() => {});

    // 扩展设置（用于记住主题选择）
    _extSettings = ctx?.extensionSettings ?? window.extension_settings ?? {};
    if (!_extSettings[EXT_ID] || typeof _extSettings[EXT_ID] !== "object") _extSettings[EXT_ID] = {};
}

// ----- 主题 -----
const THEMES = ["obsidian", "manuscript", "platinum"];
function getSavedTheme() {
    const t = _extSettings?.[EXT_ID]?.theme;
    return THEMES.includes(t) ? t : "obsidian";
}
function applyTheme(name) {
    if (!THEMES.includes(name)) name = "obsidian";
    const modal = document.getElementById("pe-modal");
    if (modal) modal.setAttribute("data-pe-theme", name);
    document.querySelectorAll(".pe-theme-dot").forEach(d => d.classList.toggle("pe-active", d.dataset.theme === name));
    if (_extSettings && _extSettings[EXT_ID]) { _extSettings[EXT_ID].theme = name; _saveSettingsDebounced?.(); }
}

// 角色 -> 工具类后缀（assistant 缩写为 asst）
function roleKey(role) { return role === "user" ? "user" : role === "assistant" ? "asst" : "system"; }

function safeCtx() {
    try { return getContext?.() ?? window.SillyTavern?.getContext?.() ?? null; }
    catch { return null; }
}

function getOai() {
    if (_oai) return _oai;
    const ctx = safeCtx();
    return ctx?.chatCompletionSettings ?? window.oai_settings ?? null;
}

// 找到「当前生效」的排序条目。优先用 promptManager 的当前角色，回退到全局虚拟角色(100001)。
function getActiveOrderRef(oai) {
    const po = oai?.prompt_order;
    if (!Array.isArray(po) || po.length === 0) return null;

    let charId = null;
    try {
        if (_promptManager?.activeCharacter?.id !== undefined) charId = _promptManager.activeCharacter.id;
    } catch { /* ignore */ }
    if (charId === null) {
        const ctx = safeCtx();
        if (ctx && ctx.characterId !== undefined && ctx.characterId !== null) charId = ctx.characterId;
    }

    let entry = null;
    if (charId !== null) entry = po.find(e => String(e.character_id) === String(charId));
    if (!entry) entry = po.find(e => String(e.character_id) === "100001"); // 全局虚拟角色
    if (!entry) entry = po.find(e => Array.isArray(e.order) && e.order.length); // 取第一个有内容的
    if (!entry) entry = po[po.length - 1];
    return entry || null;
}

// =====================================================================
// 状态：从真实设置载入工作副本 / 写回
// =====================================================================
function loadStateFromLive() {
    const oai = getOai();
    if (!oai || !Array.isArray(oai.prompts)) {
        toast("error", "未找到聊天补全预设数据。请确认当前 API 已切到 Chat Completion 模式。");
        return false;
    }
    const orderRef = getActiveOrderRef(oai);
    state.prompts = deepClone(oai.prompts);
    state.order = orderRef ? deepClone(orderRef.order) : [];
    state.expanded = new Set();
    return true;
}

function applyToLive() {
    const oai = getOai();
    if (!oai) { toast("error", "无法写回：未找到预设数据。"); return false; }

    // 就地替换 prompts 数组内容(保持原数组引用，避免 promptManager 持有旧引用)
    if (!Array.isArray(oai.prompts)) oai.prompts = [];
    oai.prompts.length = 0;
    state.prompts.forEach(p => oai.prompts.push(deepClone(p)));

    // 写回排序
    const orderRef = getActiveOrderRef(oai);
    if (orderRef) {
        orderRef.order.length = 0;
        state.order.forEach(o => orderRef.order.push(deepClone(o)));
    }

    // 刷新 UI + 持久化当前设置
    try { _promptManager?.render?.(); } catch (e) { console.warn(e); }
    try {
        if (typeof _promptManager?.saveServiceSettings === "function") _promptManager.saveServiceSettings();
        else _saveSettingsDebounced?.();
    } catch (e) { console.warn(e); _saveSettingsDebounced?.(); }
    return true;
}

async function saveToPreset() {
    if (!applyToLive()) return;
    const name = getCurrentPresetName();

    // 1) 首选：用预设管理器把整份预设写入文件
    if (typeof _getPresetManager === "function") {
        try {
            const pm = _getPresetManager("openai");
            const nm = name || getCurrentPresetName(pm);
            if (pm && typeof pm.savePreset === "function" && nm) {
                await pm.savePreset(nm, deepClone(getOai()));
                toast("success", `已保存到预设「${nm}」并生效。`);
                return;
            }
        } catch (e) {
            console.warn(`[${EXT_ID}] savePreset 失败，改用原生保存按钮`, e);
        }
    }

    // 2) 回退：触发 SillyTavern 原生「保存/更新当前预设」按钮（改动已应用，点它即可落盘）
    if (clickNativeSave()) {
        toast("success", `已保存到预设${name ? `「${name}」` : ""}并生效。`);
        return;
    }

    // 3) 兜底：已生效，提示手动保存
    toast("info", "改动已在当前会话生效。请再点 SillyTavern 预设栏的保存按钮写入文件。");
}

// 尝试点击 ST 原生的「保存/更新当前预设」按钮（仅点保存类，安全）
function clickNativeSave() {
    const selectors = ["#update_oai_preset", "#preset_save_button_openai", "[data-preset-manager-update=\"openai\"]"];
    for (const s of selectors) {
        const el = document.querySelector(s);
        if (el) { try { el.click(); return true; } catch { /* ignore */ } }
    }
    return false;
}

function getCurrentPresetName(pm) {
    try {
        if (typeof pm?.getSelectedPresetName === "function") return pm.getSelectedPresetName();
    } catch { /* ignore */ }
    try {
        if (typeof _getPresetManager === "function") {
            const m = _getPresetManager("openai");
            if (typeof m?.getSelectedPresetName === "function") return m.getSelectedPresetName();
        }
    } catch { /* ignore */ }
    // 回退：读取原生下拉框选中项
    const sel = document.querySelector("#settings_preset_openai");
    if (sel && sel.selectedOptions?.length) return sel.selectedOptions[0].textContent?.trim();
    return null;
}

// =====================================================================
// 工具函数
// =====================================================================
function deepClone(o) {
    try { return structuredClone(o); }
    catch { return JSON.parse(JSON.stringify(o)); }
}
function uuid() {
    if (crypto?.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0, v = c === "x" ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function toast(type, msg) {
    try { window.toastr?.[type]?.(msg, LABEL); }
    catch { console.log(`[${EXT_ID}] ${type}: ${msg}`); }
}
function findPrompt(identifier) {
    return state.prompts.find(p => p.identifier === identifier);
}
function isMarker(p) { return !!(p && p.marker); }
function isAbsolute(p) { return Number(p?.injection_position) === 1; }
function displayName(p) {
    if (!p) return "(未知条目)";
    if (p.name) return p.name;
    if (MARKER_NAMES[p.identifier]) return MARKER_NAMES[p.identifier];
    return p.identifier || "(未命名)";
}
function roughTokens(text) {
    const s = String(text ?? "");
    if (!s) return 0;
    // 粗略估算：CJK 约 1 token/字，其他约 1 token/3.5 字
    let cjk = (s.match(/[\u3000-\u9fff\uff00-\uffef]/g) || []).length;
    let other = s.length - cjk;
    return Math.ceil(cjk + other / 3.5);
}

// 真实分词:接 SillyTavern 的分词器，失败则回退到粗略估算
let _tokenCounter = null;   // async (text) => number
let _tokModeReal = false;
async function loadTokenizer() {
    try {
        const m = await import("../../../tokenizers.js");
        if (typeof m.getTokenCountAsync === "function") {
            _tokenCounter = (t) => m.getTokenCountAsync(t);
            _tokModeReal = true;
        } else if (typeof m.getTokenCount === "function") {
            _tokenCounter = async (t) => m.getTokenCount(t);
            _tokModeReal = true;
        }
    } catch (e) {
        console.warn(`[${EXT_ID}] 未能加载分词器，使用估算`, e);
    }
}
async function countTokens(text) {
    const s = String(text ?? "");
    if (!s) return 0;
    if (_tokenCounter) {
        try { const n = await _tokenCounter(s); if (Number.isFinite(n)) return n; } catch { /* fall through */ }
    }
    return roughTokens(s);
}
// 按内容缓存真实 token，避免重复分词
const _tokCache = new Map();
async function countTokensCached(text) {
    const s = String(text ?? "");
    if (!s) return 0;
    if (_tokCache.has(s)) return _tokCache.get(s);
    const n = await countTokens(s);
    _tokCache.set(s, n);
    if (_tokCache.size > 600) _tokCache.delete(_tokCache.keys().next().value);
    return n;
}
function fmtNum(n) { return Number(n || 0).toLocaleString("en-US"); }

// =====================================================================
// 主弹窗
// =====================================================================
function openEditor() {
    if (document.getElementById("pe-overlay")) return; // 已打开
    if (!loadStateFromLive()) return;

    const overlay = document.createElement("div");
    overlay.id = "pe-overlay";
    overlay.innerHTML = `
      <div id="pe-modal" role="dialog" aria-label="${LABEL}" data-pe-theme="${getSavedTheme()}">
        <div class="pe-header">
          <div class="pe-brand">
            <span class="pe-mark"><i class="fa-solid fa-layer-group"></i></span>
            <span class="pe-brand-txt"><b class="pe-title-main">预设编辑器</b><span class="pe-brand-en">Preset Editor</span></span>
          </div>
          <div class="pe-tabs">
            <button class="pe-tab pe-active" data-tab="editor">编辑器</button>
            <button class="pe-tab" data-tab="tutorial">教程</button>
            <button class="pe-tab" data-tab="preview">思维链预览</button>
          </div>
          <div class="pe-themes">
            <button class="pe-theme-dot pe-dot-obsidian" data-theme="obsidian" title="黑曜 Obsidian"></button>
            <button class="pe-theme-dot pe-dot-manuscript" data-theme="manuscript" title="墨卷 Manuscript"></button>
            <button class="pe-theme-dot pe-dot-platinum" data-theme="platinum" title="月白 Platinum"></button>
          </div>
          <button id="pe-close" title="关闭"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="pe-body">
          <div class="pe-pane" data-pane="editor"></div>
          <div class="pe-pane pe-hidden" data-pane="tutorial"></div>
          <div class="pe-pane pe-hidden" data-pane="preview"></div>
        </div>
        <div class="pe-footer">
          <div class="pe-footer-left">
            <button class="pe-btn pe-btn-icon" id="pe-export" title="导出为 JSON 备份"><i class="fa-solid fa-file-export"></i></button>
            <button class="pe-btn pe-btn-icon" id="pe-import" title="从 JSON 导入"><i class="fa-solid fa-file-import"></i></button>
            <input type="file" id="pe-import-file" accept="application/json" style="display:none">
          </div>
          <div class="pe-footer-right">
            <button class="pe-btn pe-btn-icon" id="pe-reload" title="放弃未保存的更改，重新载入"><i class="fa-solid fa-rotate-left"></i></button>
            <button class="pe-btn" id="pe-apply" title="仅在当前会话临时生效，不写入预设文件（用于试效果）"><i class="fa-solid fa-bolt"></i> 应用</button>
            <button class="pe-btn pe-btn-primary" id="pe-save" title="写入当前预设文件并立即生效"><i class="fa-solid fa-floppy-disk"></i> 保存</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    // tab 切换
    overlay.querySelectorAll(".pe-tab").forEach(btn => {
        btn.addEventListener("click", () => {
            overlay.querySelectorAll(".pe-tab").forEach(b => b.classList.remove("pe-active"));
            btn.classList.add("pe-active");
            const tab = btn.dataset.tab;
            overlay.querySelectorAll(".pe-pane").forEach(p => p.classList.toggle("pe-hidden", p.dataset.pane !== tab));
            if (tab === "preview") renderPreview();
            if (tab === "tutorial") renderTutorial();
        });
    });

    overlay.querySelector("#pe-close").addEventListener("click", closeEditor);
    // 防误触：点击界面外的遮罩、按 Esc 都不再关闭，避免编辑内容丢失；仅右上角 ✕ 可关闭。

    overlay.querySelector("#pe-apply").addEventListener("click", () => { if (applyToLive()) toast("success", "已在当前会话生效（未写入预设文件）。"); });
    overlay.querySelector("#pe-save").addEventListener("click", saveToPreset);
    overlay.querySelector("#pe-reload").addEventListener("click", () => { if (loadStateFromLive()) { renderEditor(); toast("info", "已重新载入，未保存的更改被放弃。"); } });
    overlay.querySelector("#pe-export").addEventListener("click", exportJson);
    overlay.querySelector("#pe-import").addEventListener("click", () => overlay.querySelector("#pe-import-file").click());
    overlay.querySelector("#pe-import-file").addEventListener("change", importJson);

    // 主题切换
    overlay.querySelectorAll(".pe-theme-dot").forEach(dot => {
        dot.addEventListener("click", () => applyTheme(dot.dataset.theme));
    });
    applyTheme(getSavedTheme());

    renderEditor();
    renderTutorial();
}

function closeEditor() {
    document.getElementById("pe-overlay")?.remove();
}

// =====================================================================
// 编辑器面板
// =====================================================================
function renderEditor() {
    const pane = document.querySelector('.pe-pane[data-pane="editor"]');
    if (!pane) return;

    pane.innerHTML = `
      <div class="pe-eyebrow">Token Budget · 上下文预算</div>
      <div class="pe-stats" id="pe-stats">
        <div class="pe-stat"><div class="pe-stat-num" id="pe-st-count">–</div><div class="pe-stat-lbl">启用条目</div></div>
        <div class="pe-stat"><div class="pe-stat-num" id="pe-st-chars">–</div><div class="pe-stat-lbl">字符</div></div>
        <div class="pe-stat"><div class="pe-stat-num" id="pe-st-tokens">…</div><div class="pe-stat-lbl">token<span class="pe-tok-mode" id="pe-st-mode">${_tokModeReal ? "实时分词" : "估算"}</span></div></div>
        <div class="pe-meter-wrap">
          <div class="pe-meter" id="pe-meter"></div>
          <div class="pe-legend" id="pe-legend"></div>
        </div>
        <button class="pe-bd-toggle" id="pe-bd-toggle" title="按条目查看 token 占用">
          <i class="fa-solid fa-chart-simple"></i> 明细 <i class="fa-solid fa-chevron-down" id="pe-bd-chev"></i>
        </button>
      </div>
      <div class="pe-breakdown ${_breakdownOpen ? "" : "pe-hidden"}" id="pe-breakdown"></div>
      <div class="pe-toolbar">
        <div class="pe-search">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input type="text" id="pe-search-input" placeholder="搜索条目名称 / 内容…" value="${esc(state.search)}">
        </div>
        <div class="pe-toolbar-actions">
          <button class="pe-btn" id="pe-add-existing" title="把已存在、但不在排序中的条目重新加入"><i class="fa-solid fa-plus-minus"></i> 添加</button>
          <button class="pe-btn pe-btn-primary" id="pe-add-new"><i class="fa-solid fa-plus"></i> 新建</button>
        </div>
      </div>
      <div class="pe-eyebrow">Prompt Chain · AI 读取顺序</div>
      <div class="pe-hint"><i class="fa-solid fa-arrows-up-down"></i> 拖动左侧编号节点可排序;顺序自上而下 = AI 读取顺序(切到「思维链预览」可查看最终效果)</div>
      <div class="pe-list" id="pe-list"></div>`;

    pane.querySelector("#pe-search-input").addEventListener("input", e => {
        state.search = e.target.value;
        renderList();
    });
    pane.querySelector("#pe-add-new").addEventListener("click", addNewEntry);
    pane.querySelector("#pe-add-existing").addEventListener("click", showAddExisting);

    const bdToggle = pane.querySelector("#pe-bd-toggle");
    bdToggle && bdToggle.addEventListener("click", () => {
        _breakdownOpen = !_breakdownOpen;
        const panel = document.getElementById("pe-breakdown");
        panel?.classList.toggle("pe-hidden", !_breakdownOpen);
        const chev = document.getElementById("pe-bd-chev");
        chev?.classList.toggle("fa-chevron-up", _breakdownOpen);
        chev?.classList.toggle("fa-chevron-down", !_breakdownOpen);
        if (_breakdownOpen) { renderBreakdown(); refreshStats(); }
    });

    refreshStats();

    renderList();
}

function renderList() {
    const list = document.getElementById("pe-list");
    if (!list) return;
    const q = state.search.trim().toLowerCase();

    list.innerHTML = "";
    state.order.forEach((ord, idx) => {
        const p = findPrompt(ord.identifier);
        if (!p) return;
        if (q) {
            const hay = (displayName(p) + " " + (p.content || "")).toLowerCase();
            if (!hay.includes(q)) return;
        }
        list.appendChild(buildRow(p, ord, idx));
    });

    if (!list.children.length) {
        list.innerHTML = `<div class="pe-empty">没有匹配的条目。</div>`;
    }
}

function buildRow(p, ord, idx) {
    const row = document.createElement("div");
    row.className = "pe-row" + (ord.enabled ? "" : " pe-disabled");
    row.dataset.idx = idx;
    row.dataset.id = p.identifier;
    row.draggable = false;

    const marker = isMarker(p);
    const roleKey_ = p.role || "system";
    const rcls = "pe-bg-" + roleKey(roleKey_);
    const expanded = state.expanded.has(p.identifier);
    const absolute = isAbsolute(p);
    const posLabel = absolute ? `绝对@深度${p.injection_depth ?? 0}` : "相对";
    const meta = marker ? "" : `${fmtNum((p.content || "").length)} 字 · ≈${fmtNum(roughTokens(p.content))} t`;

    row.innerHTML = `
      <div class="pe-rail">
        <span class="pe-node" title="拖动排序">${idx + 1}</span>
      </div>
      <div class="pe-content-col">
        <div class="pe-row-head">
          <label class="pe-toggle" title="启用/禁用">
            <input type="checkbox" class="pe-en" ${ord.enabled ? "checked" : ""}>
            <span class="pe-slider"></span>
          </label>
          <span class="pe-role ${rcls}">${ROLE_LABEL[roleKey_] || roleKey_}</span>
          <span class="pe-name">${esc(displayName(p))}</span>
          ${marker ? `<span class="pe-tag pe-tag-marker" title="系统占位符，内容由 SillyTavern 自动填充">占位符</span>` : ""}
          <span class="pe-tag pe-tag-pos ${absolute ? "pe-abs" : ""}">${posLabel}</span>
          ${meta ? `<span class="pe-tag pe-tag-meta">${meta}</span>` : ""}
          <span class="pe-row-spacer"></span>
          <button class="pe-icon pe-dup" title="复制条目"><i class="fa-solid fa-clone"></i></button>
          <button class="pe-icon pe-del" title="${marker || p.system_prompt ? "从排序中移除" : "删除条目"}"><i class="fa-solid fa-trash"></i></button>
          <button class="pe-icon pe-exp" title="展开/折叠">
            <i class="fa-solid ${expanded ? "fa-chevron-up" : "fa-chevron-down"}"></i>
          </button>
        </div>
        <div class="pe-row-body ${expanded ? "" : "pe-hidden"}"></div>
      </div>`;

    // 展开内容
    if (expanded) row.querySelector(".pe-row-body").appendChild(buildEditFields(p, marker));

    // 事件
    const toggleExpand = () => {
        if (state.expanded.has(p.identifier)) state.expanded.delete(p.identifier);
        else state.expanded.add(p.identifier);
        renderList();
    };
    // 点击整条（行头空白区）即可展开/折叠；点开关、按钮、节点等控件时不触发
    row.querySelector(".pe-row-head").addEventListener("click", e => {
        if (e.target.closest(".pe-toggle, button, .pe-node, input, label, select, textarea, a")) return;
        toggleExpand();
    });
    row.querySelector(".pe-en").addEventListener("change", e => {
        state.order[idx].enabled = e.target.checked;
        row.classList.toggle("pe-disabled", !e.target.checked);
        refreshStats();
    });
    row.querySelector(".pe-exp").addEventListener("click", toggleExpand);
    row.querySelector(".pe-dup").addEventListener("click", () => duplicateEntry(p, idx));
    row.querySelector(".pe-del").addEventListener("click", () => deleteEntry(p, idx));

    // 拖拽排序(编号节点即手柄)
    const handle = row.querySelector(".pe-node");
    handle.addEventListener("mousedown", () => { row.draggable = true; });
    row.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", String(idx));
        e.dataTransfer.effectAllowed = "move";
        row.classList.add("pe-dragging");
    });
    row.addEventListener("dragend", () => { row.draggable = false; row.classList.remove("pe-dragging"); });
    row.addEventListener("dragover", e => { e.preventDefault(); row.classList.add("pe-dragover"); });
    row.addEventListener("dragleave", () => row.classList.remove("pe-dragover"));
    row.addEventListener("drop", e => {
        e.preventDefault();
        row.classList.remove("pe-dragover");
        const from = parseInt(e.dataTransfer.getData("text/plain"), 10);
        const to = idx;
        if (Number.isNaN(from) || from === to) return;
        const moved = state.order.splice(from, 1)[0];
        state.order.splice(to, 0, moved);
        renderList();
    });

    return row;
}

function buildEditFields(p, marker) {
    const wrap = document.createElement("div");
    wrap.className = "pe-fields";
    const absolute = isAbsolute(p);

    wrap.innerHTML = `
      <div class="pe-field">
        <label>名称 <span class="pe-q" data-help="name">?</span></label>
        <input type="text" class="pe-f-name" value="${esc(p.name || "")}" ${marker ? "disabled" : ""}
               placeholder="${marker ? "占位符名称由系统决定" : "便于你识别，不影响 AI"}">
      </div>
      <div class="pe-field-grid">
        <div class="pe-field">
          <label>角色 <span class="pe-q" data-help="role">?</span></label>
          <select class="pe-f-role" ${marker ? "disabled" : ""}>
            <option value="system" ${p.role === "system" || !p.role ? "selected" : ""}>系统 (system)</option>
            <option value="user" ${p.role === "user" ? "selected" : ""}>用户 (user)</option>
            <option value="assistant" ${p.role === "assistant" ? "selected" : ""}>AI (assistant)</option>
          </select>
        </div>
        <div class="pe-field">
          <label>注入位置 <span class="pe-q" data-help="position">?</span></label>
          <select class="pe-f-pos">
            <option value="0" ${!absolute ? "selected" : ""}>相对(按排序)</option>
            <option value="1" ${absolute ? "selected" : ""}>绝对(聊天内@深度)</option>
          </select>
        </div>
        <div class="pe-field pe-f-depth-wrap ${absolute ? "" : "pe-hidden"}">
          <label>深度 <span class="pe-q" data-help="depth">?</span></label>
          <input type="number" class="pe-f-depth" min="0" value="${Number(p.injection_depth ?? 4)}">
        </div>
        <div class="pe-field pe-f-order-wrap ${absolute ? "" : "pe-hidden"}">
          <label>顺序 <span class="pe-q" data-help="order">?</span></label>
          <input type="number" class="pe-f-order" value="${Number(p.injection_order ?? 100)}">
        </div>
      </div>
      ${marker ? `
        <div class="pe-marker-note"><i class="fa-solid fa-circle-info"></i>
          这是<b>占位符</b>:内容由 SillyTavern 在生成时自动填充(${esc(MARKER_NAMES[p.identifier] || p.identifier)})。
          你只能调整它在序列中的<b>位置</b>与<b>启用状态</b>。</div>
      ` : `
        <div class="pe-field">
          <label>内容 <span class="pe-q" data-help="content">?</span></label>
          <textarea class="pe-f-content" rows="6" placeholder="提示词正文…">${esc(p.content || "")}</textarea>
          <div class="pe-field-foot"><span class="pe-f-count">${fmtNum((p.content || "").length)} 字 · ≈${fmtNum(roughTokens(p.content))} token</span></div>
        </div>
        <div class="pe-field pe-checkbox">
          <label><input type="checkbox" class="pe-f-forbid" ${p.forbid_overrides ? "checked" : ""}>
            禁止被角色卡覆盖 <span class="pe-q" data-help="forbid">?</span></label>
        </div>
      `}
    `;

    // 字段事件 -> 写入 state.prompts
    const tgt = findPrompt(p.identifier);
    const q = sel => wrap.querySelector(sel);
    q(".pe-f-name") && q(".pe-f-name").addEventListener("input", e => { tgt.name = e.target.value; });
    q(".pe-f-role") && q(".pe-f-role").addEventListener("change", e => { tgt.role = e.target.value; renderList?.(); });
    const footEl = wrap.querySelector(".pe-f-count");
    let footTimer = null;
    function setFootReal(val) {
        clearTimeout(footTimer);
        footTimer = setTimeout(async () => {
            const real = await countTokensCached(val);
            if (footEl) footEl.textContent = `${fmtNum(val.length)} 字 · ${fmtNum(real)} token${_tokModeReal ? "" : " (估算)"}`;
        }, 300);
    }
    if (!marker && footEl) setFootReal(p.content || ""); // 展开时算一次真实值

    q(".pe-f-content") && q(".pe-f-content").addEventListener("input", e => {
        const val = e.target.value;
        tgt.content = val;
        const len = val.length;
        // 即时显示估算，稳定后替换为真实分词
        if (footEl) footEl.textContent = `${fmtNum(len)} 字 · ≈${fmtNum(roughTokens(val))} token`;
        setFootReal(val);
        // 行头标签即时估算（真实值会在统计刷新后回填）
        const rowEl = wrap.closest(".pe-row");
        const metaTag = rowEl?.querySelector(".pe-tag-meta");
        if (metaTag) metaTag.textContent = `${fmtNum(len)} 字 · ≈${fmtNum(roughTokens(val))} t`;
        refreshStats();
    });
    q(".pe-f-forbid") && q(".pe-f-forbid").addEventListener("change", e => { tgt.forbid_overrides = e.target.checked; });
    const posSel = q(".pe-f-pos");
    posSel.addEventListener("change", e => {
        tgt.injection_position = Number(e.target.value);
        if (tgt.injection_position === 1) {
            if (tgt.injection_depth === undefined) tgt.injection_depth = 4;
            if (tgt.injection_order === undefined) tgt.injection_order = 100;
        }
        wrap.querySelector(".pe-f-depth-wrap").classList.toggle("pe-hidden", tgt.injection_position !== 1);
        wrap.querySelector(".pe-f-order-wrap").classList.toggle("pe-hidden", tgt.injection_position !== 1);
        renderList();
    });
    q(".pe-f-depth") && q(".pe-f-depth").addEventListener("input", e => { tgt.injection_depth = Number(e.target.value); });
    q(".pe-f-order") && q(".pe-f-order").addEventListener("input", e => { tgt.injection_order = Number(e.target.value); });

    // 小问号 -> 跳到教程
    wrap.querySelectorAll(".pe-q").forEach(el => {
        el.addEventListener("click", () => gotoTutorial(el.dataset.help));
    });

    return wrap;
}

// ----- 统计：字符 / token / 角色分布 / 按条目明细 -----
let _statsTimer = null;
let _statsRun = 0;
let _entryStats = [];        // [{identifier,name,role,chars,t}] 按 token 降序
let _breakdownOpen = false;
function refreshStats() {
    clearTimeout(_statsTimer);
    _statsTimer = setTimeout(computeAndRenderStats, 250);
}

async function computeAndRenderStats() {
    const run = ++_statsRun; // 防止并发竞态
    const enabled = state.order.filter(o => o.enabled).map(o => findPrompt(o.identifier)).filter(Boolean);
    const authored = enabled.filter(p => !isMarker(p));

    // 字符数与条目数可即时显示
    let chars = 0;
    authored.forEach(p => { chars += (p.content || "").length; });
    setText("pe-st-count", fmtNum(enabled.length));
    setText("pe-st-chars", fmtNum(chars));

    // 真实 token（异步）
    const results = await Promise.all(authored.map(async p => {
        const content = p.content || "";
        const t = await countTokensCached(content);
        return { identifier: p.identifier, name: displayName(p), role: p.role || "system", chars: content.length, t };
    }));
    if (run !== _statsRun) return; // 已有更新的一次在跑，丢弃本次

    const byRole = { system: 0, user: 0, assistant: 0 };
    let total = 0;
    results.forEach(r => { byRole[r.role] = (byRole[r.role] || 0) + r.t; total += r.t; });
    _entryStats = results.slice().sort((a, b) => b.t - a.t);

    setText("pe-st-tokens", fmtNum(total));
    setText("pe-st-mode", _tokModeReal ? "实时分词" : "估算");

    // 角色分布条
    const order = ["system", "user", "assistant"];
    const meter = document.getElementById("pe-meter");
    if (meter) meter.innerHTML = order.map(r => {
        const w = total ? (byRole[r] / total * 100) : 0;
        return `<span class="pe-meter-seg pe-bg-${roleKey(r)}" style="width:${w}%"></span>`;
    }).join("");
    const legend = document.getElementById("pe-legend");
    if (legend) legend.innerHTML = order.map(r =>
        `<span><i class="pe-bg-${roleKey(r)}"></i>${ROLE_LABEL[r]} <b>${fmtNum(byRole[r])}</b></span>`
    ).join("");

    // 用真实 token 刷新各行尾部标签
    results.forEach(r => {
        const tag = document.querySelector(`#pe-list .pe-row[data-id="${cssAttr(r.identifier)}"] .pe-tag-meta`);
        if (tag) tag.textContent = `${fmtNum(r.chars)} 字 · ${fmtNum(r.t)} t`;
    });

    if (_breakdownOpen) renderBreakdown(total);
}

function renderBreakdown(total) {
    const panel = document.getElementById("pe-breakdown");
    if (!panel) return;
    if (!_entryStats.length) {
        panel.innerHTML = `<div class="pe-bd-empty">暂无可统计的文本条目（占位符的运行时内容不计入）。</div>`;
        return;
    }
    total = (total ?? _entryStats.reduce((a, b) => a + b.t, 0)) || 1;
    const max = Math.max(...(_entryStats.map(s => s.t)), 1);
    panel.innerHTML = `
      <div class="pe-bd-head">
        <span>按条目 token 占用 · 从高到低（占位符运行时内容不计）</span>
        <span class="pe-bd-total">合计 <b>${fmtNum(total)}</b></span>
      </div>
      <div class="pe-bd-list">
        ${_entryStats.map((s, i) => {
            const pct = (s.t / total * 100);
            const w = (s.t / max * 100);
            const rc = roleKey(s.role);
            return `<div class="pe-bd-item">
              <span class="pe-bd-rank">${i + 1}</span>
              <span class="pe-role pe-role-sm pe-bg-${rc}">${ROLE_LABEL[s.role]}</span>
              <span class="pe-bd-name" title="${esc(s.name)}">${esc(s.name)}</span>
              <span class="pe-bd-bar"><span class="pe-bg-${rc}" style="width:${w}%"></span></span>
              <span class="pe-bd-tok">${fmtNum(s.t)}</span>
              <span class="pe-bd-pct">${pct.toFixed(1)}%</span>
            </div>`;
        }).join("")}
      </div>`;
}

function setText(id, txt) { const el = document.getElementById(id); if (el) el.textContent = txt; }
function cssAttr(s) { return String(s).replace(/["\\]/g, "\\$&"); }

// ----- 条目增删改 -----
function addNewEntry() {
    const id = uuid();
    const p = {
        identifier: id,
        name: "新条目",
        role: "system",
        content: "",
        system_prompt: false,
        marker: false,
        injection_position: 0,
        injection_depth: 4,
        injection_order: 100,
        forbid_overrides: false,
    };
    state.prompts.push(p);
    state.order.push({ identifier: id, enabled: true });
    state.expanded.add(id);
    renderEditor();
    // 滚动到底部
    const list = document.getElementById("pe-list");
    list && (list.scrollTop = list.scrollHeight);
}

function duplicateEntry(p, idx) {
    const id = uuid();
    const copy = deepClone(p);
    copy.identifier = id;
    copy.name = (displayName(p)) + " 副本";
    copy.marker = false;          // 副本不再是占位符
    copy.system_prompt = false;
    state.prompts.push(copy);
    state.order.splice(idx + 1, 0, { identifier: id, enabled: state.order[idx].enabled });
    state.expanded.add(id);
    renderList();
}

function deleteEntry(p, idx) {
    const protectedEntry = isMarker(p) || p.system_prompt;
    state.order.splice(idx, 1);
    if (!protectedEntry) {
        const pi = state.prompts.findIndex(x => x.identifier === p.identifier);
        if (pi >= 0) state.prompts.splice(pi, 1);
    }
    state.expanded.delete(p.identifier);
    renderList();
    refreshStats();
}

function showAddExisting() {
    const inOrder = new Set(state.order.map(o => o.identifier));
    const available = state.prompts.filter(p => !inOrder.has(p.identifier));
    if (!available.length) { toast("info", "没有可重新添加的条目(所有条目都已在排序里)。"); return; }

    const box = document.createElement("div");
    box.className = "pe-popover";
    box.innerHTML = `<div class="pe-popover-title">添加已有条目</div>` +
        available.map(p => `
          <div class="pe-popover-item" data-id="${esc(p.identifier)}">
            <span class="pe-role pe-bg-${roleKey(p.role)}">${ROLE_LABEL[p.role] || p.role || "系统"}</span>
            ${esc(displayName(p))}
          </div>`).join("");
    document.getElementById("pe-modal").appendChild(box);

    box.querySelectorAll(".pe-popover-item").forEach(it => {
        it.addEventListener("click", () => {
            state.order.push({ identifier: it.dataset.id, enabled: true });
            box.remove();
            renderList();
            refreshStats();
        });
    });
    const off = e => { if (!box.contains(e.target)) { box.remove(); document.removeEventListener("mousedown", off); } };
    setTimeout(() => document.addEventListener("mousedown", off), 0);
}

// ----- 导入 / 导出 -----
function exportJson() {
    const data = { prompts: state.prompts, order: state.order, _note: "由 预设编辑器 导出，仅含提示词与排序" };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `preset-prompts-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
}

function importJson(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const data = JSON.parse(reader.result);
            // 支持两种格式:本扩展导出的 {prompts,order}，或完整 ST 预设 {prompts, prompt_order}
            if (Array.isArray(data.prompts)) state.prompts = deepClone(data.prompts);
            if (Array.isArray(data.order)) {
                state.order = deepClone(data.order);
            } else if (Array.isArray(data.prompt_order)) {
                const ref = data.prompt_order.find(x => Array.isArray(x.order)) || data.prompt_order[0];
                state.order = ref ? deepClone(ref.order) : [];
            }
            state.expanded = new Set();
            renderEditor();
            toast("success", "已导入。记得点「应用」或「保存」生效。");
        } catch (err) {
            console.error(err);
            toast("error", "导入失败：不是有效的 JSON。");
        }
    };
    reader.readAsText(file);
    e.target.value = "";
}

// =====================================================================
// 思维链预览
// =====================================================================
function renderPreview() {
    const pane = document.querySelector('.pe-pane[data-pane="preview"]');
    if (!pane) return;

    // 启用的条目，按当前排序
    const enabled = state.order.filter(o => o.enabled)
        .map(o => findPrompt(o.identifier)).filter(Boolean);

    const relative = enabled.filter(p => !isAbsolute(p));
    const absolute = enabled.filter(p => isAbsolute(p))
        .sort((a, b) => (Number(b.injection_depth ?? 0) - Number(a.injection_depth ?? 0))
            || (Number(a.injection_order ?? 100) - Number(b.injection_order ?? 100)));

    let html = `
      <div class="pe-preview-intro">
        <i class="fa-solid fa-circle-info"></i>
        下面按 AI <b>实际读取顺序</b>(自上而下)展示。<b>相对</b>条目按排序排列;
        <b>绝对(@深度)</b>条目会被插入「聊天记录」内部 —— 深度越大越靠上，深度 0 紧贴最新消息。
      </div>
      <div class="pe-flow">`;

    relative.forEach((p, i) => {
        const isChat = p.identifier === "chatHistory";
        html += flowCard(p, i + 1, isChat ? absolute : null);
    });

    html += `</div>`;

    if (!relative.length) html = `<div class="pe-empty">没有启用的条目。</div>`;

    // 旁注:绝对条目没有 chatHistory 时
    if (absolute.length && !relative.some(p => p.identifier === "chatHistory")) {
        html += `<div class="pe-preview-warn"><i class="fa-solid fa-triangle-exclamation"></i>
          有 ${absolute.length} 个绝对(@深度)条目，但当前排序里没有启用「聊天记录」占位符，它们将注入到(空的)聊天历史位置。</div>`;
    }

    pane.innerHTML = html;
}

function flowCard(p, n, absoluteList) {
    const rk = p.role || "system";
    const rc = roleKey(rk);
    const marker = isMarker(p);
    const preview = marker
        ? `<span class="pe-flow-marker">由系统填充：${esc(MARKER_NAMES[p.identifier] || p.identifier)}</span>`
        : esc((p.content || "").slice(0, 160)) + ((p.content || "").length > 160 ? "…" : "");

    let inner = `
      <div class="pe-flow-card pe-bl-${rc}">
        <div class="pe-flow-top">
          <span class="pe-flow-n">${n}</span>
          <span class="pe-role pe-bg-${rc}">${ROLE_LABEL[rk] || rk}</span>
          <span class="pe-flow-name">${esc(displayName(p))}</span>
          ${marker ? `<span class="pe-tag pe-tag-marker">占位符</span>` : ""}
        </div>
        <div class="pe-flow-content ${marker ? "pe-flow-content-marker" : ""}">${preview || "<i>(空)</i>"}</div>`;

    // 聊天记录内部的绝对注入
    if (p.identifier === "chatHistory" && absoluteList && absoluteList.length) {
        inner += `<div class="pe-chat-block"><div class="pe-chat-label">聊天记录内部 · 深度注入</div>`;
        absoluteList.forEach(a => {
            const arc = roleKey(a.role || "system");
            inner += `<div class="pe-inject pe-bl-${arc}">
                <span class="pe-inject-depth">@深度 ${a.injection_depth ?? 0}</span>
                <span class="pe-role pe-role-sm pe-bg-${arc}">${ROLE_LABEL[a.role || "system"]}</span>
                <span>${esc(displayName(a))}</span>
                <span class="pe-inject-prev">${esc((a.content || "").slice(0, 60))}${(a.content || "").length > 60 ? "…" : ""}</span>
              </div>`;
        });
        inner += `</div>`;
    }
    inner += `</div>`;
    return inner;
}

// =====================================================================
// 教程
// =====================================================================
function gotoTutorial(anchor) {
    const tabBtn = document.querySelector('.pe-tab[data-tab="tutorial"]');
    tabBtn?.click();
    setTimeout(() => {
        const el = document.getElementById("pe-help-" + anchor);
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
        el?.classList.add("pe-flash");
        setTimeout(() => el?.classList.remove("pe-flash"), 1500);
    }, 60);
}

function renderTutorial() {
    const pane = document.querySelector('.pe-pane[data-pane="tutorial"]');
    if (!pane || pane.dataset.built === "1") return;
    pane.dataset.built = "1";

    pane.innerHTML = `
    <div class="pe-tut">
      <div class="pe-tut-lead">
        「聊天补全预设」本质上是一份<b>给 AI 的说明书清单</b>。每一条目就是一段会被发给模型的文字(或一个占位符)。
        清单的<b>顺序</b>决定 AI 先读到什么、后读到什么 —— 这往往比内容本身更影响表现。
      </div>

      <div class="pe-tut-card" id="pe-help-name">
        <h3><i class="fa-solid fa-tag"></i> 名称 (Name)</h3>
        <p>条目在列表里的显示名,<b>只给你自己看</b>,不会发送给 AI,也不影响输出。随便起个好辨认的名字即可,比如「主提示词」「越狱」「输出格式要求」。</p>
      </div>

      <div class="pe-tut-card" id="pe-help-role">
        <h3><i class="fa-solid fa-user-tag"></i> 角色 (Role)</h3>
        <p>这条文字以<b>谁的身份</b>发给模型。聊天补全 API 把每条消息标记为三种身份之一:</p>
        <ul>
          <li><b>系统 (system)</b>:设定 / 规则 / 背景。模型把它当作「权威设定」,而不是对话内容。绝大多数提示词(人设、规则、格式要求)都用系统。</li>
          <li><b>用户 (user)</b>:当作「用户说的话」。常用于举例(few-shot)里用户的发言。</li>
          <li><b>AI (assistant)</b>:当作「AI 之前说过的话」。常用于:① 举例里 AI 的示范回答;② 在最末尾放一句来<b>引导/预填</b> AI 接下来的语气或开头(类似 prefill)。</li>
        </ul>
        <p class="pe-tut-tip">所谓「角色归于系统」,就是把这条设成 <b>system</b>:模型会把它理解成设定而非聊天。部分模型对 system 的遵从度更高,所以核心规则一般放 system。</p>
      </div>

      <div class="pe-tut-card" id="pe-help-position">
        <h3><i class="fa-solid fa-location-dot"></i> 注入位置 (Position)</h3>
        <p>决定这条文字被放到「最终提示」的<b>哪里</b>,有两种模式:</p>
        <ul>
          <li><b>相对 (按排序)</b> ——默认。它的位置就是<b>它在本列表中的位置</b>。它在「聊天记录」占位符<u>之前</u>就排在对话前面,在<u>之后</u>就排在对话后面。大多数条目用这个。</li>
          <li><b>绝对 (聊天内 @ 深度)</b> ——无视列表位置,直接<b>插进聊天记录内部</b>的某个深度(见下)。效果类似世界书里「按深度注入」的条目。适合需要紧贴最新对话、反复提醒模型的指令。</li>
        </ul>
      </div>

      <div class="pe-tut-card" id="pe-help-depth">
        <h3><i class="fa-solid fa-layer-group"></i> 深度 (Depth) <span class="pe-only">仅「绝对」位置</span></h3>
        <p>从聊天记录<b>末尾往回数</b>第几条消息<b>之前</b>插入。</p>
        <ul>
          <li><b>深度 0</b>:插在最末尾 —— 紧贴 AI 即将生成的回复,影响力最强(常用于强力指令、输出格式)。</li>
          <li><b>深度 1</b>:插在「最后一条消息」之前;数字越大,插得越靠上(越早)。</li>
        </ul>
        <p class="pe-tut-tip">想让某条规则「时刻在 AI 眼前」,放浅深度(0~4);想当背景铺垫,放深一点。</p>
      </div>

      <div class="pe-tut-card" id="pe-help-order">
        <h3><i class="fa-solid fa-arrow-down-1-9"></i> 顺序 (Order) <span class="pe-only">仅「绝对」位置</span></h3>
        <p>当<b>多个绝对条目处在同一深度</b>时,用这个数字决定它们之间谁先谁后(<b>数字小的在前</b>)。只有同深度撞车时才需要在意它,默认 100 通常不用改。</p>
      </div>

      <div class="pe-tut-card" id="pe-help-content">
        <h3><i class="fa-solid fa-pen"></i> 内容 (Content)</h3>
        <p>真正发给 AI 的正文。这里支持 ST 的<b>宏(macro)</b>,例如 <code>{{char}}</code>(角色名)、<code>{{user}}</code>(你的名字)、<code>{{persona}}</code> 等,生成时会被替换成实际值。占位符条目没有这个框 —— 它们的内容由系统自动填。</p>
      </div>

      <div class="pe-tut-card" id="pe-help-forbid">
        <h3><i class="fa-solid fa-lock"></i> 禁止被角色卡覆盖 (Forbid Overrides)</h3>
        <p>有些角色卡会自带「主提示词覆盖」或「历史后指令覆盖」。勾上后,本条目<b>锁定你预设里的写法</b>,不会被角色卡顶替。想让预设规则永远生效时勾上;想让角色卡能自定义时留空。</p>
      </div>

      <div class="pe-tut-card pe-tut-markers">
        <h3><i class="fa-solid fa-puzzle-piece"></i> 占位符 (Markers) —— 内容由系统自动填</h3>
        <p>带「占位符」标签的条目<b>没有可编辑内容</b>,它们只是「在这里插入某类内容」的<b>位置标记</b>。你能做的是<b>调整它们的前后顺序和启用</b>。常见占位符:</p>
        <ul>
          <li><b>角色描述 / 角色性格 / 场景</b>:来自角色卡对应字段。</li>
          <li><b>用户角色 (persona) 描述</b>:你的人物设定。</li>
          <li><b>对话示例</b>:角色卡里的示例对话。</li>
          <li><b>聊天记录</b>:真正的对话消息流。<u>它的位置极其关键</u> —— 它把整个清单分成「对话前(设定区)」和「对话后(收尾指令区)」两半。</li>
          <li><b>世界书(前置/后置)</b>:被触发的世界书条目,分别插在对话前/后。</li>
          <li><b>主提示词 / 辅助提示词 / 历史后指令</b>:这几个虽然常带内容,但也作为标准锚点存在。<b>历史后指令</b>排在「聊天记录」之后,是 AI 回复前看到的<b>最后一段指令</b>,影响力很强,常被当作「越狱/强约束」位。</li>
        </ul>
      </div>

      <div class="pe-tut-card pe-tut-flow">
        <h3><i class="fa-solid fa-diagram-project"></i> 一图理解读取顺序</h3>
        <p>AI 大致按这个顺序「读」你的预设(具体取决于你的排序):</p>
        <div class="pe-tut-pipeline">
          <span>主提示词/规则</span><i class="fa-solid fa-arrow-right"></i>
          <span>角色/人设/世界书(前)</span><i class="fa-solid fa-arrow-right"></i>
          <span>对话示例</span><i class="fa-solid fa-arrow-right"></i>
          <span class="pe-pipe-chat">聊天记录<small>(绝对@深度条目插这里)</small></span><i class="fa-solid fa-arrow-right"></i>
          <span>世界书(后)</span><i class="fa-solid fa-arrow-right"></i>
          <span class="pe-pipe-last">历史后指令(最后看到)</span>
        </div>
        <p class="pe-tut-tip">想看你<b>当前这份预设</b>的真实顺序,切到「思维链预览」标签页。</p>
      </div>

      <div class="pe-tut-card pe-tut-save">
        <h3><i class="fa-solid fa-floppy-disk"></i> 保存说明</h3>
        <ul>
          <li><b>保存</b>（金色按钮）：把你的改动写入<b>当前选中的预设文件</b>并立即生效。这是最常用的一键保存,点它就行。</li>
          <li><b>应用</b>：只让改动在<b>当前会话临时生效</b>、方便你先试效果,<u>不</u>写入文件。想保留就再点「保存」。</li>
          <li><b>放弃</b>（↺ 图标）：丢弃所有未保存的改动,重新载入当前预设。</li>
          <li><b>导出 / 导入 JSON</b>（左下角图标）：把提示词与排序导出成文件备份;导入支持本扩展格式或完整 ST 预设文件。</li>
        </ul>
        <p class="pe-tut-tip">小提示:点「保存」后若个别 ST 版本未能直接写文件,扩展会自动去点 SillyTavern 预设栏的原生保存按钮兜底,正常情况下你无需手动操作。</p>
      </div>
    </div>`;
}

// =====================================================================
// 初始化:注入入口按钮
// =====================================================================
function injectLaunchButton() {
    if (document.getElementById("pe-menu-item")) return;

    const menu = document.getElementById("extensionsMenu");
    if (menu) {
        const item = document.createElement("div");
        item.id = "pe-menu-item";
        item.className = "list-group-item flex-container flexGap5 interactable";
        item.tabIndex = 0;
        item.innerHTML = `<div class="fa-solid fa-sliders extensionsMenuExtensionButton"></div><span>${LABEL}</span>`;
        item.addEventListener("click", () => { document.getElementById("extensionsMenu")?.classList.remove("show"); openEditor(); });
        menu.appendChild(item);
    } else {
        // 回退:右下角浮动按钮
        if (document.getElementById("pe-fab")) return;
        const fab = document.createElement("div");
        fab.id = "pe-fab";
        fab.title = LABEL;
        fab.innerHTML = `<i class="fa-solid fa-sliders"></i>`;
        fab.addEventListener("click", openEditor);
        document.body.appendChild(fab);
    }
}

async function init() {
    await loadDeps();
    await loadTokenizer();
    injectLaunchButton();
    // 菜单有时是延迟渲染的，补一次
    setTimeout(injectLaunchButton, 1500);
    console.log(`[${EXT_ID}] 已加载`);
}

jQuery(async () => {
    try {
        if (eventSource && event_types?.APP_READY) {
            eventSource.on(event_types.APP_READY, init);
        }
    } catch { /* ignore */ }
    // 双保险:DOM 就绪后也尝试一次
    setTimeout(init, 800);
});
