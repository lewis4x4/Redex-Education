export const MODULE_TO_VERSION_MAP: Record<string, string> = {
  'hr-basics-mod-001': 'module-version-hr-basics-v1',
}

export function getModuleVersionId(moduleId: string): string | undefined {
  return MODULE_TO_VERSION_MAP[moduleId]
}
