import test from 'node:test';
import assert from 'node:assert/strict';
import { parseKiroSession as parseSource } from '../src/kiro-session-import.mjs';
import { parseKiroSession as parseBrowser } from '../web/kiro-session-import.mjs';
import { auditLocalSession as auditSource } from '../src/kiro-session-staleness.mjs';

const stamp = (day, minute) => `${day}T10:${minute}:00.000Z`;
function events(day = '2026-03-02') {
  return [
    { timestamp: stamp(day, '00'), payload: { type: 'tool_call', toolCallId: 't1', toolName: 'execute_pwsh', args: { command: 'node --test' } } },
    { timestamp: stamp(day, '01'), payload: { type: 'tool_result', toolCallId: 't1', content: 'pass 8\nfail 0\nExit Code: 0', success: true } },
    { timestamp: stamp(day, '02'), payload: { type: 'assistant', operationType: 'Say', content: 'All 8 tests pass, 0 fail.' } },
    { timestamp: stamp(day, '03'), payload: { type: 'turn_end' } },
  ];
}
const jsonl = (rows) => rows.map((event) => JSON.stringify(event)).join('\n') + '\n';
const parsers = [['source', parseSource], ['browser', parseBrowser]];
for (const [label, parse] of parsers) {
  test(`M283 ${label}: impossible claim date cannot produce a CURRENT verdict`, () => {
    const records = events();
    records[2].timestamp = stamp('2026-02-30', '02');
    const result = parse(jsonl(records));
    assert.equal(result.input, null);
    assert.equal(result.errorCode, 'INVALID_EVENT_TIMESTAMP');
  });
  test(`M283 ${label}: invalid date at other event positions rejected`, () => {
    for (const index of [0, 1, 3]) {
      const records = events();
      records[index].timestamp = stamp('2026-04-31', String(index).padStart(2, '0'));
      const result = parse(jsonl(records));
      assert.equal(result.errorCode, 'INVALID_EVENT_TIMESTAMP', `event ${index}`);
      assert.equal(result.input, null);
    }
  });
  test(`M283 ${label}: Gregorian century leap-year rules`, () => {
    const rejected = events('2100-02-28');
    rejected[2].timestamp = stamp('2100-02-29', '02');
    assert.equal(parse(jsonl(rejected)).errorCode, 'INVALID_EVENT_TIMESTAMP');
    for (const day of ['2000-02-29', '2028-02-29']) {
      const result = parse(jsonl(events(day)));
      assert.equal(result.errorCode, null, day);
      assert.equal(auditSource(result.input).status, 'CURRENT_SELF_RECORDED_TEST', day);
    }
  });
  test(`M283 ${label}: reject invalid time/zone, permit valid +07:00 offset`, () => {
    for (const bad of ['2026-03-02T24:02:00Z', '2026-03-02T10:60:00Z', '2026-03-02T10:02:60Z',
      '2026-03-02T10:02:00+24:00', '2026-03-02T10:02:00+07:99']) {
      const records = events();
      records[2].timestamp = bad;
      assert.equal(parse(jsonl(records)).errorCode, 'INVALID_EVENT_TIMESTAMP', bad);
    }
    const positive = events();
    positive[2].timestamp = '2026-03-02T17:02:00+07:00';
    const out = parse(jsonl(positive));
    assert.equal(out.errorCode, null);
    assert.equal(auditSource(out.input).status, 'CURRENT_SELF_RECORDED_TEST');
  });
}
test('M283 source and web importer have identical output on valid fixture', () => {
  const data = jsonl(events());
  assert.deepEqual(parseSource(data), parseBrowser(data));
});
