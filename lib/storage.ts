import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';

const CONFIG = {
  BUCKET_NAME: process.env.GOOGLE_CLOUD_BUCKET || 'your-bucket-name',
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  URL_EXPIRATION: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};

export class StorageService {
  private storage: Storage;
  private bucket: any;

  constructor() {
    try {
      const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS!);
      
      this.storage = new Storage({
        credentials,
        projectId: credentials.project_id
      });
      
      this.bucket = this.storage.bucket(CONFIG.BUCKET_NAME);
    } catch (error) {
      console.error('Error initializing storage service:', error);
      throw new Error('Failed to initialize storage service');
    }
  }

  private sanitizeFilename(filename: string): string {
    return filename
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '-')
      .replace(/-+/g, '-');
  }

  async uploadImage(file: File): Promise<string> {
    if (!CONFIG.SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      throw new Error('Unsupported file type. Please upload a valid image file.');
    }

    if (file.size > CONFIG.MAX_FILE_SIZE) {
      throw new Error('File too large. Maximum size is 5MB.');
    }

    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `profile-images/${uuidv4()}.${extension}`;
    const fileBuffer = await file.arrayBuffer();

    try {
      // Create file in bucket
      const blob = this.bucket.file(fileName);
      
      // Upload file
      await blob.save(Buffer.from(fileBuffer), {
        metadata: {
          contentType: file.type,
        },
      });

      // Generate signed URL
      const [url] = await blob.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + CONFIG.URL_EXPIRATION, // URL expires in 7 days
      });

      return url;
    } catch (error) {
      console.error('Error uploading to Google Cloud Storage:', error);
      throw new Error('Failed to upload image. Please try again.');
    }
  }
}
