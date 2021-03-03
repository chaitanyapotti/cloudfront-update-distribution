# cloudfront-update-distribution

Updates an AWS cloudfront distribution

Update a Cloudfront distribution by providing the updated config

## Usage

Add the following step to your workflow:

```yml
 - name: Update cloudfront distribution
      uses: chaitanyapotti/cloudfront-update-distribution
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-2
        cloudfront-distribution-id: ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }}
        cloudfront-distribution-config: ${{ env.CLOUDFRONT_DISTRIBUTION_CONFIG_BASE64 }}
```

For example, you can use this action with the AWS CLI available in [GitHub's hosted virtual environments](https://help.github.com/en/actions/reference/software-installed-on-github-hosted-runners).
You can also run this action multiple times to use different AWS accounts, regions, or IAM roles in the same GitHub Actions workflow job.

Say cloudfront.json contains the fields you want to update in the cloudfront distribution and frontend-artifacts contains build
and scripts with the following json file

```json
{
  "Origins": {
    "Items": [
      {
        "Id": "CLOUDFRONT_ORIGIN_ID",
        "OriginPath": "CLOUDFRONT_CUSTOM_ORIGIN_PATH"
      }
    ]
  }
}
```

```yml
deploy:
  name: deploy
  strategy:
    matrix:
      node: ["12.x"]
      os: [ubuntu-latest]

  runs-on: ${{ matrix.os }}
  # When application is successfully tested and build has been generated
  # Then we can start with deployment
  needs: build
  steps:
    # Download previously shared build
    - name: Get artifact
      uses: actions/download-artifact@v2
      with:
        name: frontend-artifacts

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

    - name: Read and set env
      id: cloudfrontset
      env:
        AWS_CLOUDFRONT_ORIGIN_ID: ${{ secrets.AWS_CLOUDFRONT_ORIGIN_ID }}
      run: |
        sed -i -e "s@CLOUDFRONT_ORIGIN_ID@$AWS_CLOUDFRONT_ORIGIN_ID@" -e "s@CLOUDFRONT_CUSTOM_ORIGIN_PATH@/$GITHUB_SHA@" scripts/cloudfront.json
        export AWS_CLOUDFRONT_DISTRIBUTION_CONFIG=$(base64 ./scripts/cloudfront.json)
        AWS_CLOUDFRONT_DISTRIBUTION_CONFIG="${AWS_CLOUDFRONT_DISTRIBUTION_CONFIG//'%'/'%25'}"
        AWS_CLOUDFRONT_DISTRIBUTION_CONFIG="${AWS_CLOUDFRONT_DISTRIBUTION_CONFIG//$'\n'/'%0A'}"
        AWS_CLOUDFRONT_DISTRIBUTION_CONFIG="${AWS_CLOUDFRONT_DISTRIBUTION_CONFIG//$'\r'/'%0D'}"
        echo "::set-output name=cloudfront_config::$AWS_CLOUDFRONT_DISTRIBUTION_CONFIG"

    # Point cloudfront to the new folder
    - name: Point cloudfront to the new folder
      uses: chaitanyapotti/cloudfront-update-distribution@v1.0.9
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ secrets.AWS_REGION }}
        cloudfront-distribution-id: ${{ secrets.AWS_CLOUDFRONT_DISTRIBUTION_ID }}
        cloudfront-distribution-config: ${{ steps.cloudfrontset.outputs.cloudfront_config }}
```

See [action.yml](action.yml) for the full documentation for this action's inputs and outputs.

## License Summary

This code is made available under the MIT license.
