# cloudfront-update-distribution

Updates an AWS cloudfront distribution

Update a Cloudfront distribution by providing the updated config

## Usage

Add the following step to your workflow:

```yml
 - name: Update cloudfront distribution
      uses: chaitanyapotti/cloudfront-update-distribution@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1
        cloudfront-distribution-id: ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }}
        path-pattern: ${{ secrets.PATH_PATTERN }}
        lambda-association-event-type: ${{ secrets.LAMBDA_ASSOCIATION_EVENT_TYPE }}
        lambda-association-version-arn: ${{ secrets.LAMBDA_ASSOCIATION_VERSION_ARN }}
        cloudfront-invalidation-required: true
        cloudfront-invalidation-path: "/*"
        cloudfront-wait-for-service-update: false
```

For example, you can use this action with the AWS CLI available in [GitHub's hosted virtual environments](https://help.github.com/en/actions/reference/software-installed-on-github-hosted-runners).
You can also run this action multiple times to use different AWS accounts, regions, or IAM roles in the same GitHub Actions workflow job.

```yml
deploy:
  name: deploy
  strategy:
    matrix:
      node: ["16.x"]
      os: [ubuntu-latest]

  runs-on: ${{ matrix.os }}
  # When application is successfully tested and build has been generated
  # Then we can start with deployment
  needs: build
  steps:
    # Set the credentials from repository settings/secrets
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v1
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ secrets.AWS_REGION }}

    # Copy the files from build folder to the S3 bucket
    - name: Deploy to S3
      run: aws s3 cp ./build s3://YOUR_S3_BUCKET/"$GITHUB_SHA" --recursive

    # Point cloudfront to the new folder
    - name: Point cloudfront to the new folder
      uses: chaitanyapotti/cloudfront-update-distribution@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ secrets.AWS_REGION }}
        cloudfront-distribution-id: ${{ secrets.AWS_CLOUDFRONT_DISTRIBUTION_ID }}
        path-pattern: ${{ secrets.PATH_PATTERN }}
        lambda-association-event-type: ${{ secrets.LAMBDA_ASSOCIATION_EVENT_TYPE }}
        lambda-association-version-arn: ${{ secrets.LAMBDA_ASSOCIATION_VERSION_ARN }}
        cloudfront-invalidation-required: true
        cloudfront-invalidation-path: "/*"
        cloudfront-wait-for-service-update: false
```

See [action.yml](action.yml) for the full documentation for this action's inputs and outputs.

## License Summary

This code is made available under the MIT license.
