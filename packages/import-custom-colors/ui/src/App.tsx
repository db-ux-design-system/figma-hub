import React, { useState, useEffect } from 'react';
import { DBButton, DBInfotext, DBBrand, DBHeader, DBPage, DBSection } from '@db-ux/react-core-components';

interface CustomColor {
  name: string;
  hex: string;
}

interface PluginMessage {
  type: string;
  data?: any;
}

const ImportColorsPage: React.FC = () => {
  const [colors, setColors] = useState<CustomColor[]>([]);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

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
        // Clear colors after successful import
        setColors([]);
      } else if (pluginMessage.type === 'error') {
        setLoading(false);
        setMessage(pluginMessage.data || 'An error occurred');
        setMessageType('error');
      }
    };
  }, []);

  const addColor = () => {
    if (newColorName.trim() && isValidHex(newColorHex)) {
      const newColor: CustomColor = {
        name: newColorName.trim(),
        hex: newColorHex
      };
      
      setColors([...colors, newColor]);
      setNewColorName('');
      setNewColorHex('#000000');
      setMessage('');
    } else {
      setMessage('Please enter a valid color name and hex value');
      setMessageType('error');
    }
  };

  const removeColor = (index: number) => {
    setColors(colors.filter((_, i) => i !== index));
  };

  const importColors = () => {
    if (colors.length === 0) {
      setMessage('Please add at least one color to import');
      setMessageType('error');
      return;
    }

    setMessage('');
    parent.postMessage({
      pluginMessage: {
        type: 'import-colors',
        data: colors
      }
    }, '*');
  };

  const isValidHex = (hex: string): boolean => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
  };

  const parseColorsFromText = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const parsedColors: CustomColor[] = [];
    
    lines.forEach(line => {
      // Try different formats: "name #hex", "name: #hex", "name,#hex", etc.
      const patterns = [
        /^(.+?)\s*[:\-,]\s*(#[A-Fa-f0-9]{3,6})$/,
        /^(.+?)\s+(#[A-Fa-f0-9]{3,6})$/,
        /^(#[A-Fa-f0-9]{3,6})\s+(.+)$/
      ];
      
      for (const pattern of patterns) {
        const match = line.trim().match(pattern);
        if (match) {
          const [, part1, part2] = match;
          let name, hex;
          
          if (part1.startsWith('#')) {
            hex = part1;
            name = part2;
          } else {
            name = part1;
            hex = part2;
          }
          
          if (isValidHex(hex)) {
            parsedColors.push({ name: name.trim(), hex: hex.toUpperCase() });
            break;
          }
        }
      }
    });
    
    if (parsedColors.length > 0) {
      setColors([...colors, ...parsedColors]);
      setMessage(`Added ${parsedColors.length} colors from text`);
      setMessageType('success');
    } else {
      setMessage('No valid colors found. Use format: "Color Name #HEX" or "Color Name: #HEX"');
      setMessageType('error');
    }
  };

  return (
    <div className="p-fix-md space-y-fix-md">
      <h1 className="text-lg font-bold mb-fix-md">Import Custom Colors</h1>
      
      {message && (
        <DBInfotext 
          semantic={messageType === 'success' ? 'successful' : messageType === 'error' ? 'critical' : 'informational'}
        >
          {message}
        </DBInfotext>
      )}
      
      <div className="space-y-fix-sm">
        <h2 className="text-md font-semibold">Add Individual Color</h2>
        <div className="flex gap-fix-sm items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Color Name</label>
            <input
              type="text"
              value={newColorName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewColorName(e.target.value)}
              placeholder="e.g. Primary Blue"
              className="w-full p-2 border border-gray-300 rounded text-sm"
            />
          </div>
          <div className="w-24">
            <label className="block text-sm font-medium mb-1">Color</label>
            <input
              type="color"
              value={newColorHex}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewColorHex(e.target.value)}
              className="w-full h-10 border border-gray-300 rounded cursor-pointer"
            />
          </div>
          <DBButton onClick={addColor} disabled={loading}>
            Add
          </DBButton>
        </div>
      </div>

      <div className="space-y-fix-sm">
        <h2 className="text-md font-semibold">Or Paste Multiple Colors</h2>
        <textarea
          className="w-full h-24 p-2 border border-gray-300 rounded text-sm"
          placeholder="Paste colors here. Supported formats:&#10;Color Name #FF5733&#10;Color Name: #FF5733&#10;Primary Blue #3498DB&#10;Secondary Green: #2ECC71"
          onPaste={(e: React.ClipboardEvent<HTMLTextAreaElement>) => {
            setTimeout(() => {
              const text = e.currentTarget.value;
              if (text.trim()) {
                parseColorsFromText(text);
                e.currentTarget.value = '';
              }
            }, 10);
          }}
        />
      </div>

      {colors.length > 0 && (
        <div className="space-y-fix-sm">
          <h2 className="text-md font-semibold">Colors to Import ({colors.length})</h2>
          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded p-2">
            {colors.map((color, index) => (
              <div key={index} className="flex items-center justify-between p-2 border-b last:border-b-0">
                <div className="flex items-center gap-fix-sm">
                  <div 
                    className="w-6 h-6 rounded border border-gray-300"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span className="font-medium">{color.name}</span>
                  <span className="text-sm text-gray-500">{color.hex}</span>
                </div>
                <button
                  onClick={() => removeColor(index)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-fix-sm pt-fix-md border-t">
        <DBButton
          onClick={importColors}
          disabled={loading || colors.length === 0}
          variant="primary"
          className="flex-1"
        >
          {loading ? 'Importing...' : `Import ${colors.length} Color${colors.length !== 1 ? 's' : ''}`}
        </DBButton>
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