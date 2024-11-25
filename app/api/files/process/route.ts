import { db } from '@/lib/db/drizzle';
import { flashcards, lessonFiles } from '@/lib/db/schema';
import { Storage } from '@google-cloud/storage';
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { PDFDocument } from 'pdf-lib';
import { getUser } from '@/lib/db/queries';

interface ServiceClients {
  storage: Storage;
  genAI: GoogleGenerativeAI;
}

interface PDFChunk {
  content: string;
  pageNumber: number;
  lineNumber: number;
  filename: string;
}

const FlashcardSchema = z.object({
  term: z.string().min(1),
  definition: z.string().min(1),
  hint: z.string().optional(),
  explanation: z.string().optional(),
  source: z.string().min(1),
  page: z.string().min(1),
  keyConcept: z.string().optional(),
  difficulty: z.number().int().min(1).max(100),
  index: z.number().default(0),
  language: z.string().min(2),
  metadata: z.object({
    chapter: z.string(),
    section: z.string().nullable().default(''),
    topic: z.string(),
    language: z.string().min(2),
    lineNumber: z.number().int().positive(),
    pageNumber: z.number().int().positive(),
  }).optional(),
});

const AIResponseSchema = z.object({
  flashcards: z.array(FlashcardSchema),
});

type Flashcard = z.infer<typeof FlashcardSchema>;
type AIResponse = z.infer<typeof AIResponseSchema>;

const CONFIG = {
  BUCKET_NAME: process.env.GOOGLE_CLOUD_BUCKET || 'your-bucket-name',
  SUPPORTED_MIME_TYPES: ['application/pdf'] as const,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_RETRIES: 3,
  INITIAL_RETRY_DELAY: 1000,
  PAGES_PER_BATCH: 5
} as const;

class ProcessingError extends Error {
  constructor(message: string, public status: number = 500) {
    super(message);
    this.name = 'ProcessingError';
  }
}

function initializeClients(): ServiceClients {
  console.log('Initializing service clients...');
  try {
    const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS!);
    
    const storage = new Storage({
      credentials,
      projectId: credentials.project_id
    });

    return {
      storage,
      genAI: new GoogleGenerativeAI(process.env.GEMINI_API_KEY!),
    };
  } catch (error) {
    console.error('Error initializing clients:', error);
    throw new ProcessingError('Failed to initialize services', 500);
  }
}

async function validateRequest(request: Request) {
  console.log('Validating request...');
  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    throw new ProcessingError('File is required', 400);
  }

  if (file.size > CONFIG.MAX_FILE_SIZE) {
    throw new ProcessingError('File size exceeds limit', 400);
  }

  return { file };
}

class FileProcessor {
  private bucket: any;

  constructor(private clients: ServiceClients) {
    this.bucket = this.clients.storage.bucket(CONFIG.BUCKET_NAME);
  }

  async uploadFile(file: File): Promise<string> {
    console.log('Uploading file:', file.name);
    const buffer = await file.arrayBuffer();
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const blob = this.bucket.file(filename);

    try {
      await blob.save(Buffer.from(buffer), {
        metadata: {
          contentType: file.type,
        },
      });

      const [url] = await blob.getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Store file information in the database
      await db.insert(lessonFiles).values({
        filename: file.name,
        url: url,
        mimeType: file.type,
        size: file.size,
        metadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      });

      console.log('File uploaded successfully:', url);
      return url;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new ProcessingError('Failed to upload file', 500);
    }
  }

  async splitPdfIntoBatches(file: File): Promise<Uint8Array[][]> {
    const buffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(buffer);
    const numPages = pdfDoc.getPageCount();
    const batches: Uint8Array[][] = [];
    
    for (let i = 0; i < numPages; i += CONFIG.PAGES_PER_BATCH) {
      const newPdf = await PDFDocument.create();
      const pageIndices = Array.from(
        { length: Math.min(CONFIG.PAGES_PER_BATCH, numPages - i) },
        (_, k) => i + k
      );
      
      const pages = await newPdf.copyPages(pdfDoc, pageIndices);
      pages.forEach(page => newPdf.addPage(page));
      
      const pdfBytes = await newPdf.save();
      batches.push([pdfBytes]);
    }
    
    return batches;
  }
}

class FlashcardGenerator {
  constructor(private genAI: GoogleGenerativeAI) {}

  private cleanJsonResponse(text: string): string {
    // First remove any markdown code block indicators
    text = text.replace(/```json\s*|\s*```/g, '');
    
    // Remove any trailing non-JSON content (sometimes the AI adds explanations after the JSON)
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      text = text.slice(jsonStart, jsonEnd + 1);
    }
    
