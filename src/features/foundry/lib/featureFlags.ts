export function isFoundryTopicEntryEnabled(): boolean {
  return import.meta.env.VITE_FOUNDRY_TOPIC_ENTRY === 'true' || import.meta.env.MODE === 'test'
}

export function isModuleIntakeBackendEnabled(): boolean {
  return import.meta.env.VITE_MODULE_INTAKE_BACKEND === 'true'
}
