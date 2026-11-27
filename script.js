// Global State Management
let currentMode = 'scientific'; // 'scientific', 'developer', 'converter'
let expression = '';
let memoryValue = 0;
let isDegreeMode = true; // true = DEG, false = RAD
let currentBase = 'DEC'; // 'HEX', 'DEC', 'OCT', 'BIN'
let calcHistory = [];

// Unit Converter Definitions
const unitData = {
    length: {
        units: ['Meters (m)', 'Kilometers (km)', 'Centimeters (cm)', 'Millimeters (mm)', 'Miles (mi)', 'Feet (ft)', 'Inches (in)'],
        rates: { 'Meters (m)': 1, 'Kilometers (km)': 0.001, 'Centimeters (cm)': 100, 'Millimeters (mm)': 1000, 'Miles (mi)': 0.000621371, 'Feet (ft)': 3.28084, 'Inches (in)': 39.3701 }
    },
    temperature: {
        units: ['Celsius (°C)', 'Fahrenheit (°F)', 'Kelvin (K)'],
        custom: true
    },
    speed: {
        units: ['Meters/sec (m/s)', 'Km/hour (km/h)', 'Miles/hour (mph)', 'Knots'],
        rates: { 'Meters/sec (m/s)': 1, 'Km/hour (km/h)': 3.6, 'Miles/hour (mph)': 2.23694, 'Knots': 1.94384 }
    },
    storage: {
        units: ['Bytes (B)', 'Kilobytes (KB)', 'Megabytes (MB)', 'Gigabytes (GB)', 'Terabytes (TB)'],
        rates: { 'Bytes (B)': 1, 'Kilobytes (KB)': 1/1024, 'Megabytes (MB)': 1/(1024**2), 'Gigabytes (GB)': 1/(1024**3), 'Terabytes (TB)': 1/(1024**4) }
    },
    mass: {
        units: ['Kilograms (kg)', 'Grams (g)', 'Pounds (lbs)', 'Ounces (oz)'],
        rates: { 'Kilograms (kg)': 1, 'Grams (g)': 1000, 'Pounds (lbs)': 2.20462, 'Ounces (oz)': 35.274 }
    }
};

// DOM Elements Initialization
const displayMain = document.getElementById('display-main');
const displayExpression = document.getElementById('display-expression');
const liveSyntaxStatus = document.getElementById('live-syntax-status');
const angleIndicator = document.getElementById('angle-mode-indicator');
const memoryIndicator = document.getElementById('memory-indicator');
const baseIndicator = document.getElementById('base-indicator');

// Mode Switching System
function switchMode(mode) {
    currentMode = mode;
    const tabs = ['scientific', 'developer', 'converter'];

    tabs.forEach(t => {
        const deskTab = document.getElementById(`tab-${t}`);
        const mobTab = document.getElementById(`tab-${t}-mb`);
        if(t === mode) {
            deskTab?.classList.add('bg-indigo-600', 'text-white', 'shadow');
            deskTab?.classList.remove('text-slate-400');
            mobTab?.classList.add('bg-indigo-600', 'text-white', 'shadow');
            mobTab?.classList.remove('text-slate-400');
        } else {
            deskTab?.classList.remove('bg-indigo-600', 'text-white', 'shadow');
            deskTab?.classList.add('text-slate-400');
            mobTab?.classList.remove('bg-indigo-600', 'text-white', 'shadow');
            mobTab?.classList.add('text-slate-400');
        }
    });

    // UI Elements Display Toggle
    const keypad = document.getElementById('keypad-calculator');
    const programmerPanel = document.getElementById('programmer-bits-panel');
    const unitPanel = document.getElementById('unit-converter-panel');
    const sciExtra = document.getElementById('sci-extra-row');
    const devExtra = document.getElementById('dev-extra-row');
    const hexLetters = document.getElementById('hex-letters-row');

    if (mode === 'converter') {
        keypad.classList.add('hidden');
        programmerPanel.classList.add('hidden');
        unitPanel.classList.remove('hidden');
        baseIndicator.classList.add('hidden');
        populateUnitDropdowns();
    } else {
        keypad.classList.remove('hidden');
        unitPanel.classList.add('hidden');

        if (mode === 'developer') {
            programmerPanel.classList.remove('hidden');
            sciExtra.classList.add('hidden');
            devExtra.classList.remove('hidden');
            hexLetters.classList.remove('hidden');
            baseIndicator.classList.remove('hidden');
            updateBaseDisplay();
        } else {
            programmerPanel.classList.add('hidden');
            sciExtra.classList.remove('hidden');
            devExtra.classList.add('hidden');
            hexLetters.classList.add('hidden');
            baseIndicator.classList.add('hidden');
        }
    }
}

// Expression & Symbol Appending
function appendSymbol(symbol) {
    expression += symbol;
    updateDisplay();
}

function appendFunction(fnName) {
    expression += fnName + '(';
    updateDisplay();
}

function clearAll() {
    expression = '';
    displayMain.value = '0';
    updateDisplay();
}

