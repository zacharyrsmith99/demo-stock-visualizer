import os
import logging

def get_sql_migration_filenames_as_list(logger: logging.Logger, directory: str = 'sql_migrations'):
    sql_files = [file for file in os.listdir(directory) if file.endswith('.sql')]

    sorted_files = sorted(sql_files, key=lambda x: int(x.split('-')[0]))

    full_file_paths = [os.path.join(directory, file) for file in sorted_files]

    logger.info(f'Found ({len(full_file_paths)}) SQL migration files under path: ({full_file_paths})')

    return full_file_paths

