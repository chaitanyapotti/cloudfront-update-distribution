import * as core from "@actions/core";
import {
  CloudFrontClient,
  CreateInvalidationCommand,
  EventType,
  GetDistributionCommand,
  UpdateDistributionCommand,
  waitUntilDistributionDeployed,
} from "@aws-sdk/client-cloudfront";

const distributionId = core.getInput("cloudfront-distribution-id", {
  required: true,
});
const pathPattern =
  core.getInput("path-pattern", {
    required: false,
  }) || "";

const lambdaAssociationEventType = core.getInput("lambda-association-event-type", { required: false }) || "";
const lambdaAssociationVersionArn = core.getInput("lambda-association-version-arn", { required: false }) || "";
const cloudfrontInvalidationRequired = core.getBooleanInput("cloudfront-invalidation-required", { required: false }) ?? false;
const cloudfrontInvalidationPath = core.getInput("cloudfront-invalidation-path", { required: false }) || "/*";
const cloudfrontWaitForServiceUpdate = core.getBooleanInput("cloudfront-wait-for-service-update", { required: false }) ?? true;

const client = new CloudFrontClient({});

async function run(): Promise<void> {
  try {
    const currentDistribution = await client.send(new GetDistributionCommand({ Id: distributionId }));

    if (!currentDistribution.Distribution || !currentDistribution.Distribution.DistributionConfig) {
      throw new Error("Invalid distribution id");
    }

    core.info(`Fetched Config: ${JSON.stringify(currentDistribution.Distribution.DistributionConfig)}`);

    const currentDistributionConfig = currentDistribution.Distribution.DistributionConfig;

    if (lambdaAssociationVersionArn && lambdaAssociationEventType && pathPattern) {
      // Process Cache Behavior (path_pattern != 'Default')
      if (currentDistributionConfig.CacheBehaviors) {
        currentDistributionConfig.CacheBehaviors.Items?.forEach((cacheBehavior) => {
          if (pathPattern === cacheBehavior.PathPattern) {
            if (cacheBehavior.LambdaFunctionAssociations) {
              if (cacheBehavior.LambdaFunctionAssociations.Items) {
                let match = false;
                cacheBehavior.LambdaFunctionAssociations.Items.forEach((y) => {
                  const eventType = y.EventType;
                  if (lambdaAssociationEventType === eventType) {
                    y.LambdaFunctionARN = lambdaAssociationVersionArn;
                    core.info(`Lambda version ${y.LambdaFunctionARN} UPDATED`);
                    match = true;
                  }
                });
                if (!match) {
                  cacheBehavior.LambdaFunctionAssociations.Items.push({
                    EventType: lambdaAssociationEventType as EventType,
                    LambdaFunctionARN: lambdaAssociationVersionArn,
                    IncludeBody: false,
                  });
                  cacheBehavior.LambdaFunctionAssociations.Quantity = cacheBehavior.LambdaFunctionAssociations.Quantity
                    ? cacheBehavior.LambdaFunctionAssociations.Quantity + 1
                    : 1;
                }
              } else {
                cacheBehavior.LambdaFunctionAssociations.Items = [
                  {
                    EventType: lambdaAssociationEventType as EventType,
                    LambdaFunctionARN: lambdaAssociationVersionArn,
                    IncludeBody: false,
                  },
                ];
                cacheBehavior.LambdaFunctionAssociations.Quantity = cacheBehavior.LambdaFunctionAssociations.Quantity
                  ? cacheBehavior.LambdaFunctionAssociations.Quantity + 1
                  : 1;
              }
            }
          } else {
            core.info(`Path pattern ${cacheBehavior.PathPattern} not desired`);
          }
        });
      }
      // Process Default Cache Behavior (path_pattern = 'Default')
      if (currentDistributionConfig.DefaultCacheBehavior) {
        const cacheBehavior = currentDistributionConfig.DefaultCacheBehavior;
        cacheBehavior.LambdaFunctionAssociations = cacheBehavior.LambdaFunctionAssociations || { Quantity: 0 };

        if (cacheBehavior.LambdaFunctionAssociations.Items) {
          let match = false;
          cacheBehavior.LambdaFunctionAssociations.Items.forEach((y) => {
            const eventType = y.EventType;
            if (lambdaAssociationEventType === eventType) {
              y.LambdaFunctionARN = lambdaAssociationVersionArn;
              core.info(`Lambda version ${y.LambdaFunctionARN} UPDATED`);
              match = true;
            }
          });
          if (!match) {
            cacheBehavior.LambdaFunctionAssociations.Items.push({
              EventType: lambdaAssociationEventType as EventType,
              LambdaFunctionARN: lambdaAssociationVersionArn,
              IncludeBody: false,
            });
            cacheBehavior.LambdaFunctionAssociations.Quantity = cacheBehavior.LambdaFunctionAssociations.Quantity
              ? cacheBehavior.LambdaFunctionAssociations.Quantity + 1
              : 1;
          }
        } else {
          cacheBehavior.LambdaFunctionAssociations.Items = [
            {
              EventType: lambdaAssociationEventType as EventType,
              LambdaFunctionARN: lambdaAssociationVersionArn,
              IncludeBody: false,
            },
          ];
          cacheBehavior.LambdaFunctionAssociations.Quantity = cacheBehavior.LambdaFunctionAssociations.Quantity
            ? cacheBehavior.LambdaFunctionAssociations.Quantity + 1
            : 1;
        }
      }

      const updateDistribution = new UpdateDistributionCommand({
        IfMatch: currentDistribution.ETag,
        DistributionConfig: currentDistributionConfig,
        Id: distributionId,
      });
      await client.send(updateDistribution);

      if (cloudfrontWaitForServiceUpdate) {
        await waitUntilDistributionDeployed({ client, maxWaitTime: 10 * 60 * 60 }, { Id: distributionId });
      }
    }

    if (cloudfrontInvalidationRequired) {
      await client.send(
        new CreateInvalidationCommand({
          DistributionId: distributionId,
          InvalidationBatch: { CallerReference: new Date().toISOString(), Paths: { Quantity: 1, Items: [cloudfrontInvalidationPath] } },
        })
      );
    }
  } catch (error: unknown) {
    core.setFailed((error as Error).message);

    const showStackTrace = process.env.SHOW_STACK_TRACE;

    if (showStackTrace === "true") {
      throw error;
    }
  }
}

run();
