"use client";

import {
  Bot,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  FlaskConical,
  Gauge,
  Inbox,
  Route,
  Timer,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

import { ThemeToggle } from "@/components/shell/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Check, EvalCase, EvalReport, SuiteReport } from "@/lib/eval-report";
import { cn } from "@/lib/utils";

type SuiteKey = keyof EvalReport["suites"];

const SUITES: { key: SuiteKey; icon: LucideIcon; blurb: string }[] = [
  {
    key: "triage",
    icon: Inbox,
    blurb: "Category, priority, sentiment, reply and meeting detection, injections",
  },
  {
    key: "scheduling",
    icon: CalendarClock,
    blurb: "Scheduling agent decisions, autonomy gate and hard rules",
  },
  { key: "flows", icon: Route, blurb: "Whole pipeline + user actions: approve, edit, undo, chat hand-off" },
  { key: "chat", icon: Bot, blurb: "Tool choice, retrieval precision/recall, faithfulness, grounding" },
];

const PERCENT = new Set([
  "category",
  "priority",
  "needs_reply",
  "meeting",
  "sentiment",
  "injections_flagged",
  "action",
  "auto",
  "pass_rate",
  "tool_accuracy",
  "first_tool_accuracy",
  "context_recall",
  "context_precision",
  "citation_precision",
  "citation_recall",
  "faithfulness",
  "grounding",
  "correctness",
  "case_pass_rate",
]);

function fmt(key: string, value: unknown): string {
  if (value === null || value === undefined) return "n/a";
  if (typeof value === "number") return PERCENT.has(key) ? `${Math.round(value * 100)}%` : String(value);
  return String(value);
}

/** "2026-11-06 12:58" — formatted from the string itself, so server and browser render the same. */
const dateTime = (iso: string) => iso.slice(0, 16).replace("T", " ");

/** Narrow `unknown` fields of a case without trusting their shape. */
const asRecord = (value: unknown) =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};
const asList = (value: unknown) => (Array.isArray(value) ? value : []);

function Verdict({ passed, error }: { passed?: boolean | null; error?: string }) {
  if (error)
    return (
      <span className="inline-flex items-center gap-1 text-warning">
        <CircleAlert className="size-4" /> Error
      </span>
    );
  if (passed === null || passed === undefined) return <span className="text-muted-foreground">–</span>;
  return passed ? (
    <span className="inline-flex items-center gap-1 text-success">
      <CheckCircle2 className="size-4" /> Pass
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-destructive">
      <XCircle className="size-4" /> Fail
    </span>
  );
}

// --- Overview ----------------------------------------------------------------------------------

