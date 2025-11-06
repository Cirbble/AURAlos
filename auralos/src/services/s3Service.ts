// S3 Service for Image Upload
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
  region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || '',
    sessionToken: import.meta.env.VITE_AWS_SESSION_TOKEN || undefined,
  },
});

export interface UploadResult {
  success: boolean;
  s3Key: string;
  s3Url: string;
  error?: string;
}

/**
 * Upload image file to S3
 */
export async function uploadImageToS3(file: File): Promise<UploadResult> {
  try {
    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const s3Key = `user-uploads/${Date.now()}-${uuidv4()}.${fileExtension}`;

    // Read file as buffer
    const buffer = await file.arrayBuffer();

    const command = new PutObjectCommand({
      Bucket: import.meta.env.VITE_S3_BUCKET,
      Key: s3Key,
      Body: new Uint8Array(buffer),
      ContentType: file.type,
      Metadata: {
        uploadedAt: new Date().toISOString(),
        originalName: file.name,
      },
    });

    await s3Client.send(command);

    const s3Url = `https://${import.meta.env.VITE_S3_BUCKET}.s3.${import.meta.env.VITE_AWS_REGION}.amazonaws.com/${s3Key}`;

    return {
      success: true,
      s3Key: s3Key,
      s3Url: s3Url,
    };
  } catch (error) {
    console.error('Error uploading to S3:', error);
    return {
      success: false,
      s3Key: '',
      s3Url: '',
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Convert file to base64 (for preview)
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Please upload a valid image file (JPEG, PNG, or WebP)',
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Image size must be less than 10MB',
    };
  }

  return { valid: true };
}

