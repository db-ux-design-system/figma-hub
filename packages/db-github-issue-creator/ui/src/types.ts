// Type definitions for plugin-UI communication
// These should match the types in plugin/types.ts

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

export interface ClosePluginMessage {
  type: "close-plugin";
}

export type PluginMessage =
  | SaveTokenMessage
  | LoadTokenMessage
  | CreateIssueMessage
  | ClosePluginMessage;

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