function deleteLast() {
    expression = expression.slice(0, -1);
    if (expression === '') displayMain.value = '0';
    updateDisplay();
}

function toggleSign() {
    if (expression !== '') {
        if (expression.startsWith('-')) {
            expression = expression.substring(1);
        } else {
            expression = '-' + expression;
        }
        updateDisplay();
    }
}

function toggleAngleMode() {
    isDegreeMode = !isDegreeMode;
    angleIndicator.innerText = isDegreeMode ? 'DEG' : 'RAD';
    updateDisplay();
}

// Real-time Expression Display & Live Syntax Verification
function updateDisplay() {
    displayExpression.innerText = expression;

    if (expression.trim() === '') {
        liveSyntaxStatus.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span><span class="text-[11px]">Ready</span>';
        return;
    }

    try {
        const evalVal = evalExpression(expression);
        if (!isNaN(evalVal) && isFinite(evalVal)) {
            displayMain.value = formatResult(evalVal);
            liveSyntaxStatus.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span><span class="text-[11px]">Valid</span>';
            if (currentMode === 'developer') updateBaseDisplay(Math.floor(evalVal));
        }
    } catch (err) {
        liveSyntaxStatus.innerHTML = '<span class="w-2 h-2 rounded-full bg-rose-500 inline-block"></span><span class="text-[11px]">Syntax Warning</span>';
    }
}

