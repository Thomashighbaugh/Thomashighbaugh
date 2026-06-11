/**
 * @file Shared JSDoc type definitions for the Profile README Generator.
 * Add `// @ts-check` to any source file to enable IDE type-checking
 * against these definitions.
 *
 * @module types
 */

/**
 * @typedef {Object} ThemeColors
 * @property {string} primary
 * @property {string} lightPrimary
 * @property {string} secondary
 * @property {string} lightSecondary
 * @property {string} white
 * @property {string} black
 */

/**
 * @typedef {Object} HeaderImage
 * @property {string} src
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef {Object} BadgeStyles
 * @property {string} [align]
 * @property {string} [style]
 * @property {string} [color]
 * @property {string} [logoColor]
 * @property {string} [labelColor]
 */

/**
 * @typedef {Object} BadgeProperties
 * @property {string} name
 * @property {string} [message]
 * @property {string} [color]
 * @property {string} [logo]
 * @property {string} [href]
 * @property {string} [style]
 * @property {string} [logoColor]
 * @property {string} [labelColor]
 */

/**
 * @typedef {Object} ElementProperties
 * @property {string} [children]
 * @property {string} [src]
 * @property {number} [width]
 * @property {number} [height]
 * @property {string} [href]
 * @property {string} [alt]
 * @property {string} [align]
 * @property {string} [style]
 * @property {string} [className]
 */

/**
 * @typedef {Object} HeaderBadge
 * @property {'badge'|'views'} type
 * @property {string} [name]
 * @property {string} [href]
 * @property {string} [logo]
 */

/**
 * @typedef {Object} HeaderConfig
 * @property {HeaderImage} image
 * @property {BadgeStyles} styles
 * @property {HeaderBadge[]} badges
 */

/**
 * @typedef {Object} SocialMediaLink
 * @property {string} name
 * @property {string} [href]
 * @property {string} [logo]
 * @property {string} [labelColor]
 */

/**
 * @typedef {Object} SocialMediasConfig
 * @property {BadgeStyles} styles
 * @property {SocialMediaLink[]} links
 */

/**
 * @typedef {Object} Skill
 * @property {string} name
 * @property {boolean} [isHighlighted]
 * @property {string} [logo]
 */

/**
 * @typedef {Object} SkillCategory
 * @property {string} name
 * @property {Skill[]} skills
 */

/**
 * @typedef {Object} SkillswallConfig
 * @property {BadgeStyles} styles
 * @property {boolean} randomOrder
 * @property {SkillCategory[]} categories
 */

/**
 * @typedef {Object} RecentWorksConfig
 * @property {boolean} enabled
 * @property {number} maxEvents
 * @property {boolean} showRepoCards
 * @property {number} maxRepoCards
 */

/**
 * @typedef {Object} StarredReposConfig
 * @property {boolean} enabled
 * @property {number} maxRepos
 * @property {number} minStars
 */

/**
 * @typedef {Object} FollowerMilestonesConfig
 * @property {boolean} enabled
 * @property {number[]} milestones
 */

/**
 * @typedef {Object} InterestsConfig
 * @property {boolean} enabled
 * @property {number} maxTopics
 */

/**
 * @typedef {Object} ProjectData
 * @property {string} user
 * @property {string} startedProgramming
 * @property {number} repoQuantity
 * @property {string} [token]
 * @property {HeaderConfig} header
 * @property {SocialMediasConfig} socialMedias
 * @property {SkillswallConfig} skillswall
 * @property {RecentWorksConfig} recentWorks
 * @property {StarredReposConfig} starredRepos
 * @property {FollowerMilestonesConfig} followerMilestones
 * @property {InterestsConfig} interests
 */

/**
 * @typedef {Object} GitHubFollower
 * @property {string} login
 * @property {number} id
 * @property {string} [avatar_url]
 * @property {string} [html_url]
 * @property {string} [name]
 * @property {string} [bio]
 * @property {number} [public_repos]
 * @property {number} [followers]
 * @property {string} [type]
 * @property {string} [created_at]
 * @property {string} [updated_at]
 * @property {string} [url]
 */

/**
 * @typedef {Object} GitHubRepo
 * @property {string} name
 * @property {string} full_name
 * @property {string} html_url
 * @property {string} [description]
 * @property {boolean} [fork]
 * @property {number} [stargazers_count]
 * @property {number} [forks_count]
 * @property {string[]} [topics]
 * @property {Object} [owner]
 * @property {string} [owner.login]
 */

/**
 * @typedef {Object} GitHubEvent
 * @property {string} id
 * @property {string} type
 * @property {string} created_at
 * @property {Object} repo
 * @property {string} repo.name
 * @property {Object} [payload]
 * @property {Array} [payload.commits]
 * @property {number} [payload.distinct_size]
 * @property {string} [payload.ref]
 * @property {string} [payload.ref_type]
 * @property {Object} [payload.issue]
 * @property {string} [payload.issue.title]
 * @property {string} [payload.action]
 * @property {Object} [payload.release]
 * @property {string} [payload.release.tag_name]
 */

/**
 * @typedef {Object} ActivityItem
 * @property {string} icon
 * @property {string} action
 * @property {string} repo
 * @property {string} url
 * @property {string} detail
 * @property {string} date
 */

/**
 * @typedef {Object} StarredItem
 * @property {string} [starred_at]
 * @property {GitHubRepo} [repo]
 */

/**
 * @callback ReplacerFunction
 * @param {ProjectData} data
 * @returns {string|Promise<string>}
 */

module.exports = {};