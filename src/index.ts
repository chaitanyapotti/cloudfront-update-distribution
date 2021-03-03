import * as core from "@actions/core";
import { CloudFrontClient, DistributionConfig, GetDistributionCommand, UpdateDistributionCommand } from "@aws-sdk/client-cloudfront";
import deepmerge from "deepmerge";

const combineMerge = <T = { Id?: string }>(target: T[], source: T[]) => {
  const final: { Id?: string }[] = target.slice();

  source.forEach((x: { Id?: string }) => {
    // if Id exists in source, check for the same one in destination
    if (x.Id) {
      const duplicateIndex = final.findIndex((y) => y.Id === x.Id);
      if (duplicateIndex > -1) {
        final[duplicateIndex] = deepmerge(final[duplicateIndex], x, {
          arrayMerge: combineMerge,
        });
      }
    } else {
      final.push(x);
    }
  });
  return final;
};

async function run(): Promise<void> {
  try {
    // Get inputs
    const accessKeyId = core.getInput("aws-access-key-id", { required: true });
    const secretAccessKey = core.getInput("aws-secret-access-key", {
      required: true,
    });
    const region = core.getInput("aws-region", { required: true });
    const distrubtionId = core.getInput("cloudfront-distribution-id", {
      required: true,
    });
    const distributionConfigString = core.getInput("cloudfront-distribution-config", { required: true });

    const client = new CloudFrontClient({
      credentials: { accessKeyId, secretAccessKey },
      region,
    });
    const getDistrubtion = new GetDistributionCommand({ Id: distrubtionId });
    const currentDistribution = await client.send(getDistrubtion);

    if (!currentDistribution.Distribution || !currentDistribution.Distribution.DistributionConfig) {
      throw new Error("Invalid distribution id");
    }

    core.info(`Input: ${distributionConfigString}`);

    core.info(`Fetched Config: ${JSON.stringify(currentDistribution.Distribution.DistributionConfig)}`);

    const inputDistributionConfig = JSON.parse(Buffer.from(distributionConfigString, "base64").toString()) as Partial<DistributionConfig>;
    const finalDistributionConfig = deepmerge<DistributionConfig>(currentDistribution.Distribution.DistributionConfig, inputDistributionConfig, {
      arrayMerge: combineMerge,
    });
    core.info(`Merged Config: ${JSON.stringify(finalDistributionConfig)}`);
    const updateDistribution = new UpdateDistributionCommand({
      IfMatch: currentDistribution.ETag,
      DistributionConfig: finalDistributionConfig,
      Id: distrubtionId,
    });
    const distributionOutput = await client.send(updateDistribution);
    core.setOutput("cloudfront-distribution-updated-id", distributionOutput.Distribution?.Id);
  } catch (error) {
    core.setFailed(error.message);

    const showStackTrace = process.env.SHOW_STACK_TRACE;

    if (showStackTrace === "true") {
      throw error;
    }
  }
}

run();
