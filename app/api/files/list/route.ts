import { db } from '@/lib/db/drizzle';
import { lessonFiles } from '@/lib/db/schema';
import { NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const files = await db.select().from(lessonFiles).orderBy(desc(lessonFiles.createdAt));
    
    return NextResponse.json({
      files: files.map(file => ({
        id: file.id,
        filename: file.filename,
        url: file.url,
        mimeType: file.mimeType,
        size: file.size,
        createdAt: file.createdAt,
      }))
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
  }
}