// Safe Expression Evaluation Engine
function evalExpression(expr) {
    let parsed = expr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π/g, 'Math.PI')
        .replace(/\be\b/g, 'Math.E')
        .replace(/sqrt\(/g, 'Math.sqrt(')
        .replace(/log\(/g, 'Math.log10(')
        .replace(/ln\(/g, 'Math.log(')
        .replace(/\^/g, '**');

    if (isDegreeMode) {
        parsed = parsed.replace(/sin\(([^)]+)\)/g, 'Math.sin(($1) * Math.PI / 180)');
        parsed = parsed.replace(/cos\(([^)]+)\)/g, 'Math.cos(($1) * Math.PI / 180)');
        parsed = parsed.replace(/tan\(([^)]+)\)/g, 'Math.tan(($1) * Math.PI / 180)');
    } else {
        parsed = parsed.replace(/sin\(/g, 'Math.sin(')
              .replace(/cos\(/g, 'Math.cos(')
              .replace(/tan\(/g, 'Math.tan(');
    }

    parsed = parsed.replace(/ AND /g, ' & ')
                  .replace(/ OR /g, ' | ')
                  .replace(/ XOR /g, ' ^ ')
                  .replace(/ NOT /g, ' ~ ');

    return new Function(`'use strict'; return (${parsed})`)();
}

function calculateResult() {
    if (!expression) return;
    try {
        const result = evalExpression(expression);
        if (isNaN(result) || !isFinite(result)) {
            displayMain.value = 'Error';
            return;
        }

        const formatted = formatResult(result);
        addHistoryItem(expression, formatted);

        expression = formatted.toString();
        displayMain.value = formatted;
        displayExpression.innerText = '';

        if (currentMode === 'developer') {
            updateBaseDisplay(Math.floor(result));
        }
    } catch (e) {
        displayMain.value = 'Error';
    }
}

function formatResult(val) {
    if (Number.isInteger(val)) return val.toString();
    return parseFloat(val.toFixed(8)).toString();
}

// Memory Functions (M+, M-, MR, MC, MS)
function handleMemory(action) {
    const currentNum = parseFloat(displayMain.value) || 0;
    switch(action) {
        case 'MC':
            memoryValue = 0;
            memoryIndicator.classList.add('hidden');
            showToast('Memory Cleared');
            break;
        case 'MR':
            expression += memoryValue.toString();
            updateDisplay();
            break;
        case 'M+':
            memoryValue += currentNum;
            memoryIndicator.classList.remove('hidden');
            showToast(`Memory: ${memoryValue}`);
            break;
        case 'M-':
            memoryValue -= currentNum;
            memoryIndicator.classList.remove('hidden');
            showToast(`Memory: ${memoryValue}`);
            break;
        case 'MS':
            memoryValue = currentNum;
            memoryIndicator.classList.remove('hidden');
            showToast(`Memory Stored: ${memoryValue}`);
            break;
    }
}

// Developer Base Conversion Logic
function setBase(base) {
    currentBase = base;
    baseIndicator.innerText = base;

    const hexKeys = document.querySelectorAll('.hex-alpha');
    if(base === 'BIN') {
        hexKeys.forEach(k => k.classList.add('opacity-30', 'pointer-events-none'));
    } else {
        hexKeys.forEach(k => k.classList.remove('opacity-30', 'pointer-events-none'));
    }
}

function updateBaseDisplay(intVal) {
    const val = intVal !== undefined ? intVal : (parseInt(displayMain.value) || 0);
    document.getElementById('hex-val').innerText = (val >>> 0).toString(16).toUpperCase();
    document.getElementById('dec-val').innerText = val.toString(10);
    document.getElementById('oct-val').innerText = (val >>> 0).toString(8);
    document.getElementById('bin-val').innerText = (val >>> 0).toString(2).padStart(16, '0').match(/.{1,4}/g).join(' ');
}

// Unit Converter Dynamic Handler
function populateUnitDropdowns() {
    const category = document.getElementById('unit-category').value;
    const fromSelect = document.getElementById('unit-from');
    const toSelect = document.getElementById('unit-to');
    const data = unitData[category];

    fromSelect.innerHTML = '';
    toSelect.innerHTML = '';

    data.units.forEach((unit) => {
        fromSelect.innerHTML += `<option value="${unit}">${unit}</option>`;
        toSelect.innerHTML += `<option value="${unit}">${unit}</option>`;
    });

    if (data.units.length > 1) toSelect.selectedIndex = 1;
    convertUnits();
}

function convertUnits() {
    const category = document.getElementById('unit-category').value;
    const val = parseFloat(document.getElementById('unit-input-val').value) || 0;
    const fromUnit = document.getElementById('unit-from').value;
    const toUnit = document.getElementById('unit-to').value;
    const outElem = document.getElementById('unit-output-val');
    const formulaElem = document.getElementById('converter-formula');

    let result = 0;

    if (category === 'temperature') {
        result = convertTemperature(val, fromUnit, toUnit);
        formulaElem.innerText = `Converted directly via Temperature Formulas (${fromUnit} -> ${toUnit})`;
    } else {
        const rates = unitData[category].rates;
        const baseMeters = val / rates[fromUnit];
        result = baseMeters * rates[toUnit];
        formulaElem.innerText = `1 ${fromUnit} = ${(rates[toUnit] / rates[fromUnit]).toFixed(4)} ${toUnit}`;
    }

    outElem.innerText = parseFloat(result.toFixed(6)).toString();
}

function convertTemperature(val, from, to) {
    if (from === to) return val;
    let celsius = val;
    if (from === 'Fahrenheit (°F)') celsius = (val - 32) * 5/9;
    if (from === 'Kelvin (K)') celsius = val - 273.15;

    if (to === 'Celsius (°C)') return celsius;
    if (to === 'Fahrenheit (°F)') return (celsius * 9/5) + 32;
    if (to === 'Kelvin (K)') return celsius + 273.15;
    return celsius;
}

// History Drawer Logic
function addHistoryItem(expr, res) {
    calcHistory.unshift({ expr, res });
    renderHistory();
    document.getElementById('history-badge').classList.remove('hidden');
}

function renderHistory() {
    const list = document.getElementById('history-list');
    if (calcHistory.length === 0) {
        list.innerHTML = '<div class="text-center text-slate-500 text-xs py-8">No calculation history yet.</div>';
        return;
    }

    list.innerHTML = calcHistory.map((item, idx) => `
        <div onclick="recallHistory(${idx})" class="p-3 bg-slate-900/80 hover:bg-slate-800 rounded-xl border border-slate-800/80 cursor-pointer transition group">
            <div class="text-xs text-slate-400 font-mono truncate group-hover:text-indigo-300">${item.expr}</div>
            <div class="text-sm font-bold text-white font-mono mt-0.5 text-right">= ${item.res}</div>
        </div>
    `).join('');
}

function recallHistory(idx) {
    const item = calcHistory[idx];
    expression = item.res;
    displayMain.value = item.res;
    displayExpression.innerText = '';
    toggleHistoryDrawer();
}

function clearHistory() {
    calcHistory = [];
    renderHistory();
    document.getElementById('history-badge').classList.add('hidden');
}

function toggleHistoryDrawer() {
    const drawer = document.getElementById('history-drawer');
    drawer.classList.toggle('translate-x-full');
}

function toggleHelpModal() {
    const modal = document.getElementById('help-modal');
    modal.classList.toggle('hidden');
}

function copyToClipboard() {
    const textToCopy = displayMain.value;
    if(!textToCopy) return;

    const tempInput = document.createElement('input');
    tempInput.value = textToCopy;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);

    showToast('Result copied to clipboard!');
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-message').innerText = msg;
    toast.classList.remove('opacity-0');
    toast.classList.add('opacity-100');
    setTimeout(() => {
        toast.classList.remove('opacity-100');
        toast.classList.add('opacity-0');
    }, 2000);
}

// Keyboard Navigation Listener
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

    if (e.key >= '0' && e.key <= '9') appendSymbol(e.key);
    else if (e.key === '.') appendSymbol('.');
    else if (e.key === '+') appendSymbol('+');
    else if (e.key === '-') appendSymbol('-');
    else if (e.key === '*') appendSymbol('*');
    else if (e.key === '/') appendSymbol('/');
    else if (e.key === '(') appendSymbol('(');
    else if (e.key === ')') appendSymbol(')');
    else if (e.key === '^') appendSymbol('^');
    else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        calculateResult();
    } else if (e.key === 'Backspace') {
        e.preventDefault();
        deleteLast();
    } else if (e.key === 'Escape') {
        clearAll();
    } else if (e.ctrlKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        toggleHistoryDrawer();
    }
});

window.onload = () => {
    switchMode('scientific');
};
