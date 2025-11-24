// DOM要素の取得
const etfSymbolInput = document.getElementById('etf-symbol');
const etfPriceInput = document.getElementById('etf-price');
const exchangeRateInput = document.getElementById('exchange-rate');
const prevNavActualInput = document.getElementById('prev-nav-actual');
const prevEtfPriceInput = document.getElementById('prev-etf-price');
const prevExchangeRateInput = document.getElementById('prev-exchange-rate');
const fetchEtfBtn = document.getElementById('fetch-etf-btn');
const fetchFxBtn = document.getElementById('fetch-fx-btn');
const calculateBtn = document.getElementById('calculate-btn');
const etfAutocomplete = document.getElementById('etf-autocomplete');
const fundSelect = document.getElementById('fund-select');
const fundYahooLinkContainer = document.getElementById('fund-yahoo-link-container');
const fundYahooLink = document.getElementById('fund-yahoo-link');

// 投資信託定義（外部JSONから読み込む）
let fundDefinitions = [];

// 主要なETFシンボルのリスト
const etfSymbols = [
    { symbol: 'VTI', name: 'Vanguard Total Stock Market' },
    { symbol: 'SPY', name: 'SPDR S&P 500' },
    { symbol: 'QQQ', name: 'Invesco QQQ Trust' },
    { symbol: 'VEA', name: 'Vanguard FTSE Developed Markets' },
    { symbol: 'VWO', name: 'Vanguard FTSE Emerging Markets' },
    { symbol: 'BND', name: 'Vanguard Total Bond Market' },
    { symbol: 'VXUS', name: 'Vanguard Total International Stock' },
    { symbol: 'VT', name: 'Vanguard Total World Stock' },
    { symbol: 'IVV', name: 'iShares Core S&P 500' },
    { symbol: 'IEFA', name: 'iShares Core MSCI EAFE' },
    { symbol: 'IEMG', name: 'iShares Core MSCI Emerging Markets' },
    { symbol: 'AGG', name: 'iShares Core U.S. Aggregate Bond' },
    { symbol: 'VOO', name: 'Vanguard S&P 500' },
    { symbol: 'VUG', name: 'Vanguard Growth ETF' },
    { symbol: 'VTV', name: 'Vanguard Value ETF' },
    { symbol: 'SCHB', name: 'Schwab U.S. Broad Market' },
    { symbol: 'SCHF', name: 'Schwab International Equity' },
    { symbol: 'SCHE', name: 'Schwab Emerging Markets Equity' },
    { symbol: 'SCHZ', name: 'Schwab U.S. Aggregate Bond' },
    { symbol: 'ITOT', name: 'iShares Core S&P Total U.S. Stock Market' },
    { symbol: 'IXUS', name: 'iShares Core MSCI Total International Stock' },
    { symbol: 'IUSB', name: 'iShares Core Total USD Bond Market' },
    // Index symbols used for domestic equity funds
    { symbol: '^N225', name: 'Nikkei 225 Index' }
];

// ETFシンボルの入力補完機能
function showAutocomplete(query) {
    if (!query || query.length === 0) {
        etfAutocomplete.style.display = 'none';
        return;
    }
    
    const queryUpper = query.toUpperCase();
    const matches = etfSymbols.filter(etf => 
        etf.symbol.toUpperCase().includes(queryUpper) || 
        etf.name.toUpperCase().includes(queryUpper)
    ).slice(0, 10); // 最大10件まで表示
    
    if (matches.length === 0) {
        etfAutocomplete.style.display = 'none';
        return;
    }
    
    etfAutocomplete.innerHTML = matches.map(etf => 
        `<button type="button" class="list-group-item list-group-item-action" data-symbol="${etf.symbol}">
            <strong>${etf.symbol}</strong> - ${etf.name}
        </button>`
    ).join('');
    
    etfAutocomplete.style.display = 'block';
    
    // クリックイベントを追加
    etfAutocomplete.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            etfSymbolInput.value = btn.dataset.symbol;
            etfAutocomplete.style.display = 'none';
            etfSymbolInput.focus();
        });
    });
}

// ETFシンボル入力時のイベント
etfSymbolInput.addEventListener('input', (e) => {
    showAutocomplete(e.target.value);
});

// フォーカスが外れたときに少し遅延して閉じる（クリックイベントが発火するように）
etfSymbolInput.addEventListener('blur', () => {
    setTimeout(() => {
        etfAutocomplete.style.display = 'none';
    }, 200);
});

