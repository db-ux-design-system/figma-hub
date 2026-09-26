import { CONFIG } from "./config";
import { isValidSVG, cleanFilename, processAndFlattenLayers } from "./utils/svgProcessor";
import { createFrameFromSVG, setupFrame } from "./utils/componentBuilder";
import {
  bindDesignVariables,
  describeBindingIssues,
} from "./utils/variablesBinder";
import { detectShellContext } from "./utils/shellDetector";
import { findCPBrandSlot } from "./utils/cpBrandFinder";

// Initialize plugin UI
figma.showUI(__html__, {
  width: CONFIG.ui.width,
  height: CONFIG.ui.height,
});

/** Severity of a feedback message, mirrors the DB UX Notification semantics. */
type FeedbackSemantic = "successful" | "warning" | "critical";

/** A message ready to be shown in the plugin UI. */
interface Feedback {
  semantic: FeedbackSemantic;
  message: string;
}

/** A built logo frame together with any design token problems. */
interface BuiltLogo {
  frame: FrameNode;
  warning: string | null;
}

/** What happened when importing into one Shell. */
interface ShellOutcome {
  status: "placed" | "blocked";
  /** Why the import was skipped (blocked only) */
  reason: string | null;
  /** Design tokens that could not be bound (placed only) */
  warning: string | null;
}

/** Reasons why a CP Brand cannot receive a logo. */
const REASONS = {
  noCPBrand:
    "The selected Shell has no CP Brand component, so the logo cannot be placed here. Deselect the Shell to import the logo onto the canvas.",
  short:
    "CP Brand is set to 'Short', which supports neither a custom logo nor a Logozusatz. Use a Shell or ControlPanel variant with CP Brand 'Logozusatz'.",
  custom:
    "CP Brand is set to '(Def) Custom', which has no logo slot. Switch it to 'Logozusatz' to import the logo.",
  noSlot:
    "This CP Brand variant has no logo slot. Switch it to 'Logozusatz' to import the logo.",
} as const;

/**
 * Sends exactly one feedback message to the UI and shows a canvas toast.
 *
 * The UI keeps the import button disabled until a feedback message arrives, so
 * every request has to be answered through this function. The semantic travels
 * as its own field instead of being derived from the message text.
 */
function respond(feedback: Feedback, toast?: string): void {
  figma.notify(toast ?? feedback.message.replace(/^(Success|Note|Error): /, ""));
  figma.ui.postMessage({
    feedback: feedback.message,
    semantic: feedback.semantic,
  });
}

/** Removes empty and duplicate entries, preserving order. */
function distinct(values: (string | null)[]): string[] {
  const result: string[] = [];

  for (const value of values) {
    if (value && result.indexOf(value) === -1) {
      result.push(value);
    }
  }

  return result;
}

/**
 * Builds the logo frame from raw SVG markup: flattens layers, wraps it in a
 * frame, scales it and binds the design system variables.
 *
 * Note: the frame is appended to the current page by createFrameFromSVG, so
 * callers that cannot use it must remove it again.
 */
async function buildLogoFrame(
  svgText: string,
  filename: string,
  options: { center: boolean }
): Promise<BuiltLogo> {
  const svgNode = figma.createNodeFromSvg(svgText);

  processAndFlattenLayers(svgNode as FrameNode);

  const frame = createFrameFromSVG(svgNode, cleanFilename(filename));
  setupFrame(frame, svgNode, { center: options.center });

  const issues = await bindDesignVariables(frame);

  return { frame, warning: describeBindingIssues(issues) };
}

/**
 * Removes a frame that could not be used, tolerating an already detached node.
 */
function discardFrame(frame: FrameNode | null): void {
  if (!frame || frame.removed) return;

  try {
    frame.remove();
  } catch (error) {
    console.error("Could not discard the unused logo frame:", error);
  }
}

/**
 * Places a logo into the "📦 Logo" slot of one Shell's CP Brand.
 *
 * Only the Logozusatz variant provides that slot. Every other variant is
 * reported as blocked rather than redirected to the canvas, because selecting a
 * Shell expresses the intent to place the logo inside it.
 */
