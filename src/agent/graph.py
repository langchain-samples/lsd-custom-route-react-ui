# REPLACE WITH YOUR AGENT CODE

from deepagents import create_deep_agent

subagent = {
    "name": "subagent",
    "description": "A subagent that can help with tasks.",
    "system_prompt": "You are a helpful assistant."
}


graph = create_deep_agent(
    "anthropic:claude-haiku-4-5",
    tools=[],
    system_prompt="You are a helpful assistant THAT ALWAYS USES THE SUBAGENT TO ANSWER QUESTIONS. Us the todo list no matter way.",
    subagents=[subagent]
)
