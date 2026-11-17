<p align="center"><img src="https://raw.githubusercontent.com/Thomashighbaugh/Thomashighbaugh/main/src/resources/images/banner.svg" width="850" height="450" alt="Thomashighbaugh" /></p>

```vice from=headerBadges link=item.href
<Badge
  label={item.label}
  value={item.value}
  color="#3c3c3c"
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

<div align="center">
<strong>
Tom's Law of Software Development
</strong> 
<br>
<br>
 <em>The more convenient, useful or helpful a software is to use, <br> the more of a painful, tedious and/or absolutely miserable it was to <br>develop and then iteratively refine into such a form.</em>
</div>
<br>
<hr>
<br>

<div>

<details>
<summary>
Get in Touch
</summary>

<a href="https://links.thomasleonhighbaugh.me"><img align="left" width="120" src="https://raw.githubusercontent.com/Thomashighbaugh/Thomashighbaugh/main/src/resources/images/logo.png" /></a>

```vice from=socialLinks link=item.href
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

**Languages**

```vice width=800 merge from=skillPills.Languages
<CategoryWall items={item.items} pillHeight={30} />
```

**Frontend**

```vice width=800 merge from=skillPills.Frontend
<CategoryWall items={item.items} pillHeight={30} />
```

**Backend & Databases**

```vice width=800 merge from="skillPills.'Backend & Databases'"
<CategoryWall items={item.items} pillHeight={30} />
```

**DevOps & Tools**

```vice width=800 merge from="skillPills.'DevOps & Tools'"
<CategoryWall items={item.items} pillHeight={30} />
```

**Design**

```vice width=800 merge from=skillPills.Design
<CategoryWall items={item.items} pillHeight={30} />
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

%{recentworks}

</details>

<details>
<summary>🌟 Projects I'm Following
</summary>

<em>Repos I've starred that I find interesting or useful:</em>

<br>

```vice from=github.starredRepos link=item.href
<RepoCard
  name={item.name}
  fullName={item.fullName}
  description={item.description}
  stars={item.stars}
  forks={item.forks}
  language={item.language}
  languageColor={item.languageColor}
  href={item.href}
  width={260}
  height={126}
/>
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
  width={500}
/>
```

</details>

</div>