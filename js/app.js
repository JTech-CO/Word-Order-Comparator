/**
 * Word Order Comparison Translator - 상태, DOM, API, 렌더링, 이벤트
 * config.js 로드 후 로드해야 함.
 */

// ── State ──
let inputs = { ko: "", ja: "", en: "", zh: "" };
let result = null;
let hoveredGroup = null;
let isLoading = false;

// ── DOM refs ──
const $container = document.getElementById("container");
const $linesSvg = document.getElementById("linesSvg");
const $langRows = document.getElementById("langRows");
const $loading = document.getElementById("loading");
const $loadingStep = document.getElementById("loadingStep");
const $error = document.getElementById("error");
const $btnReset = document.getElementById("btnReset");
const $legend = document.getElementById("legend");

// segment DOM element refs: { "ko-0": el, "ko-1": el, ... }
let segmentEls = {};

// ── API ──
async function callGrok(systemPrompt, userMessage) {
  const resp = await fetch(GROK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROK_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROK_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });
  if (!resp.ok) {
    const errBody = await resp.text();
    throw new Error(`Grok API error ${resp.status}: ${errBody}`);
  }
  const data = await resp.json();
  const raw = data?.choices?.[0]?.message?.content || "";
  return JSON.parse(raw.replace(/```json|```/g, "").trim());
}

// ── Render: Input mode ──
function renderInputMode() {
  $langRows.innerHTML = "";
  $linesSvg.classList.add("hidden");
  $linesSvg.innerHTML = "";
  $btnReset.classList.add("hidden");
  $legend.classList.add("hidden");
  $error.classList.add("hidden");
  segmentEls = {};

  LANGUAGES.forEach((lang, li) => {
    if (li > 0) {
      const divider = document.createElement("div");
      divider.className = "lang-divider";
      $langRows.appendChild(divider);
    }

    const row = document.createElement("div");
    row.className = "lang-row";

    row.innerHTML = `
      <div class="lang-label">
        <div class="lang-label-name">${lang.label}</div>
        <div class="lang-label-ko">${lang.labelKo}</div>
      </div>
      <div class="lang-content">
        <input class="lang-input" type="text"
          placeholder="${lang.placeholder}"
          value="${inputs[lang.key]}"
          data-lang="${lang.key}">
      </div>
      <button class="btn-translate inactive" data-lang="${lang.key}">번역</button>
    `;

    const input = row.querySelector(".lang-input");
    const btn = row.querySelector(".btn-translate");

    input.addEventListener("input", () => {
      inputs[lang.key] = input.value;
      updateBtnState(btn, input.value);
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && input.value.trim() && !isLoading) {
        handleTranslate(lang.key);
      }
    });

    btn.addEventListener("click", () => {
      if (input.value.trim() && !isLoading) handleTranslate(lang.key);
    });

    updateBtnState(btn, inputs[lang.key]);
    $langRows.appendChild(row);
  });
}

function updateBtnState(btn, value) {
  if (value.trim() && !isLoading) {
    btn.className = "btn-translate active";
  } else {
    btn.className = "btn-translate inactive";
  }
}

// ── Render: Result mode ──
function renderResultMode() {
  $langRows.innerHTML = "";
  segmentEls = {};

  LANGUAGES.forEach((lang, li) => {
    if (li > 0) {
      const divider = document.createElement("div");
      divider.className = "lang-divider";
      $langRows.appendChild(divider);
    }

    const row = document.createElement("div");
    row.className = "lang-row has-result";

    const labelDiv = document.createElement("div");
    labelDiv.className = "lang-label";
    labelDiv.innerHTML = `
      <div class="lang-label-name">${lang.label}</div>
      <div class="lang-label-ko">${lang.labelKo}</div>
    `;
    row.appendChild(labelDiv);

    const contentDiv = document.createElement("div");
    contentDiv.className = "lang-content";

    const segWrap = document.createElement("div");
    segWrap.className = "segments-wrap";

    const segs = result.alignments[lang.key] || [];
    segs.forEach((seg, posIdx) => {
      const span = document.createElement("span");
      const gid = seg.group_id;
      const isUnique = gid === null || gid === undefined;
      const color = isUnique ? UNIQUE_COLOR : SHARED_COLORS[gid % SHARED_COLORS.length];

      span.className = "segment" + (isUnique ? " unique" : "");
      span.textContent = seg.text;
      span.style.color = color;
      span.dataset.groupId = isUnique ? "null" : gid;

      if (!isUnique) {
        const group = result.groups.find(g => g.id === gid);
        span.title = group ? group.meaning : "";
      } else {
        span.title = `${lang.label} 고유 형태소`;
      }

      span.addEventListener("mouseenter", () => {
        hoveredGroup = isUnique ? -1 : gid;
        applyHoverStyles();
      });
      span.addEventListener("mouseleave", () => {
        hoveredGroup = null;
        applyHoverStyles();
      });

      segmentEls[`${lang.key}-${posIdx}`] = span;
      segWrap.appendChild(span);
    });

    contentDiv.appendChild(segWrap);
    row.appendChild(contentDiv);
    $langRows.appendChild(row);
  });

  $btnReset.classList.remove("hidden");
  renderLegend();
  $legend.classList.remove("hidden");

  setTimeout(computeLines, 150);
}

