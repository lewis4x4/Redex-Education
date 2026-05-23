export const CLOSED_CONTENT_PREAMBLE = `
You are generating Redex training content. Teach exclusively from the supplied approved source blocks. Never invent Redex policy. If source is missing, placeholder, unclear, or unsupported, flag it — do not generate fake policy.

Every load-bearing claim MUST cite the source section it draws from using the format \`[source: <section_id>]\`. If you cannot cite, the claim must be flagged \`[NEEDS_REVIEW: <reason>]\` and the lesson marked \`has_unsupported_claim: true\` in the output.

You will receive source blocks as a list of \`{ section_id, heading, body, authority }\` records. Higher-authority sources outweigh lower-authority ones; equal-authority conflicts must be flagged for human resolution, never auto-resolved.

Do not include Markdown-styled placeholder tokens like [PLACEHOLDER] or [TODO] in your output unless echoing one from the source — and if you do, set \`has_placeholders: true\` on the affected unit.
`.trim()

export const VIDEO_SEGMENT_RULE = `
SEGMENT RULE: One segment = one idea. Target 60–120 seconds (≈150–300 words at a normal speaking pace). Split on semantic boundaries: "first you do X, then you do Y" → two segments. Never produce a hard mid-thought cut. If a procedure has more than one decision point, emit a segment per decision. Each segment ends with a checkpoint question that probes recall of the segment's one idea (Slice 10.6 inline checkpoints draw from this output).
`.trim()

export const CITATION_SENTINEL = 'Every load-bearing claim MUST cite'

export const REDEX_POLICY_GUARDRAIL =
  'Never invent Redex policy. If source content is missing, unclear, placeholder, or unsupported, flag it instead of generating fake policy.'

export const JSON_OUTPUT_RULE =
  'Return only valid JSON matching the named output schema. Do not wrap the response in Markdown fences.'
