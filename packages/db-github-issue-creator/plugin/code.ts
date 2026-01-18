// GitHub Issue Creator Plugin Code
// This code runs in the Figma plugin sandbox

import { handleMessage } from "./utils/message-handler";

// Show the plugin UI
figma.showUI(__html__, { width: 600, height: 700 });

// Handle messages from the UI
figma.ui.onmessage = handleMessage;
