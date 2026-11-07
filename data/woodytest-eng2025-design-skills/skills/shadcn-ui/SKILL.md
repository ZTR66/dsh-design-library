---
name: shadcn-ui
description: "Build polished product interfaces with shadcn/ui — React components copied into your repo on Radix UI and Tailwind CSS, owned as source. Use when initialising the CLI, adding components, theming with oklch tokens, or composing dashboards, tables, dialogs and forms that should not look like a default template. Trigger words: shadcn, radix ui, tailwind 组件库, 后台管理界面, design system, 组件库, 主题定制, dashboard ui."
license: MIT
metadata:
  author: Woodytest2025
  version: "1.0.0"
  category: design-ui
  keywords: shadcn, radix-ui, tailwindcss, react, components, theming, oklch, design-system, dashboard
  source: https://github.com/shadcn-ui/ui
  stars: "127k"
allowed-tools: bash read write
---

# shadcn/ui — Components You Own

shadcn/ui is not a dependency you import. It is a set of **component sources** the CLI copies into your repo:
`components/ui/button.tsx` is a file you can open, read and edit. Radix supplies behaviour (focus, keyboard,
ARIA), Tailwind supplies styling, and that file is the seam between them.

That ownership is why it can look designed: nothing hides behind a package version, so radius, borders,
spacing and colour are local decisions rather than library defaults, and the shipped look is only a starting
point. The method never changes: initialise once, add only the primitives you use, theme the semantic tokens,
then compose pages from those primitives instead of raw `div`s.

## When to use it

| Situation | Why it fits |
| --- | --- |
| Product UI that must survive iteration | You edit the component, not a dependency's props |
| Dashboards, admin, settings, billing | Tables, dialogs, sidebars and charts cover the shape |
| A brand needs its own look | Tokens are CSS variables — restyle from one block |
| Accessibility is a requirement | Radix owns focus traps, typeahead and ARIA |
| Next.js, Vite, React Router, Astro | Any React 19 + Tailwind setup works |

**Do not use it when:** you need a throwaway prototype in an hour; the stack is not React (Vue/Svelte ports are separate projects); nobody will maintain vendored code; or it is one landing page where hand-written markup plus a few primitives wins.

## Install and init

CLI 4.x ships as `shadcn`; the `shadcn-ui` package is deprecated, so translate `npx shadcn-ui@latest` to `npx shadcn@latest`.

```bash
npx shadcn@latest init                     # interactive: template, primitive library, preset, CSS variables
npx shadcn@latest init -d                  # defaults: --template=next --preset=nova
npx shadcn@latest create -t vite --name acme   # scaffold a new project instead of adding to one
npx shadcn@latest add button card dialog table badge input label select sonner
npx shadcn@latest add sidebar-07 -c apps/web             # monorepo: target one app
npx shadcn@latest add https://example.com/r/pricing.json  # any registry item by URL
npx shadcn@latest add button --dry-run --view button.tsx   # preview changes before writing
npx shadcn@latest apply a2r6bw --only theme                 # re-apply a preset's theme or fonts
npx shadcn@latest diff button              # how your copy differs from upstream
npx shadcn@latest build                    # emit registry JSON from registry.json
```

CLI 4.x flags worth remembering. `init`: `-t/--template <next|vite|start|react-router|laravel|astro>`,
`-b/--base <base|radix|aria>` (which primitive library the components are generated on), `-p/--preset`,
`--css-variables` / `--no-css-variables`, `--monorepo` / `--no-monorepo`, `--rtl`, `-y/--yes`, `-c/--cwd`, `-n/--name`.
`add`: `-y/--yes`, `-o/--overwrite`, `-c/--cwd`, `-a/--all`, `-p/--path`, `--dry-run`, `--diff [path]`, `--view [path]`.
In a monorepo each app keeps its own `components.json`, and `--cwd` picks one.

