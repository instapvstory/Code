import { supabaseAdmin } from './supabase-admin';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// ==================== TYPES ====================
export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: any;
  content_html: string;
  featured_image: string | null;
  author_id: string;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  published_at: string | null;
  reading_time: number;
  view_count: number;
  is_featured: boolean;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  author?: AdminUser;
  categories?: Category[];
  tags?: Tag[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  post_count?: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  post_count?: number;
}

export interface MediaItem {
  id: string;
  filename: string;
  original_name: string;
  file_type: string;
  file_size: number;
  mime_type: string | null;
  url: string;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  uploaded_by: string | null;
  created_at: string;
}

// ==================== AUTH ====================
export async function adminLogin(email: string, password: string) {
  const { data: user, error } = await supabaseAdmin
    .from('admin_users')
    .select('*')
    .eq('email', email.toLowerCase())
    .eq('is_active', true)
    .single();

  if (error || !user) return { success: false, error: 'Invalid credentials' };

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return { success: false, error: 'Invalid credentials' };

  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const { error: sessionError } = await supabaseAdmin
    .from('admin_sessions')
    .insert({
      user_id: user.id,
      token,
      expires_at: expiresAt.toISOString(),
    });

  if (sessionError) return { success: false, error: 'Session creation failed' };

  await supabaseAdmin
    .from('admin_users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', user.id);

  const { password_hash: _, ...safeUser } = user;
  return { success: true, user: safeUser as AdminUser, token };
}

export async function validateSession(token: string): Promise<AdminUser | null> {
  const { data, error } = await supabaseAdmin
    .from('admin_sessions')
    .select('*, admin_users(*)')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data || !data.admin_users) return null;
  const { password_hash: _, ...safeUser } = data.admin_users;
  return safeUser as AdminUser;
}

export async function adminLogout(token: string) {
  await supabaseAdmin.from('admin_sessions').delete().eq('token', token);
}

// ==================== POSTS ====================
export async function getPosts(opts?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = opts?.page || 1;
  const limit = opts?.limit || 20;
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('posts')
    .select('*, admin_users!posts_author_id_fkey(id, name, email, avatar_url)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (opts?.status && opts.status !== 'all') {
    query = query.eq('status', opts.status);
  }
  if (opts?.search) {
    query = query.ilike('title', `%${opts.search}%`);
  }

  const { data, count, error } = await query;
  if (error) { console.error('getPosts error:', error); return { posts: [], total: 0 }; }

  // Fetch categories and tags for each post
  const postIds = (data || []).map((p: any) => p.id);
  const [catResult, tagResult] = await Promise.all([
    supabaseAdmin.from('post_categories').select('post_id, categories(*)').in('post_id', postIds),
    supabaseAdmin.from('post_tags').select('post_id, tags(*)').in('post_id', postIds),
  ]);

  const catMap: Record<string, any[]> = {};
  (catResult.data || []).forEach((r: any) => {
    if (!catMap[r.post_id]) catMap[r.post_id] = [];
    if (r.categories) catMap[r.post_id].push(r.categories);
  });

  const tagMap: Record<string, any[]> = {};
  (tagResult.data || []).forEach((r: any) => {
    if (!tagMap[r.post_id]) tagMap[r.post_id] = [];
    if (r.tags) tagMap[r.post_id].push(r.tags);
  });

  const posts = (data || []).map((p: any) => ({
    ...p,
    author: p.admin_users,
    categories: catMap[p.id] || [],
    tags: tagMap[p.id] || [],
  }));

  return { posts, total: count || 0 };
}

export async function getPostById(id: string) {
  const { data, error } = await supabaseAdmin
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;

  const [catResult, tagResult] = await Promise.all([
    supabaseAdmin.from('post_categories').select('category_id').eq('post_id', id),
    supabaseAdmin.from('post_tags').select('tag_id').eq('post_id', id),
  ]);

  return {
    ...data,
    category_ids: (catResult.data || []).map((r: any) => r.category_id),
    tag_ids: (tagResult.data || []).map((r: any) => r.tag_id),
  };
}

