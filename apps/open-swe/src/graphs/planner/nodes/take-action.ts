import { v4 as uuidv4 } from "uuid";
import {
  isAIMessage,
  isToolMessage,
  ToolMessage,
} from "@langchain/core/messages";
import {
  isLocalMode,
  getLocalWorkingDirectory,
} from "@open-swe/shared/open-swe/local-mode";
import {
  createGetURLContentTool,
  createShellTool,
  createSearchDocumentForTool,
} from "../../../tools/index.js";
import { GraphConfig } from "@open-swe/shared/open-swe/types";
import {
  PlannerGraphState,
  PlannerGraphUpdate,
} from "@open-swe/shared/open-swe/planner/types";
import { createLogger, LogLevel } from "../../../utils/logger.js";
import {
  safeSchemaToString,
  safeBadArgsError,
} from "../../../utils/zod-to-string.js";

import { createGrepTool } from "../../../tools/grep.js";
import {
  getChangedFilesStatus,
  stashAndClearChanges,
} from "../../../utils/github/git.js";
import { getRepoAbsolutePath } from "@open-swe/shared/git";
import { createScratchpadTool } from "../../../tools/scratchpad.js";
import { getMcpTools } from "../../../utils/mcp-client.js";
import { getSandboxWithErrorHandling } from "../../../utils/sandbox.js";
import { shouldDiagnoseError } from "../../../utils/tool-message-error.js";
import { Command } from "@langchain/langgraph";
import { filterHiddenMessages } from "../../../utils/message/filter-hidden.js";
import { DO_NOT_RENDER_ID_PREFIX } from "@open-swe/shared/constants";
import { processToolCallContent } from "../../../utils/tool-output-processing.js";
import { createViewTool } from "../../../tools/builtin-tools/view.js";

const logger = createLogger(LogLevel.INFO, "TakeAction");

export async function takeActions(
  state: PlannerGraphState,
  config: GraphConfig,
): Promise<Command> {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1];

  if (!isAIMessage(lastMessage) || !lastMessage.tool_calls?.length) {
    throw new Error("Last message is not an AI message with tool calls.");
  }

  const viewTool = createViewTool(state, config);
  const shellTool = createShellTool(state, config);
  const searchTool = createGrepTool(state, config);
  const scratchpadTool = createScratchpadTool("");
  const getURLContentTool = createGetURLContentTool(config.thread_id);
  const searchDocumentForTool = createSearchDocumentForTool(state, config);
  const mcpTools = await getMcpTools(config);

  const higherContextLimitToolNames = [
    ...mcpTools.map((t) => t.name),
    getURLContentTool.name,
    searchDocumentForTool.name,
  ];

  const allTools = [
    viewTool,
    shellTool,
    searchTool,
    scratchpadTool,
    getURLContentTool,
    searchDocumentForTool,
    ...mcpTools,
  ];

  const sandbox = await getSandboxWithErrorHandling(config);
  const toolCallResultsWithUpdates = await Promise.all(
    lastMessage.tool_calls.map(async (toolCall) => {
      const tool = allTools.find((t) => t.name === toolCall.name);
      if (!tool) {
        return new ToolMessage({
          tool_call_id: toolCall.id,
          content: `Tool ${toolCall.name} not found.`,
        });
      }
      try {
        const toolOutput = await tool.invoke(toolCall.args, {
          ...config,
          runId: uuidv4(),
          threadId: config.thread_id,
          ...(sandbox && {
            sandbox,
          }),
        });

        const processedContent = processToolCallContent(
          toolOutput,
          higherContextLimitToolNames.includes(toolCall.name),
        );

        return new ToolMessage({
          tool_call_id: toolCall.id,
          content: processedContent.result,
          ...("stateUpdates" in processedContent && {
            stateUpdates: processedContent.stateUpdates,
          }),
        });
      } catch (e) {
        const error = e as Error;
        logger.error("Error invoking tool", {
          toolName: toolCall.name,
          toolArgs: toolCall.args,
          error: error.message,
        });
        return new ToolMessage({
          tool_call_id: toolCall.id,
          content: safeBadArgsError(error, tool.schema, toolCall.args),
          name: toolCall.name,
        });
      }
    }),
  );

  let toolCallResults = toolCallResultsWithUpdates.map(
    ({ stateUpdates, ...rest }) => rest,
  );

  let codebaseTree: string | undefined;
  let dependenciesInstalled: boolean | null = null;

  const shellToolCall = lastMessage.tool_calls.find(
    (tc) => tc.name === "shell",
  );
  if (shellToolCall) {
    const { command } = shellToolCall.args;
    if (command.includes("ls -R")) {
      const toolCallResult = toolCallResults.find(
        (tc) => tc.tool_call_id === shellToolCall.id,
      );
      if (toolCallResult) {
        codebaseTree = toolCallResult.content;
      }
    } else if (command.includes("yarn install")) {
      dependenciesInstalled = true;
    }
  }

  if (!isLocalMode(config)) {
    const repoPath = isLocalMode(config)
      ? getLocalWorkingDirectory()
      : getRepoAbsolutePath(state.targetRepository);
    const changedFiles = await getChangedFilesStatus(repoPath, sandbox, config);
    if (changedFiles?.length > 0) {
      logger.warn(
        "Changes found in the codebase after taking action. Reverting.",
        {
          changedFiles,
        },
      );
      await stashAndClearChanges(repoPath, sandbox);

      toolCallResults = toolCallResults.map(
        (tc) =>
          new ToolMessage({
            ...tc,
            content: `**WARNING**: THIS TOOL, OR A PREVIOUS TOOL HAS CHANGED FILES IN THE REPO.
  Remember that you are only permitted to take **READ** actions during the planning step. The changes have been reverted.
  
  Please ensure you only take read actions during the planning step to gather context. You may also call the \`take_notes\` tool at any time to record important information for the programmer step.
  
  Command Output:\n
  ${tc.content}`,
          }),
      );
    }
  }

  logger.info("Completed planner tool action", {
    ...toolCallResults.map((tc) => ({
      tool_call_id: tc.tool_call_id,
      status: tc.status,
    })),
  });

  const commandUpdate: PlannerGraphUpdate = {
    messages: toolCallResults,
    sandboxSessionId: sandbox.id,
    ...(codebaseTree && { codebaseTree }),
    ...(dependenciesInstalled !== null && { dependenciesInstalled }),
  };

  const maxContextActions = config.configurable?.maxContextActions ?? 75;
  const maxActionsCount = maxContextActions * 2;
  const filteredMessages = filterHiddenMessages([
    ...state.messages,
    ...(commandUpdate.messages ?? []),
  ]).filter((m) => isAIMessage(m) || isToolMessage(m));
  if (filteredMessages.length >= maxActionsCount) {
    logger.info("Exceeded max actions count, generating plan.", {
      maxActionsCount,
      filteredMessages,
    });
    return new Command({
      goto: "generate-plan",
      update: commandUpdate,
    });
  }

  const shouldRouteDiagnoseNode = shouldDiagnoseError([
    ...state.messages,
    ...toolCallResults,
  ]);

  return new Command({
    goto: shouldRouteDiagnoseNode
      ? "diagnose-error"
      : "generate-plan-context-action",
    update: commandUpdate,
  });
}
