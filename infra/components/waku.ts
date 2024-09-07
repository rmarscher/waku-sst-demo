import {
	type ComponentResourceOptions,
	type Output,
	all,
	output,
} from "@pulumi/pulumi";
import * as fs from "node:fs";
import * as path from "node:path";
import type { Bucket } from "../../.sst/platform/src/components/aws/bucket.js";
import type { Cdn } from "../../.sst/platform/src/components/aws/cdn.js";
import type {
	FunctionArgs,
	Function as SstAwsFunction,
} from "../../.sst/platform/src/components/aws/function.js";
import { URL_UNAVAILABLE } from "../../.sst/platform/src/components/aws/linkable.js";
import { buildApp } from "../../.sst/platform/src/components/base/base-ssr-site.js";
import { Component } from "../../.sst/platform/src/components/component.js";
import type { DevArgs } from "../../.sst/platform/src/components/dev.js";
import { Link } from "../../.sst/platform/src/components/link.js";
import {
	type Plan,
	type SsrSiteArgs,
	createBucket,
	createDevServer,
	createServersAndDistribution,
	prepare,
	useCloudFrontFunctionHostHeaderInjection,
	validatePlan,
} from "./ssr-site.js";

export type { Plan };
export interface WakuArgs extends SsrSiteArgs {
	/**
	 * Ability to hook into and modify the SSR site plan before it's validated.
	 * @param plan
	 * @returns
	 */
	beforePlanValidate?: (plan: Plan) => void;

