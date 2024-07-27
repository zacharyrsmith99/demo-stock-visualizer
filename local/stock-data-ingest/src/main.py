from dotenv import load_dotenv
import os
from datetime import date
from calendar import monthrange
from clients.twelvedata_client import TwelvedataClient
from clients.timescaledb import TimescaleDBClient
from utils.logger import get_logger
from utils.write_to_csv import write_stock_data_to_csv
from utils.get_sql_migrations import get_sql_migration_filenames_as_list


def get_start_and_end_dates_for_month(year: int, month: int) -> tuple:
    start_date = date(year, month, 1)
    end_date = date(year, month, monthrange(year, month)[1])
    return start_date, end_date

def verify_file_does_not_exist(file_path: str):
    if os.path.exists(file_path):
        raise Exception(f'File already exists: ({file_path})')

def main():
    load_dotenv()
    logger = get_logger('stock-data-ingest')
    twelvedata_api_key = os.getenv("TWELVEDATA_API_KEY")
    twelvedata_base_url = os.getenv("TWELVEDATA_BASE_URL")
    twelvedata_client = TwelvedataClient({
        'api_key': twelvedata_api_key,
        'logger': logger,
        'base_url': twelvedata_base_url,
    })
    timescaledb_client = TimescaleDBClient({
        'dbname': os.getenv('POSTGRES_DB'),
        'user': os.getenv('POSTGRES_USER'),
        'host': os.getenv('POSTGRES_HOST'),
        'password': os.getenv('POSTGRES_PASSWORD'),
        'port': os.getenv('POSTGRES_PORT'),
        'logger': logger,
    })

    start_and_end_date = get_start_and_end_dates_for_month(2024, 6) # June 2024
    start_time = start_and_end_date[0].strftime('%Y-%m-%d')
    end_time = start_and_end_date[1].strftime('%Y-%m-%d')
    file_name = f'AAPL_{start_time}.csv'

    if not os.path.exists(f'data/{file_name}'):
        time_series_data_csv_text = twelvedata_client.get_time_series_data_as_csv({
            'symbol': 'AAPL',
            'start_date': start_time,
            'end_date': end_time,
            'interval': '1min',
        })

        write_stock_data_to_csv(time_series_data_csv_text, file_name)

    sql_migration_files = get_sql_migration_filenames_as_list(logger)

    for file in sql_migration_files:
        timescaledb_client.run_sql_file(file)
    
    timescaledb_client.copy_from_csv({
        'file_path': f'data/{file_name}',
        'table_name': 'stock_data_by_minute',
        'symbol': 'AAPL',
        'column_mappings': {
            'datetime': {
                'database_column_name': 'created_at',
                'sql_column_type': 'TIMESTAMP',
            },
            'open': {
                'database_column_name': 'open_price',
                'sql_column_type': 'DOUBLE PRECISION',
            },
            'high': {
                'database_column_name': 'high_price',
                'sql_column_type': 'DOUBLE PRECISION',
            },
            'low': {
                'database_column_name': 'low_price',
                'sql_column_type': 'DOUBLE PRECISION',
            },
            'close': {
                'database_column_name': 'close_price',
                'sql_column_type': 'DOUBLE PRECISION',
            },
            'volume': {
                'database_column_name': 'volume',
                'sql_column_type': 'BIGINT',
            },
            'symbol': {
                'database_column_name': 'symbol',
                'sql_column_type': 'TEXT',
            },
        }
        })
        
    
main()