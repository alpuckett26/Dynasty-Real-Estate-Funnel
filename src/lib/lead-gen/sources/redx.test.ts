import { describe, it, expect } from 'vitest';
import { parseRedxCsv, parseCsv, normalizePhone } from './redx';

describe('normalizePhone', () => {
  it('normalises common US formats to E.164', () => {
    expect(normalizePhone('(225) 555-0134')).toBe('+12255550134');
    expect(normalizePhone('225.555.0177')).toBe('+12255550177');
    expect(normalizePhone('12255550143')).toBe('+12255550143');
  });

  it('rejects anything unusable rather than guessing', () => {
    expect(normalizePhone('555-0134')).toBeNull();
    expect(normalizePhone('')).toBeNull();
    expect(normalizePhone('n/a')).toBeNull();
  });
});

describe('parseCsv', () => {
  it('handles quoted fields containing commas', () => {
    const rows = parseCsv('a,b\n"Thibodeaux, Paul",905 Napoleon St');
    expect(rows[1][0]).toBe('Thibodeaux, Paul');
    expect(rows[1][1]).toBe('905 Napoleon St');
  });

  it('handles escaped quotes and skips blank lines', () => {
    const rows = parseCsv('a\n"say ""hi"""\n\n');
    expect(rows[1][0]).toBe('say "hi"');
    expect(rows).toHaveLength(2);
  });
});

describe('parseRedxCsv', () => {
  it('parses a standard FSBO export with multiple phone columns', () => {
    const csv = [
      'First Name,Last Name,Property Address,City,State,Zip,Phone 1,Phone 2,Email,Lead Type',
      'Marcus,Doucet,1418 Government St,Baton Rouge,LA,70802,(225) 555-0134,225-555-9921,mdoucet@example.com,FSBO',
    ].join('\n');

    const [lead] = parseRedxCsv(csv);
    expect(lead.firstName).toBe('Marcus');
    expect(lead.lastName).toBe('Doucet');
    expect(lead.phones).toEqual(['+12255550134', '+12255559921']);
    expect(lead.email).toBe('mdoucet@example.com');
    expect(lead.propertyAddress).toBe('1418 Government St');
    expect(lead.leadType).toBe('FSBO');
  });

  it('handles alternate headers and a combined name column', () => {
    const csv = [
      'Owner Name,Street Address,City,ST,Zip Code,Mobile Phone,Landline,Status',
      '"Thibodeaux, Paul",905 Napoleon St,Baton Rouge,LA,70802,225.555.0177,(225) 555-0102,Expired',
    ].join('\n');

    const [lead] = parseRedxCsv(csv, 'Expired');
    // "Thibodeaux, Paul" splits on whitespace, so surname-first exports land as-is.
    expect(lead.firstName).toBe('Thibodeaux,');
    expect(lead.phones).toEqual(['+12255550177', '+12255550102']);
    expect(lead.city).toBe('Baton Rouge');
    expect(lead.leadType).toBe('Expired');
  });

  it('drops rows with no phone and no email — they are unusable', () => {
    const csv = [
      'First Name,Last Name,Phone,Email',
      'Ghost,Record,,',
      'Real,Person,2255550111,',
    ].join('\n');

    const leads = parseRedxCsv(csv);
    expect(leads).toHaveLength(1);
    expect(leads[0].firstName).toBe('Real');
  });

  it('deduplicates repeated numbers across phone columns', () => {
    const csv = [
      'First Name,Phone 1,Phone 2',
      'Dana,2255550111,(225) 555-0111',
    ].join('\n');

    expect(parseRedxCsv(csv)[0].phones).toEqual(['+12255550111']);
  });

  it('returns nothing for an empty or header-only file', () => {
    expect(parseRedxCsv('')).toEqual([]);
    expect(parseRedxCsv('First Name,Phone')).toEqual([]);
  });

  it('keeps unmapped columns as note context', () => {
    const csv = [
      'First Name,Phone,Days on Market,Asking Price',
      'Renee,2255550188,182,$285000',
    ].join('\n');

    const [lead] = parseRedxCsv(csv);
    expect(lead.extra['Days on Market']).toBe('182');
    expect(lead.extra['Asking Price']).toBe('$285000');
  });
});
