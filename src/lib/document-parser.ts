import "server-only";

// Extracts plain text from an uploaded document buffer based on its type.
// Files are stored under public/uploads for this reference implementation;
// swap storageUrl for an S3/GCS URL in production.
export async function extractText(buffer: Buffer, fileType: string): Promise<string> {
  try {
    if (fileType === "application/pdf") {
      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(buffer);
      return data.text;
    }

    if (
      fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileType === "application/msword"
    ) {
      const mammoth = await import("mammoth");
      const { value } = await mammoth.extractRawText({ buffer });
      return value;
    }

    // Plain text and anything else we can safely decode as UTF-8.
    return buffer.toString("utf-8");
  } catch (err) {
    console.error("Text extraction failed:", err);
    return "";
  }
}
