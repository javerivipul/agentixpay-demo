import { DemoClient } from './demo-client';

export default function DemoPage({
  searchParams,
}: {
  searchParams: { protocol?: string; store?: string };
}) {
  const protocol = searchParams.protocol === 'acp' ? 'acp' : 'ucp';
  const store = searchParams.store || '';

  return <DemoClient protocol={protocol} store={store} />;
}
