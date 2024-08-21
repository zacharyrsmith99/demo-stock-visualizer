import psycopg2
from typing import TypedDict
import logging

class TimescaleDBClientParams(TypedDict):
    """
    dbname: str
    user: str
    host: str
    port: str
    password: str
    """
    dbname: str
    user: str
    host: str
    password: str
    port: str
    logger: logging.Logger

class ColumnMapping(TypedDict):
    """
    database_column_name: str
    sql_column_type: str
    """
    database_column_name: str
    sql_column_type: str

CSVColumnMappings = dict[str, ColumnMapping]

class CopyFromCSVParams(TypedDict):
    """
    file_path: str
    table_name: str
    """
    file_path: str
    table_name: str
    column_mappings: CSVColumnMappings

class TimescaleDBClient:
    def __init__(self, params):
        self.connection_string = f"dbname={params['dbname']} user={params['user']} host={params['host']} password={params['password']} port={params['port']}"
        self.logger = params['logger']

    def connect(self):
        self.logger.info('Connecting to TimescaleDB instance...')
        try:
            conn = psycopg2.connect(self.connection_string)
            self.logger.info('Connected to TimescaleDB instance successfully')
            return conn
        except Exception as e:
            raise Exception(f'Error connecting to TimescaleDB instance: {e}')


    def run_sql_file(self, file_path: str):
        self.logger.info(f'Running SQL file: ({file_path})')
        with self.connect() as conn:
            with conn.cursor() as cursor:
                with open(file_path, 'r') as f:
                    cursor.execute(f.read())
                    conn.commit()
                    self.logger.info(f'SQL file ({file_path}) executed successfully')
                    
    def copy_from_csv(self, params: CopyFromCSVParams):
        """
        Maps CSV columns to table columns and copies the CSV file to the table.
        Format for column_mappings: {'csv_column_name': 'table_column_name'}
        """
        file_path = params['file_path']
        table_name = params['table_name']
        column_mappings = params['column_mappings']
        self.logger.info(f'Copying CSV file ({file_path}) to table ({table_name})')
        with self.connect() as conn:
            with conn.cursor() as cursor:
                with open(file_path, 'r') as f:
                    temporary_table_name = f'{table_name}_temp'
                    csv_column_names_and_types_list = [f'{column} {column_mappings[column]["sql_column_type"]}' for column in column_mappings]
                    csv_column_names_and_types_string = ', '.join(csv_column_names_and_types_list)

                    csv_column_names_as_db_column_names_string = ', '.join([f'{column} AS {column_mappings[column]["database_column_name"]}' for column in column_mappings])
                    
                    create_temporary_table_sql = f'CREATE TEMP TABLE {temporary_table_name} ({csv_column_names_and_types_string})'
                    cursor.execute(create_temporary_table_sql)
                    
                    copy_sql = f"COPY {temporary_table_name} FROM STDIN WITH CSV HEADER DELIMITER AS ','"
                    cursor.copy_expert(copy_sql, f)

                    db_column_names  = ', '.join([column_mappings[column]["database_column_name"] for column in column_mappings])

                    insert_sql = f'INSERT INTO {table_name} ({db_column_names}) SELECT {csv_column_names_as_db_column_names_string} FROM {temporary_table_name}'

                    
                    cursor.execute(insert_sql)
                    self.logger.info(f'CSV file ({file_path}) copied to table ({table_name}) successfully')