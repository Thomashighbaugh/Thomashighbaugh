// @ts-check

const theme = require('./theme');

const { createElement } = require('./vice-renderer');

const COLORS = theme.colors;

/**
 * GitHub linguist language colors.
 * The repos API does not return them, so they are mapped here. Anything not
 * listed falls back to the theme primary.
 *
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
 * Compute the rendered width of a badge.
 * Exported so the build can size each badge's SVG viewport to fit exactly.
 *
 * @param {string} label
 * @param {string} value
 * @param {string|null} [logo]
 * @param {string} [style]
 * @param {number} [height]
 * @param {number} [fontSize]
 * @returns {number}
 */
function badgeWidth(label, value, logo = null, style = 'plastic', height = 28, fontSize = 11) {
  const isForTheBadge = style === 'for-the-badge';
  const padX = isForTheBadge ? 8 : 6;
  const labelW = Math.max(label.length * fontSize * 0.55 + padX * 2, 40);
  const valueW = Math.max(String(value).length * fontSize * 0.55 + padX * 2, 30);
  const logoW = logo ? height * 0.75 + 4 : 0;
  return Math.ceil(labelW + valueW + logoW + 4);
}

/**
 * Shields.io-style badge component.
 * Renders a pill-shaped badge with left label, right value, and optional logo.
 */
function Badge({
  label,
  value,
  color = COLORS.primary,
  logoColor = COLORS.white,
  logo,
  href,
  style = 'plastic',
  height = 28,
  fontSize = 11,
}) {
  const isForTheBadge = style === 'for-the-badge';
  const borderRadius = isForTheBadge ? 4 : height / 2;
  const padX = isForTheBadge ? 8 : 6;

  const labelW = Math.max(label.length * fontSize * 0.55 + padX * 2, 40);
  const valueW = Math.max(String(value).length * fontSize * 0.55 + padX * 2, 30);
  const logoW = logo ? height * 0.75 + 4 : 0;
  const totalW = labelW + valueW + logoW + 4;

  const children = [];

  if (logo) {
    children.push(
      createElement('div', {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: logoW,
          height: '100%',
        },
      }, [
        createElement('img', {
          src: logo,
          width: height * 0.6,
          height: height * 0.6,
          alt: '',
          style: { display: 'block' },
        }),
      ]),
    );
  }

  children.push(
    createElement('span', {
      style: {
        fontFamily: 'VT323, monospace',
        fontSize,
        color: logoColor,
        padding: `0 ${padX}px`,
        userSelect: 'none',
      },
    }, label),
  );

  children.push(
    createElement('span', {
      style: {
        fontFamily: 'VT323, monospace',
        fontSize,
        color: logoColor,
        padding: `0 ${padX}px`,
        userSelect: 'none',
        opacity: 0.9,
      },
    }, value),
  );

  const content = createElement('div', {
    style: {
      display: 'flex',
      alignItems: 'center',
      backgroundColor: color,
      borderRadius,
      height,
      width: totalW,
      overflow: 'hidden',
      boxSizing: 'border-box',
    },
  }, children);

  if (href) {
    return createElement('a', {
      href,
      style: { textDecoration: 'none', display: 'inline-block' },
    }, content);
  }

  return content;
}

/**
 * Pill-shaped social media button with icon + text.
 * Button text uses Knewave — your committed handwritten brush font.
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
  iconSize = 18,
}) {
  const borderRadius = height / 2;

  return createElement('a', {
    href,
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width,
      height,
      backgroundColor,
      borderRadius,
      textDecoration: 'none',
      boxSizing: 'border-box',
    },
  }, [
    createElement('div', {
      style: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        flex: 1,
        width: '100%',
        height: '100%',
        paddingLeft: 12,
        paddingRight: 12,
        boxSizing: 'border-box',
      },
    }, [
      ...(icon ? [
        createElement('img', {
          src: icon,
          width: iconSize,
          height: iconSize,
          alt: '',
          style: { flexShrink: 0, display: 'block', width: iconSize, height: iconSize },
        }),
      ] : []),
      createElement('span', {
        style: {
          fontFamily: 'Knewave, cursive',
          fontWeight: 400,
          fontSize,
          color: textColor,
          letterSpacing: '-0.2px',
          userSelect: 'none',
        },
      }, text),
    ]),
  ]);
}

/**
 * Skill pill — rounded chip with skill name and optional icon.
 */
