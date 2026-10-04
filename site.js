/* Codenzi — shared UI behaviour (header, mobile menu, reveal, document TOC). */
(function () {
    "use strict";

    var root = document.documentElement;
    var header = document.querySelector(".site-header");
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---------- Header state on scroll ---------- */
    var ticking = false;
    var scrollHandlers = [];

    function onScroll() {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(function () {
            ticking = false;
            for (var i = 0; i < scrollHandlers.length; i++) scrollHandlers[i]();
        });
    }

    if (header) {
        scrollHandlers.push(function () {
            header.classList.toggle("is-scrolled", window.scrollY > 4);
        });
    }

    /* ---------- Mobile menu (home) ---------- */
    var toggle = document.querySelector("[data-nav-toggle]");
    if (toggle) {
        var menu = document.getElementById(toggle.getAttribute("aria-controls"));
        var setMenu = function (open) {
            toggle.setAttribute("aria-expanded", open ? "true" : "false");
            if (menu) menu.classList.toggle("is-open", open);
            document.body.classList.toggle("menu-open", open);
        };
        toggle.addEventListener("click", function () {
            setMenu(toggle.getAttribute("aria-expanded") !== "true");
        });
        if (menu) {
            menu.addEventListener("click", function (e) {
                if (e.target.closest("a")) setMenu(false);
            });
        }
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") setMenu(false);
        });
        window.addEventListener("resize", function () {
            if (window.innerWidth > 880) setMenu(false);
        });
    }

    /* ---------- Reveal on scroll ---------- */
    var revealEls = document.querySelectorAll("[data-reveal]");
    if (revealEls.length) {
        if (reduceMotion || !("IntersectionObserver" in window)) {
            for (var r = 0; r < revealEls.length; r++) revealEls[r].classList.add("is-visible");
        } else {
            root.classList.add("reveal-ready");
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        io.unobserve(entry.target);
                    }
                });
            }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
            for (var j = 0; j < revealEls.length; j++) io.observe(revealEls[j]);
        }
    }

    /* ---------- Documents: reading progress + table of contents ---------- */
    var doc = document.querySelector(".doc");
    var docBody = doc && doc.querySelector(".doc-body");

    if (docBody && header) {
        var bar = document.createElement("div");
        bar.className = "read-progress";
        bar.setAttribute("aria-hidden", "true");
        header.appendChild(bar);

        scrollHandlers.push(function () {
            var max = document.documentElement.scrollHeight - window.innerHeight;
            var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
            bar.style.setProperty("--progress", p.toFixed(4));
        });
    }

    var toc = null;
    var sectionCount = 0;
    var tocLinks = [];
    var tocHeads = [];

    function isTurkish(heading) {
        var scope = heading.parentElement && heading.parentElement.closest("[id], [lang]");
        var code = "";
        if (scope && scope !== root) code = scope.getAttribute("lang") || scope.id || "";
        if (!code) code = root.getAttribute("lang") || "";
        return /(^|-)tr$|turkish/i.test(code);
    }

    function buildToc() {
        if (!docBody || doc.classList.contains("doc--action")) return;

        var heads = Array.prototype.filter.call(docBody.querySelectorAll("h2"), function (h) {
            return h.offsetParent !== null && h.textContent.trim().length > 0;
        });

        if (toc) {
            toc.remove();
            toc = null;
        }
        tocLinks = [];
        tocHeads = [];

        if (heads.length < 4) {
            doc.classList.remove("has-toc");
            return;
        }

        var turkish = isTurkish(heads[0]);
        toc = document.createElement("nav");
        toc.className = "doc-toc";
        toc.setAttribute("aria-label", turkish ? "İçindekiler" : "On this page");
        toc.setAttribute("lang", turkish ? "tr" : "en");

        var title = document.createElement("p");
        title.className = "doc-toc__title";
        title.textContent = turkish ? "İçindekiler" : "On this page";
        toc.appendChild(title);

        var list = document.createElement("ol");
        heads.forEach(function (h) {
            if (!h.id) h.id = "section-" + (++sectionCount);
            var li = document.createElement("li");
            var a = document.createElement("a");
            a.href = "#" + h.id;
            a.textContent = h.textContent.replace(/\s+/g, " ").trim();
            li.appendChild(a);
            list.appendChild(li);
            tocLinks.push(a);
            tocHeads.push(h);
        });
        toc.appendChild(list);

        doc.appendChild(toc);
        doc.classList.add("has-toc");
        spy();
    }

    function spy() {
        if (!tocHeads.length) return;
        var offset = (header ? header.offsetHeight : 0) + 120;
        var active = 0;
        for (var i = 0; i < tocHeads.length; i++) {
            if (tocHeads[i].getBoundingClientRect().top - offset <= 0) active = i;
        }
        for (var k = 0; k < tocLinks.length; k++) {
            tocLinks[k].classList.toggle("is-active", k === active);
        }
    }

    if (docBody) {
        scrollHandlers.push(spy);

        var rebuildTimer;
        var scheduleBuild = function () {
            clearTimeout(rebuildTimer);
            rebuildTimer = setTimeout(buildToc, 60);
        };

        if (document.readyState === "complete") scheduleBuild();
        else window.addEventListener("load", scheduleBuild);
        document.addEventListener("DOMContentLoaded", scheduleBuild);

        if ("MutationObserver" in window) {
            new MutationObserver(scheduleBuild).observe(docBody, {
                subtree: true,
                attributes: true,
                attributeFilter: ["style", "class", "hidden"]
            });
        }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
})();