async function placeLogoInShell(
  svgText: string,
  filename: string,
  shell: InstanceNode
): Promise<ShellOutcome> {
  const brand = await findCPBrandSlot(shell);

  if (!brand.cpBrandNode) {
    return { status: "blocked", reason: REASONS.noCPBrand, warning: null };
  }

  if (brand.variant === "short") {
    return { status: "blocked", reason: REASONS.short, warning: null };
  }

  if (!brand.logoSlot) {
    return {
      status: "blocked",
      reason: brand.variant === "custom" ? REASONS.custom : REASONS.noSlot,
      warning: null,
    };
  }

  // Building the frame has to stay inside the try: createNodeFromSvg throws on
  // markup that passes the "<svg" check but is not actually valid SVG.
  let built: BuiltLogo | null = null;

  try {
    built = await buildLogoFrame(svgText, filename, { center: false });

    const slot = brand.logoSlot as ChildrenMixin & SceneNode;

    // Clear the slot before inserting the new logo
    for (const child of [...slot.children]) {
      child.remove();
    }

    slot.appendChild(built.frame);

    return { status: "placed", reason: null, warning: built.warning };
  } catch (error) {
    // Never leave the built frame behind on the canvas
    discardFrame(built ? built.frame : null);

    const message = error instanceof Error ? error.message : String(error);
    console.error("Shell import error:", error);

    return {
      status: "blocked",
      reason: `Could not place the logo in CP Brand: ${message}`,
      warning: null,
    };
  }
}

/**
 * Condenses the per-Shell outcomes into a single message.
 *
 * Partial success is reported as a warning listing what was skipped, so a
 * failure in one Shell is never hidden behind a success for the others.
 */
function summarizeShellOutcomes(
  outcomes: ShellOutcome[],
  ignoredCount: number
): Feedback {
  const placed = outcomes.filter((outcome) => outcome.status === "placed");
  const blocked = outcomes.filter((outcome) => outcome.status === "blocked");
  const reasons = distinct(blocked.map((outcome) => outcome.reason));
  const warnings = distinct(placed.map((outcome) => outcome.warning)).map(
    (warning) => `However, ${warning}`
  );

  const notes: string[] = [];
  if (ignoredCount > 0) {
    notes.push(
      ignoredCount === 1
        ? "1 selected item is not part of a Shell and was ignored."
        : `${ignoredCount} selected items are not part of a Shell and were ignored.`
    );
  }

  // Nothing could be placed
  if (placed.length === 0) {
    const head =
      outcomes.length === 1
        ? ""
        : `Logo could not be placed in any of the ${outcomes.length} selected Shells. `;

    return {
      semantic: "warning",
      message: `Note: ${head}${[...reasons, ...notes].join(" ")}`,
    };
  }

  // Everything could be placed
  if (blocked.length === 0) {
    const head =
      outcomes.length === 1
        ? "Logo replaced in CP Brand."
        : `Logo replaced in ${outcomes.length} CP Brand components.`;

    if (warnings.length === 0 && notes.length === 0) {
      return { semantic: "successful", message: `Success: ${head}` };
    }

    return {
      semantic: "warning",
      message: `Note: ${head} ${[...warnings, ...notes].join(" ")}`,
    };
  }

  // Some placed, some skipped
  return {
    semantic: "warning",
    message: `Note: Logo replaced in ${placed.length} of ${outcomes.length} Shells. ${[
      ...reasons,
      ...warnings,
      ...notes,
    ].join(" ")}`,
  };
}

/**
 * Imports the logo onto the canvas, used when no Shell is selected.
 */
async function importToCanvas(
  svgText: string,
  filename: string
): Promise<Feedback> {
  const built = await buildLogoFrame(svgText, filename, { center: true });

  if (built.warning) {
    return {
      semantic: "warning",
      message: `Note: Logo imported, but ${built.warning}`,
    };
  }

  return { semantic: "successful", message: "Success: Logo imported." };
}

/**
 * Handles the complete SVG import workflow.
 *
 * Every Shell in the selection is served. Without a Shell selected the logo is
 * created on the canvas instead.
 *
 * @param svgText - Raw SVG markup as string
 * @param filename - Original filename of the SVG
 */
async function handleSVGImport(
  svgText: string,
  filename: string
): Promise<void> {
  if (!isValidSVG(svgText)) {
    respond({
      semantic: "critical",
      message: "Error: The selected file does not appear to be a valid SVG.",
    });
    return;
  }

  const { shells, ignoredCount } = await detectShellContext();

  if (shells.length === 0) {
    respond(await importToCanvas(svgText, filename), "Frame created in viewport center");
    return;
  }

  const outcomes: ShellOutcome[] = [];

  for (const shell of shells) {
    outcomes.push(await placeLogoInShell(svgText, filename, shell));
  }

  respond(summarizeShellOutcomes(outcomes, ignoredCount));
}

/**
 * Message handler for UI communication.
 *
 * The catch is a safety net: the UI stays in its loading state until it
 * receives feedback, so an escaping error must never go unanswered.
 */
figma.ui.onmessage = async (msg) => {
  if (msg.type !== "import-svg") return;

  const { svg: svgText, filename } = msg;

  try {
    await handleSVGImport(svgText, filename);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("SVG import error:", error);

    respond(
      { semantic: "critical", message: `Error: ${message}` },
      "Error: SVG import failed."
    );
  }
};
