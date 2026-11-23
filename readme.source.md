<p align="center"><img src="https://raw.githubusercontent.com/Thomashighbaugh/Thomashighbaugh/main/src/resources/images/banner.svg" width="850" height="450" alt="Thomashighbaugh" /></p>

```vice width=800 alt="Profile dashboard"
<BentoBoard width={800} columns={3} />
```

```vice width=800 merge from=skillGroups alt="Skill wall"
<BentoGrid groups={items} columns={2} title="Skill Wall" />
```

<details>
<summary>Links</summary>

```vice width=440
<Badge
  label="Profile Views"
  value={profileViews}
  icon={viewsBadge.icon}
  color="#3c3c3c"
  logoColor="#ffffff"
  border="#ffffff"
  style="for-the-badge"
  height={48}
  valuePad={18}
/>
```

**Follower of the Day**

A randomly chosen follower — rotated every day. Go say hello.

```vice from=follower link=item.htmlUrl
<SocialButton icon={item.icon} text={item.login} height={38} />
```

**Projects I'm following**

```vice from=github.starredRepos link=item.href gap=2
<SocialButton text={item.fullName} height={38} />
```

</details>

<details>
<summary>Contact Me!</summary>

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

```vice from=socialLinks link=item.href gap=2
<SocialButton
  icon={item.icon}
  text={item.text}
  href={item.href}
  height={44}
/>
```

</details>