// フォーカス時に再度表示
etfSymbolInput.addEventListener('focus', (e) => {
    if (e.target.value) {
        showAutocomplete(e.target.value);
    }
});

// 投資信託セレクトボックスを初期化（外部JSONから読み込み）
async function initFundSelect() {
    if (!fundSelect) return;

    try {
        // baseurlを考慮したパスを構築
        const baseUrl = window.BASE_URL || '';
        const fundsJsonPath = `${baseUrl}/assets/data/funds.json`;
        const response = await fetch(fundsJsonPath);
        if (!response.ok) {
            console.error('funds.json の読み込みに失敗しました:', response.status, response.statusText);
            return;
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
            console.error('funds.json の形式が不正です（配列ではありません）');
            return;
        }
        fundDefinitions = data;
    } catch (error) {
        console.error('funds.json の読み込みエラー:', error);
        return;
    }

    fundDefinitions.forEach(fund => {
        if (!fund.underlyingTicker) {
            console.warn('underlyingTicker未定義のファンドがあります:', fund);
            return;
        }
        const option = document.createElement('option');
        option.value = fund.id;
        option.textContent = `${fund.name}（${fund.category}）`;
        fundSelect.appendChild(option);
    });

    fundSelect.addEventListener('change', async () => {
        const selectedId = fundSelect.value;

        // 何も選択されていない場合はリンクなどをクリア
        if (!selectedId) {
            if (fundYahooLinkContainer) {
                fundYahooLinkContainer.style.display = 'none';
            }
            return;
        }

        const fund = fundDefinitions.find(f => f.id === selectedId);
        if (!fund || !fund.underlyingTicker) {
            console.warn('選択されたファンドに対応するunderlyingTickerがありません:', fund);
            if (fundYahooLinkContainer) {
                fundYahooLinkContainer.style.display = 'none';
            }
            return;
        }

        // Yahoo!ファイナンスへのリンクを更新
        if (fundYahooLink && fundYahooLinkContainer) {
            if (fund.yahooUrl) {
                fundYahooLink.href = fund.yahooUrl;
                fundYahooLink.textContent = `Yahoo!ファイナンスで「${fund.name}」を開く`;
                fundYahooLinkContainer.style.display = 'block';
            } else {
                fundYahooLinkContainer.style.display = 'none';
            }
        }

        // 対応するETFシンボルを自動入力
        etfSymbolInput.value = fund.underlyingTicker;

        // ETF価格と前営業日ETF価格を自動取得
        try {
            fetchEtfBtn.disabled = true;
            fetchEtfBtn.textContent = '取得中...';
            const priceData = await fetchETFPrice(fund.underlyingTicker, true);
            if (priceData !== null) {
                if (typeof priceData === 'object') {
                    etfPriceInput.value = priceData.current.toFixed(2);
                    if (priceData.previous !== null) {
                        prevEtfPriceInput.value = priceData.previous.toFixed(2);
                    }
                } else {
                    etfPriceInput.value = priceData.toFixed(2);
                }
            }
        } catch (e) {
            console.error('ファンド選択時のETF価格取得に失敗しました:', e);
        } finally {
            fetchEtfBtn.disabled = false;
            fetchEtfBtn.textContent = '価格を取得';
        }

        // 通貨がUSDかつ為替ヘッジなしの場合は為替レートも自動取得
        if (fund.currency === 'USD' && !fund.hedged) {
            // ETF価格取得後、為替レート取得前に遅延を入れる（レート制限を回避）
            await new Promise(resolve => setTimeout(resolve, 500));
            try {
                fetchFxBtn.disabled = true;
                fetchFxBtn.textContent = '取得中...';
                const rateData = await fetchExchangeRate(true);
                if (rateData !== null) {
                    if (typeof rateData === 'object') {
                        exchangeRateInput.value = rateData.current.toFixed(2);
                        if (rateData.previous !== null) {
                            prevExchangeRateInput.value = rateData.previous.toFixed(2);
                        }
                    } else {
                        exchangeRateInput.value = rateData.toFixed(2);
                    }
                }
            } catch (e) {
                console.error('ファンド選択時の為替レート取得に失敗しました:', e);
            } finally {
                fetchFxBtn.disabled = false;
                fetchFxBtn.textContent = '為替を取得';
            }
        } else {
            // 為替影響を考慮しないファンドの場合（JPY建てやヘッジありなど）は
            // 為替レートを1として扱う（実質的に為替影響ゼロ）
            exchangeRateInput.value = '1';
            prevExchangeRateInput.value = '1';
        }
    });
}

initFundSelect();

