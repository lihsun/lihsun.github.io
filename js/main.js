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

        tabs.forEach(function (tab) {
            tab.addEventListener("click", function () {
                var filter = tab.getAttribute("data-filter");

                tabs.forEach(function (t) { t.classList.remove("active"); });
                tab.classList.add("active");

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
            });
        });
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
        wpc: {
            nameKey: "quote.tab.wpc",
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
                        { value: "herringbone", labelKey: "quote.opt.herringbone" },
                        { value: "chevron",     labelKey: "quote.opt.chevron" }
                    ],
                    defaultValue: "woodGrain"
                },
                {
                    key: "middleLayer", nameKey: "quote.layer.middleLayer", type: "radio",
                    options: [
                        { value: "pvc05",   labelKey: "quote.opt.ml.pvc05" },
                        { value: "pvc10",   labelKey: "quote.opt.ml.pvc10" },
                        { value: "pvcgf10", labelKey: "quote.opt.ml.pvcgf10" }
                    ],
                    defaultValue: "pvc10"
                },
                {
                    key: "wpcLayer", nameKey: "quote.layer.wpcLayer", type: "radio",
                    options: [
                        { value: "4.0mm", labelKey: "quote.opt.thk.4.0" },
                        { value: "4.5mm", labelKey: "quote.opt.thk.4.5" },
                        { value: "5.0mm", labelKey: "quote.opt.thk.5.0" },
                        { value: "5.5mm", labelKey: "quote.opt.thk.5.5" },
                        { value: "6.0mm", labelKey: "quote.opt.thk.6.0" },
                        { value: "6.5mm", labelKey: "quote.opt.thk.6.5" },
                        { value: "7.0mm", labelKey: "quote.opt.thk.7.0" }
                    ],
                    defaultValue: "5.5mm"
                },
                {
                    key: "baseLayer", nameKey: "quote.layer.baseLayer", type: "radio",
                    options: [
                        { value: "cork10", labelKey: "quote.opt.base.cork10" },
                        { value: "cork15", labelKey: "quote.opt.base.cork15" },
                        { value: "cork20", labelKey: "quote.opt.base.cork20" },
                        { value: "ixpe10", labelKey: "quote.opt.base.ixpe10" },
                        { value: "ixpe15", labelKey: "quote.opt.base.ixpe15" },
                        { value: "ixpe20", labelKey: "quote.opt.base.ixpe20" },
                        { value: "eva10",  labelKey: "quote.opt.base.eva10" },
                        { value: "eva15",  labelKey: "quote.opt.base.eva15" },
                        { value: "eva20",  labelKey: "quote.opt.base.eva20" }
                    ],
                    defaultValue: "ixpe15"
                }
            ]
        }
    };

    /* 通用附加配置项（三种地板共通） */
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

    /* 当前状态 */
    var quoteState = {
        floorType: "spc",
        config: { spc: {}, lvt: {}, wpc: {}, common: {} }
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

        /* 通用附加配置 */
        html += '<div class="quote-common-title">' + I18N.t(CURRENT_LANG, "quote.common.title") + '</div>';
        QUOTE_COMMON.forEach(function (item) {
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
            var v = quoteState.config.common[item.key];
            lines.push("- " + I18N.t(CURRENT_LANG, item.nameKey) + ": " + quoteGetOptionLabel(item, v));
        });
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
        quoteUpdateSummary();

        /* 2. Tab 切换 */
        $all(".quote-tab").forEach(function (tab) {
            tab.addEventListener("click", function () {
                $all(".quote-tab").forEach(function (t) { t.classList.remove("active"); });
                tab.classList.add("active");
                quoteState.floorType = tab.getAttribute("data-type");
                quoteRenderLayers();
                quoteRenderStack();
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
            quoteUpdateSummary();
        });
    }

    /* ======================================================================
       12. 地图切换器（仅 contact.html 生效）——中文用百度地图，其他语言用谷歌地图
       ====================================================================== */

    /* ★★★ 百度地图开发者密钥(AK) —— 请到 https://lbsyun.baidu.com/ 免费注册后替换 ★★★
       注册步骤：
       1. 访问 https://lbsyun.baidu.com/ → 登录百度账号
       2. 控制台 → 应用管理 → 创建应用
       3. 应用类型选 "浏览器端" → 白名单填入域名（本地测试填 localhost）
       4. 复制 AK 填入下方
       注意：谷歌地图无需密钥（使用 iframe embed 方式）
    */
    var BAIDU_KEY = "YOUR_BAIDU_KEY";

    function initMapSwitcher() {
        var mapFrame = $("#mapFrame");
        var bmapContainer = $("#mapContainerBMap");
        if (!mapFrame && !bmapContainer) return;  /* 仅 contact.html 有这些元素 */

        var mapLink = $("#mapLink");

        /* 公司信息 */
        var COMPANY_ADDR = "浙江省东阳市横店工业区科兴路17号";
        var COMPANY_NAME = "东阳茂盛塑胶有限公司";
        /* WGS-84 坐标（来自 OpenStreetMap），地理编码失败时备用 */
        var COMPANY_LNG = 120.229;
        var COMPANY_LAT = 29.178;

        /* 谷歌地图（无需 API Key，使用 iframe embed） */
        var GMAP_SRC  = "https://maps.google.com/maps?q=" + COMPANY_LAT + "," + COMPANY_LNG + "&z=14&output=embed";
        var GMAP_LINK = "https://www.google.com/maps?q=" + COMPANY_LAT + "," + COMPANY_LNG + "&z=14";

        /* 百度地图"查看大地图"链接 */
        var BAIDU_LINK = "https://map.baidu.com/?wd=" + encodeURIComponent(COMPANY_ADDR);

        var bmapLoaded = false;
        var bmapInstance = null;
        var bmapCenter = null;  /* 缓存地图中心点，切换语言后恢复视图 */

        /* 未配置 AK 时显示占位提示（附"在百度地图中查看"跳转链接） */
        function showBMapPlaceholder() {
            if (!bmapContainer) return;
            bmapContainer.innerHTML =
                '<div style="display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;gap:14px;padding:24px;text-align:center;background:var(--color-bg-alt);">' +
                '<p style="font-size:1.1rem;color:var(--color-primary);font-weight:600;">⚠️ 百度地图待配置</p>' +
                '<p style="font-size:0.88rem;line-height:1.7;color:var(--color-text-light);">请在 <code style="background:#f0ede8;padding:2px 6px;border-radius:3px;">js/main.js</code> 顶部 <code style="background:#f0ede8;padding:2px 6px;border-radius:3px;">BAIDU_KEY</code> 处填入密钥<br>（到 lbsyun.baidu.com 免费申请）</p>' +
                '<a href="' + BAIDU_LINK + '" target="_blank" rel="noopener" class="btn btn--ghost">在百度地图中查看 →</a>' +
                '</div>';
        }

        function loadBaiduScript(callback) {
            if (BAIDU_KEY === "YOUR_BAIDU_KEY") { showBMapPlaceholder(); return; }
            if (bmapLoaded) { callback && callback(); return; }
            /* 百度地图 JS API 通过 callback 参数异步加载（不同于高德的 onload） */
            window.__bmapInitCallback = function () {
                bmapLoaded = true;
                callback && callback();
            };
            var s = document.createElement("script");
            s.src = "https://api.map.baidu.com/api?v=3.0&ak=" + BAIDU_KEY + "&callback=__bmapInitCallback";
            s.onerror = function () { showBMapPlaceholder(); };
            document.head.appendChild(s);
        }

        function initBMap() {
            if (!bmapContainer || typeof BMap === "undefined") { showBMapPlaceholder(); return; }
            if (bmapInstance) return;  /* 已初始化，无需重复创建 */

            bmapInstance = new BMap.Map(bmapContainer);
            bmapInstance.enableScrollWheelZoom(true);
            bmapInstance.addControl(new BMap.NavigationControl());
            bmapInstance.addControl(new BMap.ScaleControl());

            function setupMap(point) {
                bmapCenter = point;
                bmapInstance.centerAndZoom(point, 16);
                var marker = new BMap.Marker(point);
                bmapInstance.addOverlay(marker);
                var info = new BMap.InfoWindow(
                    '<div style="padding:4px 8px;line-height:1.6;">' +
                    '<strong style="color:#1c2b33;font-size:0.95rem;">' + COMPANY_NAME + '</strong><br>' +
                    '<span style="color:#5a6166;font-size:0.85rem;">' + COMPANY_ADDR + '</span></div>'
                );
                bmapInstance.openInfoWindow(info, point);
                marker.addEventListener("click", function () {
                    bmapInstance.openInfoWindow(info, point);
                });
            }

            /* 优先通过地址地理编码获取精确位置（百度返回 BD-09 坐标） */
            var geo = new BMap.Geocoder();
            geo.getPoint(COMPANY_ADDR, function (point) {
                if (point) {
                    setupMap(point);
                } else {
                    /* 地理编码失败，使用 WGS-84 坐标兜底（约有 500m 偏移） */
                    setupMap(new BMap.Point(COMPANY_LNG, COMPANY_LAT));
                }
            }, "东阳");
        }

        function updateMap(lang) {
            if (lang === "zh") {
                if (mapFrame) mapFrame.style.display = "none";
                if (bmapContainer) bmapContainer.style.display = "block";
                if (mapLink) mapLink.href = BAIDU_LINK;
                if (bmapInstance) {
                    /* 容器从隐藏→可见，触发 resize + 重新定位让百度地图重算尺寸 */
                    window.dispatchEvent(new Event("resize"));
                    if (bmapCenter) bmapInstance.centerAndZoom(bmapCenter, 16);
                } else {
                    loadBaiduScript(initBMap);
                }
            } else {
                if (mapFrame) {
                    mapFrame.style.display = "block";
                    if (mapFrame.src.indexOf("maps.google.com") === -1) mapFrame.src = GMAP_SRC;
                }
                if (bmapContainer) bmapContainer.style.display = "none";
                if (mapLink) mapLink.href = GMAP_LINK;
            }
        }

        /* 初始渲染（initI18N 已先执行，CURRENT_LANG 已就绪） */
        updateMap(CURRENT_LANG || "zh");
        /* 监听语言切换 */
        document.addEventListener("languagechange", function (e) {
            updateMap(e.detail.lang);
        });
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
