// Grab CSRF token from cookies (a security token that Django uses to prevent CSRF attacks)
function getCookie(name) {
    // Start with no value
    let cookieValue = null;

    // Check for presence of cookies
    if (document.cookie && document.cookie !== '') {
        // cookies are stored as one string: "key=value; key2=value2"
        const cookies = document.cookie.split(';');

        // Loop through each key-value pair
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim(); // Remove whitespace
            
            // Does this cookie string begin with the name we want?
            if (cookie.startsWith(name + '=')) {
                // decode URL-encoded characters, just in case
                cookieValue = decodeURIComponent(
                    // Get the value after "name="
                    cookie.substring(name.length + 1)
                );  
                break;
            }
        }
    }
    return cookieValue; // Return the cookie value (or null if not found)
}
const csrftoken = getCookie('csrftoken');

let isUpdating = false;

async function updateTable() {
    if (isUpdating) return; // Prevent multiple simultaneous updates
    isUpdating = true;
    document.getElementById('updateBtn').disabled = true;
    try {
        const n = parseInt(document.getElementById('varCount').value);
        // Get expressions from inputs OR use default
        const expressionInputs = document.querySelectorAll('.expr-input');
        const expressions = expressionInputs.length > 0 
            // Ternary operator to map inputs to values
            ? Array.from(expressionInputs).map(input => input.value) : ['A AND B']; // Default expression
        
        console.log('Sending:', { n, expressions });
        
        const response = await fetch('/calculate/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken,
            },
            body: JSON.stringify({ n, expressions }),
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        console.log('Received:', data);
        renderTable(data, expressions);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        isUpdating = false;
    }
}
function renderTable(data, expressions) {
    const thead = document.querySelector('#truthTable thead');
    const tbody = document.querySelector('#truthTable tbody');

    // Build header row - WITHOUT onchange events during render
    thead.innerHTML = "<tr>" + data.header.map((h, i) => {
        if (i >= data.header.length - expressions.length) {
            return `<th><input type="text" value="${h}" data-col="${i}" class="expr-input"></th>`;
        }
        return `<th>${h}</th>`;
    }).join('') + "</tr>";

    // Build body rows
    tbody.innerHTML = data.rows.map(row => {
        return "<tr>" + row.map(cell => `<td>${cell}</td>`).join('') + "</tr>";
    }).join('');

    addExpressionInputListeners(); // Re-add listeners after rendering
    document.getElementById('updateBtn').disabled = false;
}

// This section is very important for performance, I made many errors and thanks to Deepseek I fixed them
// eg. not removing old listeners, causing multiple calls to updateTable
// or not debouncing, causing too many calls during typing
// More importantly I forgot to even create the initial table structure
// "Vibe coding" is not good for this kind of task because you learn nothing

function addExpressionInputListeners() {
    // Remove any existing listeners first
    const inputs = document.querySelectorAll('.expr-input');
    inputs.forEach(input => {
        // Remove existing event listeners by cloning the node
        input.oninput = null;

        // Add new listener with simple debouncing
        let timeout;
        input.addEventListener('input', function() {
            clearTimeout(timeout);
            timeout = setTimeout(updateTable, 500);
        });
    });
}

// Initial setup
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners
    document.querySelector('button').addEventListener('click', updateTable);
    document.getElementById('varCount').addEventListener('change', updateTable);
    
    // Create initial table structure
    const thead = document.querySelector('#truthTable thead');
    if (thead.innerHTML.trim() === '') {
        thead.innerHTML = 
            `<tr>
                <th>A</th>
                <th>B</th>
                <th><input type="text" value="A AND B" class="expr-input"></th>
            </tr>`;
    }
    
    // Add initial event listeners
    addExpressionInputListeners();
    
    // Initial table update
    updateTable();
});