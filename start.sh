#!/bin/bash

source /opt/venv/bin/activate

export PORT=$(aws secretsmanager get-secret-value --secret-id myapp/PORT --query SecretString --output text)
export NODE_ENV=$(aws secretsmanager get-secret-value --secret-id myapp/NODE_ENV --query SecretString --output text)
export LOG_LEVEL=$(aws secretsmanager get-secret-value --secret-id myapp/LOG_LEVEL --query SecretString --output text)
export ENVIRONMENT=$(aws secretsmanager get-secret-value --secret-id myapp/ENVIRONMENT --query SecretString --output text)
export TWELVEDATA_API_KEY=$(aws secretsmanager get-secret-value --secret-id myapp/TWELVEDATA_API_KEY --query SecretString --output text)
export TWELVEDATA_WS_URL=$(aws secretsmanager get-secret-value --secret-id myapp/TWELVEDATA_WS_URL --query SecretString --output text)
export COINBASE_WS_URL=$(aws secretsmanager get-secret-value --secret-id myapp/COINBASE_WS_URL --query SecretString --output text)
export COINBASE_API_KEY=$(aws secretsmanager get-secret-value --secret-id myapp/COINBASE_API_KEY --query SecretString --output text)
export COINBASE_API_PRIVATE_KEY=$(aws secretsmanager get-secret-value --secret-id myapp/COINBASE_API_PRIVATE_KEY --query SecretString --output text)

envsubst < .env.tpl > .env

deactivate

node dist/index.js
