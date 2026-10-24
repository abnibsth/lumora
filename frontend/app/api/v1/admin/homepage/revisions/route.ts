import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getMeApi } from '@/lib/api';
import {
  getHomepageRevisions,
  restoreHomepageRevision,
} from '@/lib/homepage-storage';

export const dynamic = 'force-dynamic';

async function verifyAdminAuth() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const user = await getMeApi(cookieHeader);
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

    const revisions = await getHomepageRevisions();
    return NextResponse.json({ data: revisions });
  } catch (error) {
    console.error('Error fetching homepage revisions:', error);
    return NextResponse.json(
      { error: 'Gagal memuat daftar riwayat revisi' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdminAuth();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Akses khusus admin' }, { status: 401 });
    }

    const body: unknown = await req.json().catch(() => null);
    const revisionId =
      body !== null && typeof body === 'object' && 'revisionId' in body
        ? body.revisionId
        : undefined;

    if (
      typeof revisionId !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(revisionId)
    ) {
      return NextResponse.json({ error: 'ID revisi harus berupa UUID yang valid' }, { status: 400 });
    }

    if (!getHomepageRevisions().some((revision) => revision.id === revisionId)) {
      return NextResponse.json({ error: 'Revisi tidak ditemukan' }, { status: 404 });
    }

    const updated = restoreHomepageRevision(
      revisionId,
      admin.name || admin.email || 'Admin'
    );

    return NextResponse.json({
      message: `Revisi #${revisionId.slice(0, 8)} berhasil dipulihkan ke draft aktif`,
      data: updated,
    });
  } catch (error) {
    console.error('Error restoring homepage revision:', error);
    return NextResponse.json(
      { error: 'Gagal memulihkan versi revisi' },
      { status: 500 }
    );
  }
}
