// @ts-check

const theme = require('./theme');

const { createElement } = require('./vice-renderer');

const COLORS = theme.colors;

/**
 * GitHub linguist language colors.
 * @type {Record<string, string>}
 */
const LANGUAGE_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Lua: '#000080',
  Rust: '#dea584',
  Go: '#00ADD8',
  Ruby: '#701516',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  PHP: '#4F5D95',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Elixir: '#6e4a7e',
  Haskell: '#5e5086',
  Kotlin: '#A97BFF',
  Swift: '#F05138',
  Dart: '#00B4AB',
  Zig: '#ec915c',
  Nix: '#7e7eff',
  'Emacs Lisp': '#c065db',
  'Vim script': '#199f4b',
  Makefile: '#427819',
  Dockerfile: '#384d54',
  PowerShell: '#012456',
  'Jupyter Notebook': '#DA5B0B',
};

/**
 * Inline icon component — renders a Simple Icons path as a raw <path>
 * element inside the parent SVG. No  tag, no external URL — nothing
 * GitHub's sanitizer strips from embedded README SVGs.
 *
 * @param {object} props
 * @param {string} props.pathData - SVG path 'd' attribute
 * @param {string} [props.color='currentColor']
 * @param {number|string} [props.size] - render size in px (scales the 24x24 viewBox)
 */
function Icon({ pathData, color = 'currentColor', size }) {
  if (!pathData) return null;
  const scale = size != null ? size / 24 : 1;
  return createElement('g', {
    transform: scale !== 1 ? `scale(${scale})` : undefined,
  }, [
    createElement('path', {
      d: pathData,
      fill: color,
    }),
  ]);
}

/**
 * Compute the rendered width of a badge.
 * @returns {number}
 */
function badgeWidth(label, value, icon = null, style = 'plastic', height = 28, fontSize = 11) {
  const isForTheBadge = style === 'for-the-badge';
  const padX = isForTheBadge ? 8 : 6;
  const labelW = Math.max(label.length * fontSize * 0.55 + padX * 2, 40);
  const valueW = Math.max(String(value).length * fontSize * 0.55 + padX * 2, 30);
  const iconW = icon ? height * 0.75 + 4 : 0;
  return Math.ceil(labelW + valueW + iconW + 4);
}

/**
 * Shields.io-style badge component — pure SVG.
 */
function Badge({
  label,
  value,
  color = COLORS.primary,
  logoColor = COLORS.white,
  icon,
  href,
  style = 'plastic',
  height = 28,
  fontSize = 11,
  textToPaths,
}) {
  const isForTheBadge = style === 'for-the-badge';
  const borderRadius = isForTheBadge ? 4 : height / 2;
  const padX = isForTheBadge ? 8 : 6;

  const labelW = Math.max(label.length * fontSize * 0.55 + padX * 2, 40);
  const valueW = Math.max(String(value).length * fontSize * 0.55 + padX * 2, 30);
  const iconW = icon ? height * 0.75 + 4 : 0;
  const totalW = labelW + valueW + iconW + 4;

  const labelX = iconW + padX;
  const valueX = labelX + labelW + padX;

  // Convert text to paths
  const labelPaths = textToPaths(label, 'VT323', fontSize, labelX, height * 0.62, logoColor);
  const valuePaths = textToPaths(value, 'VT323', fontSize, valueX, height * 0.62, logoColor);

  return createElement('a', {
    href: href || undefined,
    style: {
      textDecoration: 'none',
      display: 'inline-block',
    },
  }, [
    createElement('svg', {
      width: totalW,
      height,
      viewBox: `0 0 ${totalW} ${height}`,
      xmlns: 'http://www.w3.org/2000/svg',
    }, [
      // Background pill
      createElement('rect', {
        x: 0,
        y: 0,
        width: totalW,
        height,
        fill: color,
        rx: borderRadius,
        ry: borderRadius,
      }),
      // Icon
      ...(icon ? [
        createElement('g', {
          transform: `translate(${padX}, ${(height - height * 0.6) / 2}) scale(${height * 0.6 / 24})`,
        }, [
          createElement('path', {
            d: icon.pathData,
            fill: logoColor,
          }),
        ]),
      ] : []),
      // Label text paths
      ...labelPaths.map(p => createElement('path', {
        d: p.d,
        fill: p.fill,
        transform: `translate(${p.x}, ${p.y}) scale(${fontSize / fontSize})`,
      })),
      // Value text paths
      ...valuePaths.map(p => createElement('path', {
        d: p.d,
        fill: p.fill,
        transform: `translate(${p.x}, ${p.y}) scale(${fontSize / fontSize})`,
      })),
    ]),
  ]);
}