export async function getPostBySlug(slug: string) {
  const { data, error } = await supabaseAdmin
    .from('posts')
    .select('*, admin_users!posts_author_id_fkey(id, name, avatar_url)')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !data) return null;

  const [catResult, tagResult] = await Promise.all([
    supabaseAdmin.from('post_categories').select('categories(*)').eq('post_id', data.id),
    supabaseAdmin.from('post_tags').select('tags(*)').eq('post_id', data.id),
  ]);

  // Increment view count
  await supabaseAdmin
    .from('posts')
    .update({ view_count: (data.view_count || 0) + 1 })
    .eq('id', data.id);

  return {
    ...data,
    author: data.admin_users,
    categories: (catResult.data || []).map((r: any) => r.categories).filter(Boolean),
    tags: (tagResult.data || []).map((r: any) => r.tags).filter(Boolean),
  };
}

export async function getPublishedPosts(page: number = 1, limit: number = 10) {
  const offset = (page - 1) * limit;
  const { data, count, error } = await supabaseAdmin
    .from('posts')
    .select('id, title, slug, excerpt, featured_image, published_at, reading_time, view_count, admin_users!posts_author_id_fkey(name, avatar_url)', { count: 'exact' })
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return { posts: [], total: 0 };

  // Get categories for each post
  const postIds = (data || []).map((p: any) => p.id);
  const { data: catData } = await supabaseAdmin
    .from('post_categories')
    .select('post_id, categories(name, slug)')
    .in('post_id', postIds);

  const catMap: Record<string, any[]> = {};
  (catData || []).forEach((r: any) => {
    if (!catMap[r.post_id]) catMap[r.post_id] = [];
    if (r.categories) catMap[r.post_id].push(r.categories);
  });

  const posts = (data || []).map((p: any) => ({
    ...p,
    author: p.admin_users,
    categories: catMap[p.id] || [],
  }));

  return { posts, total: count || 0 };
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export async function createPost(data: {
  title: string;
  content: any;
  content_html: string;
  excerpt?: string;
  featured_image?: string;
  author_id: string;
  status: string;
  published_at?: string;
  meta_title?: string;
  meta_description?: string;
  category_ids?: string[];
  tag_ids?: string[];
}) {
  const slug = generateSlug(data.title);
  // Check uniqueness
  const { data: existing } = await supabaseAdmin.from('posts').select('id').eq('slug', slug);
  const finalSlug = existing && existing.length > 0 ? `${slug}-${Date.now()}` : slug;

  const wordCount = (data.content_html || '').replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const publishedAt = data.status === 'published'
    ? data.published_at || new Date().toISOString()
    : data.published_at || null;

  const { data: post, error } = await supabaseAdmin
    .from('posts')
    .insert({
      title: data.title,
      slug: finalSlug,
      content: data.content,
      content_html: data.content_html,
      excerpt: data.excerpt || '',
      featured_image: data.featured_image || null,
      author_id: data.author_id,
      status: data.status,
      published_at: publishedAt,
      reading_time: readingTime,
      meta_title: data.meta_title || null,
      meta_description: data.meta_description || null,
    })
    .select()
    .single();

  if (error || !post) return { success: false, error: error?.message || 'Failed to create post' };

  // Link categories and tags
  if (data.category_ids?.length) {
    await supabaseAdmin.from('post_categories').insert(
      data.category_ids.map(cid => ({ post_id: post.id, category_id: cid }))
    );
  }
  if (data.tag_ids?.length) {
    await supabaseAdmin.from('post_tags').insert(
      data.tag_ids.map(tid => ({ post_id: post.id, tag_id: tid }))
    );
  }

  return { success: true, post };
}

export async function updatePost(id: string, data: {
  title?: string;
  content?: any;
  content_html?: string;
  excerpt?: string;
  featured_image?: string;
  status?: string;
  published_at?: string;
  meta_title?: string;
  meta_description?: string;
  category_ids?: string[];
  tag_ids?: string[];
}) {
  const updateData: any = {};
  if (data.title !== undefined) {
    updateData.title = data.title;
    updateData.slug = generateSlug(data.title);
  }
  if (data.content !== undefined) updateData.content = data.content;
  if (data.content_html !== undefined) {
    updateData.content_html = data.content_html;
    const wordCount = data.content_html.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
    updateData.reading_time = Math.max(1, Math.ceil(wordCount / 200));
  }
  if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
  if (data.featured_image !== undefined) updateData.featured_image = data.featured_image;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.published_at !== undefined) updateData.published_at = data.published_at;
  if (data.meta_title !== undefined) updateData.meta_title = data.meta_title;
  if (data.meta_description !== undefined) updateData.meta_description = data.meta_description;

  if (data.status === 'published' && !data.published_at) {
    const { data: existing } = await supabaseAdmin.from('posts').select('published_at').eq('id', id).single();
    if (!existing?.published_at) {
      updateData.published_at = new Date().toISOString();
    }
  }

  const { error } = await supabaseAdmin.from('posts').update(updateData).eq('id', id);
  if (error) return { success: false, error: error.message };

  // Update category links
  if (data.category_ids !== undefined) {
    await supabaseAdmin.from('post_categories').delete().eq('post_id', id);
    if (data.category_ids.length > 0) {
      await supabaseAdmin.from('post_categories').insert(
        data.category_ids.map(cid => ({ post_id: id, category_id: cid }))
      );
    }
  }

  // Update tag links
  if (data.tag_ids !== undefined) {
    await supabaseAdmin.from('post_tags').delete().eq('post_id', id);
    if (data.tag_ids.length > 0) {
      await supabaseAdmin.from('post_tags').insert(
        data.tag_ids.map(tid => ({ post_id: id, tag_id: tid }))
      );
    }
  }

  return { success: true };
}