    // Clean any remaining whitespace
    return text.trim();
  }

  private async processChunkWithRetry(pdfBatch: Uint8Array[], pageNumbers: number[], file: File, user: any, attempt = 0): Promise<Flashcard[]> {
    try {
      console.log(`Processing batch with pages: ${pageNumbers.join(', ')}`);
      const model = this.genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL_NAME || 'gemini-1.5-flash' });

      const pdfParts = pdfBatch.map(pdfBuffer => ({
        inlineData: {
          data: Buffer.from(pdfBuffer).toString('base64'),
          mimeType: 'application/pdf'
        }
      }));
      console.log('Prepared PDF parts for Gemini API');

      const userLanguage = typeof user.mainLanguage === 'string' ? user.mainLanguage : 'en';
      console.log('Using language:', userLanguage);

      const prompt = {
        text: `You are a flashcard generation assistant. Create educational flashcards in ${userLanguage} from the following PDF content.
        Each flashcard should have:
        - A clear, concise term
        - A comprehensive definition
        - A helpful hint (optional)
        - An explanation providing additional context
        - A key concept that this flashcard relates to
        - A difficulty score from 1-100 where:
          1-20: Basic facts and definitions
          21-40: Simple understanding required
          41-60: Moderate complexity
          61-80: Complex topics
          81-100: Advanced concepts
        
        Focus on the most important concepts and ensure each flashcard is unique and valuable for learning.
        
        For each flashcard, include:
        - source: "${file.name}"
        - page: The page number as a string (e.g. "1", "2", etc)
        - language: "${userLanguage}"
        
        Example response format:
        {
          "flashcards": [
            {
              "term": "Example Term",
              "definition": "Example definition",
              "hint": "Optional hint",
              "explanation": "Additional context",
              "keyConcept": "Main topic",
              "difficulty": 50,
              "source": "${file.name}",
              "page": "1",
              "language": "${userLanguage}"
            }
          ]
        }`
      };

      console.log('Calling Gemini API...');
      const result = await model.generateContent([prompt, ...pdfParts]);
      const response = await result.response.text();
      console.log('Received response from Gemini API');
      console.log('Raw response:', response);

      const cleaned = this.cleanJsonResponse(response);
      console.log('Cleaned response:', cleaned);
      
      let parsed;
      try {
        parsed = JSON.parse(cleaned);
        console.log('Successfully parsed JSON');
      } catch (error) {
        console.error('JSON parse error:', error);
        throw error;
      }

      if (parsed.flashcards) {
        parsed.flashcards = parsed.flashcards.map((card: any, index: number) => ({
          ...card,
          source: file.name,
          page: pageNumbers[index % pageNumbers.length].toString(),
          language: userLanguage
        }));
        console.log(`Processed ${parsed.flashcards.length} flashcards`);
      }

      console.log('Validating flashcards with schema...');
      const validatedResponse = AIResponseSchema.parse(parsed);
      console.log('Validation successful');

      return validatedResponse.flashcards;
    } catch (error) {
      console.error('Error processing PDF batch:', error);
      if (attempt < CONFIG.MAX_RETRIES - 1) {
        const delay = CONFIG.INITIAL_RETRY_DELAY * Math.pow(2, attempt);
        console.log(`Retrying in ${delay}ms... (attempt ${attempt + 1}/${CONFIG.MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.processChunkWithRetry(pdfBatch, pageNumbers, file, user, attempt + 1);
      }
      throw new ProcessingError(error instanceof Error ? error.message : 'Failed to process PDF batch', 500);
    }
  }

  async generate(pdfBatches: Uint8Array[][], file: File, user: any): Promise<void> {
    console.log(`Starting flashcard generation for ${file.name}`);
    console.log(`Total batches: ${pdfBatches.length}`);
    
    let pageNumber = 1;
    for (const batch of pdfBatches) {
      console.log(`Processing batch ${pageNumber} of ${pdfBatches.length}`);
      const pageNumbers = Array.from({ length: batch.length }, (_, i) => pageNumber + i);
      const flashcards = await this.processChunkWithRetry(batch, pageNumbers, file, user);
      console.log(`Generated ${flashcards.length} flashcards for batch`);
      
      for (const flashcard of flashcards) {
        await this.storeFlashcard(flashcard, file);
      }
      console.log(`Stored flashcards for batch ${pageNumber}`);
      
      pageNumber += batch.length;
    }
    
    console.log('Flashcard generation complete');
  }

  private async storeFlashcard(flashcard: Flashcard, file: File) {
    try {
      await db.insert(flashcards).values({
        term: flashcard.term,
        definition: flashcard.definition,
        hint: flashcard.hint,
        explanation: flashcard.explanation,
        source: file.name,
        page: flashcard.page,
        keyConcept: flashcard.keyConcept,
        difficulty: flashcard.difficulty,
        index: flashcard.index,
        metadata: flashcard.metadata ? JSON.stringify({
          ...flashcard.metadata,
          filename: file.name,
        }) : null,
      });
    } catch (error) {
      console.error('Failed to store flashcard:', error);
      throw new ProcessingError('Failed to store flashcard', 500);
    }
  }
}

export async function POST(request: Request) {
  const clients = initializeClients();

  try {
    const { file } = await validateRequest(request);
    console.log('Processing file:', file.name);

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const fileProcessor = new FileProcessor(clients);
    const fileUrl = await fileProcessor.uploadFile(file);
    
    let pdfBatches;
    try {
      pdfBatches = await fileProcessor.splitPdfIntoBatches(file);
    } catch (splitError) {
      console.error('Error splitting PDF into batches:', splitError);
      return NextResponse.json({ error: 'Failed to process the PDF file. It may be corrupted or in an unsupported format.' }, { status: 500 });
    }
    
    const flashcardGenerator = new FlashcardGenerator(clients.genAI);
    await flashcardGenerator.generate(pdfBatches, file, user);

    return NextResponse.json({
      message: 'File processed successfully',
      fileUrl: fileUrl,
    });
  } catch (error) {
    if (error instanceof ProcessingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
