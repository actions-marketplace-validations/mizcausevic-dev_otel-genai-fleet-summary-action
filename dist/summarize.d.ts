import type { FleetReport, OtlpExport, SummarizeOptions } from "./types.js";
export declare function summarize(files: Array<{
    path: string;
    doc: OtlpExport;
}>, opts?: SummarizeOptions): FleetReport;