// 結果表示要素
const navValue = document.getElementById('nav-value');
const navChangeElement = document.getElementById('nav-change');
const navChangePercentElement = document.getElementById('nav-change-percent');
const etfImpact = document.getElementById('etf-impact');
const fxImpact = document.getElementById('fx-impact');
const fxCoefficient = document.getElementById('fx-coefficient');
const etfCoefficient = document.getElementById('etf-coefficient');

// 数値をフォーマットする関数
function formatNumber(num, decimals = 2) {
    if (num === null || num === undefined || isNaN(num)) return '-';
    return num.toLocaleString('ja-JP', { 
        minimumFractionDigits: decimals, 
        maximumFractionDigits: decimals 
    });
}

// 符号付き数値をフォーマットする関数
function formatSignedNumber(num, decimals = 2) {
    if (num === null || num === undefined || isNaN(num)) return '-';
    const sign = num >= 0 ? '+' : '';
    return sign + formatNumber(num, decimals);
}

// パーセンテージをフォーマットする関数
function formatPercent(num, decimals = 3) {
    if (num === null || num === undefined || isNaN(num)) return '-';
    const sign = num >= 0 ? '+' : '';
    return sign + num.toFixed(decimals) + '%';
}

// ユーザー入力値（カンマ付きなど）を数値に変換する関数
function parseInputNumber(value) {
    if (value === null || value === undefined) return NaN;
    // カンマ（,）と全角カンマ（，）を除去してから数値化
    const str = String(value).replace(/[,\uFF0C]/g, '').trim();
    if (str === '') return NaN;
    return parseFloat(str);
}

// ETF価格を取得（Yahoo Finance APIを使用）
// includePrevious: trueの場合、現在の価格と前営業日の価格の両方を返す
async function fetchETFPrice(symbol, includePrevious = false) {
    try {
        // 過去5日分のデータを取得（前営業日を含むため）
        const range = includePrevious ? '5d' : '1d';
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=${range}`;
        
        // CORSプロキシを使用
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        
        const response = await fetch(proxyUrl);
        const data = await response.json();
        const jsonData = JSON.parse(data.contents);
        
        if (jsonData.chart && jsonData.chart.result && jsonData.chart.result[0]) {
            const result = jsonData.chart.result[0];
            const meta = result.meta || {};
            let currentPrice = meta.regularMarketPrice;
            
            if (includePrevious && result.timestamp && result.indicators && result.indicators.quote) {
                // タイムスタンプと価格データを取得
                const timestamps = result.timestamp;
                const closes = result.indicators.quote[0].close;
                
                // 有効なデータポイントをフィルタリング（nullを除外）
                const validData = [];
                for (let i = 0; i < timestamps.length; i++) {
                    if (closes[i] !== null && closes[i] !== undefined) {
                        validData.push({
                            timestamp: timestamps[i],
                            price: closes[i]
                        });
                    }
                }
                
                // 現在の価格に最も近いデータポイントを除外し、その前のデータポイントを取得
                if (validData.length >= 2) {
                    // 最後から2番目のデータポイントが前営業日
                    const previousPrice = validData[validData.length - 2].price;

                    // currentPriceが未定義の場合は最後のクローズ値を使用
                    if (!Number.isFinite(currentPrice)) {
                        const lastValid = validData[validData.length - 1].price;
                        if (Number.isFinite(lastValid)) {
                            currentPrice = lastValid;
                        }
                    }

                    if (!Number.isFinite(currentPrice)) {
                        throw new Error('有効な現在価格が取得できませんでした');
                    }

                    return {
                        current: currentPrice,
                        previous: previousPrice
                    };
                }
            }

            // includePrevious=false か、前営業日データがなかった場合
            if (!Number.isFinite(currentPrice)) {
                // 指数などでregularMarketPriceが無い場合、最後のクローズ値を使用
                const closes = result.indicators?.quote?.[0]?.close || [];
                const validCloses = closes.filter(v => v !== null && v !== undefined);
                const lastClose = validCloses[validCloses.length - 1];
                if (Number.isFinite(lastClose)) {
                    currentPrice = lastClose;
                }
            }

            if (!Number.isFinite(currentPrice)) {
                throw new Error('有効な現在価格が取得できませんでした');
            }

            return includePrevious ? { current: currentPrice, previous: null } : currentPrice;
        }
        throw new Error('価格データが見つかりませんでした');
    } catch (error) {
        console.error('ETF価格の取得に失敗しました:', error);
        alert('ETF価格の自動取得に失敗しました。手動で入力してください。');
        return null;
    }
}

// 為替レートを取得
// includePrevious: trueの場合、現在のレートと前営業日のレートの両方を返す
async function fetchExchangeRate(includePrevious = false) {
    try {
        // 過去5日分のデータを取得（前営業日を含むため）
        const range = includePrevious ? '5d' : '1d';
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/USDJPY=X?interval=1d&range=${range}`;
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        
        const response = await fetch(proxyUrl);
        const data = await response.json();
        const jsonData = JSON.parse(data.contents);
        
        if (jsonData.chart && jsonData.chart.result && jsonData.chart.result[0]) {
            const result = jsonData.chart.result[0];
            const meta = result.meta;
            const currentRate = meta.regularMarketPrice;
            
            if (includePrevious && result.timestamp && result.indicators && result.indicators.quote) {
                // タイムスタンプと価格データを取得
                const timestamps = result.timestamp;
                const closes = result.indicators.quote[0].close;
                
                // 有効なデータポイントをフィルタリング（nullを除外）
                const validData = [];
                for (let i = 0; i < timestamps.length; i++) {
                    if (closes[i] !== null && closes[i] !== undefined) {
                        validData.push({
                            timestamp: timestamps[i],
                            price: closes[i]
                        });
                    }
                }
                
                // 現在のレートに最も近いデータポイントを除外し、その前のデータポイントを取得
                if (validData.length >= 2) {
                    // 最後から2番目のデータポイントが前営業日
                    const previousRate = validData[validData.length - 2].price;
                    return {
                        current: currentRate,
                        previous: previousRate
                    };
                }
            }
            
            return includePrevious ? { current: currentRate, previous: null } : currentRate;
        }
        throw new Error('為替レートが見つかりませんでした');
    } catch (error) {
        console.error('為替レートの取得に失敗しました:', error);
        alert('為替レートの自動取得に失敗しました。手動で入力してください。');
        return null;
    }
}

