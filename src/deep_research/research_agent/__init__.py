"""Deep Research Agent Example.

This module demonstrates building a research agent using the deepagents package
with Anthropic's native web search and a strategic thinking tool.
"""

from research_agent.prompts import (
    RESEARCHER_INSTRUCTIONS,
    RESEARCH_WORKFLOW_INSTRUCTIONS,
    SUBAGENT_DELEGATION_INSTRUCTIONS,
)
from research_agent.tools import think_tool, web_search_tool

__all__ = [
    "web_search_tool",
    "think_tool",
    "RESEARCHER_INSTRUCTIONS",
    "RESEARCH_WORKFLOW_INSTRUCTIONS",
    "SUBAGENT_DELEGATION_INSTRUCTIONS",
]
