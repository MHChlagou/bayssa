// Reads a Playwright JSON report and states plainly how each test got its result,
// so that a test which passed only on a retry is never reported as a clean pass.
//   node scripts/report-test-attempts.ts <report.json> <title>
// It writes a summary to the GitHub run page when GITHUB_STEP_SUMMARY is set, and
// a warning annotation for every retried test. It does not decide whether the run
// passes: the Playwright step does that, and a test that fails every attempt fails it.
import { appendFileSync, existsSync, readFileSync } from 'node:fs'
import { z } from 'zod'

const attempt = z.object({
  retry: z.number(),
  status: z.string(),
  error: z.object({ message: z.string().optional() }).optional(),
})
const testRun = z.object({
  projectName: z.string(),
  status: z.enum(['expected', 'unexpected', 'flaky', 'skipped']),
  results: z.array(attempt),
})
const spec = z.object({ title: z.string(), file: z.string(), line: z.number(), tests: z.array(testRun) })
type Suite = { title: string; specs?: z.infer<typeof spec>[]; suites?: Suite[] }
const suite: z.ZodType<Suite> = z.lazy(() => z.object({ title: z.string(), specs: z.array(spec).optional(), suites: z.array(suite).optional() }))
const report = z.object({ suites: z.array(suite) })

type Row = { name: string; project: string; attempts: number; firstError: string }

const [path, title] = process.argv.slice(2)
if (path === undefined || title === undefined) throw new Error('usage: report-test-attempts.ts <report.json> <title>')

function emit(markdown: string): void {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY
  if (summaryFile !== undefined && summaryFile !== '') appendFileSync(summaryFile, markdown + '\n')
  else console.log(markdown)
}

if (!existsSync(path)) {
  // The tests did not run, or stopped before writing a report. An earlier step has already failed the job.
  emit(`## ${title}\n\nNo test report was written at \`${path}\`. The tests did not complete.`)
  process.exit(0)
}

const firstLine = (text: string | undefined): string =>
  // eslint-disable-next-line no-control-regex -- Playwright colours its messages with terminal escape codes
  (text ?? 'no message').replace(/\u001b\[[0-9;]*m/g, '').split('\n')[0]?.slice(0, 200) ?? ''

let passedFirstTime = 0
let skipped = 0
const retried: Row[] = []
const failed: Row[] = []

function walk(node: Suite, trail: string[]): void {
  for (const item of node.specs ?? []) {
    for (const run of item.tests) {
      const row: Row = {
        name: [...trail, item.title].filter(Boolean).join(' › ') + ` (${item.file}:${item.line})`,
        project: run.projectName,
        attempts: run.results.length,
        firstError: firstLine(run.results.find((result) => result.status !== 'passed' && result.status !== 'skipped')?.error?.message),
      }
      if (run.status === 'skipped') skipped++
      else if (run.status === 'unexpected') failed.push(row)
      // "flaky" is Playwright's word for a test that failed and then passed on a retry.
      else if (run.status === 'flaky' || run.results.length > 1) retried.push(row)
      else passedFirstTime++
    }
  }
  for (const child of node.suites ?? []) walk(child, [...trail, child.title.endsWith('.ts') ? '' : child.title])
}
for (const top of report.parse(JSON.parse(readFileSync(path, 'utf8'))).suites) walk(top, [])

const table = (rows: Row[]): string =>
  ['| Browser profile | Test | Attempts | First failure |', '|---|---|---|---|', ...rows.map((row) => `| ${row.project} | ${row.name.replaceAll('|', '\\|')} | ${row.attempts} | ${row.firstError.replaceAll('|', '\\|')} |`)].join('\n')

const lines = [
  `## ${title}`,
  '',
  '| Result | Tests |',
  '|---|---|',
  `| Passed on the first attempt | ${passedFirstTime} |`,
  `| Passed only after a retry | ${retried.length} |`,
  `| Failed on every attempt | ${failed.length} |`,
  `| Skipped | ${skipped} |`,
]
if (retried.length > 0) lines.push('', '### Passed only after a retry', '', 'These failed at least once in this run. The run is not a clean first-attempt pass.', '', table(retried))
if (failed.length > 0) lines.push('', '### Failed on every attempt', '', table(failed))
emit(lines.join('\n'))

for (const row of retried) console.log(`::warning title=${title}: passed only after a retry::[${row.project}] ${row.name}: ${row.firstError}`)
console.log(`${title}: ${passedFirstTime} passed first time, ${retried.length} passed only after a retry, ${failed.length} failed, ${skipped} skipped`)
