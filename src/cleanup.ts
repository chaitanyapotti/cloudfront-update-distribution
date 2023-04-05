import * as core from "@actions/core";

/**
 * When the GitHub Actions job is done, clean up any environment variables that
 * may have been set by the cloudfront-update-distribution steps in the job.
 *
 * Environment variables are not intended to be shared across different jobs in
 * the same GitHub Actions workflow: GitHub Actions documentation states that
 * each job runs in a fresh instance.  However, doing our own cleanup will
 * give us additional assurance that these environment variables are not shared
 * with any other jobs.
 */

async function cleanup(): Promise<void> {
  try {
    // The GitHub Actions toolkit does not have an option to completely unset
    // environment variables, so we overwrite the current value with an empty
    // string. The AWS CLI and AWS SDKs will behave correctly: they treat an
    // empty string value as if the environment variable does not exist.
    core.exportVariable("aws-access-key-id", "");
    core.exportVariable("aws-secret-access-key", "");
    core.exportVariable("aws-region", "");
    core.exportVariable("cloudfront-distribution-id", "");
    core.exportVariable("path-pattern", "");
    core.exportVariable("lambda-association-event-type", "");
    core.exportVariable("lambda-association-version-arn", "");
    core.exportVariable("cloudfront-invalidation-required", false);
    core.exportVariable("cloudfront-invalidation-path", "");
    core.exportVariable("cloudfront-wait-for-service-update", true);
  } catch (error: unknown) {
    core.setFailed((error as Error).message);
  }
}

cleanup();
