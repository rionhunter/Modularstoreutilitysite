import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { 
  FileText, 
  Plus, 
  Download, 
  Edit, 
  Trash2, 
  Copy,
  FileSignature,
  Calendar,
  DollarSign,
  Table
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { jsPDF } from 'jspdf';

export interface DocumentField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'currency';
  required: boolean;
  defaultValue?: string;
  csvColumnIndex?: number; // CSV column index for auto-population
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  fields: DocumentField[];
  createdAt: Date;
  isDefault: boolean;
  csvConfig?: {
    enabled: boolean;
    separator: ',' | ';' | '\t' | '|';
    hasHeader: boolean;
  };
}

export interface DocumentInstance {
  id: string;
  templateId: string;
  templateName: string;
  data: Record<string, string>;
  createdAt: Date;
}

const DEFAULT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'invoice',
    name: 'Invoice',
    description: 'Standard invoice template',
    isDefault: true,
    createdAt: new Date(),
    fields: [
      { id: 'invoiceNumber', label: 'Invoice Number', type: 'text', required: true },
      { id: 'date', label: 'Date', type: 'date', required: true },
      { id: 'customerName', label: 'Customer Name', type: 'text', required: true },
      { id: 'customerAddress', label: 'Customer Address', type: 'textarea', required: false },
      { id: 'items', label: 'Items/Description', type: 'textarea', required: true },
      { id: 'amount', label: 'Total Amount', type: 'currency', required: true },
      { id: 'dueDate', label: 'Due Date', type: 'date', required: false },
      { id: 'notes', label: 'Additional Notes', type: 'textarea', required: false },
    ],
  },
  {
    id: 'receipt',
    name: 'Receipt',
    description: 'Payment receipt template',
    isDefault: true,
    createdAt: new Date(),
    fields: [
      { id: 'receiptNumber', label: 'Receipt Number', type: 'text', required: true },
      { id: 'date', label: 'Date', type: 'date', required: true },
      { id: 'receivedFrom', label: 'Received From', type: 'text', required: true },
      { id: 'amount', label: 'Amount', type: 'currency', required: true },
      { id: 'paymentMethod', label: 'Payment Method', type: 'text', required: false },
      { id: 'purpose', label: 'Purpose', type: 'textarea', required: false },
    ],
  },
  {
    id: 'quote',
    name: 'Quotation',
    description: 'Price quotation template',
    isDefault: true,
    createdAt: new Date(),
    fields: [
      { id: 'quoteNumber', label: 'Quote Number', type: 'text', required: true },
      { id: 'date', label: 'Date', type: 'date', required: true },
      { id: 'customerName', label: 'Customer Name', type: 'text', required: true },
      { id: 'validUntil', label: 'Valid Until', type: 'date', required: false },
      { id: 'items', label: 'Items/Services', type: 'textarea', required: true },
      { id: 'amount', label: 'Total Amount', type: 'currency', required: true },
      { id: 'terms', label: 'Terms & Conditions', type: 'textarea', required: false },
    ],
  },
  {
    id: 'product-import',
    name: 'Product Import (CSV)',
    description: 'Import product data from CSV exports',
    isDefault: true,
    createdAt: new Date(),
    csvConfig: {
      enabled: true,
      separator: ',',
      hasHeader: true,
    },
    fields: [
      { id: 'productName', label: 'Product Name', type: 'text', required: true, csvColumnIndex: 0 },
      { id: 'sku', label: 'SKU', type: 'text', required: true, csvColumnIndex: 1 },
      { id: 'price', label: 'Price', type: 'currency', required: true, csvColumnIndex: 2 },
      { id: 'quantity', label: 'Quantity', type: 'number', required: false, csvColumnIndex: 3 },
      { id: 'description', label: 'Description', type: 'textarea', required: false, csvColumnIndex: 4 },
      { id: 'notes', label: 'Notes', type: 'textarea', required: false },
    ],
  },
];

