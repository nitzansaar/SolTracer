// SolTrace - main.js
// Main client-side script for the SolTrace web interface

/**
 * Initialize the SolTrace web interface
 * - Set up network switching
 * - Configure form submission handling
 * - Initialize UI components
 */
document.addEventListener('DOMContentLoaded', () => {
  // Network configuration
  const networks = {
    mainnet: 'https://api.mainnet-beta.solana.com',
    testnet: 'https://api.testnet.solana.com',
    devnet: 'https://api.devnet.solana.com',
    local: 'http://localhost:8899'
  };
  
  // Track current network and RPC URL
  let currentNetwork = 'devnet';
  let currentRpcUrl = networks[currentNetwork];
  
  // Set up network switching buttons
  setupNetworkButtons();
  
  // Configure custom RPC input
  setupCustomRpcInput();
  
  // Set up transaction form submission
  setupTransactionForm();
  
  // Set up UI control buttons
  setupUiControls();
  
  // Load application version
  loadAppVersion();
  
  /**
   * Set up network selection buttons
   * Allows switching between different Solana networks (mainnet, testnet, devnet, localhost)
   */
  function setupNetworkButtons() {
    document.querySelectorAll('.network-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        // Remove active class from all buttons
        document.querySelectorAll('.network-btn').forEach(b => b.classList.remove('btn-primary'));
        
        // Add active class to clicked button
        btn.classList.add('btn-primary');
        
        // Update current network and RPC URL
        const networkId = btn.id.split('-')[0];
        currentNetwork = networkId;
        currentRpcUrl = networks[networkId];
        
        console.log(`Network changed to ${currentNetwork}: ${currentRpcUrl}`);
      });
    });
  }
  
  /**
   * Set up custom RPC URL input
   * Allows users to specify a custom RPC endpoint
   */
  function setupCustomRpcInput() {
    // Toggle custom RPC input visibility
    document.getElementById('show-custom-rpc').addEventListener('click', (e) => {
      e.preventDefault();
      const customRpcDiv = document.querySelector('.custom-rpc');
      customRpcDiv.style.display = customRpcDiv.style.display === 'none' ? 'flex' : 'none';
    });
    
    // Apply custom RPC URL when button is clicked
    document.getElementById('custom-rpc-btn').addEventListener('click', () => {
      const customRpcUrl = document.getElementById('custom-rpc-input').value.trim();
      if (customRpcUrl) {
        currentRpcUrl = customRpcUrl;
        // Deselect all network buttons when using custom RPC
        document.querySelectorAll('.network-btn').forEach(b => b.classList.remove('btn-primary'));
        console.log(`Using custom RPC: ${currentRpcUrl}`);
      }
    });
  }
  
  /**
   * Set up transaction form submission handling
   * Processes the user input and sends request to backend
   */
  function setupTransactionForm() {
    document.getElementById('tx-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Get transaction signature
      const signature = document.getElementById('signature').value.trim();
      if (!signature) {
        alert('Please enter a transaction signature');
        return;
      }
      
      // Show loading indicator
      document.getElementById('loading').style.display = 'block';
      document.getElementById('result-container').style.display = 'none';
      
      try {
        // Send request to backend API
        const response = await fetch('/api/debug/tx', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            signature,
            rpcUrl: currentRpcUrl
          })
        });
        
        // Parse response
        const result = await response.json();
        
        if (response.ok) {
          // Display result if successful
          displayResult(result, signature);
        } else {
          // Show error message
          alert(`Error: ${result.error || 'Failed to debug transaction'}`);
        }
      } catch (error) {
        console.error('Error:', error);
        alert(`Error: ${error.message || 'Failed to debug transaction'}`);
      } finally {
        // Hide loading indicator
        document.getElementById('loading').style.display = 'none';
      }
    });
  }
  
  /**
   * Set up UI control buttons
   * - Toggle view (simple/JSON)
   * - Copy JSON data
   */
  function setupUiControls() {
    // Toggle between simple and JSON views
    document.getElementById('toggle-view').addEventListener('click', () => {
      const simpleView = document.getElementById('overview-simple');
      const jsonView = document.getElementById('overview-json');
      
      if (simpleView.style.display === 'none') {
        simpleView.style.display = 'block';
        jsonView.style.display = 'none';
      } else {
        simpleView.style.display = 'none';
        jsonView.style.display = 'block';
      }
    });
    
    // Copy JSON data to clipboard
    document.getElementById('copy-json').addEventListener('click', () => {
      const jsonText = document.getElementById('tx-json').textContent;
      navigator.clipboard.writeText(jsonText).then(() => {
        alert('JSON copied to clipboard');
      });
    });
  }
  
  /**
   * Display transaction debug results
   * @param {Object} result - Transaction debug result from backend
   * @param {string} signature - Transaction signature
   */
  function displayResult(result, signature) {
    // Fill overview section
    document.getElementById('tx-signature').textContent = signature;
    document.getElementById('tx-status').textContent = result.success ? '✅ Success' : '❌ Failed';
    document.getElementById('tx-status').className = result.success ? 'text-success' : 'text-danger';
    document.getElementById('tx-slot').textContent = result.slot || 'N/A';
    document.getElementById('tx-blocktime').textContent = result.blockTime 
      ? new Date(result.blockTime * 1000).toLocaleString() 
      : 'N/A';
    document.getElementById('tx-instructions-count').textContent = result.instructions.length;
    
    // Fill JSON view
    document.getElementById('tx-json').textContent = JSON.stringify(result, null, 2);
    
    // Clear and rebuild instructions container
    const instructionsContainer = document.getElementById('instructions-container');
    instructionsContainer.innerHTML = '';
    
    // Create instruction cards for each instruction
    result.instructions.forEach((instruction, index) => {
      createInstructionCard(instruction, index, instructionsContainer);
    });
    
    // Show result container
    document.getElementById('result-container').style.display = 'block';
  }
  
  /**
   * Create instruction card element
   * @param {Object} instruction - Instruction data
   * @param {number} index - Instruction index
   * @param {HTMLElement} container - Container element to append to
   */
  function createInstructionCard(instruction, index, container) {
    const instructionCard = document.createElement('div');
    instructionCard.className = 'card mb-4 instruction-card';
    
    // Get program name and instruction name for display
    const programName = instruction.programName || instruction.programId;
    const instructionName = instruction.instructionName ? ` - ${instruction.instructionName}` : '';
    
    // Create card content
    instructionCard.innerHTML = `
      <div class="card-header">
        <h5 class="mb-0">Instruction ${index + 1}: ${programName}${instructionName}</h5>
      </div>
      <div class="card-body">
        <ul class="nav nav-tabs" id="instTab${index}" role="tablist">
          <li class="nav-item" role="presentation">
            <button class="nav-link active" id="logs-tab-${index}" data-bs-toggle="tab" data-bs-target="#logs-${index}" type="button">Logs</button>
          </li>
          <li class="nav-item" role="presentation">
            <button class="nav-link" id="accounts-tab-${index}" data-bs-toggle="tab" data-bs-target="#accounts-${index}" type="button">Accounts</button>
          </li>
          ${instruction.anchorArgs ? `
          <li class="nav-item" role="presentation">
            <button class="nav-link" id="args-tab-${index}" data-bs-toggle="tab" data-bs-target="#args-${index}" type="button">Arguments</button>
          </li>
          ` : ''}
        </ul>
        <div class="tab-content p-3">
          <div class="tab-pane fade show active" id="logs-${index}" role="tabpanel">
            <div class="logs-container">
              ${formatLogs(instruction.logs)}
            </div>
          </div>
          <div class="tab-pane fade" id="accounts-${index}" role="tabpanel">
            ${formatAccountDiffs(instruction.accountDiffs)}
          </div>
          ${instruction.anchorArgs ? `
          <div class="tab-pane fade" id="args-${index}" role="tabpanel">
            <pre>${JSON.stringify(instruction.anchorArgs, null, 2)}</pre>
          </div>
          ` : ''}
        </div>
      </div>
    `;
    
    // Add card to container
    container.appendChild(instructionCard);
  }
  
  /**
   * Format transaction logs for display
   * @param {string[]} logs - Array of log messages
   * @returns {string} Formatted HTML
   */
  function formatLogs(logs) {
    if (!logs || logs.length === 0) {
      return '<p>No logs available</p>';
    }
    
    return logs.map(log => {
      let className = 'log-line';
      
      // Apply styling based on log content
      if (log.includes('Program log:')) {
        className += ' log-success';
      } else if (log.includes('Program failed:') || log.includes('Error:')) {
        className += ' log-error';
      } else if (log.includes('Program ') && log.includes(' invoke')) {
        className += ' log-program';
      }
      
      return `<pre class="${className}">${escapeHtml(log)}</pre>`;
    }).join('');
  }
  
  /**
   * Format account diffs for display
   * @param {Array} accountDiffs - Array of account diff objects
   * @returns {string} Formatted HTML
   */
  function formatAccountDiffs(accountDiffs) {
    if (!accountDiffs || accountDiffs.length === 0) {
      return '<p>No account changes</p>';
    }
    
    return accountDiffs.map(diff => {
      const label = diff.before?.label ? ` (${diff.before.label})` : '';
      let content = `<div class="mb-3 account-diff">
        <div class="fw-bold">${diff.pubkey}${label}</div>`;
      
      // Display balance changes
      if (diff.changes.balance) {
        const [before, after] = diff.changes.balance;
        const change = after - before;
        const sign = change >= 0 ? '+' : '';
        content += `<div>Balance: ${before} → ${after} (${sign}${change} lamports)</div>`;
      }
      
      // Display data changes
      if (diff.changes.data) {
        content += `<div>Data: [changed]</div>`;
      }
      
      // Display owner changes
      if (diff.changes.owner) {
        const [before, after] = diff.changes.owner;
        content += `<div>Owner: ${before} → ${after}</div>`;
      }
      
      content += '</div>';
      return content;
    }).join('');
  }
  
  /**
   * Load application version from API
   */
  function loadAppVersion() {
    fetch('/api/info')
      .then(response => response.json())
      .then(data => {
        document.getElementById('version').textContent = data.version;
      })
      .catch(error => console.error('Error fetching version:', error));
  }
  
  /**
   * Escape HTML special characters
   * @param {string} unsafe - String with potential HTML characters
   * @returns {string} Escaped string
   */
  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}); 