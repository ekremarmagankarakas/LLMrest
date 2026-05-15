import { ModelRegistry } from '../../src/registry/ModelRegistry';
import { BaseProvider } from '../../src/providers/base';

class MockProvider extends BaseProvider {
  chat = jest.fn().mockResolvedValue('response');
}

describe('ModelRegistry', () => {
  let registry: ModelRegistry;
  let provider: MockProvider;

  beforeEach(() => {
    registry = new ModelRegistry();
    provider = new MockProvider();
  });

  it('registers and retrieves a single model', () => {
    registry.register('gpt-4', provider);
    expect(registry.getProvider('gpt-4')).toBe(provider);
  });

  it('registers multiple models to same provider', () => {
    registry.registerMany(['gpt-4', 'gpt-4o'], provider);
    expect(registry.getProvider('gpt-4')).toBe(provider);
    expect(registry.getProvider('gpt-4o')).toBe(provider);
  });

  it('returns undefined for unknown model', () => {
    expect(registry.getProvider('unknown-model')).toBeUndefined();
  });

  it('isSupported returns true for registered model', () => {
    registry.register('gpt-4', provider);
    expect(registry.isSupported('gpt-4')).toBe(true);
  });

  it('isSupported returns false for unregistered model', () => {
    expect(registry.isSupported('gpt-4')).toBe(false);
  });

  it('getSupportedModels returns all registered model ids', () => {
    registry.registerMany(['gpt-4', 'gpt-4o'], provider);
    const supported = registry.getSupportedModels();
    expect(supported).toContain('gpt-4');
    expect(supported).toContain('gpt-4o');
    expect(supported).toHaveLength(2);
  });

  it('register returns this for chaining', () => {
    expect(registry.register('gpt-4', provider)).toBe(registry);
  });

  it('registerMany returns this for chaining', () => {
    expect(registry.registerMany(['gpt-4'], provider)).toBe(registry);
  });
});
