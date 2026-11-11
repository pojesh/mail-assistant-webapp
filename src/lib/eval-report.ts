/**
 * The scenario evaluation report written by the server's `uv run pytest tests/scenarios`
 * (mail-assistant-server/tests/scenarios/results/latest.json). Read on the server only:
 * import this module from server components, never from client code (it uses the file system).
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

export type Check = {
  label: string;
  key: string;
  value: number | null;
  comparison: ">=" | "<=";
  target: number;
  passed: boolean | null;
};

export type LatencyStats = {
  n: number;
  mean: number;
  p50: number;
  p95: number;
  max: number;
  model_calls_mean: number;
};

/** One test case. Fields depend on the suite, so they are read defensively in the UI. */
export type EvalCase = {
  id: string;
  passed?: boolean;
  error?: string;
  [field: string]: unknown;
};

export type SuiteReport = {
  title: string;
  run_at: string;
  provider: string | null;
  model: string | null;
  summary: Record<string, unknown>;
  thresholds: Check[];
  latency: Record<string, LatencyStats>;
  cases: EvalCase[];
};

export type EvalReport = {
  generated_at: string;
  suites: Partial<Record<"triage" | "scheduling" | "flows" | "chat", SuiteReport>>;
};

const DEFAULT_PATH = "../mail-assistant-server/tests/scenarios/results/latest.json";

/** The latest report, or null when no evaluation has been run on this machine. */
export async function loadEvalReport(): Promise<{ report: EvalReport | null; source: string }> {
  const source = path.resolve(process.cwd(), process.env.EVAL_RESULTS_PATH ?? DEFAULT_PATH);
  try {
    const report = JSON.parse(await readFile(source, "utf-8")) as EvalReport;
    return { report: report?.suites ? report : null, source };
  } catch {
    return { report: null, source };
  }
}
