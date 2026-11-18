<p align="center"><img src="https://raw.githubusercontent.com/Thomashighbaugh/Thomashighbaugh/main/src/resources/images/banner.svg" width="850" height="450" alt="Thomashighbaugh" /></p>

```vice width=800 alt="Profile dashboard" linkDetails linkDetailsLabel="Links"
<BentoBoard width={800} columns={3} />
```

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
