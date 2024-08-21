from io import StringIO
import pandas as pd

def write_stock_data_to_csv(data, filename):
    root = 'data/'
    try:
        df = pd.read_csv(StringIO(data))
    except Exception as e:
        raise Exception(f'Error reading CSV data for file ({filename}): {e}')
    df['symbol'] = filename.split('_')[0]
    try:
        df.to_csv(f'{root}{filename}', index=False)
    except Exception as e:
        raise Exception(f'Error writing CSV data to file ({filename}): {e}')