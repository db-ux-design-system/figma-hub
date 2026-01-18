// Type definitions for plugin-UI communication

// Messages from UI to Plugin
export interface SaveTokenMessage {
  type: "save-token";
  token: string;
}

export interface LoadTokenMessage {
  type: "load-token";
}

export interface CreateIssueMessage {
  type: "create-issue";
  token: string;
  template: "bug" | "feature";
  title: string;
  description: string;
}

export type PluginMessage =
  | SaveTokenMessage
  | LoadTokenMessage
  | CreateIssueMessage;

// Messages from Plugin to UI
export interface TokenLoadedResponse {
  type: "token-loaded";
  token: string | null;
}

export interface IssueCreatedResponse {
  type: "issue-created";
  issueUrl: string;
}

export interface ErrorResponse {
  type: "error";
  message: string;
}

export type PluginResponse =
  | TokenLoadedResponse
  | IssueCreatedResponse
  | ErrorResponse;

// GitHub API types
export interface GitHubIssueRequest {
  title: string;
  body: string;
  labels: string[];
}

export interface GitHubIssueResponse {
  id: number;
  number: number;
  html_url: string;
  title: string;
}