/**
 * Pill-shaped social media button — pure SVG.
 */
function SocialButton({
  icon,
  text,
  href,
  backgroundColor = '#1c1c1c',
  textColor = '#F2f2f2',
  fontSize = 15,
  width = 150,
  height = 36,
  textToPaths,
}) {
  const borderRadius = height / 2;
  const iconSize = height * 0.5;
  const textX = icon ? 12 + iconSize + 8 : 12;

  const textPaths = textToPaths(text, 'Knewave', fontSize, textX, height * 0.55, textColor);

  return createElement('a', {
    href,
    style: {
      textDecoration: 'none',
      display: 'inline-block',
    },
  }, [
    createElement('svg', {
      width,
      height,
      viewBox: `0 0 ${width} ${height}`,
      xmlns: 'http://www.w3.org/2000/svg',
    }, [
      // Background pill
      createElement('rect', {
        x: 0,
        y: 0,
        width,
        height,
        fill: backgroundColor,
        rx: borderRadius,
        ry: borderRadius,
      }),
      // Icon
      ...(icon ? [
        createElement('g', {
          transform: `translate(${12}, ${(height - iconSize) / 2}) scale(${iconSize / 24})`,
        }, [
          createElement('path', {
            d: icon.pathData,
            fill: textColor,
          }),
        ]),
      ] : []),
      // Text paths
      ...textPaths.map(p => createElement('path', {
        d: p.d,
        fill: p.fill,
        transform: `translate(${p.x}, ${p.y}) scale(${fontSize / fontSize})`,
      })),
    ]),
  ]);
}

/**
 * Skill pill — rounded chip with skill name and optional icon.
 */
function SkillPill({
  name,
  icon,
  color = COLORS.primary,
  logoColor = COLORS.white,
  highlighted = false,
  fontSize = 11,
  height = 24,
  width,
  textToPaths,
}) {
  const fill = highlighted ? COLORS.secondary : color;
  const totalW = width || skillPillWidth(name, !!icon, fontSize, height);
  const iconW = icon ? height * 0.75 + 6 : 0;
  const padX = 8;
  const textX = iconW + padX;

  const textPaths = textToPaths(name, 'VT323', fontSize, textX, height * 0.62, logoColor);

  return createElement('svg', {
    width: totalW,
    height,
    viewBox: `0 0 ${totalW} ${height}`,
    xmlns: 'http://www.w3.org/2000/svg',
  }, [
    // Background pill
    createElement('rect', {
      x: 0,
      y: 0,
      width: totalW,
      height,
      fill,
      rx: height / 2,
      ry: height / 2,
    }),
    // Icon
    ...(icon ? [
      createElement('g', {
        transform: `translate(${padX}, ${(height - height * 0.6) / 2}) scale(${height * 0.6 / 24})`,
      }, [
        createElement('path', {
          d: icon.pathData,
          fill: logoColor,
        }),
      ]),
    ] : []),
    // Text paths
    ...textPaths.map(p => createElement('path', {
      d: p.d,
      fill: p.fill,
      transform: `translate(${p.x}, ${p.y}) scale(${fontSize / fontSize})`,
    })),
  ]);
}

/**
 * Repository pin card — pure SVG.
 */