function SkillPill({
  name,
  logo,
  color = COLORS.primary,
  logoColor = COLORS.white,
  highlighted = false,
  fontSize = 11,
  height = 24,
  width,
}) {
  const fill = highlighted ? COLORS.secondary : color;
  const totalW = width || skillPillWidth(name, logo, fontSize, height);
  const logoW = logo ? height * 0.75 + 6 : 0;
  const padX = 8;

  const children = [];

  if (logo) {
    children.push(
      createElement('div', {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: logoW,
          height: '100%',
        },
      }, [
        createElement('img', {
          src: logo,
          width: height * 0.6,
          height: height * 0.6,
          alt: '',
          style: { display: 'block' },
        }),
      ]),
    );
  }

  children.push(
    createElement('span', {
      style: {
        fontFamily: 'VT323, monospace',
        fontSize,
        color: logoColor,
        padding: `0 ${padX}px`,
        userSelect: 'none',
      },
    }, name),
  );

  return createElement('div', {
    style: {
      display: 'flex',
      alignItems: 'center',
      backgroundColor: fill,
      borderRadius: height / 2,
      height,
      width: totalW,
      overflow: 'hidden',
      boxSizing: 'border-box',
      marginBottom: 4,
      marginRight: 4,
    },
  }, children);
}

/**
 * Repository pin card — styled like GitHub's repo pin cards.
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
}) {
  const children = [];

  children.push(
    createElement('div', {
      style: {
        display: 'flex',
        alignItems: 'baseline',
        gap: 4,
        marginBottom: 6,
      },
    }, [
      createElement('span', {
        style: {
          fontFamily: 'VT323, monospace',
          fontSize: 12,
          color: COLORS.secondary,
          fontWeight: 700,
        },
      }, fullName.split('/').pop()),
    ]),
  );

  if (description) {
    children.push(
      createElement('div', {
        style: {
          fontFamily: 'VT323, monospace',
          fontSize: 10,
          color: COLORS.white,
          lineHeight: 1.4,
          marginBottom: 10,
          flex: 1,
        },
      }, truncate(description, 90)),
    );
  }

  const statItems = [];
  if (language) {
    statItems.push(
      createElement('div', {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        },
      }, [
        createElement('div', {
          style: {
            width: 8,
            height: 8,
            backgroundColor: languageColor || LANGUAGE_COLORS[language] || COLORS.primary,
            borderRadius: 2,
            flexShrink: 0,
          },
        }),
        createElement('span', {
          style: {
            fontFamily: 'VT323, monospace',
            fontSize: 9,
            color: '#8b949e',
          },
        }, language),
      ]),
    );
  }

  statItems.push(
    createElement('span', {
      style: {
        fontFamily: 'VT323, monospace',
        fontSize: 9,
        color: '#8b949e',
      },
    }, `★ ${stars}`),
  );

  statItems.push(
    createElement('span', {
      style: {
        fontFamily: 'VT323, monospace',
        fontSize: 9,
        color: '#8b949e',
      },
    }, `🍴 ${forks}`),
  );

  children.push(
    createElement('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      },
    }, statItems),
  );

  return createElement('a', {
    href,
    style: {
      display: 'block',
      width,
      height,
      backgroundColor: '#0d0d0d',
      border: '1px solid #30363d',
      borderRadius: 4,
      overflow: 'hidden',
      textDecoration: 'none',
      boxSizing: 'border-box',
    },
  }, [
    createElement('div', {
      style: {
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxSizing: 'border-box',
      },
    }, children),
  ]);
}

/**
 * Follower showcase card — avatar circle + name + bio + stats.
 */
function FollowerCard({
  avatarUrl,
  login,
  name,
  bio,
  publicRepos,
  followers,
  href,
  size = 150,
}) {
  const displayName = name || login;

  const children = [];

  children.push(
    createElement('img', {
      src: avatarUrl,
      width: size,
      height: size,
      alt: `Follower: ${login}`,
      style: {
        borderRadius: '50%',
        border: `2px solid ${COLORS.secondary}`,
        objectFit: 'cover',
      },
    }),
  );

  const infoChildren = [];
  infoChildren.push(
    createElement('strong', {
      style: {
        fontFamily: 'Knewave, cursive',
        fontSize: 18,
        color: COLORS.white,
      },
    }, displayName),
  );

  if (bio) {
    infoChildren.push(
      createElement('div', {
        style: {
          fontFamily: 'VT323, monospace',
          fontSize: 11,
          color: COLORS.lightPrimary,
          marginTop: 4,
          lineHeight: 1.3,
        },
      }, bio),
    );
  }

  infoChildren.push(
    createElement('div', {
      style: {
        fontFamily: 'VT323, monospace',
        fontSize: 10,
        color: COLORS.lightPrimary,
        marginTop: 6,
      },
    }, `${publicRepos} repos · ${followers} followers`),
  );

  children.push(
    createElement('div', {
      style: {
        marginTop: 10,
        textAlign: 'center',
      },
    }, infoChildren),
  );

  return createElement('a', {
    href,
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textDecoration: 'none',
      fontFamily: 'VT323, monospace',
    },
  }, children);
}

/**
 * Compact metrics panel — stars, forks, repos, commits as labeled values.
 */