// ETF価格取得ボタンのイベント
fetchEtfBtn.addEventListener('click', async () => {
    const symbol = etfSymbolInput.value.trim().toUpperCase();
    if (!symbol) {
        alert('ETFシンボルを入力してください');
        return;
    }
    
    fetchEtfBtn.disabled = true;
    fetchEtfBtn.textContent = '取得中...';
    
    // 現在の価格と前営業日の価格の両方を取得
    const priceData = await fetchETFPrice(symbol, true);
    if (priceData !== null) {
        if (typeof priceData === 'object') {
            // オブジェクトの場合（現在と前営業日の両方）
            etfPriceInput.value = priceData.current.toFixed(2);
            if (priceData.previous !== null) {
                prevEtfPriceInput.value = priceData.previous.toFixed(2);
            }
        } else {
            // 数値の場合（現在のみ）
            etfPriceInput.value = priceData.toFixed(2);
        }
    }
    
    fetchEtfBtn.disabled = false;
    fetchEtfBtn.textContent = '価格を取得';
});

// 為替レート取得ボタンのイベント
fetchFxBtn.addEventListener('click', async () => {
    fetchFxBtn.disabled = true;
    fetchFxBtn.textContent = '取得中...';
    
    // 現在のレートと前営業日のレートの両方を取得
    const rateData = await fetchExchangeRate(true);
    if (rateData !== null) {
        if (typeof rateData === 'object') {
            // オブジェクトの場合（現在と前営業日の両方）
            exchangeRateInput.value = rateData.current.toFixed(2);
            if (rateData.previous !== null) {
                prevExchangeRateInput.value = rateData.previous.toFixed(2);
            }
        } else {
            // 数値の場合（現在のみ）
            exchangeRateInput.value = rateData.toFixed(2);
        }
    }
    
    fetchFxBtn.disabled = false;
    fetchFxBtn.textContent = '為替を取得';
});

