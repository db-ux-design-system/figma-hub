import { useState, useEffect } from "react";
import {
  DBButton,
  DBCard,
  DBCustomSelect,
  DBInfotext,
  DBInput,
  DBNotification,
  DBSelect,
  DBTextarea,
  DBLink,
} from "@db-ux/react-core-components";
import type { PluginResponse, CreateIssueMessage } from "./types";

type WizardStep =
  | "welcome"
  | "welcome-no-token"
  | "form"
  | "confirmation"
  | "token-config"
  | "settings";

function App() {
  // Wizard State
  const [currentStep, setCurrentStep] = useState<WizardStep>("welcome");

  // Token Configuration State
  const [token, setToken] = useState<string>("");
  const [isLoadingToken, setIsLoadingToken] = useState<boolean>(true);
  const [tempToken, setTempToken] = useState<string>(""); // For settings editing

  // Template Selection State
  const [selectedTemplate, setSelectedTemplate] = useState<
    "bug" | "feature" | null
  >(null);

  // Step 2: Business Unit and Project
  const [businessUnit, setBusinessUnit] = useState<string>("");
  const [customerOrArea, setCustomerOrArea] = useState<string>("");
  const [project, setProject] = useState<string>("");

  // Bug Template Fields State
  const [bugTitle, setBugTitle] = useState<string>("");
  const [bugLibraryVariants, setBugLibraryVariants] = useState<string[]>([]);
  const [bugVersion, setBugVersion] = useState<string>("");
  const [reproSteps, setReproSteps] = useState<string>("");
  const [expectedBehavior, setExpectedBehavior] = useState<string>("");

  // Feature Template Fields State
  const [featureTitle, setFeatureTitle] = useState<string>("");
  const [featureDescription, setFeatureDescription] = useState<string>("");

  // UI State for Issue Creation
  const [isCreatingIssue, setIsCreatingIssue] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [issueUrl, setIssueUrl] = useState<string | null>(null);

  // Validation state for individual fields
  const [titleError, setTitleError] = useState<string>("");
  const [versionError, setVersionError] = useState<string>("");
  const [reproStepsError, setReproStepsError] = useState<string>("");
  const [expectedBehaviorError, setExpectedBehaviorError] =
    useState<string>("");
  const [descriptionError, setDescriptionError] = useState<string>("");

  // Load token when component mounts
  useEffect(() => {
    parent.postMessage({ pluginMessage: { type: "load-token" } }, "*");
  }, []);

  // Listen for messages from plugin code
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data.pluginMessage as PluginResponse;

      if (!message) return;

      switch (message.type) {
        case "token-loaded": {
          setIsLoadingToken(false);
          if (message.token) {
            setToken(message.token);
            setCurrentStep("welcome");
          } else {
            setCurrentStep("welcome-no-token");
          }
          break;
        }
        case "issue-created": {
          setIsCreatingIssue(false);
          setIssueUrl(message.issueUrl);
          setErrorMessage(null);

          // Navigate to confirmation step
          setCurrentStep("confirmation");
          break;
        }
        case "error": {
          setIsCreatingIssue(false);
          setErrorMessage(message.message);
          console.error("Plugin error:", message.message);
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Handle token save
  const handleSaveToken = () => {
    if (token.trim().length === 0) {
      alert("Please enter a token");
      return;
    }

    parent.postMessage({ pluginMessage: { type: "save-token", token } }, "*");

    setCurrentStep("welcome");
  };

  // Validate and create issue
  const handleCreateIssue = () => {
    setErrorMessage(null);
    setIssueUrl(null);

    // Reset all field errors
    setTitleError("");
    setVersionError("");
    setReproStepsError("");
    setExpectedBehaviorError("");
    setDescriptionError("");

    const currentTitle = selectedTemplate === "bug" ? bugTitle : featureTitle;
    let hasError = false;

    // Validation
    if (!currentTitle || currentTitle.trim().length === 0) {
      setTitleError("Title is required");
      hasError = true;
    }

    if (selectedTemplate === "bug") {
      if (!bugVersion || bugVersion.trim().length === 0) {
        setVersionError("Version is required");
        hasError = true;
      }

      if (!reproSteps || reproSteps.trim().length === 0) {
        setReproStepsError("Reproduction case is required");
        hasError = true;
      }

      if (!expectedBehavior || expectedBehavior.trim().length === 0) {
        setExpectedBehaviorError("Expected behavior is required");
        hasError = true;
      }
    } else {
      // Feature validation
      if (!featureDescription || featureDescription.trim().length === 0) {
        setDescriptionError("Description is required");
        hasError = true;
      }
    }

    if (hasError) {
      return;
    }

    if (!token || token.trim().length === 0) {
      setErrorMessage("Please configure your GitHub token first");
      return;
    }

    setIsCreatingIssue(true);

    // Build issue description
    let fullDescription = "";

    if (selectedTemplate === "bug") {
      // Build bug description with library variants
      const libraryLabels: Record<string, string> = {
        "core-foundation": "Core Foundation",
        "core-components": "Core Components",
        "core-lab": "🧪 Core Lab",
        "db-theme-icons": "DB Theme Icons",
        documentation: "Documentation",
      };

      const selectedLibraries = bugLibraryVariants
        .map((key) => libraryLabels[key])
        .join(", ");

      fullDescription += `**Library Variant:** ${selectedLibraries}\n`;
      fullDescription += `**Version:** ${bugVersion}\n\n`;
      fullDescription += `**Reproduction Case:**\n${reproSteps}\n\n`;
      fullDescription += `**Expected Behavior:**\n${expectedBehavior}\n\n`;
    } else {
      fullDescription += featureDescription + "\n\n";
    }

    // Add business unit and project info at the end
    if (businessUnit && businessUnit !== "None") {
      fullDescription += `#### Business Unit\n${businessUnit}\n\n`;
    }

    if (customerOrArea) {
      const label =
        businessUnit === "DB Systel GmbH" ? "Customer" : "Area/Business Unit";
      fullDescription += `#### ${label}\n${customerOrArea}\n\n`;
    }

    if (project) {
      fullDescription += `#### Project\n${project}\n\n`;
    }

    const messageData: CreateIssueMessage = {
      type: "create-issue",
      token,
      template: selectedTemplate!,
      title: currentTitle,
      description: fullDescription,
    };

    parent.postMessage({ pluginMessage: messageData }, "*");
  };

  // Reset form and go back to welcome
  const handleResetAll = () => {
    setCurrentStep("welcome");
    setSelectedTemplate(null);
    setBusinessUnit("");
    setCustomerOrArea("");
    setProject("");
    setBugTitle("");
    setBugLibraryVariants([]);
    setBugVersion("");
    setReproSteps("");
    setExpectedBehavior("");
    setFeatureTitle("");
    setFeatureDescription("");
    setErrorMessage(null);
    setIssueUrl(null);

    // Reset validation errors
    setTitleError("");
    setVersionError("");
    setReproStepsError("");
    setExpectedBehaviorError("");
    setDescriptionError("");
  };

  // Handle create another issue
  const handleCreateAnother = () => {
    handleResetAll();
  };

  if (isLoadingToken) {
    return (
      <div className="flex items-center justify-center p-fix-md h-screen">
        <p>Loading token...</p>
      </div>
    );
  }

  // Token Configuration Screen
  if (currentStep === "token-config") {
    return (
      <div className="flex flex-col p-fix-lg gap-fix-xs h-screen">
        <div className="flex items-center justify-between mb-fix-md">
          <h1 className="text-2xl my-0">Configure GitHub Token</h1>
          <DBButton
            icon="cross"
            variant="ghost"
            noText
            onClick={() => setCurrentStep("welcome-no-token")}
          >
            Close
          </DBButton>
        </div>

        <div className="flex flex-col gap-fix-md flex-1 overflow-y-auto -mx-fix-lg px-fix-lg">
          <DBNotification
            data-density="functional"
            variant="standalone"
            semantic="informational"
            icon="information_circle"
            headline="How to create a GitHub token"
          >
            <ol className="list-decimal list-inside text-sm space-y-1">
              <li>
                Go to{" "}
                <a
                  href="https://github.com/settings/tokens/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-blue-600 hover:text-blue-800"
                >
                  GitHub Token Settings
                </a>
              </li>
              <li>Give your token a descriptive name (e.g., "Figma Plugin")</li>
              <li>
                Select the{" "}
                <code className="px-1 rounded bg-gray-100">repo</code> scope
              </li>
              <li>Click "Generate token" and copy the token</li>
              <li>Paste the token in the field below</li>
            </ol>
          </DBNotification>

          <div>
            <DBInput
              id="token-input"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              label="GitHub Personal Access Token"
              message="Your token will be securely stored in Figma."
            ></DBInput>
          </div>
        </div>

        <DBButton onClick={handleSaveToken} variant="brand" width="full">
          Save Token
        </DBButton>
      </div>
    );
  }

  // Welcome Screen without Token - Shows external links
  if (currentStep === "welcome-no-token") {
    return (
      <div className="flex flex-col p-fix-lg gap-fix-xs h-screen">
        <h1 className="text-2xl my-0 mb-fix-lg">DB GitHub Issue Creator</h1>

        <div className="flex flex-col gap-fix-md flex-1 overflow-y-auto -mx-fix-lg px-fix-lg">
          <div className="mb-fix-md">
            <p>
              Thanks for taking the time to contribute to the DB UX Design
              System!
            </p>
            <p className="mt-fix-sm">
              Configure your GitHub token to create issues directly from Figma,
              or use the links below to create issues on GitHub.
            </p>
          </div>

          {/* Template Cards as External Links */}
          <div className="flex flex-col gap-fix-md">
            <div className="flex gap-fix-sm">
              <div className="w-1/2">
                <DBCard
                  elevationLevel="2"
                  spacing="large"
                  behavior="interactive"
                  onClick={() =>
                    window.open(
                      "https://github.com/db-ux-design-system/core/issues/new?template=02--feature-request-v3.yaml",
                      "_blank",
                    )
                  }
                >
                  <div className="flex-1">
                    <h4 className="block m-0">✨ Feature Request</h4>
                    <span className="block mt-fix-xs text-sm">
                      Suggest new features
                    </span>
                  </div>
                </DBCard>
              </div>

              <div className="w-1/2">
                <DBCard
                  elevationLevel="2"
                  spacing="large"
                  behavior="interactive"
                  onClick={() =>
                    window.open(
                      "https://github.com/db-ux-design-system/core/issues/new?template=01--bug-report-v3.yaml",
                      "_blank",
                    )
                  }
                >
                  <div className="flex-1">
                    <h4 className="block m-0">🪲 Bug Report</h4>
                    <span className="block mt-fix-xs text-sm">
                      Report bugs or issues
                    </span>
                  </div>
                </DBCard>
              </div>
            </div>
          </div>
          <DBNotification
            data-density="functional"
            variant="standalone"
            semantic="informational"
            headline="Please use anonymous sample material"
            icon="exclamation_mark_circle"
          >
            <ul className="flex flex-col gap-fix-3xs list-disc list-inside text-sm">
              <li>
                Do not share any personal data (e.g., names, email addresses, …)
              </li>
              <li>Do not share any confidential company information</li>
              <li>Do not share internal URLs</li>
            </ul>
          </DBNotification>
        </div>

        <DBButton
          onClick={() => setCurrentStep("token-config")}
          variant="brand"
          width="full"
          className="mt-fix-md"
        >
          Configure Token
        </DBButton>
      </div>
    );
  }

  // Step 1: Welcome Screen (combined with template selection and business info)
  if (currentStep === "welcome") {
    return (
      <div className="flex flex-col p-fix-lg gap-fix-xs h-screen">
        <div className="flex items-center justify-between mb-0">
          <h1 className="text-2xl my-0">DB GitHub Issue Creator</h1>
          <DBButton
            icon="gear_wheel"
            variant="ghost"
            noText
            onClick={() => {
              setTempToken(token);
              setCurrentStep("settings");
            }}
          >
            Settings
          </DBButton>
        </div>

        <div className="mb-0">
          <p>
            Thanks for taking the time to contribute to the DB UX Design System!
          </p>
        </div>

        <div className="flex flex-col gap-fix-md flex-1 overflow-y-auto -mx-fix-lg px-fix-lg ">
          {/* Template Selection */}
          <div className="flex flex-col gap-fix-md">
            <div className="flex gap-fix-sm">
              <div className="w-1/2">
                <DBCard
                  elevationLevel="2"
                  spacing="large"
                  behavior="interactive"
                  onClick={() => {
                    setSelectedTemplate("feature");
                    setCurrentStep("form");
                  }}
                >
                  <div className="flex-1">
                    <h4 className="block m-0">✨ Feature Request</h4>
                    <span className="block mt-fix-xs text-sm">
                      Suggest new features
                    </span>
                  </div>
                </DBCard>
              </div>

              <div className="w-1/2">
                <DBCard
                  elevationLevel="2"
                  spacing="large"
                  behavior="interactive"
                  onClick={() => {
                    setSelectedTemplate("bug");
                    setCurrentStep("form");
                  }}
                >
                  <div className="flex-1">
                    <h4 className="block m-0">🪲 Bug Report</h4>
                    <span className="block mt-fix-xs text-sm">
                      Report bugs or issues
                    </span>
                  </div>
                </DBCard>
              </div>
            </div>
          </div>
          <div>
            <div className="flex gap-fix-md">
              {/* Business Unit Selection */}
              <div className="w-1/2">
                <p className="text-xs mb-fix-xs">
                  Which DB business unit do you work for?
                </p>
                <DBSelect
                  showLabel={false}
                  label="Which DB business unit do you work for?"
                  id="business-unit"
                  value={businessUnit}
                  onChange={(e) => {
                    setBusinessUnit(e.target.value);
                    setCustomerOrArea("");
                  }}
                  options={[
                    { value: "None" },
                    { value: "DB Systel GmbH" },
                    { value: "DB Fernverkehr AG" },
                    { value: "DB InfraGO AG" },
                    { value: "DB Regio AG" },
                    { value: "DB Cargo AG" },
                    { value: "DB Konzern" },
                    { value: "DB Vertrieb GmbH" },
                    { value: "DB Energie" },
                    { value: "other" },
                  ]}
                ></DBSelect>
              </div>

              {/* Project Input */}
              <div className="w-1/2">
                <p className="text-xs mb-fix-xs">
                  What project are you working on?
                </p>
                <DBInput
                  id="project"
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  placeholder="e.g. Navigator"
                  label="What project are you working on?"
                  showLabel={false}
                ></DBInput>
              </div>
            </div>
            <div className="flex gap-fix-md">
              {/* Customer or Area Input */}
              {(businessUnit === "DB Systel GmbH" ||
                businessUnit === "other") && (
                <div className="w-1/2">
                  <p className="text-xs mb-fix-xs">
                    {businessUnit === "DB Systel GmbH"
                      ? "Please enter your customer"
                      : "Please enter your area/business unit"}
                  </p>
                  <DBInput
                    id="customer-area"
                    showLabel={false}
                    value={customerOrArea}
                    onChange={(e) => setCustomerOrArea(e.target.value)}
                    placeholder={
                      businessUnit === "DB Systel GmbH"
                        ? "e.g. DB Fernverkehr"
                        : "e.g. Marketing"
                    }
                    label={
                      businessUnit === "DB Systel GmbH"
                        ? "Please enter your customer"
                        : "Please enter your area/business unit"
                    }
                  ></DBInput>
                </div>
              )}
              <div className="w-1/2"></div>
            </div>
          </div>

          <DBNotification
            data-density="functional"
            variant="standalone"
            semantic="informational"
            headline="Please use anonymous sample material"
            icon="exclamation_mark_circle"
            className="mt-fix-3xl"
          >
            <ul className="flex flex-col gap-fix-3xs list-disc list-inside text-sm">
              <li>
                Do not share any personal data (e.g., names, email addresses, …)
              </li>
              <li>Do not share any confidential company information</li>
              <li>Do not share internal URLs</li>
            </ul>
          </DBNotification>
        </div>
      </div>
    );
  }

  // Settings Screen
  if (currentStep === "settings") {
    return (
      <div className="flex flex-col p-fix-lg gap-fix-xs h-screen">
        <div className="flex items-center justify-between mb-fix-md">
          <h1 className="text-2xl my-0">Settings</h1>
          <DBButton
            icon="cross"
            variant="ghost"
            noText
            onClick={() => {
              setTempToken(token); // Reset to original
              setCurrentStep("welcome");
            }}
          >
            Close
          </DBButton>
        </div>

        <div className="flex flex-col gap-fix-md flex-1 overflow-y-auto -mx-fix-lg px-fix-lg">
          <div className="mb-fix-lg">
            <DBInput
              id="settings-token-input"
              type="password"
              value={tempToken}
              onChange={(e) => setTempToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              label="GitHub Personal Access Token"
              message="Your token will be securely stored in Figma."
            ></DBInput>
          </div>

          <DBNotification
            data-density="functional"
            variant="standalone"
            semantic="informational"
            icon="information_circle"
            headline="How to create a GitHub token"
          >
            <ol className="list-decimal list-inside text-sm space-y-1">
              <li>
                Go to{" "}
                <a
                  href="https://github.com/settings/tokens/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-blue-600 hover:text-blue-800"
                >
                  GitHub Token Settings
                </a>
              </li>
              <li>Give your token a descriptive name (e.g., "Figma Plugin")</li>
              <li>
                Select the{" "}
                <code className="px-1 rounded bg-gray-100">repo</code> scope
              </li>
              <li>Click "Generate token" and copy the token</li>
              <li>Paste the token in the field above</li>
            </ol>
          </DBNotification>
        </div>

        <div className="flex gap-fix-sm">
          <DBButton
            className="grow"
            onClick={() => {
              if (
                confirm(
                  "Are you sure you want to delete your GitHub token? You will need to configure it again to create issues.",
                )
              ) {
                setToken("");
                setTempToken("");
                parent.postMessage(
                  { pluginMessage: { type: "save-token", token: "" } },
                  "*",
                );
                setCurrentStep("welcome-no-token");
              }
            }}
            variant="ghost"
            width="full"
          >
            Delete Token
          </DBButton>
          <DBButton
            className="grow order-2"
            onClick={() => {
              if (tempToken.trim().length === 0) {
                alert("Please enter a token");
                return;
              }
              setToken(tempToken);
              parent.postMessage(
                { pluginMessage: { type: "save-token", token: tempToken } },
                "*",
              );
              setCurrentStep("welcome");
            }}
            variant="brand"
            width="full"
          >
            Save
          </DBButton>
        </div>
      </div>
    );
  }

  // Step 4: Confirmation Screen
  if (currentStep === "confirmation") {
    return (
      <div className="flex flex-col p-fix-lg gap-fix-md h-screen">
        <h1 className="text-2xl">✅ Issue Created</h1>

        <div className="flex flex-col gap-fix-md flex-1">
          <p className="mb-0">
            Thanks for taking the time to contribute to the DB UX Design System!
          </p>
          <DBLink
            className="mb-fix-lg"
            href={issueUrl || "#"}
            variant="brand"
            content="external"
            target="_blank"
            rel="noopener noreferrer"
          >
            Your issue
          </DBLink>
          <DBNotification
            data-density="functional"
            variant="standalone"
            semantic="informational"
            icon="information_circle"
            headline="Don't forget to add screenshots"
          >
            If you have screenshots or Figma frames that help illustrate your
            issue, please add them directly to the GitHub issue by
            drag-and-drop.
          </DBNotification>
        </div>

        <div className="flex gap-fix-sm mt-fix-md">
          <DBButton
            className="grow"
            onClick={() =>
              parent.postMessage(
                { pluginMessage: { type: "close-plugin" } },
                "*",
              )
            }
            variant="ghost"
            width="full"
          >
            Close
          </DBButton>
          <DBButton
            className="grow order-2"
            onClick={handleCreateAnother}
            variant="brand"
            width="full"
          >
            Create New Issue
          </DBButton>
        </div>
      </div>
    );
  }

  // Step 2: Form
  return (
    <div className="flex flex-col p-fix-lg gap-fix-md h-screen">
      <div className="flex gap-fix-md items-center">
        <DBButton
          onClick={() => {
            setCurrentStep("welcome");
            // Reset all validation errors
            setTitleError("");
            setVersionError("");
            setReproStepsError("");
            setExpectedBehaviorError("");
            setDescriptionError("");
          }}
          disabled={isCreatingIssue}
          variant="ghost"
          width="auto"
          iconLeading={"arrow_left"}
          noText={true}
        >
          Back
        </DBButton>
        <h1 className="text-2xl my-0">
          {selectedTemplate === "bug" ? "🪲 Bug Report" : "✨ Feature Request"}
        </h1>
      </div>
      <div className="flex flex-col gap-fix-2xs flex-1 overflow-y-auto -mx-fix-lg px-fix-lg">
        {selectedTemplate === "bug" ? (
          // Bug Form
          <>
            <DBInfotext semantic="informational">
              Verify your version before troubleshooting. If you are not on the
              latest release, please update and check if the error persists.
            </DBInfotext>
            <div>
              <p className="text-sm mb-fix-xs">
                Title <span className="text-red-600">*</span>
              </p>
              <DBInput
                id="bug-title"
                value={bugTitle}
                onChange={(e) => {
                  setBugTitle(e.target.value);
                  if (titleError) setTitleError("");
                }}
                placeholder="Brief description of the bug"
                label="Title"
                showLabel={false}
                validation={titleError ? "invalid" : undefined}
                invalidMessage="Field can not be empty"
                message={titleError}
              ></DBInput>
            </div>
            <div className="flex gap-fix-md">
              <div className="w-1/2">
                <p className="text-sm mb-fix-xs">Design system content</p>
                <DBCustomSelect
                  options={[
                    { value: "Core Foundation", id: "core-foundation" },
                    { value: "Core Components", id: "core-components" },
                    { value: "🧪 Core Lab", id: "core-lab" },
                    { value: "DB Theme Icons", id: "db-theme-icons" },
                    { value: "Documentation", id: "documentation" },
                  ]}
                  placeholder="Select design system content"
                  multiple
                  id="library-variants"
                  label="Design system content"
                  showLabel={false}
                  values={bugLibraryVariants}
                ></DBCustomSelect>
              </div>

              <div className="w-1/2">
                <p className="text-sm mb-fix-xs">
                  Version <span className="text-red-600">*</span>
                </p>
                <DBInput
                  id="bug-version"
                  value={bugVersion}
                  onChange={(e) => {
                    setBugVersion(e.target.value);
                    if (versionError) setVersionError("");
                  }}
                  placeholder="e.g. v4.2.6"
                  label="Version"
                  showLabel={false}
                  validation={versionError ? "invalid" : undefined}
                  invalidMessage="Field can not be empty"
                  message={versionError}
                ></DBInput>
              </div>
            </div>
            <div>
              <p className="text-sm mb-fix-xs">
                Reproduction Case *
                <span className="block text-3xs db-on-bg-color-emphasis-80"></span>
              </p>
              <DBTextarea
                id="repro-steps"
                value={reproSteps}
                onChange={(e) => {
                  setReproSteps(e.target.value);
                  if (reproStepsError) setReproStepsError("");
                }}
                placeholder="How can we reproduce the error? ⚠️ Please also mention the density if you are not working with regular."
                rows={3}
                label="Reproduction Case"
                showLabel={false}
                validation={reproStepsError ? "invalid" : undefined}
                invalidMessage="Field can not be empty"
                message={reproStepsError}
              ></DBTextarea>
            </div>

            <div>
              <p className="text-sm mb-fix-xs">
                Expected Behavior <span className="text-red-600">*</span>
              </p>
              <DBTextarea
                id="expected-behavior"
                value={expectedBehavior}
                onChange={(e) => {
                  setExpectedBehavior(e.target.value);
                  if (expectedBehaviorError) setExpectedBehaviorError("");
                }}
                placeholder="What did you expect to see?"
                rows={3}
                label="Expected Behavior"
                showLabel={false}
                validation={expectedBehaviorError ? "invalid" : undefined}
                invalidMessage="Field can not be empty"
                message={expectedBehaviorError}
              ></DBTextarea>
            </div>
          </>
        ) : (
          // Feature Form
          <>
            <DBInfotext semantic="informational">
              <span>
                Before submitting a new feature request, please search the{" "}
                <a
                  href="https://github.com/db-ux-design-system/core/issues"
                  target="_blank"
                  className="underline"
                >
                  existing issues
                </a>{" "}
                to see if the topic has already been raised.
              </span>
            </DBInfotext>
            <div>
              <p className="text-sm mb-fix-xs">
                Title <span className="text-red-600">*</span>
              </p>
              <DBInput
                id="feature-title"
                value={featureTitle}
                onChange={(e) => {
                  setFeatureTitle(e.target.value);
                  if (titleError) setTitleError("");
                }}
                placeholder="Brief description of the feature"
                label="Title"
                showLabel={false}
                validation={titleError ? "invalid" : undefined}
                invalidMessage="Field can not be empty"
                message={titleError}
              ></DBInput>
            </div>

            <div>
              <p className="text-sm mb-fix-xs">
                Description <span className="text-red-600">*</span>
              </p>
              <DBTextarea
                id="feature-description"
                value={featureDescription}
                onChange={(e) => {
                  setFeatureDescription(e.target.value);
                  if (descriptionError) setDescriptionError("");
                }}
                placeholder="Detailed description of the desired feature"
                rows={4}
                label="Description"
                showLabel={false}
                validation={descriptionError ? "invalid" : undefined}
                invalidMessage="Field can not be empty"
                message={descriptionError}
              ></DBTextarea>
            </div>
          </>
        )}

        {/* Error Message */}
        {errorMessage && (
          <DBNotification
            data-density="functional"
            variant="standalone"
            semantic="critical"
            headline="Error"
          >
            {errorMessage}
          </DBNotification>
        )}
      </div>

      <div className="flex gap-fix-sm mt-fix-md">
        <DBButton
          className="grow order-2"
          onClick={handleCreateIssue}
          disabled={isCreatingIssue}
          variant="brand"
          width="full"
        >
          {isCreatingIssue ? "Creating..." : "Create"}
        </DBButton>
      </div>
    </div>
  );
}

export default App;
