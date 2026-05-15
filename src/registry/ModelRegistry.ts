import type { BaseProvider } from '../providers/base';

export class ModelRegistry {
  private readonly map = new Map<string, BaseProvider>();

  register(modelId: string, provider: BaseProvider): this {
    this.map.set(modelId, provider);
    return this;
  }

  registerMany(modelIds: readonly string[], provider: BaseProvider): this {
    for (const id of modelIds) {
      this.map.set(id, provider);
    }
    return this;
  }

  getProvider(modelId: string): BaseProvider | undefined {
    return this.map.get(modelId);
  }

  isSupported(modelId: string): boolean {
    return this.map.has(modelId);
  }

  getSupportedModels(): string[] {
    return Array.from(this.map.keys());
  }
}
