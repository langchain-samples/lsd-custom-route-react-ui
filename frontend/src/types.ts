import type {
  AIMessage,
  DefaultToolCall,
  HumanMessage,
  Message,
  Thread,
  ToolCallWithResult,
  ToolMessage,
} from "@langchain/langgraph-sdk";
import type { UseStream } from "@langchain/langgraph-sdk/react";

export type AgentMessage = Message<DefaultToolCall>;
export type AgentAIMessage = AIMessage<DefaultToolCall>;
export type AgentHumanMessage = HumanMessage;
export type AgentToolMessage = ToolMessage;
export type AgentToolCall = DefaultToolCall;
export type AgentToolCallResult = ToolCallWithResult<DefaultToolCall>;
export type AgentFileMap = Record<string, unknown>;
export type TodoStatus = "pending" | "in_progress" | "completed" | string;

export interface TodoItem {
  id?: string;
  content: string;
  status: TodoStatus;
}

export interface AgentState extends Record<string, unknown> {
  messages: AgentMessage[];
  files?: AgentFileMap;
  todos?: TodoItem[];
}

export type AgentStream = UseStream<AgentState>;
export type ThreadSummary = Thread<AgentState>;
export type ContentBlock = Extract<AgentMessage["content"], Array<unknown>>[number];

export interface ImageBlock {
  url: string;
}
