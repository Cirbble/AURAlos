// Bedrock Data Automation (BDA) using Runtime API
// Blueprint ID: 56c13976944e
// Project ARN: arn:aws:bedrock:us-east-1:211125606468:data-automation-project/395ec56501e7
//
// Uses Claude Vision fallback since BDA model not publicly available yet
//
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const runtimeClient = new BedrockRuntimeClient({
  region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || '',
    sessionToken: import.meta.env.VITE_AWS_SESSION_TOKEN || undefined,
  },
});

export interface BDAImageMetadata {
  name?: string;
  description?: string;
  product_category?: string;
  product_type?: string;
  primary_color?: string;
  secondary_colors?: string[];
  material?: string;
  style?: string;
  tags?: string[];
}

export interface BDAAnalysisResult {
  success: boolean;
  metadata?: BDAImageMetadata;
  error?: string;
}

export async function analyzeImageWithBDA(s3Key: string): Promise<BDAAnalysisResult> {
  const projectArn = import.meta.env.VITE_BDA_PROJECT_ARN;
  const bucket = import.meta.env.VITE_S3_BUCKET;
  const s3Uri = `s3://${bucket}/${s3Key}`;

  console.log('=== IMAGE ANALYSIS (Claude Vision) ===');
  console.log('Project ARN:', projectArn);
  console.log('S3 URI:', s3Uri);

  try {
    console.log('Using Claude Vision for image analysis...');
    console.log('Fetching image from S3...');

    const metadata = await analyzeWithClaudeVision(bucket, s3Key);

    console.log('Claude Vision analysis complete:', metadata);
    console.log('=========================================');

    return {
      success: true,
      metadata: metadata
    };

  } catch (error) {
    console.error('Image analysis error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Image analysis failed'
    };
  }
}

async function analyzeWithClaudeVision(bucket: string, s3Key: string): Promise<BDAImageMetadata> {
  const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');

  const s3Client = new S3Client({
    region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || '',
      secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || '',
      sessionToken: import.meta.env.VITE_AWS_SESSION_TOKEN || undefined,
    },
  });

  const getCommand = new GetObjectCommand({
    Bucket: bucket,
    Key: s3Key
  });

  const response = await s3Client.send(getCommand);

  if (!response.Body) {
    throw new Error('No image data in S3 response');
  }

  const chunks: Uint8Array[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for await (const chunk of response.Body as any) {
    chunks.push(chunk);
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const imageData = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    imageData.set(chunk, offset);
    offset += chunk.length;
  }

  const base64Data = uint8ArrayToBase64(imageData);

  const payload = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 1000,
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64Data }},
        { type: "text", text: `Analyze this fashion product image and extract structured metadata.

Return ONLY valid JSON with this exact structure:
{
  "name": "descriptive product name",
  "description": "1-2 sentence description",
  "product_category": "shoes|bags|accessories|clothing",
  "product_type": "specific type (e.g., sneakers, handbag, earrings)",
  "primary_color": "main color",
  "secondary_colors": ["color1", "color2"],
  "material": "material type if visible",
  "style": "style description (e.g., casual, formal, statement)",
  "tags": ["tag1", "tag2", "tag3"]
}

Focus on visual details. Be specific and accurate.` }
      ]
    }]
  };

  const command = new InvokeModelCommand({
    modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(payload)
  });

  const visionResponse = await runtimeClient.send(command);
  const visionBody = JSON.parse(new TextDecoder().decode(visionResponse.body));
  const text = visionBody.content[0].text;

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in Claude response');
  }

  return JSON.parse(jsonMatch[0]);
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function formatBDAMetadataForAgent(metadata: BDAImageMetadata): string {
  const parts = [];

  if (metadata.name) parts.push(`Product Name: ${metadata.name}`);
  if (metadata.description) parts.push(`Description: ${metadata.description}`);
  if (metadata.product_category) parts.push(`Category: ${metadata.product_category}`);
  if (metadata.product_type) parts.push(`Type: ${metadata.product_type}`);
  if (metadata.primary_color) parts.push(`Primary Color: ${metadata.primary_color}`);
  if (metadata.secondary_colors?.length) parts.push(`Secondary Colors: ${metadata.secondary_colors.join(', ')}`);
  if (metadata.material) parts.push(`Material: ${metadata.material}`);
  if (metadata.style) parts.push(`Style: ${metadata.style}`);
  if (metadata.tags?.length) parts.push(`Tags: ${metadata.tags.join(', ')}`);

  return parts.join('\n');
}

export function createSearchQueryFromMetadata(metadata: BDAImageMetadata): string {
  const parts: string[] = [];

  parts.push('A');

  if (metadata.primary_color) {
    parts.push(metadata.primary_color);
  }
  if (metadata.secondary_colors?.length) {
    parts.push(`and ${metadata.secondary_colors.join(', ')}`);
  }

  if (metadata.material) {
    parts.push(metadata.material);
  }

  if (metadata.product_category) {
    parts.push(metadata.product_category);
  }
  if (metadata.product_type) {
    parts.push(metadata.product_type);
  }

  if (metadata.style) {
    parts.push(`with ${metadata.style} styling`);
  }

  if (metadata.tags?.length) {
    parts.push(`tags: ${metadata.tags.join(', ')}`);
  }

  return parts.join(' ');
}

