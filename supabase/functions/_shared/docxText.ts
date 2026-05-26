export class DocxTextExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocxTextExtractionError";
  }
}

const LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
const WORD_DOCUMENT_PATH = "word/document.xml";

function readUint16(view: DataView, offset: number): number {
  return view.getUint16(offset, true);
}

function readUint32(view: DataView, offset: number): number {
  return view.getUint32(offset, true);
}

function decodeAscii(bytes: Uint8Array): string {
  return new TextDecoder("utf-8").decode(bytes);
}

function findEndOfCentralDirectory(view: DataView): number {
  const minimumSize = 22;
  const maxCommentLength = 0xffff;
  const lowerBound = Math.max(0, view.byteLength - minimumSize - maxCommentLength);

  for (let offset = view.byteLength - minimumSize; offset >= lowerBound; offset -= 1) {
    if (readUint32(view, offset) === END_OF_CENTRAL_DIRECTORY_SIGNATURE) {
      return offset;
    }
  }

  throw new DocxTextExtractionError("DOCX zip end-of-central-directory record was not found.");
}

async function inflateDeflateRaw(compressed: Uint8Array): Promise<Uint8Array> {
  const compressedBuffer = compressed.buffer.slice(
    compressed.byteOffset,
    compressed.byteOffset + compressed.byteLength,
  ) as ArrayBuffer;
  const blob = new Blob([compressedBuffer]);

  try {
    const stream = blob.stream().pipeThrough(new DecompressionStream("deflate-raw" as CompressionFormat));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  } catch (_error) {
    const stream = blob.stream().pipeThrough(new DecompressionStream("deflate"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }
}

async function readZipEntry(bytes: Uint8Array, entryName: string): Promise<Uint8Array> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const eocdOffset = findEndOfCentralDirectory(view);
  const centralDirectorySize = readUint32(view, eocdOffset + 12);
  const centralDirectoryOffset = readUint32(view, eocdOffset + 16);
  const centralDirectoryEnd = centralDirectoryOffset + centralDirectorySize;
  let offset = centralDirectoryOffset;

  while (offset < centralDirectoryEnd) {
    if (readUint32(view, offset) !== CENTRAL_DIRECTORY_SIGNATURE) {
      throw new DocxTextExtractionError("DOCX zip central directory is malformed.");
    }

    const compressionMethod = readUint16(view, offset + 10);
    const compressedSize = readUint32(view, offset + 20);
    const fileNameLength = readUint16(view, offset + 28);
    const extraFieldLength = readUint16(view, offset + 30);
    const fileCommentLength = readUint16(view, offset + 32);
    const localHeaderOffset = readUint32(view, offset + 42);
    const fileNameStart = offset + 46;
    const fileName = decodeAscii(bytes.slice(fileNameStart, fileNameStart + fileNameLength));

    if (fileName === entryName) {
      if (readUint32(view, localHeaderOffset) !== LOCAL_FILE_HEADER_SIGNATURE) {
        throw new DocxTextExtractionError("DOCX zip local file header is malformed.");
      }

      const localFileNameLength = readUint16(view, localHeaderOffset + 26);
      const localExtraFieldLength = readUint16(view, localHeaderOffset + 28);
      const dataStart = localHeaderOffset + 30 + localFileNameLength + localExtraFieldLength;
      const compressed = bytes.slice(dataStart, dataStart + compressedSize);

      if (compressionMethod === 0) {
        return compressed;
      }

      if (compressionMethod === 8) {
        return inflateDeflateRaw(compressed);
      }

      throw new DocxTextExtractionError(`Unsupported DOCX zip compression method: ${compressionMethod}.`);
    }

    offset += 46 + fileNameLength + extraFieldLength + fileCommentLength;
  }

  throw new DocxTextExtractionError(`${entryName} was not found in DOCX archive.`);
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_match, codepoint: string) => String.fromCodePoint(Number(codepoint)))
    .replace(/&#x([0-9a-f]+);/giu, (_match, codepoint: string) => String.fromCodePoint(Number.parseInt(codepoint, 16)));
}

function extractParagraphText(documentXml: string): string {
  return documentXml
    .split(/<\/w:p>/u)
    .map((paragraphXml) => {
      const textRuns = [...paragraphXml.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/gu)]
        .map((match) => decodeXmlEntities(match[1] ?? ""));
      return textRuns.join("").trim();
    })
    .filter((paragraph) => paragraph.length > 0)
    .join("\n\n");
}

export async function extractDocxText(bytes: Uint8Array): Promise<string> {
  const documentXmlBytes = await readZipEntry(bytes, WORD_DOCUMENT_PATH);
  const documentXml = new TextDecoder("utf-8").decode(documentXmlBytes);
  const text = extractParagraphText(documentXml).trim();

  if (!text) {
    throw new DocxTextExtractionError("DOCX file did not contain extractable document text.");
  }

  return text;
}
