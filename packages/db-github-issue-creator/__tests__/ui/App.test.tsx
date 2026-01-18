import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

// Mock parent.postMessage
const mockPostMessage = vi.fn();
Object.defineProperty(window, 'parent', {
  writable: true,
  value: {
    postMessage: mockPostMessage
  }
});

describe('App Component', () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
  });

  it('should render the app title', async () => {
    render(<App />);
    
    // Simulate token-loaded response
    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          pluginMessage: {
            type: 'token-loaded',
            token: null
          }
        }
      })
    );

    await waitFor(() => {
      expect(screen.getByText('GitHub Issue Creator')).toBeDefined();
    });
  });

  it('should show loading state initially', () => {
    render(<App />);
    expect(screen.getByText('Lade Token...')).toBeDefined();
  });

  it('should send load-token message on mount', () => {
    render(<App />);
    expect(mockPostMessage).toHaveBeenCalledWith(
      { pluginMessage: { type: 'load-token' } },
      '*'
    );
  });

  it('should render token input when no token is configured', async () => {
    render(<App />);
    
    // Simulate token-loaded response with no token
    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          pluginMessage: {
            type: 'token-loaded',
            token: null
          }
        }
      })
    );

    await waitFor(() => {
      expect(screen.getByLabelText('GitHub Personal Access Token')).toBeDefined();
      expect(screen.getByText('Token speichern')).toBeDefined();
    });
  });

  it('should show token configured message when token exists', async () => {
    render(<App />);
    
    // Simulate token-loaded response with a token
    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          pluginMessage: {
            type: 'token-loaded',
            token: 'ghp_test_token'
          }
        }
      })
    );

    await waitFor(() => {
      expect(screen.getByText('✓ Token konfiguriert')).toBeDefined();
    });
  });

  it('should send save-token message when button is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // Simulate token-loaded response with no token
    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          pluginMessage: {
            type: 'token-loaded',
            token: null
          }
        }
      })
    );

    await waitFor(() => {
      expect(screen.getByLabelText('GitHub Personal Access Token')).toBeDefined();
    });

    const input = screen.getByLabelText('GitHub Personal Access Token') as HTMLInputElement;
    const button = screen.getByText('Token speichern');

    // Type token
    await user.type(input, 'ghp_new_token');
    
    // Click save button
    await user.click(button);

    // Verify postMessage was called with save-token
    expect(mockPostMessage).toHaveBeenCalledWith(
      { pluginMessage: { type: 'save-token', token: 'ghp_new_token' } },
      '*'
    );
  });

  it('should update token state when input changes', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // Simulate token-loaded response with no token
    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          pluginMessage: {
            type: 'token-loaded',
            token: null
          }
        }
      })
    );

    await waitFor(() => {
      expect(screen.getByLabelText('GitHub Personal Access Token')).toBeDefined();
    });

    const input = screen.getByLabelText('GitHub Personal Access Token') as HTMLInputElement;

    // Type token
    await user.type(input, 'test_token');
    
    // Verify input value
    expect(input.value).toBe('test_token');
  });

  // Template Selection Tests
  describe('Template Selection', () => {
    it('should render template selection when token is configured', async () => {
      render(<App />);
      
      // Simulate token-loaded response with a token
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            pluginMessage: {
              type: 'token-loaded',
              token: 'ghp_test_token'
            }
          }
        })
      );

      await waitFor(() => {
        expect(screen.getByText('Issue-Template auswählen')).toBeDefined();
        expect(screen.getByText('🐛 Bug Report')).toBeDefined();
        expect(screen.getByText('✨ Feature Request')).toBeDefined();
      });
    });

    it('should have bug template selected by default', async () => {
      render(<App />);
      
      // Simulate token-loaded response with a token
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            pluginMessage: {
              type: 'token-loaded',
              token: 'ghp_test_token'
            }
          }
        })
      );

      await waitFor(() => {
        const bugRadio = screen.getByRole('radio', { name: /Bug Report/i }) as HTMLInputElement;
        expect(bugRadio.checked).toBe(true);
        expect(screen.getByText('Bug Report')).toBeDefined();
      });
    });

    it('should switch to feature template when selected', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Simulate token-loaded response with a token
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            pluginMessage: {
              type: 'token-loaded',
              token: 'ghp_test_token'
            }
          }
        })
      );

      await waitFor(() => {
        expect(screen.getByText('Issue-Template auswählen')).toBeDefined();
      });

      const featureRadio = screen.getByRole('radio', { name: /Feature Request/i }) as HTMLInputElement;
      
      // Click feature radio button
      await user.click(featureRadio);

      // Verify feature is selected
      expect(featureRadio.checked).toBe(true);
      expect(screen.getByText('Feature Request')).toBeDefined();
    });

    it('should switch back to bug template when selected', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Simulate token-loaded response with a token
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            pluginMessage: {
              type: 'token-loaded',
              token: 'ghp_test_token'
            }
          }
        })
      );

      await waitFor(() => {
        expect(screen.getByText('Issue-Template auswählen')).toBeDefined();
      });

      const featureRadio = screen.getByRole('radio', { name: /Feature Request/i }) as HTMLInputElement;
      const bugRadio = screen.getByRole('radio', { name: /Bug Report/i }) as HTMLInputElement;
      
      // Click feature radio button
      await user.click(featureRadio);
      expect(featureRadio.checked).toBe(true);

      // Click bug radio button
      await user.click(bugRadio);
      expect(bugRadio.checked).toBe(true);
      expect(screen.getByText('Bug Report')).toBeDefined();
    });
  });

  // Issue Creation Tests (Task 13.1)
  describe('Issue Creation', () => {
    it('should render "Issue erstellen" button when token is configured', async () => {
      render(<App />);
      
      // Simulate token-loaded response with a token
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            pluginMessage: {
              type: 'token-loaded',
              token: 'ghp_test_token'
            }
          }
        })
      );

      await waitFor(() => {
        expect(screen.getByText('Issue erstellen')).toBeDefined();
      });
    });

    it('should show validation error when title is empty', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Simulate token-loaded response with a token
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            pluginMessage: {
              type: 'token-loaded',
              token: 'ghp_test_token'
            }
          }
        })
      );

      await waitFor(() => {
        expect(screen.getByText('Issue erstellen')).toBeDefined();
      });

      const createButton = screen.getByText('Issue erstellen');
      
      // Click create button without filling title
      await user.click(createButton);

      // Verify error message is shown
      await waitFor(() => {
        expect(screen.getByText('Titel darf nicht leer sein')).toBeDefined();
      });
    });

    it('should show validation error when title is only whitespace', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Simulate token-loaded response with a token
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            pluginMessage: {
              type: 'token-loaded',
              token: 'ghp_test_token'
            }
          }
        })
      );

      await waitFor(() => {
        expect(screen.getByText('Issue erstellen')).toBeDefined();
      });

      const titleInput = screen.getByLabelText(/Titel/i) as HTMLInputElement;
      const createButton = screen.getByText('Issue erstellen');
      
      // Type whitespace-only title
      await user.type(titleInput, '   ');
      
      // Click create button
      await user.click(createButton);

      // Verify error message is shown
      await waitFor(() => {
        expect(screen.getByText('Titel darf nicht leer sein')).toBeDefined();
      });
    });

    it('should send create-issue message with bug template data', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Simulate token-loaded response with a token
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            pluginMessage: {
              type: 'token-loaded',
              token: 'ghp_test_token'
            }
          }
        })
      );

      await waitFor(() => {
        expect(screen.getByText('Issue erstellen')).toBeDefined();
      });

      // Fill in bug form
      const titleInput = screen.getByLabelText(/Titel/i) as HTMLInputElement;
      const descriptionInput = screen.getByLabelText(/Beschreibung/i) as HTMLTextAreaElement;
      const reproStepsInput = screen.getByLabelText(/Reproduktionsschritte/i) as HTMLTextAreaElement;
      const expectedBehaviorInput = screen.getByLabelText(/Erwartetes Verhalten/i) as HTMLTextAreaElement;
      
      await user.type(titleInput, 'Test Bug');
      await user.type(descriptionInput, 'Bug description');
      await user.type(reproStepsInput, 'Step 1, Step 2');
      await user.type(expectedBehaviorInput, 'Expected behavior');

      const createButton = screen.getByText('Issue erstellen');
      
      // Clear previous calls
      mockPostMessage.mockClear();
      
      // Click create button
      await user.click(createButton);

      // Verify postMessage was called with create-issue
      expect(mockPostMessage).toHaveBeenCalledWith(
        {
          pluginMessage: {
            type: 'create-issue',
            token: 'ghp_test_token',
            template: 'bug',
            title: 'Test Bug',
            description: 'Bug description',
            reproSteps: 'Step 1, Step 2',
            expectedBehavior: 'Expected behavior'
          }
        },
        '*'
      );
    });

    it('should send create-issue message with feature template data', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Simulate token-loaded response with a token
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            pluginMessage: {
              type: 'token-loaded',
              token: 'ghp_test_token'
            }
          }
        })
      );

      await waitFor(() => {
        expect(screen.getByText('Issue erstellen')).toBeDefined();
      });

      // Switch to feature template
      const featureRadio = screen.getByRole('radio', { name: /Feature Request/i });
      await user.click(featureRadio);

      await waitFor(() => {
        expect(screen.getByText('Feature Request')).toBeDefined();
      });

      // Fill in feature form
      const titleInput = screen.getByLabelText(/Titel/i) as HTMLInputElement;
      const descriptionInput = screen.getByLabelText(/Beschreibung/i) as HTMLTextAreaElement;
      const useCaseInput = screen.getByLabelText(/Use Case/i) as HTMLTextAreaElement;
      const expectedBenefitInput = screen.getByLabelText(/Erwarteter Nutzen/i) as HTMLTextAreaElement;
      
      await user.type(titleInput, 'Test Feature');
      await user.type(descriptionInput, 'Feature description');
      await user.type(useCaseInput, 'Use case description');
      await user.type(expectedBenefitInput, 'Expected benefit');

      const createButton = screen.getByText('Issue erstellen');
      
      // Clear previous calls
      mockPostMessage.mockClear();
      
      // Click create button
      await user.click(createButton);

      // Verify postMessage was called with create-issue
      expect(mockPostMessage).toHaveBeenCalledWith(
        {
          pluginMessage: {
            type: 'create-issue',
            token: 'ghp_test_token',
            template: 'feature',
            title: 'Test Feature',
            description: 'Feature description',
            useCase: 'Use case description',
            expectedBenefit: 'Expected benefit'
          }
        },
        '*'
      );
    });

    it('should show loading state during issue creation', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Simulate token-loaded response with a token
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            pluginMessage: {
              type: 'token-loaded',
              token: 'ghp_test_token'
            }
          }
        })
      );

      await waitFor(() => {
        expect(screen.getByText('Issue erstellen')).toBeDefined();
      });

      // Fill in title
      const titleInput = screen.getByLabelText(/Titel/i) as HTMLInputElement;
      await user.type(titleInput, 'Test Bug');

      const createButton = screen.getByText('Issue erstellen') as HTMLButtonElement;
      
      // Click create button
      await user.click(createButton);

      // Verify loading state is shown
      await waitFor(() => {
        expect(screen.getByText('Issue wird erstellt...')).toBeDefined();
        const button = screen.getByText('Issue wird erstellt...') as HTMLButtonElement;
        expect(button.disabled).toBe(true);
      });
    });

    it('should show success message when issue is created', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Simulate token-loaded response with a token
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            pluginMessage: {
              type: 'token-loaded',
              token: 'ghp_test_token'
            }
          }
        })
      );

      await waitFor(() => {
        expect(screen.getByText('Issue erstellen')).toBeDefined();
      });

      // Fill in title
      const titleInput = screen.getByLabelText(/Titel/i) as HTMLInputElement;
      await user.type(titleInput, 'Test Bug');

      const createButton = screen.getByText('Issue erstellen');
      
      // Click create button
      await user.click(createButton);

      // Simulate issue-created response
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            pluginMessage: {
              type: 'issue-created',
              issueUrl: 'https://github.com/db-ux-design-system/core/issues/123'
            }
          }
        })
      );

      // Verify success message is shown
      await waitFor(() => {
        expect(screen.getByText('Issue erfolgreich erstellt!')).toBeDefined();
        expect(screen.getByText('https://github.com/db-ux-design-system/core/issues/123')).toBeDefined();
      });
    });

    it('should show error message when issue creation fails', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Simulate token-loaded response with a token
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            pluginMessage: {
              type: 'token-loaded',
              token: 'ghp_test_token'
            }
          }
        })
      );

      await waitFor(() => {
        expect(screen.getByText('Issue erstellen')).toBeDefined();
      });

      // Fill in title
      const titleInput = screen.getByLabelText(/Titel/i) as HTMLInputElement;
      await user.type(titleInput, 'Test Bug');

      const createButton = screen.getByText('Issue erstellen');
      
      // Click create button
      await user.click(createButton);

      // Simulate error response
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            pluginMessage: {
              type: 'error',
              message: 'Ungültiger Token'
            }
          }
        })
      );

      // Verify error message is shown
      await waitFor(() => {
        expect(screen.getByText('Ungültiger Token')).toBeDefined();
      });
    });
  });

  // Success Message and URL Link Tests (Task 14.1)
  describe('Success Message and Issue URL Link', () => {
    it('should display success message with issue URL as clickable link', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Simulate token-loaded response with a token
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            pluginMessage: {
              type: 'token-loaded',
              token: 'ghp_test_token'
            }
          }
        })
      );

      await waitFor(() => {
        expect(screen.getByText('Issue erstellen')).toBeDefined();
      });

      // Fill in title
      const titleInput = screen.getByLabelText(/Titel/i) as HTMLInputElement;
      await user.type(titleInput, 'Test Bug');

      const createButton = screen.getByText('Issue erstellen');
      
      // Click create button
      await user.click(createButton);

      // Simulate issue-created response
      const testIssueUrl = 'https://github.com/db-ux-design-system/core/issues/123';
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            pluginMessage: {
              type: 'issue-created',
              issueUrl: testIssueUrl
            }
          }
        })
      );

      // Verify success message is shown
      await waitFor(() => {
        expect(screen.getByText('Issue erfolgreich erstellt!')).toBeDefined();
      });

      // Verify issue URL is displayed as a link
      const link = screen.getByRole('link', { name: testIssueUrl }) as HTMLAnchorElement;
      expect(link).toBeDefined();
      expect(link.href).toBe(testIssueUrl);
      expect(link.target).toBe('_blank');
      expect(link.rel).toBe('noopener noreferrer');
    });

    it('should display full issue URL in the link text', async () => {
      render(<App />);
      
      // Simulate token-loaded response with a token
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            pluginMessage: {
              type: 'token-loaded',
              token: 'ghp_test_token'
            }
          }
        })
      );

      await waitFor(() => {
        expect(screen.getByText('Issue erstellen')).toBeDefined();
      });

      // Simulate issue-created response
      const testIssueUrl = 'https://github.com/db-ux-design-system/core/issues/456';
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            pluginMessage: {
              type: 'issue-created',
              issueUrl: testIssueUrl
            }
          }
        })
      );

      // Verify the full URL is displayed in the link text
      await waitFor(() => {
        const linkText = screen.getByText(testIssueUrl);
        expect(linkText).toBeDefined();
        expect(linkText.tagName).toBe('A');
      });
    });

    it('should not show success message when issue URL is not available', async () => {
      render(<App />);
      
      // Simulate token-loaded response with a token
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            pluginMessage: {
              type: 'token-loaded',
              token: 'ghp_test_token'
            }
          }
        })
      );

      await waitFor(() => {
        expect(screen.getByText('Issue erstellen')).toBeDefined();
      });

      // Verify no success message is shown initially
      expect(screen.queryByText('Issue erfolgreich erstellt!')).toBeNull();
    });

    it('should clear previous error messages when showing success', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Simulate token-loaded response with a token
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            pluginMessage: {
              type: 'token-loaded',
              token: 'ghp_test_token'
            }
          }
        })
      );

      await waitFor(() => {
        expect(screen.getByText('Issue erstellen')).toBeDefined();
      });

      // Fill in title
      const titleInput = screen.getByLabelText(/Titel/i) as HTMLInputElement;
      await user.type(titleInput, 'Test Bug');

      const createButton = screen.getByText('Issue erstellen');
      
      // Click create button
      await user.click(createButton);

      // Simulate error response first
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            pluginMessage: {
              type: 'error',
              message: 'Test error'
            }
          }
        })
      );

      // Verify error is shown
      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeDefined();
      });

      // Click create button again
      await user.click(createButton);

      // Simulate success response
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            pluginMessage: {
              type: 'issue-created',
              issueUrl: 'https://github.com/db-ux-design-system/core/issues/789'
            }
          }
        })
      );

      // Verify success is shown and error is cleared
      await waitFor(() => {
        expect(screen.getByText('Issue erfolgreich erstellt!')).toBeDefined();
        expect(screen.queryByText('Test error')).toBeNull();
      });
    });
  });

  // Form Reset Tests (Task 15.1)
  describe('Form Reset', () => {
    it('should render "Formular zurücksetzen" button when token is configured', async () => {
      render(<App />);
      
      // Simulate token-loaded response with a token
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            pluginMessage: {
              type: 'token-loaded',
              token: 'ghp_test_token'
            }
          }
        })
      );

      await waitFor(() => {
        expect(screen.getByText('Formular zurücksetzen')).toBeDefined();
      });
    });

    it('should clear all bug template fields when reset button is clicked', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Simulate token-loaded response with a token
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            pluginMessage: {
              type: 'token-loaded',
              token: 'ghp_test_token'
            }
          }
        })
      );

      await waitFor(() => {
        expect(screen.getByText('Formular zurücksetzen')).toBeDefined();
      });

      // Fill in bug form
      const titleInput = screen.getByLabelText(/Titel/i) as HTMLInputElement;
      const descriptionInput = screen.getByLabelText(/Beschreibung/i) as HTMLTextAreaElement;
      const reproStepsInput = screen.getByLabelText(/Reproduktionsschritte/i) as HTMLTextAreaElement;
      const expectedBehaviorInput = screen.getByLabelText(/Erwartetes Verhalten/i) as HTMLTextAreaElement;
      
      await user.type(titleInput, 'Test Bug');
      await user.type(descriptionInput, 'Bug description');
      await user.type(reproStepsInput, 'Step 1, Step 2');
      await user.type(expectedBehaviorInput, 'Expected behavior');

      // Verify fields are filled
      expect(titleInput.value).toBe('Test Bug');
      expect(descriptionInput.value).toBe('Bug description');
      expect(reproStepsInput.value).toBe('Step 1, Step 2');
      expect(expectedBehaviorInput.value).toBe('Expected behavior');

      // Click reset button
      const resetButton = screen.getByText('Formular zurücksetzen');
      await user.click(resetButton);

      // Verify all fields are cleared
      expect(titleInput.value).toBe('');
      expect(descriptionInput.value).toBe('');
      expect(reproStepsInput.value).toBe('');
      expect(expectedBehaviorInput.value).toBe('');
    });

    it('should clear all feature template fields when reset button is clicked', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Simulate token-loaded response with a token
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            pluginMessage: {
              type: 'token-loaded',
              token: 'ghp_test_token'
            }
          }
        })
      );

      await waitFor(() => {
        expect(screen.getByText('Formular zurücksetzen')).toBeDefined();
      });

      // Switch to feature template
      const featureRadio = screen.getByRole('radio', { name: /Feature Request/i });
      await user.click(featureRadio);

      await waitFor(() => {
        expect(screen.getByText('Feature Request')).toBeDefined();
      });

      // Fill in feature form
      const titleInput = screen.getByLabelText(/Titel/i) as HTMLInputElement;
      const descriptionInput = screen.getByLabelText(/Beschreibung/i) as HTMLTextAreaElement;
      const useCaseInput = screen.getByLabelText(/Use Case/i) as HTMLTextAreaElement;
      const expectedBenefitInput = screen.getByLabelText(/Erwarteter Nutzen/i) as HTMLTextAreaElement;
      
      await user.type(titleInput, 'Test Feature');
      await user.type(descriptionInput, 'Feature description');
      await user.type(useCaseInput, 'Use case description');
      await user.type(expectedBenefitInput, 'Expected benefit');

      // Verify fields are filled
      expect(titleInput.value).toBe('Test Feature');
      expect(descriptionInput.value).toBe('Feature description');
      expect(useCaseInput.value).toBe('Use case description');
      expect(expectedBenefitInput.value).toBe('Expected benefit');

      // Click reset button
      const resetButton = screen.getByText('Formular zurücksetzen');
      await user.click(resetButton);

      // Verify all fields are cleared
      expect(titleInput.value).toBe('');
      expect(descriptionInput.value).toBe('');
      expect(useCaseInput.value).toBe('');
      expect(expectedBenefitInput.value).toBe('');
    });

    it('should hide success message when reset button is clicked', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Simulate token-loaded response with a token
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            pluginMessage: {
              type: 'token-loaded',
              token: 'ghp_test_token'
            }
          }
        })
      );

      await waitFor(() => {
        expect(screen.getByText('Issue erstellen')).toBeDefined();
      });

      // Fill in title
      const titleInput = screen.getByLabelText(/Titel/i) as HTMLInputElement;
      await user.type(titleInput, 'Test Bug');

      const createButton = screen.getByText('Issue erstellen');
      
      // Click create button
      await user.click(createButton);

      // Simulate issue-created response
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            pluginMessage: {
              type: 'issue-created',
              issueUrl: 'https://github.com/db-ux-design-system/core/issues/123'
            }
          }
        })
      );

      // Verify success message is shown
      await waitFor(() => {
        expect(screen.getByText('Issue erfolgreich erstellt!')).toBeDefined();
      });

      // Click reset button
      const resetButton = screen.getByText('Formular zurücksetzen');
      await user.click(resetButton);

      // Verify success message is hidden
      expect(screen.queryByText('Issue erfolgreich erstellt!')).toBeNull();
      expect(screen.queryByText('https://github.com/db-ux-design-system/core/issues/123')).toBeNull();
    });

    it('should hide error message when reset button is clicked', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Simulate token-loaded response with a token
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            pluginMessage: {
              type: 'token-loaded',
              token: 'ghp_test_token'
            }
          }
        })
      );

      await waitFor(() => {
        expect(screen.getByText('Issue erstellen')).toBeDefined();
      });

      // Fill in title
      const titleInput = screen.getByLabelText(/Titel/i) as HTMLInputElement;
      await user.type(titleInput, 'Test Bug');

      const createButton = screen.getByText('Issue erstellen');
      
      // Click create button
      await user.click(createButton);

      // Simulate error response
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            pluginMessage: {
              type: 'error',
              message: 'Test error message'
            }
          }
        })
      );

      // Verify error message is shown
      await waitFor(() => {
        expect(screen.getByText('Test error message')).toBeDefined();
      });

      // Click reset button
      const resetButton = screen.getByText('Formular zurücksetzen');
      await user.click(resetButton);

      // Verify error message is hidden
      expect(screen.queryByText('Test error message')).toBeNull();
    });

    it('should be disabled during issue creation', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Simulate token-loaded response with a token
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            pluginMessage: {
              type: 'token-loaded',
              token: 'ghp_test_token'
            }
          }
        })
      );

      await waitFor(() => {
        expect(screen.getByText('Issue erstellen')).toBeDefined();
      });

      // Fill in title
      const titleInput = screen.getByLabelText(/Titel/i) as HTMLInputElement;
      await user.type(titleInput, 'Test Bug');

      const createButton = screen.getByText('Issue erstellen');
      
      // Click create button
      await user.click(createButton);

      // Verify reset button is disabled during loading
      await waitFor(() => {
        const resetButton = screen.getByText('Formular zurücksetzen') as HTMLButtonElement;
        expect(resetButton.disabled).toBe(true);
      });
    });

    it('should clear fields for both templates when switching between them', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Simulate token-loaded response with a token
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            pluginMessage: {
              type: 'token-loaded',
              token: 'ghp_test_token'
            }
          }
        })
      );

      await waitFor(() => {
        expect(screen.getByText('Formular zurücksetzen')).toBeDefined();
      });

      // Fill in bug form
      const bugTitleInput = screen.getByLabelText(/Titel/i) as HTMLInputElement;
      await user.type(bugTitleInput, 'Test Bug');

      // Switch to feature template
      const featureRadio = screen.getByRole('radio', { name: /Feature Request/i });
      await user.click(featureRadio);

      await waitFor(() => {
        expect(screen.getByText('Feature Request')).toBeDefined();
      });

      // Fill in feature form
      const featureTitleInput = screen.getByLabelText(/Titel/i) as HTMLInputElement;
      await user.type(featureTitleInput, 'Test Feature');

      // Click reset button
      const resetButton = screen.getByText('Formular zurücksetzen');
      await user.click(resetButton);

      // Verify feature fields are cleared
      expect(featureTitleInput.value).toBe('');

      // Switch back to bug template
      const bugRadio = screen.getByRole('radio', { name: /Bug Report/i });
      await user.click(bugRadio);

      await waitFor(() => {
        expect(screen.getByText('Bug Report')).toBeDefined();
      });

      // Verify bug fields are also cleared
      const bugTitleInputAfterSwitch = screen.getByLabelText(/Titel/i) as HTMLInputElement;
      expect(bugTitleInputAfterSwitch.value).toBe('');
    });
  });
});
