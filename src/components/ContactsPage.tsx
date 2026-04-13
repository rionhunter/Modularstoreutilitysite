import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  Trash2, 
  Edit, 
  X,
  Tag,
  Building2,
  MapPin,
  Globe,
  User
} from 'lucide-react';
import { toast } from 'sonner';

export interface Contact {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phoneNumbers: Array<{
    label: string;
    number: string;
  }>;
  address?: string;
  website?: string;
  notes?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_PHONE_LABELS = ['Mobile', 'Work', 'Home', 'Fax'];

export function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem('contacts');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((c: Contact) => ({
        ...c,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
      }));
    }
    return [];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phoneNumbers: [{ label: 'Mobile', number: '' }],
    address: '',
    website: '',
    notes: '',
    tags: [] as string[],
  });
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    localStorage.setItem('contacts', JSON.stringify(contacts));
    // Dispatch event for potential listeners
    window.dispatchEvent(new Event('contacts-updated'));
  }, [contacts]);

  useEffect(() => {
    // Listen for contacts updates from import
    const handleContactsUpdated = () => {
      const saved = localStorage.getItem('contacts');
      if (saved) {
        const parsed = JSON.parse(saved);
        setContacts(parsed.map((c: Contact) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
        })));
      }
    };
    
    window.addEventListener('contacts-updated', handleContactsUpdated);
    return () => window.removeEventListener('contacts-updated', handleContactsUpdated);
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      company: '',
      email: '',
      phoneNumbers: [{ label: 'Mobile', number: '' }],
      address: '',
      website: '',
      notes: '',
      tags: [],
    });
    setNewTag('');
    setEditingContact(null);
  };

  const openEditDialog = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      company: contact.company || '',
      email: contact.email || '',
      phoneNumbers: contact.phoneNumbers.length > 0 
        ? contact.phoneNumbers 
        : [{ label: 'Mobile', number: '' }],
      address: contact.address || '',
      website: contact.website || '',
      notes: contact.notes || '',
      tags: contact.tags,
    });
    setDialogOpen(true);
  };

  const saveContact = () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a contact name');
      return;
    }

    // Filter out empty phone numbers
    const validPhoneNumbers = formData.phoneNumbers.filter(p => p.number.trim());

    const contactData = {
      ...formData,
      phoneNumbers: validPhoneNumbers,
      updatedAt: new Date(),
    };

    if (editingContact) {
      // Update existing contact
      setContacts(prev =>
        prev.map(c =>
          c.id === editingContact.id
            ? { ...c, ...contactData }
            : c
        )
      );
      toast.success('Contact updated successfully');
    } else {
      // Create new contact
      const newContact: Contact = {
        id: Date.now().toString(),
        ...contactData,
        createdAt: new Date(),
      };
      setContacts(prev => [...prev, newContact]);
      toast.success('Contact added successfully');
    }

    setDialogOpen(false);
    resetForm();
  };

  const deleteContact = (id: string) => {
    const contact = contacts.find(c => c.id === id);
    if (contact) {
      if (window.confirm(`Delete contact "${contact.name}"?`)) {
        setContacts(prev => prev.filter(c => c.id !== id));
        toast.success('Contact deleted');
      }
    }
  };

  const addPhoneNumber = () => {
    setFormData(prev => ({
      ...prev,
      phoneNumbers: [...prev.phoneNumbers, { label: 'Mobile', number: '' }],
    }));
  };

  const updatePhoneNumber = (index: number, field: 'label' | 'number', value: string) => {
    setFormData(prev => ({
      ...prev,
      phoneNumbers: prev.phoneNumbers.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      ),
    }));
  };

  const removePhoneNumber = (index: number) => {
    setFormData(prev => ({
      ...prev,
      phoneNumbers: prev.phoneNumbers.filter((_, i) => i !== index),
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  // Get all unique tags
  const allTags = Array.from(new Set(contacts.flatMap(c => c.tags))).sort();

  // Filter contacts
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phoneNumbers.some(p => p.number.includes(searchQuery)) ||
      contact.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTag = selectedTag === 'all' || contact.tags.includes(selectedTag);

    return matchesSearch && matchesTag;
  }).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts by name, company, email, phone, or tags..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedTag}
                onChange={e => setSelectedTag(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background text-sm"
              >
                <option value="all">All Tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
              <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Contact
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingContact ? 'Edit Contact' : 'Add New Contact'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">
                          Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="John Doe"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          value={formData.company}
                          onChange={e => setFormData(prev => ({ ...prev, company: e.target.value }))}
                          placeholder="ABC Corp"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="john@example.com"
                        className="mt-1"
                      />
                    </div>

                    {/* Phone Numbers */}
                    <div>
                      <Label>Phone Numbers</Label>
                      <div className="space-y-2 mt-1">
                        {formData.phoneNumbers.map((phone, index) => (
                          <div key={index} className="flex gap-2">
                            <select
                              value={phone.label}
                              onChange={e => updatePhoneNumber(index, 'label', e.target.value)}
                              className="px-3 py-2 border rounded-md bg-background text-sm w-32"
                            >
                              {DEFAULT_PHONE_LABELS.map(label => (
                                <option key={label} value={label}>
                                  {label}
                                </option>
                              ))}
                            </select>
                            <Input
                              value={phone.number}
                              onChange={e => updatePhoneNumber(index, 'number', e.target.value)}
                              placeholder="Phone number"
                              className="flex-1"
                            />
                            {formData.phoneNumbers.length > 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removePhoneNumber(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addPhoneNumber}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Phone Number
                        </Button>
                      </div>
                    </div>

                    {/* Website */}
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={e => setFormData(prev => ({ ...prev, website: e.target.value }))}
                        placeholder="https://example.com"
                        className="mt-1"
                      />
                    </div>

                    {/* Address */}
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="123 Main St, City, State, ZIP"
                        className="mt-1"
                        rows={2}
                      />
                    </div>

                    {/* Tags */}
                    <div>
                      <Label>Tags</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={newTag}
                          onChange={e => setNewTag(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                          placeholder="Add a tag..."
                        />
                        <Button onClick={addTag} variant="outline">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {formData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="gap-1">
                              {tag}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => removeTag(tag)}
                              />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Additional notes..."
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={saveContact}>
                      {editingContact ? 'Update' : 'Save'} Contact
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contacts Grid */}
      {filteredContacts.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No contacts found</p>
              <p className="text-sm">
                {searchQuery || selectedTag !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Add your first contact to get started'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map(contact => (
            <Card key={contact.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="h-4 w-4 shrink-0" />
                      <span className="truncate">{contact.name}</span>
                    </CardTitle>
                    {contact.company && (
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Building2 className="h-3 w-3 shrink-0" />
                        <span className="truncate">{contact.company}</span>
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(contact)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => deleteContact(contact.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Email */}
                {contact.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-sm hover:underline truncate flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.success('Opening email client...');
                      }}
                    >
                      {contact.email}
                    </a>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `mailto:${contact.email}`;
                      }}
                    >
                      <Mail className="h-3 w-3 mr-1" />
                      Email
                    </Button>
                  </div>
                )}

                {/* Phone Numbers */}
                {contact.phoneNumbers.map((phone, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground w-16 shrink-0">
                      {phone.label}:
                    </span>
                    <a
                      href={`tel:${phone.number}`}
                      className="text-sm hover:underline truncate"
                    >
                      {phone.number}
                    </a>
                  </div>
                ))}

                {/* Website */}
                {contact.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a
                      href={contact.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm hover:underline truncate"
                    >
                      {contact.website}
                    </a>
                  </div>
                )}

                {/* Address */}
                {contact.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground line-clamp-2">
                      {contact.address}
                    </span>
                  </div>
                )}

                {/* Tags */}
                {contact.tags.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
                    {contact.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Notes */}
                {contact.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {contact.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats Footer */}
      <Card>
        <CardContent className="py-4">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Total Contacts: {contacts.length}</span>
            <span>Showing: {filteredContacts.length}</span>
            <span>Tags: {allTags.length}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
