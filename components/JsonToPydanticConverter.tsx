'use client'

import React, { useState, FC } from 'react';
import { AlertCircle, Check, Copy } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface TypeMapping {
  [key: string]: string;
}

const typeMapping: TypeMapping = {
  string: 'str',
  number: 'float',
  integer: 'int',
  boolean: 'bool',
  object: 'dict',
  array: 'list',
  null: 'None',
};

const capitalize = (str: string): string => str.charAt(0).toUpperCase() + str.slice(1);

const sanitizeClassName = (name: string): string => {
  // Convert array indices or invalid characters to valid class names
  return isNaN(Number(name)) ? capitalize(name) : `Item${name}`;
};

const toPythonType = (value: any, currentPath: string[] = []): string => {
  if (value === null) return 'None';
  if (Array.isArray(value)) {
    if (value.length === 0) return 'list';
    const itemType = typeof value[0] === 'object' && value[0] !== null
      ? `${sanitizeClassName(currentPath[currentPath.length - 1])}Item`
      : typeMapping[typeof value[0]] || 'Any';
    return `List[${itemType}]`;
  }
  if (typeof value === 'object') {
    return sanitizeClassName(currentPath[currentPath.length - 1]);
  }
  return typeMapping[typeof value] || 'Any';
};

const generatePydanticClass = (obj: any): string => {
  let output = 'from pydantic import BaseModel, Field\nfrom typing import Optional, List, Dict, Any\n\n';
  const classes = new Map<string, string>();
  const processedObjects = new Set<string>();

  const processObject = (obj: any, className: string, currentPath: string[] = []): void => {
    // Handle arrays differently
    if (Array.isArray(obj)) {
      if (obj.length > 0 && typeof obj[0] === 'object' && obj[0] !== null) {
        // Process the first item as a template for array items
        const itemClassName = `${className}Item`;
        processObject(obj[0], itemClassName, [...currentPath, '0']);
      }
      return;
    }

    const objKey = JSON.stringify(obj);
    if (processedObjects.has(objKey)) return;
    processedObjects.add(objKey);

    let classCode = `class ${className}(BaseModel):\n`;
    
    for (const [key, value] of Object.entries(obj)) {
      const fieldName = key.replace(/[^a-zA-Z0-9_]/g, '_');
      const newPath = [...currentPath, key];

      if (value === null) {
        classCode += `    ${fieldName}: Optional[Any] = Field(default=None)\n`;
      } else if (Array.isArray(value)) {
        if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
          const itemClassName = `${sanitizeClassName(key)}Item`;
          processObject(value[0], itemClassName, [...newPath, '0']);
          classCode += `    ${fieldName}: List[${itemClassName}] = Field(default_factory=list)\n`;
        } else {
          classCode += `    ${fieldName}: List[${typeMapping[typeof value[0]] || 'Any'}] = Field(default_factory=list)\n`;
        }
      } else if (typeof value === 'object') {
        const nestedClassName = sanitizeClassName(key);
        processObject(value, nestedClassName, newPath);
        classCode += `    ${fieldName}: ${nestedClassName} = Field(...)\n`;
      } else {
        classCode += `    ${fieldName}: ${toPythonType(value)} = Field(...)\n`;
      }
    }

    classes.set(className, classCode);
  };

  if (Array.isArray(obj)) {
    if (obj.length > 0 && typeof obj[0] === 'object' && obj[0] !== null) {
      processObject(obj[0], 'ImageData', ['item']);
      classes.set('Root', `class Root(BaseModel):\n    data: List[ImageData] = Field(default_factory=list)\n`);
    } else {
      classes.set('Root', `class Root(BaseModel):\n    data: List[${typeMapping[typeof obj[0]] || 'Any'}] = Field(default_factory=list)\n`);
    }
  } else {
    processObject(obj, 'Root');
  }
  
  // Return classes in order, with Root last
  const rootClass = classes.get('Root') || '';
  classes.delete('Root');
  return output + Array.from(classes.values()).join('\n') + '\n' + rootClass;
};

const JsonToPydanticConverter: FC = () => {
  const [jsonInput, setJsonInput] = useState<string>('');
  const [pydanticOutput, setPydanticOutput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const handleConvert = (): void => {
    try {
      const jsonData = JSON.parse(jsonInput);
      const pydanticCode = generatePydanticClass(jsonData);
      setPydanticOutput(pydanticCode);
      setError('');
    } catch (err) {
      const error = err as Error;
      setError(`Error: ${error.message}`);
      setPydanticOutput('');
    }
  };

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(pydanticOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">JSON to Pydantic Model Converter</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2" htmlFor="jsonInput">
            Paste your JSON here:
          </label>
          <textarea
            id="jsonInput"
            className="w-full h-64 p-4 border rounded-lg font-mono text-sm"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Paste your JSON data here..."
          />
        </div>

        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={handleConvert}
          type="button"
        >
          Convert to Pydantic
        </button>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {pydanticOutput && (
          <div className="relative">
            <label className="block text-sm font-medium mb-2">
              Generated Pydantic Model:
            </label>
            <pre className="w-full h-96 p-4 bg-gray-50 border rounded-lg overflow-auto font-mono text-sm">
              {pydanticOutput}
            </pre>
            <button
              className="absolute top-2 right-2 p-2 bg-white border rounded-md hover:bg-gray-100"
              onClick={handleCopy}
              type="button"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default JsonToPydanticConverter;