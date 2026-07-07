(function () {
  const original = window.PORTFOLIO_CONTENT || {};
  const data = JSON.parse(JSON.stringify(original));
  const typeLabels = {
    document: "文档",
    image: "图片",
    video: "视频"
  };

  let rootHandle = null;
  const usedAssetNames = new Map();

  const dom = {
    form: document.getElementById("editorForm"),
    profileFields: document.getElementById("profileFields"),
    sectionFields: document.getElementById("sectionFields"),
    metricsList: document.getElementById("metricsList"),
    projectsList: document.getElementById("projectsList"),
    processList: document.getElementById("processList"),
    folderName: document.getElementById("folderName"),
    saveStatus: document.getElementById("saveStatus"),
    selectFolderButton: document.getElementById("selectFolderButton"),
    saveButton: document.getElementById("saveButton"),
    downloadContentButton: document.getElementById("downloadContentButton"),
    addMetricButton: document.getElementById("addMetricButton"),
    addProjectButton: document.getElementById("addProjectButton"),
    addProcessButton: document.getElementById("addProcessButton")
  };

  const sectionDefaults = {
    heroEyebrow: "Advertising Portfolio · 2026",
    heroTitle: `${data.profile?.name || "你的名字"} · 广告作品集`,
    overviewTitle: "文档、图片、视频，都放进同一套清晰的叙事里。",
    workTitle: "作品",
    workIntro: "每个项目都保留封面、媒介类型、职责、过程文件和预览入口，适合面试前快速展示重点。",
    processTitle: "从问题到表达",
    aboutTitle: "我适合需要“想清楚，也做出来”的团队。",
    aboutText:
      "我习惯把策略文档、视觉稿、视频脚本和复盘材料放在同一条逻辑线上看：先理解人，再找到表达，最后让内容在合适的媒介里形成连续记忆。",
    contactTitle: "期待把下一个传播问题讲清楚。"
  };

  function html(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[char];
    });
  }

  function setStatus(message, tone) {
    dom.saveStatus.textContent = message;
    dom.saveStatus.dataset.tone = tone || "neutral";
  }

  function textField(scope, key, label, value, extraClass) {
    return `
      <label class="field ${extraClass || ""}">
        <span>${label}</span>
        <input type="text" data-${scope}="${key}" value="${html(value)}" />
      </label>
    `;
  }

  function textArea(scope, key, label, value, extraClass, rows) {
    return `
      <label class="field ${extraClass || ""}">
        <span>${label}</span>
        <textarea data-${scope}="${key}" rows="${rows || 4}">${html(value)}</textarea>
      </label>
    `;
  }

  function fieldValue(root, selector) {
    const element = root.querySelector(selector);
    return element ? element.value.trim() : "";
  }

  function listFromCsv(value) {
    return value
      .split(/[，,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function listFromLines(value) {
    return value
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function renderProfile() {
    const profile = data.profile || {};
    dom.profileFields.innerHTML = `
      <div class="form-grid">
        ${textField("profile", "name", "姓名", profile.name)}
        ${textField("profile", "role", "身份 / 定位", profile.role)}
        ${textField("profile", "location", "城市 / 状态", profile.location)}
        ${textField("profile", "email", "邮箱", profile.email)}
        ${textField("profile", "availability", "求职状态", profile.availability)}
        ${textField("profile", "focus", "能力方向（用逗号分隔）", (profile.focus || []).join("，"))}
        ${textArea("profile", "intro", "首页简介", profile.intro, "full", 4)}
      </div>
      <div class="asset-editor">
        <img class="asset-preview" data-preview="heroImage" src="${html(profile.heroImage)}" alt="" />
        <div class="asset-controls">
          <span class="asset-label">首页大图</span>
          <label class="file-control">
            选择新图片
            <input type="file" accept="image/*" data-file="heroImage" />
          </label>
          ${textField("profile", "heroImage", "图片路径", profile.heroImage)}
          ${textField("profile", "heroAlt", "图片描述", profile.heroAlt)}
        </div>
      </div>
    `;
  }

  function renderSections() {
    const sections = { ...sectionDefaults, ...(data.sections || {}) };
    dom.sectionFields.innerHTML = `
      <div class="form-grid">
        ${textField("section", "heroEyebrow", "首页小标题", sections.heroEyebrow)}
        ${textField("section", "heroTitle", "首页大标题", sections.heroTitle)}
        ${textField("section", "overviewTitle", "概览标题", sections.overviewTitle, "full")}
        ${textField("section", "workTitle", "作品区标题", sections.workTitle)}
        ${textField("section", "processTitle", "方法区标题", sections.processTitle)}
        ${textField("section", "aboutTitle", "关于区标题", sections.aboutTitle, "full")}
        ${textArea("section", "workIntro", "作品区说明", sections.workIntro, "full", 3)}
        ${textArea("section", "aboutText", "关于区正文", sections.aboutText, "full", 4)}
        ${textField("section", "contactTitle", "联系区标题", sections.contactTitle, "full")}
      </div>
    `;
  }

  function metricHtml(metric) {
    return `
      <div class="metric-item" data-metric-item>
        <div class="form-grid">
          ${textField("field", "value", "数字", metric.value)}
          ${textField("field", "label", "说明", metric.label)}
        </div>
        <div class="item-actions">
          <button class="danger-button" type="button" data-remove-item>删除</button>
        </div>
      </div>
    `;
  }

  function renderMetrics() {
    dom.metricsList.innerHTML = (data.metrics || []).map(metricHtml).join("");
  }

  function projectHtml(project, index) {
    const title = project.title || "新作品";
    return `
      <article class="project-editor" data-project-card>
        <div class="project-editor-header">
          <h3>${index + 1}. ${html(title)}</h3>
          <div class="item-actions">
            <button class="ghost-button small" type="button" data-move-project="up">上移</button>
            <button class="ghost-button small" type="button" data-move-project="down">下移</button>
            <button class="danger-button" type="button" data-remove-project>删除</button>
          </div>
        </div>
        <input type="hidden" data-field="id" value="${html(project.id)}" />
        <div class="form-grid three">
          ${textField("field", "title", "项目标题", project.title)}
          <label class="field">
            <span>项目类型</span>
            <select data-field="type">
              <option value="document" ${project.type === "document" ? "selected" : ""}>文档</option>
              <option value="image" ${project.type === "image" ? "selected" : ""}>图片</option>
              <option value="video" ${project.type === "video" ? "selected" : ""}>视频</option>
            </select>
          </label>
          ${textField("field", "year", "年份", project.year)}
          ${textArea("field", "summary", "项目简介", project.summary, "full", 4)}
          ${textField("field", "role", "你的职责", project.role, "full")}
          ${textField("field", "tags", "标签（用逗号分隔）", (project.tags || []).join("，"), "full")}
        </div>
        <div class="asset-editor">
          <img class="asset-preview" data-preview="cover" src="${html(project.cover)}" alt="" />
          <div class="asset-controls">
            <span class="asset-label">项目封面</span>
            <label class="file-control">
              选择新封面
              <input type="file" accept="image/*" data-file="cover" />
            </label>
            ${textField("field", "cover", "封面路径", project.cover)}
            ${textField("field", "coverAlt", "封面描述", project.coverAlt)}
          </div>
        </div>
        <div class="form-grid">
          ${textField("field", "document", "文档路径", project.document || "")}
          ${textField("field", "video", "视频路径", project.video || "")}
          <label class="field">
            <span>上传文档</span>
            <input type="file" data-file="document" accept=".html,.htm,.pdf,.doc,.docx,.ppt,.pptx,.key,.txt,application/pdf" />
          </label>
          <label class="field">
            <span>上传视频</span>
            <input type="file" data-file="video" accept="video/*,.mp4,.webm,.mov" />
          </label>
          ${textArea("field", "gallery", "详情页图片路径（每行一张）", (project.gallery || []).join("\n"), "full", 4)}
          <label class="field full">
            <span>追加详情页图片</span>
            <input type="file" accept="image/*" data-file="gallery" multiple />
          </label>
        </div>
      </article>
    `;
  }

  function renderProjects() {
    dom.projectsList.innerHTML = (data.projects || [])
      .map((project, index) => projectHtml(project, index))
      .join("");
  }

  function processHtml(item) {
    return `
      <div class="process-item-editor" data-process-item>
        <div class="form-grid">
          ${textField("field", "title", "标题", item.title)}
          ${textArea("field", "text", "说明", item.text, "", 3)}
        </div>
        <div class="item-actions">
          <button class="danger-button" type="button" data-remove-item>删除</button>
        </div>
      </div>
    `;
  }

  function renderProcess() {
    dom.processList.innerHTML = (data.process || []).map(processHtml).join("");
  }

  function defaultProject() {
    return {
      id: "",
      type: "document",
      typeLabel: "文档",
      title: "新作品项目",
      year: new Date().getFullYear().toString(),
      cover: "assets/images/hero-portfolio.png",
      coverAlt: "",
      summary: "",
      role: "",
      tags: [],
      document: "",
      video: "",
      gallery: []
    };
  }

  function updateProjectHeadings() {
    dom.projectsList.querySelectorAll("[data-project-card]").forEach((card, index) => {
      const title = fieldValue(card, '[data-field="title"]') || "新作品";
      card.querySelector("h3").textContent = `${index + 1}. ${title}`;
    });
  }

  function previewImage(input) {
    const file = input.files && input.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    const preview = input.closest(".asset-editor")?.querySelector("[data-preview]");
    if (preview) preview.src = URL.createObjectURL(file);
  }

  async function pickFolder() {
    if (!window.showDirectoryPicker) {
      setStatus("请用 Chrome 或 Edge 打开本地网址后再选择文件夹", "warning");
      return;
    }

    try {
      rootHandle = await window.showDirectoryPicker({
        id: "portfolio-site",
        mode: "readwrite"
      });
      const permission = await rootHandle.requestPermission({ mode: "readwrite" });
      if (permission !== "granted") {
        rootHandle = null;
        setStatus("未获得写入权限", "warning");
        return;
      }
      await rootHandle.getFileHandle("index.html");
      await rootHandle.getFileHandle("content.js");
      dom.folderName.textContent = rootHandle.name;
      setStatus("文件夹已就绪", "success");
    } catch (error) {
      rootHandle = null;
      setStatus("请选择包含 index.html 和 content.js 的网站文件夹", "warning");
    }
  }

  async function ensureDirectory(handle, parts) {
    let current = handle;
    for (const part of parts) {
      current = await current.getDirectoryHandle(part, { create: true });
    }
    return current;
  }

  async function writeFile(handle, fileName, content) {
    const fileHandle = await handle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  function extensionFor(file, fallback) {
    const nameExtension = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "";
    if (nameExtension) return nameExtension.replace(/[^a-z0-9]/g, "") || fallback;
    if (file.type.includes("jpeg")) return "jpg";
    if (file.type.includes("png")) return "png";
    if (file.type.includes("webp")) return "webp";
    if (file.type.includes("pdf")) return "pdf";
    if (file.type.includes("mp4")) return "mp4";
    return fallback;
  }

  function safeBaseName(file, prefix) {
    const raw = file.name.replace(/\.[^.]+$/, "");
    const base =
      raw
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase()
        .slice(0, 42) || prefix;
    const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
    const key = `${prefix}-${stamp}-${base}`;
    const count = (usedAssetNames.get(key) || 0) + 1;
    usedAssetNames.set(key, count);
    return count === 1 ? key : `${key}-${count}`;
  }

  async function writeAsset(file, folder, prefix) {
    const dirHandle = await ensureDirectory(rootHandle, ["assets", folder]);
    const fallbackExt = folder === "videos" ? "mp4" : folder === "docs" ? "pdf" : "png";
    const fileName = `${safeBaseName(file, prefix)}.${extensionFor(file, fallbackExt)}`;
    await writeFile(dirHandle, fileName, file);
    return `assets/${folder}/${fileName}`;
  }

  function uniqueId(base, usedIds) {
    let normalized =
      base
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase() || "project";
    let id = normalized;
    let index = 2;
    while (usedIds.has(id)) {
      id = `${normalized}-${index}`;
      index += 1;
    }
    usedIds.add(id);
    return id;
  }

  async function collectContent(options) {
    const writeAssets = Boolean(options?.writeAssets);
    const profile = {};
    dom.profileFields.querySelectorAll("[data-profile]").forEach((field) => {
      profile[field.dataset.profile] = field.value.trim();
    });
    profile.focus = listFromCsv(profile.focus || "");

    const heroFile = dom.profileFields.querySelector('[data-file="heroImage"]')?.files?.[0];
    if (writeAssets && heroFile) {
      profile.heroImage = await writeAsset(heroFile, "images", "hero");
    }

    const sections = {};
    dom.sectionFields.querySelectorAll("[data-section]").forEach((field) => {
      sections[field.dataset.section] = field.value.trim();
    });

    const metrics = Array.from(dom.metricsList.querySelectorAll("[data-metric-item]"))
      .map((item) => ({
        value: fieldValue(item, '[data-field="value"]'),
        label: fieldValue(item, '[data-field="label"]')
      }))
      .filter((metric) => metric.value || metric.label);

    const usedIds = new Set();
    const projects = [];
    for (const card of dom.projectsList.querySelectorAll("[data-project-card]")) {
      const type = fieldValue(card, '[data-field="type"]') || "document";
      const project = {
        id: uniqueId(fieldValue(card, '[data-field="id"]') || fieldValue(card, '[data-field="title"]'), usedIds),
        type,
        typeLabel: typeLabels[type] || "文档",
        title: fieldValue(card, '[data-field="title"]'),
        year: fieldValue(card, '[data-field="year"]'),
        cover: fieldValue(card, '[data-field="cover"]'),
        coverAlt: fieldValue(card, '[data-field="coverAlt"]'),
        summary: fieldValue(card, '[data-field="summary"]'),
        role: fieldValue(card, '[data-field="role"]'),
        tags: listFromCsv(fieldValue(card, '[data-field="tags"]')),
        document: fieldValue(card, '[data-field="document"]'),
        video: fieldValue(card, '[data-field="video"]'),
        gallery: listFromLines(fieldValue(card, '[data-field="gallery"]'))
      };

      const coverFile = card.querySelector('[data-file="cover"]')?.files?.[0];
      if (writeAssets && coverFile) {
        project.cover = await writeAsset(coverFile, "images", "cover");
      }

      const documentFile = card.querySelector('[data-file="document"]')?.files?.[0];
      if (writeAssets && documentFile) {
        project.document = await writeAsset(documentFile, "docs", "document");
      }

      const videoFile = card.querySelector('[data-file="video"]')?.files?.[0];
      if (writeAssets && videoFile) {
        project.video = await writeAsset(videoFile, "videos", "video");
      }

      const galleryFiles = Array.from(card.querySelector('[data-file="gallery"]')?.files || []);
      if (writeAssets && galleryFiles.length) {
        for (const file of galleryFiles) {
          project.gallery.push(await writeAsset(file, "images", "gallery"));
        }
      }

      if (!project.gallery.length && project.cover) {
        project.gallery = [project.cover];
      }

      if (project.title) projects.push(project);
    }

    const process = Array.from(dom.processList.querySelectorAll("[data-process-item]"))
      .map((item) => ({
        title: fieldValue(item, '[data-field="title"]'),
        text: fieldValue(item, '[data-field="text"]')
      }))
      .filter((item) => item.title || item.text);

    return {
      profile,
      sections,
      metrics,
      filters: original.filters || [
        { key: "all", label: "全部" },
        { key: "document", label: "文档" },
        { key: "image", label: "图片" },
        { key: "video", label: "视频" }
      ],
      projects,
      process
    };
  }

  function contentScript(content) {
    return `window.PORTFOLIO_CONTENT = ${JSON.stringify(content, null, 2)};\n`;
  }

  async function saveSite() {
    if (!rootHandle) {
      setStatus("请先选择网站文件夹", "warning");
      return;
    }

    try {
      dom.saveButton.disabled = true;
      setStatus("正在保存...", "neutral");
      usedAssetNames.clear();
      const content = await collectContent({ writeAssets: true });
      await writeFile(rootHandle, "content.js", contentScript(content));
      localStorage.removeItem("adPortfolioImageOverrides");
      setStatus("已保存，可以预览网站", "success");
    } catch (error) {
      setStatus("保存失败，请重新选择文件夹", "warning");
    } finally {
      dom.saveButton.disabled = false;
    }
  }

  async function downloadContent() {
    const content = await collectContent({ writeAssets: false });
    const blob = new Blob([contentScript(content)], { type: "text/javascript;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "content.js";
    link.click();
    URL.revokeObjectURL(link.href);
    setStatus("已生成 content.js 备份", "success");
  }

  function bindEvents() {
    dom.selectFolderButton.addEventListener("click", pickFolder);
    dom.saveButton.addEventListener("click", saveSite);
    dom.downloadContentButton.addEventListener("click", downloadContent);

    dom.addMetricButton.addEventListener("click", () => {
      dom.metricsList.insertAdjacentHTML("beforeend", metricHtml({ value: "", label: "" }));
    });

    dom.addProjectButton.addEventListener("click", () => {
      const count = dom.projectsList.querySelectorAll("[data-project-card]").length;
      dom.projectsList.insertAdjacentHTML("beforeend", projectHtml(defaultProject(), count));
    });

    dom.addProcessButton.addEventListener("click", () => {
      dom.processList.insertAdjacentHTML("beforeend", processHtml({ title: "", text: "" }));
    });

    document.addEventListener("click", (event) => {
      const removeProject = event.target.closest("[data-remove-project]");
      if (removeProject) {
        removeProject.closest("[data-project-card]").remove();
        updateProjectHeadings();
        return;
      }

      const moveProject = event.target.closest("[data-move-project]");
      if (moveProject) {
        const card = moveProject.closest("[data-project-card]");
        const direction = moveProject.dataset.moveProject;
        if (direction === "up" && card.previousElementSibling) {
          dom.projectsList.insertBefore(card, card.previousElementSibling);
        }
        if (direction === "down" && card.nextElementSibling) {
          dom.projectsList.insertBefore(card.nextElementSibling, card);
        }
        updateProjectHeadings();
        return;
      }

      const removeItem = event.target.closest("[data-remove-item]");
      if (removeItem) {
        removeItem.closest("[data-metric-item], [data-process-item]").remove();
      }
    });

    document.addEventListener("input", (event) => {
      if (event.target.matches('[data-field="title"]')) {
        updateProjectHeadings();
      }
    });

    document.addEventListener("change", (event) => {
      if (event.target.matches('[data-file="heroImage"], [data-file="cover"]')) {
        previewImage(event.target);
      }
    });
  }

  function init() {
    renderProfile();
    renderSections();
    renderMetrics();
    renderProjects();
    renderProcess();
    bindEvents();
  }

  init();
})();