	/**
	 * Configure how this component works in `sst dev`.
	 *
	 * :::note
	 * In `sst dev` your Remix app is run in dev mode; it's not deployed.
	 * :::
	 *
	 * Instead of deploying your Remix app, this starts it in dev mode. It's run
	 * as a separate process in the `sst dev` multiplexer. Read more about
	 * [`sst dev`](/docs/reference/cli/#dev).
	 */
	dev?: DevArgs["dev"];
	/**
	 * The number of instances of the [server function](#nodes-server) to keep warm. This is useful for cases where you are experiencing long cold starts. The default is to not keep any instances warm.
	 *
	 * This works by starting a serverless cron job to make _n_ concurrent requests to the server function every few minutes. Where _n_ is the number of instances to keep warm.
	 *
	 * @default `0`
	 */
	warm?: SsrSiteArgs["warm"];
	/**
	 * Permissions and the resources that the [server function](#nodes-server) in your Waku site needs to access. These permissions are used to create the function's IAM role.
	 *
	 * :::tip
	 * If you `link` the function to a resource, the permissions to access it are
	 * automatically added.
	 * :::
	 *
	 * @example
	 * Allow reading and writing to an S3 bucket called `my-bucket`.
	 * ```js
	 * {
	 *   permissions: [
	 *     {
	 *       actions: ["s3:GetObject", "s3:PutObject"],
	 *       resources: ["arn:aws:s3:::my-bucket/*"]
	 *     },
	 *   ]
	 * }
	 * ```
	 *
	 * Perform all actions on an S3 bucket called `my-bucket`.
	 *
	 * ```js
	 * {
	 *   permissions: [
	 *     {
	 *       actions: ["s3:*"],
	 *       resources: ["arn:aws:s3:::my-bucket/*"]
	 *     },
	 *   ]
	 * }
	 * ```
	 *
	 * Grant permissions to access all resources.
	 *
	 * ```js
	 * {
	 *   permissions: [
	 *     {
	 *       actions: ["*"],
	 *       resources: ["*"]
	 *     },
	 *   ]
	 * }
	 * ```
	 */
	permissions?: SsrSiteArgs["permissions"];
	/**
	 * Path to the directory where your Waku site is located.  This path is relative to your `sst.config.ts`.
	 *
	 * By default it assumes your Waku site is in the root of your SST app.
	 * @default `"."`
	 *
	 * @example
	 *
	 * If your Waku site is in a package in your monorepo.
	 *
	 * ```js
	 * {
	 *   path: "packages/web"
	 * }
	 * ```
	 */
	path?: SsrSiteArgs["path"];
	/**
	 * [Link resources](/docs/linking/) to your Waku site. This will:
	 *
	 * 1. Grant the permissions needed to access the resources.
	 * 2. Allow you to access it in your site using the [SDK](/docs/reference/sdk/).
	 *
	 * @example
	 *
	 * Takes a list of resources to link to the function.
	 *
	 * ```js
	 * {
	 *   link: [bucket, stripeKey]
	 * }
	 * ```
	 */
	link?: SsrSiteArgs["link"];
	/**
	 * Set [environment variables](https://waku.gg/#environment-variables) in your Waku site. These are made available:
	 *
	 * 1. In `waku build`, they are loaded into `import.meta.env`.
	 * 2. Locally while running `sst dev waku dev`.
	 *
	 * :::tip
	 * You can also `link` resources to your Waku site and access them in a type-safe way with the [SDK](/docs/reference/sdk/). We recommend linking since it's more secure.
	 * :::
	 *
	 * Recall that in Waku, you need to prefix your environment variables with `WAKU_PUBLIC_` to access them on the client-side. [Read more here](https://waku.gg/#environment-variables).
	 *
	 * @example
	 * ```js
	 * {
	 *   environment: {
	 *     API_URL: api.url,
	 *     // Accessible on the client-side
	 *     WAKU_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_123"
	 *   }
	 * }
	 * ```
	 */
	environment?: SsrSiteArgs["environment"];
	/**
	 * Set a custom domain for your Waku site.
	 *
	 * Automatically manages domains hosted on AWS Route 53, Cloudflare, and Vercel. For other
	 * providers, you'll need to pass in a `cert` that validates domain ownership and add the
	 * DNS records.
	 *
	 * :::tip
	 * Built-in support for AWS Route 53, Cloudflare, and Vercel. And manual setup for other
	 * providers.
	 * :::
	 *
	 * @example
	 *
	 * By default this assumes the domain is hosted on Route 53.
	 *
	 * ```js
	 * {
	 *   domain: "example.com"
	 * }
	 * ```
	 *
	 * For domains hosted on Cloudflare.
	 *
	 * ```js
	 * {
	 *   domain: {
	 *     name: "example.com",
	 *     dns: sst.cloudflare.dns()
	 *   }
	 * }
	 * ```
	 *
	 * Specify a `www.` version of the custom domain.
	 *
	 * ```js
	 * {
	 *   domain: {
	 *     name: "domain.com",
	 *     redirects: ["www.domain.com"]
	 *   }
	 * }
	 * ```
	 */
	domain?: SsrSiteArgs["domain"];
	/**
	 * The command used internally to build your Waku site.
	 *
	 * @default `"npm run build"`
	 *
	 * @example
	 *
	 * If you want to use a different build command.
	 * ```js
	 * {
	 *   buildCommand: "yarn build"
	 * }
	 * ```
	 */
	buildCommand?: SsrSiteArgs["buildCommand"];
	/**
	 * Configure how the Waku site assets are uploaded to S3.
	 *
	 * By default, this is set to the following. Read more about these options below.
	 * ```js
	 * {
	 *   assets: {
	 *     textEncoding: "utf-8",
	 *     versionedFilesCacheHeader: "public,max-age=31536000,immutable",
	 *     nonVersionedFilesCacheHeader: "public,max-age=0,s-maxage=86400,stale-while-revalidate=8640"
	 *   }
	 * }
	 * ```
	 */
	assets?: SsrSiteArgs["assets"];
	/**
	 * Configure the [server function](#nodes-server) in your Waku site to connect
	 * to private subnets in a virtual private cloud or VPC. This allows your site to
	 * access private resources.
	 *
	 * @example
	 * ```js
	 * {
	 *   vpc: {
	 *     securityGroups: ["sg-0399348378a4c256c"],
	 *     subnets: ["subnet-0b6a2b73896dc8c4c", "subnet-021389ebee680c2f0"]
	 *   }
	 * }
	 * ```
	 */
	vpc?: SsrSiteArgs["vpc"];
	/**
	 * Configure the Waku site to use an existing CloudFront cache policy.
	 *
	 * :::note
	 * CloudFront has a limit of 20 cache policies per account, though you can request a limit
	 * increase.
	 * :::
	 *
	 * By default, a new cache policy is created for it. This allows you to reuse an existing
	 * policy instead of creating a new one.
	 *
	 * @default A new cache plolicy is created
	 * @example
	 * ```js
	 * {
	 *   cachePolicy: "658327ea-f89d-4fab-a63d-7e88639e58f6"
	 * }
	 * ```
	 */
	cachePolicy?: SsrSiteArgs["cachePolicy"];

	server?: {
		/**
		 * The amount of memory allocated to the server function.
		 * Takes values between 128 MB and 10240 MB in 1 MB increments.
		 *
		 * @default `"1024 MB"`
		 * @example
		 * ```js
		 * {
		 *   server: {
		 *     memory: "2048 MB"
		 *   }
		 * }
		 * ```
		 */
		memory?: FunctionArgs["memory"];
		/**
		 * The [architecture](https://docs.aws.amazon.com/lambda/latest/dg/foundation-arch.html)
		 * of the server function.
		 *
		 * @default `"x86_64"`
		 * @example
		 * ```js
		 * {
		 *   server: {
		 *     architecture: "arm64"
		 *   }
		 * }
		 * ```
		 */
		architecture?: FunctionArgs["architecture"];

		function?: Partial<FunctionArgs>;
	};
}

