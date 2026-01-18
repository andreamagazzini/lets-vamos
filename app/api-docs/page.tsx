'use client';

import { ApiReferenceReact } from '@scalar/api-reference-react';
import '@scalar/api-reference-react/style.css';

export default function ApiDocsPage() {
  return (
    <div style={{ height: '100vh', width: '100%' }}>
      {/* @ts-ignore - Scalar React types may not be fully up to date with configuration options */}
      <ApiReferenceReact
        configuration={{
          spec: {
            url: '/api/openapi',
          },
        } as any}
      />
    </div>
  );
}
