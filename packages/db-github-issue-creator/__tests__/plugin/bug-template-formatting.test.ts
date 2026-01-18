import { describe, it, expect } from 'vitest';
import { formatBugIssueBody } from './utils/templates';

describe('Bug Template Formatting', () => {
  describe('formatBugIssueBody', () => {
    it('should format a complete bug issue with all fields', () => {
      const description = 'The login button does not respond when clicked';
      const reproSteps = '1. Navigate to login page\n2. Click login button\n3. Nothing happens';
      const expectedBehavior = 'The login form should submit and redirect to dashboard';

      const result = formatBugIssueBody(description, reproSteps, expectedBehavior);

      expect(result).toContain('## Beschreibung');
      expect(result).toContain(description);
      expect(result).toContain('## Reproduktionsschritte');
      expect(result).toContain(reproSteps);
      expect(result).toContain('## Erwartetes Verhalten');
      expect(result).toContain(expectedBehavior);
    });

    it('should maintain markdown structure with proper spacing', () => {
      const description = 'Test description';
      const reproSteps = 'Test steps';
      const expectedBehavior = 'Test behavior';

      const result = formatBugIssueBody(description, reproSteps, expectedBehavior);

      // Check that sections are separated by double newlines
      expect(result).toBe(`## Beschreibung
Test description

## Reproduktionsschritte
Test steps

## Erwartetes Verhalten
Test behavior`);
    });

    it('should handle empty strings for all fields', () => {
      const result = formatBugIssueBody('', '', '');

      expect(result).toContain('## Beschreibung');
      expect(result).toContain('## Reproduktionsschritte');
      expect(result).toContain('## Erwartetes Verhalten');
      // Should still have the structure even with empty content
      expect(result).toBe(`## Beschreibung


## Reproduktionsschritte


## Erwartetes Verhalten
`);
    });

    it('should preserve newlines in description', () => {
      const description = 'Line 1\nLine 2\nLine 3';
      const reproSteps = 'Steps';
      const expectedBehavior = 'Behavior';

      const result = formatBugIssueBody(description, reproSteps, expectedBehavior);

      expect(result).toContain('Line 1\nLine 2\nLine 3');
    });

    it('should preserve newlines in reproduction steps', () => {
      const description = 'Description';
      const reproSteps = 'Step 1\nStep 2\nStep 3';
      const expectedBehavior = 'Behavior';

      const result = formatBugIssueBody(description, reproSteps, expectedBehavior);

      expect(result).toContain('Step 1\nStep 2\nStep 3');
    });

    it('should preserve newlines in expected behavior', () => {
      const description = 'Description';
      const reproSteps = 'Steps';
      const expectedBehavior = 'Behavior 1\nBehavior 2\nBehavior 3';

      const result = formatBugIssueBody(description, reproSteps, expectedBehavior);

      expect(result).toContain('Behavior 1\nBehavior 2\nBehavior 3');
    });

    it('should handle special characters in fields', () => {
      const description = 'Bug with special chars: @#$%^&*()';
      const reproSteps = 'Steps with <html> tags and "quotes"';
      const expectedBehavior = "Behavior with 'single quotes' and [brackets]";

      const result = formatBugIssueBody(description, reproSteps, expectedBehavior);

      expect(result).toContain('@#$%^&*()');
      expect(result).toContain('<html>');
      expect(result).toContain('"quotes"');
      expect(result).toContain("'single quotes'");
      expect(result).toContain('[brackets]');
    });

    it('should handle very long text in all fields', () => {
      const longText = 'A'.repeat(1000);
      const result = formatBugIssueBody(longText, longText, longText);

      expect(result).toContain(longText);
      expect(result.split(longText).length - 1).toBe(3); // Should appear 3 times
    });

    it('should handle markdown formatting in input fields', () => {
      const description = '**Bold text** and *italic text*';
      const reproSteps = '- List item 1\n- List item 2';
      const expectedBehavior = '`code block` and [link](url)';

      const result = formatBugIssueBody(description, reproSteps, expectedBehavior);

      expect(result).toContain('**Bold text**');
      expect(result).toContain('*italic text*');
      expect(result).toContain('- List item 1');
      expect(result).toContain('`code block`');
      expect(result).toContain('[link](url)');
    });

    it('should handle unicode characters', () => {
      const description = 'Bug with emoji 🐛 and unicode ñ, ü, ö';
      const reproSteps = 'Steps with 中文 characters';
      const expectedBehavior = 'Behavior with العربية text';

      const result = formatBugIssueBody(description, reproSteps, expectedBehavior);

      expect(result).toContain('🐛');
      expect(result).toContain('ñ, ü, ö');
      expect(result).toContain('中文');
      expect(result).toContain('العربية');
    });

    it('should maintain section order', () => {
      const result = formatBugIssueBody('desc', 'steps', 'behavior');

      const descIndex = result.indexOf('## Beschreibung');
      const stepsIndex = result.indexOf('## Reproduktionsschritte');
      const behaviorIndex = result.indexOf('## Erwartetes Verhalten');

      expect(descIndex).toBeLessThan(stepsIndex);
      expect(stepsIndex).toBeLessThan(behaviorIndex);
    });

    it('should handle whitespace-only strings', () => {
      const description = '   ';
      const reproSteps = '\t\t';
      const expectedBehavior = '\n\n';

      const result = formatBugIssueBody(description, reproSteps, expectedBehavior);

      expect(result).toContain('## Beschreibung');
      expect(result).toContain('## Reproduktionsschritte');
      expect(result).toContain('## Erwartetes Verhalten');
    });
  });
});
