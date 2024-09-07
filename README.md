# waku-sst-demo monorepo

This project uses bun for monorepo package management and SST Ion for infrastructure management.

Reference https://github.com/sst/ion/tree/dev/examples/aws-monorepo

Before you initialize SST, our custom SST component references files that don't exist and that causes the init step to fail before it even starts. To fix this, copy the `sst-facade` folder to `.sst`:

```sh
cp -r sst-facade .sst
```

Then install dependencies:

```sh
bun i
```

Then you should be able to start the SST dev environment.

```sh
bun x sst dev
```

And deploy to AWS.

```sh
bun x sst deploy --stage production
```

Experimental React 19 website via Waku - [https://waku.gg/](https://waku.gg/)
via fork / patch that adds an AWS SST build output option.

[https://github.com/rmarscher/waku/tree/aws-lambda-sst/packages/waku](https://github.com/rmarscher/waku/tree/aws-lambda-sst/packages/waku)