function StatsCard({
  totalStars,
  totalForks,
  totalRepos,
  totalCommits,
  _width = 400,
  _height = 100,
}) {
  const labels = ['Stars', 'Forks', 'Repos', 'Commits'];
  const values = [totalStars, totalForks, totalRepos, totalCommits];

  const statChildren = values.map((value, i) => {
    const isLast = i === values.length - 1;
    return createElement('div', {
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        borderRight: isLast ? 'none' : '1px solid #30363d',
      },
    }, [
      createElement('span', {
        style: {
          fontFamily: 'VT323, monospace',
          fontSize: 20,
          color: COLORS.secondary,
          fontWeight: 700,
        },
      }, value.toLocaleString()),
      createElement('span', {
        style: {
          fontFamily: 'VT323, monospace',
          fontSize: 10,
          color: COLORS.white,
          textTransform: 'uppercase',
          letterSpacing: 1,
        },
      }, labels[i]),
    ]);
  });

  return createElement('div', {
    style: {
      display: 'flex',
      width: '100%',
      height: '100%',
      backgroundColor: '#0d0d0d',
      border: '1px solid #30363d',
      borderRadius: 8,
      overflow: 'hidden',
      fontFamily: 'VT323, monospace',
    },
  }, statChildren);
}

/**
 * Metrics panel — the four headline counters plus a most-used-languages
 * breakdown. Replaces the lowlighter/metrics dashboard.
 */
function MetricsPanel({
  totalStars,
  totalForks,
  totalRepos,
  totalCommits,
  languages = [],
  _width = 500,
  _height = 210,
}) {
  const statLabels = ['Stars', 'Forks', 'Repos', 'Commits'];
  const statValues = [totalStars, totalForks, totalRepos, totalCommits];
  const statsHeight = 86;

  const statChildren = statValues.map((value, i) => {
    const isLast = i === statValues.length - 1;
    return createElement('div', {
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        borderRight: isLast ? 'none' : '1px solid #30363d',
      },
    }, [
      createElement('span', {
        style: {
          fontFamily: 'VT323, monospace',
          fontSize: 20,
          color: COLORS.secondary,
          fontWeight: 700,
        },
      }, value.toLocaleString()),
      createElement('span', {
        style: {
          fontFamily: 'VT323, monospace',
          fontSize: 9,
          color: COLORS.white,
          textTransform: 'uppercase',
          letterSpacing: 1,
        },
      }, statLabels[i]),
    ]);
  });

  const children = [];

  children.push(
    createElement('div', {
      style: {
        display: 'flex',
        width: '100%',
        height: statsHeight,
        borderBottom: '1px solid #30363d',
      },
    }, statChildren),
  );

  if (languages.length > 0) {
    const maxCount = languages[0].count || 1;
    const langChildren = languages.map((lang) => {
      const pct = Math.max(6, Math.round(((lang.count || 0) / maxCount) * 100));
      return createElement('div', {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 4,
        },
      }, [
        createElement('div', {
          style: {
            width: 8,
            height: 8,
            backgroundColor: LANGUAGE_COLORS[lang.name] || COLORS.primary,
            borderRadius: 2,
            flexShrink: 0,
          },
        }),
        createElement('span', {
          style: {
            fontFamily: 'VT323, monospace',
            fontSize: 10,
            color: COLORS.white,
            width: 90,
            flexShrink: 0,
          },
        }, truncate(lang.name, 14)),
        createElement('div', {
          style: {
            flex: 1,
            height: 8,
            backgroundColor: '#1c1c1c',
            borderRadius: 4,
            overflow: 'hidden',
          },
        }, [
          createElement('div', {
            style: {
              width: `${pct}%`,
              height: '100%',
              backgroundColor: LANGUAGE_COLORS[lang.name] || COLORS.secondary,
              borderRadius: 4,
            },
          }),
        ]),
      ]);
    });

    children.push(
      createElement('div', {
        style: {
          padding: 10,
          display: 'flex',
          flexDirection: 'column',
        },
      }, [
        createElement('div', {
          style: {
            fontFamily: 'VT323, monospace',
            fontSize: 10,
            color: COLORS.lightPrimary,
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 6,
          },
        }, 'Most used languages'),
        ...langChildren,
      ]),
    );
  }

  return createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      backgroundColor: '#0d0d0d',
      border: '1px solid #30363d',
      borderRadius: 8,
      overflow: 'hidden',
      fontFamily: 'VT323, monospace',
    },
  }, children);
}

/**
 * Truncate a string to a maximum length, appending an ellipsis when cut.
 */
function truncate(text, max) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/**
 * Compute the rendered width of a skill pill.
 * Exported so the build can size each pill's SVG viewport to fit exactly.
 *
 * @param {string} name
 * @param {string|null} [logo]
 * @param {number} [fontSize]
 * @param {number} [height]
 * @returns {number}
 */
function skillPillWidth(name, logo = null, fontSize = 11, height = 24) {
  const padX = 8;
  const textW = Math.max(name.length * fontSize * 0.55 + padX * 2, 40);
  const logoW = logo ? height * 0.75 + 6 : 0;
  return Math.ceil(textW + logoW);
}

module.exports = {
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
