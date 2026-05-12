import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "cheerio";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceOrigin = "https://dfr.tokyo";
const publicOrigin = "https://demo-dfr-tokyo-douce-france-c86b05-tenma-komines-projects.vercel.app";

const pageUrls = [
  "/",
  "/time-schedule/",
  "/classe/",
  "/eiga/",
  "/decouverte/",
  "/kaiwa-kiso/",
  "/talk/",
  "/onilne-french-lesson/",
  "/professeur/",
  "/fee/",
  "/access/",
  "/self-education/",
  "/blog/",
  "/contact-2/",
  "/characteristics/",
  "/francais-lesson-reason/",
  "/decouverte-rapport/",
  "/french-basic-lesson-online/",
  "/kibun-title-eiga/",
  "/%e3%83%95%e3%83%a9%e3%83%b3%e3%82%b9%e8%aa%9e%e3%81%a7%e6%97%a5%e6%9c%ac%e3%82%92%e7%b4%b9%e4%bb%8b%e3%81%97%e3%82%88%e3%81%86/",
  "/%e6%98%a0%e7%94%bb%e3%83%86%e3%82%b9%e3%83%88/"
];

const navItems = [
  ["クラス一覧", "/time-schedule/"],
  ["レギュラークラス", "/classe/"],
  ["映画クラス", "/eiga/"],
  ["フランス文化クラス", "/decouverte/"],
  ["優しい会話", "/kaiwa-kiso/"],
  ["会話サロン", "/talk/"],
  ["オンライン講座", "/onilne-french-lesson/"],
  ["講師紹介", "/professeur/"],
  ["料金", "/fee/"],
  ["アクセス", "/access/"],
  ["無料で学習", "/self-education/"],
  ["最新お知らせ", "/blog/"],
  ["問い合わせ", "/contact-2/"]
];

const headerNavItems = [
  ["クラス", "/time-schedule/"],
  ["料金", "/fee/"],
  ["講師", "/professeur/"],
  ["アクセス", "/access/"],
  ["問い合わせ", "/contact-2/"]
];

const fallbackDescriptions = {
  "/": "オリジナルレッスンが盛り沢山のDouce Franceは、１レッスンたった４席の少人数制、小さなフランス語教室です。東京都内で駅近、アクセスも便利。オンラインレッスンは、日本全国からご参加いただいています。体験あり、入会金なし。ウェブサイトには、無料でフランス語を楽しめるコンテンツも掲載中です。"
};

function normalizeWhitespace(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function decodeSlug(urlPath) {
  const pathOnly = urlPath.replace(/^\/|\/$/g, "") || "index";
  try {
    return decodeURIComponent(pathOnly);
  } catch {
    return pathOnly;
  }
}

function filePathFor(urlPath) {
  if (urlPath === "/") return path.join(rootDir, "index.html");
  const slug = urlPath.replace(/^\/|\/$/g, "");
  return path.join(rootDir, slug, "index.html");
}

function pagePathFor(urlPath) {
  return urlPath;
}

function pageIdFor(urlPath) {
  if (urlPath === "/") return "home";
  return decodeSlug(urlPath).replace(/[^a-zA-Z0-9ぁ-んァ-ヶ一-龠]+/g, "-").replace(/^-|-$/g, "") || "page";
}

function sourceUrl(pathname) {
  return new URL(pathname, sourceOrigin).toString();
}

function rewriteLinks($) {
  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (!href) return;
    if (href.startsWith(sourceOrigin)) {
      const url = new URL(href);
      $(element).attr("href", url.pathname + url.search + url.hash);
    }
  });

  $("img[src]").each((_, element) => {
    const src = $(element).attr("src");
    if (!src || src.startsWith("data:")) return;
    $(element).attr("src", new URL(src, sourceOrigin).toString());
  });
}

function cleanContent($, content) {
  content.find("script, style, iframe[src*='facebook'], .sharedaddy, .jp-relatedposts, .post-meta, .navigation").remove();
  content.find("[style]").removeAttr("style");
  content.find("[class]").each((_, el) => {
    const keep = ($(el).attr("class") || "")
      .split(/\s+/)
      .filter((name) => /^align|^wp-|^size-/.test(name))
      .join(" ");
    if (keep) $(el).attr("class", keep);
    else $(el).removeAttr("class");
  });
  rewriteLinks($);
}

function extractArticle($, pathname) {
  const entry = $(".entry-content").first().clone();
  const title = normalizeWhitespace($(".entry-title").first().text()) || normalizeWhitespace($("h1").first().text()) || "Douce France";
  if (entry.length) {
    cleanContent($, entry);
    return { title, body: entry.html() || "" };
  }

  if (pathname === "/") {
    return { title: "小さなフランス語教室Douce France", body: null };
  }

  return {
    title,
    body: `<p>${fallbackDescriptions[pathname] || "Douce Franceのページです。"}</p>`
  };
}

