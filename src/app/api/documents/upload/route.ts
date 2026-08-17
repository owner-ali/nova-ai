import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractText } from "@/lib/document-parser";
import { openai, AI_MODEL } from "@/lib/openai";
import { rateLimit } from "@/lib/rate-limit";

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
]);
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const limited = rateLimit(`doc-upload:${userId}`, 10, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "Please wait before uploading again." }, { status: 429 });

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Only PDF, DOCX, and TXT files are supported." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File is too large (max 10MB)." }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const extractedText = await extractText(buffer, file.type);

    const uploadDir = path.join(process.cwd(), "public", "uploads", userId);
    await mkdir(uploadDir, { recursive: true });
    const fileName = `${randomUUID()}-${file.name}`;
    await writeFile(path.join(uploadDir, fileName), buffer);
    const storageUrl = `/uploads/${userId}/${fileName}`;

    let summary: string | null = null;
    if (extractedText.trim()) {
      const completion = await openai.chat.completions.create({
        model: AI_MODEL,
        messages: [
          { role: "system", content: "Summarize documents concisely for a busy professional, in 3-5 sentences." },
          { role: "user", content: extractedText.slice(0, 12000) },
        ],
      });
      summary = completion.choices[0].message.content ?? null;
    }

    const document = await prisma.document.create({
      data: {
        userId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        storageUrl,
        extractedText: extractedText.slice(0, 50000),
        summary,
      },
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Unable to process this document. Please try again." }, { status: 500 });
  }
}
