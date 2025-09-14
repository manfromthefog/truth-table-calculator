from django.shortcuts import render
from django.http import JsonResponse
from . import truthtables
import json

# Create your views here.
def index(request):
    return render(request, 'truthcalculator/index.html')

def calculate(request):
    # POST is the request method to update data
    if (request.method == 'POST'):
        try:
            # Parse JSON data
            data = json.loads(request.body)
            # Get the number of variables and expressions, 2 and [] are the defaults
            n = data.get('n', 2)
            expressions = data.get('expressions', [])

            # Compute the truth table and get the results.
            vars, combinations, results = truthtables.compute_truth(n, expressions)
            
            # Prepare the rows for the JSON response
            rows = []
            # We're assigning a value to each combination of variables (enumerate)
            for i, combo in enumerate(combinations):
                # Convert each boolean to int (0 or 1)
                row = list(map(int, combo))
                # Append the results of each expression for this combination
                for col in results:
                    row.append(int(col[i]))
                # Append the row to the rows list for the full truth table
                rows.append(row)

            # Split response into headers and rows
            return JsonResponse({
                'header' : vars + expressions,
                'rows' : rows,
            })
        
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    # If not a POST request, return an error
    return JsonResponse({'error': 'Invalid request'}, status=400)