'use server';

import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { StorageService } from '@/lib/storage';

export async function uploadProfileImage(formData: FormData) {
  const user = await getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  const file = formData.get('file') as File;
  if (!file) {
    throw new Error('No file provided');
  }

  try {
    const storage = new StorageService();
    const imageUrl = await storage.uploadImage(file);

    // Update user's avatar URL in the database
    await db
      .update(users)
      .set({
        avatarUrl: imageUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return { success: true, imageUrl };
  } catch (error: any) {
    console.error('Error uploading image:', error);
    throw new Error(error.message || 'Error uploading image');
  }
}

export async function updateProfile(data: {
  name?: string;
  avatarUrl?: string;
  mainLanguage?: string;
  preferredLanguages?: string[];
}) {
  const user = await getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  return { success: true };
}
