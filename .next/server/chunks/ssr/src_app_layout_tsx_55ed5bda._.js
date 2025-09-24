module.exports = {

"[project]/src/app/layout.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>LocaleLayout),
    "generateStaticParams": (()=>generateStaticParams)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$server$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$exports$3e$__ = __turbopack_context__.i("[project]/node_modules/next-intl/dist/esm/development/server.react-server.js [app-rsc] (ecmascript) <exports>");
;
function LocaleLayout({ children, params: { locale } }) {
    // Enable static rendering
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$server$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$exports$3e$__["unstable_setRequestLocale"])(locale);
    return children;
}
function generateStaticParams() {
    return [
        {
            locale: 'en'
        },
        {
            locale: 'zh'
        }
    ];
}
}}),

};

//# sourceMappingURL=src_app_layout_tsx_55ed5bda._.js.map