export class Duration {
  private constructor(private readonly milliseconds: number) {}

  // Factory methods
  static milliseconds(value: number): Duration {
    return new Duration(value);
  }

  static seconds(value: number): Duration {
    return new Duration(value * 1000);
  }

  static minutes(value: number): Duration {
    return new Duration(value * 60 * 1000);
  }

  static hours(value: number): Duration {
    return new Duration(value * 60 * 60 * 1000);
  }

  static days(value: number): Duration {
    return new Duration(value * 24 * 60 * 60 * 1000);
  }

  static weeks(value: number): Duration {
    return new Duration(value * 7 * 24 * 60 * 60 * 1000);
  }

  static months(value: number): Duration {
    return new Duration(value * (365.25 / 12) * 24 * 60 * 60 * 1000);
  }

  static years(value: number): Duration {
    return new Duration(value * 365.25 * 24 * 60 * 60 * 1000);
  }

  // Getters
  toMilliseconds(): number {
    return this.milliseconds;
  }

  toSeconds(): number {
    return Math.round(this.milliseconds / 1000);
  }

  toMinutes(): number {
    return Math.round(this.milliseconds / (60 * 1000));
  }

  toHours(): number {
    return Math.round(this.milliseconds / (60 * 60 * 1000));
  }

  toDays(): number {
    return Math.round(this.milliseconds / (24 * 60 * 60 * 1000));
  }

  toMonths(): number {
    return Math.round(this.milliseconds / (365.25 / 12 * 24 * 60 * 60 * 1000));
  }

  toYears(): number {
    return Math.round(this.milliseconds / (365.25 * 24 * 60 * 60 * 1000));
  }

  // Adds current unix epoch to duration
  // example = expiresAt: Duration.days(30).fromNow().toMilliseconds()
  fromNow() {
    return new Duration(Date.now() + this.milliseconds);
  }

  // Arithmetic
  plus(other: Duration): Duration {
    return new Duration(this.milliseconds + other.milliseconds);
  }

  minus(other: Duration): Duration {
    return new Duration(this.milliseconds - other.milliseconds);
  }

  multipliedBy(factor: number): Duration {
    return new Duration(this.milliseconds * factor);
  }

  // Comparison
  equals(other: Duration): boolean {
    return this.milliseconds === other.milliseconds;
  }

  isLongerThan(other: Duration): boolean {
    return this.milliseconds > other.milliseconds;
  }

  isShorterThan(other: Duration): boolean {
    return this.milliseconds < other.milliseconds;
  }

  isZero(): boolean {
    return this.milliseconds === 0;
  }

  isNegative(): boolean {
    return this.milliseconds < 0;
  }

  // Utilities
  abs(): Duration {
    return new Duration(Math.abs(this.milliseconds));
  }

  toString(): string {
    const ms = Math.abs(this.milliseconds);
    const sign = this.milliseconds < 0 ? "-" : "";

    if (ms < 1000) {
      return `${sign}${ms}ms`;
    }
    if (ms < 60_000) {
      return `${sign}${ms / 1000}s`;
    }
    if (ms < 3_600_000) {
      return `${sign}${ms / 60_000}m`;
    }
    if (ms < 86_400_000) {
      return `${sign}${ms / 3_600_000}h`;
    }
    return `${sign}${ms / 86_400_000}d`;
  }
}