export function DocumentsPage() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>(() => {
    const saved = localStorage.getItem('document-templates');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((t: DocumentTemplate) => ({
        ...t,
        createdAt: new Date(t.createdAt),
      }));
    }
    return DEFAULT_TEMPLATES;
  });

  const [documents, setDocuments] = useState<DocumentInstance[]>(() => {
    const saved = localStorage.getItem('document-instances');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((d: DocumentInstance) => ({
        ...d,
        createdAt: new Date(d.createdAt),
      }));
    }
    return [];
  });

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [documentData, setDocumentData] = useState<Record<string, string>>({});

  // Template creation/editing state
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [newTemplateFields, setNewTemplateFields] = useState<DocumentField[]>([]);
  const [csvEnabled, setCsvEnabled] = useState(false);
  const [csvSeparator, setCsvSeparator] = useState<',' | ';' | '\t' | '|'>(',');
  const [csvHasHeader, setCsvHasHeader] = useState(true);

  // Helper to get actual separator character
  const getActualSeparator = (sep: string): string => {
    if (sep === 'TAB') return '\t';
    // Already a tab character
    if (sep === '\t') return '\t';
    return sep;
  };

  // Helper to get separator display name
  const getSeparatorName = (sep: string): string => {
    if (sep === '\t') return 'Tab';
    if (sep === ',') return 'Comma';
    if (sep === ';') return 'Semicolon';
    if (sep === '|') return 'Pipe';
    return sep;
  };

  // CSV preview state
  const [csvPreview, setCsvPreview] = useState('');
  const [csvColumns, setCsvColumns] = useState<{ index: number; sample: string; enabled: boolean; fieldName: string; fieldType: DocumentField['type'] }[]>([]);

  // Document creation state
  const [useCSVInput, setUseCSVInput] = useState(false);
  const [csvInput, setCsvInput] = useState('');

  useEffect(() => {
    localStorage.setItem('document-templates', JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem('document-instances', JSON.stringify(documents));
  }, [documents]);

  const parseCSV = (csvText: string, separator: string, hasHeader: boolean): string[] => {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) return [];
    
    // Use the first data row (skip header if present)
    const dataRow = hasHeader && lines.length > 1 ? lines[1] : lines[0];
    
    // Convert separator to actual character
    const actualSeparator = getActualSeparator(separator);
    
    // Handle quoted values and escaped separators
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < dataRow.length; i++) {
      const char = dataRow[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === actualSeparator && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    
    return result;
  };

  const populateFromCSV = () => {
    if (!selectedTemplate || !csvInput.trim()) {
      toast.error('Please paste CSV data');
      return;
    }

    const separator = selectedTemplate.csvConfig?.separator || ',';
    const hasHeader = selectedTemplate.csvConfig?.hasHeader ?? true;

    try {
      const values = parseCSV(csvInput, separator, hasHeader);
      const newData: Record<string, string> = {};

      selectedTemplate.fields.forEach(field => {
        if (field.csvColumnIndex !== undefined && field.csvColumnIndex >= 0) {
          const value = values[field.csvColumnIndex] || '';
          newData[field.id] = value;
        } else {
          // Keep existing value or default
          newData[field.id] = documentData[field.id] || field.defaultValue || '';
        }
      });

      setDocumentData(newData);
      toast.success('CSV data populated successfully');
    } catch (error) {
      toast.error('Failed to parse CSV. Please check the format.');
      console.error(error);
    }
  };

  const openCreateDocument = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    const initialData: Record<string, string> = {};
    template.fields.forEach(field => {
      if (field.defaultValue) {
        initialData[field.id] = field.defaultValue;
      } else if (field.type === 'date') {
        initialData[field.id] = new Date().toISOString().split('T')[0];
      } else {
        initialData[field.id] = '';
      }
    });
    setDocumentData(initialData);
    setUseCSVInput(false);
    setCsvInput('');
    setCreateDialogOpen(true);
  };

  const saveDocument = () => {
    if (!selectedTemplate) return;

    // Validate required fields
    const missingFields = selectedTemplate.fields
      .filter(f => f.required && !documentData[f.id]?.trim())
      .map(f => f.label);

    if (missingFields.length > 0) {
      toast.error(`Please fill in required fields: ${missingFields.join(', ')}`);
      return;
    }

    const newDoc: DocumentInstance = {
      id: Date.now().toString(),
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.name,
      data: documentData,
      createdAt: new Date(),
    };

    setDocuments(prev => [newDoc, ...prev]);
    toast.success('Document saved');
    setCreateDialogOpen(false);
  };

  const exportToPDF = (doc: DocumentInstance) => {
    const template = templates.find(t => t.id === doc.templateId);
    if (!template) return;

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Header
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text(template.name, margin, yPosition);
    yPosition += 15;

    // Date
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPosition);
    yPosition += 15;

    // Draw line
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Fields
    pdf.setFontSize(12);
    template.fields.forEach(field => {
      const value = doc.data[field.id] || '';
      
      // Check if we need a new page
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = margin;
      }

      // Field label
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${field.label}:`, margin, yPosition);
      yPosition += 7;

      // Field value
      pdf.setFont('helvetica', 'normal');
      if (field.type === 'textarea') {
        const lines = pdf.splitTextToSize(value, pageWidth - margin * 2);
        pdf.text(lines, margin + 5, yPosition);
        yPosition += lines.length * 7;
      } else if (field.type === 'currency') {
        const formatted = value ? `$${parseFloat(value).toFixed(2)}` : '';
        pdf.text(formatted, margin + 5, yPosition);
        yPosition += 7;
      } else if (field.type === 'date') {
        const formatted = value ? new Date(value).toLocaleDateString() : '';
        pdf.text(formatted, margin + 5, yPosition);
        yPosition += 7;
      } else {
        pdf.text(value, margin + 5, yPosition);
        yPosition += 7;
      }

      yPosition += 5;
    });

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(128);
    pdf.text(
      `Document ID: ${doc.id}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );

    pdf.save(`${template.name}_${doc.id}.pdf`);
    toast.success('PDF downloaded');
  };

  const deleteDocument = (id: string) => {
    if (window.confirm('Delete this document?')) {
      setDocuments(prev => prev.filter(d => d.id !== id));
      toast.success('Document deleted');
    }
  };

  const duplicateDocument = (doc: DocumentInstance) => {
    const template = templates.find(t => t.id === doc.templateId);
    if (template) {
      setSelectedTemplate(template);
      setDocumentData({ ...doc.data });
      setCreateDialogOpen(true);
    }
  };

  const analyzeCsvPreview = () => {
    if (!csvPreview.trim()) {
      setCsvColumns([]);
      return;
    }

    try {
      const lines = csvPreview.trim().split('\n');
      if (lines.length === 0) return;

      const headerRow = csvHasHeader && lines.length > 0 ? lines[0] : '';
      const dataRow = csvHasHeader && lines.length > 1 ? lines[1] : lines[0];

      // Convert separator to actual character
      const actualSeparator = getActualSeparator(csvSeparator);

      const parseRow = (row: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < row.length; i++) {
          const char = row[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === actualSeparator && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const headers = csvHasHeader ? parseRow(headerRow) : [];
      const dataValues = parseRow(dataRow);

      const columns = dataValues.map((value, index) => ({
        index,
        sample: value,
        enabled: true,
        fieldName: headers[index] || `Column ${index}`,
        fieldType: 'text' as DocumentField['type'],
      }));

      setCsvColumns(columns);
      toast.success(`Detected ${columns.length} columns`);
    } catch (error) {
      toast.error('Failed to analyze CSV');
      console.error(error);
    }
  };

  const applyCsvColumns = () => {
    const timestamp = Date.now();
    const newFields: DocumentField[] = csvColumns
      .filter(col => col.enabled)
      .map((col, idx) => ({
        id: `field_${timestamp}_${col.index}_${idx}`,
        label: col.fieldName,
        type: col.fieldType,
        required: false,
        csvColumnIndex: col.index,
      }));

    setNewTemplateFields(prev => [...prev, ...newFields]);
    toast.success(`Added ${newFields.length} fields from CSV`);
  };

  const addTemplateField = () => {
    setNewTemplateFields(prev => [
      ...prev,
      {
        id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        label: '',
        type: 'text',
        required: false,
      },
    ]);
  };

  const openEditTemplate = (template: DocumentTemplate) => {
    if (template.isDefault) {
      toast.error('Cannot edit default templates');
      return;
    }

    setEditingTemplate(template);
    setNewTemplateName(template.name);
    setNewTemplateDesc(template.description);
    setNewTemplateFields([...template.fields]);
    setCsvEnabled(template.csvConfig?.enabled || false);
    setCsvSeparator(template.csvConfig?.separator || ',');
    setCsvHasHeader(template.csvConfig?.hasHeader ?? true);
    setTemplateDialogOpen(true);
  };

  const resetTemplateDialog = () => {
    setEditingTemplate(null);
    setNewTemplateName('');
    setNewTemplateDesc('');
    setNewTemplateFields([]);
    setCsvEnabled(false);
    setCsvSeparator(',');
    setCsvHasHeader(true);
    setCsvPreview('');
    setCsvColumns([]);
  };

  const updateTemplateField = (index: number, updates: Partial<DocumentField>) => {
    setNewTemplateFields(prev =>
      prev.map((f, i) => (i === index ? { ...f, ...updates } : f))
    );
  };

  const removeTemplateField = (index: number) => {
    setNewTemplateFields(prev => prev.filter((_, i) => i !== index));
  };

  const saveTemplate = () => {
    if (!newTemplateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    if (newTemplateFields.length === 0) {
      toast.error('Please add at least one field');
      return;
    }

    const validFields = newTemplateFields.filter(f => f.label.trim());
    if (validFields.length === 0) {
      toast.error('Please add field labels');
      return;
    }

    if (editingTemplate) {
      // Update existing template
      const updatedTemplate: DocumentTemplate = {
        ...editingTemplate,
        name: newTemplateName,
        description: newTemplateDesc,
        fields: validFields,
        csvConfig: csvEnabled ? {
          enabled: true,
          separator: csvSeparator,
          hasHeader: csvHasHeader,
        } : undefined,
      };

      setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? updatedTemplate : t));
      toast.success('Template updated');
    } else {
      // Create new template
      const newTemplate: DocumentTemplate = {
        id: `custom_${Date.now()}`,
        name: newTemplateName,
        description: newTemplateDesc,
        fields: validFields,
        isDefault: false,
        createdAt: new Date(),
        csvConfig: csvEnabled ? {
          enabled: true,
          separator: csvSeparator,
          hasHeader: csvHasHeader,
        } : undefined,
      };

      setTemplates(prev => [...prev, newTemplate]);
      toast.success('Template created');
    }

    setTemplateDialogOpen(false);
    resetTemplateDialog();
  };

  const deleteTemplate = (id: string) => {
    const template = templates.find(t => t.id === id);
    if (template?.isDefault) {
      toast.error('Cannot delete default templates');
      return;
    }

    if (window.confirm('Delete this template? All documents using this template will remain.')) {
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast.success('Template deleted');
    }
  };

  return (
    <div className="space-y-6">
      {/* Templates Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Document Templates</CardTitle>
              <CardDescription>Select a template to create a new document</CardDescription>
            </div>
            <Dialog open={templateDialogOpen} onOpenChange={(open) => {
              setTemplateDialogOpen(open);
              if (!open) resetTemplateDialog();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingTemplate ? 'Edit Template' : 'Create Custom Template'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input
                      id="template-name"
                      value={newTemplateName}
                      onChange={e => setNewTemplateName(e.target.value)}
                      placeholder="e.g., Purchase Order"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="template-desc">Description</Label>
                    <Input
                      id="template-desc"
                      value={newTemplateDesc}
                      onChange={e => setNewTemplateDesc(e.target.value)}
                      placeholder="Brief description of the template"
                      className="mt-1"
                    />
                  </div>

                  {/* CSV Configuration */}
                  <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="csv-enabled"
                        checked={csvEnabled}
                        onChange={e => setCsvEnabled(e.target.checked)}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="csv-enabled" className="cursor-pointer">
                        Enable CSV Import
                      </Label>
                    </div>
                    
                    {csvEnabled && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="csv-separator" className="text-xs">
                              Separator
                            </Label>
                            <select
                              id="csv-separator"
                              value={csvSeparator === '\t' ? 'TAB' : csvSeparator}
                              onChange={e => setCsvSeparator(e.target.value === 'TAB' ? '\t' : e.target.value as any)}
                              className="w-full px-3 py-2 border rounded-md bg-background text-sm mt-1"
                            >
                              <option value=",">Comma (,)</option>
                              <option value=";">Semicolon (;)</option>
                              <option value="TAB">Tab</option>
                              <option value="|">Pipe (|)</option>
                            </select>
                          </div>
                          <div className="flex items-end">
                            <label className="flex items-center gap-2 px-3 py-2 border rounded-md text-sm w-full">
                              <input
                                type="checkbox"
                                checked={csvHasHeader}
                                onChange={e => setCsvHasHeader(e.target.checked)}
                                className="h-4 w-4"
                              />
                              Has Header Row
                            </label>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="csv-preview">Paste Sample CSV (Optional)</Label>
                          <Textarea
                            id="csv-preview"
                            value={csvPreview}
                            onChange={e => setCsvPreview(e.target.value)}
                            placeholder={`Paste a sample CSV to analyze columns...\n${csvHasHeader ? 'First row will be treated as header\n' : ''}Using separator: ${getSeparatorName(csvSeparator)}\nExample:\nName${getActualSeparator(csvSeparator)}SKU${getActualSeparator(csvSeparator)}Price\nWidget${getActualSeparator(csvSeparator)}WDG-001${getActualSeparator(csvSeparator)}29.99`}
                            rows={3}
                            className="mt-1 font-mono text-xs"
                          />
                          <div className="flex gap-2 mt-2">
                            <Button
                              onClick={analyzeCsvPreview}
                              size="sm"
                              variant="secondary"
                              disabled={!csvPreview.trim()}
                            >
                              <Table className="h-4 w-4 mr-2" />
                              Analyze Columns
                            </Button>
                            {csvColumns.length > 0 && (
                              <Button
                                onClick={applyCsvColumns}
                                size="sm"
                                disabled={csvColumns.filter(c => c.enabled).length === 0}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add {csvColumns.filter(c => c.enabled).length} Fields
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* CSV Column Mapping */}
                        {csvColumns.length > 0 && (
                          <div className="border rounded-lg p-3 space-y-2 bg-background max-h-64 overflow-y-auto">
                            <p className="text-xs font-medium">Detected Columns:</p>
                            {csvColumns.map((col, idx) => (
                              <div key={`col-${col.index}-${idx}`} className="flex gap-2 items-start p-2 border rounded text-sm">
                                <input
                                  type="checkbox"
                                  checked={col.enabled}
                                  onChange={e => {
                                    const updated = [...csvColumns];
                                    updated[idx].enabled = e.target.checked;
                                    setCsvColumns(updated);
                                  }}
                                  className="h-4 w-4 mt-1"
                                />
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      Col {col.index}
                                    </Badge>
                                    <Input
                                      value={col.fieldName}
                                      onChange={e => {
                                        const updated = [...csvColumns];
                                        updated[idx].fieldName = e.target.value;
                                        setCsvColumns(updated);
                                      }}
                                      placeholder="Field name"
                                      className="h-8 text-xs"
                                      disabled={!col.enabled}
                                    />
                                    <select
                                      value={col.fieldType}
                                      onChange={e => {
                                        const updated = [...csvColumns];
                                        updated[idx].fieldType = e.target.value as any;
                                        setCsvColumns(updated);
                                      }}
                                      className="px-2 py-1 border rounded-md bg-background text-xs"
                                      disabled={!col.enabled}
                                    >
                                      <option value="text">Text</option>
                                      <option value="textarea">Textarea</option>
                                      <option value="number">Number</option>
                                      <option value="date">Date</option>
                                      <option value="currency">Currency</option>
                                    </select>
                                  </div>
                                  <div className="text-xs text-muted-foreground font-mono truncate">
                                    Sample: {col.sample || '(empty)'}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground space-y-1 border-t pt-2">
                          <p>• Paste sample CSV above to automatically detect and map columns</p>
                          <p>• Toggle columns to include/exclude them from your template</p>
                          <p>• You can add additional manual fields below</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Fields {newTemplateFields.length > 0 && `(${newTemplateFields.length})`}</Label>
                    <div className="space-y-3 mt-2">
                      {newTemplateFields.map((field, index) => (
                        <div key={field.id} className="flex gap-2 items-start p-3 border rounded-md">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Input
                                placeholder="Field Label"
                                value={field.label}
                                onChange={e => updateTemplateField(index, { label: e.target.value })}
                              />
                              {csvEnabled && field.csvColumnIndex !== undefined && (
                                <Badge variant="secondary" className="text-xs shrink-0">
                                  CSV {field.csvColumnIndex}
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <select
                                value={field.type}
                                onChange={e =>
                                  updateTemplateField(index, { type: e.target.value as any })
                                }
                                className="px-3 py-2 border rounded-md bg-background text-sm flex-1"
                              >
                                <option value="text">Text</option>
                                <option value="textarea">Text Area</option>
                                <option value="number">Number</option>
                                <option value="date">Date</option>
                                <option value="currency">Currency</option>
                              </select>
                              <label className="flex items-center gap-2 px-3 py-2 border rounded-md text-sm">
                                <input
                                  type="checkbox"
                                  checked={field.required}
                                  onChange={e =>
                                    updateTemplateField(index, { required: e.target.checked })
                                  }
                                />
                                Required
                              </label>
                            </div>
                            {csvEnabled && (
                              <div className="flex items-center gap-2">
                                <Label className="text-xs text-muted-foreground whitespace-nowrap">
                                  CSV Column:
                                </Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={field.csvColumnIndex ?? ''}
                                  onChange={e =>
                                    updateTemplateField(index, {
                                      csvColumnIndex: e.target.value ? parseInt(e.target.value) : undefined
                                    })
                                  }
                                  placeholder="Leave empty for manual-only"
                                  className="flex-1 h-8 text-xs"
                                />
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTemplateField(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        onClick={addTemplateField}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Manual Field
                      </Button>
                      {newTemplateFields.length === 0 && (
                        <p className="text-xs text-center text-muted-foreground py-4">
                          {csvEnabled ? 'Use CSV column analysis above or add manual fields' : 'No fields added yet'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveTemplate}>
                    {editingTemplate ? 'Update Template' : 'Create Template'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(template => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        <FileText className="h-4 w-4" />
                        {template.name}
                        {template.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            Default
                          </Badge>
                        )}
                        {template.csvConfig?.enabled && (
                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                            <Table className="h-3 w-3" />
                            CSV
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-sm mt-1">
                        {template.description}
                      </CardDescription>
                    </div>
                    {!template.isDefault && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditTemplate(template)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => deleteTemplate(template.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{template.fields.length} fields</span>
                      {template.csvConfig?.enabled && (
                        <span className="text-xs">
                          {template.fields.filter(f => f.csvColumnIndex !== undefined).length} CSV mapped
                        </span>
                      )}
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => openCreateDocument(template)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Document
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Documents</CardTitle>
          <CardDescription>View and manage your created documents</CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileSignature className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No documents created yet</p>
              <p className="text-sm mt-2">Select a template above to create your first document</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map(doc => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0" />
                      <span className="font-medium">{doc.templateName}</span>
                      <span className="text-sm text-muted-foreground">
                        #{doc.id.slice(-6)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Created {doc.createdAt.toLocaleDateString()} at{' '}
                      {doc.createdAt.toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => duplicateDocument(doc)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportToPDF(doc)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteDocument(doc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Document Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create {selectedTemplate?.name}</DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4 py-4">
              {/* CSV Input Toggle */}
              {selectedTemplate.csvConfig?.enabled && (
                <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="use-csv"
                      checked={useCSVInput}
                      onChange={e => setUseCSVInput(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="use-csv" className="cursor-pointer">
                      Import from CSV
                    </Label>
                  </div>
                  
                  {useCSVInput && (
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded text-xs">
                        <Table className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p>
                            <strong>Separator:</strong> {getSeparatorName(selectedTemplate.csvConfig.separator)}
                            {' | '}
                            <strong>Header:</strong> {selectedTemplate.csvConfig.hasHeader ? 'Skip first row' : 'No header'}
                          </p>
                          <p className="text-muted-foreground">
                            Mapped columns will auto-populate. You can edit values after import.
                          </p>
                        </div>
                      </div>
                      <Label htmlFor="csv-input">Paste CSV Data</Label>
                      <Textarea
                        id="csv-input"
                        value={csvInput}
                        onChange={e => setCsvInput(e.target.value)}
                        placeholder={`Paste your CSV data here...\n${selectedTemplate.csvConfig.hasHeader ? 'First row will be treated as header and skipped.\n' : ''}Using separator: ${getSeparatorName(selectedTemplate.csvConfig.separator)}\n\nExample:\n${selectedTemplate.csvConfig.hasHeader ? 'Header1' + getActualSeparator(selectedTemplate.csvConfig.separator) + 'Header2\n' : ''}Value1${getActualSeparator(selectedTemplate.csvConfig.separator)}Value2`}
                        rows={4}
                        className="font-mono text-sm"
                      />
                      <Button
                        onClick={populateFromCSV}
                        size="sm"
                        className="w-full"
                      >
                        <Table className="h-4 w-4 mr-2" />
                        Populate Fields from CSV
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Manual Input Fields */}
              {selectedTemplate.fields.map(field => (
                <div key={field.id}>
                  <Label htmlFor={field.id}>
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                    {selectedTemplate.csvConfig?.enabled && field.csvColumnIndex !== undefined && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        CSV Col {field.csvColumnIndex}
                      </Badge>
                    )}
                  </Label>
                  {field.type === 'textarea' ? (
                    <Textarea
                      id={field.id}
                      value={documentData[field.id] || ''}
                      onChange={e =>
                        setDocumentData(prev => ({ ...prev, [field.id]: e.target.value }))
                      }
                      className="mt-1"
                      rows={4}
                    />
                  ) : field.type === 'currency' ? (
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                      <Input
                        id={field.id}
                        type="number"
                        step="0.01"
                        value={documentData[field.id] || ''}
                        onChange={e =>
                          setDocumentData(prev => ({ ...prev, [field.id]: e.target.value }))
                        }
                        className="pl-8"
                      />
                    </div>
                  ) : (
                    <Input
                      id={field.id}
                      type={field.type}
                      value={documentData[field.id] || ''}
                      onChange={e =>
                        setDocumentData(prev => ({ ...prev, [field.id]: e.target.value }))
                      }
                      className="mt-1"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveDocument}>Save Document</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
