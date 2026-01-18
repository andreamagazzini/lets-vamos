'use client';

import { ApiReferenceReact } from '@scalar/api-reference-react';
import '@scalar/api-reference-react/style.css';

export default function ApiDocsPage() {
  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <ApiReferenceReact
        configuration={{
          spec: {
            url: '/api/openapi',
          },
          theme: 'default',
          layout: 'modern',
        }}
      />
    </div>
  );
}
