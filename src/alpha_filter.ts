export class AlphaFilter {
  time_constant = 0;
  alpha = 0;
  state = 0;

  set_params(sample_interval: number, time_constant: number) {
    const demon = time_constant + sample_interval;
    if (demon > Number.EPSILON) {
      this.alpha = sample_interval / demon;
    }
    this.time_constant = time_constant;
  };

  set_cutoff_freq(sample_freq: number, cutoff_freq: number) {
    this.set_params(1 / sample_freq, 1 / (Math.PI * 2 * cutoff_freq));
  };

  update(sample: number): number {
    this.state = this.state + this.alpha * (sample - this.state);
    return this.state;
  };

  reset(sample: number) {
    this.state = sample
  }
}
