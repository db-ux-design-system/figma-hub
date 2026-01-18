import { describe, it, expect } from 'vitest';
import { formatFeatureIssueBody } from './utils/templates';

describe('Feature Template Formatting', () => {
  describe('formatFeatureIssueBody', () => {
    it('should format a complete feature issue with all fields', () => {
      const description = 'Add dark mode support to the application';
      const useCase = 'Users want to use the app in low-light environments';
      const expectedBenefit = 'Improved user experience and reduced eye strain';

      const result = formatFeatureIssueBody(description, useCase, expectedBenefit);

      expect(result).toContain('## Beschreibung');
      expect(result).toContain(description);
      expect(result).toContain('## Use Case');
      expect(result).toContain(useCase);
      expect(result).toContain('## Erwarteter Nutzen');
      expect(result).toContain(expectedBenefit);
    });

    it('should maintain markdown structure with proper spacing', () => {
      const description = 'Test description';
      const useCase = 'Test use case';
      const expectedBenefit = 'Test benefit';

      const result = formatFeatureIssueBody(description, useCase, expectedBenefit);

      // Check that sections are separated by double newlines
      expect(result).toBe(`## Beschreibung
Test description

## Use Case
Test use case

## Erwarteter Nutzen
Test benefit`);
    });

    it('should handle empty strings for all fields', () => {
      const result = formatFeatureIssueBody('', '', '');

      expect(result).toContain('## Beschreibung');
      expect(result).toContain('## Use Case');
      expect(result).toContain('## Erwarteter Nutzen');
      // Should still have the structure even with empty content
      expect(result).toBe(`## Beschreibung


## Use Case


## Erwarteter Nutzen
`);
    });

    it('should preserve newlines in description', () => {
      const description = 'Line 1\nLine 2\nLine 3';
      const useCase = 'Use case';
      const expectedBenefit = 'Benefit';

      const result = formatFeatureIssueBody(description, useCase, expectedBenefit);

      expect(result).toContain('Line 1\nLine 2\nLine 3');
    });

    it('should preserve newlines in use case', () => {
      const description = 'Description';
      const useCase = 'Case 1\nCase 2\nCase 3';
      const expectedBenefit = 'Benefit';

      const result = formatFeatureIssueBody(description, useCase, expectedBenefit);

      expect(result).toContain('Case 1\nCase 2\nCase 3');
    });

    it('should preserve newlines in expected benefit', () => {
      const description = 'Description';
      const useCase = 'Use case';
      const expectedBenefit = 'Benefit 1\nBenefit 2\nBenefit 3';

      const result = formatFeatureIssueBody(description, useCase, expectedBenefit);

      expect(result).toContain('Benefit 1\nBenefit 2\nBenefit 3');
    });

    it('should handle special characters in fields', () => {
      const description = 'Feature with special chars: @#$%^&*()';
      const useCase = 'Use case with <html> tags and "quotes"';
      const expectedBenefit = "Benefit with 'single quotes' and [brackets]";

      const result = formatFeatureIssueBody(description, useCase, expectedBenefit);

      expect(result).toContain('@#$%^&*()');
      expect(result).toContain('<html>');
      expect(result).toContain('"quotes"');
      expect(result).toContain("'single quotes'");
      expect(result).toContain('[brackets]');
    });

    it('should handle very long text in all fields', () => {
      const longText = 'A'.repeat(1000);
      const result = formatFeatureIssueBody(longText, longText, longText);

      expect(result).toContain(longText);
      expect(result.split(longText).length - 1).toBe(3); // Should appear 3 times
    });

    it('should handle markdown formatting in input fields', () => {
      const description = '**Bold text** and *italic text*';
      const useCase = '- List item 1\n- List item 2';
      const expectedBenefit = '`code block` and [link](url)';

      const result = formatFeatureIssueBody(description, useCase, expectedBenefit);

      expect(result).toContain('**Bold text**');
      expect(result).toContain('*italic text*');
      expect(result).toContain('- List item 1');
      expect(result).toContain('`code block`');
      expect(result).toContain('[link](url)');
    });

    it('should handle unicode characters', () => {
      const description = 'Feature with emoji ✨ and unicode ñ, ü, ö';
      const useCase = 'Use case with 中文 characters';
      const expectedBenefit = 'Benefit with العربية text';

      const result = formatFeatureIssueBody(description, useCase, expectedBenefit);

      expect(result).toContain('✨');
      expect(result).toContain('ñ, ü, ö');
      expect(result).toContain('中文');
      expect(result).toContain('العربية');
    });

    it('should maintain section order', () => {
      const result = formatFeatureIssueBody('desc', 'case', 'benefit');

      const descIndex = result.indexOf('## Beschreibung');
      const caseIndex = result.indexOf('## Use Case');
      const benefitIndex = result.indexOf('## Erwarteter Nutzen');

      expect(descIndex).toBeLessThan(caseIndex);
      expect(caseIndex).toBeLessThan(benefitIndex);
    });

    it('should handle whitespace-only strings', () => {
      const description = '   ';
      const useCase = '\t\t';
      const expectedBenefit = '\n\n';

      const result = formatFeatureIssueBody(description, useCase, expectedBenefit);

      expect(result).toContain('## Beschreibung');
      expect(result).toContain('## Use Case');
      expect(result).toContain('## Erwarteter Nutzen');
    });

    it('should handle realistic feature request content', () => {
      const description = 'Implement a search functionality that allows users to quickly find components in the design system library.';
      const useCase = 'As a designer, I want to search for components by name or category so that I can quickly find and use the right component without scrolling through the entire library.';
      const expectedBenefit = 'This will significantly reduce the time designers spend looking for components, improving productivity and making the design system more accessible.';

      const result = formatFeatureIssueBody(description, useCase, expectedBenefit);

      expect(result).toContain('## Beschreibung');
      expect(result).toContain('search functionality');
      expect(result).toContain('## Use Case');
      expect(result).toContain('As a designer');
      expect(result).toContain('## Erwarteter Nutzen');
      expect(result).toContain('reduce the time');
    });

    it('should handle multiline formatted content', () => {
      const description = `This feature will add:
- Search by component name
- Filter by category
- Sort by usage frequency`;
      const useCase = `**Primary Use Case:**
Designers need quick access to components.

**Secondary Use Case:**
New team members need to discover available components.`;
      const expectedBenefit = `1. Faster component discovery
2. Better onboarding experience
3. Increased design system adoption`;

      const result = formatFeatureIssueBody(description, useCase, expectedBenefit);

      expect(result).toContain('- Search by component name');
      expect(result).toContain('**Primary Use Case:**');
      expect(result).toContain('1. Faster component discovery');
    });
  });
});
