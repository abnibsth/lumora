import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getMeApi } from '@/lib/api';
import {
  getHomepageAdminState,
  saveHomepageDraft,
  publishHomepageDraft,
} from '@/lib/homepage-storage';

export const dynamic = 'force-dynamic';

async function verifyAdminAuth() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const user = await getMeApi(cookieHeader);

  // In production/dev, verify user has admin role
  if (!user || user.role !== 'admin') {
    return null;
  }
  return user;
}

export async function GET() {
  try {
    const admin = await verifyAdminAuth();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Akses khusus admin' }, { status: 401 });
    }

    const state = await getHomepageAdminState();
    return NextResponse.json({ data: state });
  } catch (error) {
    console.error('Error fetching admin homepage state:', error);
    return NextResponse.json(
      { error: 'Gagal memuat status manajemen beranda' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await verifyAdminAuth();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Akses khusus admin' }, { status: 401 });
    }

    const body = await req.json();
    if (!body || !body.content) {
      return NextResponse.json({ error: 'Data draft konten tidak valid' }, { status: 400 });
    }

    const updated = await saveHomepageDraft(
      body.content,
      admin.name || admin.email || 'Admin'
    );

    return NextResponse.json({
      message: 'Draft konten beranda berhasil disimpan',
      data: updated,
    });
  } catch (error) {
    console.error('Error saving homepage draft:', error);
    return NextResponse.json(
      { error: 'Gagal menyimpan draft beranda' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const admin = await verifyAdminAuth();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Akses khusus admin' }, { status: 401 });
    }

    const updated = await publishHomepageDraft(
      admin.name || admin.email || 'Admin'
    );

    return NextResponse.json({
      message: 'Konten beranda berhasil dipublikasikan ke website publik',
      data: updated,
    });
  } catch (error) {
    console.error('Error publishing homepage draft:', error);
    return NextResponse.json(
      { error: 'Gagal mempublikasikan konten beranda' },
      { status: 500 }
    );
  }
}
