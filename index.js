"use strict";
const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");
const awsx = require("@pulumi/awsx");

// Create an AWS resource (S3 Bucket)
const bucket = new aws.s3.Bucket("my-bucket"); //pulumi appends some gibbresh to my-bucket

//create a security group for 2 inbound rule and 1 outbound rule
const group = new aws.ec2.SecurityGroup("web-sg", {
  description: "Enable HTTP access",
  egress: [
    //allow all egress
    {
      protocol: "-1",
      fromPort: 0,
      toPort: 0,
      cidrBlocks: ["0.0.0.0/0"],
    },
  ],
  ingress: [
    //allow http requests
    {
      protocol: "tcp",
      fromPort: 80,
      toPort: 80,
      cidrBlocks: ["0.0.0.0/0"],
    },
    //allow ssh
    {
      protocol: "tcp",
      fromPort: 22,
      toPort: 22,
      cidrBlocks: ["0.0.0.0/0"],
    },
  ],
});

//creates an ec2 instance
const e2Instance = new aws.ec2.Instance("web-server", {
  ami: "ami-008fe2fc65df48dac", //ubuntu ami
  instanceType: "t2.micro",
  vpcSecurityGroupIds: [group.id],
  keyName: "test1",
  tags: {
    Name: "web",
  },
});

//this will create 3 ec2 instances
const amiId = "ami-008fe2fc65df48dac";
const instanceNames = ["web1", "web2", "web3"];
const instances = instanceNames.map((name) => {
  const instance = new aws.ec2.Instance(name, {
    ami: amiId,
    instanceType: "t2.micro",
    vpcSecurityGroupIds: [group.id],
    keyName: "test1",
    tags: {
      Name: name,
    },
  });

  return instance;
});

// Export the public DNS names of the instances
const publicDnsNames = instances.map(
  (instance) => pulumi.interpolate`${instance.publicDns}`
);
const outputPublicIps = pulumi.all(publicDnsNames).apply((allDnsNames) => {
  return allDnsNames;
});

// Export the name of the bucket
exports.bucketName = bucket.id;

//get ip address of tge server - output the public ip address
exports.publicIp = e2Instance.publicIp;

//export public dns
exports.instanceUrl = e2Instance.publicDns;

//to get linke a clickable link
exports.clickableInstanceUrl = pulumi.concat("http://", e2Instance.publicDns);

//get all 3 public Ips of 3 ec2 instances
exports.publicIps = outputPublicIps;
