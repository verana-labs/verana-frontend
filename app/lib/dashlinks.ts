import { translate } from '@/i18n/dataview';
import { resolveTranslatable } from '@/ui/dataview/types';
import { faDiscord, faGithub, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { faBook, faCode, faComments, faEnvelope, faVideo, IconDefinition } from '@fortawesome/free-solid-svg-icons';

interface DashLink {
  href: string;
  label?: string;
  icon?: IconDefinition;
  className?: string;
};

interface GroupLinks {
  title: string;
  links: DashLink[];
}; 

const footLinks : GroupLinks[] = [
  {
    title: resolveTranslatable({key: "dashboardfooter.resources"}, translate)??'',
    links: [
      { label: resolveTranslatable({key: "dashboardfooter.resources.documentation"}, translate), href: 'https://docs.verana.io/' },
      { label: resolveTranslatable({key: "dashboardfooter.resources.github"}, translate), href: 'https://github.com/verana-labs' },
      { label: resolveTranslatable({key: "dashboardfooter.resources.tutorials"}, translate), href: 'https://docs.verana.io/' },
      { label: resolveTranslatable({key: "dashboardfooter.resources.community"}, translate), href: 'https://discord.gg/edjaFn252q' },
    ]
  },
  {
    title: resolveTranslatable({key: "dashboardfooter.support"}, translate)??'',
    links: [
      { label: resolveTranslatable({key: "dashboardfooter.support.helpcenter"}, translate), href: 'https://verana.io/' },
      { label: resolveTranslatable({key: "dashboardfooter.support.contactcs"}, translate), href: 'mailto:hello@verana.io' },
      { label: resolveTranslatable({key: "dashboardfooter.support.bugreports"}, translate), href: 'https://github.com/verana-labs' },
      { label: resolveTranslatable({key: "dashboardfooter.support.featurerequests"}, translate), href: 'https://github.com/verana-labs' },
    ]
  },
];

const veranaLinks : DashLink[] = [
  { label: resolveTranslatable({key: "dashboardfooter.privacy"}, translate), href: 'https://verana.io/' },
  { label: resolveTranslatable({key: "dashboardfooter.terms"}, translate), href: 'https://verana.io/' },
  { label: resolveTranslatable({key: "dashboardfooter.security"}, translate), href: 'https://verana.io/' },
];

const communityLinks : DashLink[] = [
  {icon: faGithub, href: 'https://github.com/verana-labs'},
  {icon: faTwitter, href: 'https://github.com/verana-labs'},
  {icon: faDiscord, href: 'https://discord.gg/edjaFn252q'},
  {icon: faEnvelope, href: 'mailto:hello@verana.io'},
];

const configFooter = {
  title: resolveTranslatable({key: "dashboardfooter.title"}, translate),
  msg: resolveTranslatable({key: "dashboardfooter.msg"}, translate),
  img: 'https://verana.io/logo.svg',
  copyright: `${new Date().getFullYear()} ${resolveTranslatable({key: "dashboardfooter.copyright"}, translate)}.`
};

const quickLinks: GroupLinks = {
    title: resolveTranslatable({key: "gettingstarted.quicklinks.title"}, translate)??'',
    links: [
      { icon: faBook, label: resolveTranslatable({key: "gettingstarted.quicklinks.documentation"}, translate), href: 'https://docs.verana.io' },
      { icon: faVideo, label: resolveTranslatable({key: "gettingstarted.quicklinks.tutorials"}, translate), href: 'https://docs.verana.io/docs/next/learn/verifiable-trust/introduction' },
      { icon: faComments, label: resolveTranslatable({key: "gettingstarted.quicklinks.community"}, translate), href: 'https://discord.gg/edjaFn252q' },
      { icon: faCode, label: resolveTranslatable({key: "gettingstarted.quicklinks.api"}, translate), href: 'https://docs.verana.io/docs/next/use/ecosystems/intro' },
    ]
};

const stepsGettingStarted = [
  { title: resolveTranslatable({key: "gettingstarted.step1.label"}, translate), description: resolveTranslatable({key: "gettingstarted.step1.description"}, translate)},
  { title: resolveTranslatable({key: "gettingstarted.step2.label"}, translate), description: resolveTranslatable({key: "gettingstarted.step2.description"}, translate)},
  { title: resolveTranslatable({key: "gettingstarted.step3.label"}, translate), description: resolveTranslatable({key: "gettingstarted.step3.description"}, translate)},
];

export {footLinks, veranaLinks, communityLinks, configFooter, quickLinks, stepsGettingStarted};
