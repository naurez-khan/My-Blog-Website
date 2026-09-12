/* ============================================================
   BLOG CMS CONFIG
   Fill in the two values below with your own Supabase project
   details (Settings -> API in your Supabase dashboard).
   ============================================================ */

const SUPABASE_URL = "https://gctdfcxthndarzcjwjxv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjdGRmY3h0aG5kYXJ6Y2p3anh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwMjU3MzAsImV4cCI6MjEwNDYwMTczMH0.rq_8RXHSy_naH5p7sTEDE_mm_DiDLE6LFWCqNgstg48";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ---------- shared helpers ---------- */

function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/* Renders markdown to HTML, wrapping images as <figure><figcaption> to
   match this site's existing .post-image styling. Use markdown's title
   syntax to add a caption: ![alt text](image-url "caption text") */
function renderMarkdown(markdown) {
  const renderer = new marked.Renderer();
  renderer.image = (tokenOrHref, legacyTitle, legacyText) => {
    const token = typeof tokenOrHref === "object"
      ? tokenOrHref
      : { href: tokenOrHref, title: legacyTitle, text: legacyText };
    const escapeHtml = (value) => String(value || "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[char]);
    const caption = token.title
      ? `<figcaption>${escapeHtml(token.title)}</figcaption>`
      : "";
    return `<figure class="post-image"><img src="${escapeHtml(token.href)}" alt="${escapeHtml(token.text)}">${caption}</figure>`;
  };
  return marked.parse(markdown || "", { renderer, breaks: true });
}

/* ---------- reading posts (used by index.html and blog.html) ---------- */

async function loadPosts() {
  const { data, error } = await supabaseClient
    .from("posts")
    .select("*")
    .eq("published", true)
    .order("date", { ascending: false });
  if (error) throw error;
  return data;
}

/* ---------- writing posts (used by admin.html) ---------- */

async function loadAllPostsForAdmin() {
  const { data, error } = await supabaseClient
    .from("posts")
    .select("id, title, date, tags, published, updated_at")
    .order("date", { ascending: false });
  if (error) throw error;
  return data;
}

/* Uploads a file to Supabase Storage and returns its public URL.
   Used for both cover images and inline post images. */
async function uploadImage(file) {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const maxFileSize = 2 * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    throw new Error("Please choose a JPG, PNG, WebP, or GIF image.");
  }
  if (file.size > maxFileSize) {
    throw new Error("Image must be 2 MB or smaller.");
  }

  const cleanName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
  const path = `${Date.now()}-${cleanName}`;
  const { error } = await supabaseClient.storage
    .from("post-images")
    .upload(path, file);
  if (error) throw error;
  const { data } = supabaseClient.storage.from("post-images").getPublicUrl(path);
  return data.publicUrl;
}
