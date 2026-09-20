export const site = {
  title: 'Rushabh Sanghvi — Engineering Notes',
  author: 'Rushabh Sanghvi',
  description: 'Notes on backend systems, cloud infrastructure, and working with AI coding tools. Written by Rushabh Sanghvi.',
  github: 'https://github.com/rushabh268',
  medium: 'https://medium.com/@rushabh268',
  socialImage: '/images/site-card.png',
};

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}