/**
 * The `Waku` component lets you deploy a [Waku](https://waku.gg/) site to AWS.
 *
 * @example
 *
 * #### Minimal example
 *
 * Deploy the Waku site that's in the project root.
 *
 * ```js title="sst.config.ts"
 * new sst.aws.Waku("MyWeb");
 * ```
 *
 * #### Change the path
 *
 * Deploys the Waku site in the `my-waku-app/` directory.
 *
 * ```js {2} title="sst.config.ts"
 * new sst.aws.Waku("MyWeb", {
 *   path: "my-waku-app/"
 * });
 * ```
 *
 * #### Add a custom domain
 *
 * Set a custom domain for your Waku site.
 *
 * ```js {2} title="sst.config.ts"
 * new sst.aws.Waku("MyWeb", {
 *   domain: "my-app.com"
 * });
 * ```
 *
 * #### Redirect www to apex domain
 *
 * Redirect `www.my-app.com` to `my-app.com`.
 *
 * ```js {4} title="sst.config.ts"
 * new sst.aws.Waku("MyWeb", {
 *   domain: {
 *     name: "my-app.com",
 *     redirects: ["www.my-app.com"]
 *   }
 * });
 * ```
 *
 * #### Link resources
 *
 * [Link resources](/docs/linking/) to your Waku site. This will grant permissions
 * to the resources and allow you to access it in your site.
 *
 * ```ts {4} title="sst.config.ts"
 * const bucket = new sst.aws.Bucket("MyBucket");
 *
 * new sst.aws.Waku("MyWeb", {
 *   link: [bucket]
 * });
 * ```
 *
 * You can use the [SDK](/docs/reference/sdk/) to access the linked resources
 * in your Waku site.
 *
 * ```ts title="src/pages/index.waku"
 * import { Resource } from "sst";
 *
 * console.log(Resource.MyBucket.name);
 * ```
 */
export class Waku extends Component implements Link.Linkable {
	private cdn?: Output<Cdn>;
	private assets?: Bucket;
	private server?: Output<SstAwsFunction>;
	private devUrl?: Output<string>;

