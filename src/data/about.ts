import { h, icon, ICONS } from '@onigam/lab-kit/ui';
import { t } from '../i18n/ui';
import { ACCESS, CHAPTERS, LAW, MAIN_VIDEO, SOURCES } from './sources';

// The content of the Sources panel, for `about` in src/lab.ts (`about: aboutPanel`): the notices, the warning and the law, said once here, the credits and every link, each source saying how it was read.

/** The notices, then the law, then every source with a link. `videoUrl` is the kit's `ctx.videoUrl`, when the lab declares its main video. */
export function aboutPanel(ctx: { videoUrl?: (timestamp: string) => string }): HTMLElement[] {
  const fr = document.documentElement.lang !== 'en';
  const link = (href: string, label: string) => h('a', { href, target: '_blank', rel: 'noopener noreferrer' }, label);
  // a method of the kit's context: called on it, never detached
  const videoUrl = (ts: string) => ctx.videoUrl?.(ts) ?? MAIN_VIDEO.href;
  return [
    h('div', { class: 'callout callout--warn' }, icon(ICONS.warn, 16), h('span', {}, t('safety'))),
    h('div', { class: 'callout callout--warn' }, icon(ICONS.warn, 16), h('span', {}, t('hazards'))),
    h('div', { class: 'callout callout--tip' }, h('span', {}, t('disclaimer'))),
    h('div', { class: 'callout callout--tip' }, h('span', {}, t('noticeReading'))),
    h('h3', { class: 'section-title' }, t('lawTitle')),
    h('div', { class: 'callout callout--warn' }, icon(ICONS.warn, 16), h('span', {}, t('legal'))),
    h(
      'ul',
      { class: 'links' },
      ...LAW.map(([place, f, e]) => h('li', {}, h('strong', {}, fr ? place[0] : place[1]), ' — ', fr ? f : e)),
    ),
    h('p', {}, t('mainSource'), ' ', link(MAIN_VIDEO.href, MAIN_VIDEO.label), ' ', t('mainSourceNote')),
    h('h3', { class: 'section-title' }, t('chapters')),
    h(
      'ul',
      { class: 'chapters' },
      ...CHAPTERS.map(([ts, f, e]) => h('li', {}, link(videoUrl(ts), ts), ' ', fr ? f : e)),
    ),
    ...SOURCES.flatMap((group) => [
      h('h3', { class: 'section-title' }, fr ? group.fr : group.en),
      h(
        'ul',
        { class: 'links' },
        ...group.items.map((s) => {
          const access = ACCESS[s.access];
          return h(
            'li',
            {},
            s.href ? link(s.href, s.label) : s.label,
            ' — ',
            fr ? s.fr : s.en,
            ' (',
            fr ? access[0] : access[1],
            ')',
          );
        }),
      ),
    ]),
    h('p', { class: 'hint' }, t('sourcesNotLinked')),
    h('p', { class: 'hint' }, t('sourcesNoCopy')),
    h('p', { class: 'hint' }, 'Three.js · TypeScript · Vite — MIT'),
  ];
}
