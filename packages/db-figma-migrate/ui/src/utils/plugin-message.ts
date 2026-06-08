import type { PluginMessageToUI } from "../types";

type MsgOfType<T extends PluginMessageToUI["type"]> = Extract<
  PluginMessageToUI,
  { type: T }
>;

export const isInitData = (m: PluginMessageToUI): m is MsgOfType<"init_data"> =>
  m.type === "init_data";

export const isAnalysisProgress = (
  m: PluginMessageToUI,
): m is MsgOfType<"analysis_progress"> => m.type === "analysis_progress";

export const isAnalysisComplete = (
  m: PluginMessageToUI,
): m is MsgOfType<"analysis_complete"> => m.type === "analysis_complete";

export const isMigrationProgress = (
  m: PluginMessageToUI,
): m is MsgOfType<"migration_progress"> => m.type === "migration_progress";

export const isMigrationNodeComplete = (
  m: PluginMessageToUI,
): m is MsgOfType<"migration_node_complete"> =>
  m.type === "migration_node_complete";

export const isMigrationNodeError = (
  m: PluginMessageToUI,
): m is MsgOfType<"migration_node_error"> => m.type === "migration_node_error";

export const isMigrationComplete = (
  m: PluginMessageToUI,
): m is MsgOfType<"migration_complete"> => m.type === "migration_complete";

export const isDecisionRequired = (
  m: PluginMessageToUI,
): m is MsgOfType<"decision_required"> => m.type === "decision_required";

export const isPreviewResult = (
  m: PluginMessageToUI,
): m is MsgOfType<"preview_result"> => m.type === "preview_result";

export const isError = (m: PluginMessageToUI): m is MsgOfType<"error"> =>
  m.type === "error";

export const isBranchStatus = (
  m: PluginMessageToUI,
): m is MsgOfType<"branch_status"> => m.type === "branch_status";