`init` writes `components.json`, installs `clsx`, `tailwind-merge`, `class-variance-authority`, `lucide-react` and `tw-animate-css`, creates `lib/utils.ts`, injects tokens into your CSS and wires the `@/*` alias:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york", "rsc": true, "tsx": true,
  "tailwind": { "config": "", "css": "app/globals.css", "baseColor": "neutral", "cssVariables": true, "prefix": "" },
  "iconLibrary": "lucide",
  "aliases": { "components": "@/components", "utils": "@/lib/utils", "ui": "@/components/ui", "lib": "@/lib", "hooks": "@/hooks" },
  "registries": {}
}
```

`tailwind.config` is empty on v4 (no config file needed) and points at `tailwind.config.ts` on v3;
`cssVariables: false` gives literal colour classes and makes theming later much harder. **Manual setup**: alias
`@/*` in `tsconfig.json`, add `lib/utils.ts` with `cn()`, paste the token block into `globals.css`, add
`components.json`, copy components from the docs.

## Anatomy and conventions

Every primitive has the same shape, and reading one teaches you the other fifty:

```tsx
// components/ui/button.tsx — structure, abridged (plus `import * as React from "react"`)
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const buttonVariants = cva("inline-flex items-center gap-2 rounded-md text-sm font-medium", {
  variants: {
    variant: { default: "bg-primary text-primary-foreground", outline: "border bg-background" },
    size: { default: "h-9 px-4 py-2", sm: "h-8 px-3 text-xs", icon: "size-9" },
  },
  defaultVariants: { variant: "default", size: "default" },
});
function Button({ className, variant, size, asChild = false, ...props }:
  React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
```

- **`components/ui/*` is vendor territory** — one primitive per file, no data fetching, no app logic; your compositions live beside it (`components/app/*`) and import from `ui/`.
- **`cn()` = clsx + tailwind-merge** — later classes win, so `<Button className="rounded-full px-5">` needs no `!important`; **CVA** keeps `variant`/`size` typed and lets a `<Link>` wear `buttonVariants()`.
- **`data-slot` on every element** (`data-slot="dialog-content"`, `"card-title"`) is a stable CSS hook.
- **Radix supplies behaviour** from the unified `radix-ui` package; older files import `@radix-ui/react-*` directly. **`asChild`** forwards styling to one child instead of rendering another node.
- **Forms** use `react-hook-form` + `zod` with `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`; newer projects also get `Field`, `FieldGroup`, `FieldLabel`, `FieldError`.

## Theming

Everything renders from semantic tokens, never literal colours. That single rule makes a theme swappable, dark mode nearly free, and a rebrand a ten-line diff.

| Token | Used for |
| --- | --- |
| `--background` / `--foreground` | Page surface, default text |
| `--card`, `--popover` (+ `-foreground`) | Raised surfaces — always paired |
| `--primary` / `--primary-foreground` | The one accent: primary buttons, active nav |
| `--secondary`, `--accent`, `--muted` (+ `-foreground`) | Hover fills, subdued buttons, metadata, empty state |
| `--destructive` | Errors and destructive actions; the v4 default pairs it with white text |
| `--border`, `--input`, `--ring` | Hairlines, field outlines, focus rings |
| `--chart-1…5`, `--sidebar-*` | Chart series; sidebar surfaces and their own states |
| `--radius` | Base radius; `sm`/`md`/`lg`/`xl` derive from it |

```css
/* app/globals.css — Tailwind v4 */
@import "tailwindcss";
@import "tw-animate-css";
@custom-variant dark (&:is(.dark *));

:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);      --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);     --primary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.97 0 0);        --muted-foreground: oklch(0.556 0 0);
  --border: oklch(0.922 0 0);      --ring: oklch(0.708 0 0);
  /* …card, popover, secondary, accent, destructive, input, chart-1…5, sidebar-* */
}
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  /* one line per token, or bg-primary / text-muted-foreground do not exist */
  --radius-sm: calc(var(--radius) - 4px);
  --radius-lg: var(--radius);
}
```

Values are **oklch** (`oklch(L C H)`: lightness 0–1, chroma 0–0.4, hue degrees); `--chart-1` and `--primary` at equal lightness read as one family, so keep hues close on purpose. Never mix formats: `hsl(var(--primary))` over an oklch value is invalid CSS, so the colour silently disappears.

Dark mode is a class on `<html>`: mirror every token under `.dark`, set `next-themes` to `attribute="class"`, add `suppressHydrationWarning` to `<html>`, and keep the `@custom-variant dark` line so `dark:` follows the class.

**Adding a brand colour without breaking contrast** — touch the accent pair in both modes, leave neutrals neutral:

- `--primary: oklch(0.55 0.18 255)` with `--primary-foreground: oklch(0.985 0 0)`; verify 4.5:1 on the pair.
- In `.dark`, lift lightness and drop chroma (`oklch(0.72 0.16 255)` with a dark foreground) so it glows.
- Point `--ring` at the same hue at 40–50% alpha so focus stays visible on `--background`, `--card` and `--sidebar`; keep `--muted`/`--border` at chroma ≤ 0.01 and reuse the accent for links and one chart series.

## Composing a designed page

Hero, stat cards, table, dialog — the shape of most product screens. The order of decisions matters more than the components: container → vertical rhythm → hierarchy → data → one action. All pieces import from `@/components/ui/*`; only the dialog needs `"use client"`.

```tsx
// hero + stat cards — in <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12">
<header className="flex flex-wrap items-end justify-between gap-6">
  <div className="space-y-2">
    <p className="text-xs font-medium text-muted-foreground uppercase">Workspace</p>
    <h1 className="text-3xl font-semibold tracking-tight text-balance">Team &amp; billing</h1>
    <p className="max-w-prose text-sm text-muted-foreground">Manage seats and invite teammates.</p>
  </div>
  <InviteDialog />
</header>
<section className="grid gap-4 sm:grid-cols-3">
  {stats.map((s) => (
    <Card key={s.label} className="gap-1">
      <CardHeader><CardDescription>{s.label}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">{s.value}</CardTitle></CardHeader>
    </Card>
  ))}
</section>
```

```tsx
// table — flush to the card edges, one line per row, role as the only badge
<Table>
  <TableHeader><TableRow>
    <TableHead className="pl-6">Member</TableHead><TableHead>Role</TableHead>
    <TableHead className="pr-6 text-right">Last active</TableHead>
  </TableRow></TableHeader>
  <TableBody>
    {members.map((m) => (
      <TableRow key={m.email}>
        <TableCell className="pl-6 font-medium">{m.name}</TableCell>
        <TableCell><Badge variant={m.owner ? "default" : "secondary"}>{m.role}</Badge></TableCell>
        <TableCell className="pr-6 text-right tabular-nums text-muted-foreground">{m.active}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

The dialog is a client island: the trigger lives in the page, the form body is its own component, `DialogTitle` is mandatory, and Radix returns focus to the trigger on close.

```tsx
"use client";
// inside InviteDialog(); open/setOpen come from useState
<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild><Button>Invite teammate</Button></DialogTrigger>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Invite a teammate</DialogTitle>
      <DialogDescription>They get an email with a join link.</DialogDescription>
    </DialogHeader>
    <InviteForm onDone={() => setOpen(false)} />
  </DialogContent>
</Dialog>
```

**What separates a shadcn demo from a designed product:**

| Lever | Demo | Designed |
| --- | --- | --- |
| Radius | Mixed `md`/`lg`/`xl` per section | One `--radius`; every surface agrees |
| Borders | On every card, row and input | On inputs and real dividers; spacing separates the rest |
| Accent | Primary on buttons, badges, links, icons | Primary once per screen; the rest muted or outline |
| Spacing | Improvised `gap-3`/`mt-4` | 8px rhythm (8/16/24/40/64), section gap 40–48, page padding 48–64 |
| Type | Three sizes, all semibold | One display size, body `text-sm`, meta `text-xs` muted, numbers `tabular-nums` |
| Motion | Bouncy everywhere | `tw-animate-css` defaults, 150–200ms, hover colour only, reduced motion respected |

Empty, loading and error states are part of "designed": pair `Skeleton` with the real layout, use `Empty` for zero-data screens, and never ship a table that renders nothing.

## Customisation patterns

1. **Override with `className`** — `cn()` plus tailwind-merge resolves conflicts, so `<Button className="rounded-full px-5">` needs no `!important`.
2. **Extend variants, don't fork** — `cva(buttonVariants({ size: "lg" }), { variants: { tone: … } })`, or wrap: `function DangerButton(props) { return <Button variant="destructive" {...props} /> }`.
3. **Wrap for app defaults** — page headers, section shells, money cells: built once from `ui/` primitives.
4. **Style through `data-slot`** — `[data-slot="card-title"] { letter-spacing: -0.01em }` in globals, or `group-data-[slot=card]:…` from a parent.
5. **Edit in place** only for universal changes (focus-ring width, border colour, control height). `npx shadcn@latest diff` shows your drift, and `add --overwrite` discards it — check first.
6. **Publish a registry** when several apps share components: `registry.json` items typed `registry:ui`, then `shadcn build`, then install by URL.

## Accessibility and pitfalls

- **`DialogTitle` is required.** Without it Radix warns and screen readers announce an unnamed dialog; use `sr-only` if the design has no visible title, and `AlertDialogTitle` in destructive confirmations.
- **`Select` has no accessible name of its own** — give the trigger an `id` and a `<Label htmlFor>`; a `SelectValue` placeholder is not a label. Same for `Input`, `Textarea`, `Switch`, `Checkbox`.
- **Toasts:** `Sonner` is current (`<Toaster />` in the root layout, `toast()` from `sonner`); the old `Toast` is deprecated. Do not ship both.
- **Form errors** stay announced only if the input sits inside `FormControl`, which wires `aria-describedby` and `aria-invalid`. Never signal an error by colour alone; icon-only buttons need `aria-label`.
- **React 19:** `ref` is a plain prop, so current sources use `React.ComponentProps<"button">` and spread props — no `forwardRef`. Old `forwardRef` snippets still compile; don't mix both wrappers in one file.
- **Tailwind v3 vs v4:** v3 = `tailwind.config.ts`, `@tailwind base/components/utilities`, tokens as `hsl(var(--primary))`, `tailwindcss-animate`. v4 = `@import "tailwindcss"`, `@theme inline`, raw oklch, `tw-animate-css`, no config file. Mixing the two gives invisible borders and black text.
- **Peer dependencies** arrive with `add`: `radix-ui`, `lucide-react`, `class-variance-authority`, `clsx`,
  `tailwind-merge`, `tw-animate-css`, plus extras — `recharts`, `@tanstack/react-table`, `react-hook-form` +
  `zod`, `sonner`, `vaul`, `react-day-picker`, `cmdk`, `embla-carousel-react`, `input-otp`. Nothing lives in
  `node_modules` to patch; open `components/ui/` instead.

## Reference files

- `references/components.md` — categorised component index, one-line "use when" each, plus blocks and charts.

## Checklist before shipping

- [ ] `components.json` committed, and `add` ran against the right app (`-c` in monorepos)
- [ ] No literal colours in app code — everything reads `bg-primary`, `text-muted-foreground`, `border`
- [ ] Rebrand touches only `--primary`/`--primary-foreground`/`--ring`, in light **and** dark, contrast checked
- [ ] One radius family, one accent, borders only where they carry meaning
- [ ] 8px spacing rhythm, capped container width, `text-balance` headings, `tabular-nums` numbers
- [ ] Every dialog, sheet and alert dialog has a title; every field has a real label
- [ ] Empty, loading and error states exist for every table and list
- [ ] Keyboard pass: tab order, visible `--ring`, Escape closes overlays, focus returns to the trigger
- [ ] `npx shadcn@latest diff` reviewed before any `add --overwrite` on edited files
