import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { WindowsVersion } from 'aws-cdk-lib/aws-ec2';

export class CdkEc2WindowsProjectStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a VPC with public subnets
    const vpc = new ec2.Vpc(this, 'MyVPC', {
      natGateways: 0,
      subnetConfiguration: [{
        cidrMask: 24,
        name: "subnat1",
        subnetType: ec2.SubnetType.PUBLIC
      }]
    });

    // Create a Security Group
    const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc,
      description: 'Allow RDP (3389)',
      allowAllOutbound: true
    });
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(3389), 'Allow RDP Access');

    // Create an IAM role for the EC2 instance
    const role = new iam.Role(this, 'ec2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com')
    });
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));

    // Select Windows Server 2016 AMI
    const ami = ec2.MachineImage.genericWindows({
      'us-east-1': 'ami-016a78934c9cfa396'
    });

    
    // Create the EC2 instance
    const ec2Instance = new ec2.Instance(this, 'Instance', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      machineImage: ami,
      securityGroup: securityGroup,
      role: role
    });

    // Output the EC2 instance's public IP address
    new cdk.CfnOutput(this, 'IPAddress', { value: ec2Instance.instancePublicIp });
  }
}
