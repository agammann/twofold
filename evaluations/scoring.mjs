export function swapVerdict(verdict) {
  return verdict === 'A' ? 'B' : verdict === 'B' ? 'A' : verdict;
}

export function scoreResult(testCase, report, swapped = false) {
  const expected = testCase.expected.map(v => swapped ? swapVerdict(v) : v);
  const failures = [];
  if (!expected.includes(report.verdict)) failures.push(`Expected ${expected.join(' or ')}, received ${report.verdict}.`);
  if (testCase.answerA === testCase.answerB && report.differences.length) failures.push('Identical answers received invented differences.');
  if (testCase.noReasoning && (report.answerA.reasoning.length || report.answerB.reasoning.length)) failures.push('A bare conclusion received invented reasoning steps.');
  return { passed: failures.length === 0, expected, failures };
}

export function summarizeRuns(runs) {
  const byCase = new Map();
  for (const run of runs) {
    if (!byCase.has(run.caseId)) byCase.set(run.caseId, {});
    byCase.get(run.caseId)[run.swapped ? 'reversed' : 'original'] = run;
  }
  const orderChecks = [];
  for (const [caseId, pair] of byCase) {
    if (pair.original?.report && pair.reversed?.report) orderChecks.push({
      caseId,
      consistent: pair.original.report.verdict === swapVerdict(pair.reversed.report.verdict),
      original: pair.original.report.verdict,
      reversedMapped: swapVerdict(pair.reversed.report.verdict),
    });
  }
  const passed = runs.filter(r => r.score?.passed).length;
  return {
    total: runs.length, passed, failed: runs.length - passed,
    orderChecks,
    orderConsistent: orderChecks.filter(c => c.consistent).length,
    usage: runs.reduce((sum, r) => ({
      inputTokens: sum.inputTokens + (r.report?.meta.usage.inputTokens || 0),
      outputTokens: sum.outputTokens + (r.report?.meta.usage.outputTokens || 0),
    }), { inputTokens: 0, outputTokens: 0 }),
  };
}
