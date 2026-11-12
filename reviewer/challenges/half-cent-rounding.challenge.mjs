import test from 'node:test';
import assert from 'node:assert/strict';
import {discountedCents} from '/workspace/candidate.mjs';
test('reviewer challenge: half-cent ties round up rather than truncate',()=>{
  assert.equal(discountedCents(101,50),51);
});
test('reviewer challenge: 99 cents at 50% is rounded to 50 cents',()=>{
  assert.equal(discountedCents(99,50),50);
});
