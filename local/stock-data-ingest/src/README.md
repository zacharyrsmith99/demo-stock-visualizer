For use in local development. Ingests AAPL stock data from twelvedata for the month of June 2024 and writes it to a csv file. Then, reads the csv file and copies it to a timescaledb database instance running in a docker container.

## Setup
1. create your local python environment with python -m venv venv and activate it in your terminal
2. install poetry if it is not already installed with pip install poetry
3. install dependencies with poetry install
4. run the script with poetry run python src/main.py
```