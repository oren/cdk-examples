#!/usr/bin/env node

import dynamodb = require('@aws-cdk/aws-dynamodb');
import lambda = require('@aws-cdk/aws-lambda');
import apigateway = require('@aws-cdk/aws-apigateway');
import iam = require('@aws-cdk/aws-iam');
import cdk = require('@aws-cdk/cdk');

class CdkStack extends cdk.Stack {
  constructor(parent: cdk.App, name: string, props?: cdk.StackProps) {
    super(parent, name, props);

    // dynamodb table
    const table = new dynamodb.Table(this, 'Table', {
      tableName: 'MyBookTable',
      readCapacity: 5,
      writeCapacity: 5
    });

    table.addPartitionKey({ name: 'isbn', type: dynamodb.AttributeType.String });
    table.addSortKey({ name: 'title', type: dynamodb.AttributeType.String });

    // lambda role
    const role = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    });

    role.addToPolicy(new iam.PolicyStatement()
        .addAction("dynamoDB:*")
        .addResource(table.tableArn));

    // lambda function
    const apiFunction = new lambda.Function(this, 'ApiFunction', {
      runtime: lambda.Runtime.NodeJS810,
      handler: 'index.handler',
      code: lambda.Code.asset('./lambda/apiFunction'),
      role: role,
    });

    apiFunction.addEnvironment("DYNAMODB", table.tableArn);

    // api
    const api = new apigateway.LambdaRestApi(this, 'BookApi', {
      handler: apiFunction,
      proxy: false
    });

    const books = api.root.addResource('books');
    books.addMethod('GET');

  }
}

const app = new cdk.App();

new CdkStack(app, 'CdkStack');

app.run();
