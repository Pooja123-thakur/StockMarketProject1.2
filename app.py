from flask import Flask, render_template, jsonify, request
import requests

app = Flask(__name__)
API_KEY = 'CR217__olohp7Kc0qabokhzhK8pnqr7S'


def fetch_stock_data(ticker):
    base_url = 'https://api.polygon.io/v2'
    result = {}

    try:
        # Aggregates
        agg_url = f'{base_url}/aggs/ticker/{ticker}/prev?adjusted=true&apiKey={API_KEY}'
        agg_data = requests.get(agg_url).json()['results'][0]

        result['stock_name'] = ticker
        result['current_price'] = agg_data['c']
        result['change'] = round(agg_data['c'] - agg_data['o'], 2)
        result['change_percentage'] = round((agg_data['c'] - agg_data['o']) / agg_data['o'] * 100, 2)
        result['volume'] = agg_data['v']

        # Financials - Quarterly
        financials_url = f"https://api.polygon.io/vX/reference/financials?ticker={ticker}&timeframe=quarterly&limit=4&apiKey={API_KEY}"
        financial_response = requests.get(financials_url).json()
        financial_results = financial_response.get("results", [])

        quarterly_data = []
        revenue_growth = None
        asset_growth = None

        for i, quarter in enumerate(financial_results):
            financials = quarter.get("financials", {})
            income = financials.get("income_statement", {})
            balance = financials.get("balance_sheet", {})
            cash_flow = financials.get("cash_flow_statement", {})

            revenue = income.get('revenues', {}).get('value') if isinstance(income.get('revenues'), dict) else income.get('revenues')
            expenses = income.get('operating_expenses', {}).get('value') if isinstance(income.get('operating_expenses'), dict) else income.get('operating_expenses')
            assets = balance.get('assets', {}).get('value') if isinstance(balance.get('assets'), dict) else balance.get('assets')
            liabilities = balance.get('liabilities', {}).get('value') if isinstance(balance.get('liabilities'), dict) else balance.get('liabilities')

            period = (
                quarter.get('filing_date') or 
                quarter.get('report_period') or 
                quarter.get('period') or 
                f"Q{quarter.get('fiscal_period', '')} {quarter.get('fiscal_year', '')}"
            )

            quarter_data = {
                'period': period,
                'revenue': revenue,
                'expenses': expenses,
                'assets': assets,
                'liabilities': liabilities,
            }
            quarterly_data.append(quarter_data)

            # Add detailed financials from the latest quarter (only first one)
            if i == 0:
                result['income_data'] = income
                result['balance_sheet'] = balance
                result['cash_flow'] = cash_flow

            # Growth calculations
            if i > 0 and all(isinstance(val, (int, float)) for val in [
                quarterly_data[i-1].get('revenue'),
                quarter_data.get('revenue'),
                quarterly_data[i-1].get('assets'),
                quarter_data.get('assets')
            ]):
                if quarterly_data[i-1]['revenue'] and quarter_data['revenue']:
                    revenue_growth = (quarter_data['revenue'] - quarterly_data[i-1]['revenue']) / quarterly_data[i-1]['revenue'] * 100
                if quarterly_data[i-1]['assets'] and quarter_data['assets']:
                    asset_growth = (quarter_data['assets'] - quarterly_data[i-1]['assets']) / quarterly_data[i-1]['assets'] * 100

        result['quarterly_data'] = quarterly_data
        result['revenue_growth'] = round(revenue_growth, 2) if revenue_growth is not None else None
        result['asset_growth'] = round(asset_growth, 2) if asset_growth is not None else None

        # Buy signal logic
        growth_factor = 0
        if revenue_growth is not None:
            growth_factor += min(5, max(0, revenue_growth / 10))
        if asset_growth is not None:
            growth_factor += min(5, max(0, asset_growth / 10))

        result['buy_signal'] = result['change_percentage'] > 1 or growth_factor >= 5
        result['buy_recommendation'] = 'Buy' if result['buy_signal'] else 'Hold'
        result['confidence'] = "High" if growth_factor >= 5 else "Moderate"
        result['risk_level'] = "Low" if growth_factor >= 5 else "Medium"
        result['growth_factor'] = round(growth_factor, 1) if growth_factor is not None else 0

    except Exception as e:
        result = {"error": str(e)}

    return result


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/api/data')
def get_data():
    ticker = request.args.get('ticker', 'AAPL').upper()
    data = fetch_stock_data(ticker)
    return jsonify(data)


if __name__ == "__main__":
    app.run(debug=True)
