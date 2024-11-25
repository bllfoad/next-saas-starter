import { db } from "@/lib/db/drizzle";
import { flashcards } from "@/lib/db/schema";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const allFlashcards = await db.select().from(flashcards).orderBy(flashcards.index);
    return NextResponse.json({ flashcards: allFlashcards });
  } catch (error) {
    console.error('Error fetching flashcards:', error);
    return NextResponse.json({ error: 'Failed to fetch flashcards' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Flashcard ID is required' }, { status: 400 });
    }

    await db.update(flashcards)
      .set(updates)
      .where(eq(flashcards.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating flashcard:', error);
    return NextResponse.json({ error: 'Failed to update flashcard' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Flashcard ID is required' }, { status: 400 });
    }

    await db.delete(flashcards)
      .where(eq(flashcards.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting flashcard:', error);
    return NextResponse.json({ error: 'Failed to delete flashcard' }, { status: 500 });
  }
}
