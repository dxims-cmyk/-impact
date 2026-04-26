export interface WelcomePack {
  slug: string
  client: {
    name: string
    ownerFirstName: string
    industry: string
    industryNoun: string
    city: string
    deliveryVerb: string
    signedDateRelative: string
    launchDateRelative: string
    launchDate: string
    monthYear: string
    nextKeyDay: string
  }
  deal: {
    weeklyRetainer: number
    weeklyAdSpend: number
    targetRevenueLow: number
    targetRevenueHigh: number
    clientSpecificInclusions: string[]
  }
  liveAd: {
    campaignName: string
    campaignType: string
    dailyBudget: number
    adSetName: string
    fbPage: string
    igHandle: string
    location: string
    ageRange: string
    gender: string
    interests: string[]
    primaryText: string
    headline: string
    description: string
    ctaButton: string
    leadFormFields: string[]
    knownQuirks: string[]
    thisWeekAdditions: string[]
  }
  algorithm: {
    weeklyReach: string
    weeklyEngagements: string
    weeklyLeads: string
  }
  leadHandling: {
    firstReply: string
    keyPromise: string
    industrySpecificDetail: string
    industryPreQuoteStep: string
    day2Followup: string
    day5Followup: string
  }
  targets: {
    week1to2Leads: string
    week3to4Leads: string
    month1AdSpend: number
    month1Jobs: string
    month2Leads: string
    month3Leads: string
    seasonalAngle: string
  }
  asks: {
    thisWeek: Array<{ text: string; done?: boolean }>
    next2Weeks: Array<{ text: string; done?: boolean }>
    faqGaps: string[]
    photoGuidance: string
    videoGuidance: string
  }
  faq: Array<{ q: string; a: string; adHeadline?: string }>
  llmSearchExample: string
  roadmap: {
    keyLandingPage: string
    websiteLocalPages: string[]
    expansionCity1: string
    expansionCity2: string
    year1RevenueLow: number
    year1RevenueHigh: number
    teamGrowthGoal: string
  }
}
