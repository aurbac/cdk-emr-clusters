import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import CdkEmrClusters = require('../lib/cdk-emr-clusters-stack');

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new CdkEmrClusters.CdkEmrClustersStack(app, 'MyTestStack', { clusterName: "my-emr-cluster", hostedZoneId: "XXXXXXXXX", recordName: "my-emr-cluster.domain.com" });
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
