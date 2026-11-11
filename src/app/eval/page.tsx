import type { Metadata } from "next";

import { EvalDashboard } from "@/components/eval/eval-dashboard";
import { loadEvalReport } from "@/lib/eval-report";

export const metadata: Metadata = { title: "Evaluation" };

// Read the results file on every request, so a new test run shows up on refresh.
export const dynamic = "force-dynamic";

/** Developer page: the latest scenario evaluation (agents, tools, RAG, latency). */
export default async function EvalPage() {
  const { report, source } = await loadEvalReport();
  return <EvalDashboard report={report} source={source} />;
}
