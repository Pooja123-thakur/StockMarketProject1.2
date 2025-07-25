// Bookmark functionality
let bookmarks = JSON.parse(localStorage.getItem('stockBookmarks')) || [];
function toggleBookmarksList() {
    const bookmarksList = document.getElementById('bookmarks-list');
    bookmarksList.classList.toggle('show');
    if (bookmarksList.classList.contains('show')) {
        renderBookmarks();}}
function renderBookmarks() {
    const bookmarksList = document.getElementById('bookmarks-list');
    bookmarksList.innerHTML = '';
    if (bookmarks.length === 0) {
        bookmarksList.innerHTML = '<div class="no-bookmarks">No bookmarks yet</div>';
        return;}
    bookmarks.forEach((bookmark, index) => {
        const bookmarkItem = document.createElement('div');
        bookmarkItem.className = 'bookmark-item';
        bookmarkItem.innerHTML = `
            <span onclick="loadBookmarkedStock('${bookmark.ticker}')">${bookmark.name} (${bookmark.ticker})</span>
            <button class="delete-bookmark" onclick="deleteBookmark(${index}, event)">
                <i class="fas fa-trash-alt"></i>
            </button>
        `;
        bookmarksList.appendChild(bookmarkItem); });}

function loadBookmarkedStock(ticker) {
    document.getElementById('ticker-input').value = ticker;
    loadStockData();
    document.getElementById('bookmarks-list').classList.remove('show');}

function deleteBookmark(index, event) {
    event.stopPropagation(); // Prevent triggering the parent click event
    bookmarks.splice(index, 1);
    localStorage.setItem('stockBookmarks', JSON.stringify(bookmarks));
    renderBookmarks();}

function toggleBookmark() {
    const ticker = document.getElementById('ticker-input').value.trim();
    if (!ticker) return;
    
    const stockName = document.getElementById('stock-name').textContent;
    if (stockName === 'Stock Dashboard') {
        alert('Please search for a stock first');
        return;
    }
    
    // Check if already bookmarked
    const existingIndex = bookmarks.findIndex(b => b.ticker === ticker.toUpperCase());
    
    if (existingIndex >= 0) {
        // Remove bookmark
        bookmarks.splice(existingIndex, 1);
        document.getElementById('bookmark-btn')
        .innerHTML = '<i class="far fa-bookmark"></i> Bookmark';
    } else {
        // Add bookmark
        bookmarks.push({
            ticker: ticker.toUpperCase(),
            name: stockName
        });
document.getElementById('bookmark-btn')
.innerHTML = '<i class="fas fa-bookmark"></i> Bookmarked';
    }
    
    localStorage.setItem('stockBookmarks', JSON.stringify(bookmarks));
    renderBookmarks();
}




function loadStockData() {
    const ticker = document.getElementById('ticker-input').value || 'AAPL';

    fetch(`/api/data?ticker=${ticker}`)
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                alert("Error: " + data.error);
                return;
            }

            document.getElementById('revenue-growth').textContent = data.revenue_growth || 'N/A';
            document.getElementById('asset-growth').textContent = data.asset_growth || 'N/A';
            document.getElementById('growth-factor').textContent = data.growth_factor || '0';

// bookmark code
   const isBookmarked = bookmarks.some(b => b.ticker === ticker.toUpperCase());
            document.getElementById('bookmark-btn').innerHTML = isBookmarked 
                ? '<i class="fas fa-bookmark"></i> Bookmarked' 
                : '<i class="far fa-bookmark"></i> Bookmark';


            const tableBody = document.querySelector('#quarterly-table tbody');
            tableBody.innerHTML = '';
            if (data.quarterly_data && data.quarterly_data.length > 0) {
                data.quarterly_data.forEach(quarter => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${quarter.period || 'N/A'}</td>
                        <td>${quarter.revenue ? '$' + quarter.revenue.toLocaleString() : 'N/A'}</td>
                        <td>${quarter.expenses ? '$' + quarter.expenses.toLocaleString() : 'N/A'}</td>
                        <td>${quarter.assets ? '$' + quarter.assets.toLocaleString() : 'N/A'}</td>
                        <td>${quarter.liabilities ? '$' + quarter.liabilities.toLocaleString() : 'N/A'}</td>
                    `;
                    tableBody.appendChild(row);
                });
            } else {
                const row = document.createElement('tr');
                row.innerHTML = '<td colspan="5">No quarterly data available</td>';
                tableBody.appendChild(row);
            }

            document.getElementById('stock-name').textContent = data.stock_name;
            document.getElementById('current-price').textContent = data.current_price;
            document.getElementById('change').textContent = data.change;
            document.getElementById('change-percent').textContent = data.change_percentage;
            document.getElementById('volume').textContent = data.volume;
            document.getElementById('buy-signal').textContent = data.buy_signal ? 'Yes' : 'No';
            document.getElementById('confidence').textContent = data.confidence;
            document.getElementById('risk-level').textContent = data.risk_level;
            document.getElementById('recommendation').textContent = `Recommendation: ${data.buy_recommendation}`;

            document.getElementById('balance-sheet').textContent = JSON.stringify(data.balance_sheet, null, 2);
            document.getElementById('cash-flow').textContent = JSON.stringify(data.cash_flow, null, 2);
            document.getElementById('income-data').textContent = JSON.stringify(data.income_data, null, 2);

            new TradingView.widget({
                "width": "100%",
                "height": 400,
                "symbol": `NASDAQ:${data.stock_name}`,
                "interval": "D",
                "timezone": "Etc/UTC",
                "theme": "light",
                "style": "1",
                "locale": "en",
                "toolbar_bg": "#f1f3f6",
                "enable_publishing": false,
                "container_id": "tradingview_chart"
            });
        });}
// bookmark code
document.addEventListener('click', function(event) {
    const bookmarksList = document.getElementById('bookmarks-list');
    const bookmarksToggle = document.querySelector('.bookmarks-toggle');
    
    if (!event.target.closest('.bookmarks-dropdown') && bookmarksList.classList
    .contains('show')) {
        bookmarksList.classList.remove('show');
    }
});

// Initialize on load
window.onload = function() {
    loadStockData();
    renderBookmarks();
};
