# sst-facade

Before you initialize SST, our custom components reference files that don't exist and that causes the init step to fail before it even starts. To fix this, we are copying the SST files here. Copy this directory to .sst:

```bash
cp -r sst-facade .sst
```

Then you can run `bun x sst init` and it should work.
