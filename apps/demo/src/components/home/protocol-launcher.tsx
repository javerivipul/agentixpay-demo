'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

type Protocol = 'acp' | 'ucp';

function normalizeStores(stores: string[]): string[] {
  return stores
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/^https?:\/\//, '').replace(/\/$/, ''));
}

export function ProtocolLauncher({
  acpStores,
  ucpStores,
}: {
  acpStores: string[];
  ucpStores: string[];
}) {
  const [protocol, setProtocol] = useState<Protocol>('ucp');
  const storesByProtocol = useMemo(() => {
    return {
      acp: normalizeStores(acpStores),
      ucp: normalizeStores(ucpStores),
    } satisfies Record<Protocol, string[]>;
  }, [acpStores, ucpStores]);

  const acp = storesByProtocol.acp;
  const ucp = storesByProtocol.ucp;
  const stores = protocol === 'acp' ? acp : ucp;

  return (
    <div className="w-full max-w-3xl mx-auto mt-10 bg-white/70 backdrop-blur rounded-2xl border border-warm-200 shadow-lg overflow-hidden">
      <div className="px-6 py-5 border-b border-warm-200 bg-gradient-to-r from-brand-900 to-brand-800">
        <div className="text-white font-semibold">Demo Configuration</div>
        <div className="text-xs text-brand-300 mt-0.5">Choose protocol and store to launch /demo</div>
      </div>

      <div className="p-6">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-brand-700">Protocol</label>
          <select
            value={protocol}
            onChange={(e) => setProtocol(e.target.value as Protocol)}
            className="rounded-lg border border-warm-300 bg-white px-3 py-2 text-sm text-brand-800"
          >
            <option value="acp">ACP</option>
            <option value="ucp">UCP</option>
          </select>
          <div className="text-xs text-brand-500">
            ACP stores: {acp.length} &middot; UCP stores: {ucp.length}
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-sm border border-warm-200 rounded-xl overflow-hidden">
            <thead className="bg-warm-50">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-brand-700">
                  {protocol === 'acp' ? 'ACP Enabled Stores' : 'UCP Enabled Stores'}
                </th>
                <th className="text-left px-4 py-3 font-semibold text-brand-700">Launch</th>
              </tr>
            </thead>
            <tbody>
              {stores.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-brand-500" colSpan={2}>
                    No stores configured for {protocol.toUpperCase()}. Set `{protocol === 'acp' ? 'ACP_ENABLED_STORES' : 'UCP_ENABLED_STORES'}`.
                  </td>
                </tr>
              ) : (
                stores.map((store) => (
                  <tr key={`${protocol}:${store}`} className="border-t border-warm-200 bg-white">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-brand-700">{store}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/demo?protocol=${protocol}&store=${encodeURIComponent(store)}`}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 whitespace-nowrap"
                      >
                        Open Demo
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-xs text-brand-500">
          Tip: The demo will only search within the selected store.
        </div>
      </div>
    </div>
  );
}
