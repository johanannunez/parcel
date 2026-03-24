module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/workspace/pvtwo/src/components/FrostedNav.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>FrostedNav
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/next/image.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$List$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/List.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$X$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/X.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/framer-motion/dist/es/components/AnimatePresence/index.mjs [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
const NAV_LINKS = [
    {
        label: "Properties",
        href: "#properties"
    },
    {
        label: "About",
        href: "#about"
    },
    {
        label: "Journal",
        href: "#journal"
    },
    {
        label: "Contact",
        href: "#contact"
    }
];
function FrostedNav() {
    const [scrolled, setScrolled] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [mobileOpen, setMobileOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const onScroll = ()=>setScrolled(window.scrollY > 60);
        window.addEventListener("scroll", onScroll, {
            passive: true
        });
        return ()=>window.removeEventListener("scroll", onScroll);
    }, []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].nav, {
                initial: {
                    y: -20,
                    opacity: 0
                },
                animate: {
                    y: 0,
                    opacity: 1
                },
                transition: {
                    duration: 0.5,
                    ease: [
                        0.16,
                        1,
                        0.3,
                        1
                    ]
                },
                className: `fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "frosted border-b border-warm-gray-200/50 shadow-sm" : "bg-transparent"}`,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-6 md:px-12 lg:px-16",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                            href: "/",
                            className: "relative z-10 flex items-center gap-2",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                src: scrolled ? "/brand/logo-mark.png" : "/brand/logo-mark-white.png",
                                alt: "The Parcel Company",
                                width: 48,
                                height: 48,
                                className: "h-9 w-auto transition-opacity duration-300",
                                priority: true
                            }, void 0, false, {
                                fileName: "[project]/workspace/pvtwo/src/components/FrostedNav.tsx",
                                lineNumber: 41,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/workspace/pvtwo/src/components/FrostedNav.tsx",
                            lineNumber: 40,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "hidden items-center gap-8 md:flex",
                            children: [
                                NAV_LINKS.map((link)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                        href: link.href,
                                        className: `text-sm font-medium transition-colors duration-300 hover:text-brand ${scrolled ? "text-text-primary" : "text-white"}`,
                                        children: link.label
                                    }, link.href, false, {
                                        fileName: "[project]/workspace/pvtwo/src/components/FrostedNav.tsx",
                                        lineNumber: 54,
                                        columnNumber: 15
                                    }, this)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    href: "#properties",
                                    className: "rounded-[var(--radius-sm)] bg-gradient-to-r from-brand-light to-brand px-5 py-2.5 text-sm font-semibold text-white transition-opacity duration-300 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                                    children: "Search"
                                }, void 0, false, {
                                    fileName: "[project]/workspace/pvtwo/src/components/FrostedNav.tsx",
                                    lineNumber: 64,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/workspace/pvtwo/src/components/FrostedNav.tsx",
                            lineNumber: 52,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>setMobileOpen(!mobileOpen),
                            className: `relative z-10 md:hidden ${scrolled ? "text-text-primary" : "text-white"}`,
                            "aria-label": "Toggle menu",
                            children: mobileOpen ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$X$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["X"], {
                                size: 24,
                                weight: "bold"
                            }, void 0, false, {
                                fileName: "[project]/workspace/pvtwo/src/components/FrostedNav.tsx",
                                lineNumber: 80,
                                columnNumber: 27
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$List$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["List"], {
                                size: 24,
                                weight: "bold"
                            }, void 0, false, {
                                fileName: "[project]/workspace/pvtwo/src/components/FrostedNav.tsx",
                                lineNumber: 80,
                                columnNumber: 59
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/workspace/pvtwo/src/components/FrostedNav.tsx",
                            lineNumber: 73,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/workspace/pvtwo/src/components/FrostedNav.tsx",
                    lineNumber: 38,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/workspace/pvtwo/src/components/FrostedNav.tsx",
                lineNumber: 28,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AnimatePresence"], {
                children: mobileOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].div, {
                    initial: {
                        opacity: 0,
                        y: -10
                    },
                    animate: {
                        opacity: 1,
                        y: 0
                    },
                    exit: {
                        opacity: 0,
                        y: -10
                    },
                    transition: {
                        duration: 0.25,
                        ease: [
                            0.16,
                            1,
                            0.3,
                            1
                        ]
                    },
                    className: "frosted fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 md:hidden",
                    children: [
                        NAV_LINKS.map((link)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                href: link.href,
                                onClick: ()=>setMobileOpen(false),
                                className: "text-2xl font-semibold text-text-primary transition-colors duration-300 hover:text-brand",
                                children: link.label
                            }, link.href, false, {
                                fileName: "[project]/workspace/pvtwo/src/components/FrostedNav.tsx",
                                lineNumber: 96,
                                columnNumber: 15
                            }, this)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                            href: "#properties",
                            onClick: ()=>setMobileOpen(false),
                            className: "mt-4 rounded-[var(--radius-sm)] bg-gradient-to-r from-brand-light to-brand px-8 py-3 text-base font-semibold text-white",
                            children: "Search Properties"
                        }, void 0, false, {
                            fileName: "[project]/workspace/pvtwo/src/components/FrostedNav.tsx",
                            lineNumber: 105,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/workspace/pvtwo/src/components/FrostedNav.tsx",
                    lineNumber: 88,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/workspace/pvtwo/src/components/FrostedNav.tsx",
                lineNumber: 86,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
}),
"[project]/workspace/pvtwo/src/components/hero/FloatingPills.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>FloatingPills
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Star$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/Star.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$MapPin$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/MapPin.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Bed$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/Bed.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$WifiHigh$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/WifiHigh.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Mountains$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/Mountains.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$SwimmingPool$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/SwimmingPool.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Coffee$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/Coffee.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Sparkle$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/Sparkle.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Sun$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/Sun.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$PawPrint$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/PawPrint.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Car$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/Car.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Fire$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/Fire.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Television$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/Television.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$GameController$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/GameController.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Key$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/Key.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Bathtub$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/Bathtub.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$CookingPot$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/CookingPot.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Wine$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/Wine.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$ForkKnife$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/ForkKnife.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Snowflake$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/Snowflake.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Thermometer$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/Thermometer.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Waves$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/Waves.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$House$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/House.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$ShieldCheck$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/ShieldCheck.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Crown$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/Crown.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Couch$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/Couch.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Lamp$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/Lamp.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Fan$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/Fan.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$MusicNote$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/MusicNote.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Moon$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/Moon.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Umbrella$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/Umbrella.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Leaf$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/Leaf.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Bicycle$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/Bicycle.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Flower$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/Flower.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Compass$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/Compass.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Users$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/Users.es.js [app-ssr] (ecmascript)");
"use client";
;
;
;
;
/* ── Data ───────────────────────────────────────────────────────── */ // 36 feature pills + 24 review cards = 60 total
// Positioned organically (no grid). Bottom-center avoided (headline + booking bar).
const ELEMENTS = [
    // ── Scattered top area (y 1–15%) ─────────────────────────────
    {
        type: "pill",
        id: "f01",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$MapPin$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MapPin"],
        label: "Tri-Cities, WA",
        x: "1%",
        y: "2%",
        rotation: -2,
        drift: "fp-d1"
    },
    {
        type: "review",
        id: "r01",
        quote: "Absolutely stunning property!",
        author: "Ana",
        rating: 5,
        x: "16%",
        y: "8%",
        rotation: 3,
        drift: "fp-d5"
    },
    {
        type: "pill",
        id: "f02",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Sparkle$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Sparkle"],
        label: "Superhost",
        x: "33%",
        y: "1%",
        rotation: 1,
        drift: "fp-d3"
    },
    {
        type: "review",
        id: "r02",
        quote: "Went above and beyond for us.",
        author: "Janna",
        rating: 5,
        x: "47%",
        y: "10%",
        rotation: -3,
        drift: "fp-d7"
    },
    {
        type: "pill",
        id: "f03",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Key$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Key"],
        label: "Self Check-in",
        x: "62%",
        y: "3%",
        rotation: 2,
        drift: "fp-d2"
    },
    {
        type: "pill",
        id: "f04",
        icon: Globe,
        label: "Near Airport",
        x: "79%",
        y: "12%",
        rotation: -1,
        drift: "fp-d6"
    },
    {
        type: "review",
        id: "r03",
        quote: "A great home away from home.",
        author: "Brandon",
        rating: 5,
        x: "92%",
        y: "5%",
        rotation: 2,
        drift: "fp-d4"
    },
    {
        type: "pill",
        id: "f05",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Crown$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Crown"],
        label: "Top Rated",
        x: "10%",
        y: "14%",
        rotation: -3,
        drift: "fp-d8"
    },
    {
        type: "review",
        id: "r04",
        quote: "Perfect location, beautiful views.",
        author: "David",
        rating: 5,
        x: "52%",
        y: "15%",
        rotation: 1,
        drift: "fp-d1"
    },
    {
        type: "pill",
        id: "f06",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$ShieldCheck$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ShieldCheck"],
        label: "Contactless",
        x: "85%",
        y: "15%",
        rotation: -2,
        drift: "fp-d3"
    },
    // ── Upper scatter (y 18–32%) ─────────────────────────────────
    {
        type: "pill",
        id: "f07",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Bed$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Bed"],
        label: "3 Bedrooms",
        x: "4%",
        y: "20%",
        rotation: 3,
        drift: "fp-d4"
    },
    {
        type: "review",
        id: "r05",
        quote: "Very clean, perfect for our group.",
        author: "Kayla",
        rating: 5,
        x: "22%",
        y: "24%",
        rotation: -1,
        drift: "fp-d6"
    },
    {
        type: "pill",
        id: "f08",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Television$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Television"],
        label: "Smart TV",
        x: "40%",
        y: "19%",
        rotation: -4,
        drift: "fp-d2"
    },
    {
        type: "pill",
        id: "f09",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$SwimmingPool$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SwimmingPool"],
        label: "Heated Pool",
        x: "58%",
        y: "26%",
        rotation: 2,
        drift: "fp-d8"
    },
    {
        type: "review",
        id: "r06",
        quote: "Best Airbnb we've ever booked.",
        author: "Mike",
        rating: 5,
        x: "74%",
        y: "21%",
        rotation: -3,
        drift: "fp-d5"
    },
    {
        type: "pill",
        id: "f10",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Umbrella$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Umbrella"],
        label: "Covered Deck",
        x: "93%",
        y: "25%",
        rotation: 1,
        drift: "fp-d1"
    },
    {
        type: "review",
        id: "r07",
        quote: "Exceeded all our expectations.",
        author: "Sarah",
        rating: 5,
        x: "7%",
        y: "30%",
        rotation: -2,
        drift: "fp-d7"
    },
    {
        type: "pill",
        id: "f11",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Mountains$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mountains"],
        label: "Mountain View",
        x: "30%",
        y: "32%",
        rotation: 4,
        drift: "fp-d3"
    },
    {
        type: "pill",
        id: "f12",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Wine$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Wine"],
        label: "Wine Fridge",
        x: "49%",
        y: "29%",
        rotation: -1,
        drift: "fp-d6"
    },
    {
        type: "review",
        id: "r08",
        quote: "Loved every minute of our stay.",
        author: "Chris",
        rating: 5,
        x: "66%",
        y: "31%",
        rotation: 3,
        drift: "fp-d4"
    },
    {
        type: "pill",
        id: "f13",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Bicycle$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Bicycle"],
        label: "Bike Storage",
        x: "86%",
        y: "32%",
        rotation: -2,
        drift: "fp-d8"
    },
    // ── Mid scatter (y 35–50%) ───────────────────────────────────
    {
        type: "pill",
        id: "f14",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$WifiHigh$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WifiHigh"],
        label: "Fast WiFi",
        x: "2%",
        y: "36%",
        rotation: 2,
        drift: "fp-d5"
    },
    {
        type: "review",
        id: "r09",
        quote: "Incredible attention to detail.",
        author: "Rachel",
        rating: 5,
        x: "18%",
        y: "42%",
        rotation: -3,
        drift: "fp-d2"
    },
    {
        type: "pill",
        id: "f15",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Fire$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fire"],
        label: "Firepit",
        x: "37%",
        y: "38%",
        rotation: 1,
        drift: "fp-d7"
    },
    {
        type: "pill",
        id: "f16",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Users$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Users"],
        label: "Sleeps 8",
        x: "55%",
        y: "44%",
        rotation: -2,
        drift: "fp-d1"
    },
    {
        type: "review",
        id: "r10",
        quote: "Made our trip truly special.",
        author: "Tom",
        rating: 5,
        x: "72%",
        y: "37%",
        rotation: 3,
        drift: "fp-d6"
    },
    {
        type: "pill",
        id: "f17",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Snowflake$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Snowflake"],
        label: "Air Conditioning",
        x: "91%",
        y: "41%",
        rotation: -1,
        drift: "fp-d3"
    },
    {
        type: "review",
        id: "r11",
        quote: "10/10 recommend to everyone.",
        author: "Emily",
        rating: 5,
        x: "8%",
        y: "48%",
        rotation: 4,
        drift: "fp-d8"
    },
    {
        type: "pill",
        id: "f18",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Bathtub$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Bathtub"],
        label: "Hot Tub",
        x: "28%",
        y: "46%",
        rotation: -3,
        drift: "fp-d4"
    },
    {
        type: "pill",
        id: "f19",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Compass$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Compass"],
        label: "Desert Views",
        x: "46%",
        y: "50%",
        rotation: 2,
        drift: "fp-d2"
    },
    {
        type: "review",
        id: "r12",
        quote: "Like staying at a luxury hotel.",
        author: "James",
        rating: 5,
        x: "63%",
        y: "47%",
        rotation: -1,
        drift: "fp-d5"
    },
    {
        type: "pill",
        id: "f20",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$MusicNote$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MusicNote"],
        label: "Sound System",
        x: "82%",
        y: "49%",
        rotation: 3,
        drift: "fp-d7"
    },
    {
        type: "pill",
        id: "f21",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$ForkKnife$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ForkKnife"],
        label: "Outdoor Dining",
        x: "95%",
        y: "46%",
        rotation: -2,
        drift: "fp-d1"
    },
    // ── Content-zone edges only (y 53–72%) ───────────────────────
    // Left edge (x 0–13%)
    {
        type: "pill",
        id: "f22",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$PawPrint$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PawPrint"],
        label: "Pet Friendly",
        x: "1%",
        y: "55%",
        rotation: -2,
        drift: "fp-d6"
    },
    {
        type: "review",
        id: "r13",
        quote: "The pool was absolutely amazing!",
        author: "Nicole",
        rating: 5,
        x: "10%",
        y: "61%",
        rotation: 3,
        drift: "fp-d3"
    },
    {
        type: "pill",
        id: "f23",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$GameController$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GameController"],
        label: "Game Room",
        x: "3%",
        y: "67%",
        rotation: 1,
        drift: "fp-d8"
    },
    {
        type: "review",
        id: "r14",
        quote: "Our new favorite weekend spot.",
        author: "Alex",
        rating: 5,
        x: "12%",
        y: "72%",
        rotation: -3,
        drift: "fp-d5"
    },
    // Right edge (x 82–96%)
    {
        type: "pill",
        id: "f24",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$CookingPot$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CookingPot"],
        label: "Full Kitchen",
        x: "84%",
        y: "54%",
        rotation: 2,
        drift: "fp-d2"
    },
    {
        type: "review",
        id: "r15",
        quote: "Such a thoughtful host.",
        author: "Priya",
        rating: 5,
        x: "93%",
        y: "59%",
        rotation: -1,
        drift: "fp-d7"
    },
    {
        type: "pill",
        id: "f25",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Leaf$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Leaf"],
        label: "Trail Access",
        x: "86%",
        y: "65%",
        rotation: -4,
        drift: "fp-d4"
    },
    {
        type: "review",
        id: "r16",
        quote: "Everything was picture perfect.",
        author: "Marcus",
        rating: 5,
        x: "94%",
        y: "71%",
        rotation: 2,
        drift: "fp-d1"
    },
    {
        type: "pill",
        id: "f26",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Thermometer$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Thermometer"],
        label: "Heated Floors",
        x: "85%",
        y: "58%",
        rotation: -2,
        drift: "fp-d6"
    },
    {
        type: "pill",
        id: "f27",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Lamp$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Lamp"],
        label: "Work From Here",
        x: "4%",
        y: "59%",
        rotation: 3,
        drift: "fp-d4"
    },
    // ── Bottom edges only (y 75–90%) ─────────────────────────────
    // Far left (x 0–10%)
    {
        type: "pill",
        id: "f28",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Coffee$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Coffee"],
        label: "Coffee Bar",
        x: "1%",
        y: "76%",
        rotation: -1,
        drift: "fp-d7"
    },
    {
        type: "review",
        id: "r17",
        quote: "Five stars is not enough!",
        author: "Carlos",
        rating: 5,
        x: "8%",
        y: "82%",
        rotation: 2,
        drift: "fp-d2"
    },
    {
        type: "pill",
        id: "f29",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Sun$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Sun"],
        label: "Sunny Patio",
        x: "3%",
        y: "88%",
        rotation: -3,
        drift: "fp-d5"
    },
    // Far right (x 87–96%)
    {
        type: "review",
        id: "r18",
        quote: "We'll be back every summer.",
        author: "Anna",
        rating: 5,
        x: "90%",
        y: "77%",
        rotation: -2,
        drift: "fp-d3"
    },
    {
        type: "pill",
        id: "f30",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Car$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Car"],
        label: "Free Parking",
        x: "95%",
        y: "83%",
        rotation: 1,
        drift: "fp-d8"
    },
    {
        type: "review",
        id: "r19",
        quote: "So much better than any hotel.",
        author: "Ryan",
        rating: 5,
        x: "88%",
        y: "89%",
        rotation: 3,
        drift: "fp-d1"
    },
    // ── Extra scatter to fill gaps ───────────────────────────────
    {
        type: "pill",
        id: "f31",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Couch$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Couch"],
        label: "Cozy Loft",
        x: "25%",
        y: "6%",
        rotation: -1,
        drift: "fp-d6"
    },
    {
        type: "review",
        id: "r20",
        quote: "Helpful, responsive, and pleasant.",
        author: "J.",
        rating: 5,
        x: "70%",
        y: "9%",
        rotation: 2,
        drift: "fp-d2"
    },
    {
        type: "pill",
        id: "f32",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Flower$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Flower"],
        label: "Fresh Linens",
        x: "14%",
        y: "17%",
        rotation: 3,
        drift: "fp-d7"
    },
    {
        type: "review",
        id: "r21",
        quote: "Would definitely stay again!",
        author: "Maria",
        rating: 5,
        x: "83%",
        y: "7%",
        rotation: -2,
        drift: "fp-d4"
    },
    {
        type: "pill",
        id: "f33",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Fan$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fan"],
        label: "Washer/Dryer",
        x: "42%",
        y: "35%",
        rotation: -1,
        drift: "fp-d8"
    },
    {
        type: "review",
        id: "r22",
        quote: "Spotless and so well equipped.",
        author: "Lisa",
        rating: 5,
        x: "53%",
        y: "8%",
        rotation: 1,
        drift: "fp-d3"
    },
    {
        type: "pill",
        id: "f34",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Moon$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Moon"],
        label: "Blackout Blinds",
        x: "76%",
        y: "44%",
        rotation: -3,
        drift: "fp-d5"
    },
    {
        type: "review",
        id: "r23",
        quote: "Can't wait to return next year.",
        author: "Megan",
        rating: 5,
        x: "20%",
        y: "40%",
        rotation: 2,
        drift: "fp-d1"
    },
    {
        type: "pill",
        id: "f35",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Waves$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Waves"],
        label: "Lake Access",
        x: "60%",
        y: "36%",
        rotation: 1,
        drift: "fp-d6"
    },
    {
        type: "review",
        id: "r24",
        quote: "Hands down, the best stay ever.",
        author: "Olivia",
        rating: 5,
        x: "35%",
        y: "48%",
        rotation: -2,
        drift: "fp-d4"
    },
    {
        type: "pill",
        id: "f36",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$House$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["House"],
        label: "Quiet Neighborhood",
        x: "90%",
        y: "35%",
        rotation: 3,
        drift: "fp-d2"
    }
];
/* ── Interaction constants ──────────────────────────────────────── */ const DORMANT_OPACITY = 0.95;
const ACTIVE_OPACITY = 1.0;
const REVEAL_MAX_DIST = 380;
const REVEAL_MIN_DIST = 40;
const DORMANT_BRIGHTNESS = 0.85;
const ACTIVE_BRIGHTNESS = 1.15;
function FloatingPills() {
    const containerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const itemEls = (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])([]);
    const rafRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(0);
    const applyDormant = (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((el)=>{
        el.style.opacity = String(DORMANT_OPACITY);
        el.style.filter = `brightness(${DORMANT_BRIGHTNESS})`;
    }, []);
    const updateProximity = (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((clientX, clientY)=>{
        const container = containerRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const mx = clientX - rect.left;
        const my = clientY - rect.top;
        ELEMENTS.forEach((_, i)=>{
            const el = itemEls.current[i];
            if (!el) return;
            const elRect = el.getBoundingClientRect();
            const cx = elRect.left - rect.left + elRect.width / 2;
            const cy = elRect.top - rect.top + elRect.height / 2;
            const dist = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);
            if (dist >= REVEAL_MAX_DIST) {
                applyDormant(el);
                return;
            }
            const t = Math.max(0, 1 - (dist - REVEAL_MIN_DIST) / (REVEAL_MAX_DIST - REVEAL_MIN_DIST));
            const opacity = DORMANT_OPACITY + (ACTIVE_OPACITY - DORMANT_OPACITY) * t;
            const brightness = DORMANT_BRIGHTNESS + (ACTIVE_BRIGHTNESS - DORMANT_BRIGHTNESS) * t;
            const glow = 8 * t;
            el.style.opacity = String(opacity);
            el.style.filter = `brightness(${brightness.toFixed(2)}) drop-shadow(0 0 ${glow.toFixed(1)}px rgba(255,255,255,${(0.25 * t).toFixed(2)}))`;
        });
    }, [
        applyDormant
    ]);
    const resetAll = (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        ELEMENTS.forEach((_, i)=>{
            const el = itemEls.current[i];
            if (el) applyDormant(el);
        });
    }, [
        applyDormant
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const onMove = (e)=>{
            cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(()=>updateProximity(e.clientX, e.clientY));
        };
        const onLeave = ()=>{
            cancelAnimationFrame(rafRef.current);
            resetAll();
        };
        window.addEventListener("mousemove", onMove);
        document.addEventListener("mouseleave", onLeave);
        return ()=>{
            window.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseleave", onLeave);
            cancelAnimationFrame(rafRef.current);
        };
    }, [
        updateProximity,
        resetAll
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: containerRef,
        "aria-hidden": "true",
        className: "absolute inset-0 overflow-hidden pointer-events-none z-[1] hidden md:block",
        children: [
            ELEMENTS.map((el, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    ref: (node)=>{
                        itemEls.current[i] = node;
                    },
                    className: `${el.type === "pill" ? "fp-pill" : "fp-review"} ${el.drift}`,
                    style: {
                        position: "absolute",
                        left: el.x,
                        top: el.y,
                        transform: `rotate(${el.rotation}deg)`,
                        opacity: DORMANT_OPACITY,
                        filter: `brightness(${DORMANT_BRIGHTNESS})`,
                        transition: "opacity 0.35s ease-out, filter 0.35s ease-out"
                    },
                    children: el.type === "pill" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(el.icon, {
                                size: 16,
                                weight: "bold"
                            }, void 0, false, {
                                fileName: "[project]/workspace/pvtwo/src/components/hero/FloatingPills.tsx",
                                lineNumber: 253,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: el.label
                            }, void 0, false, {
                                fileName: "[project]/workspace/pvtwo/src/components/hero/FloatingPills.tsx",
                                lineNumber: 254,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "fp-stars",
                                children: Array.from({
                                    length: el.rating
                                }).map((_, j)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Star$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Star"], {
                                        size: 11,
                                        weight: "fill",
                                        className: "fp-star-icon"
                                    }, j, false, {
                                        fileName: "[project]/workspace/pvtwo/src/components/hero/FloatingPills.tsx",
                                        lineNumber: 260,
                                        columnNumber: 19
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/workspace/pvtwo/src/components/hero/FloatingPills.tsx",
                                lineNumber: 258,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "fp-quote",
                                children: [
                                    "“",
                                    el.quote,
                                    "”"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/workspace/pvtwo/src/components/hero/FloatingPills.tsx",
                                lineNumber: 263,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "fp-author",
                                children: el.author
                            }, void 0, false, {
                                fileName: "[project]/workspace/pvtwo/src/components/hero/FloatingPills.tsx",
                                lineNumber: 264,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true)
                }, el.id, false, {
                    fileName: "[project]/workspace/pvtwo/src/components/hero/FloatingPills.tsx",
                    lineNumber: 237,
                    columnNumber: 9
                }, this)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("style", {
                children: `
        /* ── Feature pill ─────────────────────────────── */
        .fp-pill {
          display: flex; align-items: center; gap: 7px;
          padding: 9px 16px; border-radius: 100px;
          background: rgba(255,255,255,0.18);
          backdrop-filter: blur(16px) saturate(160%);
          -webkit-backdrop-filter: blur(16px) saturate(160%);
          border: 1px solid rgba(255,255,255,0.25);
          color: rgba(255,255,255,0.9);
          font-size: 13px; font-weight: 600; white-space: nowrap;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }

        /* ── Review card ──────────────────────────────── */
        .fp-review {
          max-width: 200px; padding: 12px 16px; border-radius: 14px;
          background: rgba(255,255,255,0.14);
          backdrop-filter: blur(16px) saturate(160%);
          -webkit-backdrop-filter: blur(16px) saturate(160%);
          border: 1px solid rgba(255,255,255,0.20);
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        .fp-stars { display: flex; gap: 2px; margin-bottom: 5px; }
        .fp-star-icon { color: #facc15; }
        .fp-quote { color: rgba(255,255,255,0.88); font-size: 12px; line-height: 1.45; font-weight: 500; }
        .fp-author { display: block; margin-top: 5px; color: rgba(255,255,255,0.55); font-size: 11px; font-weight: 400; }

        /* ── Drift animations (8 unique) ──────────────── */
        @keyframes fp-d1 { 0%{transform:translate(0,0) rotate(0deg)} 33%{transform:translate(18px,10px) rotate(1.5deg)} 66%{transform:translate(-10px,18px) rotate(-1deg)} 100%{transform:translate(0,0) rotate(0deg)} }
        @keyframes fp-d2 { 0%{transform:translate(0,0) rotate(0deg)} 33%{transform:translate(-14px,-12px) rotate(-2deg)} 66%{transform:translate(12px,-6px) rotate(1deg)} 100%{transform:translate(0,0) rotate(0deg)} }
        @keyframes fp-d3 { 0%{transform:translate(0,0)} 50%{transform:translate(14px,-10px)} 100%{transform:translate(0,0)} }
        @keyframes fp-d4 { 0%{transform:translate(0,0) rotate(0deg)} 40%{transform:translate(-8px,14px) rotate(1deg)} 80%{transform:translate(10px,6px) rotate(-0.5deg)} 100%{transform:translate(0,0) rotate(0deg)} }
        @keyframes fp-d5 { 0%{transform:translate(0,0)} 35%{transform:translate(12px,-8px)} 70%{transform:translate(-6px,-14px)} 100%{transform:translate(0,0)} }
        @keyframes fp-d6 { 0%{transform:translate(0,0) rotate(0deg)} 50%{transform:translate(-16px,8px) rotate(2deg)} 100%{transform:translate(0,0) rotate(0deg)} }
        @keyframes fp-d7 { 0%{transform:translate(0,0) rotate(0deg)} 25%{transform:translate(10px,-14px) rotate(-1.5deg)} 50%{transform:translate(-6px,-8px) rotate(0.5deg)} 75%{transform:translate(14px,6px) rotate(1deg)} 100%{transform:translate(0,0) rotate(0deg)} }
        @keyframes fp-d8 { 0%{transform:translate(0,0)} 40%{transform:translate(-12px,10px)} 70%{transform:translate(8px,-12px)} 100%{transform:translate(0,0)} }

        .fp-d1{animation:fp-d1 22s ease-in-out infinite}
        .fp-d2{animation:fp-d2 18s ease-in-out infinite}
        .fp-d3{animation:fp-d3 25s ease-in-out infinite}
        .fp-d4{animation:fp-d4 20s ease-in-out infinite}
        .fp-d5{animation:fp-d5 16s ease-in-out infinite}
        .fp-d6{animation:fp-d6 24s ease-in-out infinite}
        .fp-d7{animation:fp-d7 28s ease-in-out infinite}
        .fp-d8{animation:fp-d8 21s ease-in-out infinite}
        @media(prefers-reduced-motion:reduce){.fp-d1,.fp-d2,.fp-d3,.fp-d4,.fp-d5,.fp-d6,.fp-d7,.fp-d8{animation:none}}
      `
            }, void 0, false, {
                fileName: "[project]/workspace/pvtwo/src/components/hero/FloatingPills.tsx",
                lineNumber: 270,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/workspace/pvtwo/src/components/hero/FloatingPills.tsx",
        lineNumber: 231,
        columnNumber: 5
    }, this);
}
}),
"[project]/workspace/pvtwo/src/components/hero/FloatingBokeh.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>FloatingBokeh
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
"use client";
;
const ORBS = [
    {
        id: "b01",
        size: 180,
        x: "5%",
        y: "5%",
        opacity: 0.08,
        color: "rgba(2,170,235,0.4)",
        driftClass: "bk-drift-1"
    },
    {
        id: "b02",
        size: 90,
        x: "85%",
        y: "10%",
        opacity: 0.12,
        color: "rgba(255,255,255,0.3)",
        driftClass: "bk-drift-3"
    },
    {
        id: "b03",
        size: 50,
        x: "78%",
        y: "30%",
        opacity: 0.1,
        color: "rgba(2,170,235,0.35)",
        driftClass: "bk-drift-5"
    },
    {
        id: "b04",
        size: 140,
        x: "0%",
        y: "40%",
        opacity: 0.06,
        color: "rgba(255,255,255,0.25)",
        driftClass: "bk-drift-2"
    },
    {
        id: "b05",
        size: 35,
        x: "92%",
        y: "50%",
        opacity: 0.15,
        color: "rgba(255,255,255,0.35)",
        driftClass: "bk-drift-4"
    },
    {
        id: "b06",
        size: 70,
        x: "8%",
        y: "65%",
        opacity: 0.1,
        color: "rgba(27,119,190,0.3)",
        driftClass: "bk-drift-6"
    },
    {
        id: "b07",
        size: 110,
        x: "88%",
        y: "68%",
        opacity: 0.07,
        color: "rgba(2,170,235,0.3)",
        driftClass: "bk-drift-1"
    },
    {
        id: "b08",
        size: 45,
        x: "3%",
        y: "22%",
        opacity: 0.12,
        color: "rgba(255,255,255,0.3)",
        driftClass: "bk-drift-4"
    },
    {
        id: "b09",
        size: 60,
        x: "90%",
        y: "82%",
        opacity: 0.08,
        color: "rgba(255,255,255,0.2)",
        driftClass: "bk-drift-3"
    },
    {
        id: "b10",
        size: 25,
        x: "12%",
        y: "78%",
        opacity: 0.14,
        color: "rgba(2,170,235,0.35)",
        driftClass: "bk-drift-5"
    },
    {
        id: "b11",
        size: 160,
        x: "82%",
        y: "45%",
        opacity: 0.05,
        color: "rgba(27,119,190,0.25)",
        driftClass: "bk-drift-2"
    },
    {
        id: "b12",
        size: 30,
        x: "6%",
        y: "52%",
        opacity: 0.13,
        color: "rgba(255,255,255,0.3)",
        driftClass: "bk-drift-6"
    }
];
function FloatingBokeh() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "aria-hidden": "true",
        className: "absolute inset-0 overflow-hidden pointer-events-none z-[1]",
        children: [
            ORBS.map((orb)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: orb.driftClass,
                    style: {
                        position: "absolute",
                        left: orb.x,
                        top: orb.y,
                        width: orb.size,
                        height: orb.size,
                        borderRadius: "50%",
                        background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
                        opacity: orb.opacity,
                        filter: "blur(8px)"
                    }
                }, orb.id, false, {
                    fileName: "[project]/workspace/pvtwo/src/components/hero/FloatingBokeh.tsx",
                    lineNumber: 32,
                    columnNumber: 9
                }, this)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("style", {
                children: `
        @keyframes bk-drift-1 { 0%{transform:translate(0,0)} 33%{transform:translate(30px,20px)} 66%{transform:translate(-20px,30px)} 100%{transform:translate(0,0)} }
        @keyframes bk-drift-2 { 0%{transform:translate(0,0)} 33%{transform:translate(-25px,-18px)} 66%{transform:translate(18px,-12px)} 100%{transform:translate(0,0)} }
        @keyframes bk-drift-3 { 0%{transform:translate(0,0)} 50%{transform:translate(22px,-16px)} 100%{transform:translate(0,0)} }
        @keyframes bk-drift-4 { 0%{transform:translate(0,0)} 40%{transform:translate(-14px,22px)} 80%{transform:translate(16px,10px)} 100%{transform:translate(0,0)} }
        @keyframes bk-drift-5 { 0%{transform:translate(0,0)} 35%{transform:translate(18px,-14px)} 70%{transform:translate(-10px,-20px)} 100%{transform:translate(0,0)} }
        @keyframes bk-drift-6 { 0%{transform:translate(0,0)} 50%{transform:translate(-24px,14px)} 100%{transform:translate(0,0)} }
        .bk-drift-1{animation:bk-drift-1 28s ease-in-out infinite}
        .bk-drift-2{animation:bk-drift-2 22s ease-in-out infinite}
        .bk-drift-3{animation:bk-drift-3 30s ease-in-out infinite}
        .bk-drift-4{animation:bk-drift-4 24s ease-in-out infinite}
        .bk-drift-5{animation:bk-drift-5 20s ease-in-out infinite}
        .bk-drift-6{animation:bk-drift-6 26s ease-in-out infinite}
        @media(prefers-reduced-motion:reduce){.bk-drift-1,.bk-drift-2,.bk-drift-3,.bk-drift-4,.bk-drift-5,.bk-drift-6{animation:none}}
      `
            }, void 0, false, {
                fileName: "[project]/workspace/pvtwo/src/components/hero/FloatingBokeh.tsx",
                lineNumber: 48,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/workspace/pvtwo/src/components/hero/FloatingBokeh.tsx",
        lineNumber: 30,
        columnNumber: 5
    }, this);
}
}),
"[project]/workspace/pvtwo/src/components/hero/FloatingCards.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>FloatingCards
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Star$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/Star.es.js [app-ssr] (ecmascript)");
"use client";
;
;
const CARDS = [
    {
        id: "c01",
        quote: "Absolutely stunning property. Felt right at home!",
        author: "Ana",
        location: "Airbnb Guest",
        rating: 5,
        x: "1%",
        y: "14%",
        rotation: -2,
        driftClass: "fc-drift-1"
    },
    {
        id: "c02",
        quote: "Amazing host. Went above and beyond for us.",
        author: "Janna",
        location: "Lake Tapps, WA",
        rating: 5,
        x: "82%",
        y: "16%",
        rotation: 3,
        driftClass: "fc-drift-4"
    },
    {
        id: "c03",
        quote: "A great home away from home.",
        author: "Brandon",
        location: "Chandler, AZ",
        rating: 5,
        x: "84%",
        y: "48%",
        rotation: -2,
        driftClass: "fc-drift-2"
    },
    {
        id: "c04",
        quote: "Very clean and perfect for our group.",
        author: "Kayla",
        location: "Seattle, WA",
        rating: 5,
        x: "0%",
        y: "46%",
        rotation: 2,
        driftClass: "fc-drift-5"
    },
    {
        id: "c05",
        quote: "51 five-star reviews",
        author: "",
        location: "",
        rating: 0,
        x: "86%",
        y: "76%",
        rotation: -3,
        driftClass: "fc-drift-3"
    },
    {
        id: "c06",
        quote: "Jo was helpful, responsive, and very pleasant.",
        author: "J.",
        location: "Everett, WA",
        rating: 5,
        x: "2%",
        y: "76%",
        rotation: 3,
        driftClass: "fc-drift-6"
    }
];
function FloatingCards() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "aria-hidden": "true",
        className: "absolute inset-0 overflow-hidden pointer-events-none z-[1] hidden md:block",
        children: [
            CARDS.map((card)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: `fc-card ${card.driftClass}`,
                    style: {
                        position: "absolute",
                        left: card.x,
                        top: card.y,
                        transform: `rotate(${card.rotation}deg)`
                    },
                    children: [
                        card.rating > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "fc-stars",
                            children: Array.from({
                                length: card.rating
                            }).map((_, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Star$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Star"], {
                                    size: 11,
                                    weight: "fill",
                                    style: {
                                        color: "var(--color-star)"
                                    }
                                }, i, false, {
                                    fileName: "[project]/workspace/pvtwo/src/components/hero/FloatingCards.tsx",
                                    lineNumber: 80,
                                    columnNumber: 17
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/workspace/pvtwo/src/components/hero/FloatingCards.tsx",
                            lineNumber: 78,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "fc-quote",
                            children: card.quote
                        }, void 0, false, {
                            fileName: "[project]/workspace/pvtwo/src/components/hero/FloatingCards.tsx",
                            lineNumber: 84,
                            columnNumber: 11
                        }, this),
                        card.author && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "fc-author",
                            children: [
                                card.author,
                                card.location ? ` · ${card.location}` : ""
                            ]
                        }, void 0, true, {
                            fileName: "[project]/workspace/pvtwo/src/components/hero/FloatingCards.tsx",
                            lineNumber: 85,
                            columnNumber: 27
                        }, this)
                    ]
                }, card.id, true, {
                    fileName: "[project]/workspace/pvtwo/src/components/hero/FloatingCards.tsx",
                    lineNumber: 72,
                    columnNumber: 9
                }, this)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("style", {
                children: `
        .fc-card {
          max-width: 190px; padding: 12px 16px; border-radius: 14px;
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(16px) saturate(160%);
          -webkit-backdrop-filter: blur(16px) saturate(160%);
          border: 1px solid rgba(255,255,255,0.18);
          opacity: 0.45; box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        .fc-stars { display:flex; gap:2px; margin-bottom:5px; }
        .fc-quote { color:rgba(255,255,255,0.85); font-size:12px; line-height:1.45; font-weight:500; }
        .fc-author { display:block; margin-top:5px; color:rgba(255,255,255,0.5); font-size:11px; font-weight:400; }
        @keyframes fc-drift-1 { 0%{transform:translate(0,0) rotate(0deg)} 33%{transform:translate(16px,8px) rotate(1deg)} 66%{transform:translate(-8px,16px) rotate(-0.5deg)} 100%{transform:translate(0,0) rotate(0deg)} }
        @keyframes fc-drift-2 { 0%{transform:translate(0,0) rotate(0deg)} 33%{transform:translate(-12px,-10px) rotate(-1.5deg)} 66%{transform:translate(10px,-4px) rotate(0.5deg)} 100%{transform:translate(0,0) rotate(0deg)} }
        @keyframes fc-drift-3 { 0%{transform:translate(0,0)} 50%{transform:translate(12px,-8px)} 100%{transform:translate(0,0)} }
        @keyframes fc-drift-4 { 0%{transform:translate(0,0) rotate(0deg)} 40%{transform:translate(-6px,12px) rotate(0.5deg)} 80%{transform:translate(8px,4px) rotate(-0.5deg)} 100%{transform:translate(0,0) rotate(0deg)} }
        @keyframes fc-drift-5 { 0%{transform:translate(0,0)} 35%{transform:translate(10px,-6px)} 70%{transform:translate(-4px,-12px)} 100%{transform:translate(0,0)} }
        @keyframes fc-drift-6 { 0%{transform:translate(0,0) rotate(0deg)} 50%{transform:translate(-14px,6px) rotate(1.5deg)} 100%{transform:translate(0,0) rotate(0deg)} }
        .fc-drift-1{animation:fc-drift-1 24s ease-in-out infinite}
        .fc-drift-2{animation:fc-drift-2 20s ease-in-out infinite}
        .fc-drift-3{animation:fc-drift-3 28s ease-in-out infinite}
        .fc-drift-4{animation:fc-drift-4 22s ease-in-out infinite}
        .fc-drift-5{animation:fc-drift-5 18s ease-in-out infinite}
        .fc-drift-6{animation:fc-drift-6 26s ease-in-out infinite}
        @media(prefers-reduced-motion:reduce){.fc-drift-1,.fc-drift-2,.fc-drift-3,.fc-drift-4,.fc-drift-5,.fc-drift-6{animation:none}}
      `
            }, void 0, false, {
                fileName: "[project]/workspace/pvtwo/src/components/hero/FloatingCards.tsx",
                lineNumber: 88,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/workspace/pvtwo/src/components/hero/FloatingCards.tsx",
        lineNumber: 70,
        columnNumber: 5
    }, this);
}
}),
"[project]/workspace/pvtwo/src/components/HeroBookingBar.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>HeroBookingBar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$MagnifyingGlass$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/MagnifyingGlass.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$MapPin$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/MapPin.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$CalendarBlank$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/CalendarBlank.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Users$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/Users.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$src$2f$components$2f$hero$2f$FloatingPills$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/src/components/hero/FloatingPills.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$src$2f$components$2f$hero$2f$FloatingBokeh$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/src/components/hero/FloatingBokeh.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$src$2f$components$2f$hero$2f$FloatingCards$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/src/components/hero/FloatingCards.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
function HeroBookingBar() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "relative flex min-h-screen items-end justify-center overflow-hidden",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute inset-0",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-full w-full bg-cover bg-center bg-no-repeat",
                        style: {
                            backgroundImage: "url('https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1920&q=80&auto=format')"
                        }
                    }, void 0, false, {
                        fileName: "[project]/workspace/pvtwo/src/components/HeroBookingBar.tsx",
                        lineNumber: 19,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/50"
                    }, void 0, false, {
                        fileName: "[project]/workspace/pvtwo/src/components/HeroBookingBar.tsx",
                        lineNumber: 27,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"
                    }, void 0, false, {
                        fileName: "[project]/workspace/pvtwo/src/components/HeroBookingBar.tsx",
                        lineNumber: 28,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/workspace/pvtwo/src/components/HeroBookingBar.tsx",
                lineNumber: 18,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$src$2f$components$2f$hero$2f$FloatingBokeh$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/workspace/pvtwo/src/components/HeroBookingBar.tsx",
                lineNumber: 32,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$src$2f$components$2f$hero$2f$FloatingPills$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/workspace/pvtwo/src/components/HeroBookingBar.tsx",
                lineNumber: 33,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$src$2f$components$2f$hero$2f$FloatingCards$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/workspace/pvtwo/src/components/HeroBookingBar.tsx",
                lineNumber: 34,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative z-10 mx-auto w-full max-w-[1280px] px-6 pb-16 pt-48 md:px-12 md:pb-24 lg:px-16",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].div, {
                        initial: {
                            opacity: 0,
                            y: 30
                        },
                        animate: {
                            opacity: 1,
                            y: 0
                        },
                        transition: {
                            duration: 0.8,
                            delay: 0.2,
                            ease: [
                                0.16,
                                1,
                                0.3,
                                1
                            ]
                        },
                        className: "mb-10 md:mb-14",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-hero max-w-2xl text-white",
                                children: [
                                    "Stay somewhere",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                        fileName: "[project]/workspace/pvtwo/src/components/HeroBookingBar.tsx",
                                        lineNumber: 47,
                                        columnNumber: 13
                                    }, this),
                                    "worth remembering"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/workspace/pvtwo/src/components/HeroBookingBar.tsx",
                                lineNumber: 45,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-4 max-w-lg text-lg leading-relaxed text-white/80 md:text-xl",
                                children: "Vacation homes and furnished residences, handpicked for people who notice the details."
                            }, void 0, false, {
                                fileName: "[project]/workspace/pvtwo/src/components/HeroBookingBar.tsx",
                                lineNumber: 50,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/workspace/pvtwo/src/components/HeroBookingBar.tsx",
                        lineNumber: 39,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].div, {
                        initial: {
                            opacity: 0,
                            y: 30
                        },
                        animate: {
                            opacity: 1,
                            y: 0
                        },
                        transition: {
                            duration: 0.6,
                            delay: 0.5,
                            ease: [
                                0.16,
                                1,
                                0.3,
                                1
                            ]
                        },
                        className: "frosted w-full rounded-[var(--radius-lg)] p-2 shadow-xl md:p-3",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-col gap-2 md:flex-row md:items-center md:gap-0",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "group flex flex-1 items-center gap-3 rounded-[var(--radius-md)] px-4 py-3 transition-colors duration-200 hover:bg-white/60 md:border-r md:border-warm-gray-200",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$MapPin$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MapPin"], {
                                            size: 20,
                                            weight: "bold",
                                            className: "shrink-0 text-brand"
                                        }, void 0, false, {
                                            fileName: "[project]/workspace/pvtwo/src/components/HeroBookingBar.tsx",
                                            lineNumber: 66,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex-1",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "text-label text-text-tertiary",
                                                    children: "Location"
                                                }, void 0, false, {
                                                    fileName: "[project]/workspace/pvtwo/src/components/HeroBookingBar.tsx",
                                                    lineNumber: 72,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "text",
                                                    placeholder: "Where to?",
                                                    className: "mt-0.5 block w-full bg-transparent text-sm font-medium text-text-primary outline-none placeholder:text-text-tertiary"
                                                }, void 0, false, {
                                                    fileName: "[project]/workspace/pvtwo/src/components/HeroBookingBar.tsx",
                                                    lineNumber: 75,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/workspace/pvtwo/src/components/HeroBookingBar.tsx",
                                            lineNumber: 71,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/workspace/pvtwo/src/components/HeroBookingBar.tsx",
                                    lineNumber: 65,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "group flex flex-1 items-center gap-3 rounded-[var(--radius-md)] px-4 py-3 transition-colors duration-200 hover:bg-white/60 md:border-r md:border-warm-gray-200",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$CalendarBlank$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CalendarBlank"], {
                                            size: 20,
                                            weight: "bold",
                                            className: "shrink-0 text-brand"
                                        }, void 0, false, {
                                            fileName: "[project]/workspace/pvtwo/src/components/HeroBookingBar.tsx",
                                            lineNumber: 85,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex-1",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "text-label text-text-tertiary",
                                                    children: "Check in"
                                                }, void 0, false, {
                                                    fileName: "[project]/workspace/pvtwo/src/components/HeroBookingBar.tsx",
                                                    lineNumber: 91,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "text",
                                                    placeholder: "Add date",
                                                    className: "mt-0.5 block w-full bg-transparent text-sm font-medium text-text-primary outline-none placeholder:text-text-tertiary"
                                                }, void 0, false, {
                                                    fileName: "[project]/workspace/pvtwo/src/components/HeroBookingBar.tsx",
                                                    lineNumber: 94,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/workspace/pvtwo/src/components/HeroBookingBar.tsx",
                                            lineNumber: 90,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/workspace/pvtwo/src/components/HeroBookingBar.tsx",
                                    lineNumber: 84,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "group flex flex-1 items-center gap-3 rounded-[var(--radius-md)] px-4 py-3 transition-colors duration-200 hover:bg-white/60 md:border-r md:border-warm-gray-200",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$CalendarBlank$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CalendarBlank"], {
                                            size: 20,
                                            weight: "bold",
                                            className: "shrink-0 text-brand"
                                        }, void 0, false, {
                                            fileName: "[project]/workspace/pvtwo/src/components/HeroBookingBar.tsx",
                                            lineNumber: 104,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex-1",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "text-label text-text-tertiary",
                                                    children: "Check out"
                                                }, void 0, false, {
                                                    fileName: "[project]/workspace/pvtwo/src/components/HeroBookingBar.tsx",
                                                    lineNumber: 110,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "text",
                                                    placeholder: "Add date",
                                                    className: "mt-0.5 block w-full bg-transparent text-sm font-medium text-text-primary outline-none placeholder:text-text-tertiary"
                                                }, void 0, false, {
                                                    fileName: "[project]/workspace/pvtwo/src/components/HeroBookingBar.tsx",
                                                    lineNumber: 113,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/workspace/pvtwo/src/components/HeroBookingBar.tsx",
                                            lineNumber: 109,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/workspace/pvtwo/src/components/HeroBookingBar.tsx",
                                    lineNumber: 103,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "group flex flex-1 items-center gap-3 rounded-[var(--radius-md)] px-4 py-3 transition-colors duration-200 hover:bg-white/60",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Users$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Users"], {
                                            size: 20,
                                            weight: "bold",
                                            className: "shrink-0 text-brand"
                                        }, void 0, false, {
                                            fileName: "[project]/workspace/pvtwo/src/components/HeroBookingBar.tsx",
                                            lineNumber: 123,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex-1",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "text-label text-text-tertiary",
                                                    children: "Guests"
                                                }, void 0, false, {
                                                    fileName: "[project]/workspace/pvtwo/src/components/HeroBookingBar.tsx",
                                                    lineNumber: 129,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "text",
                                                    placeholder: "Add guests",
                                                    className: "mt-0.5 block w-full bg-transparent text-sm font-medium text-text-primary outline-none placeholder:text-text-tertiary"
                                                }, void 0, false, {
                                                    fileName: "[project]/workspace/pvtwo/src/components/HeroBookingBar.tsx",
                                                    lineNumber: 130,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/workspace/pvtwo/src/components/HeroBookingBar.tsx",
                                            lineNumber: 128,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/workspace/pvtwo/src/components/HeroBookingBar.tsx",
                                    lineNumber: 122,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-gradient-to-r from-brand-light to-brand px-6 py-4 text-sm font-semibold text-white transition-opacity duration-300 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand md:ml-2 md:px-8",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$MagnifyingGlass$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MagnifyingGlass"], {
                                            size: 18,
                                            weight: "bold"
                                        }, void 0, false, {
                                            fileName: "[project]/workspace/pvtwo/src/components/HeroBookingBar.tsx",
                                            lineNumber: 140,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: "Search"
                                        }, void 0, false, {
                                            fileName: "[project]/workspace/pvtwo/src/components/HeroBookingBar.tsx",
                                            lineNumber: 141,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/workspace/pvtwo/src/components/HeroBookingBar.tsx",
                                    lineNumber: 139,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/workspace/pvtwo/src/components/HeroBookingBar.tsx",
                            lineNumber: 63,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/workspace/pvtwo/src/components/HeroBookingBar.tsx",
                        lineNumber: 57,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/workspace/pvtwo/src/components/HeroBookingBar.tsx",
                lineNumber: 37,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/workspace/pvtwo/src/components/HeroBookingBar.tsx",
        lineNumber: 16,
        columnNumber: 5
    }, this);
}
}),
"[project]/workspace/pvtwo/src/components/Marquee.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Marquee
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
;
function Marquee({ children, speed = 40, direction = "left", pauseOnHover = true, fadeEdges = true, fadeWidth = 80, gap = 48 }) {
    const stripRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [animDuration, setAnimDuration] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(30);
    const animId = `marquee${(0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useId"])().replace(/:/g, "")}`;
    const measure = (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        if (!stripRef.current) return;
        const kids = stripRef.current.children;
        if (kids.length === 0) return;
        let totalWidth = 0;
        const half = Math.floor(kids.length / 2);
        for(let i = 0; i < half; i++){
            totalWidth += kids[i].offsetWidth + gap;
        }
        if (totalWidth > 0 && speed > 0) {
            setAnimDuration(totalWidth / speed);
        }
    }, [
        speed,
        gap
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const raf = requestAnimationFrame(()=>{
            measure();
        });
        const resizeObserver = new ResizeObserver(measure);
        if (stripRef.current) {
            resizeObserver.observe(stripRef.current);
        }
        return ()=>{
            cancelAnimationFrame(raf);
            resizeObserver.disconnect();
        };
    }, [
        measure
    ]);
    const fadeMask = fadeEdges ? `linear-gradient(to right, transparent, black ${fadeWidth}px, black calc(100% - ${fadeWidth}px), transparent)` : undefined;
    const translateFrom = direction === "left" ? "0" : "-50%";
    const translateTo = direction === "left" ? "-50%" : "0";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: pauseOnHover ? `${animId}-hover` : undefined,
        style: {
            overflow: "hidden",
            maskImage: fadeMask,
            WebkitMaskImage: fadeMask
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                ref: stripRef,
                className: `${animId}-strip`,
                style: {
                    display: "flex",
                    width: "max-content",
                    gap: `${gap}px`,
                    animation: `${animId} ${animDuration}s linear infinite`
                },
                children: [
                    children,
                    children
                ]
            }, void 0, true, {
                fileName: "[project]/workspace/pvtwo/src/components/Marquee.tsx",
                lineNumber: 74,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("style", {
                children: `
        @keyframes ${animId} {
          from { transform: translateX(${translateFrom}); }
          to { transform: translateX(${translateTo}); }
        }
        .${animId}-hover:hover .${animId}-strip {
          animation-play-state: paused;
        }
      `
            }, void 0, false, {
                fileName: "[project]/workspace/pvtwo/src/components/Marquee.tsx",
                lineNumber: 88,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/workspace/pvtwo/src/components/Marquee.tsx",
        lineNumber: 66,
        columnNumber: 5
    }, this);
}
}),
"[project]/workspace/pvtwo/src/components/TrustedPlatforms.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>TrustedPlatforms
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$src$2f$components$2f$Marquee$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/src/components/Marquee.tsx [app-ssr] (ecmascript)");
"use client";
;
;
const ROW_1 = [
    {
        name: "Airbnb",
        src: "/images/platforms/airbnb.svg"
    },
    {
        name: "Vrbo",
        src: "/images/platforms/vrbo.svg"
    },
    {
        name: "Booking.com",
        src: "/images/platforms/booking.svg"
    },
    {
        name: "Furnished Finder",
        src: "/images/platforms/furnished-finder.svg"
    },
    {
        name: "Hospitable",
        src: "/images/platforms/hospitable.svg"
    },
    {
        name: "Turno",
        src: "/images/platforms/turno-tm.png"
    },
    {
        name: "TurboTenant",
        src: "/images/platforms/turbotenant.svg"
    },
    {
        name: "Marriott Bonvoy",
        src: "/images/platforms/marriott.svg"
    },
    {
        name: "KAYAK",
        src: "/images/platforms/kayak.svg"
    }
];
const ROW_2 = [
    {
        name: "HomeToGo",
        src: "/images/platforms/hometogo.svg"
    },
    {
        name: "Holidu",
        src: "/images/platforms/holidu.svg"
    },
    {
        name: "Trivago",
        src: "/images/platforms/trivago.svg"
    },
    {
        name: "HousingAnywhere",
        src: "/images/platforms/housinganywhere.svg"
    },
    {
        name: "Plum Guide",
        src: "/images/platforms/plum-guide.svg"
    },
    {
        name: "Hipcamp",
        src: "/images/platforms/hipcamp.png"
    },
    {
        name: "ALE Solutions",
        src: "/images/platforms/ale-solutions.svg"
    },
    {
        name: "Alacrity",
        src: "/images/platforms/alacrity.svg"
    }
];
function TrustedPlatforms() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "py-10 md:py-14",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-label text-center mb-8 text-warm-gray-400",
                children: "Trusted by property managers listing on"
            }, void 0, false, {
                fileName: "[project]/workspace/pvtwo/src/components/TrustedPlatforms.tsx",
                lineNumber: 31,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$src$2f$components$2f$Marquee$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                speed: 30,
                direction: "left",
                pauseOnHover: true,
                fadeEdges: true,
                fadeWidth: 80,
                gap: 64,
                children: ROW_1.map((platform)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                        src: platform.src,
                        alt: platform.name,
                        className: "trust-logo",
                        style: {
                            height: "36px",
                            width: "auto",
                            objectFit: "contain",
                            flexShrink: 0,
                            transition: "opacity 0.3s ease"
                        }
                    }, platform.name, false, {
                        fileName: "[project]/workspace/pvtwo/src/components/TrustedPlatforms.tsx",
                        lineNumber: 37,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/workspace/pvtwo/src/components/TrustedPlatforms.tsx",
                lineNumber: 35,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "h-7"
            }, void 0, false, {
                fileName: "[project]/workspace/pvtwo/src/components/TrustedPlatforms.tsx",
                lineNumber: 53,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$src$2f$components$2f$Marquee$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                speed: 25,
                direction: "right",
                pauseOnHover: true,
                fadeEdges: true,
                fadeWidth: 80,
                gap: 64,
                children: ROW_2.map((platform)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                        src: platform.src,
                        alt: platform.name,
                        className: "trust-logo",
                        style: {
                            height: "36px",
                            width: "auto",
                            objectFit: "contain",
                            flexShrink: 0,
                            transition: "opacity 0.3s ease"
                        }
                    }, platform.name, false, {
                        fileName: "[project]/workspace/pvtwo/src/components/TrustedPlatforms.tsx",
                        lineNumber: 57,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/workspace/pvtwo/src/components/TrustedPlatforms.tsx",
                lineNumber: 55,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("style", {
                children: `
        .trust-logo {
          opacity: 0.55;
        }
        .trust-logo:hover {
          opacity: 1 !important;
        }
      `
            }, void 0, false, {
                fileName: "[project]/workspace/pvtwo/src/components/TrustedPlatforms.tsx",
                lineNumber: 73,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/workspace/pvtwo/src/components/TrustedPlatforms.tsx",
        lineNumber: 30,
        columnNumber: 5
    }, this);
}
}),
"[project]/workspace/pvtwo/src/components/PropertyCard.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PropertyCard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/next/image.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Star$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/Star.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$MapPin$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/MapPin.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Users$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/Users.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$WifiHigh$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/WifiHigh.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Heart$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/Heart.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-ssr] (ecmascript)");
"use client";
;
;
;
;
function PropertyCard({ property, index = 0 }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].article, {
        initial: {
            opacity: 0,
            y: 30
        },
        whileInView: {
            opacity: 1,
            y: 0
        },
        viewport: {
            once: true,
            amount: 0.15
        },
        transition: {
            duration: 0.5,
            delay: index * 0.06,
            ease: [
                0.16,
                1,
                0.3,
                1
            ]
        },
        className: "group cursor-pointer",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative aspect-[3/2] overflow-hidden rounded-[var(--radius-md)]",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        src: property.image,
                        alt: property.name,
                        fill: true,
                        sizes: "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw",
                        className: "object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                    }, void 0, false, {
                        fileName: "[project]/workspace/pvtwo/src/components/PropertyCard.tsx",
                        lineNumber: 41,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm transition-transform duration-300 hover:scale-110",
                        "aria-label": "Save to favorites",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Heart$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Heart"], {
                            size: 18,
                            weight: "bold",
                            className: "text-text-primary"
                        }, void 0, false, {
                            fileName: "[project]/workspace/pvtwo/src/components/PropertyCard.tsx",
                            lineNumber: 54,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/workspace/pvtwo/src/components/PropertyCard.tsx",
                        lineNumber: 50,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute top-3 left-3",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-label rounded-full bg-white/90 px-3 py-1.5 text-[10px] backdrop-blur-sm",
                            children: property.type === "vacation" ? "Vacation" : "Corporate"
                        }, void 0, false, {
                            fileName: "[project]/workspace/pvtwo/src/components/PropertyCard.tsx",
                            lineNumber: 59,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/workspace/pvtwo/src/components/PropertyCard.tsx",
                        lineNumber: 58,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute bottom-3 left-3",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "rounded-[var(--radius-sm)] bg-white/90 px-3 py-1.5 text-sm font-bold text-text-primary backdrop-blur-sm",
                            children: [
                                "$",
                                property.price,
                                " ",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-xs font-normal text-text-secondary",
                                    children: "/night"
                                }, void 0, false, {
                                    fileName: "[project]/workspace/pvtwo/src/components/PropertyCard.tsx",
                                    lineNumber: 68,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/workspace/pvtwo/src/components/PropertyCard.tsx",
                            lineNumber: 66,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/workspace/pvtwo/src/components/PropertyCard.tsx",
                        lineNumber: 65,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/workspace/pvtwo/src/components/PropertyCard.tsx",
                lineNumber: 40,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-3 space-y-1.5",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-start justify-between gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-base font-semibold text-text-primary leading-snug group-hover:text-brand transition-colors duration-300",
                                children: property.name
                            }, void 0, false, {
                                fileName: "[project]/workspace/pvtwo/src/components/PropertyCard.tsx",
                                lineNumber: 78,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex shrink-0 items-center gap-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Star$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Star"], {
                                        size: 14,
                                        weight: "fill",
                                        className: "text-star"
                                    }, void 0, false, {
                                        fileName: "[project]/workspace/pvtwo/src/components/PropertyCard.tsx",
                                        lineNumber: 82,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-sm font-medium text-text-primary",
                                        children: property.rating
                                    }, void 0, false, {
                                        fileName: "[project]/workspace/pvtwo/src/components/PropertyCard.tsx",
                                        lineNumber: 83,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xs text-text-tertiary",
                                        children: [
                                            "(",
                                            property.reviewCount,
                                            ")"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/workspace/pvtwo/src/components/PropertyCard.tsx",
                                        lineNumber: 86,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/workspace/pvtwo/src/components/PropertyCard.tsx",
                                lineNumber: 81,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/workspace/pvtwo/src/components/PropertyCard.tsx",
                        lineNumber: 77,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-1.5 text-sm text-text-secondary",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$MapPin$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MapPin"], {
                                size: 14,
                                weight: "bold",
                                className: "shrink-0 text-text-tertiary"
                            }, void 0, false, {
                                fileName: "[project]/workspace/pvtwo/src/components/PropertyCard.tsx",
                                lineNumber: 93,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: property.location
                            }, void 0, false, {
                                fileName: "[project]/workspace/pvtwo/src/components/PropertyCard.tsx",
                                lineNumber: 94,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/workspace/pvtwo/src/components/PropertyCard.tsx",
                        lineNumber: 92,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-3 text-xs text-text-tertiary",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "flex items-center gap-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Users$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Users"], {
                                        size: 13,
                                        weight: "bold"
                                    }, void 0, false, {
                                        fileName: "[project]/workspace/pvtwo/src/components/PropertyCard.tsx",
                                        lineNumber: 99,
                                        columnNumber: 13
                                    }, this),
                                    property.maxGuests,
                                    " guests"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/workspace/pvtwo/src/components/PropertyCard.tsx",
                                lineNumber: 98,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    property.bedrooms,
                                    " ",
                                    property.bedrooms === 1 ? "bedroom" : "bedrooms"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/workspace/pvtwo/src/components/PropertyCard.tsx",
                                lineNumber: 102,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "flex items-center gap-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$WifiHigh$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WifiHigh"], {
                                        size: 13,
                                        weight: "bold"
                                    }, void 0, false, {
                                        fileName: "[project]/workspace/pvtwo/src/components/PropertyCard.tsx",
                                        lineNumber: 104,
                                        columnNumber: 13
                                    }, this),
                                    "Wi-Fi"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/workspace/pvtwo/src/components/PropertyCard.tsx",
                                lineNumber: 103,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/workspace/pvtwo/src/components/PropertyCard.tsx",
                        lineNumber: 97,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/workspace/pvtwo/src/components/PropertyCard.tsx",
                lineNumber: 76,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/workspace/pvtwo/src/components/PropertyCard.tsx",
        lineNumber: 28,
        columnNumber: 5
    }, this);
}
}),
"[project]/workspace/pvtwo/src/components/ScrollReveal.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ScrollReveal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-ssr] (ecmascript)");
"use client";
;
;
function ScrollReveal({ children, delay = 0, className = "" }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].div, {
        initial: {
            opacity: 0,
            y: 40
        },
        whileInView: {
            opacity: 1,
            y: 0
        },
        viewport: {
            once: true,
            amount: 0.2
        },
        transition: {
            duration: 0.6,
            delay,
            ease: [
                0.16,
                1,
                0.3,
                1
            ]
        },
        className: className,
        children: children
    }, void 0, false, {
        fileName: "[project]/workspace/pvtwo/src/components/ScrollReveal.tsx",
        lineNumber: 18,
        columnNumber: 5
    }, this);
}
}),
"[project]/workspace/pvtwo/src/components/PropertiesSection.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PropertiesSection
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$src$2f$components$2f$PropertyCard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/src/components/PropertyCard.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$src$2f$components$2f$ScrollReveal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/src/components/ScrollReveal.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
;
const PLACEHOLDER_PROPERTIES = [
    {
        id: "1",
        name: "Lakeside Villa with Private Dock",
        location: "Lake Tahoe, CA",
        price: 420,
        rating: 4.9,
        reviewCount: 87,
        maxGuests: 8,
        bedrooms: 4,
        image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80&auto=format",
        type: "vacation",
        featured: true
    },
    {
        id: "2",
        name: "Downtown Executive Suite",
        location: "Austin, TX",
        price: 185,
        rating: 4.8,
        reviewCount: 124,
        maxGuests: 2,
        bedrooms: 1,
        image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80&auto=format",
        type: "corporate"
    },
    {
        id: "3",
        name: "Mountain Retreat with Hot Tub",
        location: "Breckenridge, CO",
        price: 375,
        rating: 4.9,
        reviewCount: 56,
        maxGuests: 6,
        bedrooms: 3,
        image: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&q=80&auto=format",
        type: "vacation"
    },
    {
        id: "4",
        name: "Modern Furnished Loft",
        location: "Nashville, TN",
        price: 165,
        rating: 4.7,
        reviewCount: 203,
        maxGuests: 4,
        bedrooms: 2,
        image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80&auto=format",
        type: "corporate"
    },
    {
        id: "5",
        name: "Beachfront Bungalow",
        location: "Destin, FL",
        price: 310,
        rating: 4.8,
        reviewCount: 142,
        maxGuests: 6,
        bedrooms: 3,
        image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80&auto=format",
        type: "vacation",
        featured: true
    },
    {
        id: "6",
        name: "Corporate Park Residence",
        location: "Denver, CO",
        price: 145,
        rating: 4.6,
        reviewCount: 89,
        maxGuests: 3,
        bedrooms: 2,
        image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80&auto=format",
        type: "corporate"
    }
];
const FILTERS = [
    "All",
    "Vacation",
    "Corporate",
    "Featured"
];
function PropertiesSection() {
    const [activeFilter, setActiveFilter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("All");
    const filtered = PLACEHOLDER_PROPERTIES.filter((p)=>{
        if (activeFilter === "All") return true;
        if (activeFilter === "Featured") return p.featured;
        return p.type === activeFilter.toLowerCase();
    });
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        id: "properties",
        className: "bg-white py-24 md:py-32",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mx-auto max-w-[1280px] px-6 md:px-12 lg:px-16",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$src$2f$components$2f$ScrollReveal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-label text-brand",
                            children: "Properties"
                        }, void 0, false, {
                            fileName: "[project]/workspace/pvtwo/src/components/PropertiesSection.tsx",
                            lineNumber: 99,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "text-h2 mt-3 text-text-primary",
                            children: "Places worth coming back to"
                        }, void 0, false, {
                            fileName: "[project]/workspace/pvtwo/src/components/PropertiesSection.tsx",
                            lineNumber: 100,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "mt-3 max-w-lg text-base leading-relaxed text-text-secondary md:text-lg",
                            children: "From weekend escapes to extended corporate stays. Every property verified, every detail considered."
                        }, void 0, false, {
                            fileName: "[project]/workspace/pvtwo/src/components/PropertiesSection.tsx",
                            lineNumber: 103,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/workspace/pvtwo/src/components/PropertiesSection.tsx",
                    lineNumber: 98,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$src$2f$components$2f$ScrollReveal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                    delay: 0.1,
                    className: "mt-8",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-wrap gap-2",
                        children: FILTERS.map((filter)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setActiveFilter(filter),
                                className: `rounded-full px-5 py-2 text-sm font-medium transition-all duration-300 ${activeFilter === filter ? "bg-gradient-to-r from-brand-light to-brand text-white shadow-md" : "bg-warm-gray-50 text-text-secondary hover:bg-warm-gray-100 hover:text-text-primary"}`,
                                children: filter
                            }, filter, false, {
                                fileName: "[project]/workspace/pvtwo/src/components/PropertiesSection.tsx",
                                lineNumber: 113,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/workspace/pvtwo/src/components/PropertiesSection.tsx",
                        lineNumber: 111,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/workspace/pvtwo/src/components/PropertiesSection.tsx",
                    lineNumber: 110,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8",
                    children: filtered.map((property, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$src$2f$components$2f$PropertyCard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                            property: property,
                            index: i
                        }, property.id, false, {
                            fileName: "[project]/workspace/pvtwo/src/components/PropertiesSection.tsx",
                            lineNumber: 131,
                            columnNumber: 13
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/workspace/pvtwo/src/components/PropertiesSection.tsx",
                    lineNumber: 129,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$src$2f$components$2f$ScrollReveal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                    delay: 0.2,
                    className: "mt-12 text-center",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                        href: "/properties",
                        className: "inline-flex items-center gap-2 rounded-full border border-warm-gray-200 px-8 py-3 text-sm font-semibold text-text-primary transition-all duration-300 hover:border-brand hover:text-brand",
                        children: "View all properties"
                    }, void 0, false, {
                        fileName: "[project]/workspace/pvtwo/src/components/PropertiesSection.tsx",
                        lineNumber: 137,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/workspace/pvtwo/src/components/PropertiesSection.tsx",
                    lineNumber: 136,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/workspace/pvtwo/src/components/PropertiesSection.tsx",
            lineNumber: 97,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/workspace/pvtwo/src/components/PropertiesSection.tsx",
        lineNumber: 96,
        columnNumber: 5
    }, this);
}
}),
"[project]/workspace/pvtwo/src/components/CategoriesSection.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>CategoriesSection
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$House$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/House.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Buildings$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/Buildings.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$src$2f$components$2f$ScrollReveal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/src/components/ScrollReveal.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
const CATEGORIES = [
    {
        title: "Vacation Rentals",
        description: "Cabins, villas, and retreats for your next getaway.",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$House$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["House"],
        image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80&auto=format",
        count: "8+"
    },
    {
        title: "Corporate Residences",
        description: "Furnished homes for business travel and relocations.",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Buildings$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Buildings"],
        image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80&auto=format",
        count: "5+"
    }
];
function CategoriesSection() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "bg-warm-gray-50 py-24 md:py-32",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mx-auto max-w-[1280px] px-6 md:px-12 lg:px-16",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$src$2f$components$2f$ScrollReveal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-label text-brand",
                            children: "Stay your way"
                        }, void 0, false, {
                            fileName: "[project]/workspace/pvtwo/src/components/CategoriesSection.tsx",
                            lineNumber: 30,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "text-h2 mt-3 text-text-primary",
                            children: "Two ways to book"
                        }, void 0, false, {
                            fileName: "[project]/workspace/pvtwo/src/components/CategoriesSection.tsx",
                            lineNumber: 31,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/workspace/pvtwo/src/components/CategoriesSection.tsx",
                    lineNumber: 29,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8",
                    children: CATEGORIES.map((cat, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$src$2f$components$2f$ScrollReveal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                            delay: i * 0.1,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                href: "/properties",
                                className: "group relative block overflow-hidden rounded-[var(--radius-xl)] bg-white shadow-card transition-shadow duration-500 hover:shadow-lg",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "relative aspect-[16/9] overflow-hidden",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "h-full w-full bg-cover bg-center transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]",
                                                style: {
                                                    backgroundImage: `url('${cat.image}')`
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/workspace/pvtwo/src/components/CategoriesSection.tsx",
                                                lineNumber: 43,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent"
                                            }, void 0, false, {
                                                fileName: "[project]/workspace/pvtwo/src/components/CategoriesSection.tsx",
                                                lineNumber: 47,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "absolute top-4 right-4",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-text-primary backdrop-blur-sm",
                                                    children: [
                                                        cat.count,
                                                        " properties"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/workspace/pvtwo/src/components/CategoriesSection.tsx",
                                                    lineNumber: 51,
                                                    columnNumber: 21
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/workspace/pvtwo/src/components/CategoriesSection.tsx",
                                                lineNumber: 50,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/workspace/pvtwo/src/components/CategoriesSection.tsx",
                                        lineNumber: 42,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "p-6 md:p-8",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-3",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-gradient-to-r from-brand-light/10 to-brand/10",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(cat.icon, {
                                                            size: 22,
                                                            weight: "bold",
                                                            className: "text-brand"
                                                        }, void 0, false, {
                                                            fileName: "[project]/workspace/pvtwo/src/components/CategoriesSection.tsx",
                                                            lineNumber: 61,
                                                            columnNumber: 23
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/workspace/pvtwo/src/components/CategoriesSection.tsx",
                                                        lineNumber: 60,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                        className: "text-h3 text-text-primary",
                                                        children: cat.title
                                                    }, void 0, false, {
                                                        fileName: "[project]/workspace/pvtwo/src/components/CategoriesSection.tsx",
                                                        lineNumber: 67,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/workspace/pvtwo/src/components/CategoriesSection.tsx",
                                                lineNumber: 59,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "mt-3 text-base leading-relaxed text-text-secondary",
                                                children: cat.description
                                            }, void 0, false, {
                                                fileName: "[project]/workspace/pvtwo/src/components/CategoriesSection.tsx",
                                                lineNumber: 69,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/workspace/pvtwo/src/components/CategoriesSection.tsx",
                                        lineNumber: 58,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/workspace/pvtwo/src/components/CategoriesSection.tsx",
                                lineNumber: 37,
                                columnNumber: 15
                            }, this)
                        }, cat.title, false, {
                            fileName: "[project]/workspace/pvtwo/src/components/CategoriesSection.tsx",
                            lineNumber: 36,
                            columnNumber: 13
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/workspace/pvtwo/src/components/CategoriesSection.tsx",
                    lineNumber: 34,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/workspace/pvtwo/src/components/CategoriesSection.tsx",
            lineNumber: 28,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/workspace/pvtwo/src/components/CategoriesSection.tsx",
        lineNumber: 27,
        columnNumber: 5
    }, this);
}
}),
"[project]/workspace/pvtwo/src/components/StatsSection.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>StatsSection
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$utils$2f$use$2d$in$2d$view$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/framer-motion/dist/es/utils/use-in-view.mjs [app-ssr] (ecmascript)");
"use client";
;
;
;
const STATS = [
    {
        value: "10+",
        label: "Properties"
    },
    {
        value: "500+",
        label: "Guests hosted"
    },
    {
        value: "5+",
        label: "Cities"
    },
    {
        value: "4.9",
        label: "Avg. rating"
    }
];
function StatsSection() {
    const ref = (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const inView = (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$utils$2f$use$2d$in$2d$view$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useInView"])(ref, {
        once: true,
        amount: 0.4
    });
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "bg-white py-20 md:py-24",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            ref: ref,
            className: "mx-auto max-w-[1280px] px-6 md:px-12 lg:px-16",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].p, {
                    initial: {
                        opacity: 0
                    },
                    animate: inView ? {
                        opacity: 1
                    } : {
                        opacity: 0
                    },
                    transition: {
                        duration: 0.4
                    },
                    className: "text-label text-brand",
                    children: "By the numbers"
                }, void 0, false, {
                    fileName: "[project]/workspace/pvtwo/src/components/StatsSection.tsx",
                    lineNumber: 23,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-8 grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-12",
                    children: STATS.map((stat, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].div, {
                            initial: {
                                opacity: 0,
                                y: 20
                            },
                            animate: inView ? {
                                opacity: 1,
                                y: 0
                            } : {
                                opacity: 0,
                                y: 20
                            },
                            transition: {
                                duration: 0.5,
                                delay: i * 0.1,
                                ease: [
                                    0.16,
                                    1,
                                    0.3,
                                    1
                                ]
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-4xl font-bold tracking-tight text-text-primary md:text-5xl",
                                    children: stat.value
                                }, void 0, false, {
                                    fileName: "[project]/workspace/pvtwo/src/components/StatsSection.tsx",
                                    lineNumber: 46,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "mt-2 text-sm text-text-secondary",
                                    children: stat.label
                                }, void 0, false, {
                                    fileName: "[project]/workspace/pvtwo/src/components/StatsSection.tsx",
                                    lineNumber: 49,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, stat.label, true, {
                            fileName: "[project]/workspace/pvtwo/src/components/StatsSection.tsx",
                            lineNumber: 34,
                            columnNumber: 13
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/workspace/pvtwo/src/components/StatsSection.tsx",
                    lineNumber: 32,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/workspace/pvtwo/src/components/StatsSection.tsx",
            lineNumber: 19,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/workspace/pvtwo/src/components/StatsSection.tsx",
        lineNumber: 18,
        columnNumber: 5
    }, this);
}
}),
"[project]/workspace/pvtwo/src/components/HowItWorksSection.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>HowItWorksSection
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$MagnifyingGlass$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/MagnifyingGlass.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$CheckCircle$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/CheckCircle.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$CalendarCheck$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/CalendarCheck.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$src$2f$components$2f$ScrollReveal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/src/components/ScrollReveal.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
const STEPS = [
    {
        number: "01",
        title: "Search",
        description: "Pick your dates, location, and number of guests.",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$MagnifyingGlass$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MagnifyingGlass"]
    },
    {
        number: "02",
        title: "Choose",
        description: "Browse verified properties with real photos and honest descriptions.",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$CheckCircle$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CheckCircle"]
    },
    {
        number: "03",
        title: "Book",
        description: "Confirm your stay. Flexible cancellation included.",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$CalendarCheck$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CalendarCheck"]
    }
];
function HowItWorksSection() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "bg-warm-gray-50 py-24 md:py-32",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mx-auto max-w-[1280px] px-6 md:px-12 lg:px-16",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$src$2f$components$2f$ScrollReveal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-label text-brand",
                            children: "How it works"
                        }, void 0, false, {
                            fileName: "[project]/workspace/pvtwo/src/components/HowItWorksSection.tsx",
                            lineNumber: 37,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "text-h2 mt-3 text-text-primary",
                            children: "Book in three steps"
                        }, void 0, false, {
                            fileName: "[project]/workspace/pvtwo/src/components/HowItWorksSection.tsx",
                            lineNumber: 38,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/workspace/pvtwo/src/components/HowItWorksSection.tsx",
                    lineNumber: 36,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-12 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-12",
                    children: STEPS.map((step, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$src$2f$components$2f$ScrollReveal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                            delay: i * 0.1,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "relative",
                                children: [
                                    i < STEPS.length - 1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "absolute top-10 right-0 hidden h-[1px] w-full translate-x-1/2 bg-warm-gray-200 md:block"
                                    }, void 0, false, {
                                        fileName: "[project]/workspace/pvtwo/src/components/HowItWorksSection.tsx",
                                        lineNumber: 49,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex h-16 w-16 items-center justify-center rounded-[var(--radius-md)] bg-white shadow-card",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(step.icon, {
                                            size: 28,
                                            weight: "bold",
                                            className: "text-brand"
                                        }, void 0, false, {
                                            fileName: "[project]/workspace/pvtwo/src/components/HowItWorksSection.tsx",
                                            lineNumber: 54,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/workspace/pvtwo/src/components/HowItWorksSection.tsx",
                                        lineNumber: 53,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-6 text-xs font-bold text-text-tertiary",
                                        children: step.number
                                    }, void 0, false, {
                                        fileName: "[project]/workspace/pvtwo/src/components/HowItWorksSection.tsx",
                                        lineNumber: 58,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "mt-1 text-xl font-semibold text-text-primary",
                                        children: step.title
                                    }, void 0, false, {
                                        fileName: "[project]/workspace/pvtwo/src/components/HowItWorksSection.tsx",
                                        lineNumber: 63,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-2 text-base leading-relaxed text-text-secondary",
                                        children: step.description
                                    }, void 0, false, {
                                        fileName: "[project]/workspace/pvtwo/src/components/HowItWorksSection.tsx",
                                        lineNumber: 66,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/workspace/pvtwo/src/components/HowItWorksSection.tsx",
                                lineNumber: 46,
                                columnNumber: 15
                            }, this)
                        }, step.number, false, {
                            fileName: "[project]/workspace/pvtwo/src/components/HowItWorksSection.tsx",
                            lineNumber: 45,
                            columnNumber: 13
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/workspace/pvtwo/src/components/HowItWorksSection.tsx",
                    lineNumber: 43,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/workspace/pvtwo/src/components/HowItWorksSection.tsx",
            lineNumber: 35,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/workspace/pvtwo/src/components/HowItWorksSection.tsx",
        lineNumber: 34,
        columnNumber: 5
    }, this);
}
}),
"[project]/workspace/pvtwo/src/components/TestimonialsSection.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>TestimonialsSection
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Star$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/Star.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Quotes$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/Quotes.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$src$2f$components$2f$ScrollReveal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/src/components/ScrollReveal.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
const TESTIMONIALS = [
    {
        id: "1",
        quote: "The property was exactly as described. Spotless, beautifully furnished, and in the perfect location. We extended our stay by a week.",
        name: "Sarah K.",
        location: "Denver, CO",
        rating: 5
    },
    {
        id: "2",
        quote: "I travel for work constantly and these corporate residences are a game changer. Feels like home, not a hotel room. The booking process was seamless.",
        name: "Marcus T.",
        location: "Austin, TX",
        rating: 5
    },
    {
        id: "3",
        quote: "Our family reunion at the lakeside villa was unforgettable. Eight of us had plenty of space, and the private dock was the highlight.",
        name: "Jennifer M.",
        location: "Atlanta, GA",
        rating: 5
    }
];
function TestimonialsSection() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "bg-white py-24 md:py-32",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mx-auto max-w-[1280px] px-6 md:px-12 lg:px-16",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$src$2f$components$2f$ScrollReveal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-label text-brand",
                            children: "Guest experiences"
                        }, void 0, false, {
                            fileName: "[project]/workspace/pvtwo/src/components/TestimonialsSection.tsx",
                            lineNumber: 38,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "text-h2 mt-3 text-text-primary",
                            children: "Hear from people who stayed"
                        }, void 0, false, {
                            fileName: "[project]/workspace/pvtwo/src/components/TestimonialsSection.tsx",
                            lineNumber: 39,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/workspace/pvtwo/src/components/TestimonialsSection.tsx",
                    lineNumber: 37,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-12 grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8",
                    children: TESTIMONIALS.map((t, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$src$2f$components$2f$ScrollReveal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                            delay: i * 0.08,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex h-full flex-col rounded-[var(--radius-lg)] border border-warm-gray-100 bg-white p-6 transition-shadow duration-500 hover:shadow-md md:p-8",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Quotes$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Quotes"], {
                                        size: 28,
                                        weight: "fill",
                                        className: "text-brand/20"
                                    }, void 0, false, {
                                        fileName: "[project]/workspace/pvtwo/src/components/TestimonialsSection.tsx",
                                        lineNumber: 49,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-4 flex gap-0.5",
                                        children: Array.from({
                                            length: t.rating
                                        }).map((_, j)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$Star$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Star"], {
                                                size: 16,
                                                weight: "fill",
                                                className: "text-star"
                                            }, j, false, {
                                                fileName: "[project]/workspace/pvtwo/src/components/TestimonialsSection.tsx",
                                                lineNumber: 58,
                                                columnNumber: 21
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/workspace/pvtwo/src/components/TestimonialsSection.tsx",
                                        lineNumber: 56,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-4 flex-1 text-base leading-relaxed text-text-secondary",
                                        children: [
                                            "“",
                                            t.quote,
                                            "”"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/workspace/pvtwo/src/components/TestimonialsSection.tsx",
                                        lineNumber: 68,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-6 flex items-center gap-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-brand-light to-brand text-sm font-bold text-white",
                                                children: t.name.charAt(0)
                                            }, void 0, false, {
                                                fileName: "[project]/workspace/pvtwo/src/components/TestimonialsSection.tsx",
                                                lineNumber: 74,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-sm font-semibold text-text-primary",
                                                        children: t.name
                                                    }, void 0, false, {
                                                        fileName: "[project]/workspace/pvtwo/src/components/TestimonialsSection.tsx",
                                                        lineNumber: 78,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-xs text-text-tertiary",
                                                        children: t.location
                                                    }, void 0, false, {
                                                        fileName: "[project]/workspace/pvtwo/src/components/TestimonialsSection.tsx",
                                                        lineNumber: 81,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/workspace/pvtwo/src/components/TestimonialsSection.tsx",
                                                lineNumber: 77,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/workspace/pvtwo/src/components/TestimonialsSection.tsx",
                                        lineNumber: 73,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/workspace/pvtwo/src/components/TestimonialsSection.tsx",
                                lineNumber: 47,
                                columnNumber: 15
                            }, this)
                        }, t.id, false, {
                            fileName: "[project]/workspace/pvtwo/src/components/TestimonialsSection.tsx",
                            lineNumber: 46,
                            columnNumber: 13
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/workspace/pvtwo/src/components/TestimonialsSection.tsx",
                    lineNumber: 44,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/workspace/pvtwo/src/components/TestimonialsSection.tsx",
            lineNumber: 36,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/workspace/pvtwo/src/components/TestimonialsSection.tsx",
        lineNumber: 35,
        columnNumber: 5
    }, this);
}
}),
"[project]/workspace/pvtwo/src/components/JournalSection.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>JournalSection
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/next/image.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$ArrowRight$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/ArrowRight.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$src$2f$components$2f$ScrollReveal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/src/components/ScrollReveal.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
;
const POSTS = [
    {
        id: "1",
        title: "5 Things to Look for in a Furnished Corporate Stay",
        date: "Mar 10, 2026",
        readTime: "4 min read",
        image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80&auto=format"
    },
    {
        id: "2",
        title: "The Best Mountain Getaways for Families This Spring",
        date: "Mar 5, 2026",
        readTime: "6 min read",
        image: "https://images.unsplash.com/photo-1470770841497-7b3200f18201?w=600&q=80&auto=format"
    },
    {
        id: "3",
        title: "How to Make a Vacation Rental Feel Like Home",
        date: "Feb 28, 2026",
        readTime: "3 min read",
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80&auto=format"
    }
];
function JournalSection() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        id: "journal",
        className: "bg-warm-gray-50 py-24 md:py-32",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mx-auto max-w-[1280px] px-6 md:px-12 lg:px-16",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$src$2f$components$2f$ScrollReveal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-end justify-between",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-label text-brand",
                                        children: "Journal"
                                    }, void 0, false, {
                                        fileName: "[project]/workspace/pvtwo/src/components/JournalSection.tsx",
                                        lineNumber: 41,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "text-h2 mt-3 text-text-primary",
                                        children: "Stories from our properties"
                                    }, void 0, false, {
                                        fileName: "[project]/workspace/pvtwo/src/components/JournalSection.tsx",
                                        lineNumber: 42,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/workspace/pvtwo/src/components/JournalSection.tsx",
                                lineNumber: 40,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                href: "/blog",
                                className: "hidden items-center gap-2 text-sm font-semibold text-brand transition-opacity duration-300 hover:opacity-80 md:flex",
                                children: [
                                    "View all",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$ArrowRight$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ArrowRight"], {
                                        size: 16,
                                        weight: "bold"
                                    }, void 0, false, {
                                        fileName: "[project]/workspace/pvtwo/src/components/JournalSection.tsx",
                                        lineNumber: 51,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/workspace/pvtwo/src/components/JournalSection.tsx",
                                lineNumber: 46,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/workspace/pvtwo/src/components/JournalSection.tsx",
                        lineNumber: 39,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/workspace/pvtwo/src/components/JournalSection.tsx",
                    lineNumber: 38,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8",
                    children: POSTS.map((post, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$src$2f$components$2f$ScrollReveal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                            delay: i * 0.08,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                href: `/blog/${post.id}`,
                                className: "group block",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "relative aspect-[3/2] overflow-hidden rounded-[var(--radius-md)]",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                            src: post.image,
                                            alt: post.title,
                                            fill: true,
                                            sizes: "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw",
                                            className: "object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                                        }, void 0, false, {
                                            fileName: "[project]/workspace/pvtwo/src/components/JournalSection.tsx",
                                            lineNumber: 61,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/workspace/pvtwo/src/components/JournalSection.tsx",
                                        lineNumber: 60,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-4",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-3 text-xs text-text-tertiary",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("time", {
                                                        children: post.date
                                                    }, void 0, false, {
                                                        fileName: "[project]/workspace/pvtwo/src/components/JournalSection.tsx",
                                                        lineNumber: 72,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "h-1 w-1 rounded-full bg-warm-gray-400"
                                                    }, void 0, false, {
                                                        fileName: "[project]/workspace/pvtwo/src/components/JournalSection.tsx",
                                                        lineNumber: 73,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: post.readTime
                                                    }, void 0, false, {
                                                        fileName: "[project]/workspace/pvtwo/src/components/JournalSection.tsx",
                                                        lineNumber: 74,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/workspace/pvtwo/src/components/JournalSection.tsx",
                                                lineNumber: 71,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                className: "mt-2 text-base font-semibold leading-snug text-text-primary transition-colors duration-300 group-hover:text-brand md:text-lg",
                                                children: post.title
                                            }, void 0, false, {
                                                fileName: "[project]/workspace/pvtwo/src/components/JournalSection.tsx",
                                                lineNumber: 76,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/workspace/pvtwo/src/components/JournalSection.tsx",
                                        lineNumber: 70,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/workspace/pvtwo/src/components/JournalSection.tsx",
                                lineNumber: 59,
                                columnNumber: 15
                            }, this)
                        }, post.id, false, {
                            fileName: "[project]/workspace/pvtwo/src/components/JournalSection.tsx",
                            lineNumber: 58,
                            columnNumber: 13
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/workspace/pvtwo/src/components/JournalSection.tsx",
                    lineNumber: 56,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-10 text-center md:hidden",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                        href: "/blog",
                        className: "inline-flex items-center gap-2 text-sm font-semibold text-brand",
                        children: [
                            "View all posts",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$ArrowRight$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ArrowRight"], {
                                size: 16,
                                weight: "bold"
                            }, void 0, false, {
                                fileName: "[project]/workspace/pvtwo/src/components/JournalSection.tsx",
                                lineNumber: 92,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/workspace/pvtwo/src/components/JournalSection.tsx",
                        lineNumber: 87,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/workspace/pvtwo/src/components/JournalSection.tsx",
                    lineNumber: 86,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/workspace/pvtwo/src/components/JournalSection.tsx",
            lineNumber: 37,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/workspace/pvtwo/src/components/JournalSection.tsx",
        lineNumber: 36,
        columnNumber: 5
    }, this);
}
}),
"[project]/workspace/pvtwo/src/components/CTASection.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>CTASection
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$ArrowRight$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/node_modules/@phosphor-icons/react/dist/csr/ArrowRight.es.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$src$2f$components$2f$ScrollReveal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/workspace/pvtwo/src/components/ScrollReveal.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
function CTASection() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "bg-white py-24 md:py-32",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mx-auto max-w-[1280px] px-6 md:px-12 lg:px-16",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$src$2f$components$2f$ScrollReveal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "relative overflow-hidden rounded-[var(--radius-xl)] bg-navy px-8 py-16 text-center md:px-16 md:py-24",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "absolute inset-0 opacity-[0.03]",
                            style: {
                                backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                                backgroundSize: "32px 32px"
                            }
                        }, void 0, false, {
                            fileName: "[project]/workspace/pvtwo/src/components/CTASection.tsx",
                            lineNumber: 13,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "absolute -top-24 -right-24 h-48 w-48 rounded-full bg-brand/20 blur-[100px]"
                        }, void 0, false, {
                            fileName: "[project]/workspace/pvtwo/src/components/CTASection.tsx",
                            lineNumber: 23,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-brand-light/15 blur-[100px]"
                        }, void 0, false, {
                            fileName: "[project]/workspace/pvtwo/src/components/CTASection.tsx",
                            lineNumber: 24,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "relative",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "text-h1 mx-auto max-w-xl text-white",
                                    children: "Ready to find your next stay?"
                                }, void 0, false, {
                                    fileName: "[project]/workspace/pvtwo/src/components/CTASection.tsx",
                                    lineNumber: 27,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "mx-auto mt-4 max-w-md text-lg leading-relaxed text-white/70",
                                    children: "Browse our full collection of vacation homes and furnished residences."
                                }, void 0, false, {
                                    fileName: "[project]/workspace/pvtwo/src/components/CTASection.tsx",
                                    lineNumber: 30,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                    href: "/properties",
                                    className: "mt-8 inline-flex items-center gap-2 rounded-[var(--radius-sm)] bg-gradient-to-r from-brand-light to-brand px-8 py-3.5 text-base font-semibold text-white transition-opacity duration-300 hover:opacity-90",
                                    children: [
                                        "View all properties",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$workspace$2f$pvtwo$2f$node_modules$2f40$phosphor$2d$icons$2f$react$2f$dist$2f$csr$2f$ArrowRight$2e$es$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ArrowRight"], {
                                            size: 18,
                                            weight: "bold"
                                        }, void 0, false, {
                                            fileName: "[project]/workspace/pvtwo/src/components/CTASection.tsx",
                                            lineNumber: 39,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/workspace/pvtwo/src/components/CTASection.tsx",
                                    lineNumber: 34,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/workspace/pvtwo/src/components/CTASection.tsx",
                            lineNumber: 26,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/workspace/pvtwo/src/components/CTASection.tsx",
                    lineNumber: 11,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/workspace/pvtwo/src/components/CTASection.tsx",
                lineNumber: 10,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/workspace/pvtwo/src/components/CTASection.tsx",
            lineNumber: 9,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/workspace/pvtwo/src/components/CTASection.tsx",
        lineNumber: 8,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__8af5cfc2._.js.map