export async function deletePost(id: string) {
  const { error } = await supabaseAdmin.from('posts').delete().eq('id', id);
  return !error;
}

export async function bulkDeletePosts(ids: string[]) {
  const { error } = await supabaseAdmin.from('posts').delete().in('id', ids);
  return !error;
}

export async function bulkUpdatePostStatus(ids: string[], status: string) {
  const updateData: any = { status };
  if (status === 'published') {
    updateData.published_at = new Date().toISOString();
  }
  const { error } = await supabaseAdmin.from('posts').update(updateData).in('id', ids);
  return !error;
}

// ==================== CATEGORIES ====================
export async function getCategories() {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) return [];

  // Get post counts
  const { data: countData } = await supabaseAdmin
    .from('post_categories')
    .select('category_id');

  const countMap: Record<string, number> = {};
  (countData || []).forEach((r: any) => {
    countMap[r.category_id] = (countMap[r.category_id] || 0) + 1;
  });

  return (data || []).map(c => ({ ...c, post_count: countMap[c.id] || 0 }));
}

export async function createCategory(data: { name: string; description?: string; parent_id?: string }) {
  const slug = generateSlug(data.name);
  const { data: cat, error } = await supabaseAdmin
    .from('categories')
    .insert({ name: data.name, slug, description: data.description || null, parent_id: data.parent_id || null })
    .select()
    .single();
  if (error) return { success: false, error: error.message };
  return { success: true, category: cat };
}

export async function updateCategory(id: string, data: { name?: string; description?: string; is_active?: boolean }) {
  const updateData: any = {};
  if (data.name) { updateData.name = data.name; updateData.slug = generateSlug(data.name); }
  if (data.description !== undefined) updateData.description = data.description;
  if (data.is_active !== undefined) updateData.is_active = data.is_active;

  const { error } = await supabaseAdmin.from('categories').update(updateData).eq('id', id);
  return !error;
}