function pageMeta($, pathname, articleTitle) {
  const title = normalizeWhitespace($("title").first().text()) || `${articleTitle} | 小さなフランス語教室Douce France`;
  const description = $("meta[name='description']").attr("content") || "";
  return { title, description: normalizeWhitespace(description) };
}

function homeBody() {
  return `
    <section class="hero">
      <div class="hero-image">
        <img src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1920&q=80" alt="パリのエッフェル塔と美しい街並み" loading="eager">
        <div class="hero-overlay"></div>
      </div>
      <div class="hero-content">
        <p class="hero-subtitle">東京・新宿エリア、東中野駅徒歩2分</p>
        <h1 class="hero-title">楽しく学べる<br><span class="french-title">Douce France</span></h1>
        <p class="hero-description">たった4席の小さなフランス語教室。<br>フランス文化や映画から、あなたらしく学ぶ。</p>
        <div class="hero-cta">
          <a href="/contact-2/" class="hero-button primary">体験レッスンを申し込む</a>
          <a href="/time-schedule/" class="hero-button secondary">クラス一覧を見る</a>
        </div>
      </div>
    </section>
    <section class="welcome page-section">
      <div class="welcome-container">
        <div class="welcome-text">
          <h2 class="section-title"><span class="title-label">About</span><span class="title-main">ようこそ、<span class="french-text">Douce France</span>へ</span></h2>
          <div class="welcome-body">
            <p><span class="french-text">Douce France</span>は東中野の駅前にある、たった4席の小さなフランス語教室です。</p>
            <p>趣味で語学を習う主婦の方や、お仕事帰りに通われている方など、フランス語が大好きな皆様が毎日レッスンされています。</p>
            <p>フランス映画やフランスの歴史・文化をテーマに語学を学ぶクラス、会話サロン、基礎クラスなど、あなたのライフスタイルに合わせて選べます。</p>
          </div>
        </div>
        <div class="welcome-image"><div class="image-card"><img src="assets/classroom-2.jpg" alt="アットホームなレッスンの様子" loading="lazy"></div></div>
      </div>
    </section>
    <section class="lessons page-section">
      <div class="lessons-container">
        <h2 class="section-title center"><span class="title-label">Lessons</span><span class="title-main">クラス紹介</span></h2>
        <div class="page-link-grid">${navItems.slice(0, 8).map(([label, href]) => `<a class="page-link-card" href="${href}">${label}</a>`).join("")}</div>
      </div>
    </section>
  `;
}

function renderHeader() {
  return `
    <header class="header">
      <div class="header-container">
        <a class="header-brand" href="/" aria-label="Douce France トップ">
          <h1 class="header-logo"><span class="logo-main">Douce France</span><span class="logo-sub">小さなフランス語教室</span></h1>
        </a>
        <nav class="header-nav">${headerNavItems.map(([label, href]) => `<a href="${href}" class="nav-link">${label}</a>`).join("")}</nav>
        <button class="mobile-menu-toggle" aria-label="メニューを開く"><span></span><span></span><span></span></button>
      </div>
    </header>
  `;
}

function renderFooter() {
  return `
    <footer class="footer">
      <div class="footer-container">
        <div class="footer-brand">
          <h2 class="footer-logo"><span class="logo-main">Douce France</span><span class="logo-sub">小さなフランス語教室ドゥースフランス</span></h2>
          <p class="footer-tagline">東京・新宿エリア、東中野駅徒歩2分<br>楽しく学べるドゥースフランス</p>
        </div>
        <div class="footer-info">
          <div class="footer-section"><h3>教室情報</h3><p>〒164-0003<br>東京都中野区東中野1-56-1<br>大島ビル第一本館502</p><p>TEL: <a href="tel:05036313859">050-3631-3859</a></p></div>
          <div class="footer-section"><h3>メニュー</h3><p>${navItems.slice(0, 6).map(([label, href]) => `<a href="${href}">${label}</a>`).join(" / ")}</p></div>
        </div>
      </div>
      <div class="footer-bottom"><p>&copy; 2026 Douce France. All rights reserved.</p></div>
    </footer>
  `;
}

function renderPage({ pathname, meta, article }) {
  const isHome = pathname === "/";
  const canonical = new URL(pathname, publicOrigin).toString();
  const body = isHome
    ? homeBody()
    : `<main class="subpage-main"><section class="wp-page"><div class="wp-page-container"><p class="title-label">Douce France</p><h1 class="subpage-title">${article.title}</h1><article class="wp-content">${article.body}</article></div></section></main>`;

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${meta.title}</title>
  <meta name="description" content="${meta.description}">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <link rel="canonical" href="${canonical}">
  <meta property="og:locale" content="ja_JP">
  <meta property="og:site_name" content="小さなフランス語教室Douce France">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${meta.title}">
  <meta property="og:description" content="${meta.description}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${sourceOrigin}/wp-content/uploads/2020/03/94976c181d5c3f922d020516cea3aa54_s.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${meta.title}">
  <meta name="twitter:description" content="${meta.description}">
  <meta name="twitter:image" content="${sourceOrigin}/wp-content/uploads/2020/03/94976c181d5c3f922d020516cea3aa54_s.jpg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@300;400;600&family=Crimson+Pro:wght@300;400;600&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Noto+Sans+JP:wght@300;400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css">
  <meta name="theme-color" content="#1a3a52">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"LanguageSchool","name":"小さなフランス語教室Douce France","url":"${publicOrigin}/","telephone":"+81-50-3631-3859","address":{"@type":"PostalAddress","streetAddress":"東中野1-56-1 大島ビル第一本館502","addressLocality":"中野区","addressRegion":"東京都","postalCode":"164-0003","addressCountry":"JP"}}</script>
