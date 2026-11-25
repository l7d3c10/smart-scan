import { spawn } from 'node:child_process';
import path from 'node:path';

const LIMITS = { kernel: [3, 11], blockSize: [3, 51] };

export function validateImageOptions(body = {}) {
  const mode = body.mode;
  if (!['color', 'gray', 'bw'].includes(mode)) return { error: 'Chế độ xử lý không hợp lệ.' };
  const options = {
    cannyLow: body.cannyLow ?? 50,
    cannyHigh: body.cannyHigh ?? 150,
    kernel: body.kernel ?? 5,
    blockSize: body.blockSize ?? 11,
  };
  if (!Number.isInteger(options.cannyLow) || options.cannyLow < 0 || options.cannyLow > 255
    || !Number.isInteger(options.cannyHigh) || options.cannyHigh < 0 || options.cannyHigh > 255
    || options.cannyLow >= options.cannyHigh) return { error: 'Ngưỡng Canny phải hợp lệ và ngưỡng thấp phải nhỏ hơn ngưỡng cao.' };
  for (const name of ['kernel', 'blockSize']) {
    const [min, max] = LIMITS[name];
    if (!Number.isInteger(options[name]) || options[name] < min || options[name] > max || options[name] % 2 === 0) {
      return { error: `Tham số ${name} phải là số lẻ từ ${min} đến ${max}.` };
    }
  }
  return { mode, options };
}

export function runImageProcessor({ pythonExecutable, scriptPath, inputPath, outputPath, stepsDir, mode, options, spawnProcess = spawn, timeoutMs = 20000 }) {
  const args = [scriptPath, '--input', inputPath, '--output', outputPath, '--mode', mode,
    '--canny-low', String(options.cannyLow), '--canny-high', String(options.cannyHigh),
    '--kernel', String(options.kernel), '--block-size', String(options.blockSize), '--steps-dir', stepsDir];
  return new Promise((resolve, reject) => {
    const child = spawnProcess(pythonExecutable, args, { shell: false, windowsHide: true });
    let stdout = '';
    let stderr = '';
    let settled = false;
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error); else resolve(value);
    };
    const timer = setTimeout(() => {
      child.kill();
      finish(Object.assign(new Error('Tiến trình xử lý ảnh quá thời gian.'), { status: 504, code: 'IMAGE_PROCESS_TIMEOUT' }));
    }, timeoutMs);
    child.stdout?.on('data', (chunk) => { stdout += chunk.toString(); if (stdout.length > 65536) child.kill(); });
    child.stderr?.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('error', () => finish(Object.assign(new Error('Không thể khởi chạy Python/OpenCV.'), { status: 503, code: 'IMAGE_PROCESS_UNAVAILABLE' })));
    child.on('close', (code) => {
      if (code !== 0) return finish(Object.assign(new Error(code === 1 ? 'Thiếu OpenCV hoặc Python.' : 'Không xử lý được ảnh.'), { status: 422, code: 'IMAGE_PROCESS_FAILED', detail: stderr.slice(0, 2000) }));
      try {
        const result = JSON.parse(stdout.trim());
        if (result.ok !== true || typeof result.found !== 'boolean' || !Array.isArray(result.steps)
          || result.steps.length !== 4 || !Number.isInteger(result.width) || !Number.isInteger(result.height)) throw new Error();
        const expectedOutput = path.resolve(outputPath);
        const expectedSteps = path.resolve(stepsDir);
        if (path.resolve(result.output) !== expectedOutput || result.steps.some((item) => {
          const relative = path.relative(expectedSteps, path.resolve(item));
          return !relative || relative.startsWith('..') || path.isAbsolute(relative);
        })) throw new Error();
        finish(null, result);
      } catch {
        finish(Object.assign(new Error('Python trả về kết quả không hợp lệ.'), { status: 502, code: 'IMAGE_PROCESS_INVALID_RESULT' }));
      }
    });
  });
}

export { LIMITS as imageParameterLimits };
