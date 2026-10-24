---
title: "Compass — The gaps between sessions"
description: "Why maintained project context and limited observations matter across coding sessions."
pubDate: "2026-10-24"
heroImage: "/images/compass/part-2/cover.png"
heroAlt: "Inside Compass, Part 2. Project knowledge connects separate coding sessions while each coding tool keeps control of its work."
series: "inside-an-agent-harness"
part: 2
topic: "Why I built it"
draft: false
---
In the [first part](https://rushabh268.github.io/writing/agent-harnesses-context-in-evidence-out/), I introduced Compass as a companion harness for AI coding tools. It supplies selected project context and records a limited set of observations alongside Claude Code, Codex, and OpenCode. The coding tool still runs the agent.

This post is about why I wanted that extra layer. The starting point was the same problem behind my earlier posts on CLAUDE.md and skills: useful knowledge should not depend on whether I remember to repeat it in the next conversation.

There is a second problem, though. After a session has done some work, what can I actually say happened? A reassuring answer in chat, a tool callback, and a passing test are different kinds of evidence. I wanted a way to inspect the activity my integrations observe without building another archive of everything the agent reads.

Those two needs shaped Compass: make maintained context easier to supply, and make the limits of the resulting evidence clear.

## Some knowledge belongs outside the conversation

Project instructions are a good place for conventions that apply broadly. Skills are useful for a procedure I want to reuse. A specific change often needs something more local: why a shortcut was rejected, what a migration must preserve, or which condition caused a previous regression.

Consider an illustrative export service. It writes rows in batches and keeps a checkpoint so an interrupted export can resume. A note explains that the checkpoint must advance only after the destination accepts the batch. An agent asked to improve throughput could move that update earlier and produce cleaner-looking code that skips records after a failure.

The task description might say “make exports faster.” The important constraint is elsewhere.

```text
Illustrative project note

Decision: advance the checkpoint after the destination accepts a batch.
Reason: a failed batch must remain eligible for retry.
Verify: interrupt an export between submission and acknowledgement;
        resume it and check that no rows are skipped.
```

That is the kind of note I want to keep close to the project. It gives the next session a decision, a reason, and a way to check the result. It also gives a reviewer something concrete to question if the implementation changes.

Compass selects from maintained project notes and selected code comments. Its current selection uses branch matching and the files changed in the latest commit; it is not a search engine over every decision in a repository. A useful note outside that selection can be missed. A stale note inside it can be supplied confidently and still be wrong.

The responsibility to maintain those sources remains mine.

Anthropic describes a related problem in its work on long-running agents: later sessions had to reconstruct undocumented progress or concluded too early that the job was finished. Its experiment used progress files, Git history, incremental work, and verification to make the next session easier to start. That is research on a particular harness, rather than a measurement of Compass, but the need for a clear handoff is familiar. [6]

[![Project instructions carry broad conventions; a maintained decision note supplies task context; the coding tool owns the current session.](/images/compass/part-2/01-context-between-sessions.png)](/images/compass/part-2/01-context-between-sessions.svg "Open the full-size diagram")

*Figure 1. The durable source is the project note. A grounding brief is a selected view offered through the tool’s context interface, not a promise that the tool will retain it forever.*

## Why not put everything in the instruction file?

Because relevance changes with the task. The checkpoint constraint matters during an export change. It probably does not belong beside every request to adjust a page title or update a dependency.

Anthropic’s context-engineering guidance treats context as a resource to curate. Its discussion of retrieval and structured notes is useful here: a larger pile of text is not automatically a better working context. [1]

I want the broad rules to remain easy to read, the procedures to remain reusable, and the detailed decisions to remain attached to their sources. The brief brings a small selection into the current request and leaves references the agent can follow.

This is also why I do not describe Compass as permanent model memory. The maintained files persist. The coding tool decides how supplied context participates in its session and how history is retained or compacted. Those are different responsibilities.

## Crossing a tool boundary should not erase the source

I use more than one coding tool. That makes it useful to separate the knowledge I maintain from the adapter that supplies it.

A project decision about checkpoints should not need three different versions because I switch from Claude Code to Codex or OpenCode. The common collector can prepare the same kind of bounded, cited brief. The adapter still has to respect the host’s interface.

There is a cost to this choice. Hooks and plugins do not expose the same events or context callbacks. Documentation changes. A valid-looking payload can still violate the host’s runtime contract. Part 3 covers a case where mine did exactly that.

Tool independence therefore means maintaining a shared core with explicit adapters. It does not mean hiding every difference or promising identical visibility everywhere. Native tools also already offer instructions, skills, hooks, and session features. If those solve the problem in a project, another local service may add little value.

## I wanted observations I could interpret

It is tempting to turn every observable action into a reassuring number. More events, more grounding injections, more tool calls: surely that means the system is working.

It means the integration recorded those events.

A grounding-emission record shows that an adapter emitted a brief through a host-facing interface. It does not prove the host accepted it or that the model followed the decision in it. A tool event can help locate activity. It cannot establish that the resulting code passed the relevant test. For the export example, the useful check still interrupts the export at the failure boundary and inspects the resumed output.

[![Three separate claims require separate evidence: an adapter can record an emission, a test has an observed result, and correctness needs relevant behavioral validation.](/images/compass/part-2/02-evidence-boundaries.png)](/images/compass/part-2/02-evidence-boundaries.svg "Open the full-size diagram")

*Figure 2. These are related questions, but evidence for one does not automatically answer the next.*

Boris Cherny put the feedback-loop requirement plainly:

> “give Claude a way to verify its work.”
>
> — [Boris Cherny, January 2, 2026](https://x.com/bcherny/status/2007179861115511237)

That advice is useful precisely because verification happens against something outside the model’s own assurance. Compass can contribute context and observations around the check. The test, review, and runtime result still matter on their own.

## Collecting less is a design decision

A complete transcript would be convenient when investigating an incident. It would also duplicate everything sensitive that passed through the session: source text, command output, and possibly credentials.

I chose a limited event schema instead. The adapters normalize supported events and retain selected metadata. Credential-pattern scanning can produce an observation without turning the raw input into a second conversation archive. Grounding emission records similarly carry selected metadata, not the brief itself.

There are consequences. I cannot reconstruct every model decision from that ledger. Missing events can reflect an unsupported callback, a failed audit write, or activity outside the integration. OpenCode also drops the oldest undrained grounding record when its 256-entry buffer fills. A dashboard count can therefore understate emissions, and it covers a bounded recent window rather than the lifetime of the project. An empty dashboard is not proof that nothing happened.

The scanner runs in shadow mode. It observes patterns; it does not prevent the action, prove that every credential was found, or replace the coding tool’s permissions. A separate enforcement control must actually sit on the operation it is intended to block.

The ledger is tamper-evident within a cooperative local system. That is useful for detecting changes to records. It does not make the record immune to a hostile process with the same user’s access.

## When the extra layer earns its place

For me, the useful questions are practical. Am I maintaining decisions that should survive a session? Do I need them across tools? Is there a specific observation I want to inspect? Can I explain what that observation will and will not establish?

| Need | First thing I would reach for |
| --- | --- |
| A convention that applies across the project | The tool’s project instructions. |
| A repeated procedure with clear inputs and checks | A skill or ordinary automation. |
| A decision relevant to a particular area of work | A maintained note with a source and a verification step. |
| Common context delivery and selected observations across tools | A companion such as Compass, if its upkeep is justified. |

Compass introduces configuration, compatibility work, storage, and processing overhead. The best case is that those costs buy a useful, understandable view of the work. They do not disappear because the integration is local or described as lightweight.

I am not claiming a measured productivity gain. The goal is more concrete: reduce dependence on repeated explanations, preserve the source of a decision, and avoid confusing a record of activity with proof of correctness.

## What comes next

The implementation forced me to make these boundaries real. An early OpenCode integration tried to add context using a persisted message Part. The host rejected it after the plugin returned. The error was outside the handler I expected to protect the session.

In Part 3, I will walk through that failure, the move to transient context, the refresh ordering problem, and the common event path behind the three adapters. The interesting part is how the failures changed the design.

Onwards…

## Sources and further reading

1. Anthropic, [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) — context selection, retrieval, and structured notes.
2. Anthropic, [How Claude Code works](https://code.claude.com/docs/en/how-claude-code-works) — native execution and context responsibilities.
3. OpenAI, [Codex hooks](https://learn.chatgpt.com/docs/hooks) — the host’s documented hook interfaces and trust model.
4. OpenCode, [Plugins](https://opencode.ai/docs/plugins/) — plugin events and integration points.
5. Boris Cherny, [original verification advice](https://x.com/bcherny/status/2007179861115511237), January 2, 2026. The quote is a literal excerpt.

6. Anthropic, [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents), November 26, 2025 — progress artifacts, incremental work, and end-to-end verification across context windows.
