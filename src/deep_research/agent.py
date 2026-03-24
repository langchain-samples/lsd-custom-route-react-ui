"""Research Agent - Standalone script for LangGraph deployment.

This module creates a deep research agent with custom tools and prompts
for conducting web research with strategic thinking and context management.
"""

import os
import sys
from datetime import datetime

# Ensure sibling packages (research_agent/) are importable
sys.path.insert(0, os.path.dirname(__file__))

from langchain.chat_models import init_chat_model
from deepagents import create_deep_agent

from research_agent.prompts import (
    RESEARCHER_INSTRUCTIONS,
    RESEARCH_WORKFLOW_INSTRUCTIONS,
    SUBAGENT_DELEGATION_INSTRUCTIONS,
)
from research_agent.tools import think_tool, web_search_tool

# Limits
max_concurrent_research_units = 3
max_researcher_iterations = 3

# Get current date
current_date = datetime.now().strftime("%Y-%m-%d")

# Combine orchestrator instructions (RESEARCHER_INSTRUCTIONS only for sub-agents)
INSTRUCTIONS = (
    RESEARCH_WORKFLOW_INSTRUCTIONS
    + "\n\n"
    + "=" * 80
    + "\n\n"
    + SUBAGENT_DELEGATION_INSTRUCTIONS.format(
        max_concurrent_research_units=max_concurrent_research_units,
        max_researcher_iterations=max_researcher_iterations,
    )
)

# Create research sub-agent
research_sub_agent = {
    "name": "research-agent",
    "description": "Delegate research to the sub-agent researcher. Only give this researcher one topic at a time.",
    "system_prompt": RESEARCHER_INSTRUCTIONS.format(date=current_date),
    "tools": [web_search_tool, think_tool],
}

# Model Claude Sonnet 4.6
model = init_chat_model(model="anthropic:claude-haiku-4-5")

# Create the agent
agent = create_deep_agent(
    model=model,
    tools=[web_search_tool, think_tool],
    system_prompt=INSTRUCTIONS,
    subagents=[research_sub_agent],
)
