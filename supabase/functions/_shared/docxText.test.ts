import { extractDocxText } from "./docxText.ts";

function assertEquals<T>(actual: T, expected: T) {
  if (actual !== expected) {
    throw new Error(`Assertion failed. Actual: ${JSON.stringify(actual)} Expected: ${JSON.stringify(expected)}`);
  }
}

function uint16(value: number): number[] {
  return [value & 0xff, (value >> 8) & 0xff];
}

function uint32(value: number): number[] {
  return [value & 0xff, (value >> 8) & 0xff, (value >> 16) & 0xff, (value >> 24) & 0xff];
}

function ascii(value: string): number[] {
  return [...new TextEncoder().encode(value)];
}

function createStoredZip(filename: string, content: string): Uint8Array {
  const nameBytes = ascii(filename);
  const contentBytes = [...new TextEncoder().encode(content)];
  const localHeaderOffset = 0;
  const localHeader = [
    ...uint32(0x04034b50),
    ...uint16(20),
    ...uint16(0),
    ...uint16(0),
    ...uint16(0),
    ...uint16(0),
    ...uint32(0),
    ...uint32(contentBytes.length),
    ...uint32(contentBytes.length),
    ...uint16(nameBytes.length),
    ...uint16(0),
    ...nameBytes,
  ];
  const centralDirectoryOffset = localHeader.length + contentBytes.length;
  const centralDirectory = [
    ...uint32(0x02014b50),
    ...uint16(20),
    ...uint16(20),
    ...uint16(0),
    ...uint16(0),
    ...uint16(0),
    ...uint16(0),
    ...uint32(0),
    ...uint32(contentBytes.length),
    ...uint32(contentBytes.length),
    ...uint16(nameBytes.length),
    ...uint16(0),
    ...uint16(0),
    ...uint16(0),
    ...uint16(0),
    ...uint32(0),
    ...uint32(localHeaderOffset),
    ...nameBytes,
  ];
  const eocd = [
    ...uint32(0x06054b50),
    ...uint16(0),
    ...uint16(0),
    ...uint16(1),
    ...uint16(1),
    ...uint32(centralDirectory.length),
    ...uint32(centralDirectoryOffset),
    ...uint16(0),
  ];

  return new Uint8Array([...localHeader, ...contentBytes, ...centralDirectory, ...eocd]);
}

Deno.test("extractDocxText reads Word document paragraphs from a DOCX archive", async () => {
  const xml = [
    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
    "<w:document xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\"><w:body>",
    "<w:p><w:r><w:t>Cat6 &amp; RJ45</w:t></w:r></w:p>",
    "<w:p><w:r><w:t>Terminate to T568B unless directed otherwise.</w:t></w:r></w:p>",
    "</w:body></w:document>",
  ].join("");
  const zip = createStoredZip("word/document.xml", xml);

  assertEquals(await extractDocxText(zip), "Cat6 & RJ45\n\nTerminate to T568B unless directed otherwise.");
});
