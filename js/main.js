/* ==========================================================================
   东阳茂盛塑胶有限公司 - 网站公共交互脚本（原生 JavaScript）
   功能：多语言切换、移动端导航、Hero 轮播、回到顶部、滚动动画、
        产品筛选、灯箱、表单校验、统计数字动画
   ========================================================================== */
(function () {
    "use strict";

    /* ---------- 工具函数 ---------- */
    function $(selector, ctx) {
        return (ctx || document).querySelector(selector);
    }
    function $all(selector, ctx) {
        return Array.prototype.slice.call((ctx || document).querySelectorAll(selector));
    }

    /* 保存当前语言，供表单等模块复用 */
    var CURRENT_LANG = null;

    /* ======================================================================
       1. 移动端导航开关
       ====================================================================== */
    function initNav() {
        var toggle = $(".nav-toggle");
        var nav = $("#mainNav");
        var overlay = $(".nav-overlay");
        if (!toggle || !nav) return;

        function open() {
            nav.classList.add("open");
            toggle.classList.add("active");
            if (overlay) overlay.classList.add("show");
            document.body.style.overflow = "hidden";
        }
        function close() {
            nav.classList.remove("open");
            toggle.classList.remove("active");
            if (overlay) overlay.classList.remove("show");
            document.body.style.overflow = "";
        }

        toggle.addEventListener("click", function () {
            nav.classList.contains("open") ? close() : open();
        });
        if (overlay) overlay.addEventListener("click", close);

        // 点击导航项后关闭（移动端）
        $all(".nav__link", nav).forEach(function (link) {
            link.addEventListener("click", function () {
                if (window.innerWidth <= 992) close();
            });
        });

        // ESC 关闭
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") close();
        });
    }

    /* ======================================================================
       2. Hero 轮播
       ====================================================================== */
    function initHeroSlider() {
        var slider = $(".hero__slider");
        if (!slider) return;
        var slides = $all(".hero__slide", slider);
        var dots = $all(".hero__dot");
        if (slides.length === 0) return;

        var current = 0;
        var timer = null;
        var INTERVAL = 5500;

        function goTo(index) {
            slides[current].classList.remove("active");
            if (dots[current]) dots[current].classList.remove("active");
            current = (index + slides.length) % slides.length;
            slides[current].classList.add("active");
            if (dots[current]) dots[current].classList.add("active");
        }
        function next() { goTo(current + 1); }
        function start() { timer = setInterval(next, INTERVAL); }
        function stop() { if (timer) clearInterval(timer); }

        dots.forEach(function (dot, i) {
            dot.addEventListener("click", function () {
                goTo(i);
                stop();
                start();
            });
        });

        // 鼠标悬停暂停
        slider.addEventListener("mouseenter", stop);
        slider.addEventListener("mouseleave", start);

        // 可见性切换时暂停（节省资源）
        document.addEventListener("visibilitychange", function () {
            document.hidden ? stop() : start();
        });

        start();
    }

    /* ======================================================================
       3. 回到顶部按钮
       ====================================================================== */
    function initBackToTop() {
        var btn = $(".back-to-top");
        if (!btn) return;
        window.addEventListener("scroll", function () {
            if (window.pageYOffset > 400) {
                btn.classList.add("show");
            } else {
                btn.classList.remove("show");
            }
        }, { passive: true });
        btn.addEventListener("click", function () {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    /* ======================================================================
       4. 滚动入场动画 (IntersectionObserver)
       ====================================================================== */
    function initReveal() {
        var items = $all(".reveal");
        if (items.length === 0) return;

        if (!("IntersectionObserver" in window)) {
            items.forEach(function (el) { el.classList.add("visible"); });
            return;
        }
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: "0px 0px -50px 0px" });

        items.forEach(function (el) { observer.observe(el); });
    }

    /* ======================================================================
       5. 统计数字滚动动画
       ====================================================================== */
    function initCountUp() {
        var nums = $all("[data-count]");
        if (nums.length === 0) return;

        function animate(el) {
            var target = parseFloat(el.getAttribute("data-count"));
            var duration = 1800;
            var start = 0;
            var startTime = null;

            function step(ts) {
                if (!startTime) startTime = ts;
                var progress = Math.min((ts - startTime) / duration, 1);
                // easeOutQuart
                var eased = 1 - Math.pow(1 - progress, 4);
                var value = start + (target - start) * eased;
                el.textContent = target % 1 !== 0
                    ? value.toFixed(1)
                    : Math.floor(value).toLocaleString();
                if (progress < 1) requestAnimationFrame(step);
                else el.textContent = target.toLocaleString();
            }
            requestAnimationFrame(step);
        }

        if (!("IntersectionObserver" in window)) {
            nums.forEach(animate);
            return;
        }
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    animate(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        nums.forEach(function (el) { observer.observe(el); });
    }

    /* ======================================================================
       6. 产品分类筛选（产品页）
       ====================================================================== */
    function initProductFilter() {
        var tabs = $all(".category-tab");
        var cards = $all("[data-category]");
        if (tabs.length === 0 || cards.length === 0) return;

        function applyFilter(filter) {
            tabs.forEach(function (t) {
                t.classList.toggle("active", t.getAttribute("data-filter") === filter);
            });

            cards.forEach(function (card) {
                var cat = card.getAttribute("data-category");
                if (filter === "all" || cat === filter) {
                    card.style.display = "";
                    // 重新触发动画
                    card.classList.remove("visible");
                    requestAnimationFrame(function () {
                        card.classList.add("visible");
                    });
                } else {
                    card.style.display = "none";
                }
            });
        }

        tabs.forEach(function (tab) {
            tab.addEventListener("click", function () {
                applyFilter(tab.getAttribute("data-filter"));
            });
        });

        /* 支持 URL 参数定位筛选（内链锚定）：products.html?filter=click */
        var param = new URLSearchParams(window.location.search).get("filter");
        if (param && tabs.some(function (t) { return t.getAttribute("data-filter") === param; })) {
            applyFilter(param);
        }
    }

    /* ======================================================================
       7. 图片灯箱
       ====================================================================== */
    function initLightbox() {
        var triggers = $all("[data-lightbox]");
        if (triggers.length === 0) return;

        // 创建灯箱 DOM
        var lb = document.createElement("div");
        lb.className = "lightbox";
        lb.innerHTML =
            '<button class="lightbox__close" aria-label="关闭">&times;</button>' +
            '<img src="" alt="放大图片">';
        document.body.appendChild(lb);
        var lbImg = $("img", lb);

        function open(src, alt) {
            lbImg.src = src;
            lbImg.alt = alt || "";
            lb.classList.add("show");
            document.body.style.overflow = "hidden";
        }
        function close() {
            lb.classList.remove("show");
            document.body.style.overflow = "";
        }

        triggers.forEach(function (el) {
            el.addEventListener("click", function (e) {
                e.preventDefault();
                var img = el.querySelector("img") || el;
                open(img.getAttribute("data-full") || img.src, img.alt);
            });
        });

        $(".lightbox__close", lb).addEventListener("click", close);
        lb.addEventListener("click", function (e) {
            if (e.target === lb) close();
        });
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && lb.classList.contains("show")) close();
        });
    }

    /* ======================================================================
       8. 联系表单校验（前端模拟提交）
       ====================================================================== */
    function initContactForm() {
        var form = $("#contactForm");
        if (!form) return;
        var success = $(".form-success", form);

        form.addEventListener("submit", function (e) {
            e.preventDefault();
            var valid = true;
            var required = $all("[required]", form);

            required.forEach(function (field) {
                var value = (field.value || "").trim();
                var err = false;

                if (!value) {
                    err = true;
                } else if (field.type === "email") {
                    var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!re.test(value)) err = true;
                } else if (field.type === "tel") {
                    if (value.replace(/\D/g, "").length < 6) err = true;
                }

                if (err) {
                    valid = false;
                    field.style.borderColor = "#c0392b";
                    field.style.background = "#fdf3f1";
                } else {
                    field.style.borderColor = "";
                    field.style.background = "";
                }
            });

            if (!valid) {
                return;
            }

            // 模拟提交（实际部署请替换为后端接口）
            var btn = $("button[type=submit]", form);
            var submitText = (window.I18N && CURRENT_LANG)
                ? I18N.t(CURRENT_LANG, "contact.form.submit")
                : (btn ? btn.getAttribute("data-text") : "") || "提交信息";
            var submittingText = (window.I18N && CURRENT_LANG)
                ? I18N.t(CURRENT_LANG, "contact.form.submitting")
                : "正在发送...";
            if (btn) {
                btn.textContent = submittingText;
                btn.disabled = true;
            }
            setTimeout(function () {
                if (success) {
                    success.classList.add("show");
                    success.scrollIntoView({ behavior: "smooth", block: "center" });
                }
                form.reset();
                if (btn) {
                    btn.textContent = submitText;
                    btn.disabled = false;
                }
                setTimeout(function () {
                    if (success) success.classList.remove("show");
                }, 6000);
            }, 900);
        });

        // 输入时清除错误样式
        $all("input, textarea, select", form).forEach(function (field) {
            field.addEventListener("input", function () {
                field.style.borderColor = "";
                field.style.background = "";
            });
        });
    }

    /* ======================================================================
       9. 头部滚动效果（缩小阴影）
       ====================================================================== */
    function initHeaderScroll() {
        var header = $(".header");
        if (!header) return;
        var lastScroll = 0;
        window.addEventListener("scroll", function () {
            var cur = window.pageYOffset;
            if (cur > 10) {
                header.style.boxShadow = "0 4px 20px rgba(28, 43, 51, 0.10)";
            } else {
                header.style.boxShadow = "var(--shadow-sm)";
            }
            lastScroll = cur;
        }, { passive: true });
    }

    /* ======================================================================
       10. 多语言（i18n）：语言检测 / 应用 / 切换 / RTL
       ====================================================================== */
    var LANG_STORAGE_KEY = "ms_lang";

    /* 根据浏览器语言自动匹配站点语言 */
    function detectLang() {
        if (!window.I18N) return "zh";

        /* 1) 用户手动选择过的语言（持久化） */
        try {
            var saved = localStorage.getItem(LANG_STORAGE_KEY);
            if (saved && I18N.has(saved)) return saved;
        } catch (e) {}

        /* 2) 浏览器语言 */
        var navLangs = [];
        if (navigator.languages && navigator.languages.length) {
            navLangs = navigator.languages.slice();
        } else if (navigator.language) {
            navLangs.push(navigator.language);
        } else if (navigator.userLanguage) {
            navLangs.push(navigator.userLanguage);
        }

        for (var i = 0; i < navLangs.length; i++) {
            var lang = (navLangs[i] || "").toLowerCase();
            if (!lang) continue;
            /* 完整匹配 zh-CN / pt-BR 等 */
            if (I18N.langMap[lang]) return I18N.langMap[lang];
            /* 主语言子标签 zh / pt / ar 等 */
            var primary = lang.split("-")[0];
            if (I18N.langMap[primary]) return I18N.langMap[primary];
        }

        /* 3) 兜底：默认语言 */
        return I18N.defaultLang;
    }

    /* 取得某语言的显示名称与书写方向 */
    function getLangMeta(code) {
        for (var i = 0; i < I18N.langs.length; i++) {
            if (I18N.langs[i].code === code) return I18N.langs[i];
        }
        return { code: code, name: code, english: code, dir: "ltr" };
    }

    /* 应用某种语言到当前页面（核心渲染逻辑） */
    function applyLang(lang) {
        if (!window.I18N) return;
        if (!I18N.has(lang)) lang = I18N.defaultLang;
        CURRENT_LANG = lang;
        var meta = getLangMeta(lang);

        /* 设置 <html lang> 与 <html dir>（RTL 支持） */
        document.documentElement.lang = lang;
        document.documentElement.dir = meta.dir;
        document.body.setAttribute("data-lang", lang);

        /* 文本内容（textContent） */
        $all("[data-i18n]").forEach(function (el) {
            var key = el.getAttribute("data-i18n");
            if (key) el.textContent = I18N.t(lang, key);
        });

        /* 富文本（innerHTML，允许简单内联标签如 <br>） */
        $all("[data-i18n-html]").forEach(function (el) {
            var key = el.getAttribute("data-i18n-html");
            if (key) el.innerHTML = I18N.t(lang, key);
        });

        /* 输入框 placeholder */
        $all("[data-i18n-ph]").forEach(function (el) {
            var key = el.getAttribute("data-i18n-ph");
            if (key) el.setAttribute("placeholder", I18N.t(lang, key));
        });

        /* 任意属性，格式：data-i18n-attr="alt:key1|title:key2" */
        $all("[data-i18n-attr]").forEach(function (el) {
            var spec = el.getAttribute("data-i18n-attr");
            if (!spec) return;
            spec.split("|").forEach(function (pair) {
                var idx = pair.indexOf(":");
                if (idx > 0) {
                    var attrName = pair.slice(0, idx).trim();
                    var key = pair.slice(idx + 1).trim();
                    if (attrName && key) el.setAttribute(attrName, I18N.t(lang, key));
                }
            });
        });

        /* 文档标题 <title> */
        var titleEl = document.querySelector("[data-i18n-title]");
        if (titleEl) {
            var titleKey = titleEl.getAttribute("data-i18n-title");
            if (titleKey) document.title = I18N.t(lang, titleKey);
        }

        /* meta description */
        var descEl = document.querySelector('meta[name="description"][data-i18n-desc]');
        if (descEl) {
            var descKey = descEl.getAttribute("data-i18n-desc");
            if (descKey) descEl.setAttribute("content", I18N.t(lang, descKey));
        }

        /* 更新语言切换器当前标签（可能同时存在多个切换器） */
        $all(".lang-switch__current").forEach(function (cur) {
            cur.textContent = meta.name;
        });
        $all(".lang-switch__code-cur").forEach(function (curCode) {
            curCode.textContent = meta.code.toUpperCase();
        });

        /* 高亮当前选项 */
        $all(".lang-switch__option").forEach(function (opt) {
            if (opt.getAttribute("data-lang") === lang) opt.classList.add("active");
            else opt.classList.remove("active");
        });

        /* 关闭所有下拉 */
        $all(".lang-switch.open").forEach(function (sw) {
            sw.classList.remove("open");
            var b = $(".lang-switch__btn", sw);
            if (b) b.setAttribute("aria-expanded", "false");
        });

        /* 持久化保存用户选择 */
        try { localStorage.setItem(LANG_STORAGE_KEY, lang); } catch (e) {}

        /* 通知其他模块（如表单按钮文案） */
        if (typeof CustomEvent === "function") {
            document.dispatchEvent(new CustomEvent("languagechange", { detail: { lang: lang } }));
        }
    }

    /* 构建语言切换器下拉菜单（支持页面上存在多个切换器） */
    function buildLangSwitcher() {
        if (!window.I18N) return;
        var switches = $all(".lang-switch");
        if (switches.length === 0) return;

        switches.forEach(function (sw) {
            if (sw.getAttribute("data-built") === "1") return;
            sw.setAttribute("data-built", "1");

            var list = $(".lang-switch__list", sw);
            var btn = $(".lang-switch__btn", sw);
            if (!list || !btn) return;

            /* 清空并生成选项 */
            list.innerHTML = "";
            I18N.langs.forEach(function (lng) {
                var li = document.createElement("li");
                li.className = "lang-switch__option";
                li.setAttribute("role", "menuitem");
                li.setAttribute("data-lang", lng.code);
                li.innerHTML =
                    '<span class="lang-switch__code">' + lng.code.toUpperCase() + '</span>' +
                    '<span class="lang-switch__name">' + lng.name + '</span>' +
                    '<span class="lang-switch__en">' + lng.english + '</span>';
                li.addEventListener("click", function () {
                    applyLang(lng.code);
                });
                list.appendChild(li);
            });

            /* 切换下拉显隐 */
            btn.addEventListener("click", function (e) {
                e.stopPropagation();
                /* 先关闭其他打开的切换器 */
                $all(".lang-switch.open").forEach(function (other) {
                    if (other !== sw) {
                        other.classList.remove("open");
                        var b = $(".lang-switch__btn", other);
                        if (b) b.setAttribute("aria-expanded", "false");
                    }
                });
                var opened = sw.classList.toggle("open");
                btn.setAttribute("aria-expanded", opened ? "true" : "false");
            });
        });

        /* 点击外部关闭所有切换器 */
        document.addEventListener("click", function (e) {
            switches.forEach(function (sw) {
                if (!sw.contains(e.target)) {
                    sw.classList.remove("open");
                    var b = $(".lang-switch__btn", sw);
                    if (b) b.setAttribute("aria-expanded", "false");
                }
            });
        });

        /* ESC 关闭所有切换器 */
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") {
                switches.forEach(function (sw) {
                    sw.classList.remove("open");
                    var b = $(".lang-switch__btn", sw);
                    if (b) b.setAttribute("aria-expanded", "false");
                });
            }
        });
    }

    /* i18n 总入口：必须最先执行 */
    function initI18N() {
        if (!window.I18N) return;
        buildLangSwitcher();
        var initialLang = detectLang();
        applyLang(initialLang);
        /* 暴露调试接口 */
        window.MS_I18N = {
            get current() { return CURRENT_LANG; },
            apply: applyLang,
            detect: detectLang
        };
    }

    /* ======================================================================
       11. 自定义报价配置器（仅 quote.html 生效）
       ====================================================================== */

    /* 三种地板的层配置数据：所有文本通过 i18n key 动态获取 */
    var QUOTE_CONFIG = {
        spc: {
            nameKey: "quote.tab.spc",
            layers: [
                {
                    key: "uvCoating", nameKey: "quote.layer.uvCoating", type: "radio",
                    options: [
                        { value: "matte",     labelKey: "quote.opt.matte" },
                        { value: "semiMatte", labelKey: "quote.opt.semiMatte" },
                        { value: "glossy",    labelKey: "quote.opt.glossy" },
                        { value: "crystal",   labelKey: "quote.opt.crystal" }
                    ],
                    defaultValue: "semiMatte"
                },
                {
                    key: "wearLayer", nameKey: "quote.layer.wearLayer", type: "radio",
                    options: [
                        { value: "0.07mm", labelKey: "quote.opt.wl.0.07" },
                        { value: "0.1mm",  labelKey: "quote.opt.wl.0.1" },
                        { value: "0.2mm",  labelKey: "quote.opt.wl.0.2" },
                        { value: "0.3mm",  labelKey: "quote.opt.wl.0.3" },
                        { value: "0.5mm",  labelKey: "quote.opt.wl.0.5" },
                        { value: "0.55mm", labelKey: "quote.opt.wl.0.55" },
                        { value: "0.7mm",  labelKey: "quote.opt.wl.0.7" }
                    ],
                    defaultValue: "0.3mm"
                },
                {
                    key: "decoPaper", nameKey: "quote.layer.decoPaper", type: "radio",
                    options: [
                        { value: "woodGrain",   labelKey: "quote.opt.woodGrain" },
                        { value: "stoneGrain",  labelKey: "quote.opt.stoneGrain" },
                        { value: "concrete",    labelKey: "quote.opt.concrete" },
                        { value: "carpet",      labelKey: "quote.opt.carpet" },
                        { value: "herringbone", labelKey: "quote.opt.herringbone" },
                        { value: "chevron",     labelKey: "quote.opt.chevron" }
                    ],
                    defaultValue: "woodGrain"
                },
                {
                    key: "spcCore", nameKey: "quote.layer.spcCore", type: "group",
                    subItems: [
                        {
                            key: "thickness", nameKey: "quote.layer.spcCore.thickness", type: "radio",
                            options: [
                                { value: "3.5mm", labelKey: "quote.opt.thk.3.5" },
                                { value: "4.0mm", labelKey: "quote.opt.thk.4.0" },
                                { value: "4.5mm", labelKey: "quote.opt.thk.4.5" },
                                { value: "5.0mm", labelKey: "quote.opt.thk.5.0" },
                                { value: "5.5mm", labelKey: "quote.opt.thk.5.5" },
                                { value: "6.0mm", labelKey: "quote.opt.thk.6.0" },
                                { value: "7.0mm", labelKey: "quote.opt.thk.7.0" },
                                { value: "8.0mm", labelKey: "quote.opt.thk.8.0" }
                            ],
                            defaultValue: "5.0mm"
                        },
                        {
                            key: "density", nameKey: "quote.layer.spcCore.density", type: "radio",
                            options: [
                                { value: "1900", labelKey: "quote.opt.den.1900" },
                                { value: "2000", labelKey: "quote.opt.den.2000" },
                                { value: "2100", labelKey: "quote.opt.den.2100" },
                                { value: "2200", labelKey: "quote.opt.den.2200" }
                            ],
                            defaultValue: "2000"
                        }
                    ]
                }
            ]
        },
        lvt: {
            nameKey: "quote.tab.lvt",
            layers: [
                {
                    key: "uvCoating", nameKey: "quote.layer.uvCoating", type: "radio",
                    options: [
                        { value: "matte",     labelKey: "quote.opt.matte" },
                        { value: "semiMatte", labelKey: "quote.opt.semiMatte" },
                        { value: "glossy",    labelKey: "quote.opt.glossy" }
                    ],
                    defaultValue: "semiMatte"
                },
                {
                    key: "wearLayer", nameKey: "quote.layer.wearLayer", type: "radio",
                    options: [
                        { value: "0.1mm",  labelKey: "quote.opt.wl.0.1" },
                        { value: "0.2mm",  labelKey: "quote.opt.wl.0.2" },
                        { value: "0.3mm",  labelKey: "quote.opt.wl.0.3" },
                        { value: "0.5mm",  labelKey: "quote.opt.wl.0.5" },
                        { value: "0.55mm", labelKey: "quote.opt.wl.0.55" },
                        { value: "0.7mm",  labelKey: "quote.opt.wl.0.7" },
                        { value: "1.0mm",  labelKey: "quote.opt.wl.1.0" }
                    ],
                    defaultValue: "0.3mm"
                },
                {
                    key: "decoPaper", nameKey: "quote.layer.decoPaper", type: "radio",
                    options: [
                        { value: "woodGrain",   labelKey: "quote.opt.woodGrain" },
                        { value: "stoneGrain",  labelKey: "quote.opt.stoneGrain" },
                        { value: "concrete",    labelKey: "quote.opt.concrete" },
                        { value: "carpet",      labelKey: "quote.opt.carpet" },
                        { value: "herringbone", labelKey: "quote.opt.herringbone" },
                        { value: "chevron",     labelKey: "quote.opt.chevron" }
                    ],
                    defaultValue: "woodGrain"
                },
                {
                    key: "middleLayer", nameKey: "quote.layer.middleLayer", type: "radio",
                    options: [
                        { value: "1.0mm", labelKey: "quote.opt.ml.1.0" },
                        { value: "2.0mm", labelKey: "quote.opt.ml.2.0" },
                        { value: "3.0mm", labelKey: "quote.opt.ml.3.0" }
                    ],
                    defaultValue: "2.0mm"
                },
                {
                    key: "glassFiber", nameKey: "quote.layer.glassFiber", type: "radio",
                    options: [
                        { value: "single40",  labelKey: "quote.opt.gf.single40" },
                        { value: "single100", labelKey: "quote.opt.gf.single100" },
                        { value: "single120", labelKey: "quote.opt.gf.single120" },
                        { value: "dual100",   labelKey: "quote.opt.gf.dual100" }
                    ],
                    defaultValue: "single100"
                },
                {
                    key: "baseLayer", nameKey: "quote.layer.baseLayer", type: "radio",
                    options: [
                        { value: "dryback",  labelKey: "quote.opt.base.dryback" },
                        { value: "looselay", labelKey: "quote.opt.base.looselay" },
                        { value: "ixpe15",   labelKey: "quote.opt.base.ixpe15" },
                        { value: "eva15",    labelKey: "quote.opt.base.eva15" },
                        { value: "cork15",   labelKey: "quote.opt.base.cork15" }
                    ],
                    defaultValue: "dryback"
                }
            ]
        },
        selfad: {
            /* 自粘背胶地板（Self-adhesive）：撕膜即贴，背胶层为核心差异层 */
            nameKey: "quote.tab.selfad",
            layers: [
                {
                    key: "uvCoating", nameKey: "quote.layer.uvCoating", type: "radio",
                    options: [
                        { value: "matte",     labelKey: "quote.opt.matte" },
                        { value: "semiMatte", labelKey: "quote.opt.semiMatte" },
                        { value: "glossy",    labelKey: "quote.opt.glossy" }
                    ],
                    defaultValue: "semiMatte"
                },
                {
                    key: "wearLayer", nameKey: "quote.layer.wearLayer", type: "radio",
                    options: [
                        { value: "0.07mm", labelKey: "quote.opt.wl.0.07" },
                        { value: "0.1mm",  labelKey: "quote.opt.wl.0.1" },
                        { value: "0.2mm",  labelKey: "quote.opt.wl.0.2" },
                        { value: "0.3mm",  labelKey: "quote.opt.wl.0.3" }
                    ],
                    defaultValue: "0.2mm"
                },
                {
                    key: "decoPaper", nameKey: "quote.layer.decoPaper", type: "radio",
                    options: [
                        { value: "woodGrain",   labelKey: "quote.opt.woodGrain" },
                        { value: "stoneGrain",  labelKey: "quote.opt.stoneGrain" },
                        { value: "concrete",    labelKey: "quote.opt.concrete" },
                        { value: "carpet",      labelKey: "quote.opt.carpet" },
                        { value: "herringbone", labelKey: "quote.opt.herringbone" },
                        { value: "chevron",     labelKey: "quote.opt.chevron" }
                    ],
                    defaultValue: "woodGrain"
                },
                {
                    key: "middleLayer", nameKey: "quote.layer.middleLayer", type: "radio",
                    options: [
                        { value: "1.0mm", labelKey: "quote.opt.ml.1.0" },
                        { value: "2.0mm", labelKey: "quote.opt.ml.2.0" },
                        { value: "3.0mm", labelKey: "quote.opt.ml.3.0" }
                    ],
                    defaultValue: "2.0mm"
                },
                {
                    key: "backingLayer", nameKey: "quote.layer.backingLayer", type: "radio",
                    options: [
                        { value: "standard",   labelKey: "quote.opt.bk.standard" },
                        { value: "reinforced", labelKey: "quote.opt.bk.reinforced" },
                        { value: "removable", labelKey: "quote.opt.bk.removable" }
                    ],
                    defaultValue: "standard"
                }
            ]
        },
        looselay: {
            /* 免胶平铺地板（Loose Lay）：重力自稳+防滑底背，无需胶粘与锁扣 */
            nameKey: "quote.tab.looselay",
            layers: [
                {
                    key: "uvCoating", nameKey: "quote.layer.uvCoating", type: "radio",
                    options: [
                        { value: "matte",     labelKey: "quote.opt.matte" },
                        { value: "semiMatte", labelKey: "quote.opt.semiMatte" },
                        { value: "glossy",    labelKey: "quote.opt.glossy" }
                    ],
                    defaultValue: "semiMatte"
                },
                {
                    key: "wearLayer", nameKey: "quote.layer.wearLayer", type: "radio",
                    options: [
                        { value: "0.2mm",  labelKey: "quote.opt.wl.0.2" },
                        { value: "0.3mm",  labelKey: "quote.opt.wl.0.3" },
                        { value: "0.5mm",  labelKey: "quote.opt.wl.0.5" },
                        { value: "0.55mm", labelKey: "quote.opt.wl.0.55" },
                        { value: "0.7mm",  labelKey: "quote.opt.wl.0.7" }
                    ],
                    defaultValue: "0.3mm"
                },
                {
                    key: "decoPaper", nameKey: "quote.layer.decoPaper", type: "radio",
                    options: [
                        { value: "woodGrain",   labelKey: "quote.opt.woodGrain" },
                        { value: "stoneGrain",  labelKey: "quote.opt.stoneGrain" },
                        { value: "concrete",    labelKey: "quote.opt.concrete" },
                        { value: "carpet",      labelKey: "quote.opt.carpet" },
                        { value: "herringbone", labelKey: "quote.opt.herringbone" },
                        { value: "chevron",     labelKey: "quote.opt.chevron" }
                    ],
                    defaultValue: "woodGrain"
                },
                {
                    key: "glassFiber", nameKey: "quote.layer.glassFiber", type: "radio",
                    options: [
                        { value: "single40",  labelKey: "quote.opt.gf.single40" },
                        { value: "single100", labelKey: "quote.opt.gf.single100" },
                        { value: "single120", labelKey: "quote.opt.gf.single120" },
                        { value: "dual100",   labelKey: "quote.opt.gf.dual100" }
                    ],
                    defaultValue: "single100"
                },
                {
                    key: "coreLayer", nameKey: "quote.layer.coreLayer", type: "radio",
                    options: [
                        { value: "3.5mm", labelKey: "quote.opt.thk.3.5" },
                        { value: "4.0mm", labelKey: "quote.opt.thk.4.0" },
                        { value: "4.5mm", labelKey: "quote.opt.thk.4.5" },
                        { value: "5.0mm", labelKey: "quote.opt.thk.5.0" }
                    ],
                    defaultValue: "4.0mm"
                },
                {
                    key: "slipBack", nameKey: "quote.layer.slipBack", type: "radio",
                    options: [
                        { value: "standard", labelKey: "quote.opt.sb.standard" },
                        { value: "ixpe",     labelKey: "quote.opt.sb.ixpe" },
                        { value: "cork",     labelKey: "quote.opt.sb.cork" }
                    ],
                    defaultValue: "standard"
                }
            ]
        }
    };

    /* 通用附加配置项（四种地板共通；exclude 指定不适用的地板类型） */
    var QUOTE_COMMON = [
        {
            key: "size", nameKey: "quote.common.size",
            options: [
                { value: "152x914",  labelKey: "quote.opt.size.152x914" },
                { value: "178x1220", labelKey: "quote.opt.size.178x1220" },
                { value: "180x1220", labelKey: "quote.opt.size.180x1220" },
                { value: "228x1220", labelKey: "quote.opt.size.228x1220" },
                { value: "228x1520", labelKey: "quote.opt.size.228x1520" },
                { value: "6x36",     labelKey: "quote.opt.size.6x36" },
                { value: "7x48",     labelKey: "quote.opt.size.7x48" },
                { value: "9x60",     labelKey: "quote.opt.size.9x60" }
            ],
            defaultValue: "178x1220"
        },
        {
            key: "surface", nameKey: "quote.common.surface",
            options: [
                { value: "eir",          labelKey: "quote.opt.surface.eir" },
                { value: "deepEmbossed", labelKey: "quote.opt.surface.deep" },
                { value: "crystal",      labelKey: "quote.opt.surface.crystal" },
                { value: "smooth",       labelKey: "quote.opt.surface.smooth" },
                { value: "handScraped",  labelKey: "quote.opt.surface.hand" },
                { value: "wireBrushed",  labelKey: "quote.opt.surface.wire" }
            ],
            defaultValue: "eir"
        },
        {
            key: "bevel", nameKey: "quote.common.bevel",
            options: [
                { value: "square",  labelKey: "quote.opt.bevel.square" },
                { value: "micro",   labelKey: "quote.opt.bevel.micro" },
                { value: "painted", labelKey: "quote.opt.bevel.painted" },
                { value: "vgroove", labelKey: "quote.opt.bevel.vgroove" }
            ],
            defaultValue: "micro"
        },
        {
            key: "click", nameKey: "quote.common.click",
            exclude: ["selfad", "looselay"],   /* 自粘背胶/免胶平铺无需锁扣系统 */
            options: [
                { value: "unilin",     labelKey: "quote.opt.click.unilin" },
                { value: "valinge2g",  labelKey: "quote.opt.click.valinge2g" },
                { value: "valinge5g",  labelKey: "quote.opt.click.valinge5g" },
                { value: "valinge5gi", labelKey: "quote.opt.click.valinge5gi" },
                { value: "i4f",        labelKey: "quote.opt.click.i4f" }
            ],
            defaultValue: "valinge5g"
        },
        {
            key: "package", nameKey: "quote.common.package",
            options: [
                { value: "1.46", labelKey: "quote.opt.pkg.1.46" },
                { value: "1.63", labelKey: "quote.opt.pkg.1.63" },
                { value: "2.19", labelKey: "quote.opt.pkg.2.19" },
                { value: "2.97", labelKey: "quote.opt.pkg.2.97" }
            ],
            defaultValue: "2.19"
        }
    ];

    /* ======================================================================
       价格数据库（USD/m²，FOB 中国港口）
       数据来源（2025-2026 市场调研）：
       1) 中国海关 HS 3918.10 PVC 地板出口数据（出口均价锚点）
       2) Made-in-China / Alibaba 主要工厂挂牌价（海口 Shineday、山东
          FloorCasa/Emosin/Home Top、浙江 Dingcheng、常州 Lexuan 等）
       3) FloorCasa《SPC Flooring Price 2026》、Floren 耐磨层成本实测等
          行业价格指南
       估算口径：基准价 + 各配置项价格增量；建议每季度校准一次。
       ====================================================================== */
    var USD_CNY_RATE = 6.78;   /* 美元兑人民币汇率（2026-08，请定期更新） */

    /* 基准配置价格（美元/平方米，FOB）：
       SPC：4.0mm 基材 / 0.2mm 耐磨层 / 半哑光 UV / 木纹 / 密度 2000
       LVT：2.0mm 中层 / 0.3mm 耐磨层 / 半哑光 UV / 木纹 / 单层100玻纤 / PVC 干背
       自粘背胶：2.0mm 中层 / 0.2mm 耐磨层 / 半哑光 UV / 木纹 / 标准自粘胶
       免胶平铺：4.0mm 基材 / 0.3mm 耐磨层 / 半哑光 UV / 木纹 / 单层100玻纤 / 高密度防滑底 */
    var QUOTE_PRICE_BASE = { spc: 2.35, lvt: 3.20, selfad: 2.60, looselay: 3.60 };

    /* 各配置项相对基准配置的价格增量（USD/m²），未列出的选项增量为 0 */
    var QUOTE_PRICE_DELTA = {
        /* ---- SPC 专属 ---- */
        "spc.uvCoating":        { matte: 0, semiMatte: 0.10, glossy: 0.25, crystal: 0.35 },
        "spc.wearLayer":        { "0.07mm": -0.90, "0.1mm": -0.70, "0.2mm": 0, "0.3mm": 0.70,
                                  "0.5mm": 2.10, "0.55mm": 2.45, "0.7mm": 3.50 },
        "spc.decoPaper":        { woodGrain: 0, stoneGrain: 0.10, concrete: 0.10,
                                  carpet: 0.15, herringbone: 0.30, chevron: 0.30 },
        "spc.spcCore.thickness":{ "3.5mm": -0.60, "4.0mm": 0, "4.5mm": 0.60, "5.0mm": 1.20,
                                  "5.5mm": 1.80, "6.0mm": 2.40, "7.0mm": 3.60, "8.0mm": 4.80 },
        "spc.spcCore.density":  { "1900": -0.50, "2000": 0, "2100": 0.50, "2200": 1.00 },
        /* ---- LVT 专属 ---- */
        "lvt.uvCoating":        { matte: 0, semiMatte: 0.10, glossy: 0.25 },
        "lvt.wearLayer":        { "0.1mm": -1.40, "0.2mm": -0.70, "0.3mm": 0, "0.5mm": 1.40,
                                  "0.55mm": 1.75, "0.7mm": 2.80, "1.0mm": 4.90 },
        "lvt.decoPaper":        { woodGrain: 0, stoneGrain: 0.10, concrete: 0.10,
                                  carpet: 0.15, herringbone: 0.30, chevron: 0.30 },
        "lvt.middleLayer":      { "1.0mm": -0.60, "2.0mm": 0, "3.0mm": 0.60 },
        "lvt.glassFiber":       { single40: 0, single100: 0.15, single120: 0.25, dual100: 0.40 },
        "lvt.baseLayer":        { dryback: 0, looselay: 0.80, ixpe15: 1.20, eva15: 0.70, cork15: 1.80 },
        /* ---- 自粘背胶专属 ---- */
        "selfad.uvCoating":     { matte: 0, semiMatte: 0.10, glossy: 0.25 },
        "selfad.wearLayer":     { "0.07mm": -0.90, "0.1mm": -0.70, "0.2mm": 0, "0.3mm": 0.70 },
        "selfad.decoPaper":     { woodGrain: 0, stoneGrain: 0.10, concrete: 0.10,
                                  carpet: 0.15, herringbone: 0.30, chevron: 0.30 },
        "selfad.middleLayer":   { "1.0mm": -0.60, "2.0mm": 0, "3.0mm": 0.60 },
        "selfad.backingLayer":  { standard: 0, reinforced: 0.30, removable: 0.45 },
        /* ---- 免胶平铺专属 ---- */
        "looselay.uvCoating":   { matte: 0, semiMatte: 0.10, glossy: 0.25 },
        "looselay.wearLayer":   { "0.2mm": -0.70, "0.3mm": 0, "0.5mm": 2.10,
                                  "0.55mm": 2.45, "0.7mm": 3.50 },
        "looselay.decoPaper":   { woodGrain: 0, stoneGrain: 0.10, concrete: 0.10,
                                  carpet: 0.15, herringbone: 0.30, chevron: 0.30 },
        "looselay.glassFiber":  { single40: 0, single100: 0.15, single120: 0.25, dual100: 0.40 },
        "looselay.coreLayer":   { "3.5mm": -0.60, "4.0mm": 0, "4.5mm": 0.60, "5.0mm": 1.20 },
        "looselay.slipBack":    { standard: 0, ixpe: 0.50, cork: 1.80 },
        /* ---- 通用配置（四种地板共通） ---- */
        "common.size":          { "152x914": 0, "178x1220": 0.05, "180x1220": 0.05,
                                  "228x1220": 0.15, "228x1520": 0.20, "6x36": 0,
                                  "7x48": 0.05, "9x60": 0.20 },
        "common.surface":       { eir: 0.80, deepEmbossed: 0.30, crystal: 0.20,
                                  smooth: 0, handScraped: 0.60, wireBrushed: 0.40 },
        "common.bevel":         { square: 0, micro: 0.05, painted: 0.15, vgroove: 0.20 },
        "common.click":         { unilin: 0.55, valinge2g: 0.30, valinge5g: 0.45,
                                  valinge5gi: 0.50, i4f: 0.35 },
        "common.package":       {}   /* 包装规格不影响单价 */
    };

    /* 计算当前配置的估算价格（USD/m²），返回两位小数 */
    function quoteCalcPrice() {
        var ft = quoteState.floorType;
        var price = QUOTE_PRICE_BASE[ft] || 0;
        var conf = quoteState.config[ft];

        /* 层配置增量 */
        Object.keys(conf).forEach(function (key) {
            var table = QUOTE_PRICE_DELTA[ft + "." + key];
            if (table && conf[key] in table) {
                price += table[conf[key]];
            }
        });

        /* 通用配置增量（跳过当前地板类型不适用的项，如免胶平铺/自粘背胶的锁扣） */
        QUOTE_COMMON.forEach(function (item) {
            if (!quoteCommonApplies(item, ft)) return;
            var v = quoteState.config.common[item.key];
            var table = QUOTE_PRICE_DELTA["common." + item.key];
            if (table && v in table) {
                price += table[v];
            }
        });

        if (price < 0.5) price = 0.5;   /* 价格下限保护 */
        return Math.round(price * 100) / 100;
    }

    /* 渲染实时估算价格（USD + CNY 双币种） */
    function quoteRenderPrice() {
        var usdEl = $("#quotePriceUsd");
        var cnyEl = $("#quotePriceCny");
        if (!usdEl && !cnyEl) return;
        var usd = quoteCalcPrice();
        var cny = Math.round(usd * USD_CNY_RATE * 100) / 100;
        if (usdEl) usdEl.textContent = "$" + usd.toFixed(2);
        if (cnyEl) cnyEl.textContent = "¥" + cny.toFixed(2);
    }

    /* 判断某通用配置项是否适用于当前地板类型（exclude 列表内的不适用） */
    function quoteCommonApplies(item, floorType) {
        return !(item.exclude && item.exclude.indexOf(floorType) !== -1);
    }

    /* 当前状态 */
    var quoteState = {
        floorType: "spc",
        config: { spc: {}, lvt: {}, selfad: {}, looselay: {}, common: {} }
    };

    /* 初始化默认值 */
    function quoteInitDefaults() {
        Object.keys(QUOTE_CONFIG).forEach(function (ft) {
            quoteState.config[ft] = {};
            QUOTE_CONFIG[ft].layers.forEach(function (layer) {
                if (layer.type === "group") {
                    layer.subItems.forEach(function (sub) {
                        quoteState.config[ft][layer.key + "." + sub.key] = sub.defaultValue;
                    });
                } else {
                    quoteState.config[ft][layer.key] = layer.defaultValue;
                }
            });
        });
        QUOTE_COMMON.forEach(function (item) {
            quoteState.config.common[item.key] = item.defaultValue;
        });
    }

    /* 获取选项的显示文本 */
    function quoteGetOptionLabel(item, value) {
        for (var i = 0; i < item.options.length; i++) {
            if (item.options[i].value === value) {
                return I18N.t(CURRENT_LANG, item.options[i].labelKey);
            }
        }
        return value;
    }

    /* 渲染单组 radio 选项 */
    function quoteRenderRadio(name, item, currentValue) {
        var html = '<div class="quote-options">';
        item.options.forEach(function (opt) {
            var isChecked = (opt.value === currentValue);
            html += '<label class="quote-option' + (isChecked ? " checked" : "") + '">' +
                    '<input type="radio" name="' + name + '" value="' + opt.value + '"' + (isChecked ? " checked" : "") + '>' +
                    '<span>' + I18N.t(CURRENT_LANG, opt.labelKey) + '</span>' +
                    '</label>';
        });
        html += '</div>';
        return html;
    }

    /* 渲染配置项列表（层 + 通用） */
    function quoteRenderLayers() {
        var container = $("#quoteLayers");
        if (!container) return;
        var floor = QUOTE_CONFIG[quoteState.floorType];
        var html = "";

        /* 层配置 */
        floor.layers.forEach(function (layer) {
            html += '<div class="quote-layer">';
            html += '<div class="quote-layer__title">' + I18N.t(CURRENT_LANG, layer.nameKey) + '</div>';
            if (layer.type === "group") {
                html += '<div class="quote-layer__group">';
                layer.subItems.forEach(function (sub) {
                    var fullName = quoteState.floorType + "." + layer.key + "." + sub.key;
                    html += '<div><div class="quote-subgroup__title">' + I18N.t(CURRENT_LANG, sub.nameKey) + '</div>';
                    html += quoteRenderRadio(fullName, sub, quoteState.config[quoteState.floorType][layer.key + "." + sub.key]);
                    html += '</div>';
                });
                html += '</div>';
            } else {
                var fn = quoteState.floorType + "." + layer.key;
                html += quoteRenderRadio(fn, layer, quoteState.config[quoteState.floorType][layer.key]);
            }
            html += '</div>';
        });

        /* 通用附加配置（跳过当前地板类型不适用的项） */
        html += '<div class="quote-common-title">' + I18N.t(CURRENT_LANG, "quote.common.title") + '</div>';
        QUOTE_COMMON.forEach(function (item) {
            if (!quoteCommonApplies(item, quoteState.floorType)) return;
            html += '<div class="quote-layer">';
            html += '<div class="quote-layer__title">' + I18N.t(CURRENT_LANG, item.nameKey) + '</div>';
            html += quoteRenderRadio("common." + item.key, item, quoteState.config.common[item.key]);
            html += '</div>';
        });

        container.innerHTML = html;

        /* 绑定 change 事件 */
        $all('input[type=radio]', container).forEach(function (radio) {
            radio.addEventListener("change", function () {
                quoteHandleChange(radio.name, radio.value);
            });
        });
    }

    /* 渲染截面结构图 */
    function quoteRenderStack() {
        var stack = $("#quoteStack");
        var floorName = $("#quoteFloorName");
        if (!stack) return;
        var floor = QUOTE_CONFIG[quoteState.floorType];
        if (floorName) floorName.textContent = I18N.t(CURRENT_LANG, floor.nameKey);

        var html = "";
        floor.layers.forEach(function (layer) {
            var nameText = I18N.t(CURRENT_LANG, layer.nameKey);
            var valText = "";
            if (layer.type === "group") {
                valText = layer.subItems.map(function (sub) {
                    var v = quoteState.config[quoteState.floorType][layer.key + "." + sub.key];
                    return quoteGetOptionLabel(sub, v);
                }).join(" / ");
            } else {
                var v = quoteState.config[quoteState.floorType][layer.key];
                valText = quoteGetOptionLabel(layer, v);
            }
            html += '<div class="stack-layer">' +
                    '<span class="stack-layer__name">' + nameText + '</span>' +
                    '<span class="stack-layer__value">' + valText + '</span>' +
                    '</div>';
        });
        stack.innerHTML = html;
    }

    /* 处理配置项变化 */
    function quoteHandleChange(name, value) {
        var parts = name.split(".");
        if (parts[0] === "common") {
            quoteState.config.common[parts[1]] = value;
        } else {
            var ft = parts[0];
            if (parts.length === 2) {
                quoteState.config[ft][parts[1]] = value;
            } else if (parts.length === 3) {
                quoteState.config[ft][parts[1] + "." + parts[2]] = value;
            }
        }

        /* 更新同一组 radio 的 .checked 类 */
        $all('input[name="' + name + '"]').forEach(function (radio) {
            var label = radio.closest(".quote-option");
            if (label) {
                if (radio.checked) label.classList.add("checked");
                else label.classList.remove("checked");
            }
        });

        quoteRenderStack();
        quoteRenderPrice();
        quoteUpdateSummary();
    }

    /* 格式化日期时间 */
    function quoteFormatDate(d) {
        var y = d.getFullYear();
        var m = String(d.getMonth() + 1).padStart(2, "0");
        var day = String(d.getDate()).padStart(2, "0");
        var h = String(d.getHours()).padStart(2, "0");
        var min = String(d.getMinutes()).padStart(2, "0");
        return y + "-" + m + "-" + day + " " + h + ":" + min;
    }

    /* 生成配置摘要文本 */
    function quoteGenerateSummary() {
        var floor = QUOTE_CONFIG[quoteState.floorType];
        var lines = [];
        lines.push("====================================");
        lines.push(I18N.t(CURRENT_LANG, "quote.summary.brand"));
        lines.push(I18N.t(CURRENT_LANG, "quote.summary.time") + ": " + quoteFormatDate(new Date()));
        lines.push("====================================");
        lines.push("");
        lines.push(I18N.t(CURRENT_LANG, "quote.summary.floorType") + ": " + I18N.t(CURRENT_LANG, floor.nameKey));
        lines.push("");
        lines.push("【" + I18N.t(CURRENT_LANG, "quote.summary.layerConfig") + "】");
        floor.layers.forEach(function (layer, idx) {
            if (layer.type === "group") {
                lines.push((idx + 1) + ". " + I18N.t(CURRENT_LANG, layer.nameKey) + ":");
                layer.subItems.forEach(function (sub) {
                    var v = quoteState.config[quoteState.floorType][layer.key + "." + sub.key];
                    lines.push("   " + I18N.t(CURRENT_LANG, sub.nameKey) + ": " + quoteGetOptionLabel(sub, v));
                });
            } else {
                var v = quoteState.config[quoteState.floorType][layer.key];
                lines.push((idx + 1) + ". " + I18N.t(CURRENT_LANG, layer.nameKey) + ": " + quoteGetOptionLabel(layer, v));
            }
        });
        lines.push("");
        lines.push("【" + I18N.t(CURRENT_LANG, "quote.summary.commonConfig") + "】");
        QUOTE_COMMON.forEach(function (item) {
            if (!quoteCommonApplies(item, quoteState.floorType)) return;
            var v = quoteState.config.common[item.key];
            lines.push("- " + I18N.t(CURRENT_LANG, item.nameKey) + ": " + quoteGetOptionLabel(item, v));
        });
        lines.push("");
        lines.push("【" + I18N.t(CURRENT_LANG, "quote.summary.estPrice") + "】");
        var estUsd = quoteCalcPrice();
        var estCny = Math.round(estUsd * USD_CNY_RATE * 100) / 100;
        lines.push("$" + estUsd.toFixed(2) + " /m²  ≈  ¥" + estCny.toFixed(2) + " /m² (FOB)");
        lines.push("");
        lines.push("【" + I18N.t(CURRENT_LANG, "quote.summary.contactInfo") + "】");
        var form = $("#quoteForm");
        if (form) {
            var fmap = { qName: "quote.form.name", qCompany: "quote.form.company", qEmail: "quote.form.email",
                         qPhone: "quote.form.phone", qCountry: "quote.form.country",
                         qQuantity: "quote.form.quantity", qMessage: "quote.form.message" };
            Object.keys(fmap).forEach(function (id) {
                var el = $("#" + id, form);
                var val = el ? el.value : "";
                lines.push(I18N.t(CURRENT_LANG, fmap[id]) + ": " + val);
            });
        }
        lines.push("");
        lines.push("====================================");
        lines.push(I18N.t(CURRENT_LANG, "quote.summary.footer"));
        return lines.join("\n");
    }

    /* 更新摘要 textarea */
    function quoteUpdateSummary() {
        var ta = $("#quoteSummary");
        if (ta) ta.value = quoteGenerateSummary();
    }

    /* 显示复制/下载成功提示 */
    function quoteShowToast(msg) {
        var toast = $(".copy-toast");
        if (!toast) {
            toast = document.createElement("div");
            toast.className = "copy-toast";
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.classList.add("show");
        setTimeout(function () { toast.classList.remove("show"); }, 1800);
    }

    /* 降级复制方案 */
    function quoteFallbackCopy(text) {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand("copy");
            quoteShowToast(I18N.t(CURRENT_LANG, "quote.form.copied"));
        } catch (e) {
            quoteShowToast("Copy failed");
        }
        document.body.removeChild(ta);
    }

    /* 初始化报价配置器入口 */
    function initQuoteConfigurator() {
        var form = $("#quoteForm");
        if (!form) return;

        /* 1. 初始化默认值 + 渲染 */
        quoteInitDefaults();
        quoteRenderLayers();
        quoteRenderStack();
        quoteRenderPrice();
        quoteUpdateSummary();

        /* 2. Tab 切换 */
        $all(".quote-tab").forEach(function (tab) {
            tab.addEventListener("click", function () {
                $all(".quote-tab").forEach(function (t) { t.classList.remove("active"); });
                tab.classList.add("active");
                quoteState.floorType = tab.getAttribute("data-type");
                quoteRenderLayers();
                quoteRenderStack();
                quoteRenderPrice();
                quoteUpdateSummary();
            });
        });

        /* 3. 复制摘要 */
        var copyBtn = $("#copySummary");
        if (copyBtn) {
            copyBtn.addEventListener("click", function () {
                var ta = $("#quoteSummary");
                if (!ta) return;
                var text = ta.value;
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).then(function () {
                        quoteShowToast(I18N.t(CURRENT_LANG, "quote.form.copied"));
                    }).catch(function () {
                        quoteFallbackCopy(text);
                    });
                } else {
                    quoteFallbackCopy(text);
                }
            });
        }

        /* 4. 下载摘要 */
        var dlBtn = $("#downloadSummary");
        if (dlBtn) {
            dlBtn.addEventListener("click", function () {
                var ta = $("#quoteSummary");
                if (!ta) return;
                var text = ta.value;
                var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
                var url = URL.createObjectURL(blob);
                var a = document.createElement("a");
                a.href = url;
                a.download = "Maosheng-Quote-" + quoteFormatDate(new Date()).replace(/[: ]/g, "-") + ".txt";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                quoteShowToast(I18N.t(CURRENT_LANG, "quote.form.downloaded"));
            });
        }

        /* 5. 联系信息字段实时更新摘要 */
        $all("input, textarea", form).forEach(function (field) {
            if (field.id === "quoteSummary") return;
            field.addEventListener("input", function () {
                quoteUpdateSummary();
            });
            /* 输入时清除错误样式 */
            field.addEventListener("input", function () {
                field.style.borderColor = "";
                field.style.background = "";
            });
        });

        /* 6. 表单提交（复用 contact 的校验逻辑） */
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            var valid = true;
            var required = $all("[required]", form);

            required.forEach(function (field) {
                var value = (field.value || "").trim();
                var err = false;
                if (!value) {
                    err = true;
                } else if (field.type === "email") {
                    var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!re.test(value)) err = true;
                } else if (field.type === "tel") {
                    if (value.replace(/\D/g, "").length < 6) err = true;
                }
                if (err) {
                    valid = false;
                    field.style.borderColor = "#c0392b";
                    field.style.background = "#fdf3f1";
                } else {
                    field.style.borderColor = "";
                    field.style.background = "";
                }
            });

            if (!valid) return;

            /* 模拟提交 */
            var btn = $("button[type=submit]", form);
            var submitText = (window.I18N && CURRENT_LANG)
                ? I18N.t(CURRENT_LANG, "quote.form.submit")
                : (btn ? btn.getAttribute("data-text") : "") || "提交报价请求";
            var submittingText = (window.I18N && CURRENT_LANG)
                ? I18N.t(CURRENT_LANG, "quote.form.submitting")
                : "正在发送...";
            if (btn) {
                btn.textContent = submittingText;
                btn.disabled = true;
            }

            /* 提交前再更新一次摘要 */
            quoteUpdateSummary();

            setTimeout(function () {
                var success = $(".form-success", form);
                if (success) {
                    success.classList.add("show");
                    success.scrollIntoView({ behavior: "smooth", block: "center" });
                }
                /* 仅清空联系信息字段，保留配置 */
                $all("input, textarea", form).forEach(function (field) {
                    if (field.id !== "quoteSummary") {
                        field.value = "";
                        field.style.borderColor = "";
                        field.style.background = "";
                    }
                });
                if (btn) {
                    btn.textContent = submitText;
                    btn.disabled = false;
                }
                quoteUpdateSummary();
                setTimeout(function () {
                    if (success) success.classList.remove("show");
                }, 6000);
            }, 900);
        });

        /* 7. 监听多语言切换，重新渲染动态内容 */
        document.addEventListener("languagechange", function () {
            quoteRenderLayers();
            quoteRenderStack();
            quoteRenderPrice();
            quoteUpdateSummary();
        });
    }

    /* ======================================================================
       12. 公司位置地图（仅 contact.html 生效）——统一使用谷歌地图
       谷歌地图 iframe embed 方式无需 API Key，自带位置标记、缩放、
       平移、卫星图层等交互功能，全球可用（含中国境外访问场景）。
       ====================================================================== */

    function initMapSwitcher() {
        var mapFrame = $("#mapFrame");
        if (!mapFrame) return;   /* 仅 contact.html 有该元素 */

        /* 公司位置（WGS-84 坐标，来自 OpenStreetMap） */
        var COMPANY_LNG = 120.284919;
        var COMPANY_LAT = 29.158970;

        /* 谷歌地图（无需 API Key，使用 iframe embed） */
        var GMAP_SRC  = "https://maps.google.com/maps?q=" + COMPANY_LAT + "," + COMPANY_LNG + "&z=14&output=embed";
        var GMAP_LINK = "https://www.google.com/maps?q=" + COMPANY_LAT + "," + COMPANY_LNG + "&z=14";

        /* 确保所有语言下均显示谷歌地图 */
        mapFrame.style.display = "block";
        if (mapFrame.src.indexOf("maps.google.com") === -1) mapFrame.src = GMAP_SRC;

        /* "查看大地图"链接统一指向谷歌地图 */
        var mapLink = $("#mapLink");
        if (mapLink) mapLink.href = GMAP_LINK;
    }

    /* ======================================================================
       13. WhatsApp 二维码弹窗（footer 和浮动按钮的 WhatsApp 均触发）
       ====================================================================== */
    function initWhatsAppQR() {
        var overlay = $("#waQrOverlay");
        if (!overlay) return;

        var closeBtn = $("#waQrClose");
        /* footer 的 WhatsApp 按钮 + 浮动按钮区的 WhatsApp 按钮 */
        var floatBtn = $("#floatWaBtn");
        var footerBtn = $("#footerWaBtn");

        function show(e) {
            if (e) { e.preventDefault(); }
            overlay.classList.add("show");
        }
        function hide() {
            overlay.classList.remove("show");
        }

        if (floatBtn) floatBtn.addEventListener("click", show);
        if (footerBtn) footerBtn.addEventListener("click", show);
        var contactBtn = $("#contactWaBtn");
        if (contactBtn) contactBtn.addEventListener("click", show);
        if (closeBtn) closeBtn.addEventListener("click", hide);
        /* 点击遮罩层关闭 */
        overlay.addEventListener("click", function (e) {
            if (e.target === overlay) hide();
        });
        /* ESC 键关闭 */
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && overlay.classList.contains("show")) hide();
        });
    }

    /* ======================================================================
       14. 微信二维码弹窗（footer 的微信按钮触发）
       ====================================================================== */
    function initWeChatQR() {
        var overlay = $("#wechatQrOverlay");
        if (!overlay) return;

        var closeBtn = $("#wechatQrClose");
        var footerBtn = $("#footerWechatBtn");

        function show(e) {
            if (e) { e.preventDefault(); }
            overlay.classList.add("show");
        }
        function hide() {
            overlay.classList.remove("show");
        }

        if (footerBtn) footerBtn.addEventListener("click", show);
        var contactBtn = $("#contactWechatBtn");
        if (contactBtn) contactBtn.addEventListener("click", show);
        if (closeBtn) closeBtn.addEventListener("click", hide);
        /* 点击遮罩层关闭 */
        overlay.addEventListener("click", function (e) {
            if (e.target === overlay) hide();
        });
        /* ESC 键关闭 */
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && overlay.classList.contains("show")) hide();
        });
    }

    /* ======================================================================
       15. TikTok 二维码弹窗（footer 的 TikTok 按钮触发）
       ====================================================================== */
    function initTiktokQR() {
        var overlay = $("#tiktokQrOverlay");
        if (!overlay) return;

        var closeBtn = $("#tiktokQrClose");
        var footerBtn = $("#footerTiktokBtn");

        function show(e) {
            if (e) { e.preventDefault(); }
            overlay.classList.add("show");
        }
        function hide() {
            overlay.classList.remove("show");
        }

        if (footerBtn) footerBtn.addEventListener("click", show);
        var contactBtn = $("#contactTiktokBtn");
        if (contactBtn) contactBtn.addEventListener("click", show);
        if (closeBtn) closeBtn.addEventListener("click", hide);
        /* 点击遮罩层关闭 */
        overlay.addEventListener("click", function (e) {
            if (e.target === overlay) hide();
        });
        /* ESC 键关闭 */
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && overlay.classList.contains("show")) hide();
        });
    }

    /* ======================================================================
       初始化
       ====================================================================== */
    function init() {
        initI18N();          /* 多语言必须先初始化，再渲染其他交互文案 */
        initNav();
        initHeroSlider();
        initBackToTop();
        initReveal();
        initCountUp();
        initProductFilter();
        initLightbox();
        initContactForm();
        initHeaderScroll();
        initQuoteConfigurator();  /* 自定义报价配置器（仅 quote.html 生效） */
        initMapSwitcher();        /* 地图切换器（仅 contact.html 生效） */
        initWhatsAppQR();         /* WhatsApp 二维码弹窗 */
        initWeChatQR();           /* 微信二维码弹窗 */
        initTiktokQR();           /* TikTok 二维码弹窗 */
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
