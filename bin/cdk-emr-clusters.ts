#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CdkEmrClustersStack } from '../lib/cdk-emr-clusters-stack';

const app = new cdk.App();
new CdkEmrClustersStack(app, 'CdkEmrClustersStack');
