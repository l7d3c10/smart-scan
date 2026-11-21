export function healthController(_request, response) {
  return response.status(200).json({ ok: true, data: { status: 'ok' } });
}
