export const site = {
  title: 'Rushabh Sanghvi — Engineering Notes',
  author: 'Rushabh Sanghvi',
  bio: 'I’m an architect at Illumio, where I work on Zero Trust segmentation for public cloud — mostly Go, distributed systems, and getting data out of four cloud providers without falling over. I built the first version of CloudSecure as a prototype in 2019. I write here about backend systems and the coding tools I use along the way.',
  portrait: '/images/rushabh-sanghvi.jpg',
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
