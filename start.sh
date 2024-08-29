#!/bin/bash
export AWS_DEFAULT_REGION=us-east-1
export PORT=$(aws secretsmanager get-secret-value --secret-id stockzrs-relay-secrets1 --query SecretString --output text | grep -o '"PORT":"[^"]*' |  grep -o '[^"]*$')
export NODE_ENV=$(aws secretsmanager get-secret-value --secret-id stockzrs-relay-secrets1 --query SecretString --output text | grep -o '"NODE_ENV":"[^"]*' | grep -o '[^"]*$')
export LOG_LEVEL=$(aws secretsmanager get-secret-value --secret-id stockzrs-relay-secrets1 --query SecretString --output text | grep -o '"LOG_LEVEL":"[^"]*' | grep -o '[^"]*$')
export ENVIRONMENT=$(aws secretsmanager get-secret-value --secret-id stockzrs-relay-secrets1 --query SecretString --output text | grep -o '"ENVIRONMENT":"[^"]*' | grep -o '[^"]*$')
export TWELVEDATA_API_KEY=$(aws secretsmanager get-secret-value --secret-id stockzrs-relay-secrets1 --query SecretString --output text | grep -o '"TWELVEDATA_API_KEY":"[^"]*' | grep -o '[^"]*$')
export TWELVEDATA_WS_URL=$(aws secretsmanager get-secret-value --secret-id stockzrs-relay-secrets1 --query SecretString --output text | grep -o '"TWELVEDATA_WS_URL":"[^"]*' | grep -o '[^"]*$')
export COINBASE_WS_URL=$(aws secretsmanager get-secret-value --secret-id stockzrs-relay-secrets1 --query SecretString --output text | grep -o '"COINBASE_WS_URL":"[^"]*' | grep -o '[^"]*$')
export COINBASE_API_KEY=$(aws secretsmanager get-secret-value --secret-id stockzrs-relay-secrets1 --query SecretString --output text | grep -o '"COINBASE_API_KEY":"[^"]*' | grep -o '[^"]*$')
export COINBASE_API_PRIVATE_KEY=$(aws secretsmanager get-secret-value --secret-id stockzrs-relay-secrets1 --query SecretString --output text | grep -o '"COINBASE_API_PRIVATE_KEY":"[^"]*' | grep -o '[^"]*$')

node dist/index.js
