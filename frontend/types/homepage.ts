export interface CtaButton {
  label: string;
  href: string;
}

export interface ValuePoint {
  title: string;
  body: string;
}

export interface FeatureItem {
  title: string;
  description: string;
}

export interface FlowStepItem {
  title: string;
  body: string;
}

export interface HomepageContent {
  schemaVersion: number;
  
  hero: {
    wordmark: string;
    headingLead: string;
    headingEmphasis: string;
    description: string;
    primaryCta: CtaButton;
    secondaryCta: CtaButton;
    footnote: string;
    fallbackImage: {
      src: string;
      alt: string;
      caption: string;
      disclosure: string;
    };
  };

  value: {
    visible: boolean;
    eyebrow: string;
    headingLead: string;
    headingEmphasis: string;
    description: string;
    points: ValuePoint[];
  };

  discovery: {
    visible: boolean;
    eyebrow: string;
    heading: string;
    description: string;
    cta: CtaButton;
  };

  features: {
    visible: boolean;
    eyebrow: string;
    headingLead: string;
    headingEmphasis: string;
    description: string;
    primaryCta: CtaButton;
    secondaryLink: CtaButton;
    items: FeatureItem[];
  };

  journey: {
    visible: boolean;
    eyebrow: string;
    headingLead: string;
    headingEmphasis: string;
    description: string;
  };

  howItWorks: {
    visible: boolean;
    eyebrow: string;
    heading: string;
    description: string;
    umkmLabel: string;
    partnerLabel: string;
    umkmSteps: FlowStepItem[];
    partnerSteps: FlowStepItem[];
  };

  ai: {
    visible: boolean;
    eyebrow: string;
    heading: string;
    description: string;
    guardrailTitle: string;
    guardrailDescription: string;
  };

  finalCta: {
    visible: boolean;
    eyebrow: string;
    heading: string;
    description: string;
    primaryCta: CtaButton;
    secondaryCta: CtaButton;
  };
}

export interface HomepageRevision {
  id: string;
  publishedAt: string;
  publishedByName: string;
  content: HomepageContent;
}

export interface HomepageAdminState {
  lockVersion: number;
  draftUpdatedAt: string;
  draftUpdatedByName: string;
  publishedRevisionId?: string;
  lastPublishedAt?: string;
  lastPublishedByName?: string;
  draftContent: HomepageContent;
  revisions: HomepageRevision[];
}