// 基準価額を計算する関数
function calculateNAV() {
    // 入力値を取得
    const etfPrice = parseInputNumber(etfPriceInput.value);
    const exchangeRate = parseInputNumber(exchangeRateInput.value);
    const prevEtfPrice = parseInputNumber(prevEtfPriceInput.value);
    const prevExchangeRate = parseInputNumber(prevExchangeRateInput.value);
    const prevNavActual = prevNavActualInput ? parseInputNumber(prevNavActualInput.value) : NaN;
    
    // 入力値の検証
    if (isNaN(etfPrice) || isNaN(exchangeRate)) {
        alert('ETF価格と為替レートは必須です');
        return;
    }
    
    // 前営業日比の計算（ETFと為替から推計）
    let navChange = null;
    let navChangePercent = null;
    let etfImpactValue = null;
    let fxImpactValue = null;
    
    const hasPrevData = !isNaN(prevEtfPrice) &&
                        !isNaN(prevExchangeRate) &&
                        isFinite(prevEtfPrice) &&
                        isFinite(prevExchangeRate) &&
                        prevEtfPrice > 0 &&
                        prevExchangeRate > 0;
    
    if (hasPrevData) {
        // ETF変動分
        const etfPriceChange = etfPrice - prevEtfPrice;
        etfImpactValue = etfPriceChange * exchangeRate;
        
        // 為替変動分
        const exchangeRateChange = exchangeRate - prevExchangeRate;
        fxImpactValue = etfPrice * exchangeRateChange;
        
        // 基準価額変動（円）
        navChange = etfImpactValue + fxImpactValue;
    }
    
    // 予想基準価額の計算
    let predictedNav = null;
    if (!isNaN(prevNavActual) && prevNavActual > 0 && !isNaN(navChange)) {
        predictedNav = prevNavActual + navChange;
        navChangePercent = (navChange / prevNavActual) * 100;
    }
    
    // 影響係数の計算（ETF・為替の感応度）
    const fxCoefficientValue = etfPrice * 0.1;      // 為替10銭変動
    const etfCoefficientValue = 0.1 * exchangeRate; // ETF 0.1ドル変動
    
    // 結果を表示
    if (predictedNav !== null) {
        navValue.textContent = formatNumber(predictedNav) + '円';
    } else {
        // 前営業日実績NAVが未入力の場合は、ETF×為替からの近似値で表示
        const approxNav = etfPrice * exchangeRate;
        navValue.textContent = formatNumber(approxNav) + '円';
    }
    
    if (navChange !== null && navChangePercent !== null) {
        navChangeElement.textContent = formatSignedNumber(navChange) + '円';
        navChangeElement.className = 'value ' + (navChange >= 0 ? 'positive' : 'negative');
        
        navChangePercentElement.textContent = formatPercent(navChangePercent);
        navChangePercentElement.className = 'value ' + (navChangePercent >= 0 ? 'positive' : 'negative');
        
        etfImpact.textContent = formatSignedNumber(etfImpactValue) + '円';
        etfImpact.className = 'value ' + (etfImpactValue >= 0 ? 'positive' : 'negative');
        
        fxImpact.textContent = formatSignedNumber(fxImpactValue) + '円';
        fxImpact.className = 'value ' + (fxImpactValue >= 0 ? 'positive' : 'negative');
    } else {
        navChangeElement.textContent = '-';
        navChangePercentElement.textContent = '-';
        etfImpact.textContent = '-';
        fxImpact.textContent = '-';
    }
    
    fxCoefficient.textContent = formatNumber(fxCoefficientValue) + '円';
    etfCoefficient.textContent = formatNumber(etfCoefficientValue) + '円';
}

// 計算ボタンのイベント
calculateBtn.addEventListener('click', calculateNAV);

// Enterキーで計算
[etfPriceInput, exchangeRateInput, prevEtfPriceInput, prevExchangeRateInput].forEach(input => {
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            calculateNAV();
        }
    });
});

// ページ読み込み時に現在の価格と前営業日の価格を取得（オプション）
window.addEventListener('load', () => {
    // デフォルト値としてVTIとUSD/JPYを取得してみる
    // エラーが発生しても問題ないようにtry-catchで囲む
    setTimeout(async () => {
        try {
            const priceData = await fetchETFPrice('VTI', true);
            if (priceData !== null) {
                if (typeof priceData === 'object') {
                    etfPriceInput.value = priceData.current.toFixed(2);
                    if (priceData.previous !== null) {
                        prevEtfPriceInput.value = priceData.previous.toFixed(2);
                    }
                } else {
                    etfPriceInput.value = priceData.toFixed(2);
                }
            }
        } catch (e) {
            // エラーは無視
        }
        
        // ETF価格取得後、為替レート取得前に遅延を入れる（レート制限を回避）
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
            const rateData = await fetchExchangeRate(true);
            if (rateData !== null) {
                if (typeof rateData === 'object') {
                    exchangeRateInput.value = rateData.current.toFixed(2);
                    if (rateData.previous !== null) {
                        prevExchangeRateInput.value = rateData.previous.toFixed(2);
                    }
                } else {
                    exchangeRateInput.value = rateData.toFixed(2);
                }
            }
        } catch (e) {
            // エラーは無視
        }
    }, 500);
});