function SuiteCard({ suite, data }: { suite: (typeof SUITES)[number]; data: SuiteReport }) {
  const met = data.thresholds.filter((check) => check.passed).length;
  const allMet = met === data.thresholds.length;
  const rate = data.summary.case_pass_rate as number | null;
  const Icon = suite.icon;
  return (
    <Card className="animate-fade-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4" />
          </span>
          {data.title}
        </CardTitle>
        <CardDescription>{suite.blurb}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-3xl font-semibold tabular-nums">{fmt("case_pass_rate", rate)}</p>
            <p className="text-xs text-muted-foreground">of {String(data.summary.cases)} cases passed</p>
          </div>
          <Badge className={cn(allMet ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive")}>
            {met}/{data.thresholds.length} targets met
          </Badge>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full", allMet ? "bg-success" : "bg-primary")}
            style={{ width: `${Math.round((rate ?? 0) * 100)}%` }}
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          {data.provider} / {data.model} · {dateTime(data.run_at)}
        </p>
      </CardContent>
    </Card>
  );
}

function ThresholdTable({ checks }: { checks: Check[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="size-4 text-primary" /> Quality targets
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Metric</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead className="text-right">Target</TableHead>
              <TableHead className="text-right">Result</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {checks.map((check) => (
              <TableRow key={check.key}>
                <TableCell className="font-medium">{check.label}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(check.key, check.value)}</TableCell>
                <TableCell className="text-right text-muted-foreground tabular-nums">
                  {check.comparison} {fmt(check.key, check.target)}
                </TableCell>
                <TableCell className="text-right">
                  <Verdict passed={check.passed} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function LatencyTable({ latency }: { latency: SuiteReport["latency"] }) {
  const steps = Object.entries(latency);
  if (!steps.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="size-4 text-primary" /> Latency
        </CardTitle>
        <CardDescription>Seconds per step, excluding time spent waiting for the rate limit.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Step</TableHead>
              <TableHead className="text-right">n</TableHead>
              <TableHead className="text-right">p50</TableHead>
              <TableHead className="text-right">p95</TableHead>
              <TableHead className="text-right">Max</TableHead>
              <TableHead className="text-right">Model calls</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {steps.map(([step, stats]) => (
              <TableRow key={step}>
                <TableCell className="font-medium">{step}</TableCell>
                <TableCell className="text-right tabular-nums">{stats.n}</TableCell>
                <TableCell className="text-right tabular-nums">{stats.p50.toFixed(2)}</TableCell>
                <TableCell className="text-right tabular-nums">{stats.p95.toFixed(2)}</TableCell>
                <TableCell className="text-right tabular-nums">{stats.max.toFixed(2)}</TableCell>
                <TableCell className="text-right tabular-nums">{stats.model_calls_mean.toFixed(1)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// --- Case details per suite --------------------------------------------------------------------

/** A disclosure row: one-line summary, details on click (native <details>, keyboard friendly). */
function CaseRow({
  item,
  title,
  meta,
  children,
}: {
  item: EvalCase;
  title: string;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group rounded-xl border bg-card transition-colors open:bg-muted/30">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-2.5 text-[13px] [&::-webkit-details-marker]:hidden">
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
        <span className="shrink-0 font-mono text-xs text-muted-foreground">{item.id}</span>
        <span className="min-w-0 flex-1 truncate font-medium">{title}</span>
        {meta && <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">{meta}</span>}
        <span className="shrink-0">
          <Verdict passed={item.passed} error={item.error} />
        </span>
      </summary>
      <div className="space-y-3 border-t px-4 py-3 text-[13px]">{children}</div>
    </details>
  );
}

function KeyValues({ values }: { values: [string, React.ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1">
      {values.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="min-w-0 break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function TriageCase({ item }: { item: EvalCase }) {
  const expected = asRecord(item.expected);
  const got = asRecord(item.got);
  const range = asList(item.priority_range);
  const meta =
    item.kind === "injection"
      ? "injection test"
      : `${String(got.category ?? "")} · P${String(got.priority ?? "?")}`;
  return (
    <CaseRow item={item} title={String(item.subject ?? "")} meta={meta}>
      {item.error ? (
        <p className="text-warning">Model call failed: {item.error}</p>
      ) : item.kind === "injection" ? (
        <KeyValues
          values={[
            ["Expected", "flagged as suspicious"],
            ["Flagged", String(got.suspicious)],
            ["Reasons", asList(got.reasons).join("; ") || "–"],
          ]}
        />
      ) : (
        <KeyValues
          values={[
            ["From", String(item.from ?? "")],
            ["Category", `${String(got.category)} (expected ${String(expected.category)})`],
            ["Priority", `${String(got.priority)} (expected ${String(range[0])}–${String(range[1])})`],
            ["Sentiment", `${String(got.sentiment)} (expected ${String(expected.sentiment)})`],
            ["Needs reply", `${String(got.needs_reply)} (expected ${String(expected.needs_reply)})`],
            ["Meeting", `${String(got.wants_meeting)} (expected ${String(expected.wants_meeting)})`],
            ["Summary", String(got.summary ?? "")],
          ]}
        />
      )}
    </CaseRow>
  );
}

function SchedulingCase({ item }: { item: EvalCase }) {
  return (
    <CaseRow
      item={item}
      title={String(item.subject ?? "")}
      meta={`${String(item.action ?? "")} · auto=${String(item.auto ?? "")}`}
    >
      {item.error ? (
        <p className="text-warning">Model call failed: {item.error}</p>
      ) : (
        <KeyValues
          values={[
            ["From", String(item.from ?? "")],
            ["Action", `${String(item.action)} (expected ${asList(item.expected_actions).join(" or ")})`],
            ["Automatic", `${String(item.auto)} (expected ${String(item.expected_auto)})`],
            ["Why", String(item.reason ?? "–")],
            ["Autonomy", String(item.autonomy_reason ?? "–")],
            ["Model slips caught", asList(item.raw_violations).join(", ") || "none"],
            ["Violations reaching user", asList(item.final_violations).join(", ") || "none"],
          ]}
        />
      )}
    </CaseRow>
  );
}

function FlowCase({ item }: { item: EvalCase }) {
  const checks = Object.entries(asRecord(item.checks));
  return (
    <CaseRow
      item={item}
      title={String(item.title ?? item.id)}
      meta={`${checks.filter(([, ok]) => ok).length}/${checks.length} steps`}
    >
      <ul className="space-y-1">
        {checks.map(([name, ok]) => (
          <li key={name} className="flex items-start gap-2">
            {ok ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
            ) : (
              <XCircle
                className={cn(
                  "mt-0.5 size-4 shrink-0",
                  name.startsWith("(info)") ? "text-muted-foreground" : "text-destructive",
                )}
              />
            )}
            <span className={cn(name.startsWith("(info)") && "text-muted-foreground")}>{name}</span>
          </li>
        ))}
      </ul>
      <pre className="overflow-x-auto rounded-lg bg-muted/60 p-3 text-xs whitespace-pre-wrap">
        {JSON.stringify(item.details ?? {}, null, 2)}
      </pre>
    </CaseRow>
  );
}

function Chips({ items, tone = "default" }: { items: unknown[]; tone?: "default" | "good" }) {
  if (!items.length) return <span className="text-muted-foreground">–</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {items.map((value, index) => (
        <code
          key={`${String(value)}-${index}`}
          className={cn(
            "rounded-md border px-1.5 py-0.5 text-[11px]",
            tone === "good" && "border-success/40 text-success",
          )}
        >
          {String(value)}
        </code>
      ))}
    </span>
  );
}

function ChatCase({ item }: { item: EvalCase }) {
  const tools = asRecord(item.tools);
  const retrieval = asRecord(item.retrieval);
  const judge = asRecord(item.judge);
  const relevant = new Set(asList(retrieval.relevant).map(String));
  const meta = `faithful ${fmt("faithfulness", judge.faithfulness)} · correct ${fmt("correctness", judge.correctness)}`;
  return (
    <CaseRow item={item} title={String(item.question ?? "")} meta={meta}>
      {item.error ? (
        <p className="text-warning">Chat failed: {item.error}</p>
      ) : (
        <>
          <div className="rounded-lg bg-muted/60 p-3 leading-relaxed [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1.5 [&_p:first-child]:mt-0 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5">
            <ReactMarkdown>{String(item.answer || "(empty answer)")}</ReactMarkdown>
          </div>
          <KeyValues
            values={[
              ["Tools used", <Chips key="t" items={asList(tools.used)} />],
              [
                "Required",
                asList(tools.required)
                  .map((group) => asList(group).join(" or "))
                  .join(", then "),
              ],
              ["Gmail queries", <Chips key="q" items={asList(tools.gmail_queries)} />],
              ["Relevant", <Chips key="r" items={[...relevant]} />],
              [
                "Retrieved",
                <Chips
                  key="rt"
                  items={asList(retrieval.retrieved).filter((id) => relevant.has(String(id)))}
                  tone="good"
                />,
              ],
              ["Cited", <Chips key="c" items={asList(retrieval.cited)} />],
              [
                "Retrieval",
                `context P ${fmt("context_precision", retrieval.context_precision)} / R ${fmt("context_recall", retrieval.context_recall)} · ` +
                  `citations P ${fmt("citation_precision", retrieval.citation_precision)} / R ${fmt("citation_recall", retrieval.citation_recall)}`,
              ],
              [
                "Judge",
                `${String(judge.model ?? "–")} · faithfulness ${fmt("faithfulness", judge.faithfulness)} · grounding ${fmt("grounding", judge.grounding)} · correctness ${fmt("correctness", judge.correctness)}` +
                  (judge.note ? ` (${String(judge.note)})` : ""),
              ],
            ]}
          />
          <div className="grid gap-3 lg:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Claims in the answer</p>
              <ul className="space-y-1">
                {asList(judge.claims).map((raw, index) => {
                  const claim = asRecord(raw);
                  return (
                    <li key={index} className="flex items-start gap-2">
                      {claim.supported ? (
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                      ) : (
                        <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                      )}
                      {String(claim.claim)}
                    </li>
                  );
                })}
              </ul>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Key facts expected</p>
              <ul className="space-y-1">
                {asList(judge.facts).map((raw, index) => {
                  const fact = asRecord(raw);
                  return (
                    <li key={index} className="flex items-start gap-2">
                      {fact.covered ? (
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                      ) : (
                        <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                      )}
                      {String(fact.fact)}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </>
      )}
    </CaseRow>
  );
}

const CASE_VIEWS: Record<SuiteKey, (props: { item: EvalCase }) => React.ReactNode> = {
  triage: TriageCase,
  scheduling: SchedulingCase,
  flows: FlowCase,
  chat: ChatCase,
};

function SuitePanel({ suiteKey, data }: { suiteKey: SuiteKey; data: SuiteReport }) {
  const View = CASE_VIEWS[suiteKey];
  const failed = data.cases.filter((item) => item.error || !item.passed);
  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <ThresholdTable checks={data.thresholds} />
        <LatencyTable latency={data.latency} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Cases</CardTitle>
          <CardDescription>
            {data.cases.length} cases · {failed.length} not passing · failing cases are listed first. Click a
            case for details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {[...failed, ...data.cases.filter((item) => !failed.includes(item))].map((item) => (
            <View key={item.id} item={item} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// --- Page --------------------------------------------------------------------------------------

export function EvalDashboard({ report, source }: { report: EvalReport | null; source: string }) {
  const present = SUITES.filter((suite) => report?.suites[suite.key]);
  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FlaskConical className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-semibold">Agent &amp; RAG evaluation</h1>
            <p className="truncate text-xs text-muted-foreground">
              Real model calls on synthetic mail
              {report ? ` · generated ${dateTime(report.generated_at)}` : ""}
            </p>
          </div>
          <Link href="/inbox" className="text-[13px] text-muted-foreground hover:text-foreground">
            Back to app
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        {!report || present.length === 0 ? (
          <Card className="mx-auto max-w-xl text-center">
            <CardHeader>
              <CardTitle>No evaluation results yet</CardTitle>
              <CardDescription>
                Run the scenario suite in the server folder, then refresh this page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <code className="block rounded-lg bg-muted px-3 py-2 text-left text-xs">
                uv run pytest tests/scenarios
              </code>
              <p className="text-xs break-all text-muted-foreground">Looking for {source}</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="overview" className="gap-5">
            <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              {present.map((suite) => (
                <TabsTrigger key={suite.key} value={suite.key}>
                  {report.suites[suite.key]?.title}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {present.map((suite) => (
                  <SuiteCard key={suite.key} suite={suite} data={report.suites[suite.key]!} />
                ))}
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>How to read this</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5 text-[13px] text-muted-foreground">
                  <p>
                    Every case calls the real models configured in the server&apos;s .env. Gmail and Calendar
                    are fakes, so nothing is written to Google.
                  </p>
                  <p>
                    <strong className="text-foreground">Context precision / recall</strong>: of the emails the
                    agent pulled in with its tools, how many were relevant, and how many of the relevant ones
                    it found.
                  </p>
                  <p>
                    <strong className="text-foreground">Citation precision / recall</strong>: the same for the
                    sources shown to the user.
                  </p>
                  <p>
                    <strong className="text-foreground">Faithfulness</strong>: share of the answer&apos;s
                    claims supported by what the tools returned.{" "}
                    <strong className="text-foreground">Grounding</strong>: share supported by an email that
                    is actually cited. <strong className="text-foreground">Correctness</strong>: share of the
                    expected key facts in the answer. Judged by a separate model (HCL AI Cafe GPT-4.1).
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            {present.map((suite) => (
              <TabsContent key={suite.key} value={suite.key}>
                <SuitePanel suiteKey={suite.key} data={report.suites[suite.key]!} />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </main>
    </div>
  );
}
