import { DRIVE_FILE_WRITE_SCOPE, getDriveAccessToken } from "./google-jwt.ts";

const DRIVE_API_BASE_URL = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_BASE_URL = "https://www.googleapis.com/upload/drive/v3";
export const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";
export const DRIVE_WRITE_SCOPES = [DRIVE_FILE_WRITE_SCOPE];

export interface DriveFileRef {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  webViewLink?: string;
  appProperties?: Record<string, string>;
  reused: boolean;
}

export interface EnsureFolderInput {
  parentId: string;
  name: string;
  description?: string;
  appProperties?: Record<string, string>;
}

export interface EnsureTextFileInput {
  parentId: string;
  name: string;
  content: string;
  mimeType: "text/markdown" | "text/plain" | "application/json";
  description?: string;
  appProperties?: Record<string, string>;
}

export interface DriveWriteAdapter {
  ensureFolder(input: EnsureFolderInput): Promise<DriveFileRef>;
  ensureTextFile(input: EnsureTextFileInput): Promise<DriveFileRef>;
}

export class DriveWriteError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 502,
  ) {
    super(message);
  }
}

function escapeDriveQueryLiteral(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function buildDriveUrl(
  baseUrl: string,
  path: string,
  params: Record<string, string | undefined>,
): URL {
  const url = new URL(`${baseUrl}${path}`);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, value);
    }
  }

  return url;
}

function appPropertiesQueryClause(appProperties: Record<string, string> | undefined): string {
  const entries = Object.entries(appProperties ?? {}).filter(([, value]) => value.trim());

  if (entries.length === 0) {
    return "";
  }

  return entries.map(([key, value]) =>
    ` and appProperties has { key='${escapeDriveQueryLiteral(key)}' and value='${escapeDriveQueryLiteral(value)}' }`
  ).join("");
}

function validateDriveName(name: string): void {
  if (!name.trim()) {
    throw new DriveWriteError("invalid_drive_name", "Drive file/folder name is required.", 400);
  }

  if (/[\\/\u0000-\u001f]/u.test(name) || name === "." || name === "..") {
    throw new DriveWriteError("invalid_drive_name", `Unsafe Drive name: ${name}`, 400);
  }
}

async function fetchDriveJson<T>(
  fetchImpl: typeof fetch,
  url: URL,
  accessToken: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetchImpl(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new DriveWriteError(
      "drive_api_error",
      `Google Drive API request failed (${response.status}) ${body}`,
      502,
    );
  }

  return response.json() as Promise<T>;
}

async function findChildByName(
  fetchImpl: typeof fetch,
  accessToken: string,
  parentId: string,
  name: string,
  mimeType?: string,
  appProperties?: Record<string, string>,
): Promise<DriveFileRef | null> {
  const mimeClause = mimeType ? ` and mimeType='${escapeDriveQueryLiteral(mimeType)}'` : "";
  const url = buildDriveUrl(DRIVE_API_BASE_URL, "/files", {
    q: `'${escapeDriveQueryLiteral(parentId)}' in parents and name='${
      escapeDriveQueryLiteral(name)
    }'${mimeClause}${appPropertiesQueryClause(appProperties)} and trashed=false`,
    fields: "files(id,name,mimeType,parents,webViewLink,appProperties)",
    pageSize: "1",
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
  });
  const result = await fetchDriveJson<{ files?: Array<Omit<DriveFileRef, "reused">> }>(
    fetchImpl,
    url,
    accessToken,
  );
  const [file] = result.files ?? [];

  return file ? { ...file, reused: true } : null;
}

async function createFolder(
  fetchImpl: typeof fetch,
  accessToken: string,
  input: EnsureFolderInput,
): Promise<DriveFileRef> {
  const url = buildDriveUrl(DRIVE_API_BASE_URL, "/files", {
    fields: "id,name,mimeType,parents,webViewLink,appProperties",
    supportsAllDrives: "true",
  });
  const created = await fetchDriveJson<Omit<DriveFileRef, "reused">>(fetchImpl, url, accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: input.name,
      mimeType: FOLDER_MIME_TYPE,
      parents: [input.parentId],
      description: input.description,
      appProperties: input.appProperties,
    }),
  });

  return { ...created, reused: false };
}

function multipartBody(metadata: Record<string, unknown>, content: string, mimeType: string): { body: string; boundary: string } {
  const boundary = `redex_${crypto.randomUUID().replace(/-/g, "")}`;
  const body = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
    `--${boundary}`,
    `Content-Type: ${mimeType}; charset=UTF-8`,
    "",
    content,
    `--${boundary}--`,
    "",
  ].join("\r\n");

  return { body, boundary };
}

async function uploadTextFile(
  fetchImpl: typeof fetch,
  accessToken: string,
  input: EnsureTextFileInput,
): Promise<DriveFileRef> {
  const url = buildDriveUrl(DRIVE_UPLOAD_BASE_URL, "/files", {
    uploadType: "multipart",
    fields: "id,name,mimeType,parents,webViewLink,appProperties",
    supportsAllDrives: "true",
  });
  const { body, boundary } = multipartBody({
    name: input.name,
    mimeType: input.mimeType,
    parents: [input.parentId],
    description: input.description,
    appProperties: input.appProperties,
  }, input.content, input.mimeType);
  const created = await fetchDriveJson<Omit<DriveFileRef, "reused">>(fetchImpl, url, accessToken, {
    method: "POST",
    headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
    body,
  });

  return { ...created, reused: false };
}

export async function createGoogleDriveWriteAdapter(
  accessToken?: string,
  fetchImpl: typeof fetch = fetch,
): Promise<DriveWriteAdapter> {
  const resolvedAccessToken = accessToken ?? await getDriveAccessToken({ scopes: DRIVE_WRITE_SCOPES });

  return {
    async ensureFolder(input: EnsureFolderInput): Promise<DriveFileRef> {
      validateDriveName(input.name);
      const existing = await findChildByName(
        fetchImpl,
        resolvedAccessToken,
        input.parentId,
        input.name,
        FOLDER_MIME_TYPE,
        input.appProperties,
      );

      if (existing) {
        return existing;
      }

      if (input.appProperties && Object.keys(input.appProperties).length > 0) {
        const sameName = await findChildByName(fetchImpl, resolvedAccessToken, input.parentId, input.name, FOLDER_MIME_TYPE);
        if (sameName) {
          throw new DriveWriteError(
            "drive_folder_conflict",
            `A Drive folder named ${input.name} already exists without the expected Redex metadata.`,
            409,
          );
        }
      }

      return createFolder(fetchImpl, resolvedAccessToken, input);
    },

    async ensureTextFile(input: EnsureTextFileInput): Promise<DriveFileRef> {
      validateDriveName(input.name);
      const existing = await findChildByName(
        fetchImpl,
        resolvedAccessToken,
        input.parentId,
        input.name,
        input.mimeType,
        input.appProperties,
      );

      if (existing) {
        return existing;
      }

      if (input.appProperties && Object.keys(input.appProperties).length > 0) {
        const sameName = await findChildByName(fetchImpl, resolvedAccessToken, input.parentId, input.name, input.mimeType);
        if (sameName) {
          throw new DriveWriteError(
            "drive_file_conflict",
            `A Drive file named ${input.name} already exists without the expected Redex metadata.`,
            409,
          );
        }
      }

      return uploadTextFile(fetchImpl, resolvedAccessToken, input);
    },
  };
}
