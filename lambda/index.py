import json
import boto3
import os

def lambda_handler(event, context):
    print(json.dumps(event))
    
    CLUSTER_NAME = os.environ['CLUSTER_NAME']
    HOSTED_ZONE_ID = os.environ['HOSTED_ZONE_ID']
    RECORD_NAME = os.environ['RECORD_NAME']
    
    if event['detail']['name']==CLUSTER_NAME and event['detail']['state']=="WAITING":
        emr = boto3.client('emr')
        response = emr.list_clusters(ClusterStates=['STARTING', 'WAITING','RUNNING'])
        print(response)
        
        for cluster in response['Clusters']:
            print(cluster)
            if cluster['Name'] == CLUSTER_NAME:
                print("------------")
                print(cluster['Id'])
                print("------------")
                
                response_cluster = emr.describe_cluster(ClusterId=cluster['Id'])
                print(response_cluster['Cluster']['MasterPublicDnsName'])
                
                route53 = boto3.client('route53')
                response_record = route53.change_resource_record_sets(
                    HostedZoneId=HOSTED_ZONE_ID,
                    ChangeBatch={
                            'Changes': [ {
                                'Action': 'UPSERT',
                                'ResourceRecordSet': {
                                    'Name': RECORD_NAME,
                                    'Type': 'CNAME',
                                    'TTL': 300,
                                    'ResourceRecords': [
                                        {
                                            'Value': response_cluster['Cluster']['MasterPublicDnsName']
                                        },
                                    ],
                                }
                            }]
                        }
                    )
                
    
    return event