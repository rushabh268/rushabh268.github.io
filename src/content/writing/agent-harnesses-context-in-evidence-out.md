---
title: "Compass — Context in, evidence out"
description: "What a local companion harness adds to the coding tool’s native runtime: selected project context, a limited audit trail, and a view of observed activity."
pubDate: "2026-09-19"
heroImage: "/images/compass/part-1/cover.png"
heroAlt: "Inside Compass, Part 1 of 3. A companion layer supplies project context and records selected activity alongside Claude Code, Codex, and OpenCode."
series: "inside-an-agent-harness"
part: 1
topic: "What it is"
draft: false
---
It’s been a while since I wrote about [CLAUDE.md](https://medium.com/@rushabh268/claude-md-the-file-that-changes-everything-f58cef2cf0c8), [skills](https://medium.com/@rushabh268/claude-skills-encode-once-invoke-forever-46314a9008fb), prompts, and multi-agent pipelines. The idea was to give agents useful project context and repeatable workflows. I used cloud infrastructure examples because that is where a missed constraint can become an expensive mistake.

This series takes the next step. When several agents are working across sessions, I want a consistent way to supply the context relevant to their work and inspect the activity my tooling can actually observe. I also want that approach to survive a change of coding tool. I might use Claude Code for one task, Codex for another, and OpenCode for a third.

That led me to build **[Compass](https://github.com/rushabh268/compass), a companion harness for AI coding tools**: a local layer that works alongside the harness already provided by the coding tool. In this first post, I will explain what that layer does, where it fits, and what I am deliberately leaving to the underlying tool. Part 2 will cover why I built it. Part 3 will cover the implementation and the things that broke along the way.

## First, the coding tool already has a harness

Andrej Karpathy described the shift in programming this way:

> “The profession is being dramatically refactored as the bits contributed by the programmer are increasingly sparse and between.”
>
> — [Andrej Karpathy, December 26, 2025](https://x.com/karpathy/status/2004607146781278521)

One place that change shows up is the amount of work happening between a request and a code diff. The agent gathers context, calls tools, reads their results, changes its approach, and decides what to do next. Something has to manage that loop.

That surrounding execution software is the agent harness. Anthropic explicitly describes Claude Code as the harness around Claude: it provides tools, context management, and an execution environment. OpenAI describes the Codex harness as managing conversation state, streamed execution, tools, and configured sandbox and approval policies. These capabilities already belong to the coding tool. [1][2]

This distinction matters. **Compass complements that runtime.** I am using “companion harness” to make the boundary clear.

[![The native coding tool owns the agent loop, tools, sessions, and execution boundaries. The companion layer supplies grounding and receives selected events through Claude Code, Codex, and OpenCode adapters.](/images/compass/part-1/01-companion-boundary.png)](/images/compass/part-1/01-companion-boundary.svg "Open the full-size diagram")

*Figure 1. The coding tool continues to run the agent. The companion supplies project context and observes activity through each tool’s supported integration points.*

The native harness still handles execution, approvals, and its configured security boundaries. My companion layer handles a narrower set of responsibilities: selecting relevant project context, collecting a limited audit record, and presenting useful metadata about the activity it observes.

It does not decide which subagent should implement a feature or take over the tool’s permission system. Those remain concerns of the coding tool and the workflow you configure around it.

## What the companion actually adds

There are three pieces worth separating.

### 1. Relevant context for the current work

CLAUDE.md and similar project instruction files are useful for conventions that apply broadly. A specific change may also depend on a decision recorded in a project note, or a comment explaining why a piece of code behaves in an unusual way.

For example, consider a cloud authentication change. The code may cache a token, but the important constraint is that tokens for different API audiences must remain separate. An agent working on expiration handling needs that context before it “simplifies” the cache.

A small grounding brief could surface the relevant note and its source:

```text
Illustrative project context

Source: identity-refresh/decisions.md
Token reuse must consider the requested API audience as well as expiry.
Two SDK clients may share a credential while requesting different scopes.

Source: credentials/cache.go, relevant code comment
Separate cache entries by the requested audience.
```

*These paths and the excerpt are illustrative, not a captured production brief.*

The grounding path matches the current branch to project notes and selects files changed in the latest commit, then reads selected comments from their current working-tree contents. It prepares a bounded brief with source references, applies redaction, and makes that brief available to the model request. Claude Code, Codex, and OpenCode each receive the brief through their own context interface.

The durable knowledge stays in files I maintain. The brief is a selected view of that knowledge, and the agent can follow its references to check the original source. The coding tool manages how that context is retained in its session. A stale note can still produce stale context; selecting a note does not make it correct.

This follows the direction of Anthropic’s context-engineering guidance: context is finite, and curating a useful selection matters more than supplying everything that might be relevant. [3]

### 2. A deliberate record of observed activity

The second piece is an audit trail. Coding tools expose different events, so the adapter translates the events available from its tool into a common format.

That record can include session and tool activity, permission events where available, and observations from the credential-pattern scanner. The record has a limited schema. It does not retain raw prompts, vault contents, or tool output as a second conversation archive.

That is an intentional choice for security work. The same command output that helps an agent debug a problem can also contain a token or a connection string. Inspecting content for a credential pattern and storing the original content are separate decisions. The collector records the observation and selected metadata.

The local ledger includes integrity checks intended to detect changes to recorded data. I describe it as **tamper-evident**. It is a cooperative local system, not an immutable record protected from every process running as the same user.

### 3. A view of what the collector sees

The third piece is a small dashboard over that metadata. It shows recorded event counts by platform and type, a combined count of recorded grounding injections from Claude Code, Codex, and OpenCode, and credential-pattern observations. It also counts OpenCode’s coalescing summary events, which come from noisier event streams exposed by its plugin.

These are deliberately modest answers. An injection count tells me that the integration added a grounding brief. It does not tell me that the model used the brief correctly. A tool event tells me that activity was observed. Whether the resulting change works still needs test output, code review, and the appropriate runtime checks.

The dashboard reads a bounded recent event window, so its counts describe that window. They are not lifetime totals or a measurement of developer productivity.

[![Two separate flows: maintained project sources become a small cited brief for a model request; observed activity becomes selected metadata in a local ledger and dashboard.](/images/compass/part-1/02-context-and-evidence.png)](/images/compass/part-1/02-context-and-evidence.svg "Open the full-size diagram")

*Figure 2. Context enters the model request. Selected observations leave the workflow as audit metadata. The two flows carry different information.*

## How this fits with instructions, skills, and pipelines

Readers of the earlier series will recognize some overlap. Native coding tools already support project context and workflow extensions. I am keeping those mechanisms and adding a common layer around the parts I want to observe.

| Piece | Its job |
| --- | --- |
| Project instructions | Describe the project’s conventions, constraints, and working rules. |
| Skills | Package reusable knowledge or workflows for the tool to discover and invoke. |
| Agent workflows | Assign work, coordinate implementation and review, and define verification. |
| Companion harness | Supply selected project context and collect consistent metadata from supported tool integrations. |

For example, a skill can describe how to run a compliance check. The actual check must still execute and produce a result. Observing the skill or tool activity does not turn its instructions into an enforced security control.

That distinction is especially important coming from the provisioning example in my earlier posts. A compliance engine placed before a cloud API call can abort that call. **This prototype runs in shadow mode:** its credential scanner records observations; it does not block agent actions. It also does not expand the permissions granted by the coding tool.

## One core, different coding tools

Tool independence is a design goal, but it needs a precise meaning.

The common pieces are the project sources, the event contract, the redaction rules, the ledger, and the dashboard. An adapter handles the integration with a particular coding tool: which events exist, how to receive them, and how to supply context through the host’s interface.

Claude Code hooks and OpenCode plugins provide different interfaces. OpenCode documents plugins that subscribe to events and extend behavior; Codex provides command hooks for documented session, tool, and subagent events. There is no reason to assume that one hook implementation will work unchanged across all three. [2][4][7]

[![A shared companion core is connected to separate tool adapters. Claude Code, Codex, and OpenCode each have a separate adapter for automatic grounding and event collection.](/images/compass/part-1/03-tool-independent-core.png)](/images/compass/part-1/03-tool-independent-core.svg "Open the full-size diagram")

*Figure 3. The architecture separates common services from tool-specific integration. Automatic grounding, event collection, and the dashboard work across all three adapters.*

The shared grounding path now serves all three adapters. Each selects from the same project sources, prepares a brief within a budget, and supplies it through the coding tool. Audit collection and the dashboard use the same event contract across them. OpenCode also coalesces its noisy message, file-watch, and terminal streams; the native command callbacks do not expose an equivalent stream to coalesce.

Here is how those pieces fit around a request. Context preparation and audit collection are separate flows: the brief goes to the coding tool, while the ledger receives only selected metadata. The native tool runs the model and its tools. If grounding is disabled, has no matching sources, or fails, that workflow continues without the extra brief.

[![Sequence diagram with seven lifelines: Developer, Native coding tool, Companion adapter, Shared grounding, Project sources, Supervisor and ledger, and Dashboard. Native hooks prepare context on demand; OpenCode prepares it in the background and uses its cache. The brief returns through the host context interface. Only selected metadata reaches the ledger.](/images/compass/part-1/04-grounding-workflow.png)](/images/compass/part-1/04-grounding-workflow.svg "Open the full-size diagram")

*Figure 4. One request, two information flows. The adapter supplies context through the native tool and records observations separately. A grounding-emission count records what the integration supplied, not what the model understood. Open the full-size diagram to follow the calls and returns.*

## Evidence still needs interpretation

Boris Cherny’s advice about verification is direct:

> “give Claude a way to verify its work.”
>
> — [Boris Cherny, January 2, 2026](https://x.com/bcherny/status/2007179861115511237)

The companion can add useful evidence around that feedback loop. It cannot substitute for the check itself. I keep three claims separate:

| Claim | What supports it |
| --- | --- |
| A tool hook fired. | The event observed by the adapter. |
| A particular test passed. | The test result for the relevant code and invocation. |
| The change solves the problem. | Appropriate coverage, review, and validation of the actual behavior. |

I learned this boundary the hard way when an early grounding attempt broke an OpenCode turn. “Fail open” is an intended failure policy, not a guarantee against integration bugs or overhead. I will cover that incident, the cache race, and the limits of the performance evidence in Part 3.

## What comes next

My earlier series focused on making instructions and workflows reusable. With this companion, I want to carry the project knowledge and the record of observed activity across the coding tools I use.

In Part 2, I will explain why I wanted this layer: the context that was getting rebuilt, the visibility I was missing, and the tradeoffs involved in collecting useful evidence without keeping every piece of text an agent sees.

Onwards…

## Sources and further reading

1. Anthropic, [How Claude Code works](https://code.claude.com/docs/en/how-claude-code-works) — the native agentic loop, tools, context, and execution environment.
2. OpenAI, [Codex as a platform: build on the open agent harness](https://developers.openai.com/blog/codex-as-a-platform) — the native Codex harness and the responsibilities of applications built around it.
3. Anthropic, [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents), September 29, 2025 — context selection, retrieval, and structured notes.
4. OpenCode, [Plugins](https://opencode.ai/docs/plugins/) — the plugin and event integration model.
5. Andrej Karpathy, [original post](https://x.com/karpathy/status/2004607146781278521), December 26, 2025. The quote above is an excerpt from that post.
6. Boris Cherny, [original post](https://x.com/bcherny/status/2007179861115511237), January 2, 2026. The quote above is an excerpt from his verification advice.

7. OpenAI, [Codex hooks](https://learn.chatgpt.com/docs/hooks) — command hooks, supported events, asynchronous execution, and hook trust; checked September 19, 2026.
