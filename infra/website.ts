import { type Plan, Waku } from "./components/waku";

export const website = new Waku("Website", {
	server: {
		memory: "1024 MB",
		function: {
			timeout: "30 seconds",
		},
	},
	environment: { SECRET_PASSWORD: "12345" },
	link: [],
	path: "./packages/website",
	warm: false,
	// domain: {
	// 	name: `www2${domainSuffix}`,
	// 	dns: false,
	// 	cert: domainWildcardCert,
	// },
	dev: {
		autostart: true,
		url: "http://localhost:3000",
		command: "bun run dev",
		// It would be nice to have a way to emulate the CDN
		// where additional origins could point to specific Function
		// resources in live mode
	},

	// Not doing this for the demo... but it's possible to hook into the Plan
	// and add your own custom function and s3 origins and modify other aspects of the plan object.
	// beforePlanValidate: (plan: Plan) => {
	// 	plan.origins.imageOptimizer = {
	// 		custom: {
	// 			domainName: imageOptimizerFunction.url.apply(
	// 				(url: string) => new URL(url).hostname,
	// 			),
	// 			customOriginConfig: {
	// 				httpPort: 80,
	// 				httpsPort: 443,
	// 				originProtocolPolicy: "https-only",
	// 				originReadTimeout: 20,
	// 				originSslProtocols: ["TLSv1.2"],
	// 			},
	// 		},
	// 	};
	// 	mediaBucket.nodes.bucket.bucketRegionalDomainName.apply((domain) => {
	// 		console.log("mediaBucket.domain for _media/*...", domain);
	// 	});
	// 	plan.origins.mediaBucket = {
	// 		customS3: {
	// 			domainName: mediaBucket.nodes.bucket.bucketRegionalDomainName,
	// 			originAccessControlId: mediaBucketOac.id,
	// 		},
	// 	};
	// 	for (const behavior of plan.behaviors) {
	// 		if (behavior.pattern === "_image") {
	// 			behavior.cacheType = "static";
	// 			// TODO how do we get the cache policy to be WebsiteServerCachePolicy?
	// 			// and origin request policy to AllViewerExceptHostHeader
	// 			behavior.cfFunction = undefined;
	// 			behavior.edgeFunction = undefined;
	// 			behavior.origin = "imageOptimizer";
	// 		}
	// 	}
	// 	plan.behaviors.push({
	// 		pattern: "_media/*",
	// 		allowedMethods: ["GET", "HEAD", "OPTIONS"],
	// 		cacheType: "static",
	// 		origin: "mediaBucket",
	// 	});
	// },

	transform: {
		cdn: (args) => {
			args.invalidation = false;
			args.wait = false;
		},
	},
});
