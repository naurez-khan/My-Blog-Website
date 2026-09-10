// js/posts.js — loads posts from Supabase and renders them.
//
// This file replaces the old version that read data/posts.json.
// It must load AFTER the supabase-js CDN script and config.js
// (see the <script> tags added to index.html and blog.html).
//
// To add a new post, don't edit this file — go to admin.html on
// your site, log in, write, and click Publish.

function firstParagraph(markdown) {
  const withoutImages = (markdown || "").replace(/!\[.*?\]\(.*?\)/g, "");
  const plain = withoutImages.replace(/[#*_`>]/g, "").trim();
  return plain.split(/\n\s*\n/)[0] || "";
}

function excerptOf(post, maxLen = 160) {
  const text = firstParagraph(post.content);
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trim() + "…";
}

/* ---------------- Home page ---------------- */

async function renderHome() {
  const mount = document.getElementById("latest-post");
  if (!mount) return;
  try {
    const posts = await loadPosts();
    if (posts.length === 0) {
      mount.innerHTML = '<p class="empty-state">No posts yet — write your first one at admin.html.</p>';
      return;
    }
    const latest = posts[0];
    const thumbHtml = latest.cover_image
      ? `<img class="post-preview-thumb" src="${latest.cover_image}" alt="">`
      : "";
    mount.innerHTML = `
      <article class="post-preview">
        ${thumbHtml}
        <h3 class="post-preview-title"><a href="blog.html?post=${encodeURIComponent(latest.id)}">${latest.title}</a></h3>
        <p class="post-meta">${formatDate(latest.date)}</p>
        <p class="post-excerpt">${excerptOf(latest)}</p>
        <a class="read-more" href="blog.html?post=${encodeURIComponent(latest.id)}">Read the full post →</a>
      </article>
    `;
  } catch (err) {
    mount.innerHTML = `<p class="empty-state">Couldn't load posts. Check config.js has your Supabase details.</p>`;
    console.error(err);
  }
}

/* ---------------- Blog / single post page ---------------- */

async function renderPost() {
  const mount = document.getElementById("post-mount");
  if (!mount) return;
  try {
    const posts = await loadPosts();
    if (posts.length === 0) {
      mount.innerHTML = '<p class="empty-state">No posts yet — write your first one at admin.html.</p>';
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const requestedId = params.get("post");
    let index = requestedId ? posts.findIndex((p) => p.id === requestedId) : 0;
    if (index === -1) index = 0;

    const post = posts[index];
    const newer = index > 0 ? posts[index - 1] : null;
    const older = index < posts.length - 1 ? posts[index + 1] : null;

    const tagsHtml = (post.tags || [])
      .map((t) => `<span class="post-tag">${t}</span>`)
      .join("");

    const coverHtml = post.cover_image
      ? `<img class="post-cover" src="${post.cover_image}" alt="">`
      : "";

    const bodyHtml = renderMarkdown(post.content);

    mount.innerHTML = `
      <article>
        <h1 class="post-title">${post.title}</h1>
        <p class="post-meta">${formatDate(post.date)}</p>
        ${tagsHtml ? `<div class="post-tags">${tagsHtml}</div>` : ""}
        ${coverHtml}
        <div class="post-body">${bodyHtml}</div>
      </article>
      <nav class="pagination" aria-label="Post navigation">
        ${
          newer
            ? `<a href="blog.html?post=${encodeURIComponent(newer.id)}"><span class="direction">← Newer</span>${newer.title}</a>`
            : `<span class="placeholder">This is the latest post</span>`
        }
        ${
          older
            ? `<a class="older" href="blog.html?post=${encodeURIComponent(older.id)}"><span class="direction">Older →</span>${older.title}</a>`
            : `<span class="placeholder older">You've reached the first post</span>`
        }
      </nav>
    `;

    document.title = `${post.title} — Blog`;
  } catch (err) {
    mount.innerHTML = `<p class="empty-state">Couldn't load posts. Check config.js has your Supabase details.</p>`;
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderHome();
  renderPost();
});
