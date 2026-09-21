# Template preview workflow

Generate the gallery PDF and JPG from the same representative resume fixture used by the production PDF renderer:

```sh
pnpm --filter @headcv/tooling templates:preview -- scizor
```

During design review, pass a temporary output directory so approved public assets remain untouched:

```sh
pnpm --filter @headcv/tooling templates:preview -- scizor /tmp/headcv-template-review
```

Review both generated files before committing them. The renderer fixes the preview width at 1055 pixels and keeps the
source PDF alongside the JPG so layout, text selection, and multipage behavior can be inspected independently.