function RepoCard({
  _name,
  fullName,
  description,
  stars,
  forks,
  language,
  languageColor,
  href,
  width = 240,
  height = 120,
  textToPaths,
}) {
  const namePaths = textToPaths(fullName.split('/').pop(), 'VT323', 12, 12, 22, COLORS.secondary);
  const descPaths = description ? textToPaths(truncate(description, 90), 'VT323', 10, 12, 42, COLORS.white) : [];
  const starsPaths = textToPaths(`★ ${stars}`, 'VT323', 9, 0, 2, '#8b949e');
  const forksPaths = textToPaths(`🍴 ${forks}`, 'VT323', 9, 6 + stars.toString().length * 4.5, 2, '#8b949e');

  return createElement('a', {
    href,
    style: {
      textDecoration: 'none',
      display: 'inline-block',
    },
  }, [
    createElement('svg', {
      width,
      height,
      viewBox: `0 0 ${width} ${height}`,
      xmlns: 'http://www.w3.org/2000/svg',
    }, [
      // Background card
      createElement('rect', {
        x: 0,
        y: 0,
        width,
        height,
        fill: '#0d0d0d',
        rx: 4,
        ry: 4,
        stroke: '#30363d',
        strokeWidth: 1,
      }),
      // Repo name paths
      ...namePaths.map(p => createElement('path', {
        d: p.d,
        fill: p.fill,
        transform: `translate(${p.x}, ${p.y}) scale(${12 / 12})`,
      })),
      // Description paths
      ...descPaths.map(p => createElement('path', {
        d: p.d,
        fill: p.fill,
        transform: `translate(${p.x}, ${p.y}) scale(${10 / 10})`,
      })),
      // Stats row
      createElement('g', {
        transform: 'translate(12, 80)',
      }, [
        ...(language ? [
          createElement('rect', {
            x: 0,
            y: -4,
            width: 8,
            height: 8,
            fill: languageColor || LANGUAGE_COLORS[language] || COLORS.primary,
            rx: 2,
            ry: 2,
          }),
          ...textToPaths(language, 'VT323', 9, 12, 2, '#8b949e').map(p => createElement('path', {
            d: p.d,
            fill: p.fill,
            transform: `translate(${p.x}, ${p.y}) scale(${9 / 9})`,
          })),
          ...starsPaths.map(p => createElement('path', {
            d: p.d,
            fill: p.fill,
            transform: `translate(${p.x + 12 + 6 + language.length * 4.5}, ${p.y}) scale(${9 / 9})`,
          })),
          ...forksPaths.map(p => createElement('path', {
            d: p.d,
            fill: p.fill,
            transform: `translate(${p.x + 12 + 6 + language.length * 4.5 + 6 + stars.toString().length * 4.5}, ${p.y}) scale(${9 / 9})`,
          })),
        ] : [
          ...starsPaths.map(p => createElement('path', {
            d: p.d,
            fill: p.fill,
            transform: `translate(${p.x}, ${p.y}) scale(${9 / 9})`,
          })),
          ...forksPaths.map(p => createElement('path', {
            d: p.d,
            fill: p.fill,
            transform: `translate(${p.x + 6 + stars.toString().length * 4.5}, ${p.y}) scale(${9 / 9})`,
          })),
        ]),
      ]),
    ]),
  ]);
}

/**
 * Follower showcase card — pure SVG.
 */
