import { db } from '@/lib/db/drizzle';
import { lessonFiles, flashcards } from '@/lib/db/schema';
import { Storage } from '@google-cloud/storage';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

const CONFIG = {
  BUCKET_NAME: process.env.GOOGLE_CLOUD_BUCKET || 'your-bucket-name',
};

export async function DELETE(request: Request) {
  try {
    const { fileId } = await request.json();
    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    // Get file details from database
    const [file] = await db
      .select()
      .from(lessonFiles)
      .where(eq(lessonFiles.id, fileId));

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Initialize Google Cloud Storage
    const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS || '{}');
    const storage = new Storage({
      credentials,
      projectId: credentials.project_id
    });
    const bucket = storage.bucket(CONFIG.BUCKET_NAME);

    // Extract filename from URL
    const urlParts = new URL(file.url).pathname.split('/');
    const filename = urlParts[urlParts.length - 1];

    // Delete file from Google Cloud Storage
    try {
      await bucket.file(filename).delete();
    } catch (error) {
      console.error('Error deleting file from storage:', error);
      // Continue with database cleanup even if storage deletion fails
    }

    // Delete associated flashcards
    await db
      .delete(flashcards)
      .where(eq(flashcards.source, file.filename));

    // Delete file record from database
    await db
      .delete(lessonFiles)
      .where(eq(lessonFiles.id, fileId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
