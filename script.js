// ============================================================
//  CALCULATOR LOGIC
//  Read the comments — they explain WHY each part exists.
// ============================================================

// 1. Grab references to the HTML elements we need to read or change.
const previousOperandEl = document.getElementById('previous-operand');
const currentOperandEl = document.getElementById('current-operand');
const buttons = document.querySelectorAll('.btn');
const historyToggle = document.getElementById('history-toggle');
const historyChevron = document.getElementById('history-chevron');
const historyList = document.getElementById('history-list');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const calculatorEl = document.getElementById('calculator');
const flameOverlay = document.getElementById('flame-overlay');

// 2. These three variables ARE the calculator's "memory".
//    At any moment, the calculator only needs to remember:
let currentOperand = '0';   // what's currently being typed
let previousOperand = '';   // the first number (before an operator was pressed)
let operation = undefined;  // which operator was chosen (+, -, *, /)

// History is just a list of strings like "5 + 3 = 8",
// newest calculation first.
let history = [];

// 3. Update the screen to match whatever is in memory right now.
function updateDisplay() {
  currentOperandEl.textContent = currentOperand;

  if (operation != null) {
    previousOperandEl.textContent = `${previousOperand} ${operation}`;
  } else {
    previousOperandEl.textContent = '';
  }
}

// 4. Add a digit (or decimal point) to the number being typed.
function appendNumber(digit) {
  // Don't allow more than one decimal point in a number.
  if (digit === '.' && currentOperand.includes('.')) return;

  // If the screen is just "0", typing a digit should replace it,
  // not turn it into "01", "02", etc.
  if (currentOperand === '0' && digit !== '.') {
    currentOperand = digit;
  } else {
    currentOperand = currentOperand + digit;
  }
}

// 5. User picked an operator (+, −, ×, ÷).
function chooseOperation(selectedOperation) {
  // Ignore if there's nothing typed yet.
  if (currentOperand === '') return;

  // If an operation was already chosen before, calculate it first.
  // This lets you chain calculations like 5 + 3 + 2.
  if (previousOperand !== '') {
    calculate();
  }

  operation = selectedOperation;
  previousOperand = currentOperand;
  currentOperand = '';
}

// 6. Do the actual math.
function calculate() {
  let result;
  const prev = parseFloat(previousOperand);
  const current = parseFloat(currentOperand);

  // If either side is missing/invalid, there's nothing to calculate.
  if (isNaN(prev) || isNaN(current)) return;

  switch (operation) {
    case '+':
      result = prev + current;
      break;
    case '-':
      result = prev - current;
      break;
    case '*':
      result = prev * current;
      break;
    case '/':
      if (current === 0) {
        currentOperand = 'Error';
        previousOperand = '';
        operation = undefined;
        return;
      }
      result = prev / current;
      break;
    default:
      return;
  }

  // Round to avoid ugly floating point results like 0.1 + 0.2 = 0.30000000004
  // Reference: https://stackoverflow.com/questions/1458633/
  const roundedResult = parseFloat(result.toFixed(10)).toString();

  // Record this calculation in history BEFORE we clear the operands.
  addToHistory(`${prev} ${operation} ${current} = ${roundedResult}`);

  currentOperand = roundedResult;
  operation = undefined;
  previousOperand = '';
}

// 7. Reset everything back to the starting state.
function clearAll() {
  currentOperand = '0';
  previousOperand = '';
  operation = undefined;
}

// 7b. "Dragon fire" clear animation: play the flame sweep across the
//     screen, then actually clear the operands partway through the
//     sweep so the numbers vanish right as the flame passes over them.
function playClearAnimation() {
  // Restart the animation even if it's mid-play by removing then
  // re-adding the class on the next frame.
  flameOverlay.classList.remove('firing');

  requestAnimationFrame(() => {
    flameOverlay.classList.add('firing');
  });

  // Clear the numbers about 40% through the 0.55s sweep, so the
  // flame appears to "burn away" the digits as it passes.
  setTimeout(() => {
    clearAll();
    updateDisplay();
  }, 220);

  // Remove the class after the animation finishes so it's ready
  // to be re-triggered cleanly next time.
  setTimeout(() => {
    flameOverlay.classList.remove('firing');
  }, 600);
}

// 8. Remove the last typed character (like a backspace key).
function deleteLast() {
  if (currentOperand.length === 1) {
    currentOperand = '0';
  } else {
    currentOperand = currentOperand.slice(0, -1);
  }
}

// 9. History: add an entry and redraw the dropdown list.
function addToHistory(entryText) {
  history.unshift(entryText); // newest first

  // Keep history from growing forever — last 20 is plenty.
  if (history.length > 20) {
    history.pop();
  }

  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = '';

  if (history.length === 0) {
    const emptyItem = document.createElement('li');
    emptyItem.className = 'history-empty';
    emptyItem.textContent = 'No calculations yet';
    historyList.appendChild(emptyItem);
    return;
  }

  history.forEach(entry => {
    const item = document.createElement('li');
    item.textContent = entry;
    historyList.appendChild(item);
  });
}

// 10. Toggle the history dropdown open/closed.
historyToggle.addEventListener('click', () => {
  const isOpen = historyList.classList.toggle('open');
  historyToggle.setAttribute('aria-expanded', isOpen);
});

// 11. Fullscreen toggle for the calculator card itself.
fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    calculatorEl.requestFullscreen().catch(err => {
      console.log('Fullscreen request failed:', err);
    });
  } else {
    document.exitFullscreen();
  }
});

// 12. Listen for clicks on EVERY calculator button, then decide what to do
//     based on its data-action attribute (set in the HTML).
buttons.forEach(button => {
  button.addEventListener('click', () => {
    const action = button.dataset.action;
    const value = button.dataset.value;

    if (action === 'number' || action === 'decimal') {
      appendNumber(value);
    } else if (action === 'operator') {
      chooseOperation(value);
    } else if (action === 'equals') {
      calculate();
    } else if (action === 'clear') {
      playClearAnimation();
      return; // skip the updateDisplay() below; the animation handles it
    } else if (action === 'delete') {
      deleteLast();
    }

    updateDisplay();
  });
});

// 13. Let the keyboard work too, not just mouse clicks.
window.addEventListener('keydown', (e) => {
  if (e.key >= '0' && e.key <= '9') appendNumber(e.key);
  if (e.key === '.') appendNumber('.');
  if (e.key === '+' || e.key === '-') chooseOperation(e.key);
  if (e.key === '*' || e.key === '/') chooseOperation(e.key);
  if (e.key === 'Enter' || e.key === '=') calculate();
  if (e.key === 'Backspace') deleteLast();
  if (e.key === 'Escape') {
    playClearAnimation();
    return; // animation already handles updateDisplay()
  }

  updateDisplay();
});

// Draw the initial "0" on screen and empty history when the page first loads.
updateDisplay();
renderHistory();
