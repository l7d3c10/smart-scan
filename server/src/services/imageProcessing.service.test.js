import test from 'node:test';
import assert from 'node:assert/strict';
import { runImageProcessor, validateImageOptions } from './imageProcessing.service.js';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';

test('image options accept defaults and supported mode', () => {
  assert.deepEqual(validateImageOptions({ mode: 'bw' }), {
    mode: 'bw', options: { cannyLow: 50, cannyHigh: 150, kernel: 5, blockSize: 11 },
  });
});

test('image options reject even adaptive threshold block size', () => {
  assert.match(validateImageOptions({ mode: 'gray', blockSize: 10 }).error, /blockSize/);
});

test('image options reject overlapping Canny thresholds', () => {
  assert.match(validateImageOptions({ mode: 'color', cannyLow: 180, cannyHigh: 100 }).error, /Canny/);
});

test('processor uses spawn without shell and validates the JSON result', async () => {
  let command;
  let args;
  let spawnOptions;
  const fakeSpawn = (executable, values, options) => {
    command = executable; args = values; spawnOptions = options;
    const child = new EventEmitter();
    child.stdout = new PassThrough(); child.stderr = new PassThrough();
    child.kill = () => {};
    queueMicrotask(() => {
      child.stdout.write(JSON.stringify({ ok: true, found: true, warning: null,
        steps: ['C:/storage/steps/1.png', 'C:/storage/steps/2.png', 'C:/storage/steps/3.png', 'C:/storage/steps/4.png'],
        output: 'C:/storage/out.png', width: 10, height: 20 }));
      child.emit('close', 0);
    });
    return child;
  };
  const result = await runImageProcessor({ pythonExecutable: 'python', scriptPath: 'process.py',
    inputPath: 'C:/storage/in.png', outputPath: 'C:/storage/out.png', stepsDir: 'C:/storage/steps',
    mode: 'color', options: { cannyLow: 50, cannyHigh: 150, kernel: 5, blockSize: 11 }, spawnProcess: fakeSpawn });
  assert.equal(command, 'python');
  assert.equal(spawnOptions.shell, false);
  assert.ok(args.includes('--input'));
  assert.equal(result.width, 10);
});
