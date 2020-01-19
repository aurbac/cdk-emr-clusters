import * as cdk from '@aws-cdk/core';
import s3 = require('@aws-cdk/aws-s3');
import iam = require('@aws-cdk/aws-iam');
import emr = require('@aws-cdk/aws-emr');
import ec2 = require('@aws-cdk/aws-ec2');
import lambda = require('@aws-cdk/aws-lambda');
import events = require('@aws-cdk/aws-events');
import {LambdaFunction} from "@aws-cdk/aws-events-targets";

export interface CdkEmrClustersStackProps extends cdk.StackProps {
    readonly clusterName: string;
    readonly hostedZoneId: string;
    readonly recordName: string;
    readonly ec2KeyName: string;
}

export class CdkEmrClustersStack extends cdk.Stack {
    
  public readonly handler: lambda.Function;
    
  constructor(scope: cdk.Construct, id: string, props: CdkEmrClustersStackProps) {
    super(scope, id, props);
    
    this.handler = new lambda.Function(this, 'LambdaHandler', {
      runtime: lambda.Runtime.PYTHON_3_7,
      code: lambda.Code.asset('lambda'),
      handler: 'index.lambda_handler',
      environment: {
          CLUSTER_NAME: props.clusterName, 
          HOSTED_ZONE_ID: props.hostedZoneId,
          RECORD_NAME: props.recordName
      }
    });
    
    const statement = new iam.PolicyStatement();
    statement.addActions("elasticmapreduce:*");
    statement.addActions("route53:*");
    statement.addResources("*");
    this.handler.addToRolePolicy(statement);
    
    const event = new events.Rule(this, id, { 
        eventPattern: {
          source: ["aws.emr"],
          detailType: ["EMR Cluster State Change"]
        }
    });
    
    event.addTarget(new LambdaFunction(this.handler));
    
    const vpc = new ec2.Vpc(this, "emr-vpc", {
      cidr: "10.1.0.0/16",
      natGateways: 1,
      subnetConfiguration: [
        {  cidrMask: 24, subnetType: ec2.SubnetType.PUBLIC, name: "Public" },
        {  cidrMask: 24, subnetType: ec2.SubnetType.PRIVATE, name: "Private" }
        ],
      maxAzs: 3 // Default is all AZs in region
    });

    const sg = new ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc: vpc
    });
   
    sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22));

    const role = new iam.Role(this, 'ReplayRole', {
        assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
        managedPolicies: [
            iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonElasticMapReduceforEC2Role')
        ]
    });
    
    const profile = new iam.CfnInstanceProfile(this, 'InstanceProfile', {
        roles: [
            role.roleName
        ]
    });
    
    const cluster = new emr.CfnCluster(this, 'EmrCluster', {
        name: props.clusterName,
        applications: [
            { name: 'Hadoop' }, 
            { name: 'Ganglia' }, 
            { name: 'Flink' }, 
            { name: 'ZooKeeper'}
        ],
        instances: {
            masterInstanceGroup: {
                instanceCount: 1,
                instanceType: 'c5.xlarge',
                name: 'Master'
            },
            coreInstanceGroup: {
                instanceCount: 2,
                instanceType: 'r5.xlarge',
                name: 'Core'
            },
            ec2KeyName: props.ec2KeyName,
            additionalMasterSecurityGroups: [
                sg.securityGroupName
            ],
            ec2SubnetId: vpc.publicSubnets[0].subnetId
        },
        serviceRole : 'EMR_DefaultRole',
        releaseLabel: 'emr-5.20.0',
        visibleToAllUsers: true,
        jobFlowRole: profile.ref,
        configurations: [
            {
                classification: 'emrfs-site',
                configurationProperties: {
                    "fs.s3.maxConnections": "1000"
                }
            }
        ]
    });

    new cdk.CfnOutput(this, 'SshEmrCluster', { value: `ssh -C -D 8157 hadoop@${cluster.attrMasterPublicDns}` });
    new cdk.CfnOutput(this, 'StartFlinkRuntime', { value: 'flink-yarn-session -n 2 -s 4 -tm 16GB -d' });
    
  }
}