function FollowerCard({
  icon,
  login,
  name,
  bio,
  publicRepos,
  followers,
  href,
  size = 150,
  textToPaths,
}) {
  const displayName = name || login;
  const cardW = size;
  const cardH = size + 60;

  const namePaths = textToPaths(displayName, 'Knewave', 18, cardW / 2, size * 0.5 + 30, COLORS.white);
  const bioPaths = bio ? textToPaths(bio.slice(0, 30), 'VT323', 11, cardW / 2, size * 0.5 + 44, COLORS.lightPrimary) : [];
  const statsPaths = textToPaths(`${publicRepos} repos · ${followers} followers`, 'VT323', 10, cardW / 2, size * 0.5 + 58, COLORS.lightPrimary);

  return createElement('a', {
    href,
    style: {
      textDecoration: 'none',
      display: 'inline-block',
    },
  }, [
    createElement('svg', {
      width: cardW,
      height: cardH,
      viewBox: `0 0 ${cardW} ${cardH}`,
      xmlns: 'http://www.w3.org/2000/svg',
    }, [
      // Icon/avatar placeholder
      ...(icon ? [
        createElement('g', {
          transform: `translate(${cardW / 2 - size * 0.175}, 10) scale(${size * 0.35 / 24})`,
        }, [
          createElement('path', {
            d: icon.pathData,
            fill: COLORS.secondary,
          }),
        ]),
      ] : []),
      // Name paths
      ...namePaths.map(p => createElement('path', {
        d: p.d,
        fill: p.fill,
        transform: `translate(${p.x}, ${p.y}) scale(${18 / 18})`,
      })),
      // Bio paths
      ...bioPaths.map(p => createElement('path', {
        d: p.d,
        fill: p.fill,
        transform: `translate(${p.x}, ${p.y}) scale(${11 / 11})`,
      })),
      // Stats paths
      ...statsPaths.map(p => createElement('path', {
        d: p.d,
        fill: p.fill,
        transform: `translate(${p.x}, ${p.y}) scale(${10 / 10})`,
      })),
    ]),
  ]);
}

/**
 * Compact metrics panel — pure SVG.
 */
function StatsCard({
  totalStars,
  totalForks,
  totalRepos,
  totalCommits,
  _width = 400,
  _height = 100,
  textToPaths,
}) {
  const labels = ['Stars', 'Forks', 'Repos', 'Commits'];
  const values = [totalStars, totalForks, totalRepos, totalCommits];
  const statW = 100;

  return createElement('svg', {
    width: 400,
    height: 100,
    viewBox: '0 0 400 100',
    xmlns: 'http://www.w3.org/2000/svg',
  }, [
    // Four stat columns
    values.map((value, i) => {
      const x = i * statW;
      const isLast = i === values.length - 1;
      const valuePaths = textToPaths(value.toLocaleString(), 'VT323', 20, x + statW / 2, 40, COLORS.secondary);
      const labelPaths = textToPaths(labels[i], 'VT323', 10, x + statW / 2, 64, COLORS.white);
      return [
        createElement('rect', {
          x,
          y: 0,
          width: statW,
          height: 100,
          fill: '#0d0d0d',
          rx: 4,
          ry: 4,
          ...(isLast ? {} : { stroke: '#30363d', strokeWidth: 1 }),
        }),
        ...valuePaths.map(p => createElement('path', {
          d: p.d,
          fill: p.fill,
          transform: `translate(${p.x - statW / 2}, ${p.y - 40}) scale(${20 / 20})`,
        })),
        ...labelPaths.map(p => createElement('path', {
          d: p.d,
          fill: p.fill,
          transform: `translate(${p.x - statW / 2}, ${p.y - 64}) scale(${10 / 10})`,
        })),
      ];
    }).flat(),
  ]);
}

/**
 * Metrics panel — headline counters + language breakdown.
 */
