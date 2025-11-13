export interface DataGeneratorConfig {
  minValue: number;
  maxValue: number;
  changeRate: number;
}

export class DataGenerator {
  private config: DataGeneratorConfig;
  private values: Map<string, number> = new Map();

  constructor(config: DataGeneratorConfig) {
    this.config = config;
  }

  // Generate random value within range
  generateRandom(): number {
    const { minValue, maxValue } = this.config;
    return Math.random() * (maxValue - minValue) + minValue;
  }

  // Generate sine wave value
  generateSineWave(address: string, frequency: number = 0.1): number {
    const time = Date.now() / 1000;
    const { minValue, maxValue } = this.config;
    const amplitude = (maxValue - minValue) / 2;
    const offset = minValue + amplitude;
    return Math.sin(time * frequency * 2 * Math.PI) * amplitude + offset;
  }

  // Generate value that changes gradually
  generateGradual(address: string): number {
    const current = this.values.get(address) ?? this.generateRandom();
    const { minValue, maxValue, changeRate } = this.config;

    // Random walk with constraints
    const change = (Math.random() - 0.5) * 2 * changeRate;
    let newValue = current + change;

    // Keep within bounds
    newValue = Math.max(minValue, Math.min(maxValue, newValue));

    this.values.set(address, newValue);
    return newValue;
  }

  // Generate sawtooth wave
  generateSawtooth(address: string, period: number = 10): number {
    const time = Date.now() / 1000;
    const { minValue, maxValue } = this.config;
    const phase = (time % period) / period;
    return phase * (maxValue - minValue) + minValue;
  }

  // Generate square wave
  generateSquareWave(address: string, period: number = 10): number {
    const time = Date.now() / 1000;
    const { minValue, maxValue } = this.config;
    const phase = (time % period) / period;
    return phase < 0.5 ? minValue : maxValue;
  }

  // Generate noise around a base value
  generateNoisy(baseValue: number, noiseLevel: number = 5): number {
    const noise = (Math.random() - 0.5) * 2 * noiseLevel;
    return baseValue + noise;
  }

  reset(address: string): void {
    this.values.delete(address);
  }

  resetAll(): void {
    this.values.clear();
  }
}
