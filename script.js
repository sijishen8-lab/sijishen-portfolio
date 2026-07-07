(function () {
  const data = window.PORTFOLIO_CONTENT;
  const storageKey = "adPortfolioImageOverrides";
  let activeFilter = "all";
  let activeProjectId = null;
  let lastFocusedElement = null;

  const dom = {
    brandName: document.getElementById("brandName"),
    heroEyebrow: document.getElementById("heroEyebrow"),
    heroTitle: document.getElementById("heroTitle"),
    heroIntro: document.getElementById("heroIntro"),
    heroImage: document.getElementById("heroImage"),
    overviewTitle: document.getElementById("overviewTitle"),
    workTitle: document.getElementById("workTitle"),
    workIntro: document.getElementById("workIntro"),
    processTitle: document.getElementById("processTitle"),
    aboutTitle: document.getElementById("aboutTitle"),
    aboutText: document.getElementById("aboutText"),
    contactTitle: document.getElementById("contactTitle"),
    profileRole: document.getElementById("profileRole"),
    profileLocation: document.getElementById("profileLocation"),
    profileAvailability: document.getElementById("profileAvailability"),
    metricRow: document.getElementById("metricRow"),
    heroWorkRail: document.getElementById("heroWorkRail"),
    filterBar: document.getElementById("filterBar"),
    portfolioGrid: document.getElementById("portfolioGrid"),
    processGrid: document.getElementById("processGrid"),
    focusList: document.getElementById("focusList"),
    emailLink: document.getElementById("emailLink"),
    editModeToggle: document.getElementById("editModeToggle"),
    modal: document.getElementById("projectModal"),
    modalPanel: document.querySelector(".modal-panel"),
    modalMedia: document.getElementById("modalMedia"),
    modalType: document.getElementById("modalType"),
    modalTitle: document.getElementById("modalTitle"),
    modalSummary: document.getElementById("modalSummary"),
    modalRole: document.getElementById("modalRole"),
    modalYear: document.getElementById("modalYear"),
    modalTags: document.getElementById("modalTags"),
    modalActions: document.getElementById("modalActions"),
    modalGallery: document.getElementById("modalGallery")
  };

  function getOverrides() {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || {};
    } catch (error) {
      return {};
    }
  }

  function saveOverrides(overrides) {
    localStorage.setItem(storageKey, JSON.stringify(overrides));
  }

  function resolveImage(slot, fallback) {
    const overrides = getOverrides();
    return overrides[slot] || fallback;
  }

  function slotForProject(project) {
    return `project:${project.id}:cover`;
  }

  function createTag(tag) {
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = tag;
    return span;
  }

  function renderProfile() {
    const profile = data.profile;
    document.title = `广告作品集 | ${profile.name}`;
    dom.brandName.textContent = profile.name;
    dom.heroIntro.textContent = profile.intro;
    dom.heroImage.src = resolveImage("hero", profile.heroImage);
    dom.heroImage.alt = profile.heroAlt;
    dom.profileRole.textContent = profile.role;
    dom.profileLocation.textContent = profile.location;
    dom.profileAvailability.textContent = profile.availability;
    dom.emailLink.href = `mailto:${profile.email}`;
    dom.emailLink.textContent = profile.email;
  }

  function renderSections() {
    const sections = data.sections || {};
    const profile = data.profile;
    dom.heroEyebrow.textContent = sections.heroEyebrow || "Advertising Portfolio · 2026";
    dom.heroTitle.textContent = sections.heroTitle || `${profile.name} · 广告作品集`;
    dom.overviewTitle.textContent =
      sections.overviewTitle || "文档、图片、视频，都放进同一套清晰的叙事里。";
    dom.workTitle.textContent = sections.workTitle || "作品";
    dom.workIntro.textContent =
      sections.workIntro ||
      "每个项目都保留封面、媒介类型、职责、过程文件和预览入口，适合面试前快速展示重点。";
    dom.processTitle.textContent = sections.processTitle || "从问题到表达";
    dom.aboutTitle.textContent = sections.aboutTitle || "我适合需要“想清楚，也做出来”的团队。";
    dom.aboutText.textContent =
      sections.aboutText ||
      "我习惯把策略文档、视觉稿、视频脚本和复盘材料放在同一条逻辑线上看：先理解人，再找到表达，最后让内容在合适的媒介里形成连续记忆。";
    dom.contactTitle.textContent = sections.contactTitle || "期待把下一个传播问题讲清楚。";
  }

  function renderMetrics() {
    dom.metricRow.innerHTML = "";
    data.metrics.forEach((metric) => {
      const item = document.createElement("div");
      item.className = "metric";
      item.innerHTML = `<strong>${metric.value}</strong><span>${metric.label}</span>`;
      dom.metricRow.appendChild(item);
    });
  }

  function renderHeroWorkRail() {
    dom.heroWorkRail.innerHTML = "";
    data.projects.slice(0, 3).forEach((project, index) => {
      const button = document.createElement("button");
      button.className = "hero-work-button";
      button.type = "button";
      button.dataset.openProject = project.id;
      button.textContent = `0${index + 1} ${project.typeLabel} · ${project.title}`;
      dom.heroWorkRail.appendChild(button);
    });
  }

  function renderFilters() {
    dom.filterBar.innerHTML = "";
    data.filters.forEach((filter) => {
      const button = document.createElement("button");
      button.className = "filter-button";
      button.type = "button";
      button.role = "tab";
      button.textContent = filter.label;
      button.dataset.filter = filter.key;
      button.setAttribute("aria-selected", String(filter.key === activeFilter));
      button.addEventListener("click", () => {
        activeFilter = filter.key;
        renderFilters();
        renderProjects();
      });
      dom.filterBar.appendChild(button);
    });
  }

  function renderProjects() {
    dom.portfolioGrid.innerHTML = "";
    const projects = data.projects.filter((project) => {
      return activeFilter === "all" || project.type === activeFilter;
    });

    projects.forEach((project, index) => {
      const article = document.createElement("article");
      article.className = `project-card ${index === 0 && activeFilter === "all" ? "featured" : ""}`;
      article.innerHTML = `
        <figure class="card-media">
          <img src="${resolveImage(slotForProject(project), project.cover)}" alt="${project.coverAlt}" />
          <div class="card-image-tools" data-image-tools>
            <label class="file-button light">
              换封面
              <input class="image-picker" type="file" accept="image/*" data-slot="${slotForProject(project)}" />
            </label>
            <button class="text-button light" type="button" data-reset-image="${slotForProject(project)}">恢复</button>
          </div>
        </figure>
        <div class="card-body">
          <div class="card-topline">
            <span>${project.typeLabel}</span>
            <span>${project.year}</span>
          </div>
          <h3>${project.title}</h3>
          <p>${project.summary}</p>
          <div class="tag-row"></div>
          <div class="card-footer">
            <span>${project.role}</span>
            <button class="open-project" type="button" data-open-project="${project.id}">查看</button>
          </div>
        </div>
      `;
      const tagRow = article.querySelector(".tag-row");
      project.tags.forEach((tag) => tagRow.appendChild(createTag(tag)));
      dom.portfolioGrid.appendChild(article);
    });
  }

  function renderProcess() {
    dom.processGrid.innerHTML = "";
    data.process.forEach((item, index) => {
      const block = document.createElement("article");
      block.className = "process-item";
      block.innerHTML = `
        <span>0${index + 1}</span>
        <h3>${item.title}</h3>
        <p>${item.text}</p>
      `;
      dom.processGrid.appendChild(block);
    });
  }

  function renderFocus() {
    dom.focusList.innerHTML = "";
    data.profile.focus.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "focus-item";
      row.innerHTML = `<span>${item}</span><span>0${index + 1}</span>`;
      dom.focusList.appendChild(row);
    });
  }

  function renderModalMedia(project) {
    const cover = resolveImage(slotForProject(project), project.cover);
    if (project.type === "video" && project.video) {
      dom.modalMedia.innerHTML = `
        <video controls poster="${cover}">
          <source src="${project.video}" type="video/mp4" />
        </video>
      `;
      return;
    }

    if (project.type === "video") {
      dom.modalMedia.innerHTML = `
        <div class="video-placeholder">
          <img src="${cover}" alt="${project.coverAlt}" />
          <div class="video-note">主片、预告与花絮素材位</div>
        </div>
      `;
      return;
    }

    dom.modalMedia.innerHTML = `<img src="${cover}" alt="${project.coverAlt}" />`;
  }

  function openProject(projectId) {
    const project = data.projects.find((item) => item.id === projectId);
    if (!project) return;
    activeProjectId = projectId;
    lastFocusedElement = document.activeElement;

    renderModalMedia(project);
    dom.modalType.textContent = project.typeLabel;
    dom.modalTitle.textContent = project.title;
    dom.modalSummary.textContent = project.summary;
    dom.modalRole.textContent = project.role;
    dom.modalYear.textContent = project.year;

    dom.modalTags.innerHTML = "";
    project.tags.forEach((tag) => dom.modalTags.appendChild(createTag(tag)));

    dom.modalActions.innerHTML = "";
    if (project.document) {
      const docLink = document.createElement("a");
      docLink.className = "primary-link dark";
      docLink.href = project.document;
      docLink.target = "_blank";
      docLink.rel = "noreferrer";
      docLink.textContent = "打开文档";
      dom.modalActions.appendChild(docLink);
    }
    if (project.video) {
      const videoLink = document.createElement("a");
      videoLink.className = "secondary-link dark";
      videoLink.href = project.video;
      videoLink.target = "_blank";
      videoLink.rel = "noreferrer";
      videoLink.textContent = "打开视频";
      dom.modalActions.appendChild(videoLink);
    }

    dom.modalGallery.innerHTML = "";
    project.gallery.forEach((image, index) => {
      const img = document.createElement("img");
      img.src = index === 0 ? resolveImage(slotForProject(project), image) : image;
      img.alt = `${project.title} 图 ${index + 1}`;
      dom.modalGallery.appendChild(img);
    });

    dom.modal.hidden = false;
    document.body.classList.add("modal-open");
    dom.modalPanel.focus();
  }

  function closeProject() {
    dom.modal.hidden = true;
    document.body.classList.remove("modal-open");
    activeProjectId = null;
    if (lastFocusedElement) lastFocusedElement.focus();
  }

  function handleImageInput(input) {
    const file = input.files && input.files[0];
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      const overrides = getOverrides();
      overrides[input.dataset.slot] = reader.result;
      saveOverrides(overrides);
      renderProfile();
      renderProjects();
      if (activeProjectId) openProject(activeProjectId);
    };
    reader.readAsDataURL(file);
  }

  function resetImage(slot) {
    const overrides = getOverrides();
    delete overrides[slot];
    saveOverrides(overrides);
    renderProfile();
    renderProjects();
    if (activeProjectId) openProject(activeProjectId);
  }

  function bindEvents() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (event) => {
        const targetId = link.getAttribute("href");
        if (!targetId || targetId === "#") return;
        const target = document.querySelector(targetId);
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        history.pushState(null, "", targetId);
      });
    });

    dom.editModeToggle.addEventListener("click", () => {
      const editing = !document.body.classList.contains("is-editing");
      document.body.classList.toggle("is-editing", editing);
      dom.editModeToggle.setAttribute("aria-pressed", String(editing));
      dom.editModeToggle.textContent = editing ? "完成换图" : "换图模式";
    });

    document.addEventListener("click", (event) => {
      const openButton = event.target.closest("[data-open-project]");
      if (openButton) {
        openProject(openButton.dataset.openProject);
        return;
      }

      if (event.target.closest("[data-close-modal]")) {
        closeProject();
        return;
      }

      const resetButton = event.target.closest("[data-reset-image]");
      if (resetButton) {
        resetImage(resetButton.dataset.resetImage);
      }
    });

    document.addEventListener("change", (event) => {
      if (event.target.matches(".image-picker")) {
        handleImageInput(event.target);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !dom.modal.hidden) {
        closeProject();
      }
    });
  }

  function init() {
    renderProfile();
    renderSections();
    renderMetrics();
    renderHeroWorkRail();
    renderFilters();
    renderProjects();
    renderProcess();
    renderFocus();
    bindEvents();
  }

  init();
})();