// ── Legend ──
function renderLegend() {
  $legend.innerHTML = "";

  result.groups.forEach((group) => {
    const item = document.createElement("div");
    item.className = "legend-item";
    item.style.color = "#666";

    const dot = document.createElement("div");
    dot.className = "legend-dot";
    dot.style.background = SHARED_COLORS[group.id % SHARED_COLORS.length];

    const text = document.createTextNode(group.meaning);

    item.appendChild(dot);
    item.appendChild(text);

    item.addEventListener("mouseenter", () => { hoveredGroup = group.id; applyHoverStyles(); });
    item.addEventListener("mouseleave", () => { hoveredGroup = null; applyHoverStyles(); });

    $legend.appendChild(item);
  });

  const uItem = document.createElement("div");
  uItem.className = "legend-item";
  uItem.style.color = "#666";

  const uDot = document.createElement("div");
  uDot.className = "legend-dot";
  uDot.style.background = UNIQUE_COLOR;
  uDot.style.border = "1px dashed #777";

  uItem.appendChild(uDot);
  uItem.appendChild(document.createTextNode("언어 고유 형태소"));

  uItem.addEventListener("mouseenter", () => { hoveredGroup = -1; applyHoverStyles(); });
  uItem.addEventListener("mouseleave", () => { hoveredGroup = null; applyHoverStyles(); });

  $legend.appendChild(uItem);
}

// ── SVG Lines ──
function computeLines() {
  if (!result) return;
  $linesSvg.innerHTML = "";
  $linesSvg.classList.remove("hidden");

  const containerRect = $container.getBoundingClientRect();
  const langKeys = LANGUAGES.map(l => l.key);

  for (const group of result.groups) {
    const gid = group.id;
    const color = SHARED_COLORS[gid % SHARED_COLORS.length];

    for (let li = 0; li < langKeys.length - 1; li++) {
      const fromLang = langKeys[li];
      const toLang = langKeys[li + 1];

      const fromPositions = [];
      const toPositions = [];
      (result.alignments[fromLang] || []).forEach((seg, idx) => {
        if (seg.group_id === gid) fromPositions.push(idx);
      });
      (result.alignments[toLang] || []).forEach((seg, idx) => {
        if (seg.group_id === gid) toPositions.push(idx);
      });

      if (!fromPositions.length || !toPositions.length) continue;

      const fromIdx = fromPositions[Math.floor(fromPositions.length / 2)];
      const toIdx = toPositions[Math.floor(toPositions.length / 2)];

      const fromEl = segmentEls[`${fromLang}-${fromIdx}`];
      const toEl = segmentEls[`${toLang}-${toIdx}`];
      if (!fromEl || !toEl) continue;

      const fromRect = fromEl.getBoundingClientRect();
      const toRect = toEl.getBoundingClientRect();

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", fromRect.left + fromRect.width / 2 - containerRect.left);
      line.setAttribute("y1", fromRect.bottom - containerRect.top + 3);
      line.setAttribute("x2", toRect.left + toRect.width / 2 - containerRect.left);
      line.setAttribute("y2", toRect.top - containerRect.top - 3);
      line.setAttribute("stroke", color);
      line.setAttribute("stroke-width", "2");
      line.setAttribute("stroke-opacity", "0.65");
      line.dataset.groupId = gid;

      $linesSvg.appendChild(line);
    }
  }
  applyHoverStyles();
}