</head>
<body>
${renderHeader()}
${body}
${renderFooter()}
<script src="/script.js"></script>
</body>
</html>`;
}

function generateFieldsForFile($, pathname, pageTitle) {
  const fields = [];
  const page = pagePathFor(pathname);
  const pageId = pageIdFor(pathname);

  fields.push({
    id: `seo.${pageId}.title`,
    group: "ページSEO",
    page,
    pageTitle,
    label: `${pageTitle} / title`,
    type: "text",
    selector: "title, meta[property='og:title'], meta[name='twitter:title']",
    target: "smartTitle",
    value: $("title").first().text()
  });

  fields.push({
    id: `seo.${pageId}.description`,
    group: "ページSEO",
    page,
    pageTitle,
    label: `${pageTitle} / description`,
    type: "textarea",
    selector: "meta[name='description'], meta[property='og:description'], meta[name='twitter:description']",
    target: "attr",
    attr: "content",
    value: $("meta[name='description']").attr("content") || ""
  });

  let index = 0;
  const selector = "main h1, main h2, main h3, main h4, main p, main li, main dt, main dd, main blockquote, main figcaption, main summary, main th, main td, main a, main span, section.hero h1, section.hero h2, section.hero p, section.hero a";
  $(selector).each((_, el) => {
    const element = $(el);
    if (element.parents("svg, script, style, nav, footer, header").length) return;
    const text = normalizeWhitespace(element.text());
    if (text.length < 2) return;
    if (["span", "a"].includes((el.tagName || "").toLowerCase()) && element.parents("p, h1, h2, h3, h4, li, th, td").length) return;
    index += 1;
    const cmsId = `${pageId}.body.${String(index).padStart(3, "0")}`;
    element.attr("data-cms-id", cmsId);
    fields.push({
      id: `body.${cmsId}`,
      group: "ページ本文",
      page,
      pageTitle,
      label: `${pageTitle} / ${el.tagName.toUpperCase()} ${index}: ${text.slice(0, 36)}`,
      type: element.html().length > 80 || /<br\b|<span\b|<strong\b|<em\b/i.test(element.html()) ? "html" : "text",
      selector: `[data-cms-id="${cmsId}"]`,
      target: "html",
      value: element.html()
    });
  });
  return fields;
}

async function fetchPage(pathname) {
  const response = await fetch(sourceUrl(pathname));
  if (!response.ok) throw new Error(`${response.status} ${pathname}`);
  return response.text();
}

async function build() {
  const allFields = [];
  const pageSummaries = [];
  for (const pathname of pageUrls) {
    console.log(`fetch ${pathname}`);
    const html = await fetchPage(pathname);
    const $source = load(html, { decodeEntities: false });
    const article = extractArticle($source, pathname);
    const meta = pageMeta($source, pathname, article.title);
    let output = renderPage({ pathname, meta, article });
    const $page = load(output, { decodeEntities: false });
    const fields = generateFieldsForFile($page, pathname, article.title);
    output = $page.html();

    const outFile = filePathFor(pathname);
    await mkdir(path.dirname(outFile), { recursive: true });
    await writeFile(outFile, output, "utf8");
    allFields.push(...fields);
    pageSummaries.push({ path: pathname, title: article.title, fieldCount: fields.length });
  }

  await mkdir(path.join(rootDir, "api"), { recursive: true });
  await writeFile(path.join(rootDir, "api", "default-content.js"), `export const defaultContent = ${JSON.stringify({
    version: 1,
    updatedAt: null,
    fields: allFields
  }, null, 2)};\n\nexport const editablePages = ${JSON.stringify(pageSummaries, null, 2)};\n`, "utf8");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pageUrls.map((pathname) => `  <url><loc>${new URL(pathname, publicOrigin)}</loc><lastmod>2026-05-04</lastmod><changefreq>weekly</changefreq><priority>${pathname === "/" ? "1.0" : "0.7"}</priority></url>`).join("\n")}\n</urlset>\n`;
  await writeFile(path.join(rootDir, "sitemap.xml"), sitemap, "utf8");
  await writeFile(path.join(rootDir, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${publicOrigin}/sitemap.xml\n`, "utf8");
  console.log(`Generated ${pageSummaries.length} pages and ${allFields.length} CMS fields.`);
}

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
