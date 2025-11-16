# Dashboard User Guide

## Overview

The Modular Store Utility Dashboard is a highly customizable system designed to streamline retail operations. The dashboard consists of modular components that can be enabled, disabled, rearranged, and configured to match your specific workflow needs.

## Getting Started

### Navigation

The application has three main views accessible from the header:

1. **Dashboard** - Your customizable module workspace
2. **Store Layout** - Visual store layout designer with bay configuration
3. **Stock Take** - Systematic product scanning and location mapping

### Dashboard View

The dashboard displays all your enabled modules in a responsive grid layout. You can:

- **Drag and drop modules** to reorder them (hover over a module to see the drag handle)
- **Enable/disable modules** using the settings button (gear icon)
- **Add new modules** from the module browser
- **Configure modules** with module-specific settings (coming soon)

## Core Modules

### Cash Calculator
**Category:** Finance

Calculate end-of-day cash totals with float accommodation. Enter denomination counts and the system automatically calculates totals.

**Features:**
- Support for all standard denominations
- Float amount tracking
- Total calculations
- Reset functionality

**Use Case:** Perfect for daily till reconciliation and banking preparation.

---

### Transaction Calculator
**Category:** Finance

Track sales by payment categories using smart parsing. Type a category and amount together (e.g., "cash150" or "card75") and the system automatically categorizes it.

**Features:**
- Smart input parsing (e.g., "cash150", "150card", or just "150")
- Number-only entries default to "general" category
- Automatic category creation
- Color-coded categories
- Grand total calculation
- Individual category reset

**Use Case:** Track different payment methods during the day without complex forms.

---

### Task Tracker
**Category:** Productivity

Manage tasks with automated scheduling alerts and dirty stock tracking.

**Features:**
- Task creation with categories
- Due date tracking
- Alert system (configurable days before due date)
- Completion tracking
- Dirty stock barcode scanning
- Custom control scanning

**Use Case:** Keep track of store tasks, maintenance schedules, and product recalls.

---

### Quick Quote System
**Category:** Utility

Generate customer quotes instantly with line items and totals.

**Features:**
- Multi-item quotes
- Quantity and price per item
- Automatic total calculation
- Quote expiry dates
- Quote management (view, delete)

**Use Case:** Quickly provide price estimates to customers.

---

### Stock Location Tracker
**Category:** Inventory

Track inventory across multiple locations with OMA code support.

**Features:**
- Product name and SKU tracking
- Location assignment
- Quantity management
- OMA code field (for supplier integration)
- Quick search functionality
- "Add Another" button for rapid entry

**Use Case:** Maintain accurate records of where products are stored across your warehouse or store.

---

### Balance Calculator
**Category:** Finance

Track incoming and outgoing amounts to identify discrepancies.

**Features:**
- Incoming amount entry
- Outgoing amount entry
- Automatic variance calculation
- Clear visual feedback
- Reset functionality

**Use Case:** Reconcile cash, inventory, or any balanced system where in/out should match.

---

### Calculator
**Category:** Utility

Quick calculations for daily operations.

**Features:**
- Standard calculator functions
- Clear display
- Memory functions
- Keyboard support

**Use Case:** Quick math without leaving your workflow.

## Module Management

### Enabling/Disabling Modules

1. Click the **Settings** (gear) icon in the header
2. Toggle modules on/off using the switches
3. Click **Save Changes** to apply

Disabled modules won't appear on your dashboard but retain their data.

### Adding New Modules

1. Click the **Settings** (gear) icon in the header
2. Click **Add Module** in the settings dialog
3. Browse available modules by category
4. Click **Install** on the desired module
5. The module will be added to your dashboard

### Reordering Modules

1. Hover over any module on the dashboard
2. A drag handle will appear in the top-right corner
3. Click and drag the module to a new position
4. Release to drop it in place
5. Your layout is saved automatically

### Module Categories

- **Finance**: Money management, calculations, and financial tracking
- **Inventory**: Stock management and warehouse operations
- **Productivity**: Task management and workflow tools
- **Utility**: General-purpose tools and calculators
- **Custom**: User-created or third-party modules

## Advanced Features

### Store Layout Designer

Create a visual representation of your physical store:

1. Click **Store Layout** in the navigation
2. Add bays, obstructions, and landmarks
3. Configure bay properties (shelves, columns, drawers)
4. Set slot types (single, tray, inactive)
5. Upload custom icons for visual recognition
6. Save your layout for reference

**Use Cases:**
- Onboarding new staff with visual store maps
- Planning stock placement
- Optimizing store layout
- Emergency evacuation planning

### Stock Take

Systematically scan and record product locations:

1. Click **Stock Take** in the navigation
2. Scan product barcodes or enter manually
3. Assign locations to each product
4. Track quantities
5. Export results for analysis

**Features:**
- Barcode scanning support
- Custom control barcode configuration
- Location assignment
- Quantity tracking
- Export functionality

## Tips & Best Practices

### Workflow Optimization

1. **Prioritize Your Modules**: Place your most-used modules at the top-left of the dashboard
2. **Use Categories**: Group similar transactions in the Transaction Calculator
3. **Set Alert Days**: Configure task alerts to match your workflow rhythm
4. **Regular Backups**: Export important data regularly (quotes, stock locations)

### Data Entry Speed

1. **Transaction Calculator**: Use the number-only shortcut (just type "150") for quick general entries
2. **Stock Tracker**: Use the "Add Another" button to add multiple items without re-entering common fields
3. **Keyboard Shortcuts**: Press Enter in most input fields to submit quickly

### Organization

1. **Task Categories**: Use consistent category names in the Task Tracker
2. **Location Names**: Standardize location naming (e.g., "Bay-1-Shelf-A")
3. **Quote Naming**: Use meaningful customer names for easy retrieval

## Troubleshooting

### Module Not Appearing
- Check if the module is enabled in Settings
- Refresh the page
- Clear browser cache and reload

### Data Not Saving
- Ensure localStorage is enabled in your browser
- Check available storage space
- Try clearing old data from unused modules

### Drag & Drop Not Working
- Ensure you're hovering over the module to reveal the drag handle
- Try refreshing the page
- Check that you're on the Dashboard view

### Layout Reset
- Dashboard layout is saved automatically
- If layout is lost, check browser storage settings
- Re-enable modules and reorder as needed

## Keyboard Shortcuts

- **Enter**: Submit input in most fields
- **Escape**: Close dialogs and modals
- **Tab**: Navigate between fields

## Data Storage

All module data is stored locally in your browser's localStorage:

- **Persistent**: Data remains even after closing the browser
- **Local Only**: Data is not synced across devices
- **Privacy**: No data is sent to external servers
- **Export**: Use module-specific export features to backup data

## Future Features

The following features are planned for future releases:

- **Module Configuration UI**: Customize module behavior and appearance
- **Data Export/Import**: Backup and restore all module data
- **Custom Modules**: Create and import your own modules
- **Module Marketplace**: Browse and download community modules
- **Multi-Device Sync**: Sync dashboard across devices
- **Role-Based Access**: Different module sets for different staff roles
- **Analytics**: Track usage patterns and generate reports
- **API Integration**: Connect to external systems

## Support & Feedback

This is a modular system designed for continuous improvement. Module suggestions, feature requests, and bug reports are welcome.

### Creating Custom Modules

Developers can create custom modules following the Module Standard (see MODULE_STANDARD.md). Custom modules can be:

- Shared with the community
- Installed via the module browser
- Configured with custom settings
- Updated independently

---

**Version**: 1.0.0  
**Last Updated**: November 2024  
**System**: Modular Store Utility Dashboard