// ── Hover ──
function applyHoverStyles() {
  document.querySelectorAll(".segment").forEach((el) => {
    const gid = el.dataset.groupId;
    const isUnique = gid === "null";
    const numGid = isUnique ? null : parseInt(gid);
    const color = isUnique ? UNIQUE_COLOR : SHARED_COLORS[numGid % SHARED_COLORS.length];

    let highlighted;
    if (hoveredGroup === null) {
      highlighted = true;
    } else if (isUnique) {
      highlighted = hoveredGroup === -1;
    } else {
      highlighted = hoveredGroup === numGid;
    }

    el.style.opacity = highlighted ? "1" : "0.2";
    el.style.background = (highlighted && hoveredGroup !== null) ? color + "1A" : "transparent";
  });

  $linesSvg.querySelectorAll("line").forEach((line) => {
    const gid = parseInt(line.dataset.groupId);
    if (hoveredGroup === null) {
      line.setAttribute("stroke-opacity", "0.65");
      line.setAttribute("stroke-width", "2");
    } else if (hoveredGroup === gid) {
      line.setAttribute("stroke-opacity", "1");
      line.setAttribute("stroke-width", "3");
    } else {
      line.setAttribute("stroke-opacity", "0.08");
      line.setAttribute("stroke-width", "2");
    }
  });

  $legend.querySelectorAll(".legend-item").forEach((item) => {
    const dot = item.querySelector(".legend-dot");
    if (hoveredGroup === null) {
      item.style.color = "#666";
      dot.style.opacity = "1";
    } else {
      const isLast = item === $legend.lastElementChild;
      let matches;
      if (isLast) {
        matches = hoveredGroup === -1;
      } else {
        const idx = Array.from($legend.children).indexOf(item);
        matches = result.groups[idx] && hoveredGroup === result.groups[idx].id;
      }
      item.style.color = matches ? "#666" : "#ccc";
      dot.style.opacity = matches ? "1" : "0.3";
    }
  });
}

// ── Translate ──
async function handleTranslate(sourceLang) {
  const text = inputs[sourceLang].trim();
  if (!text) return;

  if (!GROK_API_KEY || GROK_API_KEY === "__GROK_API_KEY__") {
    showError("API 키가 설정되지 않았습니다. GitHub Secrets에 GROK_API_KEY를 설정해주세요.");
    return;
  }

  isLoading = true;
  result = null;
  $error.classList.add("hidden");
  $linesSvg.classList.add("hidden");
  $linesSvg.innerHTML = "";
  showLoading("1/2: 자연스러운 번역 생성 중...");

  try {
    const translations = await callGrok(
      STEP1_SYSTEM,
      `The source language is ${sourceLang}. Translate this sentence into all 4 languages (including the source language, keep it as-is if it's already correct):\n\n${text}`
    );

    inputs = translations;

    showLoading("2/2: 형태소 분석 및 어순 정렬 중...");
    const alignment = await callGrok(
      STEP2_SYSTEM,
      `Analyze morpheme alignment for these translations of the same sentence:\n\n- Korean: ${translations.ko}\n- Japanese: ${translations.ja}\n- English: ${translations.en}\n- Chinese: ${translations.zh}`
    );

    result = alignment;
    hideLoading();
    renderResultMode();
  } catch (e) {
    console.error(e);
    hideLoading();
    if (e.message.includes("400")) {
      showError("API 요청 오류입니다. API 키와 모델명을 확인해주세요.");
    } else if (e.message.includes("403") || e.message.includes("401")) {
      showError("API 키가 유효하지 않습니다. Grok API 키를 확인해주세요.");
    } else if (e.message.includes("429")) {
      showError("API 요청 제한에 도달했습니다. 잠시 후 다시 시도해주세요.");
    } else {
      showError(`번역 중 오류가 발생했습니다: ${e.message}`);
    }
  } finally {
    isLoading = false;
  }
}

// ── Reset ──
function handleReset() {
  inputs = { ko: "", ja: "", en: "", zh: "" };
  result = null;
  hoveredGroup = null;
  renderInputMode();
}

// ── Helpers ──
function showLoading(text) {
  $loadingStep.textContent = text;
  $loading.classList.remove("hidden");
}
function hideLoading() {
  $loading.classList.add("hidden");
}
function showError(msg) {
  $error.textContent = msg;
  $error.classList.remove("hidden");
}

// ── Events ──
$btnReset.addEventListener("click", handleReset);
window.addEventListener("resize", () => { if (result) computeLines(); });

// ── Init ──
renderInputMode();
