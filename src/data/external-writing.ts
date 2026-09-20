export interface ExternalPost {
  title: string;
  description: string;
  pubDate: string;
  url: string;
  part: number;
  series: string;
}

export const externalWriting: ExternalPost[] = [
  {
    title: 'CLAUDE.md: The File That Changes Everything',
    description: 'Using a project instruction file to give a coding agent persistent context.',
    pubDate: '2026-03-15',
    url: 'https://medium.com/@rushabh268/claude-md-the-file-that-changes-everything-f58cef2cf0c8',
    part: 1,
    series: 'claude-for-cloud-security',
  },
  {
    title: 'Claude Skills: encode once, invoke forever',
    description: 'Packaging reusable knowledge and workflows into skills.',
    pubDate: '2026-03-19',
    url: 'https://medium.com/@rushabh268/claude-skills-encode-once-invoke-forever-46314a9008fb',
    part: 2,
    series: 'claude-for-cloud-security',
  },
  {
    title: 'Claude Prompts — Declare outcomes, not steps',
    description: 'Describing the result you need and the constraints that matter.',
    pubDate: '2026-03-29',
    url: 'https://medium.com/@rushabh268/claude-prompts-declare-outcomes-not-steps-fd7bdafb5d09',
    part: 3,
    series: 'claude-for-cloud-security',
  },
  {
    title: 'Claude Pipelines — Plan once, start shipping',
    description: 'Bringing prompts, skills, and project context into a repeatable workflow.',
    pubDate: '2026-04-06',
    url: 'https://medium.com/@rushabh268/claude-pipelines-plan-once-start-shipping-b7fe3c71fc02',
    part: 4,
    series: 'claude-for-cloud-security',
  },
];
