import { TagValue, SimulationType, SimulationConfig } from '../types';

export class DataGenerator {
  private startTime: number;
  private currentValue: number;
  private rampDirection: number = 1;

  constructor(private config: SimulationConfig) {
    this.startTime = Date.now();
    this.currentValue = config.min || 0;
  }

  generate(): TagValue {
    switch (this.config.type) {
      case SimulationType.SINE_WAVE:
        return this.generateSineWave();
      case SimulationType.RANDOM:
        return this.generateRandom();
      case SimulationType.BOOLEAN_TOGGLE:
        return this.generateBooleanToggle();
      case SimulationType.RAMP:
        return this.generateRamp();
      default:
        return 0;
    }
  }

  private generateSineWave(): number {
    const elapsed = (Date.now() - this.startTime) / 1000;
    const frequency = this.config.frequency || 0.1;
    const min = this.config.min || 0;
    const max = this.config.max || 100;

    const amplitude = (max - min) / 2;
    const offset = min + amplitude;

    return offset + amplitude * Math.sin(elapsed * frequency * 2 * Math.PI);
  }

  private generateRandom(): number {
    const min = this.config.min || 0;
    const max = this.config.max || 100;

    return min + Math.random() * (max - min);
  }

  private generateBooleanToggle(): boolean {
    const probability = this.config.toggleProbability || 0.1;
    return Math.random() < probability ? !this.currentValue : Boolean(this.currentValue);
  }

  private generateRamp(): number {
    const min = this.config.min || 0;
    const max = this.config.max || 100;
    const step = this.config.step || 1;

    this.currentValue += this.rampDirection * step;

    if (this.currentValue >= max) {
      this.currentValue = max;
      this.rampDirection = -1;
    } else if (this.currentValue <= min) {
      this.currentValue = min;
      this.rampDirection = 1;
    }

    return this.currentValue;
  }

  reset(): void {
    this.startTime = Date.now();
    this.currentValue = this.config.min || 0;
    this.rampDirection = 1;
  }
}
