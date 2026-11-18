<p align="center"><img src="https://raw.githubusercontent.com/Thomashighbaugh/Thomashighbaugh/main/src/resources/images/banner.svg" width="850" height="450" alt="Thomashighbaugh" /></p>

```vice from=headerBadges link=item.href gap=2
<Badge
  label={item.label}
  value={item.value}
  color="#3c3c3c"
  logoColor="#ffffff"
  border="#ffffff"
  icon={item.icon}
  style="for-the-badge"
  height={36}
/>
```

<div align="center">
<details>
<summary>
About Me
</summary>
<img align="right" height="150" src="https://raw.githubusercontent.com/Thomashighbaugh/Thomashighbaugh/main/src/resources/images/logo.png" />
<ul align="left">
<li align="left">Building AI-powered tools and infrastructure — from agentic coding workflows and multi-agent orchestration systems to LLM-integrated applications. Check out my <a href="https://github.com/Thomashighbaugh">repos</a> for a sense of the work.</li>
<li align="left"><a href="https://github.com/Sanatana-Linux/nixos-config">NixOS</a> + <a href="https://github.com/Sanatana-Linux/nixos-awesomewm">AwesomeWM</a> + <a href="https://github.com/Thomashighbaugh/nvim-forge">Neovim</a> user (...by choice)</li>
</ul>
</details>
</div>

```vice width=800 alt="Tom's Law of Software Development"
<LawPanel width={800} titleSize={34} bodySize={16} />
```
<br>
<hr>
<br>

<div>

<details>
<summary>
Get in Touch
</summary>

```vice from=socialLinks link=item.href gap=2
<SocialButton
  icon={item.icon}
  text={item.text}
  href={item.href}
  height={44}
/>
```

<br clear="both">

</details>

<details>
<summary>Skill Wall
</summary>

```vice width=800 merge from=skillGroups alt="Skill wall"
<BentoGrid groups={items} columns={2} pillHeight={30} width={800} />
```

</details>

<details>
<summary>Follower Showcase </summary>

```vice width=340 height=210 from=follower link=item.href
<FollowerCard
  icon={item?.icon}
  login={item?.login || 'Thomashighbaugh'}
  name={item?.name || 'Thomashighbaugh'}
  bio={item?.bio || ''}
  publicRepos={item?.publicRepos || 0}
  followers={item?.followers || 0}
  width={340}
  height={210}
/>
```

<em><small>Here is one of the awesome individuals that follows me on GitHub, with a new follower highlighted daily!</small></em>

</details>

<details>
<summary>
⚡ Recent Activity
</summary>

```vice width=800 merge from=activity alt="Recent activity"
<ActivityPanel items={items} width={800} />
```

</details>

<details>
<summary>🌟 Projects I'm Following
</summary>

<em>Repos I've starred that I find interesting or useful:</em>

<br>

```vice width=800 merge from=github.starredRepos alt="Projects I am following"
<ProjectsGrid items={items} width={800} columns={2} />
```

</details>

<details>
<summary>
Account Statistics
</summary>

```vice width=500
<MetricsPanel
  totalStars={github?.stats?.totalStars || 0}
  totalForks={github?.stats?.totalForks || 0}
  totalRepos={github?.stats?.totalRepos || 0}
  totalCommits={github?.stats?.totalCommits || 0}
  languages={(github?.languages || []).slice(0, 6)}
  orgs={github?.scopes || []}
  width={500}
/>
```

</details>

</div>