	constructor(
		name: string,
		args: WakuArgs = {},
		opts: ComponentResourceOptions = {},
	) {
		super(__pulumiType, name, args, opts);

		const { sitePath, partition } = prepare(args, opts);

		if ($dev) {
			const server = createDevServer(this, name, args);
			this.devUrl = output(args.dev?.url ?? URL_UNAVAILABLE);
			this.registerOutputs({
				_metadata: {
					mode: "placeholder",
					path: sitePath,
					server: server.arn,
				},
				_receiver: {
					directory: sitePath,
					links: output(args.link || [])
						.apply(Link.build)
						.apply((links) => links.map((link) => link.name)),
					aws: {
						role: server.nodes.role.arn,
					},
					environment: args.environment,
				},
				_dev: {
					links: output(args.link || [])
						.apply(Link.build)
						.apply((links) => links.map((link) => link.name)),
					aws: {
						role: server.nodes.role.arn,
					},
					environment: args.environment,
					directory: output(args.dev?.directory).apply(
						(dir) => dir || sitePath,
					),
					autostart: output(args.dev?.autostart).apply((val) => val ?? true),
					command: output(args.dev?.command).apply(
						(val) => val || "npm run dev",
					),
				},
			});
			return;
		}

		const { access, bucket } = createBucket(this, name, partition, args);
		const outputPath = buildApp(this, name, args, sitePath, args.buildCommand);
		const plan = buildPlan();
		// console.log(plan);
		const { distribution, ssrFunctions, edgeFunctions } =
			createServersAndDistribution(
				this,
				name,
				args,
				outputPath,
				access,
				bucket,
				plan,
			);
		const serverFunction = ssrFunctions[0] ?? Object.values(edgeFunctions)[0];

		this.assets = bucket;
		this.cdn = distribution;
		this.server = serverFunction;
		this.registerOutputs({
			_hint: all([this.cdn.domainUrl, this.cdn.url]).apply(
				([domainUrl, url]) => domainUrl ?? url,
			),
			_metadata: {
				mode: "deployed",
				path: sitePath,
				url: distribution.apply((d) => d.domainUrl ?? d.url),
				edge: plan.edge,
				server: serverFunction.arn,
			},
		});

		function buildPlan() {
			return all([outputPath]).apply(([outputPath]) => {
				const distDir = "dist";
				const functionDir = "function";
				const publicDir = "public";
				const relativePublicDir = path.join(distDir, "public");
				const relativeFunctionDir = path.join(distDir, functionDir);
				const absoluteFunctionDir = path.join(outputPath, relativeFunctionDir);
				const versionedSubDir = "assets"; // waku places versioned files in public/assets
				// It would be nice for devs to be able to define cache headers for other files
				// that were manually added to the publicDir. With Cloudflare Pages, you can create
				// a _headers file which will be used to set headers for various routes. Maybe
				// that same file format could be read here and applied to the Cloudfront cache behaviors
				// or via code injected into the Cloudfront function.
				// https://developers.cloudflare.com/pages/configuration/headers/

				console.log({
					outputPath,
					distDir,
					functionDir,
					publicDir,
					versionedSubDir,
				});

				// TODO maybe add a build arg for isStatic
				// waku also has a dynamic/static config setting for pages
				const isStatic = false;
				const edge = false; // IIRC, Lambda@Edge doesn't support streaming, so we don't want it with React 19

				const serverConfig = {
					bundle: absoluteFunctionDir,
					handler: "serve.handler",
					streaming: true,
				};

				const plan: Plan = {
					edge,
					// Cloudfront doesn't automatically move the Host to X-Forwarded-Host??
					// It seems a bit unnecessary to run a cloudflare function on every
					// request just to copy the header. TODO test to make sure it's needed
					cloudFrontFunctions: {
						server: {
							injections: [
								useCloudFrontFunctionHostHeaderInjection(),
								// Noting that Astro uses a custom cloudfront routing function
								// to handle requests for static page vs server endpoint vs redirects
								// useCloudFrontRoutingInjection(publicDir),
							],
						},
						serverHostOnly: {
							injections: [useCloudFrontFunctionHostHeaderInjection()],
						},
					},
					origins: {
						staticsServer: {
							s3: {
								copy: [
									{
										from: relativePublicDir,
										to: "",
										cached: true,
										versionedSubDir,
									},
								],
							},
						},
					},
					behaviors: [],
					errorResponses: [],
				};

				if (edge) {
					plan.edgeFunctions = {
						server: {
							function: serverConfig,
						},
					};
					plan.behaviors.push(
						{
							cacheType: "server",
							cfFunction: "server",
							edgeFunction: "edgeServer",
							origin: "staticsServer",
						},
						...fs.readdirSync(relativePublicDir).map(
							(item) =>
								({
									cacheType: "static",
									pattern: fs
										.statSync(path.join(relativePublicDir, item))
										.isDirectory()
										? `${item}/*`
										: item,
									origin: "staticsServer",
								}) as const,
						),
					);
				} else {
					if (isStatic) {
						plan.behaviors.push({
							cacheType: "static",
							cfFunction: "server",
							origin: "staticsServer",
						});
					} else {
						// biome-ignore lint/style/noNonNullAssertion: defined in plan above
						plan.cloudFrontFunctions!.imageServiceCfFunction = {
							injections: [useCloudFrontFunctionHostHeaderInjection()],
						};

						plan.origins.regionalServer = {
							server: {
								function: serverConfig,
							},
						};

						plan.origins.fallthroughServer = {
							group: {
								primaryOriginName: "staticsServer",
								fallbackOriginName: "regionalServer",
								fallbackStatusCodes: [403, 404],
							},
						};

						plan.behaviors.push(
							{
								cacheType: "server",
								cfFunction: "server",
								origin: "fallthroughServer",
								allowedMethods: ["GET", "HEAD", "OPTIONS"],
							},
							{
								cacheType: "static",
								pattern: `${versionedSubDir}/*`,
								origin: "staticsServer",
							},
							{
								cacheType: "server",
								pattern: "_image",
								cfFunction: "imageServiceCfFunction",
								origin: "regionalServer",
								allowedMethods: ["GET", "HEAD", "OPTIONS"],
							},
						);
					}
				}

				if (args.beforePlanValidate) {
					args.beforePlanValidate(plan);
				}

				return validatePlan(plan);
			});
		}
	}

	/**
	 * The URL of the Waku site.
	 *
	 * If the `domain` is set, this is the URL with the custom domain.
	 * Otherwise, it's the autogenerated CloudFront URL.
	 */
	public get url() {
		return all([this.cdn?.domainUrl, this.cdn?.url, this.devUrl]).apply(
			// biome-ignore lint/style/noNonNullAssertion: devUrl should be non empty here
			([domainUrl, url, dev]) => domainUrl ?? url ?? dev!,
		);
	}

	/**
	 * The underlying [resources](/docs/components/#nodes) this component creates.
	 */
	public get nodes() {
		return {
			/**
			 * The AWS Lambda server function that renders the site.
			 */
			server: this.server,
			/**
			 * The Amazon S3 Bucket that stores the assets.
			 */
			assets: this.assets,
			/**
			 * The Amazon CloudFront CDN that serves the site.
			 */
			cdn: this.cdn,
		};
	}

	/** @internal */
	public getSSTLink() {
		return {
			properties: {
				url: this.url,
			},
		};
	}
}
const __pulumiType = "sst:aws:Waku";
// @ts-expect-error
Waku.__pulumiType = __pulumiType;
