// posts.js — loads data/posts.json and renders it.
//
// To add a new post: open data/posts.json and add a new object at the
// top of the array (newest first isn't required — sorting happens here
// automatically by date).
//
// Each post's "paragraphs" array can mix two kinds of entries:
//   1. A plain string        -> rendered as a paragraph of text.
//   2. An image block, e.g.:
//        { "image": "images/my-photo.jpg", "alt": "description", "caption": "optional caption" }
//      -> rendered as a picture inside the post, with an optional caption.
//
// A post can also have a top-of-post / preview picture via "coverImage":
//   "coverImage": "images/my-photo.jpg"
// It's shown as a banner on the single post page and as a thumbnail on
// the home page preview.
//
// Put your image files in the images/ folder and reference them as
// "images/filename.jpg" (paths are relative to the site root).

const POSTS_URL = 'data/posts.json';

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

async function loadPosts() {
  const res = await fetch(POSTS_URL);
  if (!res.ok) throw new Error('Could not load posts.json');
  const posts = await res.json();
  // newest first
  return posts.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
}

function firstTextParagraph(post) {
  const blocks = post.paragraphs || [];
  const textBlock = blocks.find((b) => typeof b === 'string');
  return textBlock || '';
}

function excerptOf(post, maxLen = 160) {
  const text = firstTextParagraph(post);
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trim() + '…';
}

/* ---------------- Home page ---------------- */

async function renderHome() {
  const mount = document.getElementById('latest-post');
  if (!mount) return;
  try {
    const posts = await loadPosts();
    if (posts.length === 0) {
      mount.innerHTML = '<p class="empty-state">No posts yet — add one in data/posts.json.</p>';
      return;
    }

    const latestPosts = posts.slice(0, 3);
    const homeHtml = latestPosts.map((post) => {
      const thumbHtml = post.coverImage
        ? `<img class="post-preview-thumb" src="${post.coverImage}" alt="">`
        : '';

      return `
        <article class="post-preview">
          ${thumbHtml}
          <h3 class="post-preview-title"><a href="blog.html?post=${encodeURIComponent(post.id)}">${post.title}</a></h3>
          <p class="post-meta">${formatDate(post.date)}</p>
          <p class="post-excerpt">${excerptOf(post)}</p>
          <a class="read-more" href="blog.html?post=${encodeURIComponent(post.id)}">Read the full post →</a>
        </article>
      `;
    }).join('');

    mount.innerHTML = homeHtml;
  } catch (err) {
    mount.innerHTML = `<p class="empty-state">Couldn't load posts. If you're opening this file directly in a browser, run a local server (e.g. <code>python3 -m http.server</code>) and open it from there instead.</p>`;
    console.error(err);
  }
}

/* ---------------- Blog / single post page ---------------- */

function renderBodyBlock(block) {
  if (typeof block === 'string') {
    return `<p>${block}</p>`;
  }
  if (block && block.image) {
    const caption = block.caption
      ? `<figcaption>${block.caption}</figcaption>`
      : '';
    return `
      <figure class="post-image">
        <img src="${block.image}" alt="${block.alt || ''}">
        ${caption}
      </figure>
    `;
  }
  return '';
}

async function renderPost() {
  const mount = document.getElementById('post-mount');
  if (!mount) return;
  try {
    const posts = await loadPosts();
    if (posts.length === 0) {
      mount.innerHTML = '<p class="empty-state">No posts yet — add one in data/posts.json.</p>';
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const requestedId = params.get('post');
    let index = requestedId ? posts.findIndex((p) => p.id === requestedId) : 0;
    if (index === -1) index = 0;

    const post = posts[index];
    const newer = index > 0 ? posts[index - 1] : null;
    const older = index < posts.length - 1 ? posts[index + 1] : null;

    const tagsHtml = (post.tags || [])
      .map((t) => `<span class="post-tag">${t}</span>`)
      .join('');

    const coverHtml = post.coverImage
      ? `<img class="post-cover" src="${post.coverImage}" alt="">`
      : '';

    const bodyHtml = (post.paragraphs || []).map(renderBodyBlock).join('');

    mount.innerHTML = `
      <article>
        <h1 class="post-title">${post.title}</h1>
        <p class="post-meta">${formatDate(post.date)}</p>
        ${tagsHtml ? `<div class="post-tags">${tagsHtml}</div>` : ''}
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
    mount.innerHTML = `<p class="empty-state">Couldn't load posts. If you're opening this file directly in a browser, run a local server (e.g. <code>python3 -m http.server</code>) and open it from there instead.</p>`;
    console.error(err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderHome();
  renderPost();
});
