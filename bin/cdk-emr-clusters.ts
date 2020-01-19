#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CdkEmrClustersStack } from '../lib/cdk-emr-clusters-stack';

const app = new cdk.App();
const cluster_name = app.node.tryGetContext('cluster_name');
const hosted_zone_id = app.node.tryGetContext('hosted_zone_id');
const record_name = app.node.tryGetContext('record_name');
const ec2_key_name = app.node.tryGetContext('ec2_key_name');
new CdkEmrClustersStack(app, 'CdkEmrClustersStack', { clusterName: cluster_name, hostedZoneId: hosted_zone_id, recordName: record_name, ec2KeyName: ec2_key_name });
