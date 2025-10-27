import React, { useState, useEffect, useRef } from 'react';
import { DBButton, DBInfotext, DBBrand, DBHeader, DBPage, DBSection } from '@db-ux/react-core-components';

interface PluginMessage {
  type: string;
  data?: any;
}

const ImportColorsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.onmessage = (event: MessageEvent) => {
      const pluginMessage: PluginMessage = event.data.pluginMessage;
      
      if (pluginMessage.type === 'loading') {
        setLoading(true);
        setMessage(pluginMessage.data || 'Processing...');
        setMessageType('info');
      } else if (pluginMessage.type === 'success') {
        setLoading(false);
        setMessage(pluginMessage.data || 'Success!');
        setMessageType('success');
      } else if (pluginMessage.type === 'error') {
        setLoading(false);
        setMessage(pluginMessage.data || 'An error occurred');
        setMessageType('error');
      }
    };
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.json')) {
      setMessage('Please select a JSON file');
      setMessageType('error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = e.target?.result as string;
        setMessage('');
        parent.postMessage({
          pluginMessage: {
            type: 'import-json',
            data: { jsonData }
          }
        }, '*');
      } catch (error) {
        setMessage('Failed to read file');
        setMessageType('error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-fix-md space-y-fix-md">
      <h1 className="text-lg font-bold mb-fix-md">Import Design Token Colors</h1>
      
      {message && (
        <DBInfotext 
          semantic={messageType === 'success' ? 'successful' : messageType === 'error' ? 'critical' : 'informational'}
        >
          {message}
        </DBInfotext>
      )}

      <div className="space-y-fix-md">
        <div className="space-y-fix-sm">
          <h2 className="text-md font-semibold">Upload Design Tokens JSON</h2>
          <p className="text-sm text-gray-600">
            Upload a JSON file containing design tokens with the following structure:
          </p>
          <div className="bg-gray-50 p-3 rounded text-xs font-mono">
            {`{
  "colors": {
    "category-name": {
      "token-name": {
        "$type": "color",
        "$value": "#FF5733"
      }
    }
  }
}`}
          </div>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <DBButton
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              variant="primary"
            >
              {loading ? 'Processing...' : 'Select JSON File'}
            </DBButton>
            <p className="text-sm text-gray-500 mt-2">
              Colors will be imported as "Base Colors" with variable collections and semantic aliases
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <DBPage
      variant="fixed"
      header={<DBHeader brand={<DBBrand>Import Custom Colors</DBBrand>}></DBHeader>}
    >
      <DBSection spacing="none">
        <ImportColorsPage />
      </DBSection>
    </DBPage>
  );
};

export default App;