function MetricsPanel({
  totalStars,
  totalForks,
  totalRepos,
  totalCommits,
  languages = [],
  _width = 500,
  _height = 210,
  textToPaths,
}) {
  const statLabels = ['Stars', 'Forks', 'Repos', 'Commits'];
  const statValues = [totalStars, totalForks, totalRepos, totalCommits];
  const statsHeight = 86;

  const statChildren = statValues.map((value, i) => {
    const x = i * 125;
    const isLast = i === statValues.length - 1;
    const valuePaths = textToPaths(value.toLocaleString(), 'VT323', 20, x + 62.5, statsHeight / 2 - 6, COLORS.secondary);
    const labelPaths = textToPaths(statLabels[i], 'VT323', 9, x + 62.5, statsHeight / 2 + 14, COLORS.white);
    return [
      createElement('rect', {
        x,
        y: 0,
        width: 125,
        height: statsHeight,
        fill: '#0d0d0d',
        rx: 4,
        ry: 4,
        ...(isLast ? {} : { stroke: '#30363d', strokeWidth: 1 }),
      }),
      ...valuePaths.map(p => createElement('path', {
        d: p.d,
        fill: p.fill,
        transform: `translate(${p.x - 62.5}, ${p.y - (statsHeight / 2 - 6)}) scale(${20 / 20})`,
      })),
      ...labelPaths.map(p => createElement('path', {
        d: p.d,
        fill: p.fill,
        transform: `translate(${p.x - 62.5}, ${p.y - (statsHeight / 2 + 14)}) scale(${9 / 9})`,
      })),
    ];
  }).flat();

  const labelPaths = textToPaths('Most used languages', 'VT323', 10, 12, statsHeight + 16, COLORS.lightPrimary);

  const langChildren = languages.map((lang, i) => {
    const y = statsHeight + 14 + i * 22;
    const pct = Math.max(6, Math.round(((lang.count || 0) / (languages[0]?.count || 1)) * 100));
    const barW = Math.min(300, pct * 3);
    const langPaths = textToPaths(truncate(lang.name, 14), 'VT323', 10, 24, y + 2, COLORS.white);
    return [
      createElement('rect', {
        x: 12,
        y: y - 8,
        width: 8,
        height: 8,
        fill: LANGUAGE_COLORS[lang.name] || COLORS.primary,
        rx: 2,
        ry: 2,
      }),
      ...langPaths.map(p => createElement('path', {
        d: p.d,
        fill: p.fill,
        transform: `translate(${p.x - 24}, ${p.y - 2}) scale(${10 / 10})`,
      })),
      createElement('rect', {
        x: 120,
        y: y - 6,
        width: barW,
        height: 8,
        fill: LANGUAGE_COLORS[lang.name] || COLORS.secondary,
        rx: 4,
        ry: 4,
      }),
    ];
  }).flat();

  return createElement('svg', {
    width: 500,
    height: 210,
    viewBox: '0 0 500 210',
    xmlns: 'http://www.w3.org/2000/svg',
  }, [
    createElement('rect', {
      x: 0,
      y: 0,
      width: 500,
      height: 210,
      fill: '#0d0d0d',
      rx: 8,
      ry: 8,
      stroke: '#30363d',
      strokeWidth: 1,
    }),
    createElement('rect', {
      x: 0,
      y: 0,
      width: 500,
      height: statsHeight,
      fill: '#0d0d0d',
      rx: 8,
      ry: 8,
    }),
    createElement('rect', {
      x: 0,
      y: statsHeight,
      width: 500,
      height: 2,
      fill: '#30363d',
    }),
    ...statChildren,
    ...labelPaths.map(p => createElement('path', {
      d: p.d,
      fill: p.fill,
      transform: `translate(${p.x - 12}, ${p.y - (statsHeight + 16)}) scale(${10 / 10})`,
    })),
    ...langChildren,
  ]);
}

/**
 * Truncate a string.
 */
function truncate(text, max) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/**
 * Compute skill pill width.
 */
function skillPillWidth(name, hasIcon = false, fontSize = 11, height = 24) {
  const padX = 8;
  const textW = Math.max(name.length * fontSize * 0.55 + padX * 2, 40);
  const iconW = hasIcon ? height * 0.75 + 6 : 0;
  return Math.ceil(textW + iconW);
}

module.exports = {
  Icon,
  Badge,
  SocialButton,
  SkillPill,
  RepoCard,
  FollowerCard,
  StatsCard,
  MetricsPanel,
  LANGUAGE_COLORS,
  skillPillWidth,
  badgeWidth,
};