export async function deleteCategory(id: string) {
  const { error } = await supabaseAdmin.from('categories').delete().eq('id', id);
  return !error;
}

// ==================== TAGS ====================
export async function getTags() {
  const { data, error } = await supabaseAdmin
    .from('tags')
    .select('*')
    .order('name', { ascending: true });

  if (error) return [];

  const { data: countData } = await supabaseAdmin.from('post_tags').select('tag_id');
  const countMap: Record<string, number> = {};
  (countData || []).forEach((r: any) => {
    countMap[r.tag_id] = (countMap[r.tag_id] || 0) + 1;
  });

  return (data || []).map(t => ({ ...t, post_count: countMap[t.id] || 0 }));
}

export async function createTag(name: string) {
  const slug = generateSlug(name);
  const { data, error } = await supabaseAdmin
    .from('tags')
    .insert({ name, slug })
    .select()
    .single();
  if (error) return { success: false, error: error.message };
  return { success: true, tag: data };
}

export async function deleteTag(id: string) {
  const { error } = await supabaseAdmin.from('tags').delete().eq('id', id);
  return !error;
}

// ==================== MEDIA ====================
export async function getMedia(opts?: { type?: string; page?: number; limit?: number }) {
  const page = opts?.page || 1;
  const limit = opts?.limit || 30;
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('media')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (opts?.type && opts.type !== 'all') {
    query = query.eq('file_type', opts.type);
  }

  const { data, count, error } = await query;
  if (error) return { media: [], total: 0 };
  return { media: data || [], total: count || 0 };
}

export async function createMediaRecord(data: {
  filename: string;
  original_name: string;
  file_type: string;
  file_size: number;
  mime_type: string;
  url: string;
  width?: number;
  height?: number;
  alt_text?: string;
  uploaded_by: string;
}) {
  const { data: media, error } = await supabaseAdmin
    .from('media')
    .insert(data)
    .select()
    .single();
  if (error) return null;
  return media;
}

export async function deleteMedia(id: string) {
  const { error } = await supabaseAdmin.from('media').delete().eq('id', id);
  return !error;
}

// ==================== DASHBOARD STATS ====================
export async function getDashboardStats() {
  const [postsRes, catsRes, tagsRes, usersRes] = await Promise.all([
    supabaseAdmin.from('posts').select('id, status, view_count'),
    supabaseAdmin.from('categories').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('tags').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('admin_users').select('id', { count: 'exact', head: true }),
  ]);

  const posts = postsRes.data || [];
  const totalPosts = posts.length;
  const published = posts.filter(p => p.status === 'published').length;
  const drafts = posts.filter(p => p.status === 'draft').length;
  const totalViews = posts.reduce((sum, p) => sum + (p.view_count || 0), 0);

  return {
    totalPosts,
    publishedPosts: published,
    draftPosts: drafts,
    totalCategories: catsRes.count || 0,
    totalTags: tagsRes.count || 0,
    totalUsers: usersRes.count || 0,
    totalViews,
  };
}

export async function getRecentPosts(limit: number = 5) {
  const { data } = await supabaseAdmin
    .from('posts')
    .select('id, title, slug, status, view_count, published_at, created_at, reading_time, admin_users!posts_author_id_fkey(name)')
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data || []).map((p: any) => ({
    ...p,
    author_name: p.admin_users?.name || 'Unknown',
  }));
}

// ==================== SETTINGS ====================
export async function getSettings() {
  const { data } = await supabaseAdmin
    .from('system_settings')
    .select('*')
    .order('key');
  return data || [];
}

export async function updateSetting(key: string, value: any) {
  const { error } = await supabaseAdmin
    .from('system_settings')
    .upsert({ key, value: JSON.stringify(value), updated_at: new Date().toISOString() });
  return !error;
}
