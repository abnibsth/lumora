import { NextResponse } from 'next/server';
import { getHomepagePublicContent } from '@/lib/homepage-storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const content = await getHomepagePublicContent();
    return NextResponse.json({
      data: content,
      message: 'Konten beranda publik berhasil dimuat',
    });
  } catch (error) {
    console.error('Error fetching public homepage content:', error);
    return NextResponse.json(
      { error: 'Gagal memuat konten beranda publik' },
      { status: 500 }
    );
  }
}
