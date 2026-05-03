import { NextRequest, NextResponse } from 'next/server';
import { validateSession, getMedia, createMediaRecord, deleteMedia } from '@/lib/cms';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { v4 as uuidv4 } from 'uuid';

async function authenticate(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value;
  if (!token) return null;
  return validateSession(token);
}

export async function GET(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const type = url.searchParams.get('type') || undefined;
  const page = parseInt(url.searchParams.get('page') || '1');

  const result = await getMedia({ type, page });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() || 'bin';
    const filename = `${uuidv4()}.${ext}`;
    const filePath = `blog-media/${filename}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('blog-media')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      // If bucket doesn't exist, try creating it
      if (uploadError.message.includes('not found') || uploadError.message.includes('Bucket')) {
        await supabaseAdmin.storage.createBucket('blog-media', { public: true });
        const { error: retryError } = await supabaseAdmin.storage
          .from('blog-media')
          .upload(filePath, buffer, { contentType: file.type, upsert: false });
        if (retryError) {
          return NextResponse.json({ error: retryError.message }, { status: 500 });
        }
      } else {
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
      }
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('blog-media')
      .getPublicUrl(filePath);

    const fileType = file.type.startsWith('image/') ? 'image'
      : file.type.startsWith('video/') ? 'video'
      : file.type.startsWith('audio/') ? 'audio'
      : 'document';

    const media = await createMediaRecord({
      filename,
      original_name: file.name,
      file_type: fileType,
      file_size: file.size,
      mime_type: file.type,
      url: urlData.publicUrl,
      uploaded_by: user.id,
    });

    return NextResponse.json({ success: true, media });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await request.json();
  const ok = await deleteMedia(id);
  return NextResponse.json({ success: ok });
}
