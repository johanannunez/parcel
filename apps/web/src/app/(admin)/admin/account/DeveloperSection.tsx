'use client';

import { useTransition } from 'react';
import { toggleShowTestDataAction } from '@/lib/admin/test-data';

type Props = { showTestData: boolean };

export function DeveloperSection({ showTestData }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <section>
      <h2
        className="text-base font-semibold"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Developer
      </h2>
      <p
        className="mt-1 text-sm"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Settings for development and testing.
      </p>

      <div
        className="mt-5 flex items-start justify-between gap-4 rounded-xl border p-5"
        style={{ backgroundColor: 'var(--color-white)' }}
      >
        <div className="flex flex-col gap-1">
          <span
            className="text-sm font-medium"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Show test data in admin
          </span>
          <span
            className="text-xs"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            When on, records created by the dev seed script appear across
            contacts, tasks, properties, and projects.
          </span>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={showTestData}
          disabled={pending}
          onClick={() => startTransition(() => toggleShowTestDataAction())}
          className="relative mt-0.5 h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50"
          style={{
            backgroundColor: showTestData
              ? '#f59e0b'
              : 'var(--color-warm-gray-200)',
          }}
        >
          <span
            className="pointer-events-none block h-4 w-4 rounded-full shadow-sm transition-transform"
            style={{
              backgroundColor: 'var(--color-white)',
              transform: showTestData ? 'translateX(16px)' : 'translateX(0)',
            }}
          />
        </button>
      </div>
    </section>
  );
}
