export class ChartAxisRange {

    public static calculate(min: number, max: number, isLogarithmic: boolean): ChartAxisRange {
        let axis = new ChartAxisRange();

        if (isLogarithmic) {
            let minLog = Math.log10(min);
            let maxLog = Math.log10(max);

            if (!Number.isFinite(minLog)) { minLog = 0.1; }

            axis.minimum = Math.pow(10, Math.floor(minLog));
            axis.maximum = Math.pow(10, Math.ceil(maxLog));
        } else {
            let span = max - min;
            let step = Math.pow(10.0, Math.floor(Math.log10(span)) - 1.0);

            let ceil = Math.ceil(max / step);

            axis.minimum = step * Math.floor(min / step);
            axis.maximum = step * ceil;
        }
        return axis;
    }

    public minimum: number;
    public maximum: number;
}
