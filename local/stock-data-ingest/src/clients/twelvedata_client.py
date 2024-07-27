import requests
from typing import TypedDict
import logging

class TwelvedataClientParams(TypedDict):
    """
    api_key: str
    logger: logging.Logger
    base_url: str
    """
    api_key: str
    logger: logging.Logger
    base_url: str

class GetTimeSeriesDataParms(TypedDict):
    """
    symbol: str
    start_date: str
    end_date: str
    interval: str
    """
    symbol: str
    start_date: str
    end_date: str
    interval: str

class TwelvedataClient:

    def __init__(self, params: TwelvedataClientParams):
        print(params)
        self.api_key = params['api_key']
        self.base_url = params['base_url']
        self.logger = params['logger']

    def get_time_series_data(self, params: GetTimeSeriesDataParms):
        symbol = params['symbol']
        start_date = params['start_date']
        end_date = params['end_date']
        interval = params['interval']
        url = f'{self.base_url}/time_series?symbol={symbol}&start_date={start_date}&end_date={end_date}&apikey={self.api_key}&interval={interval}'
        try:
            response = requests.get(url)
        except Exception as e:
            raise Exception(f'Error retrieving stock data for ({symbol}) from ({start_date}) to ({end_date}) with interval ({interval}): {e}')
        self.logger.info(f'Retrieved stock data for ({symbol}) from ({start_date}) to ({end_date}) with interval ({interval})')
        return response.json()
    
    def get_time_series_data_as_csv(self, params: GetTimeSeriesDataParms):
        symbol = params['symbol']
        start_date = params['start_date']
        end_date = params['end_date']
        interval = params['interval']
        url = f'{self.base_url}/time_series?symbol={symbol}&start_date={start_date}&end_date={end_date}&apikey={self.api_key}&interval={interval}&format=csv&delimiter=,'
        try:
            response = requests.get(url)
        except Exception as e:
            raise Exception(f'Error retrieving stock data for ({symbol}) from ({start_date}) to ({end_date}) with interval ({interval}) as CSV: {e}')
        self.logger.info(f'Retrieved stock data for ({symbol}) from ({start_date}) to ({end_date}) with interval ({interval}) as CSV')
        return response.text