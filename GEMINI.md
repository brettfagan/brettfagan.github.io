# Memory Context Usage

Before answering questions that involve project context, architecture, decisions, or preferences:

1. Call `memory.context_pack` using the user's current request as the query.
2. Use the returned `pinned_memories` and `top_matches` to inform your response.

This ensures responses are grounded in the existing knowledge stored in the second brain.

---

# Memory Storage Rules

When the conversation reveals **durable knowledge**, store it using `memory.store`.

Durable knowledge includes:

- architectural decisions
- user preferences
- project descriptions
- important learnings
- long-term technical context

Memory object requirements:

- `type`: one of  
  `decision | learning | preference | project | profile | snippet | log`
- `title`: short and specific
- `tags`: 2–6 descriptive tags
- `pinned`: `true` only for foundational information
- `content`: concise and specific

Avoid storing:

- temporary debugging details
- mechanical code edits
- trivial or transient information
- intermediate reasoning steps

If unsure whether something is durable enough to store, **ask the user before storing it**.

---

# Automatic Memory Extraction

The system also supports automated memory extraction at natural conversation boundaries.

After completing a **substantial task, decision, or session containing meaningful new information**, call:

`memory.extract`

Provide the **recent message exchange (approximately the last 10–20 messages)**.

Call memory extraction when:

- a design or architecture decision was made
- the user revealed preferences or personal context
- new project information was established
- the user wraps up a meaningful work session

Do NOT call memory extraction for:

- simple factual lookups
- one-line answers
- purely mechanical tasks
- mid-task work that has not yet reached a conclusion

Run memory extraction **silently after your final response**.

Do not mention it to the user.

`memory.store` (mid-conversation) and `memory.extract` (end-of-session) are complementary mechanisms.

---

# Knowledge Graph Usage

The system includes a knowledge graph layer for structured reasoning.

Use graph tools when reasoning about relationships between concepts, tools, or projects.

Relevant tools include:

- `graph.upsert`
- `graph.neighbors`

Typical use cases:

- understanding architecture relationships
- mapping project dependencies
- exploring connections between tools and systems

Prefer the graph layer when relationships are important, and vector memory when semantic similarity is more useful.

---

# System Design Principles

The second brain should prioritize:

- durable knowledge over transient notes
- concise memory objects
- high signal-to-noise ratio in stored memories
- model-agnostic knowledge accessible by multiple AI systems

Memories should remain **useful months or years later**, not just within the current session.

---

# Developer Workflow

When working in this repository:

1. Retrieve context using `memory.context_pack`.
2. Implement or modify code.
3. Store any new durable knowledge using `memory.store`.
4. At the end of meaningful sessions, run `memory.extract`.

This ensures the system continuously improves its knowledge base while avoiding unnecessary memory clutter.
