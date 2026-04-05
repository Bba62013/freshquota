import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { isWindowActive, alreadyTriggeredToday } from '../src/trigger.mjs';

describe('isWindowActive', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'timeslot-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('returns false when history file does not exist', () => {
    const result = isWindowActive(join(tempDir, 'nope.jsonl'));
    assert.equal(result, false);
  });

  it('returns true when last entry is within 5 hours', () => {
    const filePath = join(tempDir, 'history.jsonl');
    const recentTs = Date.now() - 2 * 60 * 60 * 1000; // 2 hours ago
    writeFileSync(filePath, JSON.stringify({ timestamp: recentTs }) + '\n');

    assert.equal(isWindowActive(filePath), true);
  });

  it('returns false when last entry is older than 5 hours', () => {
    const filePath = join(tempDir, 'history.jsonl');
    const oldTs = Date.now() - 6 * 60 * 60 * 1000; // 6 hours ago
    writeFileSync(filePath, JSON.stringify({ timestamp: oldTs }) + '\n');

    assert.equal(isWindowActive(filePath), false);
  });

  it('reads the last line, not the first', () => {
    const filePath = join(tempDir, 'history.jsonl');
    const oldTs = Date.now() - 10 * 60 * 60 * 1000;
    const recentTs = Date.now() - 1 * 60 * 60 * 1000;
    writeFileSync(filePath, [
      JSON.stringify({ timestamp: oldTs }),
      JSON.stringify({ timestamp: recentTs }),
    ].join('\n') + '\n');

    assert.equal(isWindowActive(filePath), true);
  });
});

describe('alreadyTriggeredToday', () => {
  it('returns false when lastTrigger is null', () => {
    assert.equal(alreadyTriggeredToday({ lastTrigger: null }), false);
  });

  it('returns true when lastTrigger is today', () => {
    const state = { lastTrigger: new Date().toISOString() };
    assert.equal(alreadyTriggeredToday(state), true);
  });

  it('returns false when lastTrigger is yesterday', () => {
    const yesterday = new Date(Date.now() - 86400000);
    const state = { lastTrigger: yesterday.toISOString() };
    assert.equal(alreadyTriggeredToday(state), false);
  });
});
