import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import CdkEmrClusters = require('../lib/cdk-emr-clusters-stack');

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const cluster_name = app.node.tryGetContext('cluster_name');
    const hosted_zone_id = app.node.tryGetContext('hosted_zone_id');
    const record_name = app.node.tryGetContext('record_name');
    const ec2_key_name = app.node.tryGetContext('ec2_key_name');
    const stack = new CdkEmrClusters.CdkEmrClustersStack(app, 'MyTestStack', { clusterName: cluster_name, hostedZoneId: hosted_zone_id, recordName: record_name, ec2KeyName: ec2_key_name });
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
