

export interface IchimokuInput {
  tenkanPeriod?: number; // Period for Tenkan-sen
  kijunPeriod?: number; // Period for Kijun-sen
  senkouBPeriod?: number; // Period for Senkou Span B
  displacement?: number; // Displacement for Senkou Spans and Chikou Span
}

export interface IchimokuOutput {
  tenkanSen: number | null; // Tenkan-sen (Conversion Line)
  kijunSen: number | null; // Kijun-sen (Base Line)
  senkouSpanA: number | null; // Senkou Span A (Leading Span A)
  senkouSpanB: number | null; // Senkou Span B (Leading Span B)
  chikouSpan: number | null; // Chikou Span (Lagging Span)
}

export class Ichimoku {
  private tenkanPeriod: number;
  private kijunPeriod: number;
  private senkouBPeriod: number;
  private displacement: number;
  private highBuffer: number[];
  private lowBuffer: number[];
  private closeBuffer: number[];
  private tenkanSen: number[];
  private kijunSen: number[];
  private senkouSpanA: number[];
  private senkouSpanB: number[];
  private chikouSpan: number[];

  constructor(input: IchimokuInput = {}) {   
    this.tenkanPeriod = input.tenkanPeriod || 9;
    this.kijunPeriod = input.kijunPeriod || 26;
    this.senkouBPeriod = input.senkouBPeriod || 52;
    this.displacement = input.displacement || 26;
    this.highBuffer = [];
    this.lowBuffer = [];
    this.closeBuffer = [];
    this.tenkanSen = [];
    this.kijunSen = [];
    this.senkouSpanA = [];
    this.senkouSpanB = [];
    this.chikouSpan = [];
  }

  // Calculate the highest high or lowest low over a period
  private calculateHighLow(period: number, isHigh: boolean): number | null {
    const buffer = isHigh ? this.highBuffer : this.lowBuffer;
    if (buffer.length < period) return null;
    return isHigh
      ? Math.max(...buffer.slice(-period))
      : Math.min(...buffer.slice(-period));
  }

  // Calculate Tenkan-sen or Kijun-sen
  private calculateLine(period: number): number | null {
    const high = this.calculateHighLow(period, true);
    const low = this.calculateHighLow(period, false);
    if (high === null || low === null) return null;
    return (high + low) / 2;
  }

  nextValue(high: number, low: number, close: number): IchimokuOutput{
    return this.next({high, low, close})
  }

  next(candle: { high: number; low: number; close: number }): IchimokuOutput {
    this.highBuffer.push(candle.high);
    this.lowBuffer.push(candle.low);
    this.closeBuffer.push(candle.close);

    // Calculate Tenkan-sen
    const tenkanSen = this.calculateLine(this.tenkanPeriod);
    if (tenkanSen !== null) this.tenkanSen.push(tenkanSen);

    // Calculate Kijun-sen
    const kijunSen = this.calculateLine(this.kijunPeriod);
    if (kijunSen !== null) this.kijunSen.push(kijunSen);

    // Calculate Senkou Span A
    let senkouSpanA: number | null = null;
    if (tenkanSen !== null && kijunSen !== null) {
      senkouSpanA = (tenkanSen + kijunSen) / 2;
      this.senkouSpanA.push(senkouSpanA);
    }

    // Calculate Senkou Span B
    const senkouSpanB = this.calculateLine(this.senkouBPeriod);
    if (senkouSpanB !== null) this.senkouSpanB.push(senkouSpanB);

    // Calculate Chikou Span (lagging close price)
    let chikouSpan: number | null = null;
    if (this.closeBuffer.length > this.displacement) {
      chikouSpan = this.closeBuffer[this.closeBuffer.length - 1 - this.displacement];
      this.chikouSpan.push(chikouSpan);
    }

    // Maintain buffer size
    if (this.highBuffer.length > this.senkouBPeriod) {
      this.highBuffer.shift();
      this.lowBuffer.shift();
      this.closeBuffer.shift();
    }

    // Return values for the current candle
    return {
      tenkanSen: tenkanSen,
      kijunSen: kijunSen,
      senkouSpanA: this.senkouSpanA.length > this.displacement ? this.senkouSpanA[this.senkouSpanA.length - 1 - this.displacement] : null,
      senkouSpanB: this.senkouSpanB.length > this.displacement ? this.senkouSpanB[this.senkouSpanB.length - 1 - this.displacement] : null,
      chikouSpan: chikouSpan,
    };
  }
}