import { describe, it, expect } from 'vitest';
import { parseTransactionInput } from '../utils/transactionParser';

describe('parseTransactionInput', () => {
  describe('empty / blank input', () => {
    it('returns null for empty string', () => {
      expect(parseTransactionInput('')).toBeNull();
    });

    it('returns null for whitespace-only input', () => {
      expect(parseTransactionInput('   ')).toBeNull();
    });
  });

  describe('number-only input (general category)', () => {
    it('parses a plain integer as general category', () => {
      expect(parseTransactionInput('150')).toEqual({ category: 'general', amount: 150 });
    });

    it('parses a decimal number as general category', () => {
      expect(parseTransactionInput('75.50')).toEqual({ category: 'general', amount: 75.5 });
    });

    it('returns null for zero amount', () => {
      expect(parseTransactionInput('0')).toBeNull();
    });

    it('returns null for negative-only number (hyphen is not a supported character)', () => {
      expect(parseTransactionInput('-150')).toBeNull();
    });

    it('returns null for a multi-dot numeric string like "1.2.3"', () => {
      // Previously the permissive /^[\d.]+$/ regex accepted this; strict /^\d+(\.\d+)?$/ rejects it
      expect(parseTransactionInput('1.2.3')).toBeNull();
    });

    it('returns null for a lone decimal point', () => {
      expect(parseTransactionInput('.')).toBeNull();
    });
  });

  describe('category-prefix format (e.g. "cash150")', () => {
    it('parses category before amount', () => {
      expect(parseTransactionInput('cash150')).toEqual({ category: 'cash', amount: 150 });
    });

    it('parses decimal amount with prefix category', () => {
      expect(parseTransactionInput('card75.50')).toEqual({ category: 'card', amount: 75.5 });
    });

    it('normalises category to lowercase', () => {
      expect(parseTransactionInput('CASH200')).toEqual({ category: 'cash', amount: 200 });
    });
  });

  describe('category-suffix format (e.g. "150card")', () => {
    it('parses amount before category', () => {
      expect(parseTransactionInput('150card')).toEqual({ category: 'card', amount: 150 });
    });

    it('parses decimal amount with suffix category', () => {
      expect(parseTransactionInput('75.50eftpos')).toEqual({ category: 'eftpos', amount: 75.5 });
    });
  });

  describe('invalid formats', () => {
    it('returns null for letters-only input', () => {
      expect(parseTransactionInput('cash')).toBeNull();
    });

    it('returns null for input with two separate numbers', () => {
      expect(parseTransactionInput('cash150.00card200')).toBeNull();
    });

    it('returns null for input with two separate categories', () => {
      expect(parseTransactionInput('cash150card')).toBeNull();
    });

    it('returns null for zero amount with category', () => {
      expect(parseTransactionInput('cash0')).toBeNull();
    });

    it('returns null for special characters only', () => {
      expect(parseTransactionInput('!@#$')).toBeNull();
    });

    it('returns null for input with only special characters and numbers', () => {
      expect(parseTransactionInput('150!')).toBeNull();
    });

    it('returns null for input with trailing special character after a valid token (e.g. "cash150!")', () => {
      // Previously the chunking regex ignored the "!" and returned a valid parse; now rejected
      expect(parseTransactionInput('cash150!')).toBeNull();
    });

    it('returns null for input with embedded special characters (e.g. "ca$h150")', () => {
      expect(parseTransactionInput('ca$h150')).toBeNull();
    });

    it('returns null for multi-dot amount with category (e.g. "cash1.2.3")', () => {
      expect(parseTransactionInput('cash1.2.3')).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('handles single-digit amount', () => {
      expect(parseTransactionInput('5')).toEqual({ category: 'general', amount: 5 });
    });

    it('handles large amount', () => {
      expect(parseTransactionInput('99999')).toEqual({ category: 'general', amount: 99999 });
    });

    it('trims surrounding whitespace before parsing', () => {
      expect(parseTransactionInput('  cash150  ')).toEqual({ category: 'cash', amount: 150 });
    });
  });
});
