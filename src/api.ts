import type { ZakatRequest, ZakatResponse } from './types';

const API_BASE = 'https://zakat-calculator-2z1k.onrender.com/api/v1';

export async function calculateZakat(payload: ZakatRequest): Promise<ZakatResponse> {
  const res = await fetch(`${API_BASE}/zakat/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error ?? `HTTP ${res.status}`);
  }

  return data as ZakatResponse;
}
