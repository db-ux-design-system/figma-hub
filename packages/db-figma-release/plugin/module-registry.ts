import type { PluginModule } from "./types";

export class ModuleRegistry {
  private modules: Map<string, PluginModule> = new Map();

  register(module: PluginModule): void {
    if (this.modules.has(module.id)) {
      throw new Error(`Module with ID "${module.id}" is already registered`);
    }
    this.modules.set(module.id, module);
  }

  get(id: string): PluginModule | undefined {
    return this.modules.get(id);
  }

  getAll(): PluginModule[] {
    return Array.from(this.modules.values());
  }

  has(id: string): boolean {
    return this.modules.has(id);
  }
}
